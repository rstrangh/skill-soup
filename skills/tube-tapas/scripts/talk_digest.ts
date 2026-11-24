#!/usr/bin/env node
// Turn a recorded talk into one portable folder: slide images plus a page that shows each
// slide next to the part of the transcript spoken while it was on screen.
//
//   talk_digest.ts run <url> [--language xx] [--out DIR]   download, detect slides, transcribe, build
//   talk_digest.ts transcript <folder> <file.srt>          attach a transcript made by another tool
//   talk_digest.ts build <folder> [--drop 3,7]             rebuild the page, optionally dropping slides
//   talk_digest.ts sheets <folder>                         write contact sheets for a visual review
//   talk_digest.ts --self-test
//
// Needs the CLIs yt-dlp, ffmpeg and ffprobe. Transcribes with mw (MacWhisper) when it is on
// PATH. Without mw, `run` leaves audio.wav in the folder for another transcription tool.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn, spawnSync, type ChildProcess } from "node:child_process";
import { parseArgs } from "node:util";

const CONFIG = path.join(os.homedir(), ".config", "tube-tapas", "config.md");
const SKILL = path.dirname(import.meta.dirname);
const TEMPLATE = path.join(SKILL, "assets", "template.html");
const FPS = 1;          // analysis samples per second
const W = 128, H = 72;  // analysis resolution
const PIX = 24;         // grey-level step (0-255) that counts as a changed pixel
const BUSY = 0.15;      // a pixel that changes in a larger share of seconds is live video (speaker inset)
const STEP = 0.03;      // share of static pixels that must change for a new slide
const MIN_GAP = 2.0;    // seconds; a shorter segment is a transition or an animation step
const SHEET = [6, 4];   // contact sheet grid: columns, rows
const BIG = 1 << 30;    // spawnSync output limit: a long talk samples to tens of MB
const EXTERNAL = '<svg class="icon"><use href="#i-external-link"/></svg>';

type Segment = { start: number; end?: number; text: string };
type Slide = { start: number; end: number; image?: string };
type Talk = {
  title: string; url?: string; uploader?: string | null; date?: string; duration?: number;
  slides: Slide[]; segments: Segment[]; language?: string | null;
};

class Fail extends Error {}

// ---------- pure logic (covered by --self-test) ----------

function parseSrt(text: string): Segment[] {
  const ts = String.raw`(\d+):(\d+):(\d+)[,.](\d+)`;
  const re = new RegExp(`^${ts}\\s*-->\\s*${ts}`);
  const out: Segment[] = [];
  for (const block of text.trim().split(/\n\s*\n/)) {
    const lines = block.trim().split(/\r?\n/);
    for (let i = 0; i < lines.length; i++) {
      const m = lines[i].trim().match(re);
      if (!m) continue;
      const g = m.slice(1).map(Number);
      const body = lines.slice(i + 1).map((l) => l.trim()).filter(Boolean).join(" ");
      if (body) out.push({ start: g[0] * 3600 + g[1] * 60 + g[2] + g[3] / 1000, end: g[4] * 3600 + g[5] * 60 + g[6] + g[7] / 1000, text: body });
      break;
    }
  }
  return out;
}

// Share of the pixels in idx that changed between two grey frames.
function flipped(a: Uint8Array, b: Uint8Array, idx: number[]): number {
  let n = 0;
  for (const i of idx) if (Math.abs(a[i] - b[i]) > PIX) n++;
  return n / Math.max(idx.length, 1);
}

// Indices of pixels that rarely change. Slides are static, a speaker inset is not, so a
// slide change in a framed layout stays visible once the inset is ignored.
function staticPixels(frames: Uint8Array[]): number[] {
  const counts = new Array<number>(frames[0].length).fill(0);
  for (let f = 1; f < frames.length; f++) {
    for (let i = 0; i < counts.length; i++) if (Math.abs(frames[f - 1][i] - frames[f][i]) > PIX) counts[i]++;
  }
  const idx = counts.flatMap((c, i) => (c <= BUSY * (frames.length - 1) ? [i] : []));
  return idx.length >= 0.1 * counts.length ? idx : counts.map((_, i) => i);
}

// Seconds where the static part of the picture jumps and then settles. A jump followed by
// another jump is camera footage, not a slide change.
function changes(frames: Uint8Array[], idx: number[]): number[] {
  const s = frames.slice(1).map((b, k) => flipped(frames[k], b, idx));
  return s.flatMap((v, k) => (v > STEP && (k + 1 === s.length || s[k + 1] <= STEP) ? [(k + 1) / FPS] : []));
}

const lastFrame = (s: Slide, frames: Uint8Array[]) =>
  frames[Math.min(frames.length - 1, Math.max(0, Math.trunc(s.end * FPS) - 1))];

// Merge neighbouring slides that look the same, e.g. after a cut away and back.
function dedupe(slides: Slide[], frames: Uint8Array[], idx: number[]): Slide[] {
  let i = 0;
  while (i < slides.length - 1) {
    if (flipped(lastFrame(slides[i], frames), lastFrame(slides[i + 1], frames), idx) <= STEP) slides = mergeIntoNext(slides, i);
    else i++;
  }
  return slides;
}

// Merge slides whose picture is one flat colour (fade to black, empty stage screen).
function dropBlank(slides: Slide[], frames: Uint8Array[]): Slide[] {
  let i = 0;
  while (i < slides.length && slides.length > 1) {
    const f = lastFrame(slides[i], frames);
    if (Math.max(...f) - Math.min(...f) < 16) slides = mergeIntoNext(slides, i);
    else i++;
  }
  return slides;
}

// Picture-change timestamps -> contiguous slides covering the whole talk.
function makeSlides(times: number[], duration: number): Slide[] {
  const starts = [0];
  for (const t of [...times].sort((a, b) => a - b)) {
    if (t - starts.at(-1)! >= MIN_GAP && duration - t >= MIN_GAP) starts.push(t);
  }
  return starts.map((start, i) => ({ start, end: starts[i + 1] ?? duration }));
}

// Slide i disappears; the next slide takes over its time span (its image is the later,
// usually more complete build). The last slide merges into the previous one instead.
function mergeIntoNext(slides: Slide[], i: number): Slide[] {
  const out = slides.map((s) => ({ ...s }));
  if (out.length === 1) return out;
  if (i < out.length - 1) out[i + 1].start = out[i].start;
  else out[i - 1].end = out[i].end;
  out.splice(i, 1);
  return out;
}

// Remove 1-based slide numbers; their time goes to the neighbour.
function drop(slides: Slide[], numbers: number[]): Slide[] {
  for (const n of [...new Set(numbers)].sort((a, b) => b - a)) {
    if (n >= 1 && n <= slides.length) slides = mergeIntoNext(slides, n - 1);
  }
  return slides;
}

// Attach each transcript segment to the slide on screen at the segment's start.
function assign(slides: Slide[], segments: Segment[]): Segment[][] {
  const buckets: Segment[][] = slides.map(() => []);
  let j = 0;
  for (const seg of [...segments].sort((a, b) => a.start - b.start)) {
    while (j < slides.length - 1 && seg.start >= slides[j].end) j++;
    buckets[j].push(seg);
  }
  return buckets;
}

// Join segments into paragraphs; break after a sentence once a paragraph is long.
function paragraphs(segs: Segment[]): string[] {
  const paras: string[] = [];
  let cur = "";
  for (const s of segs) {
    cur = `${cur} ${s.text}`.trim();
    if (cur.length >= 400 && ".?!".includes(cur.at(-1)!)) {
      paras.push(cur);
      cur = "";
    }
  }
  if (cur) paras.push(cur);
  return paras;
}

// Only web links reach yt-dlp: a value starting with - would be read as an option.
function checkUrl(url: string): string {
  if (!/^https?:\/\/[^\s]+$/.test(url)) throw new Fail(`not a web link: ${url}`);
  return url;
}

function slugify(s: string): string {
  const ascii = s.normalize("NFKD").replace(/[^\x00-\x7f]/g, "");
  return ascii.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "").slice(0, 80) || "talk";
}

function clock(t: number): string {
  t = Math.trunc(t);
  const p = (n: number) => String(n).padStart(2, "0");
  return t >= 3600 ? `${Math.trunc(t / 3600)}:${p(Math.trunc((t % 3600) / 60))}:${p(t % 60)}` : `${Math.trunc(t / 60)}:${p(t % 60)}`;
}

const at = (url: string, t: number) => (url ? `${url}${url.includes("?") ? "&" : "?"}t=${Math.trunc(t)}s` : "");

const esc = (s: string) =>
  s.replaceAll("&", "&amp;").replaceAll("<", "&lt;").replaceAll(">", "&gt;").replaceAll('"', "&quot;").replaceAll("'", "&#x27;");

// $name is a placeholder, $$ is a literal dollar sign.
function fill(template: string, values: Record<string, string>): string {
  return template.replace(/\$(\$|\w+)/g, (_, k: string) => {
    if (k === "$") return "$";
    if (!(k in values)) throw new Fail(`template placeholder without value: $${k}`);
    return values[k];
  });
}

// ---------- tools ----------

function has(cmd: string): boolean {
  return (process.env.PATH ?? "").split(":").some((dir) => {
    try {
      const p = path.join(dir || ".", cmd);
      fs.accessSync(p, fs.constants.X_OK);
      return fs.statSync(p).isFile();
    } catch {
      return false;
    }
  });
}

function need(...tools: string[]): void {
  const missing = tools.filter((t) => !has(t));
  if (missing.length) throw new Fail(`missing tool(s): ${missing.join(", ")}`);
}

function sh(cmd: string[]): Buffer {
  const p = spawnSync(cmd[0], cmd.slice(1), { maxBuffer: BIG });
  if (p.status !== 0) throw new Fail(`failed: ${cmd.slice(0, 3).join(" ")} …\n${String(p.stderr ?? p.error).slice(-2000)}`);
  return p.stdout;
}

function outputRoot(override?: string): string {
  const home = (p: string) => p.replace(/^~(?=\/|$)/, os.homedir());
  if (override) return home(override);
  if (fs.existsSync(CONFIG)) {
    for (const line of fs.readFileSync(CONFIG, "utf8").split("\n")) {
      const m = line.match(/^\s*[-*]?\s*output_root\s*:\s*(.+)/);
      if (m) return home(m[1].trim().replace(/^[`"']+|[`"']+$/g, ""));
    }
  }
  return process.cwd();
}

function sample(video: string): Uint8Array[] {
  const raw = sh(["ffmpeg", "-hide_banner", "-loglevel", "error", "-hwaccel", "auto", "-i", video, "-an",
    "-vf", `fps=${FPS},scale=${W}:${H},format=gray`, "-f", "rawvideo", "-"]);
  const n = W * H;
  const frames: Uint8Array[] = [];
  for (let i = 0; i + n <= raw.length; i += n) frames.push(raw.subarray(i, i + n));
  return frames;
}

// Prefer the frame just before the next change: it shows the fully built slide. ffmpeg exits
// 0 without writing when a seek lands past the last frame, so check the file.
function grab(video: string, slide: Slide, dest: string): void {
  const { start: s, end: e } = slide;
  for (const t of [Math.max(s, e - 0.5), (s + e) / 2, s]) {
    sh(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-ss", t.toFixed(2), "-i", video,
      "-frames:v", "1", "-vf", "format=yuvj420p", "-q:v", "3", dest]);
    if (fs.existsSync(dest)) return;
  }
  throw new Fail(`no frame for ${path.basename(dest)} between ${s.toFixed(1)}s and ${e.toFixed(1)}s`);
}

// ---------- output ----------

// talk.json names files that build deletes and sheets feeds to ffmpeg: accept only names this script writes.
function readTalk(folder: string): Talk {
  const data: Talk = JSON.parse(fs.readFileSync(path.join(folder, "talk.json"), "utf8"));
  for (const s of data.slides)
    if (!/^slide-\d{3}\.jpg$/.test(s.image ?? "")) throw new Error(`talk.json: unexpected image name ${JSON.stringify(s.image)}`);
  return data;
}
const writeTalk = (folder: string, data: Talk) =>
  fs.writeFileSync(path.join(folder, "talk.json"), JSON.stringify(data, null, 1));

function build(folder: string, drops: number[] = []): void {
  const data = readTalk(folder);
  if (drops.length) {
    const keep = drop(data.slides, drops);
    const kept = new Set(keep.map((s) => s.image));
    for (const s of data.slides) if (!kept.has(s.image)) fs.rmSync(path.join(folder, "assets", s.image!), { force: true });
    data.slides = keep;
    writeTalk(folder, data);
  }
  const slides = data.slides, url = data.url ?? "";
  const buckets = assign(slides, data.segments);
  const meta = [data.uploader, data.date, clock(data.duration ?? 0), `${slides.length} slides`].filter(Boolean).join(" · ");
  const rows: string[] = [];
  const md = [`# ${data.title}\n`, `${meta}  \n${url}\n`];
  slides.forEach((s, k) => {
    const n = k + 1, img = esc(s.image!);
    const paras = paragraphs(buckets[k]);
    const text = paras.map((p) => `<p>${esc(p)}</p>`).join("") || '<p class="empty">—</p>';
    const stamp = `#${n} · ${clock(s.start)}–${clock(s.end)}`;
    const link = url ? `<a href="${esc(at(url, s.start))}">${stamp}${EXTERNAL}</a>` : stamp;
    rows.push(`<section id="s${n}"><figure><div class="stick"><a href="assets/${img}">` +
      `<img loading="lazy" src="assets/${img}" alt="Slide ${n}"></a>` +
      `<figcaption>${link}</figcaption></div></figure><div class="text">${text}</div></section>`);
    md.push(`\n## #${n} · ${clock(s.start)}\n\n![Slide ${n}](assets/${s.image})\n\n${paras.join("\n\n")}\n`);
  });
  const src = url ? ` · <a href="${esc(url)}">source${EXTERNAL}</a>` : "";
  const page = fill(fs.readFileSync(TEMPLATE, "utf8"), {
    lang: data.language ? ` lang="${esc(data.language)}"` : "", title: esc(data.title),
    meta: esc(meta) + src, rows: rows.join(""),
  });
  fs.writeFileSync(path.join(folder, "talk.html"), page);
  fs.writeFileSync(path.join(folder, "talk.md"), md.join(""));
  const empty = buckets.filter((b) => !b.length).length;
  console.log(`built ${path.join(folder, "talk.html")}: ${slides.length} slides, ${empty} without transcript`);
}

function transcript(folder: string, srt: string): void {
  const segments = parseSrt(fs.readFileSync(srt, "utf8"));
  if (!segments.length) throw new Fail(`no SRT segments in ${srt}`);
  const data = readTalk(folder);
  data.segments = segments;
  writeTalk(folder, data);
  fs.rmSync(path.join(folder, "audio.wav"), { force: true });
  build(folder);
}

function sheets(folder: string): void {
  const data = readTalk(folder);
  const [cols, rows] = SHEET;
  const per = cols * rows;
  const out = fs.mkdtempSync(path.join(os.tmpdir(), "talk-digest-sheets-"));
  const imgs = data.slides.map((s) => path.join(path.resolve(folder), "assets", s.image!));
  for (let k = 0; k < imgs.length; k += per) {
    const part = imgs.slice(k, k + per), no = k / per + 1;
    const list = path.join(out, `list-${no}.txt`), dest = path.join(out, `sheet-${no}.jpg`);
    fs.writeFileSync(list, part.map((p) => `file '${p}'\n`).join(""));
    sh(["ffmpeg", "-hide_banner", "-loglevel", "error", "-y", "-f", "concat", "-safe", "0", "-i", list,
      "-vf", `scale=320:-2,tile=${cols}x${Math.ceil(part.length / cols)}:padding=6:color=white`, "-frames:v", "1", dest]);
    console.log(`${dest}: slides ${k + 1}-${k + part.length}, ${cols} per row, left to right`);
  }
}

let cleanup = () => {};

async function run(url: string, language: string, out?: string): Promise<void> {
  checkUrl(url);
  need("yt-dlp", "ffmpeg", "ffprobe");
  const info = JSON.parse(sh(["yt-dlp", "-J", "--no-playlist", "--", url]).toString());
  const folder = path.join(outputRoot(out), slugify(info.title ?? "talk"));
  if (fs.existsSync(folder)) throw new Fail(`folder exists: ${folder} (rebuild with: build ${folder})`);
  fs.mkdirSync(folder, { recursive: true });
  console.log(`folder: ${folder}`);
  const procs: ChildProcess[] = [];
  // A half-built folder would block the next run, and mw would keep transcribing.
  cleanup = () => {
    for (const p of procs) p.kill();
    fs.rmSync(folder, { recursive: true, force: true });
  };
  try {
    await processTalk(url, info, folder, language, procs);
  } catch (err) {
    cleanup();
    throw err;
  }
  cleanup = () => {};
  build(folder);
  if (fs.existsSync(path.join(folder, "audio.wav"))) {
    console.log(`no mw on PATH: transcribe ${path.join(folder, "audio.wav")} to SRT with another tool, then run:\n` +
      `  talk_digest.ts transcript ${folder} <file.srt>`);
  }
}

async function processTalk(url: string, info: Record<string, any>, folder: string, language: string, procs: ChildProcess[]): Promise<void> {
  const work = path.join(folder, ".work"), assets = path.join(folder, "assets");
  fs.mkdirSync(work);
  fs.mkdirSync(assets);
  sh(["yt-dlp", "--no-playlist", "-f", "bv*[height<=1080]+ba/b[height<=1080]/b",
    "--merge-output-format", "mp4", "-o", path.join(work, "video.%(ext)s"), "--", url]);
  const name = fs.readdirSync(work).find((f) => f.startsWith("video."));
  if (!name) throw new Fail("yt-dlp wrote no video file");
  const video = path.join(work, name);

  const srt = path.join(work, "transcript.srt"), log = path.join(work, "mw.log");
  let mwDone: Promise<number | null> | null = null;
  if (has("mw")) {
    // stderr goes to a file: a pipe nobody reads while ffmpeg runs could fill up and stall mw.
    const mw = spawn("mw", ["transcribe", video, "--language", language, "--format", "srt",
      "--no-speakers", "--no-speaker-names", "-o", srt], { stdio: ["ignore", "ignore", fs.openSync(log, "w")] });
    procs.push(mw);
    mwDone = new Promise((resolve) => mw.on("exit", resolve));
  } else {
    sh(["ffmpeg", "-hide_banner", "-loglevel", "error", "-i", video, "-vn", "-ac", "1", "-ar", "16000",
      "-c:a", "pcm_s16le", path.join(folder, "audio.wav")]);
  }

  const duration = Number(sh(["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", video]).toString());
  const frames = sample(video);
  if (!frames.length) throw new Fail("ffmpeg returned no frames");
  const idx = staticPixels(frames);
  const raw = makeSlides(changes(frames, idx), duration);
  const slides = dedupe(dropBlank(raw, frames), frames, idx);
  slides.forEach((s, k) => {
    s.image = `slide-${String(k + 1).padStart(3, "0")}.jpg`;
    grab(video, s, path.join(assets, s.image));
  });
  console.log(`slides: ${raw.length} picture changes -> ${slides.length} after dedupe, ` +
    `${Math.round((100 * idx.length) / frames[0].length)}% of the picture counted as static`);

  let segments: Segment[] = [];
  if (mwDone) {
    if ((await mwDone) !== 0) throw new Fail(`mw transcribe failed\n${fs.readFileSync(log, "utf8").slice(-2000)}`);
    segments = parseSrt(fs.readFileSync(srt, "utf8"));
  }
  const d = String(info.upload_date ?? "");
  writeTalk(folder, {
    title: info.title ?? "Talk", url: info.webpage_url ?? url, uploader: info.uploader ?? info.channel ?? null,
    date: d.length === 8 ? `${d.slice(0, 4)}-${d.slice(4, 6)}-${d.slice(6)}` : d,
    duration, slides, segments, language: language === "auto" ? null : language,
  });
  fs.rmSync(work, { recursive: true, force: true });
}

// ---------- self-test ----------

function selfTest(): number {
  const eq = (a: unknown, b: unknown, msg: string) => {
    if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${msg}: ${JSON.stringify(a)}`);
  };
  const span = (ss: Slide[]) => ss.map((s) => [s.start, s.end]);
  const refused = (u: string) => { try { checkUrl(u); return false; } catch { return true; } };
  eq(["--exec=touch x", "-o/tmp/x", "file:///etc/passwd", "https://a b"].map(refused), [true, true, true, true], "option-like and non-web links are refused");
  eq(refused("https://www.youtube.com/watch?v=abc"), false, "a web link passes");
  eq(parseSrt("1\n00:00:01,000 --> 00:00:04,500\nHello and welcome.\n\n2\n00:01:02,250 --> 00:01:05,000\nSecond line\nwraps here.\n")
    .map((s) => [s.start, s.end, s.text]), [[1, 4.5, "Hello and welcome."], [62.25, 65, "Second line wraps here."]], "srt");

  const slides = makeSlides([0.5, 10, 10.8, 30, 59.5], 60);
  eq(span(slides), [[0, 10], [10, 30], [30, 60]], "changes closer than MIN_GAP to the previous one or to the end are ignored");
  eq(span(mergeIntoNext(slides, 0)), [[0, 30], [30, 60]], "dropped slide time goes to the next");
  eq(span(mergeIntoNext(slides, 2)), [[0, 10], [10, 60]], "last slide merges backwards");
  eq(drop(slides, [1, 3, 99]).length, 1, "drop ignores numbers out of range");
  eq(assign(slides, [{ start: 31, text: "c" }, { start: 2, text: "a" }, { start: 10, text: "b" }]).map((b) => b.map((s) => s.text)),
    [["a"], ["b"], ["c"]], "assign");

  // 50 pixels over 40 seconds: pixel 0 is a speaker inset that flickers every second, pixels
  // 1-49 are the slide. Seconds 0-2 are camera footage, the slide appears at 3, changes at 8
  // and goes black at 25.
  const frame = (t: number) => {
    const inset = t % 2 ? 200 : 0;
    const rest = Array.from({ length: 49 }, (_, i) => (t < 3 ? (t * 90 + i) % 256 : t >= 25 ? 0 : t >= 8 ? 255 : 100));
    return Uint8Array.from([inset, ...rest]);
  };
  const frames = Array.from({ length: 40 }, (_, t) => frame(t));
  const idx = staticPixels(frames);
  eq([idx.includes(0), idx.length], [false, 49], "the flickering inset is not static");
  eq(changes(frames, idx), [3, 8, 25], "camera footage yields no change until the picture settles");
  eq(span(dedupe([{ start: 0, end: 4 }, { start: 4, end: 6 }, { start: 6, end: 40 }], frames, idx)), [[0, 6], [6, 40]],
    "neighbours with the same picture merge");
  const black = frames.map((f, i) => (i >= 25 ? Uint8Array.from([i % 2, ...new Array(49).fill(0)]) : f));
  eq(span(dropBlank([{ start: 3, end: 8 }, { start: 8, end: 25 }, { start: 25, end: 40 }], black)), [[3, 8], [8, 40]],
    "a black slide merges into its neighbour");

  eq(slugify("Crème brûlée: Talks & Slides!"), "creme-brulee-talks-slides", "slugify");
  eq([clock(3725), clock(65)], ["1:02:05", "1:05"], "clock");
  eq(at("https://youtube.com/watch?v=x", 12.7), "https://youtube.com/watch?v=x&t=12s", "time link");

  const folder = fs.mkdtempSync(path.join(os.tmpdir(), "talk-digest-test-"));
  try {
    writeTalk(folder, {
      title: "Costs & <Benefits> $5", url: "https://youtube.com/watch?v=x", language: "de", duration: 60,
      slides: [{ start: 0, end: 60, image: "slide-001.jpg" }], segments: [],
    });
    fs.writeFileSync(path.join(folder, "audio.wav"), "");
    fs.writeFileSync(path.join(folder, "t.srt"), "1\n00:00:01,000 --> 00:00:02,000\nHallo.\n");
    const log = console.log;
    console.log = () => {};
    try {
      transcript(folder, path.join(folder, "t.srt"));
    } finally {
      console.log = log;
    }
    const page = fs.readFileSync(path.join(folder, "talk.html"), "utf8");
    eq(page.includes('<html lang="de">') && page.includes("Costs &amp; &lt;Benefits&gt; $5"), true, "title escaped, dollar kept");
    eq(page.includes("<p>Hallo.</p>") && page.includes("slide-001.jpg") && page.includes("basecoat"), true, "rows land in the template");
    eq(fs.existsSync(path.join(folder, "audio.wav")), false, "transcript removes the audio file");
    writeTalk(folder, { ...readTalk(folder), slides: [{ start: 0, end: 60, image: "../talk.json" }] });
    eq((() => { try { readTalk(folder); return "read"; } catch { return "rejected"; } })(), "rejected", "path in talk.json rejected");
  } finally {
    fs.rmSync(folder, { recursive: true, force: true });
  }
  console.log("self-test ok");
  return 0;
}

async function main(): Promise<number> {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      language: { type: "string", default: "auto" },
      out: { type: "string" },
      drop: { type: "string", default: "" },
      "self-test": { type: "boolean", default: false },
    },
  });
  if (values["self-test"]) return selfTest();
  const [cmd, arg, extra] = positionals;
  if (cmd === "run" && arg) await run(arg, values.language, values.out);
  else if (cmd === "transcript" && arg && extra) transcript(arg, extra);
  else if (cmd === "build" && arg) build(arg, values.drop.split(",").filter((x) => x.trim()).map(Number));
  else if (cmd === "sheets" && arg) sheets(arg);
  else {
    console.log("usage: talk_digest.ts run <url> [--language xx] [--out DIR] | transcript <folder> <file.srt> | " +
      "build <folder> [--drop 3,7] | sheets <folder> | --self-test");
    return 2;
  }
  return 0;
}

process.on("SIGINT", () => {
  cleanup();
  process.exit(130);
});
main().then((code) => process.exit(code), (err) => {
  console.error(err instanceof Fail ? err.message : err);
  process.exit(1);
});

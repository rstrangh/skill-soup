#!/usr/bin/env node
// tasting-menu: deterministic half of the skill. The agent writes graph.json, this script does the rest.
//   lab.ts build DIR              validate DIR/graph.json, lay it out, write DIR/index.html
//   lab.ts generate DIR           create every missing image through Codex image generation
//   lab.ts apply DIR EXPORT.json  merge a round export from the page into graph.json ("-" reads stdin)
//   lab.ts --self-test            run the built-in checks
// Data format: references/graph-format.md.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawn } from "node:child_process";
import { fileURLToPath } from "node:url";

const TEMPLATE = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "assets", "template.html");
const TYPES = new Set(["reference", "text", "style", "prompt", "image"]);
const COL_W = 440;
const GAP = 48;

type Node = {
  id: string; type: string; title: string; round: number; from?: string[];
  text?: string; hint?: string; image?: string; prompt_used?: string;
  verdict?: "like" | "dislike" | null; note?: string;
  pos_x?: number; pos_y?: number; pending?: boolean;
};
type Graph = { title: string; round: number; aspect?: string; lang?: string; nodes: Node[] };
type Export = {
  "tasting-menu": string; round: number; edits?: { id: string; text: string }[];
  verdicts?: { id: string; verdict: "like" | "dislike" | null; note?: string }[]; comment?: string;
};

const read = (dir: string): Graph => JSON.parse(fs.readFileSync(path.join(dir, "graph.json"), "utf8"));
const write = (dir: string, g: Graph) => fs.writeFileSync(path.join(dir, "graph.json"), JSON.stringify(g, null, 2) + "\n");

export function validate(g: Graph): string[] {
  const errs: string[] = [];
  if (!g.title) errs.push("graph: title is missing");
  if (!Number.isInteger(g.round) || g.round < 1) errs.push("graph: round must be an integer >= 1");
  if (g.aspect && !/^\d+:\d+$/.test(g.aspect)) errs.push(`graph: aspect "${g.aspect}" is not W:H`);
  if (g.lang && !["en", "de"].includes(g.lang)) errs.push(`graph: lang "${g.lang}" is not en or de`);
  const ids = new Set<string>();
  for (const n of g.nodes ?? []) {
    const at = `node ${n.id ?? "?"}`;
    if (!n.id) errs.push("node without id");
    else if (ids.has(n.id)) errs.push(`${at}: duplicate id`);
    ids.add(n.id);
    if (!TYPES.has(n.type)) errs.push(`${at}: unknown type "${n.type}"`);
    if (!n.title) errs.push(`${at}: title is missing`);
    if (!Number.isInteger(n.round) || n.round < 1 || n.round > g.round) errs.push(`${at}: round must be 1..${g.round}`);
    if ((n.type === "reference" || n.type === "image") && !n.image) errs.push(`${at}: image path is missing`);
    if ((n.type === "style" || n.type === "prompt") && !n.text) errs.push(`${at}: text is missing`);
    if (n.image && (path.isAbsolute(n.image) || n.image.includes(".."))) errs.push(`${at}: image path must be relative inside the folder`);
  }
  for (const n of g.nodes ?? []) {
    for (const p of n.from ?? []) if (!ids.has(p)) errs.push(`node ${n.id}: from "${p}" does not exist`);
    if (n.type === "image") {
      const prompts = (n.from ?? []).filter(p => g.nodes.find(m => m.id === p)?.type === "prompt");
      if (prompts.length !== 1) errs.push(`node ${n.id}: an image needs exactly one prompt in "from"`);
    }
    if (n.type === "reference" && n.from?.length) errs.push(`node ${n.id}: a reference has no "from"`);
  }
  if (!errs.length && depths(g) === null) errs.push("graph: cycle in from-links");
  return errs;
}

// Column = longest path from a root. Returns null on a cycle.
function depths(g: Graph): Map<string, number> | null {
  const byId = new Map(g.nodes.map(n => [n.id, n]));
  const d = new Map<string, number>();
  const busy = new Set<string>();
  const visit = (id: string): number => {
    if (d.has(id)) return d.get(id)!;
    if (busy.has(id)) throw new Error("cycle");
    busy.add(id);
    const from = byId.get(id)!.from ?? [];
    const v = from.length ? 1 + Math.max(...from.map(visit)) : 0;
    busy.delete(id); d.set(id, v); return v;
  };
  try { g.nodes.forEach(n => visit(n.id)); } catch { return null; }
  return d;
}

// Estimated rendered heights. They only need to keep nodes from overlapping.
function height(n: Node, aspect: string): number {
  const [w, h] = aspect.split(":").map(Number);
  const pic = Math.round(312 * h / w);
  switch (n.type) {
    case "reference": return 70 + pic;
    case "image": return 70 + pic + 140;
    case "text": return 190;
    default: return 330;
  }
}

// Children sit at the mean height of their parents, pushed down past whatever is already in the column.
// ponytail: greedy per-column layout, can drift on wide fan-ins; swap in dagre if graphs get messy.
export function layout(g: Graph): void {
  const d = depths(g)!;
  const aspect = g.aspect ?? "16:9";
  const cursor = new Map<number, number>();
  const order = g.nodes.map((n, i) => ({ n, i })).sort((a, b) => d.get(a.n.id)! - d.get(b.n.id)! || a.i - b.i);
  const top = new Map<string, number>();
  for (const { n } of order) {
    const col = d.get(n.id)!;
    const parents = (n.from ?? []).map(p => top.get(p)!);
    const want = parents.length ? parents.reduce((a, b) => a + b, 0) / parents.length : 0;
    const y = Math.max(want, cursor.get(col) ?? 0);
    top.set(n.id, y);
    cursor.set(col, y + height(n, aspect) + GAP);
    n.pos_x = 40 + col * COL_W;
    n.pos_y = 80 + y;
  }
}

export function render(g: Graph, dir: string): string {
  const errs = validate(g);
  if (errs.length) throw new Error(errs.join("\n"));
  const copy: Graph = JSON.parse(JSON.stringify(g));
  layout(copy);
  for (const n of copy.nodes) if (n.type === "image") n.pending = !fs.existsSync(path.join(dir, n.image!));
  const json = JSON.stringify(copy).replace(/</g, "\\u003c");
  return fs.readFileSync(TEMPLATE, "utf8").split("/*__DATA__*/").join(json);
}

function build(dir: string) {
  const g = read(dir);
  const html = render(g, dir);
  const out = path.join(dir, "index.html");
  fs.writeFileSync(out, html);
  const pending = g.nodes.filter(n => n.type === "image" && !fs.existsSync(path.join(dir, n.image!))).length;
  console.log(`wrote ${out} (round ${g.round}, ${g.nodes.length} nodes${pending ? `, ${pending} images missing` : ""})`);
}

export function applyExport(g: Graph, e: Export): { lines: string[]; errs: string[] } {
  const errs: string[] = [];
  if (e["tasting-menu"] !== g.title) errs.push(`export belongs to "${e["tasting-menu"]}", graph is "${g.title}"`);
  if (e.round !== g.round) errs.push(`export is from round ${e.round}, graph is at round ${g.round} (already applied?)`);
  const byId = new Map(g.nodes.map(n => [n.id, n]));
  for (const x of [...(e.edits ?? []), ...(e.verdicts ?? [])]) if (!byId.has(x.id)) errs.push(`unknown node "${x.id}"`);
  if (errs.length) return { lines: [], errs };
  const lines: string[] = [];
  for (const x of e.edits ?? []) {
    const n = byId.get(x.id)!;
    n.text = x.text;
    lines.push(`EDIT    ${n.id} (${n.type}): ${oneLine(x.text)}`);
  }
  for (const v of e.verdicts ?? []) {
    const n = byId.get(v.id)!;
    if (v.verdict) n.verdict = v.verdict;
    if (v.note) n.note = v.note;
    const tag = v.note ? "VARIANT" : v.verdict === "like" ? "LIKE   " : "DROP   ";
    lines.push(`${tag} ${n.id}${v.verdict ? ` [${v.verdict}]` : ""}${v.note ? `: ${oneLine(v.note)}` : ""}`);
  }
  if (e.comment) lines.push(`COMMENT ${oneLine(e.comment)}`);
  g.round += 1;
  return { lines, errs };
}
const oneLine = (s: string) => s.replace(/\s+/g, " ").trim().slice(0, 160);

function apply(dir: string, src: string) {
  const raw = fs.readFileSync(src === "-" ? 0 : src, "utf8");
  const e: Export = JSON.parse(raw);
  const g = read(dir);
  const done = g.round;
  const { lines, errs } = applyExport(g, e);
  if (errs.length) { console.error(errs.join("\n")); process.exit(1); }
  fs.mkdirSync(path.join(dir, "rounds"), { recursive: true });
  fs.writeFileSync(path.join(dir, "rounds", `round-${done}.json`), JSON.stringify(e, null, 2) + "\n");
  write(dir, g);
  console.log(`round ${done} applied, graph is now at round ${g.round}. Add round-${g.round} nodes for:`);
  console.log(lines.length ? lines.join("\n") : "(nothing: the user changed nothing)");
}

// --- Image generation through `codex exec`. Codex saves images under ~/.codex/generated_images/<thread_id>/.
function codexImage(prompt: string, aspect: string, refs: string[]): Promise<string> {
  const instruction = [
    "Generate exactly one image with your image generation tool. Do not run commands and do not write files.",
    `Aspect ratio: ${aspect}.`,
    refs.length ? "The attached images are visual references. Follow the prompt where it says how to use them." : "",
    "Reply with DONE when the image exists.", "", "Image prompt:", prompt,
  ].filter(Boolean).join("\n");
  const args = ["exec", "--json", "--skip-git-repo-check", "-s", "read-only", ...refs.flatMap(r => ["-i", r]), "--", instruction];
  return new Promise((resolve, reject) => {
    const p = spawn("codex", args, { stdio: ["ignore", "pipe", "pipe"] });
    let out = "", err = "";
    p.stdout.on("data", c => (out += c));
    p.stderr.on("data", c => (err += c));
    p.on("error", reject);
    p.on("close", code => {
      const tid = out.match(/"thread_id":"([^"]+)"/)?.[1];
      const folder = tid && path.join(os.homedir(), ".codex", "generated_images", tid);
      const pngs = folder && fs.existsSync(folder)
        ? fs.readdirSync(folder).filter(f => f.endsWith(".png")).map(f => path.join(folder, f))
          .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs)
        : [];
      if (pngs.length) resolve(pngs[0]);
      else reject(new Error(`codex exit ${code}, no image${tid ? ` in ${folder}` : ", no thread_id"}\n${err.slice(-400)}`));
    });
  });
}

async function generate(dir: string) {
  const g = read(dir);
  const errs = validate(g);
  if (errs.length) { console.error(errs.join("\n")); process.exit(1); }
  const byId = new Map(g.nodes.map(n => [n.id, n]));
  const todo = g.nodes.filter(n => n.type === "image" && !fs.existsSync(path.join(dir, n.image!)));
  if (!todo.length) { console.log("no missing images"); return; }
  const jobs = Math.max(1, Number(process.env.LAB_JOBS) || 3);
  console.log(`generating ${todo.length} images, ${jobs} at a time`);
  let failed = 0;
  const queue = [...todo];
  const worker = async () => {
    for (let n = queue.shift(); n; n = queue.shift()) {
      const prompt = byId.get(n.from!.find(p => byId.get(p)!.type === "prompt")!)!;
      const refs = (prompt.from ?? []).map(p => byId.get(p)!)
        .filter(m => m.image && fs.existsSync(path.join(dir, m.image)))
        .map(m => path.resolve(dir, m.image!));
      try {
        const png = await codexImage(prompt.text!, g.aspect ?? "16:9", refs);
        fs.mkdirSync(path.dirname(path.join(dir, n.image!)), { recursive: true });
        fs.copyFileSync(png, path.join(dir, n.image!));
        n.prompt_used = prompt.text;
        write(dir, g);
        console.log(`ok     ${n.id} -> ${n.image}${refs.length ? ` (${refs.length} reference images)` : ""}`);
      } catch (e) {
        failed++;
        console.error(`FAILED ${n.id}: ${(e as Error).message}`);
      }
    }
  };
  await Promise.all(Array.from({ length: Math.min(jobs, todo.length) }, worker));
  if (failed) process.exit(1);
}

function selfTest() {
  const ok = (c: unknown, m: string) => { if (!c) { console.error("FAIL " + m); process.exit(1); } };
  const base = (): Graph => ({
    title: "T", round: 1, aspect: "16:9", nodes: [
      { id: "ref", type: "reference", title: "R", round: 1, image: "images/ref.png" },
      { id: "theme", type: "text", title: "Theme", round: 1, text: "" },
      { id: "style", type: "style", title: "S", round: 1, text: "s", from: ["ref"] },
      { id: "p1", type: "prompt", title: "P1", round: 1, text: "p", from: ["style", "theme"] },
      { id: "p2", type: "prompt", title: "P2", round: 1, text: "p", from: ["style", "theme"] },
      { id: "i1", type: "image", title: "I1", round: 1, image: "images/i1.png", from: ["p1"] },
      { id: "i2", type: "image", title: "I2", round: 1, image: "images/i2.png", from: ["p2"] },
    ],
  });
  ok(validate(base()).length === 0, "valid graph passes");
  const cyc = base(); cyc.nodes[2].from = ["p1"]; ok(validate(cyc).some(e => e.includes("cycle")), "cycle is caught");
  const dang = base(); dang.nodes[3].from = ["nope"]; ok(validate(dang).some(e => e.includes("does not exist")), "dangling from is caught");
  const two = base(); two.nodes[5].from = ["p1", "p2"]; ok(validate(two).some(e => e.includes("exactly one prompt")), "image with two prompts is caught");
  const abs = base(); abs.nodes[0].image = "/etc/x.png"; ok(validate(abs).some(e => e.includes("relative")), "absolute image path is caught");
  const esc = base(); esc.nodes[0].image = "../x.png"; ok(validate(esc).some(e => e.includes("relative")), "path escape is caught");

  const g = base(); layout(g);
  const at = (id: string) => g.nodes.find(n => n.id === id)!;
  ok(at("ref").pos_x! < at("style").pos_x! && at("style").pos_x! < at("p1").pos_x! && at("p1").pos_x! < at("i1").pos_x!, "columns follow depth");
  ok(at("p2").pos_y! > at("p1").pos_y!, "siblings stack");
  ok(at("i2").pos_y! >= at("i1").pos_y! + height(at("i1"), "16:9"), "images in one column do not overlap");

  const tmp = fs.mkdtempSync(path.join(os.tmpdir(), "looks-lab-"));
  const html = render(Object.assign(base(), { title: "</script><b>" }), tmp);
  ok(!html.includes("</script><b>"), "title cannot close the data script");
  ok(html.includes('"pending":true'), "missing image is marked pending");

  const a = base();
  const r = applyExport(a, { "tasting-menu": "T", round: 1, edits: [{ id: "theme", text: "Tokens" }],
    verdicts: [{ id: "i1", verdict: "like", note: "warmer" }, { id: "i2", verdict: "dislike" }], comment: "more red" });
  ok(r.errs.length === 0 && a.round === 2, "export applies and bumps the round");
  ok(a.nodes[1].text === "Tokens" && a.nodes[5].note === "warmer" && a.nodes[6].verdict === "dislike", "edits and verdicts land");
  ok(r.lines.some(l => l.startsWith("VARIANT i1")) && r.lines.some(l => l.startsWith("COMMENT")), "summary names variants and comment");
  ok(applyExport(a, { "tasting-menu": "T", round: 1 }).errs.length === 1, "stale export is refused");
  ok(applyExport(base(), { "tasting-menu": "X", round: 1 }).errs.length === 1, "foreign export is refused");
  ok(applyExport(base(), { "tasting-menu": "T", round: 1, edits: [{ id: "zz", text: "" }] }).errs.length === 1, "unknown id is refused");
  console.log("self-test ok");
}

const [cmd, dir, extra] = process.argv.slice(2);
const usage = "usage: lab.ts build DIR | generate DIR | apply DIR EXPORT.json|- | --self-test";
if (cmd === "--self-test") selfTest();
else if (!dir) { console.error(usage); process.exit(2); }
else if (cmd === "build") {
  try { build(dir); } catch (e) { console.error((e as Error).message); process.exit(1); }
}
else if (cmd === "generate") await generate(dir);
else if (cmd === "apply" && extra) apply(dir, extra);
else { console.error(usage); process.exit(2); }

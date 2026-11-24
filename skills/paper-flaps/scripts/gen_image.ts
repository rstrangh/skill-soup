#!/usr/bin/env node
// Generate one illustration through the Codex CLI and its built-in image tool.
// Needs a Codex login (ChatGPT account). Needs no API key.
// Usage: gen_image.ts [--edit] <prompt-file> <out.jpg> [reference-image]
//        --edit treats the reference as the picture to change: same scene, only the named change
//        gen_image.ts --check    reports whether this engine is ready, exit 0 = ready
//        gen_image.ts --self-test
// Codex runs read-only in an empty folder: the prompt carries text from a paper, so it gets no
// write access and no view of the site. The script takes the image from Codex's own store.
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

// Like `command -v`: is the command an executable file on PATH?
function has(cmd: string): boolean {
  return (process.env.PATH ?? "").split(":").some(dir => {
    try {
      const p = path.join(dir || ".", cmd);
      fs.accessSync(p, fs.constants.X_OK);
      return fs.statSync(p).isFile();
    } catch {
      return false;
    }
  });
}

// Bash's ${out%.*}: cut from the last dot of the whole path.
const stripExt = (p: string): string => (p.includes(".") ? p.slice(0, p.lastIndexOf(".")) : p);

const nonEmptyFile = (p: string): boolean => (fs.statSync(p, { throwIfNoEntry: false })?.size ?? 0) > 0;

function check(): number {
  if (!has("codex")) {
    console.log("codex: missing");
    return 1;
  }
  const r = spawnSync("codex", ["login", "status"], { encoding: "utf8" });
  const status = ((r.stdout ?? "") + (r.stderr ?? "")).replace(/\n+$/, "");
  if (r.status === 0) {
    console.log(`codex: ready (${status})`);
    return 0;
  }
  console.log("codex: installed, not logged in (run: codex login)");
  return 1;
}

// Codex saves images under <home>/.codex/generated_images/<thread_id>/. Newest PNG of this run, or "".
function newestImage(jsonOut: string, home: string): string {
  const tid = jsonOut.match(/"thread_id":"([^"/]+)"/)?.[1];
  if (!tid) return "";
  const folder = path.join(home, ".codex", "generated_images", tid);
  if (!fs.existsSync(folder)) return "";
  const pngs = fs.readdirSync(folder).filter(f => f.endsWith(".png")).map(f => path.join(folder, f))
    .sort((a, b) => fs.statSync(b).mtimeMs - fs.statSync(a).mtimeMs);
  return pngs[0] ?? "";
}

function selfTest(): number {
  const home = fs.mkdtempSync(path.join(os.tmpdir(), "gen-image-"));
  const dir = path.join(home, ".codex", "generated_images", "t-1");
  fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(path.join(dir, "a.png"), "x");
  const ok = newestImage('{"type":"thread.started","thread_id":"t-1"}', home).endsWith("a.png")
    && newestImage('{"thread_id":"t-2"}', home) === ""
    && newestImage('{"thread_id":"../../etc"}', home) === ""
    && newestImage("no thread", home) === "";
  fs.rmSync(home, { recursive: true, force: true });
  console.log(ok ? "self-test ok" : "self-test FAILED");
  return ok ? 0 : 1;
}

function main(argv: string[]): number {
  if (argv[0] === "--check") return check();
  if (argv[0] === "--self-test") return selfTest();

  let edit = false;
  if (argv[0] === "--edit") {
    edit = true;
    argv = argv.slice(1);
  }
  if (argv.length < 2) {
    console.error("usage: gen_image.ts [--edit] <prompt-file> <out.jpg> [reference-image] | --check");
    return 2;
  }
  const [promptFile, outArg, ref = ""] = argv;
  let out = outArg;

  if (!has("codex")) {
    console.error("codex CLI not found: install it or use an SVG figure");
    return 2;
  }
  if (!nonEmptyFile(promptFile)) {
    console.error(`prompt file empty or missing: ${promptFile}`);
    return 2;
  }

  fs.mkdirSync(path.dirname(out), { recursive: true });
  const outDir = path.resolve(path.dirname(out));
  const name = path.basename(stripExt(out));
  const log = `${outDir}/.codex-${name}.log`;
  const empty = fs.mkdtempSync(path.join(os.tmpdir(), "gen-image-"));

  const args = ["exec", "--json", "--skip-git-repo-check", "-s", "read-only", "-C", empty];
  let refLine = "";
  if (ref) {
    args.push("-i", path.resolve(ref));
    refLine = "Match the drawing style, palette and line quality of the attached reference image exactly. Do not copy its subject.";
    if (edit) {
      refLine = "Edit the attached image. Keep the composition, camera angle, framing, lighting, background and every object unchanged, except the change described below.";
    }
  } else if (edit) {
    console.error("--edit needs a reference image");
    return 2;
  }

  // The prompt goes through stdin: -i takes several values and would swallow a positional prompt.
  const prompt = "Use your built-in image generation tool to create exactly one image. Do not run commands and do not write files.\n"
    + refLine + "\n"
    + fs.readFileSync(promptFile, "utf8")
    + "\n"
    + "Reply with DONE when the image exists.\n";
  const run = spawnSync("codex", args, { input: prompt, encoding: "utf8", timeout: 600_000, maxBuffer: 64 * 1024 * 1024 });
  fs.rmSync(empty, { recursive: true, force: true });
  fs.writeFileSync(log, (run.stdout ?? "") + (run.stderr ?? ""));

  const raw = newestImage(run.stdout ?? "", os.homedir());
  if (!raw || !nonEmptyFile(raw)) {
    console.error(`no image produced, see ${log}`);
    return 1;
  }

  if (has("sips")) {
    const r = spawnSync("sips", ["-s", "format", "jpeg", "-s", "formatOptions", "82", "-Z", "1600", raw, "--out", out],
      { stdio: ["ignore", "ignore", "inherit"] });
    if (r.status !== 0) return r.status ?? 1;
  } else {
    fs.copyFileSync(raw, stripExt(out) + ".png");
    out = stripExt(out) + ".png";
  }
  fs.rmSync(log, { force: true });
  console.log(out);
  return 0;
}

process.exitCode = main(process.argv.slice(2));

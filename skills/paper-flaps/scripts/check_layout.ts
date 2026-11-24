#!/usr/bin/env node
// Layout gate for a paper-flaps page: runs layout_probe.js in a headless browser
// at phone and desktop width and prints the findings. Exit 1 on any finding.
// Needs the agent-browser CLI and a served page:
//   python3 -m http.server --bind 127.0.0.1 8080 &   then   check_layout.ts http://127.0.0.1:8080/
import fs from "node:fs";
import path from "node:path";
import { spawnSync } from "node:child_process";

type Finding = { rule: unknown; where: unknown; detail: unknown };

class Exit extends Error {
  code: number;
  constructor(code: number) {
    super(`exit ${code}`);
    this.code = code;
  }
}

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

// One agent-browser call; stops the gate when it fails, like `set -e` did.
function browser(...args: string[]): string {
  const r = spawnSync("agent-browser", args, { encoding: "utf8", stdio: ["ignore", "pipe", "inherit"], maxBuffer: 64 * 1024 * 1024 });
  if (r.status !== 0) throw new Exit(r.status ?? 1);
  return r.stdout;
}

// Python's str() for a JSON value.
function pyStr(v: unknown): string {
  if (v === null || v === undefined) return "None";
  if (v === true) return "True";
  if (v === false) return "False";
  return typeof v === "string" ? v : JSON.stringify(v);
}

// Prints the result of one width; true when it has no findings.
function report(raw: string, width: number): boolean {
  let data = JSON.parse(raw.trim());
  if (typeof data === "string") data = JSON.parse(data);
  if (data.width !== width) {
    console.log(`${width}px  probe ran at ${pyStr(data.width)}px, not at the asked width`);
    return false;
  }
  if (!("pages" in data)) throw new Error("KeyError: 'pages'");
  console.log(`${width}px  measured ${Math.trunc(Number(data.pages))} chapter(s)`);
  const findings: Finding[] = data.findings;
  for (const f of findings) {
    console.log(`${width}px  ${pyStr(f.rule).padEnd(22)} ${pyStr(f.where).padEnd(11)} ${pyStr(f.detail)}`);
  }
  return findings.length === 0;
}

function main(argv: string[]): number {
  const url = argv[0];
  if (!url) {
    console.error("check_layout.ts: usage: check_layout.ts <url>");
    return 1;
  }
  if (!has("agent-browser")) {
    console.error("agent-browser not found: check the layout by screenshots instead");
    return 2;
  }
  // $(cat probe) dropped trailing newlines; keep the eval'd source identical.
  const probe = fs.readFileSync(path.join(import.meta.dirname, "layout_probe.js"), "utf8").replace(/\n+$/, "");
  let status = 0;

  for (const [w, h] of [[375, 812], [1280, 900]]) {
    // The viewport only sticks once a browser runs: open, resize, then load again.
    browser("open", url);
    browser("set", "viewport", String(w), String(h));
    browser("open", url);
    browser("wait", "1200");
    const result = browser("eval", probe);
    try {
      if (!report(result, w)) status = 1;
    } catch (e) {
      console.error(e instanceof Error ? e.message : e);
      status = 1;
    }
  }
  spawnSync("agent-browser", ["close"], { stdio: "ignore" });
  if (status === 0) console.log("layout: no findings");
  return status;
}

try {
  process.exitCode = main(process.argv.slice(2));
} catch (e) {
  if (!(e instanceof Exit)) throw e;
  process.exitCode = e.code;
}

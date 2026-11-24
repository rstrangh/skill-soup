#!/usr/bin/env node
// Quality gate for skill-soup. Exit 1 on any finding.
//
//   scripts/check.ts              full gate
//   scripts/check.ts --index      rewrite the skill table in README.md
//   scripts/check.ts --self-test  test the gate itself
//
// Checks only what a tool can count. Whether a skill is good stays a human call.

import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";

const ROOT = path.dirname(import.meta.dirname);
const PLUGIN = "skill-soup";
const SEMVER = /^\d+\.\d+\.\d+$/;
const README_START = "<!-- skills:start -->";
const README_END = "<!-- skills:end -->";
const BROWSER_MARKER = "// Runs in the browser.";
const TEXT_EXT = [".md", ".ts", ".js", ".mjs", ".html", ".css", ".json", ".toml", ".txt", ".svg"];
// German words that do not occur in English text. Two on one line, or one umlaut, is German.
const GERMAN_WORDS = /\b(und|nicht|wenn|für|über|ist|wird|dann|auch|eine|einen|einem|sich|noch|schon|aber|oder|damit|mit|der|das|dem|den|zum|zur|bei|nach|wie|kein|keine)\b/gi;
const UMLAUT = /[äöüßÄÖÜ]/;
const SKILL_REF = /\b([a-z][a-z0-9-]*):([a-z][a-z0-9-]+)\b/g;
const FOREIGN_NAMESPACES = new Set(["personal", "family", "work", "neureif"]);
const CONFIG_PATH = /~\/\.config\/[A-Za-z0-9._-]+\//g;

const read = (p: string): string => fs.readFileSync(p, "utf8");
const isFile = (p: string): boolean => fs.existsSync(p) && fs.statSync(p).isFile();
const isDir = (p: string): boolean => fs.existsSync(p) && fs.statSync(p).isDirectory();
const isExecutable = (p: string): boolean => (fs.statSync(p).mode & 0o111) !== 0;

function frontmatter(text: string): Record<string, string> {
  const m = text.match(/^---\n([\s\S]*?)\n---/);
  const fields: Record<string, string> = {};
  let key = "";
  for (const line of m ? m[1].split("\n") : []) {
    const km = line.match(/^([a-zA-Z_-]+):\s*(.*)$/);
    if (km) {
      key = km[1];
      const value = km[2].trim();
      fields[key] = [">", "|", ">-", "|-"].includes(value) ? "" : value;
    } else if (key && line.trim()) {
      fields[key] = (fields[key] + " " + line.trim()).trim();
    }
  }
  return fields;
}

function skills(root: string): string[] {
  const base = path.join(root, "skills");
  if (!isDir(base)) return [];
  return fs.readdirSync(base).filter((d) => isFile(path.join(base, d, "SKILL.md"))).sort();
}

function walkFiles(dir: string): string[] {
  const out: string[] = [];
  for (const entry of fs.readdirSync(dir, { withFileTypes: true }).sort((a, b) => a.name.localeCompare(b.name))) {
    if (entry.name.startsWith(".")) continue;
    const p = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkFiles(p));
    else out.push(p);
  }
  return out;
}

function germanLine(body: string): number {
  const lines = body.split("\n");
  for (let i = 0; i < lines.length; i++) {
    if (UMLAUT.test(lines[i]) || (lines[i].match(GERMAN_WORDS) ?? []).length >= 2) return i + 1;
  }
  return 0;
}

// Output templates carry this marker in their first 800 characters and keep the languages they show.
const OUTPUT_LANGUAGE_MARKER = "<!-- output-language -->";

// Vendored third-party files sit next to a NOTICE.md and keep their own language.
function vendored(skillDir: string, file: string): boolean {
  for (let dir = path.dirname(file); dir.startsWith(skillDir); dir = path.dirname(dir)) {
    if (isFile(path.join(dir, "NOTICE.md"))) return true;
  }
  return false;
}

function checkSkill(root: string, name: string, published: Set<string>): string[] {
  const skillDir = path.join(root, "skills", name);
  const text = read(path.join(skillDir, "SKILL.md"));
  const fm = frontmatter(text);
  const out: string[] = [];
  const say = (rule: string, msg: string) => out.push(`${rule}  ${name}: ${msg}`);

  if (fm.name !== name) say("frontmatter", `name '${fm.name}' differs from the folder`);
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fm.version ?? "")) say("frontmatter", "version must be the date of the last change, YYYY-MM-DD");
  const desc = fm.description ?? "";
  if (!desc) say("frontmatter", "description missing");
  else if (desc.length > 1536) say("frontmatter", `description has ${desc.length} characters, max 1536`);
  if (text.split("\n").length > 500) say("size", "SKILL.md exceeds 500 lines, move detail into references/");

  const refDir = path.join(skillDir, "references");
  if (isDir(refDir)) {
    for (const ref of fs.readdirSync(refDir).sort()) {
      if (ref.endsWith(".md") && !text.includes(`references/${ref}`)) say("dead-reference", `references/${ref} is never linked from SKILL.md`);
    }
  }

  const scriptDir = path.join(skillDir, "scripts");
  if (isDir(scriptDir)) {
    for (const s of fs.readdirSync(scriptDir).sort()) {
      const p = path.join(scriptDir, s);
      if (!isFile(p)) continue;
      if (s.endsWith(".ts")) {
        if (!isExecutable(p)) say("executable", `scripts/${s} is not executable`);
      } else if (!(s.endsWith(".js") && read(p).startsWith(BROWSER_MARKER))) {
        say("typescript", `scripts/${s}: scripts are TypeScript; browser code is .js starting with '${BROWSER_MARKER}'`);
      }
    }
  }

  for (const p of walkFiles(skillDir)) {
    const rel = path.relative(skillDir, p);
    if (!TEXT_EXT.includes(path.extname(p))) continue;
    const body = read(p);
    const de = vendored(skillDir, p) || body.slice(0, 800).includes(OUTPUT_LANGUAGE_MARKER) ? 0 : germanLine(body);
    if (de) say("english", `${rel}:${de} reads as German; skills are English`);
    for (const hit of new Set(body.match(/\/(?:Users|home)\/[A-Za-z0-9._-]+/g) ?? [])) say("private-path", `${rel} contains ${hit}`);
    if (!p.endsWith(".md")) continue;
    const refs = new Set([...body.matchAll(SKILL_REF)].map((m) => `${m[1]}:${m[2]}`));
    for (const ref of [...refs].sort()) {
      const [ns, target] = ref.split(":");
      if (FOREIGN_NAMESPACES.has(ns)) say("foreign-skill", `${rel} points to ${ref}, which is not in this repo`);
      else if (ns === PLUGIN && !published.has(target)) say("foreign-skill", `${rel} points to ${ref}, which does not exist`);
    }
  }
  return out;
}

function checkConfigDocumented(root: string, names: string[]): string[] {
  const readme = read(path.join(root, "README.md"));
  const out: string[] = [];
  for (const name of names) {
    const text = read(path.join(root, "skills", name, "SKILL.md"));
    for (const p of [...new Set(text.match(CONFIG_PATH) ?? [])].sort()) {
      if (!readme.includes(p)) out.push(`config-doc  ${name}: README does not document ${p}`);
    }
  }
  return out;
}

function checkManifests(root: string): string[] {
  const out: string[] = [];
  let codex: Record<string, unknown>;
  let claude: Record<string, unknown>;
  try {
    codex = JSON.parse(read(path.join(root, ".codex-plugin", "plugin.json")));
    claude = JSON.parse(read(path.join(root, ".claude-plugin", "plugin.json")));
    JSON.parse(read(path.join(root, ".claude-plugin", "marketplace.json")));
    JSON.parse(read(path.join(root, ".agents", "plugins", "marketplace.json")));
  } catch (err) {
    return [`manifest  ${(err as Error).message}`];
  }
  if (codex.name !== PLUGIN || claude.name !== PLUGIN) out.push(`manifest  plugin name must be ${PLUGIN} in both manifests`);
  if ("version" in claude) out.push("manifest  .claude-plugin/plugin.json must not carry a version; Claude Code uses the commit SHA");
  const version = String(codex.version ?? "");
  if (!SEMVER.test(version)) out.push(`manifest  codex version '${version}' is not SemVer`);
  const changelog = path.join(root, "CHANGELOG.md");
  if (!isFile(changelog) || !read(changelog).includes(`## ${version}`)) out.push(`changelog  CHANGELOG.md has no '## ${version}' section`);
  if (!isFile(path.join(root, "LICENSE"))) out.push("license  LICENSE missing");
  return out;
}

function firstSentence(desc: string): string {
  const text = desc.split(/\s+/).join(" ");
  const sentence = text.match(/^(.{0,200}?[.!?])(\s|$)/)?.[1];
  const clause = text.match(/^(.{20,200}?):\s/)?.[1];
  const cut = sentence ?? (clause ? clause + "." : text.slice(0, 200).replace(/\s+\S*$/, "") + " …");
  return cut.replaceAll("|", "\\|");
}

function indexBlock(root: string): string {
  const rows = [README_START, "", "Generated by `just index`. Do not edit by hand.", "", "| Skill | What it does |", "|---|---|"];
  for (const name of skills(root)) {
    const fm = frontmatter(read(path.join(root, "skills", name, "SKILL.md")));
    rows.push(`| [\`${name}\`](skills/${name}/SKILL.md) | ${firstSentence(fm.description ?? "")} |`);
  }
  return [...rows, "", README_END].join("\n");
}

function readmeWithIndex(root: string): string | null {
  const text = read(path.join(root, "README.md"));
  if (!text.includes(README_START) || !text.includes(README_END)) return null;
  const [head, rest] = text.split(README_START, 2);
  return head + indexBlock(root) + rest.split(README_END, 2)[1];
}

function checkIndex(root: string): string[] {
  const wanted = readmeWithIndex(root);
  if (wanted === null) return ["readme  skill table markers missing in README.md"];
  return wanted === read(path.join(root, "README.md")) ? [] : ["readme  skill table is stale, run: just index"];
}

function runSelfTests(root: string): string[] {
  const out: string[] = [];
  for (const name of skills(root)) {
    const scriptDir = path.join(root, "skills", name, "scripts");
    if (!isDir(scriptDir)) continue;
    for (const s of fs.readdirSync(scriptDir).sort()) {
      const p = path.join(scriptDir, s);
      if (!s.endsWith(".ts") || !read(p).includes("--self-test")) continue;
      const r = spawnSync(process.execPath, [p, "--self-test"], { encoding: "utf8" });
      if (r.status !== 0) out.push(`self-test  ${name}: scripts/${s} failed\n${(r.stdout + r.stderr).trim().slice(-600)}`);
    }
  }
  return out;
}

function gate(root: string, runScripts = true): string[] {
  const names = skills(root);
  const findings = checkManifests(root);
  if (!names.length) findings.push("skills  no skill under skills/");
  for (const name of names) findings.push(...checkSkill(root, name, new Set(names)));
  findings.push(...checkConfigDocumented(root, names));
  findings.push(...checkIndex(root));
  if (runScripts) findings.push(...runSelfTests(root));
  return findings;
}

function selfTest(): number {
  const root = fs.mkdtempSync(path.join(os.tmpdir(), "skill-soup-"));
  const write = (rel: string, body: string, mode = 0o644) => {
    fs.mkdirSync(path.dirname(path.join(root, rel)), { recursive: true });
    fs.writeFileSync(path.join(root, rel), body, { mode });
  };
  try {
    write(".claude-plugin/plugin.json", JSON.stringify({ name: PLUGIN }));
    write(".claude-plugin/marketplace.json", "{}");
    write(".agents/plugins/marketplace.json", "{}");
    write(".codex-plugin/plugin.json", JSON.stringify({ name: PLUGIN, version: "1.0.0" }));
    write("CHANGELOG.md", "## 1.0.0\n");
    write("LICENSE", "MIT\n");
    write("skills/good/SKILL.md", "---\nname: good\nversion: 2026-01-01\ndescription: >\n  Does the thing well.\n---\n" +
      "Read references/a.md and keep ~/.config/good/ in mind. See skill-soup:bad.\n");
    write("skills/good/references/a.md", "Use this when you write.\n");
    write("skills/good/scripts/run.ts", "#!/usr/bin/env node\nconsole.log(1);\n", 0o755);
    write("skills/good/scripts/probe.js", `${BROWSER_MARKER}\nconsole.log(1);\n`);
    write("skills/good/assets/vendor/NOTICE.md", "Third-party file, Apache-2.0.\n");
    write("skills/good/assets/vendor/anchors.md", "Wenn das deutsch ist, bleibt es so.\n");
    write("skills/good/assets/page.html", "<!doctype html>\n<!-- output-language --> Labels in English and German.\n<p>Für die nächste Runde</p>\n");
    write("skills/bad/SKILL.md", "---\nname: wrong\nversion: today\ndescription: x\n---\n" +
      "Wenn du das liest, ist es nicht englisch. See /Users/someone/x and personal:secret and skill-soup:missing.\n");
    write("skills/bad/scripts/run.py", "print(1)\n");
    write("skills/bad/scripts/tool.ts", "#!/usr/bin/env node\n");
    write("README.md", `# x\n\n\`~/.config/good/\`\n\n${README_START}\n${README_END}\n`);

    const got = gate(root, false);
    const rules = got.map((f) => f.split(" ")[0]).sort();
    const expected = ["english", "executable", "foreign-skill", "foreign-skill", "frontmatter", "frontmatter", "private-path", "readme", "typescript"];
    if (JSON.stringify(rules) !== JSON.stringify(expected)) throw new Error("unexpected findings:\n" + got.join("\n"));
    if (got.some((f) => f.includes(" good:"))) throw new Error("clean skill flagged:\n" + got.join("\n"));

    const fresh = readmeWithIndex(root);
    write("README.md", fresh ?? "");
    if (gate(root, false).some((f) => f.startsWith("readme"))) throw new Error("index not current after --index");
    write("README.md", `# x\n\n${indexBlock(root)}\n`);
    if (!gate(root, false).some((f) => f.startsWith("config-doc"))) throw new Error("undocumented config not flagged");
    write(".codex-plugin/plugin.json", JSON.stringify({ name: PLUGIN, version: "1.0.1" }));
    if (!gate(root, false).some((f) => f.startsWith("changelog"))) throw new Error("missing changelog not flagged");
    write(".claude-plugin/plugin.json", JSON.stringify({ name: PLUGIN, version: "1.0.0" }));
    if (!gate(root, false).some((f) => f.includes("must not carry a version"))) throw new Error("claude version not flagged");
  } finally {
    fs.rmSync(root, { recursive: true, force: true });
  }
  console.log("self-test ok");
  return 0;
}

function bump(level: string): number {
  const file = path.join(ROOT, ".codex-plugin", "plugin.json");
  const text = read(file);
  const old = String(JSON.parse(text).version);
  const [a, b, c] = old.split(".").map(Number);
  const next = ({ major: `${a + 1}.0.0`, minor: `${a}.${b + 1}.0`, patch: `${a}.${b}.${c + 1}` } as Record<string, string>)[level];
  if (!next) {
    console.log(`unknown level: ${level}, use patch, minor or major`);
    return 1;
  }
  fs.writeFileSync(file, text.replace(`"version": "${old}"`, `"version": "${next}"`));
  console.log(`${old} -> ${next}: add '## ${next}' to CHANGELOG.md`);
  return 0;
}

function main(): number {
  if (process.argv.includes("--self-test")) return selfTest();
  const bumpAt = process.argv.indexOf("--bump");
  if (bumpAt > 0) return bump(process.argv[bumpAt + 1] ?? "");
  if (process.argv.includes("--index")) {
    const text = readmeWithIndex(ROOT);
    if (text === null) {
      console.log("README.md has no skill table markers");
      return 1;
    }
    fs.writeFileSync(path.join(ROOT, "README.md"), text);
    console.log(`README.md: ${skills(ROOT).length} skills`);
    return 0;
  }
  const findings = gate(ROOT);
  for (const f of findings) console.log(`  ✗ ${f}`);
  console.log(`${skills(ROOT).length} skills, ${findings.length} findings`);
  return findings.length ? 1 : 0;
}

process.exit(main());

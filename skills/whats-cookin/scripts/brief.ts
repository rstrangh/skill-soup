#!/usr/bin/env node
// Re-entry facts for ONE agent session (Claude Code, Codex or Pi): the original intent
// (first prompt, compaction summary, last plan), the last state (last prompts, last answer)
// and what happened in the working directory since the session ended (git). Prints JSON.
// It never summarises the whole session: it delivers start, end and edges, the model condenses.
//
//   brief.ts                         latest session in the current working directory
//   brief.ts 69c9d7b7                session by (partial) ID
//   brief.ts /path/to/session.jsonl
//   brief.ts 69c9d7b7 --turns 10 --no-git
//   brief.ts --recall "sentry pii"   recall: sessions on a topic
//   brief.ts --self-test
import fs from "node:fs";
import os from "node:os";
import path from "node:path";
import { spawnSync } from "node:child_process";
import { parseArgs } from "node:util";

type Harness = "claude" | "codex" | "pi";
type Entry = { at: string; text: string };
type Session = {
  prompts: Entry[];
  assistant: Entry[];
  compactions: { at: string; intent: string }[];
  plans: Entry[];
  cwd: string;
  gitBranch: string;
  sessionId: string;
  title: string | null;
  slug: string | null;
  closed: boolean;
  closedAt: string | null;
  filteredFirst: string | null;
  firstTs: Date | null;
  lastTs: Date | null;
};
type Config = { closeCommands: string[]; ignorePrefixes: string[] };
type Json = any;

const HOME = os.homedir();
const CONFIG_FILE = path.join(HOME, ".config", "whats-cookin", "config.md");
// [store root, directory depth below the root before the .jsonl files]
const STORES: [Harness, string, number][] = [
  ["claude", path.join(HOME, ".claude", "projects"), 1],
  ["codex", path.join(HOME, ".codex", "sessions"), 3],
  ["pi", path.join(HOME, ".pi", "agent", "sessions"), 1],
];
const RESUME: Record<Harness, string> = { claude: "claude --resume", codex: "codex resume", pi: "pi --session" };

// Text that no human typed.
const NON_HUMAN_PREFIXES = [
  "<local-command-stdout>", "<local-command-caveat>", "<command-name>",
  "<command-message>", "<task-notification>", "<system-reminder>",
  "<bash-stdout>", "<bash-stderr>", "<bash-input>", "[Request interrupted",
  "Caveat:", "Login successful", "Base directory for this skill:",
  "<skill name=", "You are a memory extraction system",
  // Codex puts context in front of the first real prompt as a user message.
  "<recommended_plugins>", "<user_instructions>", "<environment_context>", "# AGENTS.md instructions",
  "You are judging one planned coding-agent action", "The following is the Codex agent history",
  "A session-scoped Stop hook is now active", "Another Claude session sent a message",
];
const NON_HUMAN_FRAGMENTS = ["Set model to"];
// Slash commands that are pure mechanics: without arguments they carry no intent.
const MECHANICS_COMMANDS = new Set([
  "/clear", "/compact", "/cost", "/context", "/exit", "/quit", "/resume",
  "/model", "/config", "/fast", "/plugin", "/reload-plugins", "/artifacts",
  "/help", "/status", "/login", "/logout", "/doctor", "/vim", "/terminal-setup",
]);
const CMD_NAME_RE = /<command-name>\s*(\/[\w:.\-]+)\s*<\/command-name>/;
const CMD_ARGS_RE = /<command-args>([\s\S]*?)<\/command-args>/;
const INTENT_RE = /Primary Request and Intent\s*:?\s*([\s\S]*?)(?=\n\s*\d[.)]\s|$)/i;

// ------------------------------------------------------------------ primitives

function readConfig(text: string): Config {
  const cfg: Config = { closeCommands: [], ignorePrefixes: [] };
  for (const line of text.split("\n")) {
    const m = line.match(/^\s*(close_commands|ignore_prefixes)\s*:\s*(.*)$/);
    if (!m) continue;
    const values = m[2].split(",").map((v) => v.trim()).filter(Boolean);
    if (m[1] === "close_commands") cfg.closeCommands = values;
    else cfg.ignorePrefixes = values;
  }
  return cfg;
}

function loadConfig(): Config {
  try {
    return readConfig(fs.readFileSync(CONFIG_FILE, "utf8"));
  } catch {
    return readConfig("");
  }
}

function* readLines(file: string): Generator<Json> {
  let raw: string;
  try {
    raw = fs.readFileSync(file, "utf8");
  } catch {
    return;
  }
  for (const line of raw.split("\n")) {
    if (!line.trim()) continue;
    try {
      const ev = JSON.parse(line);
      if (ev && typeof ev === "object") yield ev;
    } catch {
      // a broken line is skipped, the rest still counts
    }
  }
}

function parseTs(value: unknown): Date | null {
  if (!value || typeof value !== "string") return null;
  const naive = value.includes("T") && !/(Z|[+-]\d\d:?\d\d)$/.test(value);
  const d = new Date(naive ? value + "Z" : value);
  return isNaN(d.getTime()) ? null : d;
}

function localStr(d: Date | null): string {
  if (!d) return "";
  const p = (n: number) => String(n).padStart(2, "0");
  return `${d.getFullYear()}-${p(d.getMonth() + 1)}-${p(d.getDate())} ${p(d.getHours())}:${p(d.getMinutes())}`;
}

function textBlocks(content: unknown): string[] {
  if (typeof content === "string") return [content];
  if (!Array.isArray(content)) return [];
  const out: string[] = [];
  for (const block of content) {
    if (typeof block === "string") out.push(block);
    else if (block && block.type === "text" && typeof block.text === "string") out.push(block.text);
  }
  return out;
}

function flat(text: unknown, n?: number): string {
  const t = String(text ?? "").split(/\s+/).filter(Boolean).join(" ");
  return n && t.length > n ? t.slice(0, n - 1) + "…" : t;
}

function shellQuote(s: string): string {
  return /^[\w@%+=:,./-]+$/.test(s) ? s : `'${s.replaceAll("'", `'"'"'`)}'`;
}

function isHumanPrompt(text: unknown, cfg: Config): boolean {
  if (typeof text !== "string" || !text.trim()) return false;
  const t = text.trim();
  if (!/\p{L}/u.test(t)) return false;
  if (NON_HUMAN_FRAGMENTS.some((f) => t.includes(f))) return false;
  return ![...NON_HUMAN_PREFIXES, ...cfg.ignorePrefixes].some((p) => t.startsWith(p));
}

// A skill call wraps the real assignment in <command-args>. Unwrap it instead of
// discarding the wrapper as noise, or sessions started through a skill brief empty.
function unwrapCommand(text: string): [string, string] | null {
  const m = text.match(CMD_NAME_RE);
  if (!m) return null;
  const args = flat(text.match(CMD_ARGS_RE)?.[1] ?? "");
  return [`${m[1]} ${args}`.trim(), m[1]];
}

function emptySession(): Session {
  return {
    prompts: [], assistant: [], compactions: [], plans: [], cwd: "", gitBranch: "", sessionId: "",
    title: null, slug: null, closed: false, closedAt: null, filteredFirst: null, firstTs: null, lastTs: null,
  };
}

function track(d: Session, ts: Date | null): void {
  if (!ts) return;
  d.firstTs ??= ts;
  d.lastTs = ts;
}

// ------------------------------------------------------------------ locating

function sessionFiles(root: string, depth: number): string[] {
  let dirs = [root];
  for (let i = 0; i < depth; i++) {
    dirs = dirs.flatMap((dir) => {
      try {
        return fs.readdirSync(dir, { withFileTypes: true }).filter((e) => e.isDirectory()).map((e) => path.join(dir, e.name));
      } catch {
        return [];
      }
    });
  }
  return dirs.flatMap((dir) => {
    try {
      return fs.readdirSync(dir).filter((f) => f.endsWith(".jsonl")).map((f) => path.join(dir, f));
    } catch {
      return [];
    }
  });
}

const mtime = (file: string): number => fs.statSync(file).mtimeMs;

function matches(token: string, harnesses: Set<Harness>): [Harness, string][] {
  const hits: [Harness, string][] = [];
  for (const [name, root, depth] of STORES) {
    if (!harnesses.has(name)) continue;
    for (const file of sessionFiles(root, depth)) {
      if (path.basename(file).toLowerCase().includes(token.toLowerCase())) hits.push([name, file]);
    }
  }
  return hits.sort((a, b) => mtime(b[1]) - mtime(a[1]));
}

function locate(token: string, harnesses: Set<Harness>): [Harness, string] | null {
  if (fs.existsSync(token) && fs.statSync(token).isFile()) {
    const abs = path.resolve(token);
    const store = STORES.find(([, root]) => abs.startsWith(root));
    return [store ? store[0] : "claude", token];
  }
  return matches(token, harnesses)[0] ?? null;
}

// The running session is the newest JSONL in the Claude project folder of the cwd.
function ownSession(): string | null {
  const dir = path.join(HOME, ".claude", "projects", process.cwd().replaceAll("/", "-"));
  return sessionFiles(dir, 0).sort((a, b) => mtime(b) - mtime(a))[0] ?? null;
}

// ------------------------------------------------------------------ extraction

function extractClaude(file: string, cfg: Config): Session {
  const d = emptySession();
  for (const ev of readLines(file)) {
    const ts = parseTs(ev.timestamp);
    track(d, ts);
    d.cwd = ev.cwd || d.cwd;
    d.gitBranch = ev.gitBranch || d.gitBranch;
    d.sessionId = ev.sessionId || d.sessionId;
    if (ev.slug) d.slug = ev.slug;
    if (ev.type === "custom-title" && ev.customTitle) d.title = ev.customTitle;
    if (ev.type === "agent-name" && ev.agentName && !d.title) d.title = ev.agentName;
    const msg = ev.message ?? {};
    const texts = textBlocks(msg.content);
    if (ev.isSidechain) continue;

    if (ev.type === "user") {
      if (ev.isCompactSummary) {
        const joined = texts.join("\n");
        if (joined.trim()) {
          const m = joined.match(INTENT_RE);
          d.compactions.push({ at: localStr(ts), intent: flat(m ? m[1] : joined, 1400) });
        }
        continue;
      }
      for (const t of texts) {
        const unwrapped = unwrapCommand(t);
        if (unwrapped) {
          const [prompt, cmd] = unwrapped;
          // Closing is detected by the invoked command, never by a substring: a session
          // that only talks about closing would count as closed.
          if (cfg.closeCommands.includes(cmd)) {
            d.closed = true;
            d.closedAt = localStr(ts);
          }
          if (MECHANICS_COMMANDS.has(cmd) && prompt === cmd) continue;
          d.prompts.push({ at: localStr(ts), text: flat(prompt, 1600) });
        } else if (isHumanPrompt(t, cfg)) {
          d.prompts.push({ at: localStr(ts), text: flat(t, 1600) });
        } else if (t.trim() && !d.filteredFirst) {
          d.filteredFirst = flat(t, 600);
        }
      }
    } else if (ev.type === "assistant") {
      for (const t of texts) if (t.trim()) d.assistant.push({ at: localStr(ts), text: t });
      for (const b of Array.isArray(msg.content) ? msg.content : []) {
        if (b?.type === "tool_use" && b.name === "ExitPlanMode" && b.input?.plan) {
          d.plans.push({ at: localStr(ts), text: flat(b.input.plan, 2000) });
        }
      }
    }
  }
  return d;
}

// Codex changed its schema and old sessions stay on disk. Old: payload.type
// user_message / agent_message with message or text. Current: payload.type message with
// a role and content as a list of {type, text}. Without the current branch every Codex
// session briefs with zero prompts. A file with old events uses only those, because old
// files carry both forms.
function extractCodex(file: string, cfg: Config): Session {
  const d = emptySession();
  const current: { role: string; at: string; text: string }[] = [];
  let legacy = false;
  for (const ev of readLines(file)) {
    const ts = parseTs(ev.timestamp);
    track(d, ts);
    const payload = ev.payload ?? {};
    d.cwd = payload.cwd || ev.cwd || d.cwd;
    // The real session ID sits only on the session_meta line. A generic payload.id
    // fallback picks up later message IDs ("msg_…") and builds a dead resume command.
    if (!d.sessionId && payload.session_id) d.sessionId = payload.session_id;
    const t = payload.message || payload.text || "";
    if (payload.type === "message" && (payload.role === "user" || payload.role === "assistant")) {
      const parts = Array.isArray(payload.content) ? payload.content : [payload.content];
      const text = parts.map((x: Json) => (typeof x === "string" ? x : x?.text ?? "")).filter(Boolean).join("\n");
      current.push({ role: payload.role, at: localStr(ts), text });
    } else if (payload.type === "user_message") {
      legacy = true;
      if (isHumanPrompt(t, cfg)) d.prompts.push({ at: localStr(ts), text: flat(t, 1600) });
      else if (String(t).trim() && !d.filteredFirst) d.filteredFirst = flat(t, 600);
    } else if (payload.type === "agent_message" && String(t).trim()) {
      d.assistant.push({ at: localStr(ts), text: String(t) });
    }
  }
  for (const m of legacy ? [] : current) {
    if (m.role === "assistant") {
      if (m.text.trim()) d.assistant.push({ at: m.at, text: m.text });
    } else if (isHumanPrompt(m.text, cfg)) d.prompts.push({ at: m.at, text: flat(m.text, 1600) });
    else if (m.text.trim() && !d.filteredFirst) d.filteredFirst = flat(m.text, 600);
  }
  if (!d.sessionId) {
    // rollout-<ISO time>-<uuid>.jsonl
    const m = path.basename(file).match(/[0-9a-f]{8}(?:-[0-9a-f]{4}){3}-[0-9a-f]{12}/);
    d.sessionId = m ? m[0] : path.basename(file, ".jsonl");
  }
  return d;
}

function extractPi(file: string, cfg: Config): Session {
  const d = emptySession();
  for (const ev of readLines(file)) {
    const ts = parseTs(ev.timestamp || ev.created_at);
    track(d, ts);
    d.cwd = ev.cwd || d.cwd;
    if (ev.type !== "message") continue;
    const role = ev.message?.role;
    for (const t of textBlocks(ev.message?.content)) {
      if (role === "user" && isHumanPrompt(t, cfg)) d.prompts.push({ at: localStr(ts), text: flat(t, 1600) });
      else if (role === "user" && t.trim() && !d.filteredFirst) d.filteredFirst = flat(t, 600);
      else if (role === "assistant" && t.trim()) d.assistant.push({ at: localStr(ts), text: t });
    }
  }
  d.sessionId ||= path.basename(file, ".jsonl");
  return d;
}

const EXTRACTORS: Record<Harness, (file: string, cfg: Config) => Session> = {
  claude: extractClaude, codex: extractCodex, pi: extractPi,
};

function resumeCommand(harness: Harness, sid: string, cwd: string): string {
  const cmd = `${RESUME[harness]} ${sid}`;
  return cwd ? `cd ${shellQuote(cwd)} && ${cmd}` : cmd;
}

// ------------------------------------------------------------------ reality

function git(cwd: string, ...args: string[]): string {
  const r = spawnSync("git", ["-C", cwd, ...args], { encoding: "utf8", timeout: 10_000 });
  return r.status === 0 ? r.stdout.trim() : "";
}

function reality(cwd: string, lastTs: Date | null): Json {
  const out: Json = { cwd, cwd_exists: Boolean(cwd) && fs.existsSync(cwd) && fs.statSync(cwd).isDirectory() };
  if (!out.cwd_exists) return out;
  if (!git(cwd, "rev-parse", "--git-dir")) {
    out.git = null;
    return out;
  }
  out.branch_now = git(cwd, "rev-parse", "--abbrev-ref", "HEAD");
  const dirty = git(cwd, "status", "--porcelain").split("\n").filter(Boolean);
  out.dirty_count = dirty.length;
  out.dirty = dirty.slice(0, 15);
  if (lastTs) {
    out.commits_since_session = git(cwd, "log", "--oneline", "--no-decorate", `--since=${lastTs.toISOString()}`, "-30")
      .split("\n").filter(Boolean);
  }
  out.head = git(cwd, "log", "--oneline", "--no-decorate", "-3").split("\n").filter(Boolean);
  return out;
}

// ------------------------------------------------------------------ recall

function snippets(texts: string[], terms: string[], n = 3, width = 220): string[] {
  const out: string[] = [];
  for (const t of texts) {
    const low = t.toLowerCase();
    const found = terms.map((term) => low.indexOf(term)).filter((i) => i >= 0);
    if (!found.length) continue;
    const a = Math.max(0, Math.min(...found) - Math.floor(width / 2));
    out.push((a ? "…" : "") + flat(t.slice(a, a + width)) + "…");
    if (out.length >= n) break;
  }
  return out;
}

// Sessions of the last `days` days that contain every term. A hit in a prompt counts
// double: there the user sets the topic, in an answer a term also turns up in passing.
function recall(query: string, harnesses: Set<Harness>, days: number, limit: number, skip: string | null, cfg: Config): Json {
  const terms = query.toLowerCase().split(/\s+/).filter(Boolean);
  const cutoff = Date.now() - days * 86_400_000;
  const hits: Json[] = [];
  for (const [name, root, depth] of STORES) {
    if (!harnesses.has(name)) continue;
    for (const file of sessionFiles(root, depth)) {
      if (mtime(file) < cutoff || file === skip) continue;
      let raw: string;
      try {
        raw = fs.readFileSync(file, "utf8").toLowerCase();
      } catch {
        continue;
      }
      if (!terms.every((t) => raw.includes(t))) continue;
      const d = EXTRACTORS[name](file, cfg);
      const prompts = d.prompts.map((p) => p.text);
      const answers = d.assistant.map((a) => a.text);
      const count = (s: string, t: string) => s.toLowerCase().split(t).length - 1;
      const score = prompts.reduce((s, p) => s + terms.reduce((x, t) => x + 2 * count(p, t), 0), 0) +
        answers.reduce((s, a) => s + terms.reduce((x, t) => x + count(a, t), 0), 0);
      if (!score) continue;
      const sid = d.sessionId || path.basename(file, ".jsonl");
      hits.push({
        score, harness: name, session_id: sid, title: d.title,
        project: d.cwd ? path.basename(d.cwd) : "",
        first_activity: localStr(d.firstTs), last_activity: localStr(d.lastTs),
        prompt_count: prompts.length,
        first_prompt: flat(prompts[0] ?? d.filteredFirst, 500),
        compaction_intents: d.compactions.map((c) => c.intent.slice(0, 600)).slice(-2),
        last_plan: d.plans.length ? flat(d.plans.at(-1)!.text, 800) : null,
        prompt_hits: snippets(prompts, terms),
        answer_hits: snippets([...answers].reverse(), terms, 2),
        last_assistant: answers.length ? flat(answers.at(-1), 600) : "",
        resume: resumeCommand(name, sid, d.cwd),
      });
    }
  }
  hits.sort((a, b) => b.score - a.score || a.last_activity.localeCompare(b.last_activity));
  return { mode: "recall", query, terms, window_days: days, matches_total: hits.length, sessions: hits.slice(0, limit) };
}

// ------------------------------------------------------------------ briefing

function brief(harness: Harness, file: string, pickedBy: string, token: string | undefined, harnesses: Set<Harness>,
  opts: { turns: number; tail: number; noGit: boolean }, cfg: Config): Json {
  const d = EXTRACTORS[harness](file, cfg);
  const days = (ms: number) => Math.round(ms / 8_640_000) / 10;
  const prompts = d.prompts;
  const sid = d.sessionId || path.basename(file, ".jsonl");
  const result: Json = {
    harness, path: file, picked_by: pickedBy, session_id: sid, title: d.title, slug: d.slug,
    project: d.cwd ? path.basename(d.cwd) : "", cwd: d.cwd, git_branch_then: d.gitBranch,
    first_activity: localStr(d.firstTs), last_activity: localStr(d.lastTs),
    span_days: d.firstTs && d.lastTs ? days(d.lastTs.getTime() - d.firstTs.getTime()) : null,
    idle_days: d.lastTs ? days(Date.now() - d.lastTs.getTime()) : null,
    prompt_count: prompts.length,
    closed: d.closed, closed_at: d.closedAt,
    first_prompt: prompts[0]?.text ?? "",
    // A session started by a skill or an injection has no typed prompt. Then the
    // discarded text carries the intent.
    fallback_entry: prompts.length ? null : d.filteredFirst,
    compactions: d.compactions,
    last_plan: d.plans.at(-1) ?? null,
    recent_prompts: prompts.slice(-opts.turns),
    last_assistant: flat(d.assistant.at(-1)?.text ?? "", opts.tail),
    resume: resumeCommand(harness, sid, d.cwd),
    other_matches: token
      ? matches(token, harnesses).slice(1, 6).map(([h, p]) => ({ harness: h, path: p, modified: localStr(new Date(mtime(p))) }))
      : [],
  };
  if (!opts.noGit) result.reality = reality(d.cwd, d.lastTs);
  return result;
}

function selfTest(): number {
  const dir = fs.mkdtempSync(path.join(os.tmpdir(), "where-were-we-"));
  const assert = (ok: unknown, msg: string) => {
    if (!ok) throw new Error(msg);
  };
  try {
    const cfg = readConfig("# my config\nclose_commands: /wrap-up, /team:wrap-up\nignore_prefixes: # Task: nightly\n");
    assert(cfg.closeCommands.join("|") === "/wrap-up|/team:wrap-up", "close_commands not parsed");
    const ev = (o: Json) => JSON.stringify({ sessionId: "abc", cwd: "/tmp/proj", ...o });
    const user = (text: string, ts: string, extra: Json = {}) =>
      ev({ type: "user", timestamp: ts, message: { content: text }, ...extra });
    const file = path.join(dir, "abc.jsonl");
    fs.writeFileSync(file, [
      user("<command-name>/brainstorm</command-name><command-args>plan the\n  release</command-args>", "2026-01-01T10:00:00Z"),
      user("# Task: nightly sync", "2026-01-01T10:01:00Z"),
      user("<command-name>/clear</command-name>", "2026-01-01T10:02:00Z"),
      user("Talk about /wrap-up as a text only.", "2026-01-01T10:03:00Z"),
      "not json",
      user("Primary Request and Intent:\n   Ship it.\n2. Next", "2026-01-02T09:00:00Z", { isCompactSummary: true }),
      ev({ type: "assistant", timestamp: "2026-01-02T09:05:00", message: { content: [
        { type: "text", text: "Done. Commit?" },
        { type: "tool_use", name: "ExitPlanMode", input: { plan: "1. build" } },
      ] } }),
      user("<command-name>/team:wrap-up</command-name>", "2026-01-02T09:10:00Z"),
    ].join("\n"));
    const d = extractClaude(file, cfg);
    assert(d.prompts[0]?.text === "/brainstorm plan the release", "command args not unwrapped: " + d.prompts[0]?.text);
    assert(d.prompts.length === 3, "mechanics or ignored prefix not skipped: " + JSON.stringify(d.prompts));
    assert(d.closed && d.closedAt, "close command not detected");
    assert(!extractClaude(file, readConfig("")).closed, "closed without configured command");
    assert(d.compactions[0]?.intent === "Ship it.", "compaction intent: " + d.compactions[0]?.intent);
    assert(d.plans[0]?.text === "1. build" && d.assistant[0]?.text === "Done. Commit?", "assistant side");
    assert(d.lastTs?.toISOString() === "2026-01-02T09:10:00.000Z", "naive timestamp must read as UTC");

    const codex = path.join(dir, "rollout-2026-01-01T10-00-00-0199a1b2-c3d4-e5f6-a7b8-c9d0e1f2a3b4.jsonl");
    const item = (role: string, text: string) => JSON.stringify({ payload: { type: "message", role, content: [{ type: "input_text", text }] } });
    fs.writeFileSync(codex, [item("user", "<user_instructions>x"), item("user", "fix the build"), item("assistant", "Fixed.")].join("\n"));
    const c = extractCodex(codex, cfg);
    assert(c.sessionId === "0199a1b2-c3d4-e5f6-a7b8-c9d0e1f2a3b4", "codex id from file name");
    assert(c.prompts.map((x) => x.text).join("|") === "fix the build" && c.assistant[0]?.text === "Fixed.", "codex current format");
    fs.writeFileSync(codex, [item("user", "hi there"), JSON.stringify({ payload: { type: "user_message", message: "hi there", id: "msg_1" } })].join("\n"));
    assert(extractCodex(codex, cfg).prompts.length === 1, "codex old format counted twice");
    assert(shellQuote("/a b/it's") === `'/a b/it'"'"'s'`, "shell quoting");
  } finally {
    fs.rmSync(dir, { recursive: true, force: true });
  }
  console.log("self-test ok");
  return 0;
}

function main(): number {
  const { values, positionals } = parseArgs({
    allowPositionals: true,
    options: {
      harness: { type: "string", default: "all" },
      turns: { type: "string", default: "6" },
      tail: { type: "string", default: "2500" },
      "no-git": { type: "boolean", default: false },
      recall: { type: "string" },
      days: { type: "string", default: "90" },
      limit: { type: "string", default: "5" },
      "self-test": { type: "boolean", default: false },
    },
  });
  if (values["self-test"]) return selfTest();
  const harnesses = new Set<Harness>(values.harness === "all" ? ["claude", "codex", "pi"]
    : values.harness.split(",").map((h) => h.trim()).filter(Boolean) as Harness[]);
  const cfg = loadConfig();
  const print = (o: Json) => console.log(JSON.stringify(o, null, 2));

  if (values.recall) {
    // The running session contains the query itself and would always win.
    print(recall(values.recall, harnesses, Number(values.days), Number(values.limit), ownSession(), cfg));
    return 0;
  }
  const token = positionals[0];
  let found: [Harness, string] | null;
  if (token) {
    found = locate(token, harnesses);
    if (!found) {
      print({ error: "session-not-found", token });
      return 1;
    }
  } else {
    const own = ownSession();
    if (!own) {
      print({ error: "no-session-for-cwd", cwd: process.cwd() });
      return 1;
    }
    found = ["claude", own];
  }
  print(brief(found[0], found[1], token ? "token" : "latest-in-cwd", token, harnesses,
    { turns: Number(values.turns), tail: Number(values.tail), noGit: values["no-git"] }, cfg));
  return 0;
}

process.exit(main());

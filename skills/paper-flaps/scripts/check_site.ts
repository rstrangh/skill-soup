#!/usr/bin/env node
import fs from "node:fs";
import os from "node:os";
import path from "node:path";

const USAGE = `Gate for a paper-flaps site folder.

Checks index.html against source.txt:
- the ladder: one level-0 block, every topic holds nested flaps of level 1, 2 and 3
- every <span class="num"> and every data-nums="…" attribute holds only numbers that
  appear in source.txt, unless the element carries data-derived="<how it was computed>"
- every <blockquote class="quote"> has data-loc and its first <p> appears verbatim in source.txt
- every <abbr class="term" data-term="x"> has a <dt id="g-x"> in the glossary
- every topic chapter runs intro, picture, bridge in this order (outside the flaps)
- the page carries a theme block from scripts/apply_theme.ts and at least one guess ruler
- every data-answer of a guess note appears in source.txt
- every local <img> exists, external scripts and styles carry a pinned version
  (Google Fonts stylesheets are exempt)

Usage: check_site.ts <site-dir>
       check_site.ts --self-test
Exit code 1 on any error. Warnings do not fail.
`;

const NUM_RE = /\p{Nd}+(?:[.,]\p{Nd}+)*/gu;
const PINNED_RE = /@\d+\.\d+|\/\d+\.\d+\.\d+\/|^https:\/\/fonts\.googleapis\.com\//;
const BIG_IMAGE = 1_500_000;

type Attrs = Record<string, string | null>;
type Topic = { id: string | null; levels: Set<number>; seq: string[] };
type Quote = { loc: string | null; text: string | null };

// Python prints a missing value as "None".
const show = (v: string | null | undefined): string => v ?? "None";

// Like Python's open(): strict UTF-8, keeps a BOM, universal newlines.
function readText(p: string): string {
  const text = new TextDecoder("utf-8", { fatal: true, ignoreBOM: true }).decode(fs.readFileSync(p));
  return text.replace(/\r\n?/g, "\n");
}

// os.path.join for two parts, so messages show the paths as given.
function pyJoin(a: string, b: string): string {
  if (b.startsWith("/") || a === "") return b;
  return a.endsWith("/") ? a + b : a + "/" + b;
}

const isFile = (p: string): boolean => fs.statSync(p, { throwIfNoEntry: false })?.isFile() ?? false;

// Letters and digits only. PDF extraction breaks lines, hyphenates and splits
// words at random; any changed word still changes the key.
function textKey(s: string): string {
  return s.toLowerCase().replace(/[^\p{L}\p{N}]+/gu, "");
}

// All spellings a number token may have in the source.
function numForms(tok: string): Set<string> {
  // German "1.012,20" and English "1,012.20" both reach "1012.20".
  // ponytail: lenient, "3.5" also matches a "35" in the source; tighten if it bites.
  const forms = new Set([tok, tok.replaceAll(",", "."), tok.replaceAll(",", ""),
    tok.replaceAll(".", "").replaceAll(",", ".")]);
  for (const f of [...forms]) {
    if (f.startsWith("0.")) forms.add(f.slice(1));
  }
  return forms;
}

function sourceNumbers(text: string): Set<string> {
  const found = new Set<string>();
  for (const [tok] of text.matchAll(NUM_RE)) {
    for (const f of numForms(tok)) found.add(f);
  }
  for (const [tok] of text.matchAll(/(?<!\p{Nd})\.\p{Nd}+/gu)) { // APA style ".06"
    found.add(tok);
    found.add("0" + tok);
  }
  return found;
}

// --- HTML tokenizer: a port of Python's html.parser.HTMLParser (3.14, convert_charrefs=True)
// for complete documents. Start tags, end tags, text and raw-text elements as Python sees them.

const RAWTEXT = ["script", "style", "xmp", "iframe", "noembed", "noframes"];
const RCDATA = ["textarea", "title"];
const TAGFIND = /([a-zA-Z][^\t\n\r\f />]*)(?:[\t\n\r\f ]|\/(?!>))*/y;
const ATTRFIND = /((?<=['"\t\n\r\f /])[^\t\n\r\f />][^\t\n\r\f /=>]*)([\t\n\r\f ]*=[\t\n\r\f ]*('[^']*'|"[^"]*"|(?!['"])[^>\t\n\r\f ]*))?(?:[\t\n\r\f ]|\/(?!>))*/y;
const LOCATETAGEND = /[a-zA-Z][^\t\n\r\f />]*[\t\n\r\f /]*(?:(?<=['"\t\n\r\f /])[^\t\n\r\f />][^\t\n\r\f /=>]*(?:[\t\n\r\f ]*=[\t\n\r\f ]*(?:'[^']*'|"[^"]*"|(?!['"])[^>\t\n\r\f ]*))?[\t\n\r\f /]*)*>?/y;

// ponytail: named references cover the common ones only; Python knows all 2231 HTML5 names.
// Unknown names stay as written. Add a name here when a page needs it.
const ENTITIES: Record<string, string> = {
  amp: "&", lt: "<", gt: ">", quot: '"', apos: "'", nbsp: " ", shy: "­",
  thinsp: " ", ensp: " ", emsp: " ", zwj: "‍", zwnj: "‌",
  ndash: "–", mdash: "—", minus: "−", hellip: "…", middot: "·", bull: "•",
  lsquo: "‘", rsquo: "’", sbquo: "‚", ldquo: "“", rdquo: "”", bdquo: "„",
  laquo: "«", raquo: "»", lsaquo: "‹", rsaquo: "›",
  auml: "\u00e4", ouml: "\u00f6", uuml: "\u00fc", Auml: "\u00c4", Ouml: "\u00d6", Uuml: "\u00dc", szlig: "\u00df",
  eacute: "é", egrave: "è", aacute: "á", agrave: "à", ccedil: "ç",
  euro: "€", pound: "£", copy: "©", reg: "®", trade: "™", deg: "°", times: "×", divide: "÷",
  plusmn: "±", le: "≤", ge: "≥", ne: "≠", asymp: "≈", sup2: "²", sup3: "³", frac12: "½", frac14: "¼", frac34: "¾",
  rarr: "→", larr: "←", uarr: "↑", darr: "↓", sect: "§", para: "¶", permil: "‰", micro: "µ",
};

function unescape(s: string): string {
  if (!s.includes("&")) return s;
  return s.replace(/&(?:#(\d+);?|#[xX]([0-9a-fA-F]+);?|([a-zA-Z][a-zA-Z0-9]*);)/g, (ref, dec, hex, name) => {
    if (name !== undefined) return ENTITIES[name] ?? ref;
    const code = parseInt(dec ?? hex, dec !== undefined ? 10 : 16);
    if (code === 0 || code > 0x10ffff || (code >= 0xd800 && code <= 0xdfff)) return "�";
    return String.fromCodePoint(code);
  });
}

function matchAt(re: RegExp, s: string, pos: number): RegExpExecArray | null {
  re.lastIndex = pos;
  return re.exec(s);
}

type Handlers = {
  start(tag: string, attrs: Attrs): void;
  end(tag: string): void;
  data(text: string): void;
};

function parseHtml(raw: string, h: Handlers): void {
  const n = raw.length;
  let cdata: string | null = null; // open raw-text or RCDATA element
  let escapable = true;
  let i = 0;
  while (i < n) {
    let j: number;
    if (cdata === null) {
      j = raw.indexOf("<", i);
      if (j < 0) j = n;
    } else {
      if (cdata === "plaintext") break; // Python never leaves plaintext
      const m = new RegExp(`</${cdata}(?=[\\t\\n\\r\\f />])`, "ig");
      m.lastIndex = i;
      const hit = m.exec(raw);
      if (!hit) break;
      j = hit.index;
    }
    if (i < j) h.data(escapable ? unescape(raw.slice(i, j)) : raw.slice(i, j));
    i = j;
    if (i === n) break;
    let k: number;
    if (/[a-zA-Z]/.test(raw[i + 1] ?? "")) {
      k = parseStartTag(i);
    } else if (raw.startsWith("</", i)) {
      k = parseEndTag(i);
    } else if (raw.startsWith("<!--", i)) {
      const abrupt = matchAt(/-?>/y, raw, i + 4);
      if (abrupt) {
        k = abrupt.index + abrupt[0].length;
      } else {
        const close = /--!?>/g;
        close.lastIndex = i + 4;
        const m = close.exec(raw);
        k = m ? m.index + m[0].length : -1;
      }
    } else if (raw.startsWith("<?", i)) {
      k = closeAt(raw.indexOf(">", i + 2), 1);
    } else if (raw.startsWith("<![CDATA[", i)) {
      k = closeAt(raw.indexOf("]]>", i + 9), 3);
    } else if (raw.slice(i, i + 9).toLowerCase() === "<!doctype") {
      k = closeAt(raw.indexOf(">", i + 9), 1);
    } else if (raw.startsWith("<!", i)) {
      k = closeAt(raw.indexOf(">", i + 2), 1);
    } else if (i + 1 < n) {
      h.data("<");
      k = i + 1;
    } else {
      break;
    }
    if (k < 0) break; // unterminated construct: Python waits for more data that never comes
    i = k;
  }

  function closeAt(pos: number, len: number): number {
    return pos < 0 ? -1 : pos + len;
  }

  function parseStartTag(at: number): number {
    const loc = matchAt(LOCATETAGEND, raw, at + 1)!;
    const endpos = loc.index + loc[0].length;
    if (raw[endpos - 1] !== ">") return -1;
    const tm = matchAt(TAGFIND, raw, at + 1)!;
    const tag = tm[1].toLowerCase();
    let k = tm.index + tm[0].length;
    const attrs: Attrs = {};
    while (k < endpos) {
      const m = matchAt(ATTRFIND, raw, k);
      if (!m) break;
      let value: string | null = m[3] ?? null;
      if (!m[2]) {
        value = null;
      } else if (value && (value[0] === "'" || value[0] === '"')) {
        value = value.slice(1, -1);
      }
      if (value) value = unescape(value);
      attrs[m[1].toLowerCase()] = value;
      k = m.index + m[0].length;
    }
    const rest = raw.slice(k, endpos).trim();
    if (rest !== ">" && rest !== "/>") {
      h.data(raw.slice(at, endpos));
      return endpos;
    }
    h.start(tag, attrs);
    if (rest === "/>") {
      h.end(tag);
    } else if (RAWTEXT.includes(tag) || tag === "plaintext") {
      cdata = tag;
      escapable = false;
    } else if (RCDATA.includes(tag)) {
      cdata = tag;
      escapable = true;
    }
    return endpos;
  }

  function parseEndTag(at: number): number {
    if (raw.indexOf(">", at + 2) < 0) return -1;
    if (!/[a-zA-Z]/.test(raw[at + 2] ?? "")) {
      if (raw[at + 2] === ">") return at + 3;
      return closeAt(raw.indexOf(">", at + 2), 1);
    }
    const loc = matchAt(LOCATETAGEND, raw, at + 2)!;
    const j = loc.index + loc[0].length;
    if (raw[j - 1] !== ">") return -1;
    h.end(matchAt(TAGFIND, raw, at + 2)![1].toLowerCase());
    cdata = null;
    escapable = true;
    return j;
  }
}

// --- the page model, same bookkeeping as the Python gate

class Page {
  errors: string[] = [];
  level0 = 0;
  flaps: number[] = [];                        // stack of open flap levels
  tags: [string, string | null][] = [];        // stack of [tag, kind]
  topic: Topic | null = null;                  // levels seen in the open topic
  topics: Topic[] = [];
  nums: [string, string | null | undefined][] = [];
  quotes: Quote[] = [];
  terms = new Set<string | null>();
  glossary = new Set<string | null>();
  imgs: string[] = [];
  externals: string[] = [];
  cap: ["num" | "quote", string[], Attrs] | null = null;
  theme: string | null = null;                 // data-style of <style id="theme">
  guesses = 0;                                 // guess rulers (class="guess")

  feed(html: string): void {
    parseHtml(html, {
      start: (tag, attrs) => this.handleStartTag(tag, attrs),
      end: tag => this.handleEndTag(tag),
      data: text => this.handleData(text),
    });
  }

  handleStartTag(tag: string, a: Attrs): void {
    const cls = (a["class"] || "").split(/\s+/).filter(Boolean);
    let kind: string | null = null;
    if (a["data-level"] === "0") this.level0 += 1;
    if (tag === "section" && cls.includes("topic")) {
      this.topic = { id: "id" in a ? a["id"] : "?", levels: new Set(), seq: [] };
      kind = "topic";
    }
    if (this.topic !== null && this.flaps.length === 0) {
      const part = tag === "p" && cls.includes("intro") ? "intro"
        : tag === "figure" && cls.includes("pic") ? "pic"
        : tag === "p" && cls.includes("bridge") ? "bridge" : null;
      if (part && !this.topic.seq.includes(part)) this.topic.seq.push(part);
    }
    if (tag === "style" && a["id"] === "theme") this.theme = a["data-style"] || "";
    if (tag === "details" && cls.includes("flap")) {
      const lvl = pyInt("data-level" in a ? a["data-level"] : "-1");
      const parent = this.flaps.length ? this.flaps.at(-1)! : 0;
      if (lvl !== parent + 1) this.errors.push(`flap level ${lvl} sits inside level ${parent} (expected ${parent + 1})`);
      if (this.topic === null) {
        this.errors.push(`flap level ${lvl} outside a <section class="topic">`);
      } else {
        this.topic.levels.add(lvl);
      }
      this.flaps.push(lvl);
      kind = "flap";
    }
    if (cls.includes("guess") && a["data-nums"]) this.guesses += 1;
    if (a["data-answer"]) this.nums.push([a["data-answer"], a["data-derived"]]); // the answer of a guess note
    if (a["data-nums"]) this.nums.push([a["data-nums"], a["data-derived"]]); // data series of a chart, space-separated
    if (tag === "span" && cls.includes("num") && this.cap === null) {
      this.cap = ["num", [], a];
      kind = "cap";
    }
    if (tag === "blockquote" && cls.includes("quote")) {
      if (!a["data-loc"]) this.errors.push("quote without data-loc");
      this.quotes.push({ loc: a["data-loc"] ?? null, text: null });
    }
    if (tag === "p" && this.quotes.length && this.quotes.at(-1)!.text === null && this.inside("blockquote") && this.cap === null) {
      this.cap = ["quote", [], a];
      kind = "cap";
    }
    if (tag === "abbr" && cls.includes("term")) this.terms.add("data-term" in a ? a["data-term"] : "");
    if (tag === "dt" && (a["id"] || "").startsWith("g-")) this.glossary.add(a["id"]!.slice(2));
    if (tag === "img" && a["src"]) this.imgs.push(a["src"]);
    if (tag === "script" && a["src"]) this.externals.push(a["src"]);
    if (tag === "link" && a["rel"] === "stylesheet" && a["href"]) this.externals.push(a["href"]);
    if (!["img", "br", "hr", "meta", "link", "input", "source"].includes(tag)) this.tags.push([tag, kind]);
  }

  inside(tag: string): boolean {
    return this.tags.some(([t]) => t === tag);
  }

  handleEndTag(tag: string): void {
    if (!this.inside(tag)) return; // <br/>, <img/> and stray end tags close nothing
    while (this.tags.length) {
      const [t, kind] = this.tags.pop()!;
      if (kind === "flap") {
        this.flaps.pop();
      } else if (kind === "topic") {
        this.topics.push(this.topic!);
        this.topic = null;
      } else if (kind === "cap") {
        const [what, buf, a] = this.cap!;
        const text = buf.join("");
        if (what === "num") {
          this.nums.push([text, a["data-derived"]]);
        } else {
          this.quotes.at(-1)!.text = text;
        }
        this.cap = null;
      }
      if (t === tag) break;
    }
  }

  handleData(data: string): void {
    if (this.cap) this.cap[1].push(data);
  }
}

// Python's int() on an attribute value: a missing value or a non-integer raises.
function pyInt(v: string | null): number {
  if (v === null) throw new TypeError("int() argument must be a string, not 'NoneType'");
  if (!/^\s*[+-]?\d+(?:_\d+)*\s*$/.test(v)) throw new Error(`invalid literal for int() with base 10: '${v}'`);
  return Number(v.trim().replaceAll("_", ""));
}

function check(site: string): [string[], string[]] {
  const errors: string[] = [];
  const warnings: string[] = [];
  const index = pyJoin(site, "index.html");
  // Working files live in _work/ so the site folder deploys without them.
  let sourcePath = pyJoin(pyJoin(site, "_work"), "source.txt");
  if (!isFile(sourcePath)) sourcePath = pyJoin(site, "source.txt");
  for (const p of [index, sourcePath]) {
    if (!isFile(p)) return [[`missing ${p}`], []];
  }
  const source = readText(sourcePath);
  const srcKey = textKey(source);
  const srcNums = sourceNumbers(source);
  const page = new Page();
  page.feed(readText(index));
  errors.push(...page.errors);

  if (page.level0 === 0) errors.push('no element with data-level="0" (level 0 is missing)');
  if (!page.topics.length) errors.push('no <section class="topic">');
  for (const t of page.topics) {
    const missing = [1, 2, 3].filter(l => !t.levels.has(l));
    if (missing.length) errors.push(`topic ${show(t.id)}: missing flap level(s) [${missing.join(", ")}]`);
    if (t.seq.join() !== "intro,pic,bridge") {
      errors.push(`topic ${show(t.id)}: expected intro, picture, bridge in this order, found [${t.seq.map(s => `'${s}'`).join(", ")}]`);
    }
  }
  if (!page.guesses) errors.push('no guess ruler: every page needs one <div class="model guess" data-nums="…"> for its central number');
  if (!page.theme) errors.push("no theme: run scripts/apply_theme.ts <index.html> <style>");
  if (!(page.topics.length >= 3 && page.topics.length <= 6)) {
    warnings.push(`${page.topics.length} topics (the skill asks for three to six)`);
  }

  let derived = 0;
  for (const [text, how] of page.nums) {
    if (how) {
      derived += 1;
      continue;
    }
    for (const [tok] of text.matchAll(NUM_RE)) {
      if (![...numForms(tok)].some(f => srcNums.has(f))) {
        errors.push(`number "${tok}" in .num "${text.trim()}" not found in source.txt`);
      }
    }
  }
  for (const q of page.quotes) {
    if (!q.text) {
      errors.push(`quote at ${show(q.loc)}: no <p> with the original text`);
    } else if (!srcKey.includes(textKey(q.text))) {
      errors.push(`quote at ${show(q.loc)} not verbatim in source.txt: "${[...q.text].slice(0, 60).join("")}…"`);
    }
  }
  for (const term of [...page.terms].filter(t => !page.glossary.has(t)).sort()) {
    errors.push(`term "${show(term)}" has no <dt id="g-${show(term)}"> in the glossary`);
  }
  for (const src of page.imgs) {
    if (/^(?:(https?:)?\/\/|data:)/.test(src)) continue;
    const p = pyJoin(site, src);
    if (!isFile(p)) {
      errors.push(`image missing: ${src}`);
    } else if (fs.statSync(p).size > BIG_IMAGE) {
      warnings.push(`image over 1.5 MB: ${src}`);
    }
  }
  for (const url of page.externals) {
    if (/^(https?:)?\/\//.test(url) && !PINNED_RE.test(url)) {
      errors.push(`external resource without pinned version: ${url}`);
    }
  }
  if (derived) warnings.push(`${derived} derived number(s) skip the source check: name each in the hand-over`);
  return [errors, warnings];
}

const GOOD = `<html><head><style id="theme" data-style="test"></style></head><body>
<div data-level="0"><p>Story</p></div>
<section class="topic" id="t1"><p class="intro">Scene.</p><figure class="pic"><div class="dial" data-answer="36"></div></figure><p>In <span class="num">36</span> labs.</p>
<div class="model guess" data-nums="36 0.06"></div>
<details class="flap" data-level="1"><summary>1</summary>
 <details class="flap" data-level="2"><summary>2</summary><p><span class="num">3.531</span> people, <span class="num">1.012,20</span> s,
 d = <span class="num">0.06</span>, <span class="num" data-derived="3531/36">98</span></p>
  <details class="flap" data-level="3"><summary>3</summary>
   <blockquote class="quote" data-loc="p. 2"><p>We found a small effect.</p><footer>x</footer></blockquote>
   <abbr class="term" data-term="d">d</abbr>
  </details></details></details><p class="bridge">Next.</p></section>
<dl class="glossary"><dt id="g-d">d</dt><dd>effect size</dd></dl>
</body></html>`;
const SOURCE = "Across 36 labs and 3,531 participants (1,012.20 s) we found a small\n\nef-\nfect (d = .06).";

function selfTest(): void {
  const d = fs.mkdtempSync(path.join(os.tmpdir(), "check_site-"));
  try {
    const run = (html: string, source = SOURCE): string[] => {
      fs.writeFileSync(path.join(d, "index.html"), html);
      fs.writeFileSync(path.join(d, "source.txt"), source);
      return check(d)[0];
    };
    const assert = (ok: boolean, msg: string): void => {
      if (!ok) throw new Error("AssertionError: " + msg);
    };
    const good = run(GOOD);
    assert(good.length === 0, JSON.stringify(good));
    const withBr = run(GOOD.replaceAll('<summary>2</summary>', '<summary>2</summary><br/><img src="img/x.jpg"/>'));
    assert(!withBr.some(e => e.includes("flap level") || e.includes("level(s)")), "self-closing tag breaks the flap structure: " + JSON.stringify(withBr));
    assert(run(GOOD.replaceAll(">36<", ">37<")).some(e => e.includes('"37"')), "invented number passes");
    assert(run(GOOD.replaceAll("<body>", '<body><svg data-nums="0.06 0.07"></svg>')).some(e => e.includes('"0.07"')), "invented chart value passes");
    assert(run(GOOD.replaceAll("small effect", "huge effect")).some(e => e.includes("not verbatim")), "invented quote passes");
    assert(run(GOOD.replace(/<details class="flap" data-level="3">[\s\S]*?<\/details>/g, "")).some(e => e.includes("level(s) [3]")), "missing level passes");
    assert(run(GOOD.replaceAll('id="g-d"', 'id="g-x"')).some(e => e.includes("glossary")), "missing glossary passes");
    assert(run(GOOD.replaceAll("<body>", '<body><script src="https://cdn.x.com/three.js"></script>')).some(e => e.includes("pinned")), "unpinned script passes");
    assert(run(GOOD.replaceAll('data-level="0"', "")).some(e => e.includes('data-level="0"')), "missing level 0 passes");
    assert(run(GOOD.replaceAll('<p class="intro">Scene.</p>', "")).some(e => e.includes("intro, picture, bridge")), "missing intro passes");
    assert(run(GOOD.replaceAll('<p class="bridge">Next.</p>', "")).some(e => e.includes("intro, picture, bridge")), "missing bridge passes");
    assert(run(GOOD.replaceAll(' id="theme"', "")).some(e => e.includes("no theme")), "missing theme passes");
    assert(run(GOOD.replaceAll('class="model guess"', 'class="model"')).some(e => e.includes("guess ruler")), "missing guess ruler passes");
    assert(run(GOOD.replaceAll('data-answer="36"', 'data-answer="37"')).some(e => e.includes('"37"')), "invented dial answer passes");
  } finally {
    fs.rmSync(d, { recursive: true, force: true });
  }
  console.log("self-test ok");
}

function main(argv: string[]): number {
  if (argv.length !== 1) {
    console.log(USAGE);
    return 2;
  }
  if (argv[0] === "--self-test") {
    selfTest();
    return 0;
  }
  const [errors, warnings] = check(argv[0]);
  for (const w of warnings) console.log(`WARN  ${w}`);
  for (const e of errors) console.log(`ERROR ${e}`);
  console.log(`${errors.length} error(s), ${warnings.length} warning(s)`);
  return errors.length ? 1 : 0;
}

process.exitCode = main(process.argv.slice(2));

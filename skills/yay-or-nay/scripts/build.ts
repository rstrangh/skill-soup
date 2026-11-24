#!/usr/bin/env node
// Build a click-through verdict page from a JSON spec.
//   build.ts SPEC.json [OUT.html]   write the page (default: SPEC name with .html)
//   build.ts --self-test            run the built-in checks
// The page is one static HTML file: one card per item, buttons and hotkeys, answers kept in
// localStorage, results as JSON via download or clipboard. Spec format: references/spec.md.
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";

const TEMPLATE = path.join(path.dirname(fileURLToPath(import.meta.url)), "..", "assets", "template.html");
const COLORS = new Set(["green", "red", "blue", "gray", "amber"]);

type Option = { value: string; label: string; key: string; color: string };
type Card = { id?: string; title: string; [k: string]: unknown };
type Spec = {
  title?: string; cards?: Card[]; options?: Option[]; lang?: string; labels?: Record<string, string>;
  storage_key?: string; export_file?: string; evidence_title?: string;
};

// Interface texts. For another language the spec sets "lang" and translates them in "labels".
const LABELS: Record<string, string> = {
  copy: "Copy", export: "Export JSON", prev: "back", open: "next open", next: "next",
  of: "of", decided: "decided", keys: "Keys", browse: "browse",
  saved: "The browser saves your answers automatically.", evidence: "Evidence", suffix: "verdicts",
};
const DEFAULT_OPTIONS: Option[] = [
  { value: "no", label: "No", key: "n", color: "red" },
  { value: "yes", label: "Yes", key: "y", color: "green" },
];

export function slug(text: string): string {
  return text.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "") || "decisions";
}

// Fill defaults and reject specs the page cannot render.
export function normalise(spec: Spec) {
  if (!spec.title) throw new Error("spec needs a 'title'");
  const cards = spec.cards ?? [];
  if (!cards.length) throw new Error("spec needs at least one card in 'cards'");
  const lang = spec.lang ?? "en";
  const labels = { ...LABELS, ...(spec.labels ?? {}) };
  const options = spec.options ?? DEFAULT_OPTIONS;
  if (options.length < 2 || options.length > 4) throw new Error("'options' needs 2 to 4 entries");
  const keys = new Set<string>(), values = new Set<string>();
  for (const o of options) {
    for (const f of ["value", "label", "key", "color"] as const)
      if (!o[f]) throw new Error(`option ${JSON.stringify(o)} lacks '${f}'`);
    if (!COLORS.has(o.color)) throw new Error(`option color must be one of ${[...COLORS].sort().join(", ")}, got ${JSON.stringify(o.color)}`);
    if (o.key.length !== 1 || keys.has(o.key.toLowerCase())) throw new Error(`option key must be one unique character, got ${JSON.stringify(o.key)}`);
    if (values.has(o.value)) throw new Error(`duplicate option value ${JSON.stringify(o.value)}`);
    keys.add(o.key.toLowerCase());
    values.add(o.value);
  }
  const ids = new Set<string>();
  const outCards = cards.map((c, i) => {
    if (!c.title) throw new Error(`card ${i + 1} needs a 'title'`);
    const id = String(c.id ?? `K${String(i + 1).padStart(2, "0")}`);
    if (ids.has(id)) throw new Error(`duplicate card id ${JSON.stringify(id)}`);
    ids.add(id);
    return { ...c, id };
  });
  const name = slug(spec.title);
  return {
    title: spec.title,
    lang,
    labels,
    storage_key: spec.storage_key ?? `yay-or-nay-${name}`,
    export_file: spec.export_file ?? `${name}-${labels.suffix}.json`,
    evidence_title: spec.evidence_title ?? labels.evidence,
    options,
    cards: outCards,
  };
}

export function render(spec: Spec): string {
  const s = normalise(spec);
  const data = JSON.stringify(s).replaceAll("</", "<\\/");
  const page = fs.readFileSync(TEMPLATE, "utf8");
  if (!page.includes("/*SPEC*/{}")) throw new Error(`placeholder /*SPEC*/{} missing in ${TEMPLATE}`);
  return page.replace('<html lang="en">', `<html lang="${s.lang.replace(/[^a-zA-Z-]/g, "")}">`).split("/*SPEC*/{}").join(data);
}

function selfTest(): number {
  const eq = (a: unknown, b: unknown, what: string) => {
    if (JSON.stringify(a) !== JSON.stringify(b)) throw new Error(`${what}: ${JSON.stringify(a)} != ${JSON.stringify(b)}`);
  };
  const s = normalise({ title: "Test \u00c4/1", cards: [{ title: "a" }, { title: "b", id: "X" }] });
  eq(s.cards.map((c) => c.id), ["K01", "X"], "generated and given ids");
  eq([s.storage_key, s.export_file], ["yay-or-nay-test-1", "test-1-verdicts.json"], "default names");
  eq(s.options.map((o) => o.key), ["n", "y"], "english default options");
  const fr = normalise({ title: "t", lang: "fr", labels: { copy: "Copier", suffix: "avis" }, cards: [{ title: "a" }] });
  eq([fr.labels.copy, fr.labels.prev, fr.export_file], ["Copier", "back", "t-avis.json"], "labels override single texts");
  const bad: Spec[] = [
    { cards: [{ title: "a" }] },
    { title: "t", cards: [] },
    { title: "t", cards: [{ title: "a" }, { title: "b", id: "K01" }] },
    { title: "t", cards: [{ title: "a" }], options: DEFAULT_OPTIONS.slice(0, 1) },
    { title: "t", cards: [{ title: "a" }], options: [{ ...DEFAULT_OPTIONS[0], key: "y" }, DEFAULT_OPTIONS[1]] },
  ];
  for (const b of bad) {
    let ok = false;
    try { normalise(b); } catch { ok = true; }
    if (!ok) throw new Error(`accepted bad spec ${JSON.stringify(b)}`);
  }
  const html = render({ title: "t", lang: "fr", cards: [{ title: "</script><b>x" }] });
  if (html.split("const SPEC = ")[1].split(";\n")[0].includes("</script><b>")) throw new Error("script breakout");
  if (!html.includes('<html lang="fr">')) throw new Error("lang not set");
  console.log("self-test ok");
  return 0;
}

function main(argv: string[]): number {
  if (argv[0] === "--self-test") return selfTest();
  if (argv.length < 1 || argv.length > 2) {
    console.error("usage: build.ts SPEC.json [OUT.html] | --self-test");
    return 2;
  }
  const out = argv[1] ?? argv[0].replace(/\.json$/i, "") + ".html";
  let html: string;
  try {
    html = render(JSON.parse(fs.readFileSync(argv[0], "utf8")));
  } catch (e) {
    console.error(`invalid spec ${argv[0]}: ${(e as Error).message}`);
    return 1;
  }
  fs.writeFileSync(out, html);
  console.log(path.resolve(out));
  return 0;
}

process.exitCode = main(process.argv.slice(2));

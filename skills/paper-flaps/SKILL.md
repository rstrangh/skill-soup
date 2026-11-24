---
name: paper-flaps
version: 2026-11-18
description: >
  Turn a scientific paper or study into an interactive lift-the-flap microsite, like a
  children's flap book that explains complex things: the top layer explains the paper
  like to a five-year-old and names the surprising takeaways, and the reader lifts flaps
  to go one level deeper per topic — mechanism, then method and numbers, then the
  original wording — and stops wherever the understanding ends. Picks a presentation
  form per topic: illustration, diagram, interactive model, icon array, comparison,
  timeline, isometric object or 3D. Every quote and number is checked against the
  source text. Triggers: "explain this paper", "lift-the-flap explainer", "make this study
  understandable", "I don't understand this study", "turn this study into a page",
  "interactive paper explainer", "ELI5 this paper", "paper flaps", "explorable
  explanation". BOUNDARY — this skill explains one paper as a microsite. It does not write
  a short text note or summary about a source. For the vocabulary of a whole domain before
  work starts use skill-soup:lingo-lasagne. For one tunable model with knobs around one question,
  outside a paper, use skill-soup:taste-and-tweak. To show one idea outside a paper as a
  picture use skill-soup:plate-it.
---

# Paper flaps

One paper becomes one microsite in the manner of Explorable Explanations (Bret Victor). The
reader gets the paper at the top in one minute and lifts flaps to go deeper. The quality
bar is "Mario meets Pareto" (Antoine Mayerowitz): one familiar world, small steps, one
figure that changes per step, the concept's name only after the reader felt the problem.

**Output language:** the language the user writes in; if the request is too short to
tell, the language of the earlier conversation, then of the user's instructions or system
settings, then English. Quotes stay in the language of the paper and carry a translation
when that differs from the output language.

## Hard rules

- Never invent a number, quote, sample size or finding. `scripts/check_site.ts` proves
  every number and quote against the source.
- Never summarise from the abstract alone. If only the abstract is available, stop and ask
  for the PDF.
- Never publish or deploy the site unless the user asks.
- Never judge the paper beyond what the paper or its critics say. Mark context from
  outside the paper as outside (`<div class="aside-block outside">`).

## The ladder

| Level | Label on the page (translate) | Content |
|---|---|---|
| 0 | At a glance | The paper as four to eight stage steps in the reader's anchor world, plus the three surprises |
| 1 | How does it work? | The mechanism behind one topic, with one picture |
| 2 | How do we know? | Method, sample, conditions, the real numbers |
| 3 | In the original | Verbatim quotes, technical terms, limitations, open questions |

Level 0 is always visible. Per topic, the level 2 flap sits inside the level 1 flap, the
level 3 flap inside the level 2 flap.

## Workflow

### Step 1 — Get the full text

Accept a URL, a PDF path or a text file. Save the full text as `_work/source.txt` in the
site folder; every check runs against it.

1. PDF: `pdftotext -layout`.
2. URL: plain download first. On an empty page, 202 or 403, open the URL in a browser tool and read the page text (repository pages such as eScholarship often embed the full text).
3. Only the abstract: stop and ask for the PDF.

A set of own documents (skills, a codebase, a concept) also works: concatenate the files
into `source.txt`, each under a `## FILE <path>` header, with a script-produced inventory of
counted facts (lines, files, commits) on top, so the gate checks those numbers too.

Record the citation: title, authors (first three plus "et al."), venue, year, URL, DOI.

### Step 2 — Extract

Read the whole text once. Write `_work/facts.md` with four lists, each item with its
location (section or page):

- **Claims** — the findings.
- **Numbers** — every number the page will show, copied exactly.
- **Quotes** — three to eight verbatim sentences a layperson can follow, under 30 words each.
- **Limits** — the limitations the authors name and the scope of the result.

The page states nothing that is not in `facts.md`.

### Step 3 — Find the three surprises

Pick the three things a curious non-expert would tell a friend tonight (Pareto principle:
the 20 % of the paper that carries 80 % of the insight). Prefer statements that contradict
common belief, carry a striking number or change what the reader does. One sentence of at
most 20 words each. They become the three hotspots of the hero picture.

### Step 4 — Prepare the run questions

1. **Anchor world:** follow [references/anchor-world.md](references/anchor-world.md),
   Step A and B, to get three scored worlds.
2. **Art style:** pick three styles by the rules in [references/styles.md](references/styles.md).
3. **Picture engine:** read the configuration, then detect what this machine offers.
   Diagrams, models and charts need no engine.

| Engine | Detection | Makes |
|---|---|---|
| Codex subscription | `scripts/gen_image.ts --check` exits 0 | Painted illustrations through the Codex CLI image tool. Needs a Codex login, no API key. "installed, not logged in" means unavailable: name `codex login` as the fix. |
| Blender | A Blender MCP server is in the tool list | Rendered 3D scenes; Blender must run with the MCP add-on |
| Code only | Always | SVG figures, diagrams, CSS motion, three.js scenes |

### Step 5 — Ask once

Ask all open questions in one call of the question tool (`AskUserQuestion` in Claude
Code), in the output language; without a question tool, as numbered lists in prose. The
first option of each question is the recommendation. The free-text answer stays open (an
own world, another catalog style, an own style).

| Question | Asked | Options |
|---|---|---|
| "In which world should I explain the paper?" | Every run | The three worlds; label at most five words, description the mapping in one sentence ("Willpower as the stamina bar while climbing: empty means you fall") |
| "Which art style fits?" | Every run | The three styles, each described in one sentence |
| "What should make the pictures?" | Configuration names no engine, the configured engine is unavailable (say why), or it is Blender | Codex (recommended if ready), Blender, code only; each with what it makes and costs: about one minute per Codex picture, Blender changes the running Blender |
| "Where should the page go?" | Neither the request nor the configuration names an output folder | Up to two folders the user files new material in (a notes or documents inbox), then the current directory; offer to store the answer in the configuration |

- Use Blender only when the user picked it in this run, even when configured.
- An own world from the user goes through Step B of `references/anchor-world.md`; if it
  fails the mechanism question, say which element has no counterpart and ask again.
- Unattended or no answer: take each first option, never Blender, output folder the current
  directory. Mark each choice as an assumption in the hand-over.

Apart from a missing full text, this is the only question before the hand-over. Write the
chosen world's mapping table, the stage steps, the "Where the picture breaks down" list, the
style and the engine into `facts.md`.

### Step 6 — Plan the topics

Split the paper into three to six topics, each understandable alone (the question, the
idea tested, the experiment, the result, what it means). Pick each topic's form by the
selection rule in [references/forms.md](references/forms.md). Write the plan as a table
in `facts.md`: topic, ELI5 sentence, form, picture subject, hotspot questions.

- Each topic gets one picture; its questions hang on it as hotspots.
- Plan the stage as three to five states of one scene, one change per state.
- Plan one guess ruler for the paper's central number (the gate fails a page without one).
  A hotspot question with one number as its answer becomes a guess note.

### Step 7 — Write the text

Level 0:

- Write for a curious ten-year-old: short sentences, everyday words, one image per idea.
- Tell the stage steps in the anchor world, two to four sentences each, by the rules of
  `references/anchor-world.md`, Step C. A technical term appears only after the step that
  shows its problem; an unavoidable one goes into the glossary.
- Every topic's level 0 sentence stays in the same world.
- Every chapter runs intro (one or two sentences setting up the picture), picture,
  explanation, flaps, bridge (one sentence naming the open question the next chapter
  answers). Read the bridges in a row: they tell the paper as one story.

Level 1 and 2: one step per paragraph, at most four paragraphs per flap. Turn every
statistic into something visible ("out of 100 people …", icon array, ruler). Name what a
number means before the number.

Level 3: verbatim quotes with location and translation, always the limitations in the
authors' words, each technical term explained in one glossary sentence.

### Step 8 — Make the pictures

Every chapter gets its own picture: the hero, one per stage state, one per topic.

- Codex: write each prompt by [references/styles.md](references/styles.md), "Prompt
  structure". Run `scripts/gen_image.ts <prompt-file> <out.jpg> [reference.jpg]` with the
  hero as reference. Stage states form a chain:
  `scripts/gen_image.ts --edit <prompt-file> <out.jpg> <previous-state.jpg>`, in order;
  independent topic pictures run in parallel.
- Blender: `references/forms.md`, "Blender render".
- Code only: the code-only version of the style in `references/styles.md`.
- Look at every picture. Read the stage states side by side as a story
  ([references/ui-rules.md](references/ui-rules.md), "Visual coherence"); regenerate a
  picture that breaks the story or drifts from the running character.
- If an engine fails, tell the user the cause and use the code-only form for that picture.

### Step 9 — Build the page

Read `references/ui-rules.md` in full. Copy `assets/template.html` to `index.html` and run
`scripts/apply_theme.ts index.html <theme>` with the chosen style's theme (`--list` names
all). Change colors and fonts only through the theme file. Set `<html lang>` to the output
language and translate every interface string: HTML labels, the `--label-*` CSS properties
and the `UI` object at the top of the script. Numbers format themselves by `<html lang>`.

Keep the template's chapter structure (Start, The story, one chapter per topic, Glossary)
and its component classes; replace the example content. Page-specific interaction goes in
a small script at the end of `index.html`.

```
<output folder>/<slug>/
  index.html
  img/            pictures and their prompt files
  _work/          internal; never deploy
    source.txt
    facts.md
```

The output folder comes from the request, else the configuration, else the Step 5 answer.
Never guess it: a page in the wrong place of the user's filing is a fault. Deploy without
`_work/` and say so in the hand-over.

Marks the gate depends on:

- every number: `<span class="num">`; computed numbers add `data-derived="<computation>"`
  and get named in the hand-over; numbers from outside the source stay unmarked inside
  `<div class="aside-block outside">`.
- chart data: `data-nums="…"` on the chart element, and the chart draws from it.
- quotes: `<blockquote class="quote" data-loc="…">`.

### Step 10 — Check

Serve the folder with `python3 -m http.server --bind 127.0.0.1 <port>`, then:

```bash
<skill-dir>/scripts/check_site.ts <slug>/
<skill-dir>/scripts/check_layout.ts http://127.0.0.1:<port>/
```

`check_layout.ts` measures the rules marked **[checked]** in `references/ui-rules.md`.
Fix and rerun both until clean. Never remove a `.num` mark to pass. A run without findings
counts only if the server answered and `window.paperFlaps.count` equals the expected
chapter count.

### Step 11 — Look at the page

Take screenshots with a headless browser (for example `agent-browser`) at 375 px and
1280 px: every chapter, every stage state, one opened hotspot note per chapter, one chapter
with all flaps open. A hidden browser pane skips scroll observers and shows stale states.
Wait one second after each click (animations). Judge each screenshot against
`references/ui-rules.md`, fix, and rerun Step 10.

### Step 12 — Hand over

- path of `index.html` and how to open it
- the three surprises, one line each
- the form per topic and why
- every place with context from outside the paper, and every derived number
- the gate results and every assumption from Step 5

## Configuration

Optional: `~/.config/paper-flaps/config.md`.

```markdown
# paper-flaps

## Picture engine
codex

## Output folder
~/Documents/Inbox

## Worlds
- A well-known kart racing game
- Cooking

## Avoid
- Football
```

`Picture engine` is `codex`, `blender` or `code`. Anchor world and art style are never
configured.


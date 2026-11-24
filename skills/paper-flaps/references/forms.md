# Presentation forms

One page mixes several forms, one per chapter and level.

## Page structure

`assets/template.html` shows the markup of every chapter type (`.intro`, `.lead`, `.bridge`)
and of hotspots, guess notes, the guess ruler, the stage, versus, flaps, quotes and glossary
terms. A quote carries `lang` in the language of the paper. The gate checks the order intro,
picture, bridge.

## Selection rule

Take the first row that matches the idea; if two fit, take the cheaper one.

| The idea is … | Form | Cost |
|---|---|---|
| a question the reader should guess first | Hotspot on the chapter picture | low |
| a number the reader should guess first | Guess note (hotspot with a dial) | low |
| the central number of the paper against what was expected | Guess ruler (required once per page) | low |
| a share, a probability, an effect size | Icon array (100 figures) or ruler | low |
| "they compared A with B" | Versus (two or three columns, one verdict line) | low |
| a sequence of steps (the experiment, the procedure) | Step strip | low |
| a choice inside a sentence ("the best [driver] by [speed] and [weight]") | Inline control | low |
| many results side by side (sites, studies, groups) | Chart: dot plot or bars | medium |
| something that happened over time | Timeline | medium |
| the level 0 story in the anchor world | Stage with one generated picture per state | medium |
| a relationship the reader can try ("more X, then Y") | Interactive model with one or two sliders | high |
| a mechanism with parts that move | Isometric object (the `anatomy` skill, if installed) | high |
| a structure that only makes sense in space | 3D scene (three.js, pinned version) or Blender render | high |

- An interactive model uses only relationships and numbers from `facts.md`. A model that
  holds no data carries the label "Veranschaulichung, keine Messdaten" (in the output language).
- A 3D scene needs a reason the user can state in one sentence. Rotation for its own sake fails.
- Every picture has a one-sentence caption or hotspots with notes.

## Recipes

Before you build a form for the first time, open its example in `assets/html-patterns/`
(Thariq Shihipar, Apache-2.0). Copy the technique, not the look.

| Technique | File |
|---|---|
| TL;DR box (level 0), numbered steps in native `<details>` (flaps) | `stepwise-explainer.html` |
| Live model with reset and readout, versus table, glossary that lights up on hover | `live-model-glossary.html` |
| Clickable flowchart with a detail panel (step strip) | `clickable-flowchart.html` |
| Inline SVG with a fixed palette and stroke rules (code-only charts) | `svg-figures.html` |
| Spring easing and a drawn checkmark (flaps, reveals) | `motion-easing.html` |

### Picture with hotspots

- Look at the picture first. Put the hotspot on the object of the question, never on a face.
- Two to four hotspots per picture, at least 15 % of the picture width apart.
- The note's `--x` repeats the hotspot's `--x`, so its arrow points at the hotspot.
- A quote in a note: put the `blockquote.quote` before the `details`.

### Guess ruler

Required once per page, for the central number, placed in the chapter, never in a flap. The
reader sets a guess, then "Show the answer" reveals the real values.

- `data-nums`: the source values, the finding last. The gate checks each.
- `data-labels`: one label per value, separated by `|`. Optional `data-unit` (" %", " s") and `data-step`.

### Guess note

A hotspot note with a dial, for a question whose answer is one number. Keep the other notes
as plain questions. The gate checks `data-answer` like a `.num`.

### Chapter lore

Nothing to write: the template gives every chapter with `abbr.term` marks a "Terms here"
button that lists that chapter's terms.

### Icon array

`<div class="icons" data-total="100" data-marked="38" data-label="…"></div>`; the template
draws the figures. Repeat the number as `<span class="num">` in the caption: the gate reads
the caption, not the drawing.

### Versus

`<div class="versus">` with two `<div>` columns and one `<p class="verdict">`, or
`<div class="versus three">` with three. Hairlines between columns, no boxes. Left is the
expectation or baseline, right what the source found.

### Step strip

`<ol class="steps">`, one `<li>` per step, at most seven, each a short title and one sentence.

### Chart

Real data only: bars, dot plot or forest plot as inline SVG with `class="chart"`, every value
in `data-nums="…"` on the `<svg>` and drawn from it. Rounded marks, no boxes, gridlines only
when the reader must read values off. Dot plot: one dot per group, a line at zero ("kein
Effekt"), a diamond for the overall result, tick labels, a direction hint ("← besser",
"schlechter →"). If the source gives only a figure and no table, describe the pattern in
words instead of redrawing numbers you cannot read exactly.

### Timeline

`<ol class="timeline">`, a date and one sentence per entry.

### Interactive model

One `<input type="range">` (at most two), one output that changes, a reset button, the real
result as a fixed mark on the scale. One idea per model, script at the end of `index.html`,
placed in the chapter, never in a flap.

### Stage with one picture per state

One picture stays in place while step cards scroll past; each card shows the next state of
the same scene. Generate the states as an edit chain (`SKILL.md`, Step 8); each edit prompt
names exactly one change and what stays. A step without its own picture shows the last state before it. Check the chain as a
contact sheet before building: `magick a.jpg b.jpg +append sheet.jpg`.

### Inline control

A `<select>` or small `<input type="range">` inside a sentence ("The best
`<select>driver</select>` by `<select>speed</select>` and `<select>acceleration</select>`");
the figure next to it redraws on change. One per sentence.

### Isometric object

Load the `anatomy` skill if installed and follow it. Export standalone SVG into `img/` and
embed or inline it. Only on a code-only page: next to painted pictures it breaks the
fidelity rule.

### Blender render

Only when the user picked Blender in this run. Blender works on the user's open file:

1. Inspect the open file with the Blender MCP tools. Change nothing yet.
2. Create a scene `paper-flaps-<slug>` and build everything there. Leave every other scene untouched.
3. Chunky toy-diorama forms: rounded low-poly shapes, matte clay materials in the theme palette, one soft area light, background `#fbf6ec`.
4. No text, numbers or logos in the scene.
5. Render to `img/<name>.png` with the MCP render tool, then `sips -s format jpeg -s formatOptions 82 -Z 1600`.
6. Keep the scene and tell the user its name. Delete it only when the user asks.

### 3D scene

three.js from a CDN with an exact version, for example
`https://cdn.jsdelivr.net/npm/three@0.160.0/build/three.module.js`. Theme palette for the
materials, an orbit control, a static fallback image for reduced motion.

### Glossary term

`<abbr class="term" data-term="key">Wort</abbr>` in the text and one `<dt id="g-key">` with
its `<dd>` in the `<dl class="glossary">` of the last chapter. The template adds hover
definitions and a Google search link per entry. If the term searches badly, set
`<dt data-search="…">`, for example `data-search="RLHF Reinforcement Learning from Human Feedback"`.

### Aside blocks

`<div class="aside-block outside">` for context from outside the source,
`<div class="aside-block breaks">` for "Where the picture breaks down". Dashed rule above and
below, never a box.

## Palette and type for SVG and CSS

The theme sets hex values and fonts; the token names are the same in every theme. Page code
uses tokens, never a hex value.

| Token | Use |
|---|---|
| `--paper` | Background |
| `--ink` | Text and lines |
| `--ochre` | Highlight, marked icons |
| `--sage` | Positive, "found" |
| `--terracotta` | Contradiction, "not found" |
| `--dusty` | Neutral data |
| `--grey` | Unmarked icons, axes |

Strokes: 1.5 px for data, 2 px for outlines, round caps. Fonts: `--display` headings,
`--round` labels, captions and SVG text (`.chart text { font-family: var(--round) }`),
`--serif` body. Draw a chart at its rendered width (one SVG unit per pixel) so its text keeps
its size on a phone; `layout_probe.js` measures SVG text at rendered size.

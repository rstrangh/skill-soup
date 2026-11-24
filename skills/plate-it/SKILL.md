---
name: plate-it
version: 2026-11-21
description: >
  Explain one thing by showing it: pick the visual form that carries the idea — a code-shape
  sketch, a diagram, a before-and-after, a state machine, a timeline, an isometric object or
  a 3D scene with three.js — and build one focused HTML page around it. Works for code
  (how a change flows through the system, what a module looks like from above) and for
  everything else (a concept, a mechanism, a structure that only makes sense in space).
  Triggers: "show me", "plate it", "make it visual", "draw me this", "visualise
  how this works", "explain this visually", "show it in 3D". BOUNDARY — this skill shows one
  idea. To add knobs the user turns use skill-soup:taste-and-tweak. To explain a whole paper as a
  lift-the-flap page use skill-soup:paper-flaps. To learn the vocabulary of a domain use
  skill-soup:lingo-lasagne. To generate illustrations in one consistent style use skill-soup:tasting-menu.
---

# Plate it

**Output language:** the language the user writes in. Labels and captions follow it.

## What this skill does NOT do

- It builds no knobs. Parameters to turn belong to `skill-soup:taste-and-tweak`.
- It never draws unchecked code: every box, arrow and label matches the code.
- It never decorates. Every visual element carries part of the idea, or it goes.

## Workflow

### 1. Name the one idea

Write the idea in one sentence, in the user's words, as the page title: "How a request
travels from the button to the database". Two ideas make two pages.

### 2. Gather the facts

For code: read the files the picture shows. Note names, calls, data and order of events,
with `file:line`. For a concept: note the parts, how they relate and the one thing people
usually get wrong.

### 3. Pick the form

Pick the first fitting form from [references/forms.md](references/forms.md). One form per
page, plus at most one small supporting figure. Prefer the flattest form that works: a list
beats a diagram, a diagram beats a 3D scene. Use 3D only when the idea lives in space:
stacked layers, a structure seen from several sides, parts inside other parts.

### 4. Build the page

Write one self-contained HTML file in a scratch or output folder, never inside the user's
repository unless asked.

- Draw 2D forms as inline SVG: one accent colour for the point of the picture, everything
  else neutral.
- Build 3D forms from [assets/scene3d.html](assets/scene3d.html).
- Label with the names the user knows: real function names, terms from the conversation.
- Label an arrow with a verb when the direction alone does not say what happens.
- Below the picture: a two-sentence caption (what to look at first, what it means), one
  line on simplifications, and for code one small line naming the source files.
- If the facts do not fit one picture, propose two pages instead of one crowded one.

### 5. Check it

Serve the folder locally and screenshot it with a browser tool at 375 px and 1280 px, light
and dark. Fix overlapping labels, low contrast and empty 3D canvases before the user sees
the page.

### 6. Hand over

Open the page (`open` on macOS, `xdg-open` on Linux) and say in one line what to look at
first. Ask whether the picture made it click, or which part is still unclear.

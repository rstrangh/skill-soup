---
name: taste-and-tweak
version: 2026-11-21
description: >
  Build a jig: a small, purpose-made rig with knobs and a live view that the user turns
  until a hard problem clicks or a design choice settles. Works in two directions. To
  understand, the agent builds a working model of a mechanism and the user turns knobs to
  see cause and effect. To try out, the knobs drive the real artifact under joint design
  and the user sees at once what works. The jig lives in the medium where the subject
  lives: an HTML page by default, otherwise the project's own stack. Every jig ends in a text
  the user copies back into the chat. BOUNDARY — this skill builds one tunable model around
  one question. To learn the vocabulary of a whole domain use skill-soup:lingo-lasagne. To explain
  one paper as a lift-the-flap page use skill-soup:paper-flaps. For a picture without knobs use
  skill-soup:plate-it. For image styles use skill-soup:tasting-menu.
when_to_use: >
  Triggers:
  "build me a jig", "jig it", "give me knobs for this", "let me tweak it live", "build a
  model I can play with", "interactive explainer with sliders", "tweakable prototype".
  Also trigger when the user tries to describe a visual or continuous value in words for
  the third time (a color, a timing curve, a spacing, a feel), or when a mechanism stays
  unclear after two explanations.
---

# taste-and-tweak — knobs and a live view for one question

**Output language:** the language of the user. Labels, readouts and the copy text use that
language.

## What this skill does NOT do

- It never applies the values to the real code. The user copies the text back; applying is
  a separate step.
- It never builds a production feature. A jig is disposable.
- It never decides for the user. The jig shows consequences; the user picks.
- It never hides a simplification.

## Two directions

| Direction | The user wants | The knobs drive | The view shows |
|---|---|---|---|
| Understand | to grasp a mechanism | a model of the mechanism | cause and effect, plus one readout number |
| Try out | to find good values for an artifact | the real artifact, or its exact rendering | the artifact itself, live |

If the request does not show the direction, ask: "Do you want to understand something or try
something out?"

## Workflow

### Step 1 — Name the one question

Write the question in one sentence, in the user's words, for example "Why does jitter spread
the retry load?" Show it as the jig's title. If the subject holds two questions, build two jigs.

### Step 2 — Pick the knobs

- Three to seven knobs, each mapped to one real parameter, each with range, default, step and
  unit. Put further knobs in a collapsed "More" group.
- Understand: include the knob that produces the "aha", usually the parameter the user's
  intuition gets wrong.
- Try out: take the defaults from the current artifact.
- Add three to five named presets. One preset shows the extreme that breaks the subject.

### Step 3 — Pick the medium

Build the jig where the subject lives; the medium table is in
[references/media.md](references/media.md).

- If the project has a native tweak mechanism (game engine inspector, Storybook controls,
  SwiftUI preview canvas, notebook widgets), use it. Build no UI of your own on top.
- If the subject is abstract or the project has no visual stack, copy
  [assets/template.html](assets/template.html), replace the example model, and keep its
  structure, classes and state pattern.
- Try out: render the real artifact (same component, scene, tokens). Never a mock.

### Step 4 — Build

- One state object. Every knob writes to it, every render reads from it.
- Update the view on every knob change. No "Apply" button.
- Understand: show one readout number that sums up the effect, for example peak load.
- If the model uses chance, use a seeded generator, so the view does not flicker.
- Add an honesty box: two to four short lines on what the model simplifies.
- The first view looks right on defaults.

### Step 5 — Write the copy text

Every jig shows a text block with a copy action. The text returns to the agent, so it must be
actionable without seeing the jig.

- Write an instruction or a finding, not a value dump.
- Name only values that differ from the default, each with unit and a qualitative word
  ("60 % jitter, so strong").
- Understand: state the observation with the readout: "With 50 % jitter the peak load drops
  from 100 to 24 requests per 10 ms."
- Try out: phrase a change request against the real artifact, with the file or component name.

### Step 6 — Hand over

1. If the medium is HTML, render at 375 px and 1280 px, light and dark, and look at the
   screenshots.
2. Tell the user how to open the jig: file path, scene, preview or notebook cell. For HTML,
   open the file in the browser. If the sandbox blocks `open` (macOS) or `xdg-open` (Linux),
   give the user the full command.
3. Ask "What did you find?" in the user's language. Wait for the copied text.

---
name: tasting-menu
version: 2026-11-22
description: >
  Find a visual style and build an image language in rounds on a node canvas, like the
  Flora workflow: reference images and focus notes become a style prompt, a theme turns
  it into several prompt variants, an image generator on the system (Codex with GPT Image
  by default) renders each one. A fixed HTML template shows the graph. The user edits
  texts, rates images and writes change notes there, copies one JSON per round back into
  the chat, and the agent grows the graph with the next round. A finished style is frozen
  as a reusable technique for new themes. BOUNDARY — this skill generates images in one
  style. To explain an idea with a diagram or drawing use skill-soup:plate-it. To tune
  colors, spacing or timing with live knobs use skill-soup:taste-and-tweak.
when_to_use: >
  Triggers: "tasting-menu", "find a visual
  style", "build an image language", "style exploration with variants", "node canvas for
  image prompts", "freeze this style as a technique". Also trigger when the user pastes a
  JSON object with the key "tasting-menu".
---

# tasting-menu

Grow a style exploration as a node graph, one round at a time. The agent owns the structure and
the prompts. The user steers through the page: edit a text, rate an image, write what should change.

**Output language:** page labels follow `lang` in `graph.json`: `de` for German, `en` (default) for English. Set the language the user writes in; for any other language use `en`. Style and image prompts are English, because image
models follow English prompts best. If the user writes prompts in another language, keep that language.
`technique.md` is written in the language the user writes in, with the prompts in English.

## What this skill does NOT do

- It never writes `index.html` by hand. The page always comes from `assets/template.html` through `scripts/lab.ts build`.
- It never deletes nodes or images. The graph only grows. A new attempt is a new node.
- It never switches to another image generator silently. If Codex fails, it stops and asks.
- It never generates more than 8 images in one round without asking. Each image costs time and quota.
- It never publishes the page or the images.

## Files

- `scripts/lab.ts` — `build`, `generate`, `apply` and `--self-test`. Run with `node <skill-dir>/scripts/lab.ts`.
- `assets/template.html` — the canvas page (Drawflow, Basecoat). Never edit it per lab.
- `references/graph-format.md` — the `graph.json` format, node types, generation rules and the round export. Read it before you write the first `graph.json`.

## Start a lab (round 1)

### Step 1 — Collect the inputs

Ask in one message for what the user did not give yet:

| Input | Default |
|---|---|
| Reference images (file paths) | none: the style comes from the focus notes alone |
| Focus: what matters about the style (medium, composition, color, line) | none |
| Theme: what the images show (a word, a paragraph, an article) | required |
| Number of variants | 3 |
| Aspect ratio | 16:9 |
| Lab folder | `./tasting-menu/<slug-of-the-theme>/` in the working directory |

If neither reference images nor focus notes exist, ask for one of them. A style needs a source.

### Step 2 — Check the generator

Run `command -v codex`. If Codex is missing, tell the user. Offer an image tool that this agent has
itself. If the user agrees, create each PNG at the node's `image` path and set `prompt_used` by hand.

### Step 3 — Write the style prompt

Copy each reference image into `<lab>/images/` as `r1-ref-<n>.<ext>`. Look at each reference image.
Write one `style` node: a reusable prompt that recreates images like the references. Cover these points:

- medium and technique (collage, engraving, flat vector, photo)
- composition and framing
- color: the palette with named colors, and how color is applied
- line, texture, light
- what to avoid

Weight the points the focus notes name. Leave the subject out: the style prompt fits any theme.

### Step 4 — Write the variants

Write one `prompt` node per variant, `from: ["<style id>", "<theme id>"]`. Each prompt is the style
prompt rewritten in context of the theme, with a different central object or composition per
variant. Each prompt is complete on its own: the generator sees only this text and the attached images.

If the generator should see the reference images, add their IDs to each prompt's `from`. Add one `image` node per prompt. Add the reference images and the focus notes as nodes, so the
page shows where the style came from. Use the IDs and the example in `references/graph-format.md`.

### Step 5 — Generate, render, show

```bash
node <skill-dir>/scripts/lab.ts generate <lab>
node <skill-dir>/scripts/lab.ts build <lab>
```

`generate` runs 3 Codex jobs at a time (`LAB_JOBS` changes it) and needs 20 to 60 seconds per image.
Run it in the background. If an image fails, `generate` names it. Run `generate` once more. If the image fails again, show the error to the user.

Open `<lab>/index.html` in the browser. Tell the user the three moves:

1. Edit any text node. The changed field gets a copper frame.
2. Rate each new image with the thumbs-up or thumbs-down button. Write a note under an image to get a variant of it.
3. Click the copy button in the panel and paste the JSON into the chat.

## Next round

### Step 1 — Apply the export

Pipe the pasted JSON into `apply` with a quoted heredoc, so the shell leaves its content alone:

```bash
node <skill-dir>/scripts/lab.ts apply <lab> - <<'JSON'
<pasted JSON>
JSON
```

`apply` stores the export under `rounds/`, writes edits and verdicts into `graph.json`, raises
`round` and prints one line per change. If `apply` refuses the export (wrong lab, old round), show
the reason to the user and stop.

### Step 2 — React to each line

All new nodes get the new round number. Answer each line of the `apply` output:

| Line | New nodes |
|---|---|
| `VARIANT <image>: <note>` | One `prompt` with `from: ["<image>"]` that keeps the image and applies the note, plus its `image`. If the note asks for several variants, make that many. |
| `EDIT <style>` | One new `prompt` per variant for the current theme, `from: ["<style>", "<theme>"]`, plus images. |
| `EDIT <text>` (theme or focus) | If the theme changed, new variants as in round 1. If the focus changed, rewrite the `style` node first. |
| `EDIT <prompt>` | One new `image` from that prompt. The old image keeps its `prompt_used`. |
| `LIKE <image>` | Nothing. The image is a candidate for the technique. |
| `DROP <image>` | Nothing. |
| `COMMENT` | Apply the comment to every prompt of this round. If the comment asks for something else, do that. |

If the sum passes 8 images, name the count and ask before generating. If `apply` printed
"nothing", ask whether the style is done. If the style is done, continue with "Freeze the technique".

### Step 3 — Generate, render, show

Same as step 5 of round 1. The page opens on the newest round. Older rounds stay visible to the left.

## Freeze the technique

When the user says the style is done, write `<lab>/technique.md`:

1. The final style prompt, verbatim.
2. The variant instruction: "Rewrite the style prompt for the theme below. Give <n> options, each with a different central object or composition."
3. The aspect ratio.
4. The liked images as a list: path, title, `prompt_used`.

Tell the user the path. The technique works without this skill: any agent with an image generator can run it.

## Run a technique on a new theme

When the user names a `technique.md` and a new theme, start a new lab. Skip steps 1 to 3 of round 1:
the `style` node takes the style prompt from `technique.md`. If the generator should see the liked images of the old lab,
add them as `reference` nodes and put their IDs into each prompt's `from`. Continue with step 4.

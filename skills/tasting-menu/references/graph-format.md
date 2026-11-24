# graph.json format

One lab is one folder:

```
<lab>/
  graph.json        the only file the agent edits
  index.html        rendered by `lab.ts build`, never edited by hand
  images/           reference images and generated images
  rounds/           round-<n>.json, the user's exports, written by `lab.ts apply`
  technique.md      written when the user freezes a style (SKILL.md, step "Freeze the technique")
```

## Top level

| Field | Type | Meaning |
|---|---|---|
| `title` | string | Name of the lab. The page and the export carry it. Never change it after round 1: `apply` refuses an export with another title. |
| `round` | integer ≥ 1 | The round the user is working on. Only `apply` raises it. |
| `aspect` | `"W:H"` | Aspect ratio for every generated image. Default `16:9`. |
| `lang` | `"en"` or `"de"` | Language of the page labels. Default `en`. |
| `nodes` | array | All nodes of all rounds. The graph only grows. |

## Node

| Field | Types | Meaning |
|---|---|---|
| `id` | all | Unique, kebab-case, stable. Convention: `r<round>-<kind>-<n>`, for example `r2-prompt-1`. |
| `type` | all | `reference`, `text`, `style`, `prompt` or `image`. |
| `title` | all | Short label in the node header, at most four words. |
| `round` | all | The round that created the node. Nodes of the current round get a highlighted header, and only their images get rating buttons. |
| `from` | all except `reference` | IDs of the parent nodes. Draws the edges and sets the column. |
| `text` | `text`, `style`, `prompt` | The text the node shows. The user can edit it. Required for `style` and `prompt`. |
| `hint` | `text` | Placeholder for an empty input node, for example "What is the article about?". |
| `image` | `reference`, `image` | Path relative to the lab folder, for example `images/r1-img-2.png`. |
| `prompt_used` | `image` | Written by `generate`: the exact prompt text that produced the image. |
| `verdict` | `image` | Written by `apply`: `like` or `dislike`. |
| `note` | `image` | Written by `apply`: what the user wants changed. A note asks for a variant. |

## Node types

| Type | Who writes it | Role in the workflow |
|---|---|---|
| `reference` | the user (file), the agent (node) | An image that sets the style. Copy the file into `images/`. |
| `text` | the user | Input: theme, brief, what to pay attention to. The agent may create it empty with a `hint`. |
| `style` | the agent | The reusable style prompt, derived from references and focus notes. |
| `prompt` | the agent | One full image prompt: the style prompt rewritten for the theme, one composition each. |
| `image` | `generate` | One generated image. Its `from` holds exactly one `prompt`. |

## Generation rules

`lab.ts generate` creates every `image` node whose file does not exist yet:

- The prompt text is the `text` of the one `prompt` node in `from`.
- Every parent of that prompt node that has an existing image file goes along as an attached reference
  image. A variant of an image therefore uses its prompt's `from: ["<image id>", ...]` to send the
  original along.
- The aspect ratio is `graph.aspect`.
- To regenerate an image, add a new `image` node. Never delete a file to force a new one: the graph keeps history.

## Round export (written by the page, read by `apply`)

```json
{
  "tasting-menu": "Blog image language",
  "round": 1,
  "edits": [{ "id": "r1-theme", "text": "new text" }],
  "verdicts": [{ "id": "r1-img-2", "verdict": "like", "note": "warmer, fewer gears" }],
  "comment": "general instruction for the next round"
}
```

`edits` holds only changed texts. `verdicts` holds only images with a rating or a note.
`verdict` can be `null` when the user wrote a note without a rating.

## Example: round 1

```json
{
  "title": "Blog image language",
  "round": 1,
  "aspect": "16:9",
  "lang": "en",
  "nodes": [
    { "id": "r1-ref-1", "type": "reference", "title": "Reference 1", "round": 1, "image": "images/r1-ref-1.png" },
    { "id": "r1-focus", "type": "text", "title": "Focus", "round": 1, "text": "Collage quality, color application, line style" },
    { "id": "r1-style", "type": "style", "title": "Style prompt", "round": 1, "from": ["r1-ref-1", "r1-focus"], "text": "Mixed-media collage ..." },
    { "id": "r1-theme", "type": "text", "title": "Theme", "round": 1, "text": "Tokens as the currency of AI work" },
    { "id": "r1-prompt-1", "type": "prompt", "title": "Scale", "round": 1, "from": ["r1-style", "r1-theme"], "text": "..." },
    { "id": "r1-img-1", "type": "image", "title": "Scale", "round": 1, "from": ["r1-prompt-1"], "image": "images/r1-img-1.png" }
  ]
}
```

## Example: a variant in round 2

The user liked `r1-img-1` and wrote "warmer". The agent adds:

```json
{ "id": "r2-prompt-1", "type": "prompt", "title": "Scale, warmer", "round": 2, "from": ["r1-img-1"], "text": "Keep the composition of the attached image. Shift the palette warmer: ..." },
{ "id": "r2-img-1", "type": "image", "title": "Scale, warmer", "round": 2, "from": ["r2-prompt-1"], "image": "images/r2-img-1.png" }
```

# Spec format

One JSON file. Required: `title`, and `cards` with at least one card, each with a `title`.

```json
{
  "title": "Dependency cleanup",
  "lang": "en",
  "storage_key": "deps-cleanup-v1",
  "evidence_title": "Where it is used",
  "options": [
    {"value": "drop", "label": "Drop it",          "key": "d", "color": "red"},
    {"value": "keep", "label": "Keep it",          "key": "k", "color": "green"},
    {"value": "swap", "label": "Replace with std", "key": "s", "color": "blue"}
  ],
  "cards": [
    {
      "id": "left-pad",
      "title": "left-pad",
      "category": "runtime",
      "text": "Pads strings. String.prototype.padStart does the same since ES2017.",
      "chips": ["2 imports"],
      "warning": "One import sits in the public API.",
      "evidence": [{"quote": "const id = leftPad(n, 6, '0')", "source": "src/ids.ts:14"}],
      "extras": [{"title": "Effort", "text": "Two lines, one test.", "muted": true}]
    }
  ]
}
```

## Top-level fields

| Field | Required | Default | Meaning |
|---|---|---|---|
| `title` | yes | — | Page title and header |
| `cards` | yes | — | The items, in display order |
| `lang` | no | `en` | Sets the HTML `lang` |
| `labels` | no | English texts | Interface texts, each key overrides one: `copy` "Copy", `export` "Export JSON", `prev` "back", `open` "next open", `next` "next", `of` "of", `decided` "decided", `keys` "Keys", `browse` "browse", `saved` "The browser saves your answers automatically.", `evidence` "Evidence", `suffix` "verdicts" (file name) |
| `options` | no | No (`n`, red) / Yes (`y`, green) | 2 to 4 verdict buttons |
| `storage_key` | no | `yay-or-nay-<title slug>` | localStorage key |
| `export_file` | no | `<title slug>-<suffix label>.json` | File name of the download |
| `evidence_title` | no | `evidence` label | Heading above the quotes |

## Option fields

All four are required.

| Field | Meaning |
|---|---|
| `value` | What lands in the result JSON; unique per page |
| `label` | Button text |
| `key` | One character, the hotkey; unique per page, case-insensitive |
| `color` | `green`, `red`, `blue`, `gray` or `amber` |

## Card fields

| Field | Meaning |
|---|---|
| `id` | Unique; generated as `K01`, `K02` … when missing |
| `title` | The item in a few words (required) |
| `category` | Shown as a chip |
| `text` | What it is and why it is on the list |
| `chips` | Extra short labels |
| `warning` | One highlighted caution line |
| `evidence` | List of `{quote, source}`; in `quote`, `~~x~~` renders struck through, `*x*` italic |
| `extras` | List of `{title, text, muted}` sections below the evidence |

## Result format

The copy button and the export button produce the same JSON:

```json
{
  "title": "Dependency cleanup",
  "exported": "2026-10-08T10:00:00.000Z",
  "decided": 53,
  "total": 54,
  "verdicts": [{"id": "left-pad", "title": "left-pad", "verdict": "swap"}]
}
```

`verdict` is `null` for undecided cards.

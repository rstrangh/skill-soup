# Finding card

The field reference is `references/spec.md` in `skill-soup:yay-or-nay`. This file adds the layout
for documentation findings.

## Options

Use these three options in every round. Translate the labels into the output language. Keep
the values English: the apply run reads them.

| `value` | Meaning |
|---|---|
| `apply` | Apply the proposed change as written. |
| `change` | Change the passage, with different text. The apply run asks for it. |
| `keep` | The passage stays. |

## Card

```json
{
  "id": "D04",
  "title": "Project structure as a file list",
  "category": "preempts",
  "text": "README.md lists 14 files under src/ with one line of purpose each. Three of the files no longer exist.",
  "chips": ["README.md", "−18 lines"],
  "evidence": [
    {"quote": "src/lib/timer.ts – timer logic", "source": "README.md:42"},
    {"quote": "(file does not exist, today src/lib/timerEngine.ts)", "source": "src/lib/"}
  ],
  "extras": [
    {"title": "Proposal", "text": "Delete the list. One sentence stays: \"The domain logic lives in src/lib/, the stores in src/stores/.\""}
  ],
  "diet": {
    "kind": "preempts",
    "file": "README.md",
    "lines": [40, 57],
    "replacement": "The domain logic lives in src/lib/, the stores in src/stores/."
  }
}
```

## Field rules

| Field | Content |
|---|---|
| `title` | The passage in a few words. No kind, no verdict. |
| `category` | The kind: `exists`, `drift`, `preempts`, `anchor` or `noise`. |
| `text` | What the passage says and what the code or the other source says. Facts only, two sentences at most. |
| `chips` | The file and the line delta of the proposal. |
| `warning` | Only for `drift`: "Code or doc: the user decides which side is wrong." |
| `evidence` | The passage word for word. For `exists` and `drift`, also the counter-source with `file:line`. |
| `extras` | "Proposal" with the full replacement text, or "Delete". For `drift`, a second entry "Alternative" with the code location. For `anchor`, the catalog entry name. Translate the titles. |
| `diet` | Machine fields for the apply run; the page ignores them. `kind` = `category`, `file` = file of the passage, `lines` = first and last line, `replacement` = new text or `""` for deletion. |

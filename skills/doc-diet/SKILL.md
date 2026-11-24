---
name: doc-diet
version: 2026-11-18
description: >
  Audit the documentation of a repository for content, not wording: passages that a config,
  the code, an ADR or the glossary already state, passages that contradict the code,
  passages that pre-empt the code with file lists or implementation detail, paragraphs that
  spell out a known concept a semantic anchor can replace, and passages that change nothing
  for any reader. One test applies to human readers and agent readers alike. Writes the
  findings as a verdict spec for skill-soup:yay-or-nay and changes nothing. A separate apply run
  carries out the findings the user accepted. Triggers: "doc diet", "trim the docs", "audit the documentation",
  "docs drift from the code", "what can go from the docs", "over-specified docs". BOUNDARY —
  this skill judges content. For rules a tool can check use skill-soup:kitchen-sweep.
---

# Doc diet

**The test:** would a reader, human or agent, act differently without this passage? If no
reader would, the passage is a finding.

**Output language:** the card texts and every replacement text follow the language of the
documentation.

## What this skill does NOT do

- The audit run changes nothing. The apply run changes only findings the user accepted.
- It judges no wording: sentence length, hedging and style are out of scope.
- It proposes no tool checks. Count passages that state a checkable rule and point to
  `skill-soup:kitchen-sweep`.
- It never decides a drift. The user decides whether the doc or the code is wrong.

## Audit run

### 1. Collect the sources

Read `README.md`, `AGENTS.md`, `CLAUDE.md`, `.claude/rules/`, `CONTRIBUTING.md`, `docs/`,
ADRs and the glossary. If the user names files, read only those. Skip generated files,
vendored files and changelogs. Read the build manifest and the tool configs. Read source code
only to confirm or refute a concrete passage.

### 2. Find the passages

A passage is one statement, one list or one paragraph with one point. Sort each finding into
exactly one kind. If a passage fits two kinds, take the kind higher in this table:

| Kind | Finding | Evidence |
|---|---|---|
| `exists` | A config, the code, an ADR, the glossary or a second doc states the same | the other place, with `file:line` |
| `drift` | The passage contradicts the code | the code, with `file:line` |
| `preempts` | File lists, task lists, implementation detail the code shows, outdated plans | why the passage ages or what shows it already |
| `anchor` | The paragraph spells out a known concept | the anchor from the catalog |
| `noise` | Fails the test | the test |

- Claim `drift` only with a code quote that contradicts the passage.
- An accepted ADR is history. An ADR the code no longer follows is a finding only when its
  status does not say "superseded".
- Take anchors only from [assets/semantic-anchors.md](assets/semantic-anchors.md). Read the
  catalog in full once per run. Source and licence: [assets/NOTICE.md](assets/NOTICE.md).
- Propose an anchor only when the paragraph spells out the concept unambiguously. Use the
  qualified catalog form, for example `TDD, London School`. A project term is never an
  anchor; it belongs in the glossary. A paragraph that fails the test gets deletion, not an
  anchor.

### 3. Propose a change per finding

Each finding carries one change: delete, replace with a pointer, replace with an anchor, or
rewrite to match the code. Write the replacement text in full. For `drift`, propose both
directions: the new doc text, and the code location that would change instead.

### 4. Write the finding spec

Write one JSON file in the spec format of `skill-soup:yay-or-nay`, one card per finding, ordered by
kind as in the table in step 2. Card layout: [references/finding-card.md](references/finding-card.md).
If the output language is not English, set `lang` and translate the `labels`. Write the file
outside the repository: into the session scratchpad or the system temp directory, or to the
path the user names.

### 5. Report

Show in the chat:

1. One row per source file: findings per kind and the lines the proposals would remove.
2. The number of passages that state a checkable rule, with a pointer to `skill-soup:kitchen-sweep`.
3. The path of the finding spec.

Offer to decide the cards with `skill-soup:yay-or-nay`. If `skill-soup:yay-or-nay` is not installed,
write the findings as a Markdown report with one verdict column next to the spec.

## Apply run

The user starts the apply run with the verdicts. Carry out the verdict `apply` and nothing else.

1. Check that the working tree is clean. Create a branch from the default branch.
2. Apply each accepted change with the replacement text from its card.
3. For a `change` verdict, ask the user for the new text before you apply it.
4. For a `drift` finding where the user chose the code side, list the finding in the summary
   and leave the code unchanged.
5. Commit once. Ask the user before the push.

## Rules

- Quote the source word for word. A paraphrase in `evidence` is a fabricated quote.
- Keep card ids stable: `D01`, `D02` … in the order of the spec.

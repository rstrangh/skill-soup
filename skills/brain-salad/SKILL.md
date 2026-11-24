---
name: brain-salad
version: 2026-11-18
description: >
  Read an unstructured monologue — usually a dictation from speech recognition, sometimes
  a typed brain dump — by fixed rules, then act on it directly. Sorts what was said by how
  binding it is (context, task, decided, open, unclear), corrects transcription errors
  silently, mirrors the reading back in a few lines when needed, and executes. Never
  outputs a cleaned-up transcript. Optional mode "deeper" turns the task into a deeper
  prompt proposal instead. Triggers: "brain dump", "/brain-salad",
  "dictation", "let me ramble", "rambling thoughts", "/brain-salad deeper". Also use it
  without a trigger word when the input reads like a long dictated monologue: no
  paragraphs, filler words, self-corrections, misheard terms. BOUNDARY — this skill reads
  ONE input and works with it. To preserve the knowledge of a whole chat use
  skill-soup:boil-it-down.
---

# Brain dump — read a monologue, then act on it

**Output language:** the language of the user's input. Translate the labels and the mirror
template below. Address the user the way the user's instructions say.

## What this skill does NOT do

- It never outputs the monologue as a cleaned-up text. The work is the goal.
- It never resolves a contradiction. A contradiction goes into UNCLEAR.
- It never decides an open point.
- It never fetches a web page to find an anchor.

## Modes

| Call | Steps |
|---|---|
| `/brain-salad <monologue>` | Step 1 to Step 4 |
| `/brain-salad deeper <monologue>` | Step 1, Step 2 (always), then section "Deeper mode". No execution. |
| No call, but the input reads like dictation | Same as `/brain-salad` |

The mode word also counts in the user's language, for example `tiefer`.

## Three layers — keep them apart

1. **Interpretation** — what the user said, sorted. Adds nothing.
2. **Anchors** — names for concepts the user spelled out. Adds precision, never content.
3. **Deepen** — a proposal for a bigger question. Adds content, only on request.

Anchors and your own ideas never enter the sorted reading. Your sparring answer in Step 3 may
add your own view.

## Step 1 — Sort

Before you sort, read [references/glossary.md](references/glossary.md) and, if it exists,
`~/.config/brain-salad/glossary.md` (same table format; add a row after speech recognition
got a term wrong). Read the whole monologue, then sort every statement into exactly one
category:

| Label | What goes in |
|---|---|
| CONTEXT | The starting situation and what bothers the user |
| TASK | What the user wants done, by you or as the outcome |
| DECIDED | What the user stated as decided |
| OPEN | What the user considered, floated or discarded, including variants |
| UNCLEAR | Contradictions, statements that stay ambiguous after correction, everything you would otherwise guess |

- Correct transcription errors silently and spell terms as the glossary lists them. A
  transcription error never goes into UNCLEAR.
- Sort by meaning, not wording.
- Put a contradiction into UNCLEAR with both sides.
- Keep discarded variants in OPEN, marked as discarded.
- A point that sounds almost decided stays in OPEN.
- A later statement wins only when the user marks it as a correction ("no, scratch that").
  Otherwise both go into UNCLEAR.
- Carry meta signals into Step 3: doubt ("not sure this makes sense"), an invitation to
  object ("is this a stupid idea?"), a request for a stance ("be critical").

Keep the sorted reading internal. Step 2 decides what the user sees.

## Step 1b — Semantic anchors

Use semantic anchors for concepts the user spelled out without naming them.
Read [assets/semantic-anchors.md](assets/semantic-anchors.md) in full once per conversation
(source and license: [assets/NOTICE.md](assets/NOTICE.md)). The catalog shows examples, not a
limit: take an established name from outside it, for example Jagged Frontier or Decision
Fatigue, when you can name its originator or source.

- Use an anchor only when the user spelled out the concept unambiguously. Vague language gets
  no anchor: "more structure" never becomes "Story Map".
- Name the originator and quote the user's words:
  `Premortem (Gary Klein; from: "imagine it has already failed")`.
- Without an originator or source, use no anchor.
- If the catalog has the concept, use its qualified form, for example `TDD, London School`.
- A project term is never an anchor.
- Every anchor you use appears in the mirror.

## Step 2 — Mirror (conditional)

Mirror the reading if at least one condition holds:

- You made an assumption to close a gap.
- You used a semantic anchor.
- UNCLEAR holds an item that does not block the task.
- The monologue is longer than about 150 words.
- The mode is `deeper`.

Otherwise go to Step 3. The mirror has three to five lines, in the output language:

```
Here is how I understood you:
- Task: …
- Decided: …
- Open: … (discarded: …)
- Assumptions: … · Anchor: Premortem (from: "…")
```

Drop empty lines. Reflect important terms in the user's own words. Never retell the monologue.

## Step 3 — Act

Do the TASK. Treat DECIDED as fixed. Name OPEN points where they matter; do not settle them.

- If a gap is small and a wrong guess is cheap to undo, close it with an assumption marked
  `Assumption:` in the output language.
- If a meta signal asked for criticism, give it. Name the strongest counterargument first.

## Step 4 — Stop when UNCLEAR blocks

An UNCLEAR item blocks when its answer changes which task, which target, which file, or
leads to an action that is hard to undo.

- If an item blocks, stop before acting. Show the mirror. Ask one targeted question per
  blocking item. If the options are few and clear, use the structured question tool.
- If an item does not block, act and list it in the mirror.

## Deeper mode (`deeper`)

Run Step 1 and Step 2 first; work on the sorted reading, not the raw monologue. Apply this
template to the TASK:

```
I want a deeper version of this task, not a bigger one. Before rewriting
it: (1) say what a top professional in this field would do here that I'm
not asking for; (2) name the rawest material they would start from
instead of what has already been digested for me; (3) name the specific
methods and tools they would use; (4) say what, other than you or me,
would show the result is right. Then rewrite my prompt to ask for
exactly that.
```

Output the four answers and the rewritten prompt, labelled `Proposal` in the output language.
Stop there. Execute the rewritten prompt only after the user confirms it.

---
name: mise-en-place
version: 2026-11-18
description: >
  Before a concrete task in unfamiliar code, find the user's unknown unknowns in that part of
  the codebase: landmines, unwritten conventions, missing concepts and earlier attempts at the
  same task. Every blindspot comes with evidence and a sentence that fixes the prompt. The
  result is one HTML page of blindspot cards plus an assembled implementation prompt the user
  can paste. Builds nothing and changes no code. Triggers: "blindspot pass", "find my
  unknown unknowns", "what don't I know about this module", "I don't know this module",
  "before I touch this code", "how should I prompt you for this", "where are the landmines".
  BOUNDARY — this skill prepares ONE task in ONE part of the code, before the work starts. It
  does not assess the health of a whole repository and does not review a finished change. For
  the vocabulary of an unfamiliar domain outside the code use skill-soup:lingo-lasagne. To fix how
  the finished work gets checked use skill-soup:dish-eval.
---

# Blindspot pass

**Output language:** the language the user writes in. If the request is too short to tell,
use the language of the earlier conversation, then the language of the user's instructions,
then English. Code identifiers stay as they are.

## What this skill does NOT do

- It never implements the task and never edits code.
- It never lists generic advice such as "write tests". A blindspot needs evidence in this
  codebase.
- It reads the history of one area only, never of the whole repository.

## Input

The task in one sentence ("add a new SSO provider") and the part of the code (a directory or
a module). If one is missing, ask one question. If the user names only the task, propose the
directory and ask for confirmation.

## Step 1 — Read the history of the area

```bash
# Churn hotspots
git log --since="2 years ago" --format= --name-only -- <dir> | sort | uniq -c | sort -rn | head -15
# Bug hotspots
git log --since="2 years ago" -i -E --grep='fix|bug|broken' --format= --name-only -- <dir> | sort | uniq -c | sort -rn | head -15
# Reverted or abandoned attempts
git log --oneline -i --grep='revert' --grep='rollback' --grep='back out' -- <dir> | head -20
```

Look for:

- Reverted attempts at the same or a similar task. Read the revert commit and its reason.
- Stalled migrations: two storage paths, a feature flag that stays off, a deprecated alias
  that is still imported.

## Step 2 — Read the code with the task in mind

Read the entry points the task touches, their callers and their tests. Per file, ask: what
would a newcomer get wrong here when they implement the task? Search for:

- `TODO`, `FIXME`, `HACK`, `XXX` and deprecation notes.
- Feature flags and config values that change the behaviour of the area.
- Code paths that bypass the mechanism everyone assumes runs, for example a provider that
  skips a middleware.
- Concepts the public interface hides, for example an identity-linking model behind a
  provider interface.
- Conventions every implementation follows but no document states, for example a
  registration step in three places.
- Docs, ADRs and READMEs of the area that disagree with the code.

## Step 3 — Write the blindspot cards

Sort the blindspots by the cost of missing them, highest first. Keep at most seven cards.
List the rest in one line each.

| Part | Content |
|---|---|
| Kind | `landmine`, `convention` (unwritten), `concept` (missing) or `attempt` (earlier) |
| Claim | One sentence that states the blindspot |
| Evidence | `file:line`, commit hash, PR number or ticket. At least one per card. |
| Why it bites this task | What goes wrong if the user implements the task without knowing it |
| Prompt fix | One or two sentences the user pastes into the implementation prompt |

Verify each card against the code. If a caller already guards against the problem, drop the
card. Note each checked area that holds no blindspot, for the page.

## Step 4 — Assemble the implementation prompt

1. The task in one sentence.
2. The numbered prompt fixes, in card order.
3. A work order: the sequence of steps that avoids the landmines.
4. A stop point: "Stop and show me the plan after <first risky step> before writing code."

## Step 5 — Render the page

Copy [assets/template.html](assets/template.html) and fill it: replace every example text,
repeat each block as the steps above say, keep the structure, the classes and the script.
Set `<html lang>` to the output language and translate the headings and the button labels.

Save the file as `docs/blindspots/YYYY-MM-DD-<slug>.html` in the repository, or in the
repository's established home for such documents. Do not commit the file. Open the file.

## After writing the file

Reply in chat with three things only: the number of blindspots per kind, the most expensive
blindspot in one sentence, and the assembled prompt as a code block. Then name the file path.

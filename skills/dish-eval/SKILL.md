---
name: dish-eval
version: 2026-11-18
description: >
  Before an agent builds a feature, interview the human for the eval pack: the acceptance
  criteria, the check for each criterion, and the evidence the agent must deliver in the pull
  request, such as screenshots, a screen recording or test output. Writes the pack next to the
  spec as a .eval.md file, or as a section in the spec issue. Writes no spec, no tests and no
  code. Triggers: "eval pack", "evaluation pack", "acceptance criteria before the agent
  starts", "say up front how you will check", "what must the agent deliver", "define done for
  this feature". BOUNDARY — this skill fixes how one feature gets checked, before the work
  starts. For the gates, rules and grader of the whole repository use
  skill-soup:kitchen-setup. For unknown unknowns in the code before a task use skill-soup:mise-en-place.
  To check the finished change against the pack use skill-soup:taste-test.
---

# Eval pack

Write the eval pack for one feature before an agent builds the feature. The pack says how the
human checks the result and which evidence the agent delivers. The agent reads the pack and
never edits the pack. After the merge, the pack goes away together with the spec.

**Output language:** the language the user writes in. If the request is too short to tell,
use the language of the spec, then English. Keep the heading `Eval Pack` and the file suffix
`.eval.md` in every language, so that other tools find the pack.

## What this skill does NOT do

- It never writes or changes the spec. If no spec exists, ask for one and stop.
- It never writes tests or code. The pack names the check. The human or a separate step writes
  the test.
- It never proposes criteria before the human has named theirs.
- It never repeats the standard rows that the repository's `AGENTS.md` or `CLAUDE.md` already
  asks for, such as the test report, the diff size or the decisions to confirm.

## Step 1 — Read the spec

- If the spec is a file, read the file. If the spec is an issue, read the issue with
  `gh issue view`.
- If the spec has acceptance criteria with IDs, keep those IDs. If the criteria have no IDs,
  number them `AC-1`, `AC-2` in the order of the spec.
- Read `AGENTS.md` or `CLAUDE.md` for an eval pack block with standard rows. If there is no such
  block, tell the user once that skill-soup:kitchen-setup adds one, and continue.

## Step 2 — Interview, one criterion at a time

1. Ask the human which criteria decide whether they accept the feature. If the spec has
   acceptance criteria, ask which of them the human checks and what is missing.
2. Check each criterion before you take the next one:
   - **Observable.** A person or a test can see the result. "Feels fast" fails. "The list
     shows 500 receipts in under one second" passes.
   - **Check.** The test that checks the criterion, by name or in one sentence. Else a command
     with its expected output. Else `manual` plus the person who checks.
   - **Evidence.** What the agent puts into the pull request: test output, a screenshot of a
     state, a screen recording of a flow across screens, or command output.
3. If a criterion fails a check, propose one rewrite. If the human keeps the criterion vague,
   drop the criterion and say so.
4. After the human's list is complete, name the gaps you see. Look for criteria of the spec
   without a row, error states, empty states, permissions, and other entry points to the same
   feature. The human decides about each gap.
5. Ask what the agent must not build. Write the answer as one line "Out of scope".

## Step 3 — Write the pack

If the spec is a file, write `<spec name>.eval.md` into the folder of the spec. If the spec is
an issue, show the section and ask before you add the section to the issue body. Never stage or
commit the file.

For a criterion from the spec, write a label of at most six words. The full wording stays in
the spec. For a new criterion, write the full criterion.

```markdown
# Eval Pack: <feature>

Spec: [<spec name>](<path or issue link>)

The agent delivers the evidence in the pull request description, one line per ID.
The agent never edits this pack.

| ID | Criterion | Check | Evidence in the PR |
|---|---|---|---|
| AC-1 | Wizard creates a trip | test `creates a trip from the wizard` | screen recording: wizard to saved trip |
| AC-2 | Add a receipt to a trip | test `adds a receipt to a trip` | screenshot: trip with receipt |
| AC-3 | Assign inbox receipts to a trip | test `assigns inbox receipts to a trip` | screen recording: inbox to trip |

Out of scope: deleting trips, foreign currencies.
```

In an issue, the section starts with `## Eval Pack` and leaves out the spec line.

## Step 4 — Hand over

Reply with the path or the issue link, the number of rows, and one line for the build prompt:

> Implement `<spec>`. The checks and the evidence to deliver are in `<pack>`.

Remind the human to delete the pack together with the spec after the merge.

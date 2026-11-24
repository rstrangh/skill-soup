---
name: taste-test
version: 2026-11-18
description: >
  Produce a rich, interactive HTML review document for a code change (diff, branch, or PR):
  deep explanation, the existing behaviour the change leans on, critical review findings
  with a reply builder for the author, and a quiz the reader must pass before merging.
  Built to keep the reviewer's mental model of the codebase sharp and counter cognitive
  debt from AI-generated code. Use whenever the user needs to review or truly understand a
  change, or wants to review code an AI agent wrote for them. Triggers: "review this PR", "explain
  this diff", "quiz me before I merge", "am I ready to merge", "help me understand this
  change". BOUNDARY — this skill explains and checks a concrete change. For quick inline findings without an explanation document
  use code-review. To prepare a task before any code exists use skill-soup:mise-en-place. To fix
  the checks for a feature before an agent builds it use skill-soup:dish-eval. To show one idea as a picture outside a review use
  skill-soup:plate-it.
---

# Review a change

Write one interactive HTML review document for a change. It serves two goals: a well-founded
verdict, and a sharper mental model of the system. Order: explanation, then judgment, then
self-test.

## Gather context

- Identify the change: an explicit diff, a branch (against the default branch), a PR
  (`gh pr view` / `gh pr diff`), or the working tree. If it is ambiguous, ask.
- Read the touched code paths, their callers and their tests before you write. A finding
  that ignores the surrounding code is a guess.
- Look for an eval pack (skill-soup:dish-eval): a `*.eval.md` file in the diff or next to a spec the
  PR links, else a `## Eval Pack` section in a linked issue. If there is no pack, continue
  without one.

## Sections

- **Background**: the existing system around the change. First a deep background for
  beginners, marked as skippable. Then a narrow background for this change.
- **Intuition**: open with one before/after view of the path a request or the data takes.
  Then the core idea of the change with toy data. Place each picture beside the paragraph it
  explains, never in a gallery. Picture types: call chain (boxes left to right, arrows
  labelled with what passes), before and after (same layout twice, changed parts in the
  accent colour), data flow (sources left, sinks right, example data on the arrows), state
  machine (arrows labelled with the event), sequence (one lane per participant, time
  downwards), simplified app UI for UI changes. Reuse the same few types throughout.
- **Code**: walk through the change grouped by concern, not by file path. Open with a shape
  diff: a monospace tree in `<pre>` of the call, file, component or control-flow tree, with
  `+` and `-` in the margin and only the touched branches.
- **Leans on**: existing behaviour the change depends on without touching it — middleware,
  shared config, feature flag, convention, open ticket. Per item: what, where (`file:line`),
  what breaks if it changes later. If there is nothing, say so in one sentence.
- **Deviations from the plan**: only if an implementation-notes file (for example
  `docs/notes/<feature>-implementation.md`) or the PR description records deviations. Per
  deviation: the call made, and the verdict keep or reopen. Never reconstruct deviations from
  the diff.
- **Eval pack**: only if a pack exists. One row per pack ID: the evidence in the PR
  description (delivered or missing), what you verified yourself (ran the test, opened the
  screenshot), and the verdict. Missing evidence is a **Should fix** finding. A diff that
  changes a `*.eval.md` file is a **Blocker** finding.
- **Findings**: correctness, edge cases, error handling, tests, security, performance,
  design fit, hidden complexity.
  - Every finding cites `file:line` and carries a severity: **Blocker**, **Should fix**,
    **Nit**, **Question** (only the author can answer) or **Pre-existing** (broken before the
    change; never held against the author).
  - Verify each finding against the surrounding code. A bug the caller already guards against
    is no finding. Never invent findings; state what you checked and found solid. An empty
    list is a valid result.
  - For each substantive finding, say what breaks, for whom, and when.
  - For a bug fix, check that it removes the root cause, not only the symptom.
  - Every Blocker, Should fix and Question gets a "To the author" checkbox for the reply
    builder. The `data-reply` text holds `file:line`, the finding in one sentence, and the
    reason, in the document language.
- **Quiz — the merge gate**: five or six multiple-choice questions. The section states at the
  top that the reader passes the quiz before merging.
  - Each question tests a decision the reader has to make right in a review or in an incident
    caused by this change. No trivia, no file-name recall.
  - At least two questions cover findings, edge cases or **Leans on** items.
  - If an eval pack exists, at least one question covers a row of the pack.
  - Each question links to the section that answers it.
  - The "Ready to merge" checklist names CI state if known, migrations, open Questions and
    follow-up work, and asks the reader to name what the automated checks would miss. A
    reader who cannot name it needs a real review, not a thumbs-up.
  - The gate blocks nothing technically. Never claim otherwise.

## Format

- Copy [assets/template.html](assets/template.html) and fill it. Replace every example text,
  repeat blocks as needed, and delete optional sections that do not apply together with their
  table-of-contents link. Keep structure, classes and script. Set `data-severity` on every
  finding to `blocker`, `should-fix`, `nit` or `question`.
- Language: the language the user writes in. If the request is too short to tell, use the
  earlier conversation, then the user's instructions or system settings, then English. Set
  `<html lang>` and translate headings and labels. Keep code identifiers as-is. Write in
  Martin Kleppmann's classic style.
- Save to `docs/reviews/YYYY-MM-DD-review-<slug>.html` in the repository under review, or to
  the repository's existing home for review artifacts. Never stage or commit it. Open the
  file when done.
- Never draw ASCII box diagrams; build boxes and arrows in HTML/CSS. Monospace trees and shape
  diffs in `<pre>` are wanted.
- Use three.js, embedded inline, only when 3D explains something a flat diagram cannot.
- If the change is visible in the running app, embed real screenshots as data URIs: web with
  `agent-browser` or Playwright, mobile with Maestro. If the app cannot run, sketch the UI in
  HTML instead and continue.
- Put code in `<pre>`. If you use another element, its CSS needs `white-space: pre-wrap`.

## Chat reply

Reply with a one-line TL;DR of the change, the one or two most important findings (or none),
and the file path. Never repeat the document in chat.

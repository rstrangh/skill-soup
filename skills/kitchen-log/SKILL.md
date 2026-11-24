---
name: kitchen-log
version: 2026-11-18
description: >
  Retrofit a MISTAKES.md into an existing project — the failure log where agent failures get
  collected with their cause and the rule that prevents them — anchor the matching rules in
  CLAUDE.md or AGENTS.md, and later graduate recurring entries into hard rules and gates. A
  patrol mode feeds the log without fixing anything: a recurring agent run that hunts known bad
  patterns, plus a weekly sample of merged agent commits.
  Triggers: "set up
  MISTAKES.md", "mistakes log", "agent failure log", "clean up the mistakes log", "what
  keeps going wrong here", "turn these failures into rules", "review rules after a model change", "set up a patrol", "sample the
  agent commits". BOUNDARY — this skill only does the failure log: retrofit and maintain. The
  full harness scaffolding — gates, pre-commit, CI, grader — gets set up by
  skill-soup:kitchen-setup. Rules that stand in the documentation instead of the log graduate
  through skill-soup:kitchen-audit.
---

# Mistakes log

`MISTAKES.md` holds failures that do not yet deserve a rule: newest on top, five fields per
entry (what happened, cause, consequence, prevented by, model). Recurring entries graduate
into a rule or, better, a gate. All formats and snippets are in
[references/template.md](references/template.md).

**Output language:** the language of the repository's documentation.

## Modes

If no `MISTAKES.md` exists, run mode A. Otherwise ask which mode the user means.

- **A — retrofit**, once per repository: steps 1–4.
- **B — audit and graduate**, when the log passes one screen or every few weeks: steps 5–5b.
- **C — patrol and sample**, set up once: steps 6–7.

## Mode A — retrofit

### Step 1 — Take stock

Clarify before you create a file:

- **Existing log?** `MISTAKES.md`, `LEARNINGS.md`, `docs/postmortems/`, a "known issues"
  section. If one exists, adopt and reformat it. Never create a second log next to it.
- **Rule file?** `CLAUDE.md`, `AGENTS.md`, or none. Without a rule file the log has no effect.
- **Shared or local?** Ask actively. Never assume sharing is fine: in a client project a
  failure list is political. Local means `MISTAKES.local.md`, excluded per template
  section 5.
- **Who writes?** Agent only, or people too. Shared logs need factual entries without blame.

### Step 2 — Create the file

Use the skeleton from template section 1. An entry longer than one paragraph belongs in an
ADR or a post-mortem; link to it from the log.

### Step 3 — Seed from existing evidence

```bash
# Reverts
git log --oneline --grep='^Revert' -i --since='12 months ago'
# Hotfixes and fix-the-fix
git log --oneline --grep='hotfix\|fix the fix\|really fix\|revert the revert' -i
# Files with the most fix commits
git log --pretty=format: --name-only --grep='^fix' -i | sort | uniq -c | sort -rn | head -20
```

Then: superseded ADRs, incident notes, closed bug issues with a post-mortem, and one
interview question: "What has an agent broken here, and what did you have to explain twice?"
Start deeper history work only when these sources are exhausted.

- Write only citable entries. Never invent a cause to fill a field: the agent derives wrong
  rules from it.
- Never add a rule that already stands in CLAUDE.md as an entry. That rule has graduated.
- Show the proposed entries and wait for confirmation. Five to ten entries are enough.

### Step 4 — Anchor two rules in the rule file

Add both snippets from template section 4: the write rule in a conditional block, the read
pointer as a plain line.

- Never use an `@MISTAKES.md` import. The file grows without bound; a path pointer is enough.
- Tell the user that the read pointer holds less reliably than the write rule. Graduation in
  mode B is the fix.
- Check once that the addition contradicts no existing rule. Recommend a larger rework of the
  rule file as a separate task; never start it here.

## Mode B — audit and graduate

### Step 5 — Count patterns and escalate

1. **Group by cause, never by symptom.** Symptom grouping splits one pattern into several
   cases that never graduate.
2. **Count.** Three to five similar entries make a pattern. Damage weighs in: two entries
   with data loss graduate faster than five with a red test.
3. **Pick the level.** Ask first: can a tool check this? If not, can a reader spot it in a
   diff? Only if neither, write a soft rule. Before a pattern graduates, a fresh subagent tries
   to disprove it; the user approves.

   | Level | Where | When |
   |---|---|---|
   | Evidence | `MISTAKES.md` | Single case, or cause unclear |
   | Soft rule | `CLAUDE.md` or `.claude/rules/` | Pattern clear, not deterministically checkable |
   | Diff checklist | `REVIEW.md`: trigger readable from a diff, the check, the incidents behind it | Pattern visible in a diff, not checkable by a tool; the grader checks only items whose trigger matches |
   | Hard gate | Test, lint rule, pre-commit, CI | Pattern deterministically checkable |

4. **Shorten the log.** A graduated entry shrinks to one line (template section 3).
5. **Report** the patterns with counts, the proposed level per pattern, and the single cases.
   Single cases never become rules.

If no gates exist to graduate into, recommend `skill-soup:kitchen-setup` first.

### Step 5b — Review rules after a model change

Run this step when the model changed since the newest graduated entry, or every few months.

1. List the soft rules that graduated from this log, with their model and date.
2. Never remove a gate in this step.
3. Keep every rule with evidence since the model change: new entries or candidates with the
   same cause, user corrections, review findings.
4. Compress first: merge rules with one cause, cut a rule to its working sentence.
5. Retire a rule only when the task from its original entry runs clean without the rule on
   the smallest model that reads the rule file. Without that run, the rule stays.
6. Add the retirement line from template section 3 to the graduated entry.
7. Show each rule with its verdict (keep, compress, retire) and the evidence. Change the rule
   file only after confirmation.

## Mode C — patrol and sample

Rule of the mode: **collect, never fix.** All inputs append candidate lines (template
section 6) to `## Candidates` at the top of `MISTAKES.md`.

### Step 6 — Set up the inputs

1. **Patrol.** Schedule the run prompt from template section 7 as a recurring agent run, for
   example with the `schedule` skill or cron. Patterns come from rules no gate enforces and
   from entries that have not graduated.
2. **Sample.** Once a week, review five merged agent commits closely:

   ```bash
   git log --since='7 days ago' --no-merges --format='%h %an %s' -i \
     --grep='co-authored-by: claude' --grep='co-authored-by: codex' | shuf -n 5
   ```

   If `shuf` is missing (macOS without coreutils), take the five newest lines.
3. **Transcripts.** Recommend mining past session transcripts for repeated corrections as a separate run; never start it here.

### Step 7 — Review the buffer

Every few days, or when the section passes ten lines:

1. Group the candidates by cause.
2. A cause across several agents or commits becomes a full entry and enters mode B. A one-off
   without damage gets deleted.
3. Empty the section completely.

Tie the review to an existing routine, for example a weekly team ritual.

## What goes in the log

- Only failures that broke something or required a user correction. Never self-corrections
  inside one answer.
- Never an entry without a cause and a preventing rule. That is a note.
- Never turn a single failure straight into a CLAUDE.md rule. The log exists for that stage.

---
name: kitchen-setup
version: 2026-11-20
description: >
  Set up the harness for AI agents in an existing project: the gates and the independent
  grader an agent later works against. Judges which loop size the repository can bear,
  lifts the checks from "you can run them" to "they hold by themselves", sharpens the rules
  in CLAUDE.md or AGENTS.md, installs a grader that never sees the builder's reasoning, and
  proves the harness by testing it red. Triggers: "set up a harness", "prepare this repo for
  autonomous agents", "agent readiness", "agent guardrails", "quality gates for agents",
  "set up grading", "let the agent run the app". BOUNDARY — this skill builds no features
  and no autonomous loop prompt. It sets up the harness, never the driver. For the failure log alone use skill-soup:kitchen-log. To move prose rules into an existing gate use
  skill-soup:kitchen-audit. To fix the checks for one feature before an agent builds it use
  skill-soup:dish-eval.
---

# Harness setup

Build the gates, rules and grader in an existing repository. The more backpressure the gates
encode, the longer the agent may run alone. The reviewer is never the one who did the work.

**Output language:** the language the user writes in. Files in the repository follow the
language of the repository's existing documentation.

## Rules

- Work on a setup branch. Ask before every change to the repository.
- Detect the real commands of the stack. Never guess a command.
- Use check-only variants in every gate (`lint --check`, never `--fix`). An auto-fix changes
  the diff the grader inspects.
- Build only what the readiness verdict needs. A missing precondition is a finding, not a
  reason to build on sand.

## Step 1 — Scan and judge readiness

Collect facts before you ask: the stack, the existing checks (typecheck, lint, test, build)
and whether they run green, the rule file, a definition of done or story format, how the app
starts locally, how bad code gets reverted, the CI history.

Judge the loop size the evidence allows (Robert Glaser, elastic loop):

| Loop size | Means | Needs |
|---|---|---|
| Tight | a human checks every step | green tests on the core modules |
| Elastic | automation with monitoring | hard gates plus a grader |
| Loose | the agent drives, a human samples | gates the agent cannot bypass, plus reversibility |

Name the one binding constraint, for example "core modules have 12 % coverage". If the
user's claims contradict the evidence, show the evidence. If not even tight is bearable, the
binding constraint is the next lever, not the full setup.

## Step 2 — Hard gates

Climb as high as the verdict needs and the permissions allow:

1. **One green command** that bundles typecheck, lint, test and project conventions. The
   human, the hook, CI and the agent all call this command.
2. **A pre-commit hook** that runs it.
3. **A CI check** on every pull request, plus a pull request template with the fields
   Testing, Risk and How to revert. The agent fills them in, the human checks them.
4. **Branch protection with required checks**: the first rung outside the agent's reach. An
   agent can skip a hook with `--no-verify` and edit a workflow file in its own diff. Without
   admin rights for this rung, loose is not available: write that into the verdict.

A sandbox is the next rung and out of scope for this skill.

**Altitude is a second axis, not a rung.** Mutation testing finds tests that assert nothing;
architecture fitness tests find structural drift; property tests (round-trip, invariant,
idempotency, equivalence) find the edge cases nobody imagined; differential tests run the old
and the new system on the same inputs during a migration. Hang them onto existing rungs (fast ones
into the green command, slow ones into CI), and only when the tool exists and the evidence
shows the problem.

**Constrain before you check.** A constraint makes the wrong solution hard to write. Three
pay off almost everywhere:

- a file-length ceiling as a lint rule, with existing large files on an allow list at their
  current length (they may shrink, never grow)
- one checkable place per kind of code, if the project already has that convention
- union types or enums instead of strings for values with a closed set of states

## Step 3 — Rules in CLAUDE.md or AGENTS.md

Soft rules reduce how often a gate fires; they never replace a gate. Write every rule as an
imperative, one instruction per sentence, at most 20 words, no hedging. Report hedged rules
in the existing file before you rewrite them.

Add seven contents:

- **Gate protection.** An agent diff never changes workflow, hook, gate, grader, rubric or
  eval pack (`*.eval.md`) files. The grader returns NEEDS_REVISION when it does.
- **Eval pack.** If a spec has an eval pack, a `*.eval.md` file next to the spec or a
  `## Eval Pack` section in the issue, the agent delivers the evidence in the PR description.
  One line per pack ID, plus three standard rows: test report, diff size, decisions to confirm.
- **What automation cannot check.** The explicit manual remainder: device flows, visual
  details, provider quirks.
- **A failure log.** A `MISTAKES.md` plus two rules: a write rule in a conditional block
  (after a failure, record what happened, the cause, the consequence and the preventing
  rule) and a plain pointer to the file. Never an `@` import: the file grows without bound.
- **The one green command**, with the instruction to run it before every commit.
- **Flaky tests.** Never rerun, sleep or skip a flaky test. Find the cause, or delete the
  test and write down why.
- **Three rounds.** If a check still fails after three repair rounds, stop and hand over to
  the human.
- **High-risk paths.** List them in `REVIEW.md`: auth, billing, CI workflows, release,
  installers. The grader reviews them in depth, and a human always looks at them.

## Step 4 — The grader

1. **A base rubric** in `REVIEW.md` for every diff: the definition of done, the load-bearing
   rules, gate protection, docs that are still true after the change, and for a bug fix the
   root cause, not the symptom. Every criterion is tickable ("every new function has a
   test", not "adequate coverage"). Demand evidence as file and line or a test name, never an
   assurance. Name the shortcuts a builder would sell as done. State what the grader ignores,
   for example style and legacy code. The report opens with the number of findings, or says
   "no findings".
2. **A grader subagent** with fresh context. It gets the rubric, the eval pack or the
   story's acceptance criteria, and the diff. It reads the repository and runs the gates
   itself. It never sees the builder's reasoning, self-assessment or conversation. It reads `REVIEW.md` and the rules
   from the default branch, never from the diff, and checks only the checklist items whose
   trigger matches the diff. It returns PASS or NEEDS_REVISION with findings, each marked
   must-fix, should-fix, nit or pre-existing; only must-fix and should-fix block, style
   findings are dropped. In doubt, NEEDS_REVISION. A verdict holds only for the commit it graded.

   The loop must converge. The builder fixes each finding or answers it with a reason. From
   the second round on, the grader checks only the new diff and its own open findings, names
   the class of a bug instead of one line, and never repeats an answered finding. After three
   rounds, question the approach instead of patching on.
3. **A verify skill**, if the app has a runtime surface: a project-local skill plus a script
   that starts the app, drives the changed surface and captures screenshots, output and
   console errors. It runs before every commit, so make it fast and reliable. If the project
   has room for one test type only, choose end-to-end: it is the hardest to fool.

Feature-specific criteria come later with each feature as an eval pack, written before the
code with skill-soup:dish-eval.

## Step 5 — Test the harness red

Announce the red run, then on the setup branch:

1. Add a deliberate type error. The commit must be blocked and CI must go red. Remove it.
2. Give the grader a diff that adds `continue-on-error: true` to the workflow. It must
   return NEEDS_REVISION. Keep this diff in the repository as the first counter-example.
3. Break the start command of the verify script. It must exit non-zero.

If a test fails here, fix the harness and test again.

## Step 6 — Hand over

Write a short note: the gates and the rung reached, where the grader and the verify skill
live, the result of the red test, the binding constraint, and the next levers. One optional
lever: a commit trailer `Verified: verify | tests | none`, so unverified commits can be
queried.

The outer loop sharpens the harness with evidence from `MISTAKES.md`:

> single failure in `MISTAKES.md` → rule in CLAUDE.md (pattern, not checkable) → gate
> (pattern, checkable)

From three entries with the same cause, ask in this order: can the codebase make the mistake
impossible, can a gate catch it, or does it stay a rule? A grader that nods at rubbish gets
a sharper criterion plus a counter-example. Measure the grader against real reverts and
incidents, each with a one-sentence answer key, and against merged changes that stayed clean,
so it does not over-flag. Measure again after every change to the grader's prompt, tools or
model. Note how each finding ended (fixed, rejected, intended, irrelevant); many rejections
mean noise and a sharper criterion. Sharpen this one grader instead of adding a second. An
agent that tunes itself to the rubric gets a holdout scenario.

## Sources

- Robert Glaser, *Elastic Loop* — [elastic-loop.robert-glaser.de](https://elastic-loop.robert-glaser.de)
- Addy Osmani, *How the Claude Code team thinks about verification* — test types, flaky
  tests, the diff-triggered checklist, observe mode
- Addy Osmani, *How the Claude Code team does code review* — converging review loops,
  risk-scaled review, measuring reviewer noise
- Anthropic, *Verify with an Outcome Grader* — the grade-and-revise mechanic

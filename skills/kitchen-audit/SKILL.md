---
name: kitchen-audit
version: 2026-11-18
description: >
  Move rules from a repository's prose into its gate, end to end: scan the docs for rules a
  tool can check, let the human decide each candidate, add each accepted rule to the gate,
  fix every violation, prove each new rule fires red, delete the prose line it replaces and
  open a pull request. Triggers: "harden the harness", "move prose rules into
  the gate", "turn the docs into lint rules", "graduate rules from AGENTS.md", "tighten the
  backpressure". BOUNDARY — this skill extends an existing gate. To build the gate from
  scratch use skill-soup:kitchen-setup. For the scan alone use skill-soup:kitchen-sweep. For the
  documentation audit alone use skill-soup:doc-diet. To graduate failures from MISTAKES.md use
  skill-soup:kitchen-log.
---

# Harness hardening

**Output language:** commits, pull requests and edited docs follow the repository's
language. Chat follows the user's language.

## Before you start

Stop and report if one of these fails:

- The working tree is clean.
- A gate command exists. If not, point to `skill-soup:kitchen-setup`.
- The gate is green on the default branch.

## Workflow

1. **Scan** with `skill-soup:kitchen-sweep`. It returns a spec with one card per rule.
2. **Decide** the cards with `skill-soup:yay-or-nay`: `adopt`, `retarget`, `keep-prose` or
   `drop`. Ask for the new target after each `retarget`. Without that skill, show the cards
   as a Markdown table with an empty verdict column.
3. **Plan.** Group the accepted cards by tool. Put `enforced` and `drop` into a group "prose
   only". Propose one branch per group that adds a new tool, otherwise one branch for all.
   Wait for a confirmation.
4. **Implement**, one branch after the other, each from the default branch:
   1. Install a new tool first. Add a check-only command to the gate and a repair command
      to the fix command. Write an ADR in the repository's ADR directory that says why this
      tool.
   2. Add the rules. Run the fix command, fix the rest by hand. Every commit leaves the
      gate green.
   3. Prove each new rule red: break it once, run the gate, see it fail with this rule,
      revert.
   4. Delete each prose line from the card's `harness.sources`. If the line carries a reason
      no tool states, keep one sentence with the reason and a pointer to the check.
   5. Ask before the push. The pull request holds one row per rule: rule, check, red proof,
      prose lines removed.
5. **Audit** what remains with `skill-soup:doc-diet`. Its report is the result. Applying it is a
   separate run.

If a rule has more than 50 violations, stop that rule and ask: drop it from this run, or add
it in observe mode (it warns and logs, the gate stays green) and enforce it once the false
alarms are sorted out.

## Rules

- Never weaken an existing rule to get a new one green.
- Never silence a violation with an inline disable. If a violation is intended, ask, and
  write the reason next to the disable comment.
- Never use `--no-verify` and never edit the gate to skip a check.
- Check the current branch before every commit and every push.
- If the user asks for one step only, run only that step.

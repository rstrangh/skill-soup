---
name: kitchen-sweep
version: 2026-11-18
description: >
  Find the rules in a repository's prose that a deterministic tool could check instead of an
  agent reading them: conventions in AGENTS.md, CLAUDE.md, rule directories, contributing
  guides, ADRs and docs. Proposes one concrete target per rule — an existing config, a
  formatter, a rule in an installed linter, a test case, a new tool or a small script — and
  writes the candidates as cards to decide. Changes nothing in the repository. Triggers: "harness
  scan", "find checkable rules in the docs", "which prose rules could a linter enforce",
  "rules that belong in the gate", "scan AGENTS.md for lintable rules". BOUNDARY — this skill
  only finds and proposes. To decide, implement and prune in one run use
  skill-soup:kitchen-audit. To build the gate itself use skill-soup:kitchen-setup. For prose that no
  tool can check use skill-soup:doc-diet. To graduate failures from MISTAKES.md use
  skill-soup:kitchen-log.
---

# Harness scan

**Output language:** the language of the repository's documentation.

## Procedure

1. **Map the gate.** Read the build manifest, every tool config, the git hooks and the CI
   workflows. Note the gate command and the rules each config enables. Never infer rules
   from tool defaults. If no gate exists, say in the report that `skill-soup:kitchen-setup`
   builds one first.
2. **Collect the rules** from `AGENTS.md`, `CLAUDE.md`, rule directories of agent tools,
   `CONTRIBUTING.md`, `README.md`, `docs/` and ADRs. Split collective lines into single
   rules, keep `file:line`, and drop every rule no tool can check.
3. **Pick a target per rule**, the first one that holds:

   | Kind | Target |
   |---|---|
   | `enforced` | a config already checks it, so the prose line goes |
   | `fix` | a formatter or an autofix repairs it |
   | `rule` | a rule in an installed tool |
   | `test` | a case in an existing test suite |
   | `new-tool` | a tool the project does not have yet |
   | `custom` | a small script in the gate |

4. **Write the cards** in the spec format of `skill-soup:yay-or-nay`, outside the repository,
   with the layout from [references/candidate-card.md](references/candidate-card.md).
   Order them by kind as in the table, fewest violations first.
5. **Report** in the chat: the gate command, candidates per kind, the number of dropped
   rules (prose for `skill-soup:doc-diet`) and the spec path. Offer to open the cards, or hand
   back to `skill-soup:kitchen-audit` when it called this skill.

## Rules

- Name the concrete rule, option or test. "Use ESLint" is no target.
- Confirm a rule name in the tool's documentation or installed package. If you cannot, set
  the card's `warning` to "Rule name unverified".
- Count today's violations with `ast-grep` or `grep`.
- If a type or a structure makes the mistake impossible, propose that instead of a check.
- Quote the source word for word. One card per rule: if two files state the same rule, take
  the clearer one and name the other in `extras`.

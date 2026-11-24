# Candidate card

A spec file for `skill-soup:yay-or-nay`, one card per rule. If the output language is not
English, set `lang` and translate the interface `labels`, the option labels and the extras
titles.

## Options

The values stay English, because `skill-soup:kitchen-audit` reads them.

| `value` | Label | Meaning |
|---|---|---|
| `adopt` | adopt | Do as proposed. For `enforced`: remove the prose line. |
| `retarget` | other target | Check the rule, but with a different tool or test. Ask the user which. |
| `keep-prose` | keep as prose | No tool. The prose line stays. |
| `drop` | drop | The rule is obsolete. Remove the prose line, add no check. |

## Card

```json
{
  "id": "H03",
  "title": "Named exports for components",
  "category": "rule",
  "text": "AGENTS.md asks for named exports instead of `export default`. ESLint is installed, no rule checks it.",
  "chips": ["ESLint", "4 violations"],
  "evidence": [{"quote": "No default exports: named exports keep refactoring safe", "source": "AGENTS.md:28"}],
  "extras": [
    {"title": "Proposal", "text": "`no-restricted-syntax` with the selector `ExportDefaultDeclaration` in `eslint.config.js`."},
    {"title": "Effort", "text": "4 files under `src/components/`. No autofix."}
  ],
  "harness": {
    "kind": "rule",
    "tool": "eslint",
    "config": "eslint.config.js",
    "check": "no-restricted-syntax: ExportDefaultDeclaration",
    "violations": 4,
    "sources": ["AGENTS.md:28"]
  }
}
```

- `title` names the rule, not the tool. `text` says what the rule asks and what the gate
  does today, two sentences at most.
- `chips`: the tool, the violation count, and "new" for a tool that is not installed.
- `warning` only for a real caution: an unverified rule name, more than 50 violations, a
  tool with a licence or runtime cost.
- `extras`: "Proposal" with the rule and its config file, "Effort" with violations and
  autofix. For `new-tool`, add the install command.
- `harness` holds the machine fields for `skill-soup:kitchen-audit`. `violations` is `null`
  when no search could count it. `sources` lists every `file:line` that states the rule.

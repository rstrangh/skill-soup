# Templates

## 1. MISTAKES.md skeleton

Write the file in the repository's documentation language.

```markdown
# MISTAKES.md

Failures in this repository — what happened, why, and what prevents it in future.
Newest entries on top.

Recurring entries become rules in CLAUDE.md, or a gate: a test, a lint rule, a CI
check. An entry pointing at a rule has graduated and stays only as evidence.

## Candidates

<!-- Unreviewed findings from patrol runs and commit samples. One line each.
     Reviewed every few days: each line becomes an entry below or gets deleted. -->

---

## YYYY-MM-DD — <one-line title of the failure>

- **What happened:** <the observable symptom, one line>
- **Cause:** <the root cause — not the symptom, but why it came about>
- **Consequence:** <what it cost: lost time, broken data, a red main branch>
- **Prevented by:** <the rule or check that catches this in future>
- **Model:** <harness and model in use, for example Claude Code · claude-opus-5-5>
```

## 2. A filled entry

The maximum level of detail:

```markdown
## 2026-08-02 — Migration against a running dev database without a reset

- **What happened:** `npm run migrate` against a dev database holding old data. The
  migration ran halfway and left the `orders` table without its `status` constraint.
  Then 40 minutes of red tests chasing the wrong trail.
- **Cause:** The migration is not idempotent and assumes an empty state. That is
  written nowhere. The agent assumed it plausibly.
- **Consequence:** Roughly one hour of debugging, dev database repaired by hand. No
  production damage.
- **Prevented by:** Run `npm run db:reset` before every `migrate` in dev. Checkable —
  a candidate for a pre-commit or script guard.
- **Model:** Claude Code · claude-opus-5
```

## 3. A graduated entry

```markdown
## 2026-08-02 — Migration without a reset (3×) → graduated

Rule in CLAUDE.md ("always run `db:reset` before `migrate` in dev"), enforced by
`npm run check:migrations`. Graduated 2026-08-20 under claude-opus-5.
```

A rule retired in the model-change review (SKILL.md, step 5b) keeps the line and gains one
sentence:

```markdown
Rule retired 2026-11-04 under claude-opus-5-5, checked on claude-haiku-5-5. Re-add on the
next occurrence.
```

## 4. Snippets for CLAUDE.md or AGENTS.md

The write rule, as a conditional block:

```markdown
<important if="you broke something, or the user corrected you">
Record the failure in `MISTAKES.md`: what happened, the cause, the consequence, and the
rule that prevents it. Newest entry on top. Record only failures that broke something or
required a correction.
</important>
```

The read pointer, as a plain line:

```markdown
`MISTAKES.md` holds the known failures of this repository with their causes. Read the
file before you work in an area named there.
```

## 5. Local variant

If the log must stay out of the repository:

```bash
echo 'MISTAKES.local.md' >> .git/info/exclude
```

Use `.git/info/exclude`, not `.gitignore`, so the exclusion never shows up in the team's
diff. Use `MISTAKES.local.md` as the path in both snippets. If the rules must stay private
too, put them in `CLAUDE.local.md`.

## 6. Candidate lines

One line per finding, newest on top: date, source, location, finding, the rule or entry it
touches. No cause analysis here.

```markdown
- 2026-10-08 · patrol · `src/feature/orders/api.ts:88` · fetch without timeout (rule "every
  external call has a timeout", no gate yet)
- 2026-10-07 · sample · `a1b2c3d` · agent added a second date helper next to `lib/date.ts`
```

## 7. Patrol run prompt

Adapt the pattern list to the repository.

```text
Search this repository for the patterns below. For each hit, append one line to the
"## Candidates" section at the top of MISTAKES.md, in the format of the existing lines:
date, "patrol", file:line, what you found, which rule it touches.

Fix nothing. Change no other file. Open no pull request. Skip a hit that already stands in
the Candidates section. If you find no hit, change nothing.

Patterns:
- <rule from CLAUDE.md that no gate enforces yet>
- <pattern from a MISTAKES.md entry that has not graduated>
```

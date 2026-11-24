---
name: whats-cookin
version: 2026-11-18
description: >
  Get back into an agent session that has been dormant for days or weeks: a four-field
  briefing (assignment, where it stopped, what happened in the working directory since, the one
  thing waiting on the user) plus a name proposal with a ready /rename line. Never retells the
  session. Works for the running session and for a foreign session by ID. A recall mode searches
  older sessions by topic and carries their decisions and dead ends into the running one.
  BOUNDARY — to preserve a chat's knowledge use skill-soup:boil-it-down.
when_to_use: >
  Triggers: "where were we", "catch me up",
  "get me back into this", "recall", "we solved this before". Also trigger when the user resumes
  a session and the first message looks for orientation rather than giving a work order.
---

# Where were we

Deliver a connection point, not a report. The user lived through the session once and wants to
work again in thirty seconds. A long briefing has failed, even when everything in it is true.

**Output language:** the language of the session.

## Modes

| Mode | When | Source |
|---|---|---|
| **in-session** (default) | The user resumed the session and asks "where were we" | Loaded context **plus** the script |
| **from outside** | The user names a session ID or a path, for example from a morning briefing | The JSONL only. Do not start the session. |
| **recall** | The user starts work on a topic that earlier sessions touched | Several old sessions, section "5. Recall mode" |

## 1. Get the facts

Run the script first in every mode, in-session too. After a compaction the context lost the
first prompt, and the working directory changed outside any session.

```bash
<skill-dir>/scripts/brief.ts                      # running session
<skill-dir>/scripts/brief.ts 69c9d7b7             # by partial ID
<skill-dir>/scripts/brief.ts /path/to/session.jsonl
```

Options: `--turns N` last prompts (default 6), `--tail N` characters of the last answer,
`--no-git` skips the reality check, `--harness claude,codex,pi`.

The output is JSON:

| Field | Carries |
|---|---|
| `first_prompt` | The original assignment, in the user's words |
| `compactions[].intent` | The agent's earlier condensation of the assignment. The stronger signal when present. |
| `last_plan` | The last plan approved through ExitPlanMode |
| `recent_prompts` | Where the session was heading before it stopped |
| `last_assistant` | The final state, often an open question |
| `title` / `slug` | An existing name, possibly stale |
| `idle_days` / `span_days` | How long silent, how long it ran |
| `closed` / `closed_at` | Whether and when a close command ended it (section "Configuration") |
| `reality` | Branch now against then, commits since, dirty files |
| `fallback_entry` | Only when no prompt was typed, meaning a skill start |
| `other_matches` | Further sessions the ID search matched |

## 2. Condense into four fields

**Assignment.** Distil the original goal. Never quote the first prompt. If
`compactions[].intent` exists, prefer it. If the first and last prompts differ in topic, say
that the session changed subject.

**State.** The last half-step at the moment it stopped. `last_assistant` often ends on the
question it got stuck at.

**Reality.** What changed in the working directory since, from `reality`. If nothing changed,
write "unchanged". Follow the artefacts the state names: for pull requests check
`gh pr list --state all`, for a script whether it ran, for a branch whether it still exists.
Stop after one or two cheap checks. Never merge state and reality into one sentence: state is
what the session claims, reality is what the machine says.

**Waiting on you.** Exactly one decision or action. If the last answer ended on a question,
that question is the answer. If nothing waits, say where the user can continue.

## 3. Propose a name

Check an existing title too. If it no longer fits, propose a new one and give the reason in
half a sentence.

Convention: kebab-case, two to four segments, topic instead of project, no dates, no filler
words such as `session`, `work`, `stuff`, `fix`. A category prefix with a slash is allowed.

```
oh-my-zsh-para-autosort      glass-opacity-night-screens
skills-symlink-relocation    wiki/ingest-produktwerker
```

## 4. Output

Chat only. No file, no artefact. Use this format exactly:

```
**{name-proposal}** · {project} · {N} days idle · {M} prompts

**Assignment** {one, at most two sentences}
**State** {one, at most two sentences}
**Reality** {one line — or "unchanged since the session ended"}
**Waiting on you** {the one decision or action}

`/rename {name-proposal}`
```

Put the `/rename` line in a code block. The user runs it; an agent cannot type a slash command.

- In "from outside" mode, add the resume command as a code block.
- If `closed: true`, say so in the header line. If `closed_at` lies before `last_activity`,
  call the session open again.

Leave out: chronology, lists of touched files, results long committed, praise, options the
user chose not to take.

If the assignment cannot be reconstructed (`prompt_count` is 0 and `fallback_entry` carries
only a skill injection), say so. Never guess the intention.

## 5. Recall mode

```bash
<skill-dir>/scripts/brief.ts --recall "virtualized list"
<skill-dir>/scripts/brief.ts --recall "sentry pii" --days 30 --limit 3
```

The query is a few search terms, not a sentence. A session matches only when all terms occur.
The script skips the running session and ranks by hits; a hit in a user prompt counts double.
Options: `--days N` (default 90), `--limit N` (default 5), `--harness`.

Each entry in `sessions` carries `first_prompt`, `compaction_intents`, `last_plan`,
`prompt_hits`, `answer_hits`, `last_assistant` and `resume`. If `matches_total` is 0, propose
other terms once, then stop.

Condense per session, at most three lines:

```
**{project}** · {last_activity} · {title or name proposal}
Decided: {what was settled, with the reason}
Dead end: {what was tried and failed, and why}   ← leave out when none
Open: {what stayed unresolved}                   ← leave out when none
```

Close with one line: what applies to the current task. Leave out sessions that mention the
terms only in passing. If two sessions contradict each other, say so and name the newer one.
Never resume an old session yourself. If the user wants to continue there, give the `resume`
command in a code block.

## Configuration

Optional: `~/.config/whats-cookin/config.md`. The script reads two lines and ignores the rest.
Without the file, no session counts as closed and no prompts are filtered.

```markdown
close_commands: /wrap-up, /team:wrap-up
ignore_prefixes: # Task: nightly import
```

| Key | Meaning |
|---|---|
| `close_commands` | Comma-separated slash commands that close a session. A session that ran one gets `closed: true`. |
| `ignore_prefixes` | Comma-separated prompt starts that no human typed, for example from a scheduled job. These prompts never count as the assignment. |

## Maintenance

After a script change, run `brief.ts --self-test`. The script parses Claude Code, Codex and Pi
JSONL defensively, so a format change yields empty briefings, not an error. After a harness
update, check that `prompt_count` is above zero for a fresh session of every harness. The
known parser traps are commented in `scripts/brief.ts`.

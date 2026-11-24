---
name: closing-time
version: 2026-11-18
description: >
  Close an agent session in one pass: commit and push what is open (with confirmation),
  store what the session taught in the right memory file, list what to improve next time,
  then print a short summary of what got done with content ideas below it. Ends with two
  questions on the user's own understanding. Writes no journal and marks nothing. Triggers:
  "closing time", "/closing-time", "wrap up the session", "close out this session", "call
  it a day", "I'm done for today". BOUNDARY — this skill is the self-contained close-down.
---

# Closing time

**Output language:** the language the user writes in.

## Rules

- Ask before every commit, every push, every move or rename and every memory write.
- Never push to `main` or `master` without explicit approval.
- Never deploy.
- If the user asks for part of the run ("only the summary", "without git"), run only that
  part.
- If a step has nothing to do, for example git outside a repository, say so in one line and
  skip it.

## Step 1 — Ship

1. List the repositories this session touched: the working directory plus every repository
   you edited files in. Take them from this session, never from other sessions.
2. Per repository, show branch, uncommitted changes and unpushed commits.
3. For uncommitted changes, propose a commit message and ask. After a commit, ask before
   the push and name branch and remote.
4. Check the files the session created against the project's naming and folder conventions.
   Documents never sit in the root or in code folders. Propose moves and ask.
5. Close finished tasks in the task list and name orphaned or blocked ones.

## Step 2 — Remember

Propose one place per item the session taught:

| What | Where |
|---|---|
| Something broke, or the user corrected you | `MISTAKES.md` in the repository, never the rule file |
| A permanent project convention | the project's agent instruction file (`CLAUDE.md`, `AGENTS.md`) or its rules folder |
| A rule for certain files only | a rules file scoped to those paths |
| A pattern or quirk you discovered | the agent's own memory, if the harness has one |
| Personal or temporary context | a local, git-ignored instructions file |

- A `MISTAKES.md` entry holds: what happened, cause, consequence, the rule that prevents it.
  If the cause is unknown, write "cause unknown".
- If `MISTAKES.md` now holds three or more entries with the same cause, propose to graduate
  them: a test or lint rule when a tool can check it, otherwise a rule in the instruction
  file.
- Before you write a local instructions file, check that git ignores it.
- Ask one question: which procedure in this session would make a good skill? Name it. Never
  build it here.

## Step 3 — Review

Look for what would make the next session better. After a short routine session, say
"nothing to improve" and go on.

| Category | Look for |
|---|---|
| Skill gap | what you got wrong or needed several attempts for |
| Friction | manual steps that repeated, things the user had to ask for that should have happened |
| Proxy | context the user carried in by hand: pasted threads, mails, screenshots, terminal output you could not see |
| Knowledge | facts about the project or the user's setup you lacked |
| Automation | patterns worth a script, a hook or a skill |

Propose one action per finding, the first that fits: a gate (test, lint rule, hook), a rule
in the instruction file, a memory entry, a new skill or script. For a proxy, propose a
connector or CLI, a fetch script, or keeping it manual on purpose. Apply only what the user
confirms.

## Step 4 — Summary

Print it in the chat and write it nowhere:

```
What got done
- <outcome, not activity: what works now, what was decided>
- <what is open and why>

Content ideas
- <title> — <one line: the angle, the audience>
```

- Three to six outcome lines.
- Add content ideas only for a surprising finding, a mistake others will make too, or a
  before and after. Never draft the content. Without such material, leave the section out.

## Thinking check

After a substantial session, ask two questions. Skip them after pure routine.

1. What did you accept today without being able to explain it?
2. Do you end with a stronger or a weaker mental model than at the start?

If question 1 surfaces something, go through it together briefly. Never insist on an answer.

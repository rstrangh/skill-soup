---
name: personal-readme
version: 2026-11-18
description: >
  Interview someone, in a friendly and structured way, until their Personal README is
  written: a "user manual for working with me" that covers background, expertise, work
  style, communication preferences, strengths, weaknesses, and how AI agents should work
  with them. Produces one Markdown file. Triggers: "personal readme", "write my
  personal README", "user manual for working with me", "how to work with me", "onboarding
  profile", "introduce myself to the team". Also trigger when someone joins a new team and
  wants to state their collaboration preferences, even without the words "Personal README".
  BOUNDARY — this skill covers the work context.
---

# Personal README

**Output language:** the language the user writes in, for the questions and the README,
unless the user asks for another. The questions below state the intent; phrase them in your
own words.

## Interview rules

- Ask in blocks of two or three questions. Wait for the answer before the next block.
- Every question is optional. If the person skips one, move on without comment.
- Push gently for honesty on strengths and weaknesses.
- Ask for private details (family, home, age) only as one optional question, and never
  follow up on them.

## Step 1 — Frame it

Say in two or three sentences what a Personal README is, that the interview takes 15 to 20
minutes, and that every question is optional. Ask for the file handle.

## Step 2 — The blocks

Work through the blocks in order. Do not read the block names out.

| Block | Ask about |
|---|---|
| Basics | Full name. Optional: background, education or life that colleagues should know. |
| Role | Current role and since when, education or training, side projects or other commitments. |
| Expertise | Core topics, technologies and tools, their superpower. |
| Current work | Projects now, initiatives on the side. |
| Work style | When and where they work, what makes them productive, how they give and take feedback. |
| Communication | Formal or informal address (where the language has both), short or detailed, preferred channels, what annoys them, what works well. |
| Learning and deciding | How they learn best (reading, video, doing), how they decide (analysis, gut, both), patterns they notice in themselves. |
| Strengths and weaknesses | Biggest strengths, real weaknesses, what colleagues should know. Announce this block as the most useful one. |
| Interests and goals | Interests outside work, professional goals, absolute no-gos. |
| AI agents | Say that agents can read the README. Ask four things: **role** (mentor, sparring partner, wingman, coach, or a mix), **language** (address, length, tone, which language), **way of working** (proactive or on request, finished solutions or prompts to think, ask or assume when unsure), **character and no-gos** (pragmatic, curious, patient, direct; what an agent must never do). |

## Step 3 — Play it back

Summarise the answers block by block, a few lines each. Ask what is wrong or missing.

## Step 4 — Write the file

Fill the template below. Leave out every section the person skipped. Never fill a gap with
a placeholder or a guess.

Save the file as `<handle>.md` in `output_dir` from `~/.config/personal-readme/config.md`
(one line, `output_dir: <folder>`). Without the configuration, ask where to save it. Tell
the person the path.

```markdown
# Personal README – {full name}

## About me
{Background in two or three sentences, only what the person shared.}

## Role
- **Current role:** {role} (since {year})
- **Education:** {degree or training}
- **Also involved in:** {side projects}

## Expertise
- **{area}:** {details}
- **Tools:** {list}
- **Superpower:** {one line}

## Current work
{projects}

## How I work
- **When and where:** {times, remote or office}
- **What helps me:** {conditions for productivity}
- **Feedback:** {how to give it, how I give it}

## How to talk to me
{preferences as bullets: address, length, channels, what annoys me, what works}

## How I learn and decide
{learning style, decision style, patterns}

## Strengths
- **{strength}** – {what it means for working with me}

## Weaknesses
- **{weakness}** – {what helps}

## Interests and goals
{interests, short- and long-term goals}

## No-gos
{list}

## For AI agents
- **Role:** {mentor, sparring partner, wingman, coach, mix}
- **Language:** {address, length, tone, language}
- **Way of working:** {proactive or on request, solutions or prompts, ask or assume}
- **Character:** {description}
- **Never:** {what an agent must not do}
```

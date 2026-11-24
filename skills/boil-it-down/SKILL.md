---
name: boil-it-down
version: 2026-11-18
description: >
  Distil the running chat conversation (ChatGPT, Claude.ai, Gemini and other chat systems)
  into one compact markdown knowledge artefact: decisions with their reasoning, verbatim
  facts and sources, open questions and risks, the user's own sharp formulations, and the
  dead ends. No work order, no handoff — pure preservation of the information before the
  chat silts up. Triggers: "boil this
  down", "distill this conversation", "save this chat before it's gone", "extract the
  knowledge from this thread". BOUNDARY — this skill preserves knowledge for a human to
  look up in six months. If the user needs a handover so someone can continue the work,
  that is a handoff and NOT this skill. To read one dictated monologue and act on it use
  skill-soup:brain-salad.
---

# Boil it down

Pull the knowledge out of the chat. Leave the process behind.

**Output language:** the language of the conversation. Technical terms and quotes stay in
their original language, even mixed.

## Source and scope

Distil the history above this instruction: the chat you are running in. No files, no
export. If there is no meaningful history, say so and distil nothing.

A distillate is the last copy before forgetting, so it keeps knowledge a handoff would drop.
**Never write a "next steps" section.** An intention such as "I still want to check that"
goes under *open questions*, never as an order.

## Procedure

1. **Inventory the threads first.** Walk the conversation once and list the topic threads
   internally, sorted by subject, never chronologically. Front-to-back summaries lose the
   threads that opened early and returned late; the list is the checklist against that.
2. **Sort every thread into the template.** A thread that fits no section goes under *not
   included*.
3. **Fidelity check.** Hold the distillate against the source:
   - Every number, proper noun and link appears **exactly** like that in the chat.
   - Every quote is verbatim.
   - Remove anything plausible that never appeared in the chat.
   - No thread from step 1 is missing.

One invented detail poisons the source the user relies on after the chat is gone. An honest
gap is acceptable.

## What stays, what goes

**Stays:** every decision with its reasoning and the rejected alternative · facts, numbers,
names, links, code excerpts verbatim · open questions, assumptions, risks · the user's own
sharp formulations · contradictions and the places where the user pushed back · dead ends
**with the reason** ("tried X, fails at Y").

**Goes:** greetings, thanks, meta-talk · repeated statements (the best version stays) ·
model hedging and boilerplate · process steps without a result · work orders and next steps.

## Mark where a fact came from

| Tag | Meaning |
|---|---|
| `[sourced]` | The source was named or linked in the chat. Carry the link over. |
| `[model claim]` | The model said it and nobody verified it in the chat. |
| `[assumption]` | Set by the user or the model, deliberately unverified. |

If the origin is unclear, the fact is a `[model claim]`. Never upgrade a tag.

## Output format

**One** markdown code block the user can copy in one piece. No preamble, no file.

```markdown
# Distillate: <topic in 3 to 6 words>

> Source: <ChatGPT / Claude.ai / …, model if known> · conversation of <date, if visible> · distilled on <today>

## What this was about
Two to four sentences: the occasion and the guiding question.

## The core in five sentences
The absolute minimum you want to know in six months. Five sentences, no more.

## Decisions
| Decision | Reasoning | Rejected alternative |
|---|---|---|

## Facts, numbers, sources
- **<statement verbatim>** `[sourced]` — <link or source>
- **<statement verbatim>** `[model claim]`

## Open questions and risks
- <question> — <why it stayed open>

## Own formulations
> <verbatim quote from the user>

## Dead ends
- <attempt> → failed at <reason>

## Not included
- <thread or area>, because <reason>
```

- Drop empty sections. Never write "none". *What this was about* and *the core in five
  sentences* always stay. Drop *not included* only when nothing was left out.
- If a thread fits no section (a term definition, a timeline, a tool comparison), append a
  section of your own.

## Length

Target 10 to 20 percent of the source length; a two-hour chat becomes one to two pages.
**Never drop a decision, a fact or an open question to hit a length.** Shorten the phrasing,
never the content.

## Disclose your limits

If you suspect you see only part of the chat (lazy-loaded web history, a compacted context),
write that under *not included*, for example "earlier messages not in context". For very
large material, offer to distil in parts: "distillate part 1 of 3: threads A and B".

## Afterwards

After the code block, add one sentence that offers reuse: save it as a file, or hand it to a
fitting skill (one that stores learnings, one that develops a blog idea). If the user says
nothing, stop.

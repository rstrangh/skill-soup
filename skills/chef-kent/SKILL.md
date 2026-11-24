---
name: chef-kent
version: 2026-11-18
description: >
  Draft a blunt, gutsy reply to a hostile message in the style of Roy Kent from Ted Lasso:
  few words, honest to the bone, profanity as punctuation, contempt for the behaviour and
  never for the person. Produces a read of what is really going on, a full-heat reply, a
  work-safe reply and always one reply the user would still send tomorrow, plus a send
  check that names what each one costs. User invocation only: /skill-soup:chef-kent,
  /chef-kent. Triggers:
  "reply like Roy Kent", "what would Roy Kent say", "give them a piece of my mind", "draft
  a gutsy reply". BOUNDARY — this skill answers with force. For a friendly, de-escalating
  reply use skill-soup:chef-lasso.
disable-model-invocation: true
user-invocable: true
---

# Roy Kent reply

Someone sent the user a hostile, unfair or bullshit-laden message. The user wants to answer
with force and still be able to look at the reply tomorrow.

**Output language:** the language of the input. A German thread gets a German reply.

## The stance

Few words: say it once and stop. Name what is actually wrong, including what nobody says out
loud. Profanity is punctuation: a swear word carries rhythm or meaning, never fills space.
No justification, no points for the audience. When the other person has a point, concede it
grudgingly in one sentence. Roy is never cruel, petty, sarcastic for sport, or a bully.

## Limits

These limits hold in every variant, including Full Kent:

- Target only what the other person did and wrote: the claim, the tone, the dodge, the
  missed deadline. Never appearance, origin, gender, health, family or any group.
- No threats, nothing that implies violence, no consequences the user cannot or would not
  carry out.
- No slurs, no sexual insults aimed at a person.
- No claims the thread does not support. Rude is allowed, false is not.
- No private details of the other person that are not already in the thread.

If the user asks for something past these limits, write the strongest reply inside them and
say in one line what you left out.

## Deliver in this structure

### 1. Read, two sentences

What is the other person doing: deflecting blame, pulling rank, testing a boundary, venting
at the wrong target? What exactly deserves the contempt?

### 2. Three replies

| Variant | Character |
|---|---|
| **Full Kent** | Full heat. NSFW. Profane, short, blunt. |
| **Kent with a collar** | Same spine, no swearing. Works in a work channel. |
| **Tomorrow-proof** | The reply the user would still send after a night's sleep. Firm, calm, short. Always included. |

Every reply answers what was actually said, names the one point that matters and drops the
rest, and sounds like the user on a bad day, not like a TV character.

### 3. Send check, two to four lines

Name the audience: who reads it, who gets it forwarded, who sees a screenshot next week.
Name the cost of each variant: the relationship, the job, the client. Recommend one variant
in one sentence.

## Voice

- Compose each insult from the specific situation. Never string together stock swear words.
- Vary the rhythm: one-word sentences next to a single developed image.
- Leave the punchline unexplained.
- Never quote the show. No emoji. No "with all due respect", no "I don't want to be rude,
  but".

## Special cases

- If the user made the mistake, say so first, in Roy's voice, and write the replies around
  owning it.
- If writing no longer helps, one reply may refuse to continue in text: "Not doing this
  over chat. Call me."

## Example

**Input:** a project lead writes in a team channel that the user "as usual" delivered
late. The delay came from the lead's own missing approval.

**Read:** this is blame-shifting in public. The "as usual" deserves the contempt: it turns
one late approval into a character judgement.

**Full Kent:**

> "As usual."? Fuck off! It sat on your desk for nine days waiting for your
> fucking approval. Check your inbox before you check my calendar.

**Kent with a collar:**

> "As usual" is not true, and you know it. The deliverable waited nine days for your
> approval. Happy to talk about the process, not about my reliability.

**Tomorrow-proof:**

> The delay came from the open approval, nine days. Let's fix the approval step so it
> does not happen again.

**Send check:** public channel, the whole team reads it, the lead's manager probably too.
Full Kent wins the moment and loses the next six months. Send "Kent with a collar": it
corrects the record in front of the same audience that saw the accusation.

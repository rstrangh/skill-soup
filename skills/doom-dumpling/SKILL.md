---
name: doom-dumpling
version: 2026-11-18
description: >
  Runs a pre-mortem on a plan: fresh subagents without conversation context assume
  the plan has already failed catastrophically and write the autopsy report. This
  finds specification gaps and blind spots that the author no longer sees after days
  in the detail. Use this skill when the user wants to stress-test a plan, a concept,
  a spec, an architecture document or a proposal before implementation. Triggers: "pre-mortem", "red team this
  plan", "what am I missing", "why would this fail", "stress-test the plan", "poke
  holes in this". Also use it when the user does not name the method but clearly
  wants a finished plan checked for gaps before starting.
---

# Pre-Mortem

Method: pre-mortem, prospective hindsight (Gary Klein). Two mechanisms are non-negotiable:

1. **Fresh sessions.** The reviewers receive the plan and nothing else: no conversation
   context, no author rationale. A reviewer who knows the design discussion fills the
   plan's gaps without noticing and misses them.
2. **Failure as fact.** The plan has failed. The reviewers diagnose; they never debate.

**Output language:** the language of the plan.

## What this skill does NOT do

- It proposes no repairs. The report diagnoses; the plan author repairs in the next
  iteration.
- It never invents findings. An excellent plan gets a short autopsy.

## Procedure

### 1. Get the plan

If the plan is a file, note the path. If the user pasted the plan, write it unchanged into a
file in the current working directory, for example `plan.md`, so the report has a neighbour.

Pass the plan on verbatim. Never summarise, rephrase or complete it. If the plan looks
incomplete, leave it incomplete: the reviewers are supposed to find that gap.

### 2. Start four pathologists in parallel

Start four subagents **in a single message**. Each gets the prompt template with exactly one
lens and the plan. Nothing else.

```
You are a reviewer in a pre-mortem. Imagine it is twelve months later. The plan below
was implemented exactly as written, and it failed catastrophically. The project is
dead, the money is burned, the people involved are frustrated.

Your job: write the autopsy report. What was the cause of death?

Your lens: [LENS — insert the description from the table below]

Rules:
- The failure is settled. Never defend the plan. Never qualify.
- Every finding needs evidence: quote the passage in the plan that shows the problem,
  or name precisely which detail is MISSING although the implementation needed it.
  Missing details are the most valuable findings.
- Reject generic findings that fit any plan in the world ("communication could have
  been better", "more tests would have helped"). If a finding does not hang on a
  concrete passage of THIS plan, delete it.
- Build the causal chain per finding: gap or assumption in the plan, then what
  happened during implementation, then how that caused the failure.
- Write in the language of the plan.

Return raw data, not prose for humans. Per finding: title (max 10 words) | evidence
(quote or "missing: …") | causal chain | severity (fatal / severe / annoying) |
question to the plan author that would close the gap.
At the end: your ONE most probable cause of death.

--- PLAN (verbatim) ---
[PLAN TEXT]
```

| Lens | Focus |
|---|---|
| Specification | Ambiguities, unstated assumptions, missing definitions, contradictions inside the plan. What does the implementer have to guess because the plan omits it? |
| Technology | Feasibility, dependencies, integration points, scaling, hidden complexity, passages that sound easy and are not. |
| People and process | Ownership, missing skills, stakeholders who do not cooperate, coordination the plan ignores, motivation and stamina. |
| Time and scope | Estimation errors, wrong sequence, external dependencies on their own clock, creeping scope, missing abort criteria, drift between the plan and what actually gets built. |

If a lens does not fit the plan, replace it, for example "people and process" in a solo
weekend project. Replacements: budget and cost, law and data protection, family and everyday
practicality. Keep four distinct viewpoints.

### 3. Synthesise

Wait for all four reviewers. Then:

- Merge duplicates. Overlap across lenses reinforces one finding.
- Rank by severity times plausibility, fatal first.
- Discard generic findings. Five sharp findings beat twenty lukewarm ones.
- Collect the questions to the plan author. Each answered question closes one gap.

### 4. Write the report

Write the report to `<planname>.premortem.md` next to the plan file:

```markdown
# Pre-Mortem: [plan title]

> Four fresh sessions assumed this plan had failed catastrophically and diagnosed the
> cause of death. Date: [date], plan: [file name]

## Most probable cause of death

[The one finding that several lenses support, or that carries the strongest causal
chain. Three to five sentences.]

## Findings

### 🔴 Fatal
[Per finding: title, evidence (quote or "missing: …"), causal chain, which lenses
found it]

### 🟠 Severe
[…]

### 🟡 Annoying
[compact, a list is enough]

## Questions to the plan author

[Numbered list. Each answered question closes one concrete gap. The list is the
to-do for the next plan iteration.]
```

In the chat, report three things only: the TL;DR (cause of death plus the finding count per
severity), the path to the report, and the two or three most important questions to the
author. Never paste the report into the chat.

---
name: slide-souffle
version: 2026-11-18
description: >
  Audit presentation decks against Carmine Gallo's nine Talk Like TED public-speaking
  principles and general presentation quality. Use when reviewing, critiquing, scoring, or
  improving slide decks supplied as PPTX, PDF, slide images, Markdown slides, or HTML-based
  slide decks such as Slidev or Reveal.js. Evaluate both deck-level storytelling and
  slide-level evidence, distinguish what can be inferred from slides from speaker-only
  behavior, and return prioritized, concrete recommendations rather than generic design
  advice. Also use it before a new talk deck gets built, to agree on the spine first.
  Triggers: "build the talk", "review my deck", "audit these slides",
  "talk like TED". BOUNDARY — this skill judges the deck's storytelling and presentation
  quality.
---

# Talk Like TED Auditor

Score two dimensions separately and never merge them into one number: **Gallo alignment**
([references/gallo-rubric.md](references/gallo-rubric.md)) and **presentation quality**
([references/presentation-quality.md](references/presentation-quality.md)). A strong deck
can diverge from TED conventions on purpose.

## Spine gate (new deck, no slide yet)

Before you build a new deck, agree on five lines in the user's own words:

1. **Core sentence** — the one thesis the audience takes home.
2. **Running example** — one concrete example that carries the whole talk.
3. **Borrowed concepts** — each named theory or term with author and source. If the source
   is missing, ask for it.
4. **Audience and timebox** — who listens, how many minutes, what follows (discussion, Q&A).
5. **Exclusions** — what stays out.

- Never write the core sentence yourself. Offer two or three candidates at most.
- Show the five lines as one block and wait for explicit confirmation.
- If the user says "just build it", state the five lines you assume, mark each assumption,
  and build.
- Before the deck is published, check the wording of every slide.

## Audit workflow

1. Reconstruct slide order, titles, content, media, speaker notes and sections.
   - Markdown, Slidev, Reveal.js: use the slide separators; read frontmatter, notes, comments
     and components; separate authored content from theme boilerplate; prefer source text
     over OCR.
   - PDF or images: treat speaker notes and animations as unavailable, not as absent.
   - PPTX: count build order and animations only when tooling exposes them.
2. Mark each of the nine principles `assessable`, `partially assessable` or
   `not assessable`.
3. Score each assessable or partially assessable principle 1–5 per the rubric. Exclude
   `not assessable` from averages; never count it as zero.
4. Gallo score (0–100): average of the scored principles, normalized from 1–5. State the
   coverage, for example `78/100 based on 6 of 9 assessable principles`.
5. Presentation quality score (0–100) per its rubric.
6. Rank the five highest-leverage changes by impact, not by ease.

## Evidence rules

- Ground every criticism in the deck: "Slides 7–10 repeat one claim in four similar
  diagrams" — never "You are not passionate enough".
- Never claim anything about delivery, rehearsal, voice, body language or authenticity.
  Write `Not assessable from the deck alone` or
  `Partially assessable: the slides support this, but delivery decides`.
- Write recommendations as concrete transformations with slide numbers. Weak: "Use more
  storytelling." Strong: "Replace the background on slides 3–5 with a 60-second story of one
  user stuck in the current process, then reveal the broader problem on slide 6."

## Output

1. **TL;DR** — 2–5 sentences: verdict, strongest quality, biggest weakness, the one
   highest-leverage change.
2. **Scores** — both scores with coverage, then a table of the nine principles: principle,
   score `1–5` or `N/A`, assessability, evidence, recommendation.
3. **What already works** — 3–5 strengths with slide numbers.
4. **Main problems** — only the few that hurt the talk materially.
5. **Top 5 changes** — each with what, where, why, and how.
6. **Slide-by-slide audit** — only for short decks or on request; one or two observations
   per slide.

## Guardrails

- Never reward TED theatrics that conflict with the talk's purpose, audience or setting.
- Never penalize technical depth for being technical.
- Judge the 18-minute rule against the real timebox. If the duration is unknown, judge
  density and ask only when the duration blocks a conclusion.
- Sparse slides are not automatically good slides. Visual polish is not narrative quality.
- Recommend humour, personal disclosure, demos or spectacle only when they serve the
  argument.

---
name: lingo-lasagne
version: 2026-11-18
description: >
  Before unfamiliar work, teach the user the vocabulary and the mental model of a domain they
  do not know, so the next prompt uses the words a professional would. Produces one HTML page:
  the mental model in a few steps, a vocabulary ladder from basic to advanced with a sentence
  per term applied to the user's own case, the classic confusions, and the user's vague request
  rewritten as precise prompts. Does not do the work itself. Triggers: "teach me", "teach me
  my unknowns", "I don't know anything about", "I don't know what I don't know", "what
  vocabulary do I need", "how do professionals say this", "help me prompt you better on
  this". BOUNDARY — this skill teaches an unfamiliar domain before the work starts. To find
  the unknowns in one part of a codebase before a task use skill-soup:mise-en-place. To explain one paper or study as a lift-the-flap page use
  skill-soup:paper-flaps. To grasp one mechanism by turning knobs on a working model use
  skill-soup:taste-and-tweak.
---

# Teach me

**Output language:** the language the user writes in. If the request is too short to tell,
use the language of the earlier conversation, then the language of the user's instructions,
then English. Keep established technical terms in their usual form and explain them.

## What this skill does NOT do

- It never does the work itself. It ends with better prompts.
- It teaches only the part of the field the user's task needs.
- It never presents a fact that changes over time (laws, prices, product versions, limits)
  as settled. Such a fact carries a source or the mark "verify", in the output language.

## Input

The domain and the user's concrete case, for example "color grading for the launch video".
If the concrete case is missing, ask one question for it.

## Step 1 — Find the mental model

Describe the domain as three to five steps or layers a professional moves through, in order.
One sentence per step: what happens there and why at that point. Take the model a
professional draws on a whiteboard, not a textbook's table of contents.

## Step 2 — Build the vocabulary ladder

Pick eight to twelve terms, from the term every beginner meets first to the term that
separates a professional from an amateur.

| Part | Content |
|---|---|
| Term | The professional word, plus a common synonym if one exists |
| Meaning | One or two plain sentences |
| Unit or scale | How the thing is measured, if it is measured |
| Said by a professional | One sentence that uses the term on the user's concrete case |

## Step 3 — Name the classic confusions

List three to five beginner mix-ups: the confusion, the consequence, how to recognise it.
Prefer confusions that would make the user's next prompt wrong.

## Step 4 — Rewrite the request

Write three precise prompts with the new vocabulary, from a small first step to the full
task. Show each as a pair: the user's vague version and the precise version.

## Step 5 — Add a self-check

Write three multiple-choice questions on the user's concrete case. On click, reveal the
answer and link to the term or the step that explains it.

## Step 6 — Render the page

Copy [assets/template.html](assets/template.html) and fill it: replace every example text,
repeat each block as the steps above say, keep the structure, the classes and the script.
Set `<html lang>` to the output language and translate the headings, the navigation and the
button labels.

If the domain is visual or numeric and an interactive element explains a term better than a
sentence, add one: for example a contrast slider on a sample image or a calculator for a
formula.

Save the file as `teach-me-YYYY-MM-DD-<slug>.html` in the output folder from the
configuration, else in the current working directory. Open the file.

## After writing the file

Reply in chat with the mental model as one line, the three terms the user most likely
lacked, and the first precise prompt as a code block. Then name the file path.

## Configuration

Optional. `~/.config/lingo-lasagne/config.md` names the output folder:

```markdown
# lingo-lasagne

## Output folder
~/Documents/Notes
```

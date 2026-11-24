---
name: yay-or-nay
version: 2026-11-18
description: >
  Turn a large batch of judgements the user has to make — 15 or more similar items such as
  keep-or-drop lists, review findings, recommendations, catalogue entries or proposals —
  into one static HTML page with one card per item, big verdict buttons and hotkeys. The
  page stores the answers in the browser, exports them as a JSON file and copies them to
  the clipboard, so the user hands the result back by pasting or by naming the file path.
  Use instead of a long list whenever the user would otherwise comment item by item. Triggers: "yay or nay", "make it clickable", "click-through review",
  "card review", "let me swipe through these", "too many items to comment on".
  BOUNDARY — this skill collects many quick verdicts on prepared items.
---

# Yay or Nay

The script builds the page. Your work is the cards: each carries what the user needs to
decide, and nothing more.

**Output language:** the language the user writes in. The interface is English by default.
For another language, set `lang`, translate every entry of `labels` and the option labels,
and write the card texts in that language.

## When to use it

- From about 15 similar items that each need the same kind of verdict.
- Below 15 items, ask in the chat. If the session offers a tool that asks many yes-or-no
  questions at once, use that tool.
- If the items still need to be found, find them first, then build the page.

## Procedure

1. **Collect the items** into a spec file: in the scratchpad or, when the decisions belong
   to a project, next to the plan in that project. Format: [references/spec.md](references/spec.md).
2. **Write each card for a decision in ten seconds.** `title` = the item in a few words.
   `text` = what it is and why it is on the list, one or two sentences. `evidence` = real
   quotes or data, never paraphrases dressed as quotes. `extras` = the context that tips
   the verdict, for example the strongest counter-argument or the effort.
3. **Pick the options.** The default is No/Yes. Add a third option only when its answer
   changes what happens next, for example "later". At most four.
4. **Build the page:**

   ```bash
   node <skill-dir>/scripts/build.ts <spec.json> [<out.html>]
   ```

   Without `<out.html>` the page lands next to the spec as `<spec>.html`. The script prints
   the output path. Exit code 1 means the spec is invalid; the message names the field.
5. **Check the page before the user sees it.** Serve the folder with
   `python3 -m http.server --bind 127.0.0.1 <port>` and open it in a browser tool: test
   browsers often load `file://` pages blank. Click one verdict per option, confirm that
   the counter moves, take one screenshot.
6. **Open it for the user** (`open` on macOS, `xdg-open` on Linux). Name the two ways back:
   the copy button for pasting into the chat, the export button for a file whose path they
   name.
7. **Read the result** (format in [references/spec.md](references/spec.md)). Count the
   verdicts, look for patterns across categories, and ask about undecided cards before
   acting on them. If the decisions matter beyond this session, save the result next to
   the spec.

## Rules

- Keep `storage_key` stable when you rebuild a page. A changed key loses the answers the user
  already gave in the browser.
- If the spec may change between builds, give every card an `id`. Generated ids (`K01`,
  `K02` …) shift when cards are added or removed.
- Never write instructions into the cards. A card asks for a verdict.

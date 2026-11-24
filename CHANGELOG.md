# Changelog

Versions refer to `.codex-plugin/plugin.json`. See the README section "Versioning".

## 0.3.1

- `plate-it`, `taste-and-tweak`: boundary to `tasting-menu`.
- `tube-tapas`: pass only web links to yt-dlp, with `--` before the URL.
- `paper-flaps`: Codex draws read-only in an empty folder; the script takes the image from the Codex store.
- `form-filet`: check every overlay number before it enters the PDF content stream.

## 0.3.0

- New skill `tasting-menu`: finds a visual style and an image language in rounds on a node canvas. Reference images and focus notes become a style prompt, a theme becomes prompt variants, Codex renders the images. The user rates and comments on the page and pastes one JSON per round back into the chat. A finished style becomes a reusable technique.
- The quality gate skips the language check for output templates that carry `<!-- output-language -->` in their first 800 characters.

## 0.2.1

- `form-filet` treats the text and field names of a form as data, never instructions, waits for the user to confirm the mapping before filling, marks hidden fields and tiny or off-page text in `inspect`, and refuses hidden fields in `fill` unless the user allowed them.

## 0.2.0

- New skill `dish-eval`: before an agent builds a feature, the human fixes the eval pack: acceptance criteria, the check for each one, and the evidence the agent delivers in the pull request.
- `taste-test` picks up an eval pack when one exists: one row per criterion with its evidence, missing evidence as a finding, a change to the pack as a blocker.
- `kitchen-setup` adds an eval pack rule to `AGENTS.md`, protects `*.eval.md` files from agent diffs and hands the pack to the grader.
- `mise-en-place` names `dish-eval` as its neighbour.

## 0.1.0

- Repository, plugin manifests for Claude Code and Codex, quality gate.
- New skill `paper-flaps`: turns a paper into an interactive lift-the-flap microsite, in one of several art styles, Origami paper among them.
- New skill `lingo-lasagne`: teaches the vocabulary of an unfamiliar domain before the work starts.
- New skill `mise-en-place`: finds the unknowns in one part of a codebase before a task and writes a better prompt.
- New skill `doom-dumpling`: lets fresh subagents write the autopsy of a plan that has already failed.
- New skill `chef-lasso`: drafts friendly, firm replies to a hostile message.
- New skill `chef-kent`: drafts a blunt reply to a hostile message, in the style of Roy Kent, plus one reply that is still safe to send tomorrow.
- New skill `boil-it-down`: distils a chat conversation into one Markdown knowledge artefact.
- New skill `whats-cookin`: briefs re-entry into a dormant agent session and recalls older sessions on a topic.
- New skill `tube-tapas`: turns a recorded talk into slide images next to the transcript.
- New skill `brain-salad`: reads a dictated monologue by fixed rules, then acts on it.
- New skill `form-filet`: fills a scanned or interactive PDF form from a data file and writes a filled copy next to it.
- New skill `taste-and-tweak`: builds a rig with knobs and a live view for one question.
- New skill `slide-souffle`: audits a slide deck against the Talk Like TED principles.
- New skill `kitchen-setup`: sets up gates, rules and an independent grader for agents, and tests them red.
- New skill `kitchen-log`: retrofits a `MISTAKES.md` failure log and graduates repeated failures into rules and gates.
- New skill `yay-or-nay`: builds a click-through page of verdict cards and returns the answers as JSON.
- New skill `kitchen-sweep`: finds prose rules a tool could check and proposes a target for each.
- New skill `kitchen-audit`: moves accepted rules into the gate, proves them red and deletes the prose.
- New skill `doc-diet`: audits documentation for content the code already states, contradicts or makes pointless.
- New skill `plate-it`: explains one idea as a focused visual page, from call chains to 3D scenes.
- New skill `closing-time`: closes an agent session in one pass and ends with a summary and content ideas.
- New skill `personal-readme`: interviews someone into a Personal README, including preferences for AI agents.
- New skill `taste-test`: explains and reviews a code change as one page and gates the merge with a quiz.
- Every skill trimmed to what changes the agent's behaviour: about 29 % fewer words.
- `kitchen-setup`, `kitchen-log`, `kitchen-audit` and `taste-test` gain verification lessons: property and differential tests, a flaky-test rule, a diff-triggered checklist, observe mode for new rules and a pre-existing severity.
- `kitchen-setup` and `taste-test` gain code review lessons: a grader loop that converges, high-risk paths, measured reviewer noise, a pull request template, and root-cause checks for bug fixes.
- Files in a folder with a `NOTICE.md` keep their original language; the English check skips them.
- `lingo-lasagne` and `mise-en-place` write their pages from a template in `assets/template.html` (Basecoat style pack Nova, typefaces Geist and Geist Mono, Lucide icons).

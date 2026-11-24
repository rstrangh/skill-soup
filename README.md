# skill-soup

<p align="center">
  <img src=".github/header.jpg" alt="A steaming bowl of ramen with odd toppings: a pop-up page, a form with checkboxes, a slide, a lasso, a magnifying glass and a speech bubble. A noodle lifted by chopsticks ends in a trail of dots.">
</p>

Agent skills from Romans messy workplace. Cooked in a private kitchen for daily use, ladled
out here once they stopped tasting of one person.

## Why another skill collection?

Fair question. There are plenty of them, and many read alike: a few hundred prompts, each
one promising a ten times better agent. This bowl is small and a bit odd. Every skill
here came out of real work, ran for weeks in one person's setup, and was rewritten until
it stopped annoying that person.

What you get:

- **Pages you look at, not walls of chat.** Several skills end in one HTML page:
  a paper as a flap book, a talk as slides next to its transcript, a domain's vocabulary
  as a ladder.
- **Agents that check their own work.** Where a skill makes files, it ships a script
  that checks them. `paper-flaps` measures its own layout. `form-filet` renders a preview of
  the filled form, and the agent looks at it before it hands the form back.
- **Thinking before doing.** Some skills do no work at all. They find what you do not
  know yet, before you start: the words of a domain, the landmines in a codebase, the ways
  your plan will fail.
- **Instructions written for agents.** Every `SKILL.md` follows the rules of Simplified
  Technical English: one word per meaning, short sentences, no hedging. Agents follow
  plain instructions better than clever ones.

## What's in the bowl

**Before you start**

- `lingo-lasagne` teaches the words of an unfamiliar domain, so your next prompt sounds like
  a professional wrote it.
- `mise-en-place` finds the landmines in unfamiliar code before you change it.
- `dish-eval` writes down, before an agent builds a feature, how you will check the result
  and which evidence the agent hands in with the pull request.
- `doom-dumpling` lets fresh subagents assume your plan has already failed and write the
  autopsy.

- `plate-it` explains one idea by showing it: a call chain, a state machine, a shape diff,
  or a 3D scene you can turn.
- `taste-and-tweak` builds a small rig with knobs and a live view. You turn the dials until
  a mechanism clicks or a design value settles.
- `tasting-menu` finds a visual style in rounds on a node canvas: a style prompt, prompt
  variants, generated images. You rate each course, ask for variants, and freeze the style
  you like as a reusable technique.

**While you work**

- `brain-salad` takes five minutes of rambling dictation, separates what you decided from
  what you only thought out loud, and then gets to work.
- `whats-cookin` gets you back into a session you left two weeks ago.
- `boil-it-down` turns a long chat into one Markdown file you can still use next month.
- `taste-test` turns a diff or pull request into a review page: background, the core idea,
  findings with evidence, and a quiz you pass before you merge.
- `closing-time` closes a session: commits what is open, stores what was learned, lists
  what to improve and prints what got done, with content ideas below.
- `yay-or-nay` turns 15 or more quick decisions into a page of cards with big buttons and
  hotkeys, so you click through them instead of commenting item by item.

**Long things made readable**

- `paper-flaps` turns something complicated into a lift-the-flap page, from "explain it
  like I'm five" down to the original numbers.
- `tube-tapas` turns a recorded talk into its slides next to what was said, so you can
  read the talk instead of watching it.

**Before you present**

- `slide-souffle` audits a slide deck against the nine Talk Like TED principles, before it
  rises or collapses in front of an audience.

**Kitchen rules for agents**

- `kitchen-setup` sets up gates, rules and an independent grader in a repository before
  agents work in it, then tests the whole harness red.
- `kitchen-log` adds a `MISTAKES.md` to a repository and turns repeated agent failures
  into rules and gates.
- `kitchen-sweep` finds the rules in your docs that a linter or a test could check
  instead of an agent reading them.
- `kitchen-audit` moves those rules into the gate, proves each one fires red and deletes
  the prose it replaces.
- `doc-diet` finds the passages in your docs that the code already says, contradicts or
  makes pointless, and proposes what goes.

**Life admin**

- `personal-readme` interviews you until your "how to work with me" file is written,
  including how AI agents should work with you.
- `form-filet` fills in a scanned PDF form from your own data file. It never signs.

**Someone is wrong on the internet**

- `chef-lasso` drafts a friendly and firm reply to a hostile message, in the style of
  Ted Lasso.
- `chef-kent` drafts an aggressive and gutsy reply to a hostile message, in the style of
  Roy Kent from Ted Lasso. It always adds one reply you would still send tomorrow, and it
  starts only when you call it by name.

<details>
<summary>The full menu, with the official descriptions</summary>

<!-- skills:start -->

Generated by `just index`. Do not edit by hand.

| Skill | What it does |
|---|---|
| [`boil-it-down`](skills/boil-it-down/SKILL.md) | Distil the running chat conversation (ChatGPT, Claude.ai, Gemini and other chat systems) into one compact markdown knowledge artefact. |
| [`brain-salad`](skills/brain-salad/SKILL.md) | Read an unstructured monologue — usually a dictation from speech recognition, sometimes a typed brain dump — by fixed rules, then act on it directly. |
| [`chef-kent`](skills/chef-kent/SKILL.md) | Draft a blunt, gutsy reply to a hostile message in the style of Roy Kent from Ted Lasso: few words, honest to the bone, profanity as punctuation, contempt for the behaviour and never for the person. |
| [`chef-lasso`](skills/chef-lasso/SKILL.md) | Defuse a heated, abusive or personal written conversation in the style of Ted Lasso: radically friendly, curious instead of judgmental, without losing your spine. |
| [`closing-time`](skills/closing-time/SKILL.md) | Close an agent session in one pass. |
| [`dish-eval`](skills/dish-eval/SKILL.md) | Before an agent builds a feature, interview the human for the eval pack. |
| [`doc-diet`](skills/doc-diet/SKILL.md) | Audit the documentation of a repository for content, not wording. |
| [`doom-dumpling`](skills/doom-dumpling/SKILL.md) | Runs a pre-mortem on a plan: fresh subagents without conversation context assume the plan has already failed catastrophically and write the autopsy report. |
| [`form-filet`](skills/form-filet/SKILL.md) | Fill in paper forms — scanned PDFs without interactive fields, and PDFs with form fields — by detecting the fields, pulling personal and bank data from a data file, and writing a filled copy next to … |
| [`kitchen-audit`](skills/kitchen-audit/SKILL.md) | Move rules from a repository's prose into its gate, end to end. |
| [`kitchen-log`](skills/kitchen-log/SKILL.md) | Retrofit a MISTAKES.md into an existing project — the failure log where agent failures get collected with their cause and the rule that prevents them — anchor the matching rules in CLAUDE.md or … |
| [`kitchen-setup`](skills/kitchen-setup/SKILL.md) | Set up the harness for AI agents in an existing project: the gates and the independent grader an agent later works against. |
| [`kitchen-sweep`](skills/kitchen-sweep/SKILL.md) | Find the rules in a repository's prose that a deterministic tool could check instead of an agent reading them: conventions in AGENTS.md, CLAUDE.md, rule directories, contributing guides, ADRs and docs. |
| [`lingo-lasagne`](skills/lingo-lasagne/SKILL.md) | Before unfamiliar work, teach the user the vocabulary and the mental model of a domain they do not know, so the next prompt uses the words a professional would. |
| [`mise-en-place`](skills/mise-en-place/SKILL.md) | Before a concrete task in unfamiliar code, find the user's unknown unknowns in that part of the codebase: landmines, unwritten conventions, missing concepts and earlier attempts at the same task. |
| [`paper-flaps`](skills/paper-flaps/SKILL.md) | Turn a scientific paper or study into an interactive lift-the-flap microsite, like a children's flap book that explains complex things. |
| [`personal-readme`](skills/personal-readme/SKILL.md) | Interview someone, in a friendly and structured way, until their Personal README is written. |
| [`plate-it`](skills/plate-it/SKILL.md) | Explain one thing by showing it. |
| [`slide-souffle`](skills/slide-souffle/SKILL.md) | Audit presentation decks against Carmine Gallo's nine Talk Like TED public-speaking principles and general presentation quality. |
| [`taste-and-tweak`](skills/taste-and-tweak/SKILL.md) | Build a jig: a small, purpose-made rig with knobs and a live view that the user turns until a hard problem clicks or a design choice settles. |
| [`taste-test`](skills/taste-test/SKILL.md) | Produce a rich, interactive HTML review document for a code change (diff, branch, or PR). |
| [`tasting-menu`](skills/tasting-menu/SKILL.md) | Find a visual style and build an image language in rounds on a node canvas, like the Flora workflow. |
| [`tube-tapas`](skills/tube-tapas/SKILL.md) | Turn a recorded talk (YouTube or any site yt-dlp supports) into one portable folder. |
| [`whats-cookin`](skills/whats-cookin/SKILL.md) | Get back into an agent session that has been dormant for days or weeks. |
| [`yay-or-nay`](skills/yay-or-nay/SKILL.md) | Turn a large batch of judgements the user has to make — 15 or more similar items such as keep-or-drop lists, review findings, recommendations, catalogue entries or proposals — into one static HTML … |

<!-- skills:end -->

</details>

## Handle with care, it's hot

These skills are experimental. Coding agents wrote large parts of them, with one person
steering, reviewing and using them every day. They work in that person's setup: macOS,
Claude Code, Codex. Anywhere else, expect rough edges.

- **Read before you install.** A skill is a set of instructions for an agent that can run
  commands on your machine. Read the `SKILL.md` and its scripts like any other code from
  a stranger.
- **Check what comes out.** Agents are wrong with great confidence. The skills make the
  agent check its own work, and you still check the result. `form-filet` leaves the
  signature to you for exactly that reason.
- **Know what the agent sees.** `form-filet` reads personal and bank details from a file
  you name. `boil-it-down` and `whats-cookin` read your chat and session history. All of
  it lands in the agent's context, like everything else the agent reads.
- **Expect change.** The version is 0.x. Skills can change their behaviour, get renamed
  or leave the bowl. The changelog says what changed.

## How the soup gets made

1. A skill starts in a private repository and runs in daily use.
2. Once it is generic, a copy script moves it here. The script removes private context:
   German trigger phrases and sentences that point at skills that are not public. A
   denylist stops the copy when a private name shows up.
3. The quality gate below must pass.
4. A human reads the skill before it lands here. The gate checks what a tool can count.
   Whether a skill is any good stays a human decision.

Bug reports and ideas are welcome as issues.

## Install

**Claude Code**

```bash
claude plugin marketplace add rstrangh/skill-soup
```

```bash
claude plugin install skill-soup@skill-soup
```

Call a skill by name, for example `/skill-soup:paper-flaps`, or describe the task and let
the agent pick the skill. Update with `claude plugin marketplace update skill-soup`.

**Codex**

```bash
codex plugin marketplace add rstrangh/skill-soup
```

```bash
codex plugin add skill-soup@skill-soup
```

Update with `codex plugin marketplace upgrade skill-soup`.

**Requirements.** Skill scripts are TypeScript and run on Node.js 22.18 or later, which
executes `.ts` files directly. Only `form-filet` needs an npm package. Some skills call external
tools; the table under "Configuration" names them.

## Configuration

Every skill runs without configuration. A skill that remembers choices across runs reads
an optional Markdown file at `~/.config/<skill-name>/config.md`. The skill's `SKILL.md`
documents the file under the heading **Configuration**, with an example. Create the file
only when you want to skip the questions the skill would otherwise ask each run.

| Skill | Optional config file | External tools |
|---|---|---|
| `boil-it-down` | none | none |
| `brain-salad` | `~/.config/brain-salad/` — your own glossary of names and project terms | none |
| `chef-kent` | none | none |
| `chef-lasso` | none | none |
| `closing-time` | none | `git` |
| `dish-eval` | none | `gh` when the spec is an issue |
| `doc-diet` | none | none |
| `doom-dumpling` | none | none |
| `form-filet` | `~/.config/form-filet/` — path to your data file with personal and bank details | `mupdf` from npm, installed once: `npm install --prefix ~/.cache/form-filet mupdf@1.28.6` |
| `kitchen-audit` | none | `git`; `gh` to open the pull request |
| `kitchen-log` | none | `git` |
| `kitchen-setup` | none | `git`; `gh` for branch protection on GitHub |
| `kitchen-sweep` | none | optional: `ast-grep` to count violations |
| `lingo-lasagne` | `~/.config/lingo-lasagne/` — output directory | none |
| `mise-en-place` | none | `git` |
| `paper-flaps` | `~/.config/paper-flaps/` — picture engine, output folder, familiar worlds | `pdftotext` for PDFs, `python3` to serve the page for the layout check; optional: Codex CLI (pictures), `agent-browser` (layout check), Blender with an MCP server (3D) |
| `personal-readme` | `~/.config/personal-readme/` — folder for the finished README | none |
| `plate-it` | none | none |
| `slide-souffle` | none | none |
| `taste-and-tweak` | none | none |
| `taste-test` | none | `git`; `gh` to read a pull request |
| `tasting-menu` | none | Codex CLI with image generation (GPT Image), or another image tool the agent has |
| `tube-tapas` | `~/.config/tube-tapas/` — output folder | `yt-dlp`, `ffmpeg`, `ffprobe`; optional: MacWhisper CLI `mw`, otherwise another speech-to-text CLI such as Whisper |
| `whats-cookin` | `~/.config/whats-cookin/` — commands that close a session, prompt starts to ignore | `git` |
| `yay-or-nay` | none | none |

Skills never write to their config file. You edit it by hand.

## Kitchen rules

**Names.** A skill name is kebab-case and says what the skill makes or does:
`paper-flaps` turns a paper into a flap-book page. A name carries no owner prefix and does
not repeat the plugin name. All skills live in the one plugin `skill-soup`, so the full
address is always `/skill-soup:<name>`.

**Language.** Every file of every skill is English, trigger phrases included. Instructions
follow the rules of ASD-STE100 Simplified Technical English: one word per meaning, short
sentences, active voice, no hedging. The language of a skill's output follows the user:
the language the user writes in, else the language of the conversation or the user's
settings, else English.

**Scripts.** Scripts are TypeScript with erasable syntax only, so Node runs them without a
build step. Code that runs inside a browser page is JavaScript and starts with the line
`// Runs in the browser.` A script that can test itself takes `--self-test`.

**Boundaries.** When two skills could answer the same request, each description ends with
a `BOUNDARY` sentence that names the neighbour by its full address.

**HTML pages.** A skill that writes an HTML page ships a template in `assets/template.html`.
Without a design of its own, the template uses [Basecoat](https://github.com/hunvreus/basecoat), the
plain-CSS port of shadcn/ui, in the style pack Nova from jsDelivr with a pinned version, and the typefaces Geist and Geist Mono from
[Fontsource](https://fontsource.org), not from Google Fonts. Icons come from
[Lucide](https://github.com/lucide-icons/lucide), inline as an SVG sprite. Offline, the page stays readable
without styles.

**Layout.** `SKILL.md` stays under 500 lines. Detail goes into `references/`, executable
helpers into `scripts/`, templates and vendored files into `assets/`. Vendored third-party
files keep their license next to them, with a `NOTICE.md`. Files in a folder with a `NOTICE.md`
keep their original language.

## Versioning

| What | Where | Rule |
|---|---|---|
| Plugin release | `version` in `.codex-plugin/plugin.json`, entry in `CHANGELOG.md` | SemVer: patch for fixes and content changes, minor for new skills, major for renamed or removed skills |
| Skill change | `version` in the skill's frontmatter | The date of the last content change, `YYYY-MM-DD` |
| Claude Code | no version field | Claude Code uses the commit SHA, so every commit is an update |

Codex caches plugins by version. A release without a version bump does not reach Codex
users.

## Quality gate

```bash
npm install   # once, installs the TypeScript compiler for the type check
just check
```

The gate checks frontmatter, English in every skill file, the 500-line limit, linked
references, TypeScript-only scripts, private paths, references to skills outside this
repo, documented config files, a current skill table in this README, a CHANGELOG entry
for the current version, both plugin manifests (`claude plugin validate`), types
(`tsc --noEmit`) and every script's `--self-test`. It checks only what a tool can count.
Whether a skill is good is reviewed by a human before it lands here.

## License

MIT, see `LICENSE`. Some skills include third-party files under their own licenses; each
of those folders has a `NOTICE.md`.

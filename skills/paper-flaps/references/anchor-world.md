# The anchor world

An anchor world is a world the reader knows well: a game, a sport, a kitchen, a series, a
hobby. Level 0 tells the paper inside it, by Concreteness fading (Fyfe, McNeil, Son &
Goldstone, 2014). The analogy must map relations, not surfaces, by Structure-mapping
(Gentner, 1983): a battery for willpower works because "use drains, empty means worse"
maps; a battery that only looks tired teaches nothing. The model is Mayerowitz's "Mario
meets Pareto" (https://www.mayerowitz.io/blog/mario-meets-pareto).

## Step A — Guess five to eight candidates

Guess before asking: the guesses become the options of the question in `SKILL.md`, Step 5.
The reader is the user by default. If the page is for other people (a team, a blog
audience), guess worlds those readers share and say so in the question. Sources, in order:

1. `~/.config/paper-flaps/config.md`: `Worlds` and `Avoid`.
2. What the agent knows about the user: global `CLAUDE.md` or `AGENTS.md`, stored memories,
   the conversation. A world from here needs a hint in the user's own words; invent no hobby.
3. Broadly shared worlds: a well-known kart racing game, cooking, football, a supermarket
   queue, a family road trip.

Drop every world on the `Avoid` list.

## Step B — Score and keep three

Write one mapping table per candidate in `facts.md`:

| Paper element | Anchor element | Where the picture breaks |
|---|---|---|
| Ego depletion | The battery drains while driving | A real battery always drains measurably; the effect was barely measurable |

| Question | Fail condition |
|---|---|
| Does every core element of the mechanism have a counterpart? | One core element has none |
| Does the reader know the world without an explanation? | The world needs its own intro |
| Can the stage show concrete things: pieces, stats, players, moves? | The world is only a mood |
| Is there one specimen with personality, like "this poor Koopa"? | Nobody to root for or laugh at |

Keep the three with the most passes. A candidate that fails the first question is out. If
fewer than three pass it, fill up with plain everyday analogies.

## Step C — Tell level 0 as a stage sequence

Four to eight steps. Each step adds one idea and changes the stage once (`.scrolly` in
`assets/template.html`).

- **Problem before name.** The paper's term appears in the step after the reader saw the problem.
- **One specimen.** Follow one character or object with a small joke ("Schau dir diesen armen Koopa an").
- **One dimension at a time.** One axis, then two, then three.
- **Number shock.** For a large space of options, show its size once as an equation (`52 · 41 · 22 · 15 = 703.560`).
- **The reader decides.** If the result depends on weights, give a control and show the reader's own result ("Dein bester Fahrer: …").
- **Reality check.** Show where a known real case of the world sits ("The pros drive exactly this combination, and it sits on the front").
- **Transfer.** The last step leaves the world: "See the pattern?" Name two or three places in the reader's life and the paper's own setting where the mechanism works.

## Step D — Say where the picture breaks

Put a box "Where the picture breaks down" (`<div class="aside-block breaks">`) on level 1 of
the topic the analogy carries most. Name each simplification, like Mayerowitz's closing note
on averaged stats and non-linear in-game values.

## Facts of the anchor world

- Anchor-world numbers are not paper facts and never carry `class="num"`.
- Use only common-knowledge facts or clearly invented ones; mark an invented quantity ("angenommen, …").
- Label every anchor-world number that stands next to a paper number, so the reader knows which world it belongs to.

## Trademarks

The page may go public. Name the world in words; draw it with generic stand-ins (a go-kart
race with invented racers). Never ask the image generator for a trademarked character, a
logo or a screenshot of a real game.

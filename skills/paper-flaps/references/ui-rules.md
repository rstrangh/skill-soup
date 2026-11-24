# UI rules

The page must hold up next to a crafted children's book. The rules follow the look-independent
principles of Apple's Human Interface Guidelines plus faults found in reviews of earlier pages.
`scripts/check_layout.ts` checks every rule marked **[checked]**; the rest needs screenshots.
Build with the template components; write a new component only when none fits.

## Principles

- **Clarity.** One message per chapter, visible in its first screen: title, intro sentence, picture.
- **Red thread.** Intro above each picture, explanation below, a bridge to the next chapter at the end. **[checked]**
- **Deference.** Navigation is small and quiet; pictures and text carry the page.
- **Depth.** Hierarchy comes from the flap metaphor, paper under paper, never from stacked cards.

## Space

Spacing scale on `:root`: `--s1` 4 px, `--s2` 8 px, `--s3` 16 px, `--s4` 24 px, `--s5` 40 px,
`--s6` 64 px. Use only these values.

- At least `--s4` between a picture and the text above or below it. **[checked: 16 px floor]**
- A caption sits closer to its picture (`--s2`) than the next paragraph (`--s4`). Unrelated blocks get `--s5` or more.
- A label sits at least `--s3` from the object it names; inside an SVG at least 16 units.
- Body line length 45 to 75 characters (the template's 680 px column).
- No horizontal scroll at 375 px and 1280 px. **[checked]**

## Interaction

- A hotspot is a round marker with a number or a plus and a soft pulse. A flap shows its folded corner and a level label. A plain word or a pill is never the only cue.
- Hit targets at least 44 × 44 px, also on desktop; links in running text are exempt. **[checked]**
- Every click changes something visible within 100 ms.
- Every opened element closes the same way it opened.
- Every interactive element works with Tab plus Enter or Space. Chapters turn with the arrow keys.
- With `prefers-reduced-motion`, animations are off and every state stays reachable.

## Visual coherence

- Fonts, colors, button shapes, outlines, shadows and icons come from the theme file. No hand-written colors, no second font. **[checked: theme present]**
- One fidelity level per page: with generated illustrations, every figure that tells the story is a generated illustration in the same style, and a stage uses one generated picture per state. Never mix painted or clay pictures with flat SVG drawings of the same things.
- Charts only for real data from the source: on a plain paper surface without card borders, theme tokens and label font, no drawn objects.
- Every chapter has its own picture.
- Read the stage states in order: each changes exactly one thing, and the change matches its step text. A state that adds, removes or moves something the text does not mention is a finding.

## Type

- At most three type levels per chapter: chapter title, body, small label.
- Body text at least 17 px, labels at least 12 px. **[checked: 12 px floor]** SVG text counts at its rendered size, also in a nested flap on a phone. **[checked]**
- Body text contrast at least 4.5 : 1.

## Forbidden patterns

- **Card with a left border only.** **[checked]**
- **Nested cards:** a bordered or tinted box inside another. A flap inside a flap is the exception. **[checked]**
- **Card soup:** a grid of identical rounded boxes for content that is not a set of equal things.
- **Pill as the only affordance** for something clickable.
- **Floating quiz:** a question without a visual anchor. Attach it to a picture as a hotspot or to its flap.
- **Emoji as icons**, gradient text, glow shadows, decorative blobs.
- **A label glued to its object:** a caption, step text or SVG label touching the thing above it.

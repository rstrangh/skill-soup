# Art styles

The art style sets how every picture of one page looks. Each style has a theme file
`assets/themes/<file>.css` (palette, three fonts, shapes, icon set, signature details) that
`scripts/apply_theme.ts` puts into the page, so the interface matches the pictures.

## Picking three styles for the question

1. The anchor world first: a style the world already uses wins (pixel art for a retro game, clay for a kitchen).
2. The paper second: a mechanism with parts favors 3D styles, a story about people favors painted styles, a structure of rules favors flat graphic styles.
3. Every option must work with the engine the user has or picks (column "Engines").

If the user picks a style the chosen engine cannot make, take the closest style it can make
and say so in the hand-over.

| Style | Theme file | Engines | Fits |
|---|---|---|---|
| Storybook watercolor | `storybook-watercolor` | Codex | Stories about people and feelings, the default |
| Gouache poster | `gouache-poster` | Codex | Clear single ideas, strong shapes |
| Ink drawing | `ink-drawing` | Codex, code only | Serious topics, history, medicine |
| Vintage comic | `vintage-comic` | Codex | Conflicts, before and after, humor |
| Clay diorama | `clay-diorama` | Codex, Blender | Everyday mechanisms, kitchens, households |
| Low-poly toy | `low-poly-toy` | Codex, Blender, code only | Systems with parts, spaces, flows |
| Pixel art | `pixel-art` | Codex, code only | Games, rules, step-by-step processes |
| Bauhaus flat | `bauhaus-flat` | Codex, code only | Rules, structures, comparisons, numbers |
| Origami paper | `origami-paper` | Codex | Sorting, structures and rules that still need characters and warmth |

## Prompt structure

Keep the style block word for word for all pictures of one page.

```
<style block of the chosen style>

Subject: <who or what, with the distinguishing features of the running character>
Action: <what happens>
Setting: <where, few objects>
Mood: <one or two words>
Format: <3:2 landscape for the hero, 4:3 for topics>
No text, no letters, no numbers, no logos, no speech bubbles.
```

- Use concrete words: "late-afternoon sun from the left", not "beautiful lighting".
- Never ask for text or numbers in the picture; generators misspell and invent digits.
- Name the running character with its distinguishing features in every prompt ("a battery
  with a charge indicator on its belly"). The reference image alone loses them: in the first
  test run a later picture swapped the charge indicator for a lightning bolt.
- To fix a picture, change only the wrong part of the prompt.
- Save each prompt as `img/<name>.prompt.txt` next to its picture.

## Style blocks

**Storybook watercolor**

```
Warm hand-drawn children's-book illustration in the style of a classic lift-the-flap
explainer book. Soft watercolor washes that feather at the edges, colored-pencil lines,
cream paper grain showing through the lighter areas. Muted friendly palette: ochre, sage
green, terracotta, dusty blue, warm grey. Friendly anthropomorphic objects with simple
faces where it helps. One clear subject, generous empty space.
```

**Gouache poster**

```
Gouache illustration with opaque flat color fields, visible soft brush edges and a matte
surface. Large simple shapes, few details, strong silhouettes. Limited palette of five
colors: deep teal, warm orange, mustard, off-white, charcoal. Even daylight, no gradients
beyond the brush texture.
```

**Ink drawing**

```
Black ink illustration on white paper with fine pen lines, cross-hatching for shadows and
generous untouched paper. One single accent color, a muted red, used only for the one
thing in focus. High contrast, no other color, calm and precise.
```

**Vintage comic**

```
Vintage comic illustration with heavy black outlines, flat color fills and halftone dot
shading, slightly off-register print colors on yellowed newsprint. Palette: primary red,
sky blue, warm yellow, cream. Dynamic but readable poses, simple backgrounds.
```

**Clay diorama**

```
Handmade 3D clay diorama photographed on a small tabletop set. Rounded molded shapes with
visible fingerprints and soft tool marks, matte surfaces, soft studio light from the upper
left with gentle shadows, shallow depth of field. Pastel palette: butter yellow, mint,
coral, powder blue, cream.
```

**Low-poly toy**

```
Low-poly 3D scene like a wooden toy model. Visible flat facets, simple geometric forms,
matte materials, soft global light with clean shadows, isometric three-quarter view on a
plain warm background. Palette: warm wood, sage, coral, slate blue, off-white.
```

**Pixel art**

```
16-bit pixel art scene with a visible pixel grid, hard edges, stepped shading and a
limited palette of twelve colors. Clean readable sprites, simple tiled background,
no anti-aliasing, no blur.
```

**Bauhaus flat**

```
Flat graphic illustration in a Bauhaus spirit: circles, squares and triangles, primary
red, yellow and blue on off-white, black lines of one weight, asymmetric grid, large empty
areas. No texture, no gradients, no shadows.
```

**Origami paper** — running characters work best as origami animals in one paper color each
(a fox, an owl).

```
Handmade origami paper diorama photographed on a small tabletop set. Every figure, box,
door, wall and piece of furniture is folded from plain colored craft paper with crisp
sharp creases, visible fold lines, faceted planes and slightly lifted paper edges. No flat
cut-out shapes, no clay, no plastic, no drawn outlines. Soft daylight from the upper left,
gentle cast shadows, shallow depth of field, matte paper with fine fiber texture.
Palette of craft paper: warm kraft brown, cream, vermilion red, indigo blue, saffron
yellow, charcoal grey.
```

## Code-only versions

- Ink drawing: SVG strokes of one width, hatching as a `<pattern>` of thin lines, one accent color.
- Low-poly toy: a three.js scene with `flatShading: true` and the theme palette.
- Pixel art: SVG `<rect>` cells on a fixed grid, `shape-rendering="crispEdges"`.
- Bauhaus flat: SVG circles, squares and triangles in the palette, no filters.

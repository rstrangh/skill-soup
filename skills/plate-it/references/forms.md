# Forms

Pick the first row whose "The idea is …" fits. Cost means build effort.

## Code

| The idea is … | Form | Cost |
|---|---|---|
| how one call travels through the system | Call chain: boxes per function or service, left to right, arrows labelled with what is passed | low |
| what a change does to the code | Before and after: two columns of the same shape, the changed parts in the accent colour | low |
| where data comes from and where it goes | Data flow: sources on the left, sinks on the right, transformations in between | low |
| how a thing moves between states | State machine: circles for states, arrows labelled with the event that moves it | medium |
| who talks to whom, in which order | Sequence: one lane per participant, time downwards | medium |
| how a change reshapes a tree (calls, files, components) | Shape diff: the tree as monospace text in `<pre>`, `+` and `-` in the margin, only the touched branches | low |
| what a module or folder looks like from above | Map: nested boxes sized by importance, not by line count | medium |
| how layers stack and what may call what | Layer stack in 3D: one slab per layer, allowed calls as vertical arrows | high |

## Anything else

| The idea is … | Form | Cost |
|---|---|---|
| A versus B | Versus: two or three columns, one verdict line below | low |
| steps in a fixed order | Step strip: numbered boxes, one sentence each | low |
| a share or a probability | Icon array: 100 figures, the share coloured | low |
| something that happened over time | Timeline: one axis, events above, phases below | medium |
| a mechanism with parts that move | Isometric object: the mechanism as a physical thing, parts labelled | high |
| a structure that only makes sense in space | 3D scene: the structure as simple solids the user can turn | high |

## Recipes

**Call chain, data flow, sequence.** Boxes have the same height. Labels sit inside the box,
the file name in small type under it. At most seven boxes per row. More boxes: show the top
level and link a second page.

**Before and after.** Both sides use the same layout. Only the difference carries the
accent colour.

**State machine.** Start state on the left, end states on the right. Error transitions in a
muted colour, unless the error path is the idea.

**Isometric object.** 30 degrees, light from the top left, three tones per surface. Every
part carries a label with a leader line. Draw only the parts that carry the idea.

**3D scene.** Start from `assets/scene3d.html`. Boxes, cylinders and planes, flat shading,
the accent colour for the part that matters. Place the camera so the first view already
shows the point. Labels are HTML elements over the canvas.

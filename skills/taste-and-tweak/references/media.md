# Media — where the jig lives

Pick the first row that fits the project. Check each API against the project's version before
you write medium code; the table shows the shape, not a guaranteed signature.

| Medium | Knobs | Live update | Copy text |
|---|---|---|---|
| No visual stack, abstract subject | `assets/template.html` | `input` event calls `render()` | `<pre>` plus copy button in the page |
| Web component library with Storybook | Storybook `argTypes` with `control: { type: 'range', min, max, step }` | Storybook re-renders on every arg change | The story renders a `<pre>` from the args below the component |
| Web app without Storybook | A dev-only page with `<input type="range">` that imports the real component | `input` event | `<pre>` plus copy button |
| Godot 4 | `@tool` script with `@export_range(min, max, step)` variables | Property setter calls a rebuild function that returns early unless `is_inside_tree()`, then `queue_redraw()` | A `@export_tool_button` or a setter that writes the text with `DisplayServer.clipboard_set(text)` and prints it |
| Unity | `[Range(min, max)]` fields on an `[ExecuteAlways]` component | `OnValidate()` rebuilds on every inspector change | A `[ContextMenu("Copy jig text")]` method that sets `GUIUtility.systemCopyBuffer` |
| SwiftUI | `#Preview` with `@Previewable @State` values bound to `Slider` controls next to the real view | The preview canvas re-renders on every state change | A `Text(copyText).textSelection(.enabled)` below the view |
| Jupyter or another notebook | `ipywidgets.interact(f, jitter=(0.0, 1.0, 0.05))` | The widget calls `f` on every change | `f` prints the copy text under the plot |
| Blender | Custom properties with min and max on the object, read by drivers or a small script | Drivers re-evaluate on every property change | A text block or the console, written by the script |

## Rules per medium

- If the medium has an inspector or controls panel, the knobs live there. Write only the
  parameters and the copy text.
- Keep the jig out of the production build: a story, an editor tool script, a preview, a dev
  route, a scratch scene. Name the file as a jig, for example `Card.jig.stories.tsx` or
  `jig_backoff.gd`.
- If a medium needs a new library for the knobs, use the HTML template instead.
- Keep the jig in one file where possible, so the user deletes it with one file.

## Example: SwiftUI, Try out direction

```swift
#Preview("Card jig") {
	@Previewable @State var spacing = 12.0
	VStack {
		CardView(spacing: spacing)
		Slider(value: $spacing, in: 0...40, step: 2)
		Text("Set the padding of CardView to \(Int(spacing)) pt.")
			.textSelection(.enabled)
	}
}
```

# Vendored HTML patterns

Five example pages from "The unreasonable effectiveness of HTML" by Thariq Shihipar.

- Source: https://github.com/ThariqS/html-effectiveness, commit 1787245d94aa680edf18b52027e3f859032776ba (2026-07-03)
- License: Apache License 2.0, see `LICENSE` in this folder. Each file keeps its original copyright header.
- Changes: renamed. In `clickable-flowchart.html` the placeholder URL `https://acme.app` (a real third-party domain) became `https://example.com`. Everything else is unchanged.

| File | Original | Pattern it shows |
|---|---|---|
| `stepwise-explainer.html` | `14-research-feature-explainer.html` | TL;DR box, numbered steps in native `<details>`, tabs, callout, FAQ, on-this-page navigation |
| `live-model-glossary.html` | `15-research-concept-explainer.html` | Live SVG model with sliders and reset, readout of what changed, versus table, glossary that lights up on hover |
| `clickable-flowchart.html` | `13-flowchart-diagram.html` | SVG flowchart with process, decision and failure nodes, legend, click a node to fill a detail panel |
| `svg-figures.html` | `10-svg-illustrations.html` | Palette-locked inline SVG figures, stroke rules, per-figure download button |
| `motion-easing.html` | `07-prototype-animation.html` | CSS micro-interaction: spring easing, drawn checkmark, keyframe timeline |

The read check before vendoring found no external scripts and no instruction-like text.

# Vendored icons

Only the icons the page interface uses: previous, next, reveal, external link.

| Library | Version | License | Source |
|---|---|---|---|
| Phosphor Icons | 2.1.1 (`@phosphor-icons/core`, npm) | MIT, `phosphor/LICENSE` | `assets/<weight>/` of the package |
| Lucide | 1.70.0 (`lucide-static`, npm) | ISC, `lucide/LICENSE` | `icons/` of the package |

Phosphor names map to the interface roles as `caret-left` (prev), `caret-right` (next),
`arrow-down` (reveal), `arrow-up-right` (external). Lucide uses `chevron-left` and
`chevron-right` for prev and next. `scripts/apply_theme.ts` reads these files.

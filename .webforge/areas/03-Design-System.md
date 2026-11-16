# Area 03 — Design System

## Status
✅ Decided

## Decisions Made
- **Primary color**: `#33691e` (dark green) — brand color
- **Secondary**: Gray tones (`#b0b0b0`, `#3a3a3a`)
- **Tertiary**: Blue (`#89c2ff`)
- **Error**: Red (`#ffb4ab`)
- **Surface**: `#121212` with variants from `#000000` to `#323232`
- **Background**: `#000000` (dark mode by default)
- **Text**: White (`#ffffff`) on surfaces, primary green on variant surfaces
- **Outline**: Primary green (`#d1fd40`)
- **Typography**: Lexend (headlines), Inter (body/labels)
- **Local fonts**: `@font-face` declarations in globals.css (not Google Fonts CDN)
- **No secondary accent**: `--color-primary-container` = `--color-primary` = `#33691e`
- **M3 design tokens**: CSS variables via `@theme` block in globals.css (~40 colors)
- **Token naming**: `bg-surface`, `text-on-primary`, `border-outline`, etc.
- **Dark mode**: Default (no light mode toggle)

*Source: tech-stack.md lines 39-52, context/key-decisions.md lines 24-30, context/constraints-and-preferences.md lines 11-12*

## Next Steps
- None — design system is fully implemented in `globals.css`

## References
- `frontend/src/app/globals.css` — Design token definitions
- `tech-stack.md` lines 39-52 — Color system and fonts
- `context/key-decisions.md` lines 24-30 — Design decisions history

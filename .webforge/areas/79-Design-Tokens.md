# Area 79 — Design Tokens & Theming

## Status
✅ Decided

## Decisions Made
- **Token format**: CSS variables defined in `@theme` block in `globals.css`
- **Token naming convention**: Material 3-style (`--color-primary`, `--bg-surface`, `--text-on-surface`, `--border-outline`)
- **Color tokens**: Primary, surface, background, text on surface variants, secondary, tertiary, error, outline — ~40 colors
- **Typography tokens**: `--font-headline` (Lexend), `--font-body`/`--font-label` (Inter)
- **Theme**: Dark mode only (no light mode toggle)
- **Token usage**: `bg-surface`, `text-on-primary`, `border-outline-variant` in Tailwind utility classes
- **Spacing**: Tailwind default spacing scale (4px base unit)
- **Border radius**: Tailwind default radius scale
- **Shadows**: Not explicitly defined as tokens
- **Dark/light mode switch**: Not implemented (single dark theme)

*Source: tech-stack.md lines 39-52, key-findings.md lines 129-133*

## Next Steps
- Add shadow tokens to design system
- Consider adding light mode support for admin panel
- Document the complete token inventory in a style guide

## References
- `frontend/src/app/globals.css` — All design tokens
- `tech-stack.md` lines 39-52 — Color system and fonts

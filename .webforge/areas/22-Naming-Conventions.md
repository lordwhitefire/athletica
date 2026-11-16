# Area 22 — Naming Conventions

## Status
✅ Decided

## Decisions Made
- **Components**: PascalCase (`HeroCarousel.tsx`, `FilterSidebar.tsx`)
- **Routes/URLs**: kebab-case (`forgot-password`, `privacy-policy`, `[...slug]`)
- **Lib files**: camelCase (`filterProducts.ts`, `getHomepageJson.ts`)
- **Server actions**: camelCase in `src/lib/actions/` (`createProduct`, `uploadMedia`)
- **Types/Interfaces**: PascalCase (`Product`, `CartItem`, `NavItem`)
- **Constants**: UPPER_SNAKE_CASE
- **Sanity schema fields**: camelCase (`color_variants`, `key_benefits`, `technical_details`)
- **Supabase tables**: snake_case (`profiles`)
- **CSS classes**: Tailwind utility classes (no custom CSS class names)
- **CSS variables**: Material 3 naming (`--color-primary`, `--bg-surface`, `--text-on-surface`)
- **Test files**: Co-located, same name as source + `.test.ts(x)` (`LoginForm.test.tsx`)

*Source: key-findings.md lines 129-141, architecture.md lines 8-149*

## Next Steps
- None — conventions are consistent across the codebase

## References
- `key-findings.md` lines 129-141 — Naming conventions summary
- `architecture.md` — Full codebase structure

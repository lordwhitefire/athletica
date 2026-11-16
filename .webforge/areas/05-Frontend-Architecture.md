# Area 05 — Frontend Architecture

## Status
✅ Decided

## Decisions Made
- **Folder structure**: Feature-based under `src/` — `app/`, `components/`, `lib/`, `context/`, `store/`, `types/`, `test-utils/`
- **Component naming**: PascalCase (`HeroCarousel.tsx`)
- **File naming**: PascalCase for components, camelCase for utilities
- **Server/Client strategy**: Server components by default; `"use client"` only when interactivity needed
- **Data fetching**: Server Components using React `cache()` for deduplication
- **Code splitting**: Next.js App Router auto-splits by route; bundle analyzer configured (env-gated)
- **Data flow**: Server → read JSON files → pass props to Client Components
- **Mutations**: Server Actions (`"use server"` in `src/lib/actions/`)
- **Provider nesting**: Auth → Cart → Toast → Wishlist (root layout)
- **ISR**: 60s revalidate on public pages; `force-dynamic` on admin

*Source: architecture.md lines 8-149, data-flow.md lines 132-148, key-findings.md lines 104-148*

## Next Steps
- Refactor files exceeding 300-line limit (Law 2): `homepage.ts` (413 lines), `getHomepageJson.ts` (304 lines)

## References
- `architecture.md` — Full architecture documentation
- `data-flow.md` — Data flow patterns
- `key-findings.md` lines 174-186 — File size audit

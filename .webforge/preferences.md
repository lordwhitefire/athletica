# Developer Preferences

> Accumulated preferences stated by the CEO/developer. Not area-specific.
> Sources: AGENTS.md (root + frontend), STANDARDS.md, context/constraints-and-preferences.md, context/key-decisions.md

---

## Brand & Design Preferences

- **Dark green brand color** (`--color-primary: #33691e`). Replaced red (`#b5000b`). Client confirmed dark green has same visual weight as red.
- **No secondary accent green** — `--color-primary-container` = `--color-primary` = `#33691e`. Lemon green `#d1fd40` removed entirely.
- **Dark mode by default** — `background: #000000` with surface colors `#121212`
- **Fonts**: Lexend (headlines), Inter (body/labels). Loaded via local `@font-face` (not Google Fonts CDN).
- **Icons**: Material Symbols Outlined (variable WOFF2) + lucide-react
- **English language** only — all UI text is English. Legacy Spanish code has been replaced.

*Source: context/constraints-and-preferences.md lines 11-12, context/key-decisions.md lines 35-36, tech-stack.md lines 39-52*

## Technical Preferences

- **TypeScript strict mode** — always on
- **Zod validation** on all server actions via `validateOrFail()` helper
- **Server components by default** — mark with `"use client"` only when interactivity needed
- **React `cache()`** for data fetching (deduplication within request)
- **ISR with 60s revalidate** on public pages; `force-dynamic` on admin pages
- **`ApiResult<T>` pattern** for all server actions — `ok()` / `fail()` / `fromCaughtError()`
- **Consistent error shape**: `{ type, code, message, fields? }`

*Source: key-findings.md lines 104-127, key-decisions.md lines 35-39*

## File & Code Style

- **Components**: PascalCase (`HeroCarousel.tsx`)
- **Routes**: kebab-case (`forgot-password`, `privacy-policy`)
- **Lib files**: camelCase (`filterProducts.ts`, `getHomepageJson.ts`)
- **Types**: PascalCase interfaces (`Product`, `CartItem`, `NavItem`)
- **Constants**: UPPER_SNAKE_CASE
- **Sanity schema**: camelCase (`color_variants`, `key_benefits`)
- **CSS**: Tailwind utility classes exclusively — no CSS modules, no styled-components
- **Material 3 design tokens** via `@theme` in globals.css
- **All arrays need `_key`** — Sanity requires `_key` on all array items

*Source: key-findings.md lines 129-141, context/key-decisions.md lines 35-36*

## Git & Workflow Preferences

- **NEVER delete anything** without explicit user consent
- **NEVER run commands autonomously** — always output the command and wait
- **NEVER commit secrets** — `.env` / `.env.local` never committed
- **NEVER modify database schema directly** — all changes through migration files
- **Read files before editing** — always read before touching
- **Research dependencies before changing** — never change without checking imports

*Source: AGENTS.md (root) lines 3-72*

## Testing Preferences

- **Co-location**: Test files next to source file (`Input.test.tsx` next to `Input.tsx`)
- **Naming**: `it('should [do X] when [condition Y]')`
- **MSW handlers**: One file per feature domain in `src/lib/mocks/handlers/`
- **Custom render**: `src/test-utils/renderWithProviders.tsx`
- **Accessibility**: Every component test must include `jest-axe` check
- **Coverage floor**: 80% lines, 70% branches, 80% functions, 80% statements
- **Never run tests autonomously** — output command, wait for results
- **Regression protection**: If modifying a function with existing tests, never break tested behaviour

*Source: AGENTS.md (frontend) lines 87-95, STANDARDS.md Section 5*

## Admin Auth Preferences

- **Admin auth: Supabase Auth only** — Custom Sanity-based admin auth removed
- **Admin role**: `profiles.role === "admin"` check
- **Admin login**: Uses browser Supabase client directly — no custom API route
- **No more bcryptjs or jose** — password hashing and JWT delegated to Supabase

*Source: context/constraints-and-preferences.md lines 23-26, context/key-decisions.md lines 39-40*

## Other Preferences

- **Standalone Sanity Studio** — NOT embedded in Next.js
- **Fonts served locally** — NOT via `next/font/google` (build environment restriction)
- **Images uploaded to Sanity** — during migration, not stored as remote URLs
- **Pollinations.ai** for AI-generated placeholder product images
- **`frontend/` directory gitignored** — not version-controlled at root
- **Session-level error boundaries** — separate error.tsx for product/category, cart, checkout, admin

*Source: context/key-decisions.md lines 1-15, context/key-decisions.md lines 39-42*

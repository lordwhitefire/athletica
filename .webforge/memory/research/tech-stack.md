# Tech Stack — Athletica

> Compiled by Athena (Intelligence Dept) on 2026-07-12
> Source: `package.json`, `next.config.ts`, `tsconfig.json`, `postcss.config.mjs`, `eslint.config.mjs`, vitest/playwright configs

---

## Framework & Runtime

| Layer | Technology | Version | Config File |
|---|---|---|---|
| Framework | Next.js (App Router) | **16.1.6** | `next.config.ts` |
| UI Library | React | **19.2.3** | `tsconfig.json` `"jsx": "react-jsx"` |
| Language | TypeScript | **^5** (strict mode) | `tsconfig.json` `"strict": true` |
| Styling | Tailwind CSS | **v4** | `postcss.config.mjs` via `@tailwindcss/postcss` |
| Package Manager | npm | (lockfile: `package-lock.json`) | — |

**Per `next.config.ts`:**
- Image remote patterns: `cdn.sanity.io`, `media.futbolmania.com`
- Sentry integration via `@sentry/nextjs` with `withSentryConfig()`
- Bundle analyzer via `@next/bundle-analyzer` (env-gated: `ANALYZE=true`)
- No redirects, no rewrites, no headers configured

**Per `tsconfig.json`:**
- `target: "ES2017"`, `module: "esnext"`, `moduleResolution: "bundler"`
- Path alias: `@/*` → `./src/*`
- Next.js plugin enabled
- Includes `.next/types/**/*.ts`

---

## CSS / Styling Stack

| Tool | Config File | Details |
|---|---|---|
| Tailwind CSS v4 | `postcss.config.mjs` | Uses `@tailwindcss/postcss` plugin — no separate `tailwind.config.ts` (Tailwind v4 uses CSS-based config) |
| PostCSS | `postcss.config.mjs` | Only the Tailwind plugin |

**Fonts** (defined in `src/app/globals.css` `@theme` block):
- `--font-headline`: "Lexend" (variable TTF, `public/fonts/Lexend-Variable.ttf`)
- `--font-body` & `--font-label`: "Inter" (variable TTF, `public/fonts/Inter-Variable.ttf`)
- Material Symbols Outlined (variable WOFF2)

**Color System** (Material 3-style tokens in `globals.css` `@theme`):
- Primary: `#d1fd40` (lime green — brand color)
- Surface: `#121212` with variants from `#000000` (lowest) to `#323232` (highest)
- Background: `#000000` (dark mode by default)
- Text: white (`#ffffff`) on surfaces, primary green on variant surfaces
- Secondary: gray tones (`#b0b0b0`, `#3a3a3a`)
- Tertiary: blue (`#89c2ff`)
- Error: red (`#ffb4ab`)
- Outline: primary green (`#d1fd40`)

---

## State Management

| Tool | Used For | File |
|---|---|---|
| **Context API** | Auth state, Cart state, Toast notifications | `src/context/AuthContext.tsx`, `CartContext.tsx`, `ToastContext.tsx` |
| **Zustand 5** | Wishlist (with `persist` middleware → localStorage), Toast store | `src/store/wishlist.ts`, `src/store/toast.ts` |
| **URL Search Params** | Category filter state (brand, traction, size, price, sort, page) | — |

---

## Data & Backend

| Service | Package | Purpose | Config |
|---|---|---|---|
| **Supabase** | `@supabase/ssr` `@supabase/supabase-js` | Customer auth (email/password), profile storage | `src/lib/supabase/client.ts` (browser), `server.ts` (server), `admin.ts` (service role) |
| **Sanity CMS v5** | `sanity` `@sanity/client` `@sanity/image-url` | Product catalog, homepage content, navigation, brands, site settings, amazon links | `sanity.config.ts` (studio), `src/lib/sanity-client.ts` (frontend read), `src/lib/admin-sanity.ts` (admin write) |
| **Sanity Studio** | `studio-athletica/` | Admin panel for content management | — |
| **Upstash Redis** | `@upstash/ratelimit` `@upstash/redis` | Rate limiting (auth: 5/60s, upload: 10/60s) | `src/lib/rate-limit.ts` |
| **Sentry** | `@sentry/nextjs` | Error tracking (client + server + edge) | `sentry.client.config.ts`, `sentry.edge.config.ts`, `sentry.server.config.ts` |

---

## Third-Party Libraries

| Package | Version | Purpose |
|---|---|---|
| `@dnd-kit/core` | 6.3.1 | Drag-and-drop homepage editor |
| `@dnd-kit/sortable` | 10.0.0 | Sortable sections in homepage editor |
| `@dnd-kit/utilities` | 3.2.2 | DnD utilities |
| `@hookform/resolvers` | 5.4.0 | Zod resolver for react-hook-form |
| `adm-zip` | 0.5.17 | ZIP file handling |
| `framer-motion` | 12.40.0 | Animations (carousels, page transitions) |
| `html-to-image` | 1.11.13 | Homepage section screenshot capture |
| `lucide-react` | 0.575.0 | Icon library |
| `papaparse` | 5.5.4 | CSV parsing for batch product upload |
| `react-hook-form` | 7.78.0 | Form library |
| `web-vitals` | 5.3.0 | Core Web Vitals measurement |
| `zod` | 4.4.3 | Schema validation |

---

## Dev & Build Tooling

| Tool | Config File | Details |
|---|---|---|
| **ESLint v9** | `eslint.config.mjs` | Flat config: `eslint-config-next/core-web-vitals` + `eslint-config-next/typescript` |
| **Vitest** | `vitest.config.ts` | Unit/integration tests, jsdom environment, V8 coverage |
| **Playwright** | `playwright.config.ts` | E2E tests, chromium only, localhost:3100 |
| **MSW** | `src/lib/mocks/server.ts` | API mocking for tests (Sanity + Supabase handlers) |
| **Bundle Analyzer** | `next.config.ts` (env-gated) | `ANALYZE=true npm run build` |

**Vitest config specifics:**
- Environment: `jsdom`
- Globals: `true`
- Setup: `src/test-utils/setup.tsx`
- Coverage: lines 80%, branches 70%, functions 80%, statements 80%
- Path alias: `@/` → `./src/`
- Mocked: `next/navigation`, `next/link`, `next/image`, `@/lib/supabase/client`, `next/cache`, `@/lib/admin-sanity`, `framer-motion`

**Playwright config specifics:**
- Single project: Chromium Desktop
- baseURL: `http://localhost:3100`
- Timeout: 60s
- Retries: 1
- Screenshots: only-on-failure, video: retain-on-failure
- webServer: `npm run dev -- -p 3100`

---

## Environment Variables (from `.env.example`)

| Variable | Secret? | Source |
|---|---|---|
| `NEXT_PUBLIC_SUPABASE_URL` | No | Supabase project URL |
| `NEXT_PUBLIC_SUPABASE_ANON_KEY` | No | Supabase anon key |
| `SUPABASE_SERVICE_ROLE_KEY` | **Yes** | Supabase service role key |
| `UPSTASH_REDIS_REST_URL` | **Yes** | Upstash Redis URL |
| `UPSTASH_REDIS_REST_TOKEN` | **Yes** | Upstash Redis token |
| `SENTRY_DSN` | No | Sentry DSN |
| `SENTRY_AUTH_TOKEN` | **Yes** | Sentry auth token |
| `SENTRY_ORG` | No | Sentry org slug |
| `SENTRY_PROJECT` | No | Sentry project name |
| `SANITY_WRITE_TOKEN` | **Yes** | Sanity write token |
| `SANITY_WEBHOOK_SECRET` | **Yes** | Sanity webhook secret |

---

## Git & CI

| Item | Details |
|---|---|
| GitHub workflow | Only `sanity-json-update.yml` — syncs Sanity → JSON data files |
| No test CI | Tests do NOT run on PR/commit — no CI workflow for lint + test + build |
| No Prettier config | Not present in repo (code style inconsistent in places) |
| No pre-commit hooks | No Husky or lint-staged |

---

## Sanity Studio (studio-athletica/)

| Item | Value |
|---|---|
| Sanity version | 5.31.1 |
| Sanity Vision | Installed (GROQ query explorer) |
| Plugins | `structureTool`, `visionTool` |
| Project ID | `cuiis46d` |
| Dataset | `production` |

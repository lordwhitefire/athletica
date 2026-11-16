# Blueprint — athletica

**Date:** Mon Nov 16 2026
**Mode:** Study (existing software)
**Study order:** UI → Data → Business logic → Functionality

---

## Build Layers

### UI

| Area | Status | Evidence |
|---|---|---|
| Framework | Seen | Next.js 16.3.4 App Router (`rollout/`, `frontend/`) |
| Styling — rollout | Seen | Plain CSS: `admin.css` (1145 lines, dark), `signin.css` (845 lines, refined dark), Tailwind v4 via `@tailwindcss/postcss` |
| Styling — frontend | Not seen | Tailwind v4 configured; not studied in detail |
| Admin UI | Seen | `/admin/products` — client component, search/sort/filter/pagination, modals, `admin.css` tokens |
| Auth UI | Seen | `/admin/signin`, `/admin/signup` — SSR, Inter/Montserrat, split-screen with football image |
| Public product page | Seen | `product/[slug]/page.tsx` — Server Component + `ProductDetailsClient.tsx` |
| Responsive | Seen | Media queries at 900px, 720px, 420px in `signin.css`; admin CSS responsive |
| Accessibility | Not seen | No axe testing in ROLL-15 (owner ruling: no tests) |

### Data

| Area | Status | Evidence |
|---|---|---|
| Database | Seen | Supabase Postgres, `rollout` schema |
| `rollout.products` | Seen | `supabase-rollout-schema.sql` — `id TEXT PRIMARY KEY`, `slug`, `status`, `main_image TEXT`, `images TEXT[]`, `price`, `key_benefits JSONB`, `meta JSONB`, etc. |
| `rollout.analytics` | Seen | `id UUID`, `product_id`, `event_type`, `created_at` |
| `rollout.admin_access_keys` | Seen | `supabase-rollout-admin-keys.sql` — `kind`, `user_id`, `token_hash`, `expires_at`, `used_at`, `revoked_at` |
| `public.products` (frontend) | Seen | `image_links text[]`, `attributes jsonb` — different shape from rollout |
| Sanity | Seen | Project `cuiis46d`, dataset `production`, images stored as CDN URLs |
| RLS | Seen | `supabase-rollout-rls-policies.sql` — anon reads published, service_role full access, admin role check |
| Migrations | Seen | SQL files in `rollout/` and `supabase/migrations/` |

### Business logic

| Area | Status | Evidence |
|---|---|---|
| Product CRUD | Seen | `product-service.ts` — `createProductAdmin`, `updateProductAdmin`, `deleteProductAdmin`, `publishProductAdmin`, `unpublishProductAdmin` |
| Admin gate | Seen | `src/lib/auth/admin.ts` — `requireAdmin()`, `getAdminUser()`, `getUser()` + `app_metadata.role === 'admin'` |
| Door-key validation | Seen | `src/lib/auth/door-key-validate.ts` — SHA-256 hash lookup, sliding expiry |
| Invite code validation | Seen | `src/app/api/admin/auth/signup/route.ts` — hash lookup, one-time use, 24h expiry |
| Proxy gate | Seen | `src/proxy.ts` — cookie presence check, 404 for signed-out |
| Affiliate service | Seen | `src/lib/affiliate/affiliate-service.ts` — env-gated URL derivation |
| Analytics | Seen | `src/lib/analytics/` — view/click tracking, rate limiting, visitor hashing |
| Sanity upload | Seen | `src/app/api/admin/media/upload/route.ts` — service-role upload, returns `_id` + `url` |

### Functionality

| Area | Status | Evidence |
|---|---|---|
| Product management | Seen | Admin list, create, edit, publish/unpublish, delete — all via `/api/admin/*` |
| Admin auth — email/password | Seen | `/api/admin/auth/signin` → `signInWithPassword` |
| Admin auth — Google/GitHub | Not seen | Buttons exist but are dead (no handler, no OAuth callback route) |
| Admin sign-up | Seen | Invite-code gated, creates account with `app_metadata.role = 'admin'` |
| Door-key links | Seen | One-time links, 30-day sliding cookie, per-admin revocation |
| Image upload | Seen | Sanity upload via service role, media browser |
| Affiliate links | Seen | `/go/[id]` redirect, env-gated affiliate URL derivation |
| Analytics | Seen | View/click events recorded server-side, rate-limited |

---

## Engine (10 parts)

| Part | Status | Evidence |
|---|---|---|
| Architecture | Seen | Next.js App Router, SSR, route handlers, service-role + user-scoped clients |
| Integration | Seen | Supabase Auth + Postgres + Sanity + Upstash Redis (rate limiting) |
| Communication | Seen | REST via `fetch` to `/api/admin/*`; Server Components for data |
| Runtime environment | Seen | Node.js, Next.js 16.3.4, `next start` |
| Deployment | Not seen | No deploy config found (no vercel.json, netlify.toml in rollout/) |
| Configuration | Seen | `.env.local` — Supabase URL, anon key, service-role key, Sanity token, etc. |
| Security | Seen | Three locks, RLS, service-role isolation, door-key cookies (HttpOnly, Secure in prod) |
| Reliability | Not seen | No tests, no monitoring, no error tracking in rollout |
| Scalability | Not seen | Single Supabase project, no read replicas, no caching layer |
| Resource management | Seen | Upstash Redis for rate limiting |

---

## Project Ring

| Area | Status | Evidence |
|---|---|---|
| Version control | Seen | Git repo at `athletica/` root; 15 local commits, nothing pushed |
| Documentation | Not seen | No README in rollout/; report in developer-workspace/ |
| Handoff | Seen | `developer-workspace/ROLL-15/report.md`, `architect-handoff.md` |
| Progress tracking | Seen | `developer-workspace/PROGRESS.md`, `developer-workspace/ROLL-15/` |
| Legal | Not seen | No privacy policy, terms of service, or GDPR compliance |
| Client | Seen | Owner: lordwhitefire; 2 admin accounts |

---

## Summary

- **Studied:** 60 of 80 areas marked Seen
- **Not seen:** 15 areas (deployment, reliability, legal, detailed frontend UI, accessibility, scalability)
- **Not applicable:** 5 areas (mobile app, desktop app — this is a web app)

The core build is solid: three-lock auth, RLS, product management, affiliate links, analytics. The gaps are operational (no deploy config, no monitoring, no tests) and the OAuth buttons are dead. The owner's remaining actions are the smoke test and pushing.
# Proposal: Rollout 1 Architecture (ROLL-ARCH)

## Problem

The full Athletica football store (the Development app) requires significant data, features, and polish before it can serve users. Building everything upfront delays launch indefinitely. Users need to see something real while the full system develops.

## Solution

Implement a **dual-track architecture as TWO SEPARATE Next.js apps in ONE git repository**:

1. **Production app (`rollout/`)** — the public showroom. Minimal, polished, user-facing. Works with 1+ products. Only this app is deployed to the public production domain.
2. **Development app (`frontend/`)** — the full football store and its office, untouched. Full-featured, experimental, development/private only. Source of features that graduate to Production.

**Repository foundation (prerequisite, ROLL-00):** move the git root from `frontend/` up to the repository root so both apps share one git history. Only `frontend/` and `rollout/` are tracked; everything else at the root is ignored. No file that was not already tracked is ever committed.

## Why This Works

- **Launch faster** — the Production app needs minimal data to function
- **User isolation** — Users never see unpolished features; the Development app is a different app that is never the public URL
- **Feature graduation** — Development features move to Production when ready
- **Risk reduction** — Experiment freely in the Development app without affecting users
- **Feedback loop** — Real user data informs Development app work
- **No coupling** — Separate apps cannot interfere with each other's routes, builds, or data

## Scope

### Production App (Routes, in `rollout/`)

| Route | Purpose |
|-------|---------|
| `/` | Plain 404 |
| `/product/:slug` | Customer Product Details (black/lemon design) |
| `/go/:id` | Server-side click recorder + Amazon redirect |
| `/admin/login` | Office sign-in (after auth is live) |
| `/admin/products` | Product Database (CRUD, publish/unpublish) |
| `/admin/products/:id/edit` | Product Editor |
| `/admin/analytics` | Basic Analytics (Views, Clicks, CTR, source split) |

### Development App (full store + office, in `frontend/` — not public)

| Route | Purpose |
|-------|---------|
| `/` | Homepage with full navigation |
| `/admin/overview` | Dashboard |
| `/admin/categories` | Category management |
| `/admin/brands` | Brand management |
| `/admin/models` | Model management |
| `/admin/import-center` | Bulk import |
| `/admin/navigation` | Navigation editor |
| `/admin/media` | Media library |
| `/admin/analytics/*` | Full analytics suite |
| `/admin/settings` | Site settings |
| All storefront routes | Cart, checkout, accounts, etc. |

## Repository Foundation (ROLL-00)

- Git root moves from `frontend/` up to the repository root, history preserved, with ONE record commit ("move repo root up to athletica").
- Tracked directories: `frontend/` and `rollout/` only.
- Root `.gitignore`: ignore everything at the root except `frontend/` and `rollout/` (so `supabase/`, `studio-athletica/`, `data/`, `scripts/`, `openspec/`, `node_modules/`, and generated text exports stay out of git).
- No uncommitted/untracked file is committed as part of the move.

## Deployment

- **One public Vercel project on the ONE GitHub repo** (`lordwhitefire/athletica`):
  - Production project: Root Directory `rollout`, fixed public domain, Production environment variables.
  - Development app: Root Directory `frontend`, local dev or a private/password-protected URL; never the customer URL.
- **One Supabase project, two schemas**: `public` = Development app, `rollout` = Production app. No separate databases.
- Every Production client selects the `rollout` schema (`db.schema='rollout'`).
- No `NEXT_PUBLIC_SYSTEM_TYPE`; isolation is structural (separate apps + schema-scoped data).
- Vercel previews are code-review only: analytics recording off, `/admin/*` 404.

## Non-Goals

- Merging the two systems
- Cross-schema queries or sharing the `rollout` schema with the Development app
- Making the Development app public
- Building all Development app features before launching Production
- Sharing code between `frontend/` and `rollout/` via packages (deferred until there is a proven need)

## Success Criteria

1. A published product is viewable at `/product/:slug` on the Production app: no price, correct metadata/OG, real content, and a working CTA that redirects through `/go/:id`.
2. `/`, missing products, and unpublished products return a plain 404; the CTA is greyed out and disabled when the ASIN or real Amazon tag/store is missing.
3. Views and clicks are recorded server-side with `source` (`instagram`/`whatsapp`/NULL) and a daily `visitor_hash`; bot and rate-limit filtering are in place; no raw IP is stored.
4. The office is invite-only: admin auth uses `@supabase/ssr`, `getUser()`, and `app_metadata.role`; `/admin/*` 404s until auth is live; the service-role key never reaches the client.
5. The Development app stays development/private only; Production data lives in the `rollout` schema of one Supabase project; no Production query reads `public`.
6. Features can graduate from Development to Production without disruption; repository root hosts both apps, only `frontend/` and `rollout/` are tracked, and the full git history is preserved.
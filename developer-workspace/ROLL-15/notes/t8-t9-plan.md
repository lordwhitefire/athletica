# Note — T8 (proxy fast path) and T9 (RLS made real)

**Date:** Mon Nov 02 2026
**Context:** ROLL-15 tasks 8 and 9 — documented before doing, per owner request.
**Purpose:** record exactly what will be built so it isn't re-litigated mid-implementation.

---

## T8 — Fast-path check (proxy.ts)

### What it is

`rollout/proxy.ts` — a Next.js middleware at the app root that sits *before* any page or API route renders.

### What it does

| Request | Proxy action |
|---|---|
| `/admin/*` or `/api/admin/*` with no session cookie | Return **404** immediately — never call Supabase |
| `/admin/login`, `/admin/signup`, `/admin/key/*` | Exempt — let them through (they must be reachable) |
| Static assets (`/_next/*`, CSS, JS) | Exempt via `matcher` — don't break the site |
| Anything else | Pass through untouched |

### Why this is "fast"

Today, every page load asks Supabase *"are you an admin?"* — a network round trip. The proxy answers *"no cookie, no entry"* in microseconds, before Supabase is ever touched.

### What it is NOT

The proxy is **not** the authorization boundary. It only checks cookie presence, never the admin role. The role check stays in `requireAdmin()` on the API handlers and layout gate.

---

## T9 — Turn on the safe (RLS made real)

### The problem

The admin API handlers use `createAdminClient()` — the **service-role master key**. The service role **bypasses every RLS policy**. So even if we write perfect database rules, the master key ignores them. The safe door is open.

### What changes

| Before | After |
|---|---|
| Admin handlers use service-role key (bypasses RLS) | Admin handlers use the **signed-in user's own key** |
| RLS policies exist on paper but are bypassed | RLS policies are **enabled and enforced** |
| `anon` can read published products | `anon` can still read published products |
| No rule for signed-in admins | `authenticated` users with `app_metadata.role = 'admin'` may read/change admin data |
| `admin_access_keys` has no RLS protection | `admin_access_keys` is **service-role only** — no policy for `anon` or `authenticated` |

### Files touched

- `src/lib/supabase/server.ts` — add `createUserClient()` (cookie-aware, user's own key) alongside `createAdminClient()` and `createPublicClient()`
- `src/app/api/admin/products/route.ts` — use user client instead of admin client
- `src/app/api/admin/products/[id]/route.ts` — same
- `src/app/api/admin/media/upload/route.ts` — same
- `src/app/api/admin/media/assets/route.ts` — same
- `rollout/supabase-rollout-rls-policies.sql` — add admin policies, enable RLS on `admin_access_keys`

### Risk

If RLS is **not actually switched on** in the live database, the policies do nothing. I'll verify it's live by querying with the anon key and confirming it's blocked.

---

## Order of operations

T8 first (proxy, no schema impact), then T9 (RLS, touches every handler). Commit each separately. Nothing pushed.

---

## Open question for owner

The `products` create path: `buildPayload()` never sets `id`, and `rollout.products.id` is `TEXT PRIMARY KEY` with no default. T9 will move admin writes off the service role onto user keys — if `POST` create fails on a missing `id`, that's a pre-existing bug unrelated to RLS but discovered during this work. Confirm whether to fix it now or flag it for later.

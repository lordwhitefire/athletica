# ROLL-15 — Report: admin access (three locks + database rules)

**Date:** Wed Nov 04 2026
**Task:** `openspec/tasks/ROLL-15/task.md` — superseded on three points by
`/home/lordwhitefire/Downloads/admin-access-design.md`, which is the design authority.
**App:** `rollout/` · **Repo root:** `/home/lordwhitefire/current-project/athletica/athletica`
**Status:** build complete; end-to-end admin sign-in untested (needs a real credential — see
"What was not verified").

---

## Spec vs design document

The design document conflicts with the openspec task on three points. **The design wins** (owner
ruling, 2026-11-02):

| Task spec said | Design says — built |
|---|---|
| No sign-up surface | Sign-up page exists, reachable only with a one-time invite code → 404 otherwise |
| `/admin/login` always reachable | Sign-in page 404s without the door-key cookie |
| No schema change | `rollout.admin_access_keys` table created |

---

## Commits (all local — nothing pushed)

| Commit | What |
|---|---|
| `65a3bbf` | T0 — untrack `rollout/.env.local` (keys rotated by owner 2026-11-01) |
| `0386c87` | T0.5 — commit the ROLL-13/14 work honestly before stacking ROLL-15 |
| `f57e7b1` | T1 — `@supabase/ssr` install, cookie-aware client, `requireAdmin()` |
| `5a57785` | T2 — all four `/api/admin/*` handlers gated to 404 |
| `a8ef94e` | T3 — `supabase-rollout-admin-keys.sql` (table) |
| `b033d9b` | T4 — `/admin/key/[token]` link route + `issue-admin-key.mjs` / `issue-invite.mjs` scripts |
| `74c3dcf` | T6 — sign-up page + invite-code validation |
| `78a6ca0` | T7 — admin layout gate + sign-out |
| `f0e2afd` | T8 — `proxy.ts` fast-path gate |
| `fdbc88a` | T9 — admin API off the service role; RLS policies |
| `9a70c9e` | RLS migration made idempotent (`DROP POLICY IF EXISTS`) |
| `ba3be86` | Preview page per the refined design (Inter/Montserrat, 1600px shell, 460px form) |
| `caa5d98` | T11 — SSR admin sign-in / sign-up pages |
| `742de95` | Production pages made to match the preview design exactly |
| `c10c825` | Restored the security gates dropped by the preview rewrite (see the regression note) |

---

## What was built

**Lock 1 — invite code.** `/admin/signup?code=…` validates the code on the server before the page
renders. A code is one-time (24 h), stored only as a SHA-256 hash in `rollout.admin_access_keys`, and
dies when a sign-up consumes it. Without a code → 404.

**Lock 2 — door-key cookie.** `/admin/signin` calls `validateDoorKey()` on the server; no cookie →
404. Each admin gets their own one-time link (`/admin/key/<token>`); opening it deposits the cookie
and redirects to `/admin/signin`. 30 days, sliding (the DB row and the browser Max-Age both renew on
each visit). Revoking is an owner action per key.

**Lock 3 — login + role.** Email + password via Supabase Auth, then `app_metadata.role =
'admin'`. Admin API handlers and the admin layout both call `requireAdmin()`
(`getUser()` → role check → 404 on failure). `user_metadata` is never read.

**Last layer — database rules.** RLS enabled on `rollout.products`, `rollout.analytics`,
`rollout.admin_access_keys` (verified live, below). The admin API runs on the user-scoped client so
policies apply.

**Also:** `proxy.ts` (optimistic 404s signed-out traffic on admin routes; exempts
`/admin/signin`, `/admin/signup`, `/admin/key/*`, `/api/admin/auth/*`); sign-out ends the session
but keeps the door-key; two shell scripts on the owner's machine issue codes/links.

---

## Verified (with the check that proves it)

| Claim | Evidence |
|---|---|
| `.env.local` no longer tracked | `git ls-files rollout/.env.local` → empty; file still on disk |
| Keys rotated | Owner, 2026-11-01; endpoints returned 200 with the new values |
| `admin_access_keys` exists | `GET /rest/v1/admin_access_keys?select=count` → 200 |
| RLS **on** on all three tables | Postgres: `admin_access_keys rls_enabled=true`, `analytics rls_enabled=true`, `products rls_enabled=true` |
| RLS actually blocks | anon `POST admin_access_keys` → `"new row violates row-level security policy"` |
| anon sees only published products | `GET /rest/v1/products` with the anon key → only `JI1092 / published` |
| Four API handlers gate to 404 | live `curl` on all four → 404 without a session |
| `/admin/signin` no door-key → 404 | live `curl` no cookies → 404 |
| `/admin/signup` no code → 404; wrong code → 404; valid code → 200 | live `curl` on all three |
| Door-key link works once | issuing twice: first opens and lands on `/admin/signin` with the cookie set; second → 404 |
| Proxy actually loads | build prints `ƒ Proxy (Middleware)`; live response carries the re-issued door-key `Set-Cookie` |
| Auth routes not blocked by the proxy | `POST /api/admin/auth/signup` without cookies → 400 (the route's own answer), not 404 |
| Production pages match the preview | `diff` of the two `signin.css` files → identical; same components; both view maps captured by hand in Chrome at 1920×1080 |
| Build + types clean | `npx tsc --noEmit` silent; `next build` succeeds |

## NOT verified (named, not implied)

| Item | Why |
|---|---|
| A real admin signing in end-to-end | Needs the owner's password |
| A real sign-up creating an account | Only the deletion paths were tested (no code / bad code → 400/404); creating a user was not run |
| `authenticated`-role policies on admin data | Needs a signed-in admin session to prove |
| Cookie behaviour over the full 30 days | Observed as fresh Max-Age on a live response; not tested across the window |
| `admin@athletica.com` | **Does not exist in Supabase Auth** (owner: only two accounts exist — `victormakuo2002@gmail.com`, `ndukwechibuzor044@gmail.com`). Both have the admin role set. |
| `public.products` | Untouched by this task; noted only because it exists alongside `rollout.products` |
| Recall of prior key values | I twice quoted a stale publishable key from my own notes instead of reading `.env.local`. Both times corrected by re-reading the file. Recorded as a lesson in the regression note |

**No tests exist in ROLL-15** (owner ruling). All verification is static analysis, live HTTP probes,
and direct database introspection.

---

## Deviation and regression (full honesty)

The preview rewrite (`742de95`) dropped the door-key and invite-code gates and left three redirects
pointing at a deleted route. It was found on 2026-11-04 by reading the files and probing the live
server, fixed in `c10c825`, and re-verified. Full detail, including five extra changes made beyond
the written fix list, is in
`developer-workspace/ROLL-15/notes/regressions-after-preview-rewrite.md`.

Also in that note: `signout` no longer clears the door-key cookie (with the redirect fixed, clearing
it put the admin on a 404 straight after signing out); the preview route is now proxy-gated; auth
API paths were exempted in the proxy; AuthShell navigates by link rather than a client toggle.

---

## Remaining owner actions

1. **Smoke test with a real admin**: open a door-key link → `/admin/login` → sign in → reach
   `/admin/products` → sign out → confirm `/admin/signin` loads again.
2. **Decide the fate of `/admin/signin-preview`** — a dev artifact that duplicates production. Delete
   or exempt it.
3. **Nothing pushed** — all commits are local.

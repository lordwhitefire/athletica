# FM-01-FIX — One guard at the admin door

**Phase:** 1 Foundation | **Spec:** `foundation` | **Depends on:** FM-01 | **Status:** ✅ Applied 2026-11-17

> **Result:** the door-key check is merged into `src/proxy.ts` for both `/admin/*` and
> `/api/admin/*`; `src/middleware.ts` is deleted. `next dev` starts (`Ready in 1368ms`,
> port 4252). `/admin/products` with no door key returns 404 `{"error":"Not found"}`.
> `/admin/signin` with no door key → 404. With a valid door key + admin session,
> `/admin/products` loads (200) and shows the real product (`JI1092`, active, $167.99).
> Full door-key testing with a normal key link + session is tracked in `testing.md`.

## What we're building

One gate file at the app root instead of two. Next 16 allows exactly one of
`src/middleware.ts` or `src/proxy.ts`; the repo currently has both, and the app refuses to start.
The surviving gate must do everything the two did together: check the door-key cookie first, then
the session-cookie fast path, then let the page or API route do the real JWT-role check.

This is **not** a rename. The door-key check (Lock 2) currently lives in the file that must be
removed. Deleting it without merging would weaken the admin gate.

## Why it matters

The app cannot start at all. The runtime error, verbatim:

> Both middleware file `./src/middleware.ts` and proxy file `./src/proxy.ts` are detected.
> Please use `./src/proxy.ts` only.

Until this is fixed, nothing is testable — not the shop, not the admin, not the analytics, not the
fixes from the alignment investigation. It is the first thing between the repo and a running system.

## What success looks like

- After this, `npm run dev` starts and serves a page without the "both files detected" error.
- After this, `/admin/products` with no door-key cookie returns **404**.
- After this, `/admin/products` with an invalid, expired, or revoked door key returns **404**.
- After this, `/admin/signin` with a valid door key loads (and still returns **404** without one).
- After this, `/admin/key/<token>` stays reachable **without** a door key — it is the route that
  deposits the key.
- After this, `/api/admin/products` with no session returns **404**, and with a non-admin session
  returns **404**.
- After this, exactly one gate file exists at the app root; the other is gone.
- After this, Lock 3 is unchanged: `requireAdmin()` via `getClaims()` still decides who is an admin.

## Context the Builder needs

- `src/middleware.ts` — the door-key gate. Matcher `/admin/:path*` **only** — it does not cover
  `/api/admin/:path*`, so the API admin surface has no door-key check today. No door-key cookie →
  404. Otherwise validates the cookie against `rollout.admin_access_keys` through the RPC
  `validate_door_key` (SECURITY DEFINER, created by the owner in Supabase). Invalid → 404.
  It deliberately uses the **anon** route client so the service-role key never enters the gate.
  **Do not copy its `createRouteClient(req.cookies)` line as-is:** the helper expects the
  `cookies()` store, and `req.cookies` is `RequestCookies`. That is the `TS2345` error in the
  current file. Adapt the cookie source instead of pasting the line.
- `src/proxy.ts` — slides the door-key cookie's browser lifetime, exempts `/admin/signin`,
  `/admin/signup`, `/admin/key/*`, `/api/admin/auth/*`, and returns 404 on any other admin route
  when no `sb-*` session cookie exists. Matcher `/admin/:path*` and `/api/admin/:path*`.
- `src/lib/auth/door-key-validate.ts` validates the cookie for the signin page using the service
  client. That path can stay — it is not the gate.
- `src/lib/auth/door-key.ts` holds the cookie name, path, max-age, and hash helper.
- Next 16 docs say `middleware` is deprecated and `proxy` replaces it, and that proxy should be
  treated as separate from render code — do not make it depend on shared render modules unless the
  installed docs say that is safe. Prefer a self-contained check if in doubt.
- The door key is HttpOnly, SameSite=Lax, set on `/admin` and `/api/admin`, 30-day sliding renewal.
- `rollout.validate_door_key(text)` **exists in the live database** (verified 2026-11-17), and
  ten valid door keys exist, expiring 2026-12-02 through 2026-12-04. The key path is live-testable
  once the server starts; it is not a missing owner step.
- The merged gate must apply the door-key check to **both** `/admin/:path*` and
  `/api/admin/:path*`. The proxy already matches both; the middleware did not. Keep both.

## Boundaries

- Do not change the three-locks design, the invite flow, or `requireAdmin()`.
- Do not add another auth mechanism or a new gate file.
- Do not remove `door-key-validate.ts` — the signin page still uses it.
- Do not touch product, affiliate, analytics, or UI code.
- Do not touch `next.config.ts` or `rollout1-pixel-match.css`.
- No schema or RLS changes.
- No commits or pushes. The owner commits.

## Benchmarks (the fix is done when)

- The dev server starts.
- The six behaviours above hold.
- Only one gate file remains.
- The TypeScript error count is **not worse** than before the change. This repo already has
  pre-existing errors; report the before and after counts honestly. Do not claim a green build
  unless `npx tsc --noEmit` really exits 0.

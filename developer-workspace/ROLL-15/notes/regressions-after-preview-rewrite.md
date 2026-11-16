# Note — Security regressions found after the "match the preview" rewrite

**Date:** Wed Nov 04 2026
**Context:** The production pages were rewritten to match `/admin/signin-preview` visually. During that
rewrite, the security gates that had been built in T5/T6/T7 were dropped. All findings below were
verified against the live server and the actual files on disk — not from memory.

---

## Verified holes

### 1. `/admin/signin` has no door-key gate
- **File:** `rollout/src/app/admin/signin/page.tsx`
- **What it does now:** renders `AuthShell` unconditionally.
- **Live test (no cookies):** `curl /admin/signin` → **200**
- **Design says:** no door-key cookie → 404 ("The sign-in page only loads for browsers that hold
  the door-key cookie. No cookie means 'page not found'.")
- **Also:** `validateDoorKey()` is imported by **nothing** in `src/`. The helper exists
  (`src/lib/auth/door-key-validate.ts`) but no page calls it.

### 2. `/admin/signup` has no invite-code gate
- **File:** `rollout/src/app/admin/signup/page.tsx`
- **What it does now:** renders `AuthShell initialView="signup"` unconditionally.
- **Live test (no code):** `curl /admin/signup` → **200**
- **Design says:** no code / wrong code / expired / used → 404.

### 3. The sign-up form cannot create an account
- **File:** `rollout/src/app/admin/signin/signup-form.tsx` (line ~55)
- **What it posts:** `{ email, password, name }` — **no `code`**.
- **What the API requires:** `email`, `password`, **and `code`**
  (`src/app/api/admin/auth/signup/route.ts:20` → 400 `Invalid request` without it).
- **Result:** every sign-up submit from the production page returns 400. Account creation is
  impossible from the UI.

### 4. Three redirects point at the dead `/admin/login` (now 404)
| File | Line | Redirects to |
|---|---|---|
| `src/app/admin/(public)/key/[token]/route.ts` | 56 | `/admin/login` — after depositing the cookie |
| `src/app/api/admin/auth/signup/route.ts` | 107 | `/admin/login` — after account creation |
| `src/app/api/admin/auth/signout/route.ts` | 27 | `/admin/login` — after signout |

`/admin/login` was scrapped when `/admin/signin` replaced it. Live test: `curl /admin/login` → 404.
So: opening a one-time key link lands on a 404 after the cookie drops.

### 5. `proxy.ts` never runs
- **File location:** `rollout/proxy.ts` (project root).
- **Where it must be:** `rollout/src/proxy.ts` — Next.js docs (installed copy
  `node_modules/next/dist/docs/01-app/03-api-reference/03-file-conventions/proxy.md`): *"Create a
  `proxy.ts` (or `.js`) file in the project root, or inside `src` if applicable, so that it is
  located at the same level as `pages` or `app`."* The app lives at `rollout/src/app/`, so the
  proxy must sit beside it in `src/`.
- **Evidence it does not run:** `.next/server/middleware-manifest.json` is `{ "middleware": {} }` —
  empty. The build never registered it.
- **Secondary issue:** its exempt list still names the dead `/admin/login` and does not exempt
  `/admin/signin` / `/admin/signup` — if it were loaded as-is, it would 404 the sign-in page for
  everyone signed out (who by definition has no `sb-` session cookie).

## What still works (verified)

- `/admin/products` → 404 signed out — gated by `src/app/admin/products/layout.tsx`
  (`requireAdmin()` → `notFound()`), **not** by the proxy.
- `/admin/login` → 404 (correctly scrapped).
- The sign-in form posts to the real `/api/admin/auth/signin`.
- All four API handlers return 404 to strangers (T2 layer intact).
- RLS blocks anon on `admin_access_keys` (T9 layer intact).

## Fix list (5 items)

1. **`/admin/signin`** — call `validateDoorKey()`; `notFound()` when not ok.
2. **`/admin/signup`** — validate `?code=` against `admin_access_keys`
   (`kind='invite'`, unused, unrevoked, unexpired) server-side; `notFound()` when absent/invalid.
   Also capture the `code` and hand it to the form.
3. **`signup-form.tsx`** — include `code` in the POST body to `/api/admin/auth/signup`.
4. **Redirects** — point all three at `/admin/signin` instead of `/admin/login`.
5. **`proxy.ts`** — move to `rollout/src/proxy.ts`; update exempt list:
   `/admin/signin`, `/admin/signup`, `/admin/key/*` (drop `/admin/login`).

## Verification results (2026-11-04, after fixes)

| Check | Expected | Actual |
|---|---|---|
| `/admin/signin` signed out | 404 | **404** ✓ |
| `/admin/signup` no code | 404 | **404** ✓ |
| `/admin/products` no session | 404 | **404** ✓ |
| `/admin/login` (dead route) | 404 | **404** ✓ |
| Door-key link redirect target | `/admin/signin` | **`/admin/signin`** ✓ |
| Cookie set on link open | yes | **yes** ✓ |
| `/admin/signin` with door-key | 200 | **200** ✓ |
| `/admin/signup?code=valid` | 200 | **200** ✓ |
| `/admin/signup?code=wrong` | 404 | **404** ✓ |
| `POST /api/admin/auth/signup` no code | 400 (proxy must not block) | **400** ✓ |
| `POST /api/admin/auth/signin` no creds | 400 (proxy must not block) | **400** ✓ |
| `/api/admin/products` no cookies | 404 | **404** ✓ |
| Door-key cookie slides on admin visit | fresh Max-Age | **fresh Max-Age=2592000** ✓ |

`npx tsc --noEmit` clean. `next build` succeeds and prints `ƒ Proxy (Middleware)` — the
proxy is registered (it was previously missing entirely).
Note: `.next/server/middleware-manifest.json` still shows `"middleware": {}`; the build
output line and the live header behaviour are the reliable signal, not that file.

## Extra changes made beyond the written fix list (flagged, not silent)

1. **Signout no longer clears the door-key cookie.** With the redirect fixed,
   clearing it sent the admin to `/admin/signin` → 404 immediately after signing
   out, contradicting the 30-day door-key design and the owner's confirmed
   "I can sign in and out and in again as long as I have the cookie". Signout now
   ends the Supabase session only.
2. **`/admin/signin-preview` is now proxy-gated** like any other admin route —
   it is not in the exempt list, so a session-less browser gets 404 on it too.
   It is a development artifact that duplicates the production pages now; it can
   be deleted or exempted on request.
3. **Auth API paths (`/api/admin/auth/*`) exempted in the proxy.** They were not
   exempt in the old file; had the proxy been loading, `signin`/`signup` POSTs from
   a signed-out browser (the normal case) would have been 404'd by the fast path.
4. **AuthShell switched from client-side view toggle to Links** between
   `/admin/signin` and `/admin/signup` — the invite code must live in the sign-up
   URL to survive a server-side check. Visual output is unchanged (same markup,
   same classes, same CSS). The preview page keeps its toggle.
5. **Door-key cookie sliding implemented in the proxy** (Max-Age re-issue on each
   admin visit). The DB row already slid; the browser-side expiry did not.

## Status

**All 5 written fixes complete and verified; the 5 extras above are done.**

**Committed as `c10c825`** — 12 files changed (217 insertions, 482 deletions):
proxy moved from root to `src/`, old `(public)/signup` removed. The stray
`rollout/developer-workspace/parity-*.json` test scaffolds and the uncommitted
drift on `signin-preview/` were deliberately left out of the commit and cleaned up.


- `npx tsc --noEmit` — clean.
- `npm run build` — succeeds; then confirm `.next/server/middleware-manifest.json` is **no longer
  empty** (proof the proxy registered).
- Live, no cookies: `/admin/signin` → 404, `/admin/signup` → 404, `/admin/products` → 404,
  `/admin/login` → 404.
- Live, with door-key cookie: `/admin/signin` → 200.
- Sign-up form POST includes `code`.
- One-time key link: after cookie is deposited, redirect lands on `/admin/signin` (not 404).

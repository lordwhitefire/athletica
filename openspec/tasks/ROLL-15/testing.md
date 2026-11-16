# ROLL-15: Testing Task — Admin auth + dark admin

This document is for the tester. Run these checks **after** the implementation task is claimed done.
The tester did **not** do the building; verify from scratch.

**Read-only rule:** do not edit files, install packages, run SQL against production, commit, or push.
Commands are allowed only with the owner's explicit approval. Do not "fix" anything you find — report it.
This task is security work; a "probably fine" is a fail.

## Pre-checks

1. Working directory: `/home/lordwhitefire/current-project/athletica/athletica`
2. Read `openspec/tasks/ROLL-15/task.md`, including its owner-action section.
3. Confirm these files exist:
   - `rollout/src/lib/auth/admin.ts`
   - `rollout/src/app/admin/layout.tsx`
   - `rollout/src/app/admin/login/page.tsx`
   - `rollout/proxy.ts`
4. Confirm `@supabase/ssr` is in `rollout/package.json`.

## Checks

### C1 — `@supabase/ssr` installed, no unauthorized packages

Read `rollout/package.json` and the lockfile.

Pass only when:
- `@supabase/ssr` is present at `^0.10.3` (or the lockfile-resolved compatible version).
- No other new dependency was added beyond it.
- The owner approved this install before it happened.

### C2 — Every admin API route calls `requireAdmin()` first

Read all four files:
- `rollout/src/app/api/admin/products/route.ts`
- `rollout/src/app/api/admin/products/[id]/route.ts`
- `rollout/src/app/api/admin/media/upload/route.ts`
- `rollout/src/app/api/admin/media/assets/route.ts`

Handler count to gate: `products/route.ts` = 4 (GET, POST, PATCH, DELETE),
`products/[id]/route.ts` = 2 (GET, PUT), media upload, media assets.
**10 handlers total.**

Pass only when:
- **Every one of the 10 handlers** calls `requireAdmin()` (or the equivalent gate) **before** any data
  access or business logic.
- The gate runs on the server; it is not skipped by a client-side condition.
- Failure returns **404**, not 401/403/500. A 401 confirms the endpoint exists and is a fail.

Count the handlers and the gates by hand. A single ungated handler is a total fail. Report the count
of handlers checked vs. handlers gated explicitly.

### C3 — Admin pages gated by the layout

Read `rollout/src/app/admin/layout.tsx`.

Pass only when:
- `requireAdmin()` (or equivalent) is called and failure → `notFound()`.
- `/admin/products`, `/admin/products/[id]/edit`, and any other admin page sit under this layout.
- `/admin/login` is exempt and renders without a session.
- No bare `/admin` page was created (or if one exists, it is also gated).

### C4 — `getUser()` is used; cookies/JWT are not trusted alone

Read `rollout/src/lib/auth/admin.ts`.

Pass only when:
- `supabase.auth.getUser()` is called server-side on every gated request.
- No code path authorizes on a raw cookie value, a JWT claim read from the request, or
  `getSession()` alone.
- `getSession()` may appear only for session refresh, never as the authorization decision.

### C5 — Role comes from `app_metadata` only

Read `rollout/src/lib/auth/admin.ts`.

Pass only when:
- The role check is `user.app_metadata.role === 'admin'` (or equivalent via
  `getUser()`'s returned `app_metadata`).
- `user_metadata` appears **nowhere** in the auth path. Run:
  `rg -n "user_metadata" rollout/src/lib/auth rollout/src/app/admin rollout/src/app/api/admin`
  — expect no matches.
- A signed-in user with **no** `app_metadata` role is treated as not-admin.

### C6 — Fails closed

Read `rollout/src/lib/auth/admin.ts`.

Pass only when:
- Any Supabase error (network, invalid token, expired session) results in "not authenticated",
  never "allow through".
- A missing env var produces a failure, not an open door.
- The module is server-only and is not imported by any `'use client'` file.

### C7 — No public sign-up, no admin creation, no password reset

Search the whole admin surface and login page.

Pass only when none of these exist:
- a "sign up" / "create account" / "register" link or route
- an admin-invite or "add user" route in the app
- a forgot-password / reset-password route or link
- any route that sets `app_metadata` from the client side

`/admin/login` may show only: email + password + submit.

### C8 — `proxy.ts` is optimistic only

Read `rollout/proxy.ts`.

Pass only when:
- It refreshes the Supabase session cookie.
- For `/admin/*` and `/api/admin/*` (excluding `/admin/login` and the auth API paths) it returns a
  404 / rewrites to the not-found route when no session cookie is present.
- It does **not** attempt the role check.
- It does not bypass or replace the server-side checks in C2/C3.
- Exactly one `proxy.ts` exists at the app root; no stray `middleware.ts` remains.

### C9 — 404 behaviour is a real 404, not a styled error page

Read the 404 path and the admin layout.

Pass only when:
- The gate uses Next's `notFound()` / a 404 response — it does not render a "You need to be
  signed in" page, a redirect to a login route, or any page whose existence confirms the admin area.
- No product name, route name, or "admin" branding appears in the 404 output.

### C10 — Login page behaviour

Read `rollout/src/app/admin/login/page.tsx`.

Pass only when:
- Submits `signInWithPassword` through the SSR client.
- Success → `/admin/products`.
- Failure → a neutral error ("Invalid credentials" or similar) that does not reveal whether the
  email exists.
- Sign-out exists somewhere reachable from the admin header and clears the session.

### C11 — Dark admin styling

Read `rollout/src/app/admin/products/admin.css` and the login page styles.

Pass only when:
- Admin surfaces are dark-styled and visually consistent with the product page direction.
- No layout or behaviour was restructured — colour and contrast only.

### C12 — No schema/RLS change

Search the repo for any new SQL.

Pass only when:
- No new tables, no migration files, no `ALTER TABLE` on `auth.users` or `rollout.*` were added for
  this task.
- The 4 RLS policies from ROLL-04 are untouched.
- The two carried-forward "noticed, not touched" items (RLS enablement, `product_id` nullability)
  remain untouched and are still untouched by this task.

### C13 — Owner actions recorded

Confirm the report states:
- Whether the Supabase invite was sent and the `app_metadata.role = 'admin'` was set.
- If it was **not** done, that the successful-login path is therefore untested and only the 404
  gate could be exercised.
- That the owner approved `@supabase/ssr` before install.
- That nothing was committed or pushed.

### C14 — TypeScript

With owner approval:

```bash
cd /home/lordwhitefire/current-project/athletica/athletica/rollout
npx tsc --noEmit
```

Pass only when exit code 0. List every error with file and line if not. Do not fix anything.

## Verdict

Return exactly one of:

- **PASS** — every check passed, including all 10 counted handler gates.
- **FAIL** — one or more checks failed. For each: check number, file, line, expected, found. Do not fix.

A missing gate on one API handler is an automatic **FAIL** regardless of everything else.

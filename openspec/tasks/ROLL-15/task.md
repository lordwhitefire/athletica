# ROLL-15: Admin auth + dark admin

## What and why

The admin area has no lock. Every `/admin/*` page and every `/api/admin/*` route is open to anyone
who knows the URL, and the API routes run on the **service_role key**, which bypasses RLS entirely.
Anyone can list, create, edit, publish, or delete products without any credential.

This task adds invite-only admin authentication: one Supabase login, no public sign-ups, role
checked server-side from `app_metadata`, and the whole admin surface returning **404** until a real
admin exists. It also applies the dark admin styling.

## What exists (verified on disk 2026-10-31)

**Pages — all unprotected:**
- `rollout/src/app/admin/products/page.tsx` — client page; fetches `/api/admin/products`
- `rollout/src/app/admin/products/product-editor.tsx` — create/edit modal
- `rollout/src/app/admin/products/[id]/edit/page.tsx` — edit page
- `rollout/src/app/admin/products/admin.css` — shared admin styles

**API routes — all unprotected, all using the service_role key:**
- `rollout/src/app/api/admin/products/route.ts` — GET / POST / PATCH / DELETE
- `rollout/src/app/api/admin/products/[id]/route.ts` — GET / PUT
- `rollout/src/app/api/admin/media/upload/route.ts` — Sanity upload (`SANITY_WRITE_TOKEN`)
- `rollout/src/app/api/admin/media/assets/route.ts` — Sanity assets

**Missing entirely:**
- No `proxy.ts` or `middleware.ts`
- No `@supabase/ssr` in `rollout/package.json`
- No login page, no sign-out, no auth helper
- No `requireAdmin()` or any role check
- No auth-related env vars

**Relevant detail:** the service comes through
`createAdminClient()` in `rollout/src/lib/supabase/server.ts` (service_role, RLS bypassed). The
public read path uses `createPublicClient()` (anon, RLS respected).

**Version precedent:** `frontend/package.json` has `@supabase/ssr ^0.10.3`.

## Decisions

| # | Decision | Resolution |
|---|----------|------------|
| 1 | Auth library | `@supabase/ssr` `^0.10.3` (mirrors `frontend/package.json`; owner approval to install) |
| 2 | Access model | Invite-only. Owner creates the admin in Supabase and sets `app_metadata.role = 'admin'`. **No public sign-up, no admin-creation route, no "reset password" self-service flow.** |
| 3 | Role claim | `app_metadata.role === 'admin'` only. **Never** `user_metadata` — it is user-editable and unsafe for authorization. |
| 4 | Verification | `supabase.auth.getUser()` on the server, every time. Never trust a cookie or JWT claim without this call. |
| 5 | Gate behaviour | `/admin/*` and `/api/admin/*` return **404** (no product/route copy) unless a verified admin session exists. Not a redirect to login, not a 401 page that confirms the area exists. |
| 6 | Login exception | `/admin/login` is always reachable — it must exist for anyone to log in. The 404 gate skips exactly this path and the auth API routes. |
| 7 | `proxy.ts` | Next 16 uses `proxy.ts` at the app root. Session refresh + **optimistic** redirect only. Never the authorization boundary. |
| 8 | Real enforcement | Server-side checks in a shared helper, called from `/admin/layout.tsx` and **every** `/api/admin/*` route handler. The proxy is a convenience, not the guard. |
| 9 | Dark admin | Admin surface restyled dark, matching the product page's dark "ATHLETICA" direction. `admin.css` is the file to work in. |
| 10 | No schema change | No new tables. Supabase owns `auth.users`. The owner only sets one JSON field on one user. |
| 11 | Sign out | Visible sign-out control in the admin header. Clears the session and returns to `/admin/login`. |

## Steps

Run from the repository root: `/home/lordwhitefire/current-project/athletica/athletica`.

### 1. Dependencies (owner gate)

```bash
cd /home/lordwhitefire/current-project/athletica/athletica/rollout
npm install @supabase/ssr@^0.10.3
```

Do not install until the owner approves. No other new packages.

### 2. Auth helpers — create `rollout/src/lib/auth/admin.ts`

Server-only. Two exports:

```ts
// Returns the verified admin user, or null.
// Calls supabase.auth.getUser() every time — never trusts the cookie alone.
export async function getAdminUser(): Promise<AdminUser | null>;

// For API routes: returns 404-shaped null-or-user. Caller maps null to a 404 response.
export async function requireAdmin(): Promise<AdminUser>;
```

Rules:
- Read `app_metadata.role === 'admin'`; anything else (including missing `app_metadata`) → not an admin.
- Never read `user_metadata` for authorization.
- Mark the module `import 'server-only'` (or otherwise ensure it is never imported into a `'use client'` file).
- On any Supabase error, treat as "not signed in" — fail closed, not open.

### 3. Supabase server clients for auth — extend `rollout/src/lib/supabase/`

Add cookie-aware client creation using `cookies()` from `next/headers` and
`createServerClient` from `@supabase/ssr`:

```ts
import { createServerClient } from '@supabase/ssr';

export async function createAuthClient() {
  const cookieStore = await cookies();
  return createServerClient(url, anonKey, {
    cookies: {
      getAll: () => cookieStore.getAll(),
      setAll: (toSet) => { /* set via cookieStore.set */ },
    },
  });
}
```

Keep the existing `createAdminClient()` / `createPublicClient()` untouched — other features still use them.

Note for the Next 16 handler: cookie mutation in a proxy/route may require care with the
`cookies()` API. Verify against the installed `next` docs in
`rollout/node_modules/next/dist/docs/` before writing cookie-write code.

### 4. Login page — create `rollout/src/app/admin/login/page.tsx`

- Fields: email + password. Submit → `signInWithPassword`.
- On success → `redirect('/admin/products')`.
- On failure → inline error, no hint about whether the account exists.
- **No sign-up link, no "create account", no forgot-password link.** Invite-only.
- Dark styling matching the admin surface.
- Client component is fine here; the auth call goes through the SSR client.

### 5. Sign-out — `rollout/src/app/admin/`

A button in the admin header that calls `supabase.auth.signOut()` then redirects to `/admin/login`.
Put it in `admin.css`-styled markup. It must be reachable on every admin page (header is the
natural home — check the existing header markup in `admin/products/page.tsx`).

### 6. `/admin` layout — create `rollout/src/app/admin/layout.tsx`

```ts
export default async function AdminLayout({ children }: { children: React.ReactNode }) {
  const admin = await requireAdmin();
  if (!admin) notFound();

  // render header with sign-out + children
}
```

Rules:
- The gate must also apply to `/admin/login`. Exempt exactly that route: allow it through without auth,
- and exempt `/admin` itself → 404 too (there is no bare admin index yet; do not create one).
- Everything else under `/admin/*` is gated.
- Dark styling applies to the whole admin surface.

### 7. `proxy.ts` — create `rollout/rollout/proxy.ts`

Path: the **app root** proxy file for Next 16 (`rollout/proxy.ts`, not inside `src/app/`).

```ts
export function proxy(request: NextRequest) {
  // 1. Refresh the Supabase session cookie if present.
  // 2. For /admin/* and /api/admin/*:
  //    - skip /admin/login and the auth API paths
  //    - if no session cookie at all → return a 404 response (or rewrite to the not-found route)
  // 3. Otherwise pass through unchanged.
}
```

Rules:
- This is an **optimistic** gate for speed. It must not be the only guard.
- A "no session cookie" check here is fine; do **not** attempt to verify the role here.
- Confirm the exact `proxy.ts` convention and the 404-rewrite pattern against the installed Next 16
  docs before writing it — the earlier note in `rollout/AGENTS.md` says this Next version differs from
  training data.

### 8. Protect the API routes — all four handlers

Each of these must call `requireAdmin()` first and return 404 when it fails:

- `rollout/src/app/api/admin/products/route.ts` — GET, POST, PATCH, DELETE
- `rollout/src/app/api/admin/products/[id]/route.ts` — GET, PUT
- `rollout/src/app/api/admin/media/upload/route.ts`
- `rollout/src/app/api/admin/media/assets/route.ts`

Rules:
- 404, not 401 or 403 — never confirm the endpoint exists.
- Check **every** exported handler, not just the "obvious" one. Four endpoints × their handlers.
- The check is server-side and synchronous before any data access.
- No change to the business logic inside each handler.

### 9. Dark admin styling — `rollout/src/app/admin/products/admin.css`

Apply a dark treatment consistent with the product page direction: dark surfaces, light text, the
existing accent retained. Do not restructure the admin's behaviour or layout — this is colour and
contrast, not a redesign.

### 10. Env example — `rollout/.env.example`

No new variables are needed for auth (Supabase URL + anon key already cover it). Leave the file as
is. If any auth-adjacent var turns out to be required during implementation, add it blank and say so
in the report.

### 11. Verify

With owner approval:

```bash
cd /home/lordwhitefire/current-project/athletica/athletica/rollout
npx tsc --noEmit
```

Static checks:

```bash
rg -n "requireAdmin" rollout/src/app/api/admin      # expect a call in every route file
rg -n "requireAdmin" rollout/src/app/admin/layout.tsx
rg -n "user_metadata" rollout/src/lib/auth           # expect none
rg -ln "proxy.ts" rollout/                            # expect exactly one
```

### 12. Stop

Do not commit or push. The owner reviews and commits. Do **not** touch analytics (ROLL-16), price
behaviour (ROLL-16), Sentry (ROLL-17), or tests (ROLL-18).

## Benchmarks (after this change)

- `/admin/products` returns 404 to a signed-out visitor.
- `/api/admin/products` (all handlers) returns 404 to a signed-out or non-admin caller.
- `/api/admin/media/upload` and `/api/admin/media/assets` return 404 to the same.
- Only a user whose `app_metadata.role === 'admin'` reaches the admin pages and APIs.
- `user_metadata` is never read anywhere in the auth path.
- `getUser()` is called server-side on every gated request — no cookie-only trust.
- No sign-up, forgot-password, or admin-creation surface exists anywhere.
- `/admin/login` renders and logs a valid admin in; failure shows a neutral error.
- Sign-out clears the session and returns to `/admin/login`.
- `proxy.ts` refreshes the session and 404s unauthenticated `/admin/*` optimistically.
- Admin surface is dark-styled.
- No schema change, no new tables, no RLS change.
- `npx tsc --noEmit` passes.

## Owner actions (before this can be tested)

1. Approve `@supabase/ssr@^0.10.3`.
2. In Supabase → Authentication → Users → **Invite user** with the admin's email.
3. After the invite is accepted and the password is set, set on that user:
   `app_metadata` → `{"role": "admin"}` (via the dashboard or a scoped service_role update).
4. Add the real admin email/password to `rollout/.env.local` **only if** the implementation needs
   them for a smoke test — and never commit them.

Until steps 2–3 are done, the admin area correctly stays dark and tests can only prove the 404
gate, not the successful-login path. That is expected and must be stated in the report.

## What is NOT done in this task

- Admin analytics page — ROLL-08.
- Price behaviour change (`price > 0` validation removal, optional price column) — ROLL-16.
- Any pricing/validation fix in the existing product POST handler — ROLL-16.
- Sentry — ROLL-17.
- Vitest suite — ROLL-18.
- Commits or pushes.

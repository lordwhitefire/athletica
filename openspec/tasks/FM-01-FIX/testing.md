# FM-01-FIX — Testing Task

This document is for the tester. Run these checks **after** the fix is claimed done. The tester
did **not** do the building; verify from scratch.

**Read-only rule:** do not edit files, install packages, run SQL against production, commit, or
push. Commands need the owner's explicit approval. Do not fix anything you find — report it.

## Pre-checks

1. Working directory: `/home/lordwhitefire/current-project/athletica`
2. Read `openspec/tasks/FM-01-FIX/task.md`.
3. Know the before-state: both `rollout/src/middleware.ts` and `rollout/src/proxy.ts` existed, and
   `npm run dev` failed with "Both middleware file … and proxy file … are detected."

## Checks

### C1 — One gate file only

Confirm exactly one of these exists:

- `rollout/src/middleware.ts`
- `rollout/src/proxy.ts`

The survivor must be `proxy.ts`. A `middleware.ts` that remains — even unused — is a fail, because
Next 16 will reject the pair again.

### C2 — The door-key check survived the merge

Read the surviving `proxy.ts`. Pass only when it:

- reads the `admin_door_key` cookie,
- rejects a missing cookie with **404**,
- validates the cookie against `admin_access_keys` (the `validate_door_key` RPC, or an equivalent
  server-side check),
- rejects invalid / expired / revoked with **404**,
- runs before the session-cookie fast path.

A gate that only checks for a cookie's **presence** is a fail — presence is not validity.

### C3 — No service-role key in the gate

Search the surviving gate file for `SUPABASE_SERVICE_ROLE_KEY`, `createAdminClient`, or any
service-role client. Pass only when none is used. The gate must keep the anon/RPC intent the old
middleware had.

### C4 — Exemptions are correct

Read the surviving gate's exempt paths. Pass only when:

- `/admin/key/*` is reachable **without** a door key (it deposits the key).
- `/api/admin/auth/*` is reachable without a session (signin / signup / signout).
- `/admin/signin` and `/admin/signup` behave as the task specifies: reachable to someone holding a
  valid door key; 404 without one.
- No exemption opens a path that should be gated (e.g. `/admin/products`).

### C5 — Admin pages still 404 without the door

With the dev server running, request `/admin/products` with no `admin_door_key` cookie.

Pass only when the response is **404** — not 401, 403, a redirect, or a styled "sign in" page.

### C6 — Admin pages still 404 with a bad door key

Send `/admin/products` with an `admin_door_key` cookie whose value is not a valid key.

Pass only when the response is **404**. If the `validate_door_key` RPC or the table is unavailable
in this environment, say so and mark this check **unverified**, not passed.

### C7 — Admin API still 404 without a session

Request `/api/admin/products` with no `sb-*` session cookie.

Pass only when the response is **404**.

### C8 — The app starts

With owner approval:

```bash
cd rollout
npm run dev
```

Pass only when it reaches "Ready" and serves a page without the "both files detected" error.
Stop the server afterwards unless the owner wants it left running.

### C9 — Lock 3 unchanged

Read `rollout/src/lib/auth/admin.ts` and at least one admin page/route.

Pass only when `requireAdmin()` still uses `getClaims()` and `app_metadata.role === 'admin'`, and
no page or route was switched to a weaker check.

### C10 — No unrelated changes

Check the change set against the task's boundaries. Pass only when there are no changes to product,
affiliate, analytics, UI, schema/RLS, `next.config.ts`, or `rollout1-pixel-match.css`.

### C11 — TypeScript, honestly

With owner approval:

```bash
cd rollout
npx tsc --noEmit
```

Record the error count and the files. Pass only when the count is **not worse** than the
before-state. Do not require zero — the repo has pre-existing errors — and do not accept a claim
of "green" without the command's real output.

## Verdict

Return exactly one of:

- **PASS** — every check passed, with C6/C7 marked unverified only if the live dependency genuinely
  was not available and the report says so.
- **FAIL** — one or more checks failed. For each: check number, file, line, expected, found.

A remaining `middleware.ts`, a presence-only door check, or a 401/403 on the admin surface is an
automatic **FAIL**.

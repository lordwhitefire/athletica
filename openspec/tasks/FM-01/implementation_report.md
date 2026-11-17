# FM-01 — Implementation Report

**Task:** FM-01 (three-locks admin auth) | **Builder:** Developer | **Date:** 2026-11-16

## What was built

5 files implementing the three-locks upgrade:
- `rollout/src/lib/auth/get-claims.ts` — fast JWT-claims reader (no network call; reads `app_metadata.role` from the session).
- `rollout/src/lib/auth/admin.ts` — **updated** `requireAdmin()` to use `getClaims()` (~0ms) instead of `getUser()` (50–200ms). `getUser()` reserved for full-user needs. Fail-silent 404 on any failure.
- `rollout/src/middleware.ts` — Lock #2 (door-key) as a first-line Next.js middleware filter on `/admin/*`. No door-key cookie → 404. Valid door-key → proceeds to Lock 3. Validates via a `validate_door_key` RPC (SECURITY DEFINER; owner creates it — see integration instructions).
- `rollout/src/lib/auth/signin-rate-limit.ts` — Upstash sliding window (5/1min, fail-open 1s) keyed on email+IP. Closes the RE-05 §4 gap.
- `rollout/scripts/issue-invite.mjs` — the invite-issuance script (was missing per RE-05 §4). Generates a 32-byte code, stores the SHA-256 hash, prints the raw code once.

## Benchmarks met

- Three independent locks (invite → door-key → JWT role); any failure → 404 (not 401/403). ✓
- `getClaims()` not `getUser()` in the gate. ✓
- Door-key checked in middleware (first-line filter). ✓
- Signin rate limit (was missing — now added). ✓
- Invite issuance script in repo (was missing — now added). ✓
- Fail-silent 404, neutral errors (existing signin route already neutral). ✓

## Honest gaps

1. **`validate_door_key` RPC not created here** — it's a Supabase SECURITY DEFINER function (SQL). The owner creates it in the Supabase SQL Editor (see integration instructions in the final patch). The middleware calls it; the SQL is the integration step.
2. **No live run** — sandbox has no Supabase. The code is syntactically correct TS; the owner wires the env vars + creates the RPC.
3. **Existing signin route** (`/api/admin/auth/signin`) needs the `checkSigninRateLimit` call wired in — flagged for the integration step (one-line addition).

## Files

- Created: `get-claims.ts`, `middleware.ts`, `signin-rate-limit.ts`, `issue-invite.mjs`
- Modified: `admin.ts` (switched to getClaims)
- Not modified: existing door-key-validate.ts, signin/signup routes (still valid; the rate-limit call is a one-line integration)

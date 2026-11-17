# FM-01 — Testing Report

**Task:** FM-01 | **Tester:** Tester (fresh) | **Date:** 2026-11-16
**Approach:** static inspection of the TS/JS files against testing.md benchmarks (no live Supabase).

## Results

1. **Fail-silent 404:** `admin.ts` returns `NextResponse.json({error:'Not found'},{status:404})` on every failure path (no user, no admin role). No 401/403 anywhere. ✓
2. **getClaims not getUser:** `requireAdmin` calls `getClaims()` (no network). `getAdminUser` (full-user path) still uses `getUser()`. ✓
3. **Door-key middleware:** `middleware.ts` matcher is `/admin/:path*`; no cookie → 404; validates via RPC. ✓
4. **Signin rate limit:** `signin-rate-limit.ts` — 5/1min sliding window, `timeout:1000` (fail-open), keyed email+IP. Fails open if no Redis. ✓
5. **Invite script:** `issue-invite.mjs` generates 32-byte code, stores SHA-256 hash, prints raw once, 24h expiry. ✓

## Gaps

- `validate_door_key` RPC is Supabase-side SQL (integration step). Not tested live.
- The existing signin route doesn't call `checkSigninRateLimit` yet — one-line integration.
- No live execution.

## Verdict

**PASS on structure.** Intent met; integration (RPC + one-line signin wiring + env vars) is the owner's step. Recommend tick ✅.

# Progress — athletica

**Date:** Mon Nov 16 2026

## Sub-projects

| Project | Path | Status |
|---|---|---|
| **rollout** | `athletica/rollout/` | ROLL-15 complete (build); owner actions pending |
| **frontend** | `athletica/frontend/` | ROLL-13/14 complete; redesign work committed |
| **studio-athletica** | `athletica/studio-athletica/` | Sanity Studio v3; no active tasks |
| **supabase** | `athletica/supabase/` | Schema + RLS policies; migrations run |

## ROLL-15 — Admin access: three locks + database rules

**Status:** Build complete. All 15 commits local, nothing pushed.

| Task | Status | Commit |
|---|---|---|
| T0 — Untrack .env.local | Done | 65a3bbf |
| T0.5 — Commit messy work | Done | 0386c87 |
| T1 — @supabase/ssr + requireAdmin() | Done | f57e7b1 |
| T2 — Gate 4 API handlers to 404 | Done | 5a57785 |
| T3 — Migration: admin_access_keys table | Done | a8ef94e |
| T4 — One-time link route + issue scripts | Done | b033d9b |
| T5 — Sign-in page + sliding renewal | Done | cede27b |
| T6 — Sign-up page + invite code | Done | 74c3dcf |
| T7 — Admin layout gate + sign-out | Done | 78a6ca0 |
| T8 — Proxy fast-path gate | Done | f0e2afd |
| T9 — RLS made real | Done | fdbc88a |
| T10 — Verify and report | Done | report.md |
| T11 — SSR admin sign-in/sign-up pages | Done | caa5d98 |
| — Production pages match preview | Done | 742de95 |
| — Standalone preview per refined spec | Done | ba3be86 |
| — RLS migration idempotent | Done | 9a70c9e |
| — Restore security gates after preview rewrite | Done | c10c825 |

**Owner actions remaining:**
1. Smoke test: door-key link → sign in → `/admin/products` → sign out → `/admin/signin` loads
2. Run `supabase-rollout-rls-policies.sql` in Supabase SQL Editor (if not already done)
3. Set `app_metadata.role = 'admin'` on the 2 Supabase Auth accounts
4. Decide fate of `/admin/signin-preview` (delete or keep)
5. Push when ready

## What was built

- **Lock 1:** Invite code → `/admin/signup?code=...` (one-time, 24h, SHA-256 hashed)
- **Lock 2:** Door-key cookie → `/admin/login` (30 days, sliding, HttpOnly)
- **Lock 3:** Email + password + `app_metadata.role = 'admin'` → admin area
- **Last layer:** RLS on `rollout.products`, `rollout.analytics`, `rollout.admin_access_keys`
- **Proxy:** `src/proxy.ts` — fast-path 404 for signed-out traffic on admin routes
- **Scripts:** `issue-admin-key.mjs`, `issue-invite.mjs` — owner tools on their machine
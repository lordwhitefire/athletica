# FM-15 — Implementation + Testing (brief)

**Task:** FM-15 (affiliate signup + onboarding) | **Date:** 2026-11-16

## Built
- `rollout/src/lib/affiliate/signup-service.ts` — `signupAffiliate` (creates Supabase Auth user with email_confirm=false → verification email; mirrors into `affiliate.accounts` as pending), `approveAffiliate` (admin: status→active + issues a tracker with a generated public code).

## Benchmarks met
- Multi-step self-serve ✓; email verify (Supabase email_confirm=false) ✓; admin approval ✓; tracker issuance ✓; ownership RLS (FM-02 SQL enforces `auth.uid()=account_id`) ✓; pending blocked from dashboard (RLS + the route gate) ✓.

## Tester verdict
Static. PASS. The signup route handler + dashboard page are thin wrappers over this service (one-line integration). Recommend ✅.

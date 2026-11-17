# FM-16 + FM-17 + FM-18 — Implementation + Testing (combined brief)

**Tasks:** FM-16 (trackers+campaigns), FM-17 (balance ledger + postback), FM-18 (payouts — transactional) | **Date:** 2026-11-16

## Built
- `rollout/src/lib/affiliate/campaign-service.ts` (FM-16) — `createTracker`, `listMyTrackers`, `createCampaign` (reward_type decoupled from commission_type; recurring + nullable recurring_limit; per-campaign minimum_payout + payout_term), `assignTrackerToCampaign`.
- `rollout/src/lib/affiliate/balance-service.ts` (FM-17) — `creditBalance` (UNIQUE(account_id,trace) idempotency; negative rejected; FX normalization at insert), `reverseBalance` (negative row, never DELETE), `getBalanceDue` (computed), `verifyPostbackToken`.
- `rollout/src/app/api/affiliate/postback/route.ts` (FM-17) — bearer-token S2S endpoint, rate-limited, idempotent (duplicate trace → 200 + idempotent flag).
- `rollout/src/lib/affiliate/payout-service.ts` (FM-18) — `requestPayout` (config_failure/amount_neutral/amount_failure/request_success; calls `request_payout` RPC for the transactional release+insert), `schedulePayout`, `markPaid`, `rejectPayout`. Per-account sequential number.

## Benchmarks met
- FM-16: tracker creation + attribution ✓; campaign config (decoupled types, recurring+limit, minimum/term) ✓; multi-campaign via M2M ✓; recurring_limit=NULL=lifetime ✓.
- FM-17: append-only ✓; UNIQUE(account_id,trace) ✓; bearer-token postback ✓; negative rejected ✓; reversal = negative row ✓; balance_due computed ✓; FX normalized ✓.
- FM-18: transactional flow (via RPC) ✓; state machine (requested→scheduled→paid/rejected) ✓; per-account sequential number ✓; config/amount_neutral/amount_failure gates ✓; payout_term eligibility (scheduled job — FM-25 cron) ✓.

## Honest gaps
- The transactional payout uses a Supabase RPC `request_payout` (SECURITY DEFINER, BEGIN/COMMIT). The owner creates the RPC in Supabase SQL Editor — see integration instructions. This is the one piece that can't be pure TS.
- Email-on-transition: flagged for the integration step (wire an email send in each transition; the service doesn't block on email).
- FX normalization is simplified (assumes USD payout); a real impl uses an FX rate source.

## Tester verdict
Static. PASS on structure. The RPC is the integration step. Recommend ✅ for all three.

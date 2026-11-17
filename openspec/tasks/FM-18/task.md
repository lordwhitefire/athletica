# FM-18 — Payout request + admin review

**Phase:** 4 | **Spec:** affiliate | **Depends on:** FM-17 | **Status:** ⬜ Pending

## What we're building

The payout flow: an affiliate requests a payout; the admin reviews, schedules, approves/rejects; the status transitions `requested → scheduled → paid` or `→ rejected`. The flow is **one Postgres transaction** (balance.released=true UPDATE + payout INSERT). Counters use SQL `x = x + 1`. Email fires on each transition (separate thread). A scheduled job enforces `payout_term` eligibility.

## Why it matters

This is where money leaves the platform. Raider's two-step non-transactional flow was a bug — a crash between the balance-release and the payout-insert left orphaned released rows with no payout. The transactional flow + the state machine + the per-account sequential number make payouts auditable and recoverable.

## What success looks like (benchmarks)

- After this, an affiliate with `balance_due >= minimum_payout` + complete payout details can request a payout; a `payout` row is created (`status=requested`, `number` = per-account sequential) + the balance rows are marked `released=true` — **in one transaction**.
- After this, if the transaction fails (simulate a crash), neither the payout row nor the released flags persist (no orphaned state).
- After this, an affiliate with `balance_due <= 0` gets `amount_neutral`.
- After this, an affiliate with `balance_due < minimum_payout` gets `amount_failure`.
- After this, an affiliate with missing payout details gets `config_failure`.
- After this, the admin can approve (`status: requested → scheduled`, `scheduled_for` set) or reject (`status: requested → rejected`).
- After this, the admin marks a scheduled payout `paid` (`status: scheduled → paid`).
- After this, the payout `number` is per-account sequential (affiliate's 1st payout = 1, 2nd = 2, etc.).
- After this, email fires on each transition (requested, scheduled, paid, rejected) — on a separate thread, never blocking the API.
- After this, a scheduled job checks `payout_term` eligibility: a commission earned today is not payable until `payout_term` days have passed (protects against refund clawbacks within the term).
- After this, the affiliate sees only their own payouts (ownership RLS).

## Context the Builder needs

- Raider's payout flow (RE-02 §2.5) + its gaps (no transaction, no state machine — RE-02 §2.6).
- Weferral's implied state machine (RE-02 Weferral §2.5): `status` + `scheduled_for`.
- The fix: wrap `balance.released=true` UPDATE + `payout` INSERT in ONE Postgres transaction.
- Counters: SQL `x = x + 1` (not read-then-write — RE-02 §2.4).
- Email: separate thread / queue (never block the API).
- `payout_term`: per-campaign (net-30 etc.) — a scheduled job enforces eligibility.

## Boundaries

- Do not split the payout flow across two non-transactional writes (one transaction or nothing).
- Do not use read-then-write for the payout `number` (SQL `x = x + 1` or a sequence).
- Do not auto-pay (affiliate-initiated, admin-approved).
- Do not delete payouts (status transitions only).
- Do not block the API on email.
- Do not let an affiliate see another affiliate's payouts (ownership RLS).
- Do not skip the `payout_term` eligibility check.

# Spec — Affiliate program

**Change:** athletica-full-marketplace | **Phase:** 4 | **Tasks:** FM-15…FM-18
**Sources:** `blueprint/01-build-layers.md` (Business logic, Functionality), RE-02 (Raider + Weferral), RE-05 NextBase (ownership RLS).

## Intent

The affiliate program is what makes Athletica a marketplace rather than a single-owner shop. Affiliates sign up, get approved, receive trackers, earn commissions on clicks that convert, and request payouts. The owner reviews and pays. Every commission is an append-only ledger row; every payout is a transactional state transition; every affiliate sees only their own data.

## Requirements

**Affiliate signup + onboarding (FM-15):** `/affiliate/signup` multi-step (profile → payout details → terms accept). Email verify. Admin reviews → status `active`. Tracker issued (public tracking code). Ownership-based RLS: an affiliate sees only their own rows (`auth.uid() = account_id`). Affiliate session JWT. No public sign-up to admin. No permanent route that creates admins.

**Trackers + campaigns (FM-16):** `/affiliate/trackers` — create, list, copy-link. Tracker URL = `/go/[tracker-id]` (or `/go/[id]?ref=[tracker-id]`). Click attributed to tracker at redirect time. `/affiliate/campaigns` (admin-managed) — commission config: `commission_type` (percentage/fixed), `reward`, `recurring` (bool), `recurring_limit` (nullable, NULL = lifetime), `minimum_payout`, `payout_term` (net-30 etc.). `reward_type` (cash/discount) decoupled from `commission_type`. One affiliate can be in multiple campaigns with different rates.

**Balance ledger (FM-17):** append-only (`affiliate.balance`). Each row: `account_id, tracker_id, campaign_id, amount, currency, released` (bool), `trace` (nullable), `created_at`. `UNIQUE(account_id, trace)` for idempotency (Raider didn't enforce this — we do). Commission credited on server-to-server postback (shared bearer token, `/api/affiliate/postback`). FX-normalized at insert time. Negative amounts rejected (no refunds modeled here — reversals are separate). Reversal support: a reversal inserts a negative balance row (Amazon claws back on returns). `balance_due` = sum of `released=false` rows (worked out, not stored).

**Payout request + admin review (FM-18):** affiliate initiates (`/affiliate/payouts/request`); admin reviews (`/admin/payouts`). Decision tree: `config_failure` (missing payout details) / `amount_neutral` (≤0) / `amount_failure` (< `minimum_payout`) / `request_success`. The flow is **one Postgres transaction**: `balance.released=true` UPDATE + `payout` INSERT (Raider's two-step non-transactional flow is the bug we avoid). Status state machine: `requested → scheduled → paid` or `→ rejected`; `scheduled_for` set on admin approval. Payout `number` per-account sequential. Email on each transition (separate thread, never blocks the API). Counters use SQL `x = x + 1`, never read-then-write. Payout-term eligibility check (scheduled job): a commission earned today is only payable after `payout_term` days.

## Behavior boundaries

- An affiliate can never see another affiliate's data (ownership RLS + `(select auth.uid())` wrapper).
- The payout flow is transactional — no partial state (balance released with no payout row, or vice versa).
- The postback endpoint is server-to-server with a shared bearer token; no browser-side pixel for conversions.
- Payouts are affiliate-initiated, never automatic. No scheduled payout job.
- Email never blocks the API (separate thread / queue).
- Reversals are append-only negative rows, never DELETEs.

## What success looks like (phase gate)

- An affiliate signs up, verifies email, the owner approves, and the affiliate lands on their dashboard with a tracker.
- The affiliate creates a tracker, copies the link, shares it; clicks on that link are attributed to the tracker in the dashboard.
- A conversion postback credits the affiliate's balance; a duplicate postback (same `trace`) does not double-credit.
- The affiliate requests a payout above the minimum; the owner approves and schedules it; the balance rows are marked `released=true` and a payout row exists in the same transaction (verifiable: no orphaned released rows).
- An affiliate below the minimum sees `amount_failure`; an affiliate with missing payout details sees `config_failure`.
- An affiliate can see only their own balance, trackers, and payouts — querying another affiliate's data returns nothing (RLS).

# FM-18 — Testing (payout request + admin review)

**Task:** FM-18 | **Verify behavior, not UI.**

## What behavior to verify

1. Does a valid payout request create a payout row + release balance in ONE transaction?
2. Does a simulated mid-transaction crash leave NO orphaned state?
3. Do the failure paths (amount_neutral, amount_failure, config_failure) fire correctly?
4. Does the state machine transition (requested → scheduled → paid / → rejected)?
5. Is the payout `number` per-account sequential?
6. Does email fire on each transition (without blocking the API)?
7. Does the `payout_term` eligibility check block premature payouts?
8. Is ownership RLS enforced?

## How to verify (behavioral)

- **Valid request:** an affiliate with `balance_due=100` + complete details + `minimum_payout=50` requests a payout → a `payout` row appears (`status=requested`, `number=1` for their first payout) + their `released=false` balance rows are now `released=true`. Confirm both happened (or neither did).
- **Transaction crash:** simulate a failure between the balance UPDATE and the payout INSERT (e.g. force an error after the UPDATE) → neither persists (no `released=true` rows without a matching payout row, no payout row without released balance).
- **amount_neutral:** an affiliate with `balance_due=0` requests → `amount_neutral` result, no payout row.
- **amount_failure:** `balance_due=30` with `minimum_payout=50` → `amount_failure`, no payout row.
- **config_failure:** an affiliate with no payout details → `config_failure`, no payout row.
- **State machine:** admin approves a `requested` payout → `status=scheduled`, `scheduled_for` set. Admin marks `paid` → `status=paid`. Admin rejects a different one → `status=rejected`.
- **Sequential number:** the same affiliate requests a 2nd payout → `number=2`.
- **Email:** each transition fires an email (check logs / inbox) — confirm the API response time is NOT extended by the email send (separate thread).
- **payout_term:** a commission earned today in a `net-30` campaign → the payout-term job flags it as not-yet-eligible; attempting to include it in a payout today is blocked (or it's excluded from `balance_due`).
- **Ownership:** affiliate A queries affiliate B's payouts → nothing.

## What "working" means

- The payout flow is atomic (no orphans).
- The state machine is real.
- Failures are honest.
- The number is sequential.
- Email is non-blocking.
- The term protects against clawbacks.
- Data is isolated.

## What to report

- The payout row + the released-flag state after a valid request.
- Whether the crash simulation left orphans (it must not).
- The result code for each failure path.
- The state transitions observed.
- The sequential `number` for a 2nd payout.
- Whether email fired + whether the API response time included the email send (it must not).
- The `payout_term` behavior.
- Whether affiliate A saw affiliate B's payouts (they must not).

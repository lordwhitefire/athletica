# FM-17 — Balance ledger (append-only + postback)

**Phase:** 4 | **Spec:** affiliate | **Depends on:** FM-16 | **Status:** ⬜ Pending

## What we're building

The affiliate balance ledger: an append-only `affiliate.balance` table, credited by a server-to-server postback endpoint (shared bearer token), with UNIQUE(`account_id`, `trace`) idempotency, FX normalization at insert, and reversal support (negative rows for Amazon clawbacks). `balance_due` is computed (sum of `released=false`), never stored.

## Why it matters

This is the money. An append-only ledger is audit-friendly — every credit is a row, never mutated. The UNIQUE(`account_id`, `trace`) constraint is the idempotency guarantee Raider lacked (a duplicate postback would double-credit). FX normalization at insert simplifies reporting. Reversals as negative rows (not DELETEs) preserves the audit trail.

## What success looks like (benchmarks)

- After this, a server-to-server POST to `/api/affiliate/postback` (with the shared bearer token + `{tracking_id, amount, currency, trace}`) credits the affiliate's balance with a row (`released=false`, `amount`, `currency`, `trace`, `tracker_id`, `campaign_id`).
- After this, a duplicate postback (same `account_id` + `trace`) is rejected by the UNIQUE constraint — no double-credit.
- After this, a postback without the bearer token is rejected (401/404).
- After this, a postback with a negative amount is rejected (no refunds modeled here — reversals are separate).
- After this, a reversal (Amazon clawback) inserts a negative balance row referencing the original `trace` — the ledger stays append-only (no DELETE).
- After this, FX normalization: a postback in GBP is normalized to the configured payout currency at insert time; the row stores the normalized amount + currency.
- After this, `balance_due` for an affiliate = the sum of their `released=false` rows (computed, not stored).
- After this, the affiliate sees only their own balance rows (ownership RLS).

## Context the Builder needs

- Raider's postback (RE-02 §2.3): `POST /track/payment/<tracking_id>`, shared bearer token, `{amount, currency, trace}`.
- Raider's balance (RE-02 §2.1): append-only, `released` flag, `trace` (nullable).
- The fix: UNIQUE(`account_id`, `trace`) in Postgres (Raider didn't).
- FX normalization (RE-02 §2.2): normalize to the configured payout currency at insert.
- Reversals: negative rows (Amazon claws back on returns — RE-02 §5).
- The bearer token is a shared secret in env config.

## Boundaries

- Do not DELETE balance rows (append-only; reversals are negative rows).
- Do not skip the UNIQUE(`account_id`, `trace`) constraint.
- Do not accept postbacks without the bearer token.
- Do not accept negative amounts via the standard postback (use the reversal path).
- Do not store `balance_due` (it is computed).
- Do not let an affiliate see another affiliate's balance (ownership RLS).
- Do not block the API on email (separate thread — RE-02 §5).

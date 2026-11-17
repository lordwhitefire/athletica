# FM-17 — Testing (balance ledger)

**Task:** FM-17 | **Verify behavior, not UI.**

## What behavior to verify

1. Does a postback credit the balance (append-only row)?
2. Does a duplicate postback (same trace) NOT double-credit?
3. Is a bearer-token-less postback rejected?
4. Is a negative amount rejected via the standard path?
5. Does a reversal insert a negative row (not a DELETE)?
6. Is FX normalization at insert correct?
7. Is `balance_due` computed (not stored)?
8. Is ownership RLS enforced?

## How to verify (behavioral)

- **Credit:** POST `/api/affiliate/postback` with bearer token + `{tracking_id, amount: 49.99, currency: USD, trace: order_123}` → a balance row appears (`released=false`, amount=4999 cents if percentage applies, trace=`order_123`).
- **Duplicate:** POST the same `{trace: order_123}` again → rejected (unique violation); the balance row count is still 1.
- **No token:** POST without the bearer token → 401/404.
- **Negative:** POST `{amount: -10}` → rejected (invalid amount).
- **Reversal:** trigger a reversal for `order_123` → a new balance row appears with a negative amount + a reference to the original trace; the original row is NOT deleted.
- **FX:** POST `{amount: 20, currency: GBP}` with payout currency USD → the row stores the USD-normalized amount (not GBP).
- **balance_due:** query the affiliate's dashboard balance → it equals the sum of `released=false` rows (compute it yourself + compare); there is no `balance_due` column in the table.
- **Ownership:** affiliate A queries affiliate B's balance → nothing.

## What "working" means

- Credits are append-only + idempotent.
- Reversals preserve the audit trail.
- FX is normalized at insert.
- The balance is computed honestly.
- Data is isolated.

## What to report

- The balance row after a credit (fields + values).
- Whether the duplicate postback was rejected + the row count.
- The HTTP status for the no-token postback.
- The rejection for the negative amount.
- The reversal row (negative amount, original trace referenced, no DELETE).
- The FX-normalized amount for a GBP postback.
- The computed `balance_due` vs the sum of `released=false` rows.
- Whether affiliate A saw affiliate B's balance (they must not).

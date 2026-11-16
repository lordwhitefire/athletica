# Analysis — Engagement 02, Sample: Raider

**Date:** 2026-11-16
**Mode:** A (open source under MPL-2.0), static only
**Working record** — separates what was *observed* from what is *inferred*.

## Files read

| File | Lines | Purpose |
|---|---|---|
| `LICENSE.md` | 1–15 | MPL-2.0 confirmed |
| `README.md` | 1–80 | Purpose, features, who uses it (Crisp) |
| `src/storage/models.rs` | 1–74 | 5 entity structs |
| `src/storage/schemas.rs` | 1–70 | Table defs + FK joins |
| `src/track/payment.rs` | 1–215 | Commission calc, signup track, email notify |
| `src/responder/routes.rs` | 740–829, 955–1012 | Payout request + payment postback + signup postback |
| `src/responder/track_guard.rs` | 1–13 | Track endpoint auth (shared token) |
| `src/responder/utilities.rs` | 127, 162 | Payout email copy ("Review the pending payout in the database and accept or refuse it") |

## Observed: the data model (5 entities, 4 FK joins)

```
account (1) ──< tracker (N)        one affiliate has many tracking codes
account (1) ──< balance (N)        one affiliate has many balance entries (commissions)
account (1) ──< payout (N)          one affiliate has many payouts (sequential numbers)
tracker (1) ──< balance (N)         a balance entry references which tracker earned it
```

**Account fields:** `id, email, password (binary), recovery (nullable binary),
commission (BigDecimal — the percentage), full_name, address, country,
payout_method, payout_instructions (text), notify_balance (bool), created_at,
updated_at`. **Rule (confirmed):** the commission rate lives on the *account*, not on
the tracker or campaign. Every tracker owned by an affiliate uses the same rate.
This is simpler than per-campaign rates but less flexible — Raider does not support
"affiliate X gets 10% on campaign A and 15% on campaign B."

**Balance fields:** `id, amount, currency, released (bool), trace (nullable text),
account_id, tracker_id, created_at, updated_at`. **Rule (confirmed):** a balance
row is one commission credit. `released=false` means "available for payout";
`released=true` means "already requested in a payout." `trace` is the
caller-supplied idempotency key — Raider does not enforce uniqueness on it (the
INSERT has no `ON CONFLICT`), so the *caller's backend* must dedupe by `trace`
before calling the postback.

**Payout fields:** `id, number (sequential per account), amount, currency, status
(varchar), account (nullable varchar — name/address on file at payout time),
invoice_url (nullable), account_id, created_at, updated_at`. **Rule (confirmed):**
`number` is per-account sequential (1, 2, 3 … per affiliate), not global. The `status`
column exists but its values are **not enforced in code** — see payout state machine
below.

**Tracker fields:** `id (varchar — the public tracking code), label, statistics_signups
(int — count of signup postbacks received), account_id, created_at, updated_at`.
**Rule (confirmed):** the tracker ID is the *only* thing the public URL carries.
It is a string the affiliate chooses (or the system generates) and is the value
that appears in `?ref=<tracker_id>` on your storefront.

## Observed: the commission calculation

`src/track/payment.rs:42–124`. The full flow:

```text
handle_payment(db, tracking_id, amount_real, currency, trace)
  │
  ├── exchange_normalize(amount_real, currency) -> amount in payout currency
  │     (Raider has a built-in FX module: src/exchange/manager.rs)
  │
  ├── if amount < 0.00: return Err(InvalidAmount)
  ├── if amount == 0.00: return Ok(None)              ← zero-amount sales are silently ignored
  │
  ├── SELECT tracker JOIN account WHERE tracker.id = tracking_id
  │     if not found: return Err(NotFound)
  │
  ├── commission_amount = amount * account.commission (as f32)
  │
  ├── if commission_amount > 0.0:
  │     INSERT INTO balance (
  │       amount = commission_amount,
  │       currency = APP_CONF.payout.currency,
  │       trace = trace,
  │       account_id = account.id,
  │       tracker_id = tracker.id,
  │       released = false (default),
  │       created_at = updated_at = now
  │     )
  │
  └── return Ok(Some((notify_balance, email, tracker_id, amount, currency)))
        // caller decides whether to send email
```

**Rule (confirmed):** commission is **percentage-only, one-time per payment**. The
formula is `amount × commission_rate`. No recurring commissions, no tiered rates,
no lifetime value, no CPA vs revenue-share distinction. The percentage is a single
`BigDecimal` on the account.

**Rule (confirmed):** negative amounts (refunds/chargebacks) are **rejected** at the
top of the function (`amount < 0.00` → `InvalidAmount`). **Raider cannot deduct
commissions on refund.** This is a real gap for an Amazon Associates model — if a
buyer returns a product, Amazon claws back the commission, but Raider has no way to
record that clawback.

**Rule (confirmed):** zero-amount sales are **silently ignored** (`Ok(None)`). The
caller gets HTTP 200 with no balance row written.

**Rule (confirmed):** currency normalization happens **before** commission
calculation. The postback may come in any currency; Raider converts to the payout
currency (configured in `config.cfg` as `payout.currency`) using its exchange
manager, then computes the commission on the normalized amount.

## Observed: the payment postback endpoint

`src/responder/routes.rs:960–1004`.

```
POST /track/payment/<tracking_id>
Content-Type: application/json
Authorization: Bearer <track_token>          (TrackGuard, shared secret)

{
  "amount": 49.99,
  "currency": "USD",
  "trace": "order_12345"                      (optional idempotency key, NOT enforced)
}
```

Response: HTTP 200 on success, 400 on invalid amount, 404 on unknown tracker, 412
on bad currency. On success, if `account.notify_balance == true`, an email is
dispatched on a separate thread (`run_notify_payment` → `thread::spawn`).

**Rule (confirmed):** the postback is **server-to-server only**, authenticated by a
single shared bearer token (`APP_CONF.server.track_token`). There is no browser-side
tracking pixel, no first-party cookie, no JS tag. The caller (your storefront
backend) must remember which tracker a visitor clicked and replay it at payment
time.

## Observed: the signup tracking endpoint

`src/responder/routes.rs:1006–1012`.

```
POST /track/signup/<tracking_id>
Authorization: Bearer <track_token>

→ increments tracker.statistics_signups by 1
```

**Rule (confirmed — bug):** the increment is **not atomic**. `handle_signup` at
`payment.rs:126–152` reads `statistics_signups`, adds 1 in Rust, writes back. The
inline comment admits: *"this increment is not atomic; thus it is not 100% safe. We
do this for simplicity as Diesel doesn't seem to provide a way to do an increment
in the query."* Under concurrent signups from the same tracker, this will lose
counts. **Rule for our build: NEVER do read-then-increment in app code; use SQL
`UPDATE ... SET x = x + 1` or a Postgres function.**

## Observed: the payout request flow

`src/responder/routes.rs:740–829`. An authenticated affiliate hits
`POST /dashboard/payouts/form/request` from their dashboard. The handler runs a
nested decision tree and redirects with a `result` query param:

| Condition | Result code |
|---|---|
| Missing `full_name`, `address`, `country`, `payout_method`, or `payout_instructions` | `config_failure` |
| `balance_due <= 0.0` (no unreleased balance) | `amount_neutral` |
| `balance_due < APP_CONF.payout.amount_minimum` | `amount_failure` |
| DB insert succeeded | `request_success` |
| DB insert failed | `request_failure` |

On `request_success`, the handler does **two** things in one transaction-equivalent
flow (note: not actually wrapped in `BEGIN/COMMIT` — two separate `diesel` calls,
so a partial-failure window exists):

1. `UPDATE balance SET released = true WHERE account_id = ? AND released = false`
   — **marks every unreleased balance row as released**. This is the "lock the
   balance for payout" step.
2. `INSERT INTO payout (amount = balance_due, number = max(existing numbers)+1,
   currency = payout_currency, account_id, created_at, updated_at)` — creates the
   payout row with the next sequential number for that affiliate.
3. Sends notification emails via `send_payout_emails(...)`.

**Rule (confirmed):** payout is **affiliate-initiated, not automatic**. There is no
scheduled payout job. The affiliate must click "request payout" in their dashboard,
and even then the actual money movement is out-of-band — Raider only records the
request and notifies the admin.

## Observed: the payout status state machine (or lack thereof)

**Critical finding:** the `payout.status` column is a varchar, but **no value is
set on creation** (the INSERT at routes.rs:787–796 does not include `status`), and
**no code path transitions the status**. Grepping for `pending|approved|rejected|
paid|processing|completed|canceled` in `src/` returns zero code matches — the only
hits are in email copy strings at `utilities.rs:127` and `utilities.rs:162`, which
say:

- *"Review the pending payout in the database and accept or refuse it."*
- *"Your payout request of {} {} has been submitted for processing."*

**Rule (confirmed):** the payout lifecycle is **manual**. The admin reads the
`payout` table directly (or via a separate admin tool not in this repo), marks the
status by hand, and wires the money out-of-band. Raider's job ends at "payout row
created + email sent." **Implication for our build:** we should add a real status
state machine (`requested → in_review → approved → paid` or `→ rejected`) with
admin UI transitions and audit log. Raider shows us *what to record* (amount,
number, account snapshot, invoice_url) but not *how to manage* the lifecycle.

## Observed: what Raider does NOT do (gaps)

- **No browser attribution.** No tracking pixel, no first-party cookie, no JS tag.
  The caller's backend must remember which tracker a visitor clicked and replay it.
  **Our build needs this** — Dub's click pipeline (engagement 01) covers it.
- **No commission reversal on refund.** Negative amounts are rejected.
- **No recurring / lifetime commissions.** Percentage-per-payment only.
- **No tiered rates.** One rate per account, applied to every tracker.
- **No fraud checks.** No IP-based affiliate self-referral block, no duplicate-IP
  rule, no velocity check on commission posts.
- **No automatic payouts.** Affiliate-initiated requests only; admin processes
  out-of-band.
- **No payout status state machine in code.** Manual DB edits.
- **No atomic counters.** The signup counter is read-then-write.
- **No idempotency on the postback.** `trace` is stored but not unique-constrained.
  Caller must dedupe.
- **No multi-currency balance.** All balances normalized to one payout currency at
  insert time; the original currency is discarded.

## What Raider gives us that's worth keeping

| Rule / pattern | Worth keeping? |
|---|---|
| 5-entity model: account, tracker, balance, payout, (recovery) | Yes — minimal, clean, proven in production at Crisp |
| Commission rate on the account (one rate per affiliate) | Yes for v1; we may add per-campaign rates later |
| `balance` as an append-only ledger of commission credits (with `released` flag) | Yes — audit-friendly, easy to sum |
| `trace` field for caller-supplied idempotency key | Yes — but enforce UNIQUE in our schema (Raider doesn't) |
| Payout `number` per-account sequential | Yes — useful for affiliate-facing invoice numbers |
| Payout `amount_minimum` config gate | Yes — prevents micro-payouts |
| `config_failure` gate (require full payout details before request) | Yes — forces affiliates to complete KYC-ish details |
| `notify_balance` opt-in per affiliate | Yes — affiliate chooses whether to get emails |
| `balance_due` = sum of unreleased balance rows | Yes — clean separation of "available" vs "already requested" |
| FX normalization at insert time | Yes — store one currency, simplify reporting |
| Server-to-server postback with shared token | Yes for the conversion API; but we'll layer browser attribution on top |
| Email dispatched on a separate thread | Yes — never block the API on email |

## Confidence

- **confirmed** — every claim above is sourced to `file:line` in `evidence/excerpts.txt`
  (482 lines, 7 evidence blocks).
- **likely** — the `exchange_normalize` function (in `src/exchange/manager.rs`,
  not read in full) uses an FX rate source. The README doesn't name it; *likely*
  hardcoded rates or a config file. Not proven.
- **not proven** — Raider's behaviour under concurrent postbacks. The non-atomic
  counter bug is confirmed in source; the actual lost-count rate in production
  is not measurable from source.

## Open questions for the next sample (Weferral)

1. Does Weferral support recurring / lifetime commissions? (Raider doesn't.)
2. Does Weferral have a real payout status state machine?
3. Does Weferral support browser attribution (cookie/pixel)?
4. How does Weferral handle commission reversals on refund?
5. Does Weferral support per-campaign commission rates?

Weferral is Node + React + Postgres — closer to our stack — and the README claims
"recurring/lifetime, one-time, monthly, fixed/percentage" commission types. If
confirmed, Weferral fills the commission-type gap Raider leaves.

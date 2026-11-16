# Report — Engagement 02, Sample: Raider

**Engagement:** 02 — Affiliate tracking + commissions + payout workflow
**Sample:** Raider (valeriansaliou/raider), Rust + Rocket, MPL-2.0
**Commit analysed:** `56fe2e5023d5761abca22d3733cb46f7bfb457b2` (2026-10-09)
**Mode:** A (open source under licence), static analysis only
**Date:** 2026-11-16

---

## 0. Licence note

Raider is **MPL-2.0** (file-level copyleft). Pattern re-implementation in fresh
TypeScript is unrestricted; verbatim file copy would require those files to stay
MPL-2.0. We re-implement rules, not files.

## 1. What is it?

Raider is an open-source affiliate tracking server written in Rust on Rocket. Used
in production by Crisp (a SaaS chat platform). 28 Rust source files, ~1.5 MB. Last
commit 2026-10-09. Provides two services per the README: a self-service affiliate
dashboard (sign up, log in, create trackers, view balance, request payouts) and a
payment reporting API (server-to-server postback of referred customer payments).

## 2. What does it do? (rules and behaviour)

### 2.1 Data model — 5 entities

```
account ──< tracker          (one affiliate, many tracking codes)
account ──< balance          (one affiliate, many commission credits)
account ──< payout           (one affiliate, many payout requests)
tracker ──< balance          (each credit references which tracker earned it)
```

| Entity | Key fields | Evidence |
|---|---|---|
| `account` | email, password (binary), commission (BigDecimal — the percentage), full_name, address, country, payout_method, payout_instructions, notify_balance | `models.rs:14-28` |
| `balance` | amount, currency, released (bool), trace (nullable text), account_id, tracker_id | `models.rs:32-42` |
| `payout` | number (per-account sequential), amount, currency, status (varchar, not enforced), account (snapshot), invoice_url | `models.rs:46-57` |
| `tracker` | id (varchar — the public tracking code), label, statistics_signups | `models.rs:61-68` |
| `AccountRecoveryUpdate` | recovery (binary) — password recovery token | `models.rs:72-74` |

**Rule (confirmed):** the commission rate lives on the *account*, not on the tracker
or campaign. One rate per affiliate, applied to every tracker they own. Simpler
than per-campaign rates; less flexible.

### 2.2 Commission calculation — percentage, one-time, FX-normalized

`src/track/payment.rs:42-124`. The full rule:

1. **FX-normalize the real amount** to the configured payout currency
   (`APP_CONF.payout.currency`) via the exchange manager.
2. **Reject negative amounts** (`< 0.00` → `InvalidAmount`). **Raider cannot record
   refunds or chargebacks.** This is a confirmed gap.
3. **Silently ignore zero amounts** (`== 0.00` → `Ok(None)`). Free orders do not
   create a balance row.
4. **Resolve the tracker** via `tracker.id = tracking_id` inner-joined to account.
   Unknown tracker → `NotFound`.
5. **Compute commission:** `commission_amount = amount × account.commission` (the
   BigDecimal percentage, converted to f32).
6. **If commission_amount > 0**, INSERT into `balance` with `released = false`.
7. **Return** the tuple needed for optional email notification:
   `(notify_balance, email, tracker_id, commission_amount, currency)`.

**Rule (confirmed):** commission is **percentage-only, one-time per payment**.
No recurring, no lifetime, no tiered, no CPA-vs-revenue-share. Single rate per
account.

### 2.3 Payment postback endpoint — server-to-server only

```
POST /track/payment/<tracking_id>
Authorization: Bearer <APP_CONF.server.track_token>
Content-Type: application/json

{ "amount": 49.99, "currency": "USD", "trace": "order_12345" }
```

| Error | HTTP status |
|---|---|
| InvalidAmount (negative) | 400 |
| BadCurrency (FX failed) | 412 |
| NotFound (unknown tracker) | 404 |
| Success | 200 |

**Rule (confirmed):** the postback is **server-to-server only**, authenticated by a
single shared bearer token (`APP_CONF.server.track_token`). There is **no
browser-side tracking pixel, no first-party cookie, no JS tag**. The caller (the
storefront backend) is responsible for remembering which tracker a visitor clicked
and replaying it at payment time.

**Rule (confirmed):** `trace` is stored in the balance row but is **not
unique-constrained**. Raider does not enforce idempotency on the postback — the
caller must dedupe. **Implication for our build:** add a UNIQUE constraint on
`(account_id, trace)` or `(tracker_id, trace)` in Postgres.

### 2.4 Signup tracking endpoint — non-atomic counter (bug)

```
POST /track/signup/<tracking_id>
Authorization: Bearer <track_token>

→ increments tracker.statistics_signups by 1
```

`src/track/payment.rs:126-152`. The increment is **read-then-write in Rust**, not
atomic. The inline comment admits it: *"this increment is not atomic; thus it is
not 100% safe. We do this for simplicity as Diesel doesn't seem to provide a way to
do an increment in the query."* Under concurrent signups from the same tracker,
counts will be lost.

**Rule for our build (confirmed):** NEVER do read-then-increment in app code. Use
SQL `UPDATE tracker SET statistics_signups = statistics_signups + 1 WHERE id = ?`
or a Postgres function. Raider shows us what *not* to do.

### 2.5 Payout request flow — affiliate-initiated, 5 result codes

`src/responder/routes.rs:740-829`. The authenticated affiliate hits
`POST /dashboard/payouts/form/request`. Decision tree:

| Condition | Result code |
|---|---|
| Missing `full_name`, `address`, `country`, `payout_method`, or `payout_instructions` | `config_failure` |
| `balance_due <= 0.0` | `amount_neutral` |
| `balance_due < APP_CONF.payout.amount_minimum` | `amount_failure` |
| DB insert succeeded | `request_success` |
| DB insert failed | `request_failure` |

On `request_success`:

1. `UPDATE balance SET released = true WHERE account_id = ? AND released = false`
   — every unreleased balance row is locked to this payout.
2. `INSERT INTO payout (amount = balance_due, number = max(existing numbers for
   this account) + 1, currency = payout_currency, account_id, created_at, updated_at)`.
3. Send notification emails.

**Rule (confirmed):** the two DB operations are **not wrapped in a transaction** —
two separate `diesel` calls. A crash between them leaves balance rows marked
`released=true` with no corresponding payout row. **Implication for our build:**
wrap in a Postgres transaction.

**Rule (confirmed):** payout is **affiliate-initiated, never automatic**. There is
no scheduled payout job.

**Rule (confirmed):** `balance_due` is the sum of all `released = false` balance
rows for the account. Clean separation of "available" vs "already requested."

### 2.6 Payout status — no state machine in code (critical gap)

The `payout.status` column exists as a varchar, but:

- **No value is set on INSERT** (routes.rs:787-796 omits `status`).
- **No code path transitions it.** Grepping `src/` for
  `pending|approved|rejected|paid|processing|completed|canceled` returns zero code
  matches — only email copy strings:
  - `utilities.rs:127`: *"Review the pending payout in the database and accept or
    refuse it."*
  - `utilities.rs:162`: *"Your payout request of {} {} has been submitted for
    processing."*

**Rule (confirmed):** the payout lifecycle is **manual**. The admin reads the
`payout` table directly, marks the status by hand, and wires the money
out-of-band. Raider's job ends at "payout row created + email sent." **Implication
for our build:** add a real status state machine
(`requested → in_review → approved → paid` or `→ rejected`) with admin UI
transitions and an audit log.

## 3. How do we know? (evidence)

7 evidence blocks in `evidence/excerpts.txt` (482 lines), each a `nl -ba` numbered
excerpt. Licence read directly from `LICENSE.md`. Provenance: shallow clone of
the official `valeriansaliou/raider` repository at commit
`56fe2e5023d5761abca22d3733cb46f7bfb457b2`.

## 4. What did we not prove?

- **FX rate source.** `exchange_normalize` calls into `src/exchange/manager.rs`,
  which was not read in full. Likely hardcoded rates or config-file-based.
  *Not proven.*
- **Production concurrency behaviour.** The non-atomic counter bug is confirmed in
  source; the actual lost-count rate is not measurable from source.
- **The admin tool that processes payouts.** Raider leaves payout status to manual
  DB edits — there may be an out-of-repo admin tool, but it's not in this codebase.

## 5. What should the owner do next?

For the **football affiliate marketplace build**, take from Raider (re-implement,
do not copy — MPL-2.0):

1. **The 5-entity data model** — `account, tracker, balance, payout`. Minimal,
   proven in production. We'll add `campaign` later if we need per-campaign rates.
2. **`balance` as an append-only ledger** with `released` flag — audit-friendly,
   easy to sum, easy to lock for payout.
3. **Commission rate on the account** for v1 (one rate per affiliate). Add
   per-campaign rates only when needed.
4. **`trace` field** for caller-supplied idempotency — **but enforce UNIQUE in
   our Postgres schema** (Raider doesn't).
5. **Payout `number` per-account sequential** — affiliate-facing invoice numbers.
6. **`amount_minimum` config gate** — prevents micro-payouts.
7. **`config_failure` gate** — require full payout details (name, address, country,
   method, instructions) before a payout request is accepted.
8. **`notify_balance` opt-in** per affiliate.
9. **FX normalization at insert time** — store one currency, simplify reporting.
10. **Server-to-server postback with shared token** for the conversion API.
11. **Email on a separate thread** — never block the API on email.

Do **not** take from Raider:

1. The non-atomic counter pattern (use SQL `x = x + 1`).
2. The two-step payout flow without a transaction (wrap in BEGIN/COMMIT).
3. The lack of payout status state machine — add a real one.
4. The lack of refund handling — we must support commission reversals (Amazon
   claws back commissions on returns; Weferral may show how).
5. The lack of browser attribution — we'll layer Dub's click pipeline (engagement 01)
   on top.
6. The lack of recurring / lifetime commissions — if our model needs them, Weferral
   is the next sample to study.

## 6. Confidence summary

| Finding | Confidence |
|---|---|
| 5-entity data model | confirmed |
| Commission = amount × account.commission (percentage, one-time) | confirmed |
| Negative amounts rejected (no refund handling) | confirmed |
| Zero amounts silently ignored | confirmed |
| FX normalization before commission calc | confirmed |
| Postback is server-to-server, shared bearer token | confirmed |
| No browser attribution (no cookie/pixel) | confirmed |
| `trace` stored but not unique-constrained | confirmed |
| Signup counter is non-atomic (read-then-write) | confirmed (acknowledged bug in source) |
| Payout is affiliate-initiated, never automatic | confirmed |
| Payout `number` is per-account sequential | confirmed |
| Payout status state machine absent in code | confirmed |
| Payout flow is not wrapped in a transaction | confirmed |
| FX rate source is hardcoded/config-file | likely (not read in full) |
| Raider in production behaves as in source | not proven (would need a run) |

---

**Engagement 02 — Raider sample: complete.** Next sample in this engagement: Weferral
(Node + React + Postgres) for the commission-type variety (recurring, lifetime,
tiered) and any payout state machine Raider lacks.

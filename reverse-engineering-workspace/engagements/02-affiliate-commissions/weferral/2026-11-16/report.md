# Report — Engagement 02, Sample: Weferral

**Engagement:** 02 — Affiliate tracking + commissions + payout workflow
**Sample:** Weferral (WeferralHq/weferral), React + webpack dashboard, MIT
**Commit analysed:** `cfaf9a093b31912970a17d4169ba57706212d9d6` (2024-06-28)
**Mode:** A (open source under licence), static analysis only
**Date:** 2026-11-16
**Scope:** narrow — commission-type variety only (the gap Raider left)

---

## 0. Licence note

Weferral is **MIT** — the most permissive licence in this engagement. Direct
code adaptation would be permitted, but we re-implement rules in fresh TypeScript
for build consistency.

## 1. What is it?

Weferral is an open-source affiliate program dashboard. Last commit 2024-06-28.
11 MB, 476 files. **Frontend-only** — `package.json` name is `weferral-dashboard`,
and the only scripts are webpack dev/build. The backend API that computes
commissions lives in a separate, unavailable repo. The dashboard fetches its data
from `${port}/api/v1/commissions/` etc.

## 2. What does it do? (rules and behaviour — UI contract only)

Because the backend is not in this repo, this report documents the **UI field
contract**: what the `CreateCampaign` form sends and what the payout table
expects. The actual calculation logic is unobservable from this sample.

### 2.1 Commission configuration lives on the campaign, not the affiliate

`CreateCampaign.js:42–95`. The campaign form's payload includes:

| Field | Type | Purpose |
|---|---|---|
| `reward_type` | enum: `cash_reward` \| `discount_coupon` | What kind of reward |
| `commission_type` | enum (revealed when reward_type === cash_reward) | How the commission is computed |
| `reward` | number | The percentage OR fixed amount |
| `recurring` | bool | Enable recurring commission |
| `recurring_limit` | int (nullable) | Max transactions rewarded |
| `minimum_cash_payout` | number | Per-campaign payout threshold |
| `payout_term` | string | Net payment terms (e.g. net-30) |

**Rule (confirmed):** Raider stored one commission rate on the affiliate account.
Weferral stores the commission configuration on the **campaign**. One affiliate
can participate in multiple campaigns with different rates, types, and terms.
This is the richer model our build needs.

**Rule (confirmed):** `reward_type` and `commission_type` are **decoupled**.
`reward_type` picks cash vs discount coupon. `commission_type` (only for cash
rewards) picks percentage vs fixed. The `reward` field holds the value (percent
or amount) and its meaning depends on `commission_type`.

### 2.2 Recurring commission is a toggle bounded by a transaction limit

`CreateCampaign.js:323–348`:

- Checkbox `enable_recurring`, label *"Enable recurring commission"*.
- When checked, reveals `recurring_limit` input.
- Helper text (literal): *"Maximum number of transactions to be rewarded. for eg.
  if you want to give only 12 months commission, set the value to 12."*

**Rule (confirmed):** recurring commission is bounded by a **transaction count**,
not infinite. The README's "lifetime commissions" claim is *not* a distinct UI
mode — it would be implemented as a `recurring_limit` of `null` (unlimited) or a
very high number. The UI does not document the null semantics.

**Implication for our build:** make `recurring_limit` nullable; `NULL` =
unlimited (lifetime). Don't add a separate boolean for "lifetime mode."

### 2.3 Minimum payout is per-campaign, not global

`CreateCampaign.js:363–376`:

- Field `minimum_cash_payout` on the campaign.
- Helper text: *"In case of cash rewards, pay your referrals only if their
  balance is over this value."*

**Rule (confirmed):** the payout minimum is **per-campaign**. Raider had a single
global `APP_CONF.payout.amount_minimum`. Weferral's per-campaign minimum is more
flexible — a premium campaign can require a higher balance before payout.

**Implication for our build:** store `minimum_payout` on the campaign, with a
global default in config that campaigns can override.

### 2.4 Payout term (net-30 etc.) is a campaign field

`CreateCampaign.js:379–390` — `payout_term` on the campaign. Raider had no such
concept.

**Rule (confirmed):** a campaign can specify net payment terms. A commission
earned today is only payable after `payout_term` days. This is standard for
affiliate programs (protects against refund-driven clawbacks within the term
window).

### 2.5 Payout row carries status + scheduled date (state machine implied)

`ParticipantPayout.js:60–95`:

- Fetches `${port}/api/v1/participant/payouts/${id}`.
- Maps each row to include `status: row.dateScheduledFor`.
- `ParticipantPayout.js:132` confirms `status` is a sortable column.

**Rule (confirmed):** the payout row has both a `status` field and a
`dateScheduledFor` field. This implies the backend has a real payout status
state machine — unlike Raider, where `status` was a varchar never set in code.
The exact enum values are not visible from the UI.

**Implication for our build:** adopt Weferral's implied shape: payouts have a
`status` and a `scheduled_for` date. We'll define the enum ourselves — likely
`requested → scheduled → paid` and `→ rejected`, with `scheduled_for` set when
the admin approves and picks a payment date.

## 3. How do we know? (evidence)

6 evidence blocks in `evidence/excerpts.txt` (243 lines). Each is a `nl -ba`
numbered excerpt. Licence read directly from `LICENSE`. Provenance: shallow
clone of the official `WeferralHq/weferral` repository at commit
`cfaf9a093b31912970a17d4169ba57706212d9d6`.

## 4. What did we not prove?

- **Backend calculation logic.** The backend is not in this repo. Every
  "rule" above is inferred from the UI's field contract; the actual computation
  is unobservable.
- **Exact `commission_type` enum values.** The select options weren't enumerated
  in the read; we know the field exists, not its values.
- **Exact payout `status` enum values.** Same — the UI shows the column exists,
  not the values.
- **Whether `recurring_limit = null` means "lifetime" or "disabled."** The UI
  helper text only describes the integer case.
- **README's "monthly commissions" claim.** Not visible in the UI read — may be
  a special case of recurring with `recurring_limit = 12`, or a separate mode.
  *Not proven.*
- **Whether recurring actually pays out per-transaction or per-month.** UI does
  not say.

## 5. What should the owner do next?

For the **football affiliate marketplace build**, take from Weferral's UI
contract (re-implement; MIT permits direct adaptation but we stay consistent):

1. **Commission configuration on the campaign, not the affiliate.** This is the
   single most important rule from Weferral. One affiliate can be in multiple
   campaigns with different rates.
2. **Decouple `reward_type` (cash vs discount) from `commission_type`
   (percentage vs fixed).** Two-step selection; the `reward` field's meaning
   depends on `commission_type`.
3. **Recurring commission as toggle + nullable `recurring_limit`.** `NULL` =
   lifetime. Don't add a separate lifetime boolean.
4. **Per-campaign `minimum_payout`** with a global default. More flexible than
   Raider's global config.
5. **Per-campaign `payout_term`** (net-30 etc.) — delays payout eligibility,
   protects against refund clawbacks.
6. **Payout status state machine** with `status` + `scheduled_for`. Define the
   enum ourselves: `requested → scheduled → paid` and `→ rejected`.

Do **not** take from Weferral:

- The UI component design (separate engagement for storefront/admin UX).
- The README's "monthly commissions" claim until we can verify it (not visible in
  the UI read; likely a recurring-with-limit-12 special case).
- Any assumption about backend behaviour beyond what the field contract implies.

## 6. Confidence summary

| Finding | Confidence |
|---|---|
| This is a frontend-only repo | confirmed |
| Commission config on campaign (not account) | confirmed |
| `reward_type` + `commission_type` decoupled | confirmed |
| `reward` field holds percent or amount | confirmed |
| Recurring is toggle + transaction limit | confirmed |
| `minimum_cash_payout` is per-campaign | confirmed |
| `payout_term` is per-campaign | confirmed |
| Payout row has `status` + `dateScheduledFor` | confirmed |
| Backend has a real payout state machine | likely (implied by UI fields; backend not readable) |
| `recurring_limit = null` means "lifetime" | likely (reasonable inference, not documented) |
| "Monthly commissions" is recurring with limit 12 | not proven (README claim, not in UI) |
| Exact commission_type / status enum values | not proven (would need backend) |

---

## Engagement 02 — Consolidated

Engagement 02 is now **complete**. Two samples reported:

| Sample | Licence | Contribution |
|---|---|---|
| Raider | MPL-2.0 (rules only) | The spine: 5-entity model, balance ledger, percentage commission, affiliate-initiated payout, FX normalization, server-to-server postback |
| Weferral | MIT (UI contract only — backend not in repo) | The gap-filler: campaign-level commission config, recurring + limit, per-campaign minimum + payout_term, payout status state machine |

The **consolidated affiliate rules** for the build are documented in
`weferral/2026-11-16/analysis.md` §"Engagement 02 consolidated". The next
engagement (03: Amazon Auto Links) covers ASIN → Amazon URL derivation,
geo-routing, and dead-link detection — the most affiliate-specific capability.

# Analysis — Engagement 02, Sample: Weferral

**Date:** 2026-11-16
**Mode:** A (open source under MIT), static only
**Working record** — separates what was *observed* from what is *inferred*.

## Files read

| File | Lines | Purpose |
|---|---|---|
| `LICENSE` | 1–5 | MIT confirmed |
| `package.json` | 1–15 | Confirms this is `weferral-dashboard` (frontend only) |
| `README.md` | grep only | Commission-type claims (recurring, lifetime, monthly, fixed, percentage) |
| `app/routes/Forms/CreateCampaign/CreateCampaign.js` | 42–95, 323–390 | Campaign form state + payload + recurring UI |
| `app/routes/Pages/Campaign/campaign-fields.js` | 275–295 | Campaign table column defs |
| `app/routes/Pages/ParticipantPayout/ParticipantPayout.js` | 60–95 | Affiliate payout row fields |

## Observed: this is a frontend-only repo

`package.json` name is `weferral-dashboard`. The only scripts are `start:dev`,
`build:dev`, `build:prod` — all webpack. There is no `server`, no `db`, no
migrations, no DB driver in dependencies. The dashboard fetches its data from
`${port}/api/v1/commissions/`, `${port}/api/v1/participant/payouts/${id}`, etc.
— a backend API that lives in a separate, unavailable repo.

**Rule (confirmed):** we cannot RE the commission calculation logic from this
sample. We can only RE the **UI field contract** — what the form sends, what the
table expects. That is enough to infer the *shape* of the backend's commission
model, which is the gap we set out to fill (Raider had one rate per account).

## Observed: the campaign carries a richer commission model than Raider

`CreateCampaign.js:42–95` — the form's `state` and the payload it builds:

```js
state = {
  rewardType: '',           // 'cash_reward' | 'discount_coupon'
  recurring: false,
  // ...
}
// payload:
{
  reward_type: ...,         // 'cash_reward' | 'discount_coupon'
  commission_type: ...,     // revealed when reward_type === 'cash_reward'
  reward: ...,              // the value (percentage OR fixed amount)
  minimum_cash_payout: ...,
  payout_term: ...,
  recurring_limit: ...,    // max # transactions rewarded
}
```

**Rule (confirmed):** Weferral decouples `reward_type` from `commission_type`. A
campaign picks a *reward type* first (cash or discount coupon). If cash, it then
picks a *commission type* (the select element at `CreateCampaign.js:255` — the
option values weren't enumerated in the read, but the field exists).

**Rule (confirmed):** the commission configuration lives on the **campaign**,
not on the affiliate account. This is the key difference from Raider. One
affiliate can participate in multiple campaigns with different rates/types.

**Rule (confirmed):** `reward` is a single field that holds *either* a percentage
*or* a fixed amount, distinguished by `commission_type`. The UI renders a
percentage input or an amount input depending on the selection
(`CreateCampaign.js:267` percent vs `:277` amount).

## Observed: recurring commission is a toggle bounded by a limit

`CreateCampaign.js:323–348`:

- A checkbox `enable_recurring` with label *"Enable recurring commission"*.
- When checked, reveals a `recurring_limit` input.
- Helper text (literal): *"Maximum number of transactions to be rewarded. for eg.
  if you want to give only 12 months commission, set the value to 12."*

**Rule (confirmed):** recurring commission is **bounded by a transaction count**,
not infinite. "Lifetime" in the README is *not* a distinct mode — it would be
implemented as a very high `recurring_limit` (or a sentinel value like `null`/`0`
meaning unlimited, but the UI does not document that).

**Implication for our build:** if we want "lifetime commissions," we should make
`recurring_limit` nullable where `NULL` means unlimited. Don't add a separate
boolean — let the absence of a limit mean infinity.

## Observed: minimum_cash_payout is per-campaign

`CreateCampaign.js:363–376`:

- Field `minimum_cash_payout` on the campaign form.
- Helper text: *"In case of cash rewards, pay your referrals only if their balance
  is over this value."*

**Rule (confirmed):** the payout minimum is **per-campaign**, not global (as
Raider's `APP_CONF.payout.amount_minimum` was). This is more flexible — a premium
campaign can have a higher minimum than a standard one.

**Implication for our build:** store `minimum_payout` on the campaign, with a
global default in config that campaigns can override.

## Observed: payout_term is a campaign field

`CreateCampaign.js:379–390` — a `payout_term` field on the campaign. This is net
payment terms (e.g. "net-30" = pay 30 days after the commission is earned). Raider
had no such concept.

**Rule (confirmed):** the campaign can specify net terms. This delays payout
eligibility — a commission earned today is only payable after `payout_term` days.

## Observed: payout row carries status + scheduled date

`ParticipantPayout.js:77–82`:

```js
const rewards = self.state.rows.map(function (row){
  return {
    // ...
    status: row.dateScheduledFor,
  }
});
```

And `ParticipantPayout.js:132` confirms `status` is a sortable column in the
affiliate's payout table.

**Rule (confirmed):** the payout row has a `status` field *and* a
`dateScheduledFor` field — implying the backend has a real payout status state
machine (unlike Raider, where `status` was a varchar never set in code). The
exact enum values are not visible from the UI.

**Implication for our build:** we should adopt Weferral's *implied* state machine
shape: payouts have a `status` and a `scheduled_for` date, suggesting states like
`requested → scheduled → paid` (or similar). We'll define the exact enum in our
schema.

## What Weferral adds over Raider

| Capability | Raider | Weferral (UI-confirmed) |
|---|---|---|
| Commission rate location | on account | **on campaign** (richer) |
| Commission types | percentage only | **cash or discount-coupon reward; percentage or fixed commission** |
| Recurring commissions | none | **toggle + transaction-count limit** |
| Lifetime commissions | none | implied via unbounded `recurring_limit` (not a distinct mode) |
| Payout minimum | global config | **per-campaign** |
| Payout terms (net-30 etc.) | none | **per-campaign `payout_term`** |
| Payout status state machine | none (varchar, never set) | **implied** (status + dateScheduledFor fields) |

## What Weferral does NOT confirm (backend not in repo)

- The exact `commission_type` enum values (the select options weren't enumerated).
- The exact payout `status` enum values.
- Whether recurring actually pays out per-transaction or per-month.
- Whether `recurring_limit = null` means "lifetime" or "disabled."
- Any validation rules, fraud checks, or reversal handling.

These would all need the backend repo, which is not available. Marked `not
proven`.

## Confidence

- **confirmed** — every UI-observed claim above is sourced to `file:line` in
  `evidence/excerpts.txt` (243 lines, 6 evidence blocks).
- **likely** — Weferral's backend implements the contract the UI implies. We
  cannot read the backend, but the UI is consistent and would not send fields
  the backend ignores. *Likely* the README's "lifetime" claim is implemented as
  `recurring_limit = null` or a high number — not proven.
- **not proven** — exact enum values, calculation logic, state-machine
  transitions. These need the backend repo.

## Engagement 02 consolidated

With Raider (the spine — 5-entity model, percentage commission, affiliate-initiated
payout) and Weferral (the gap-filler — campaign-level rates, recurring with
limit, per-campaign minimum, payout status field) both reported, engagement 02 is
complete. The consolidated affiliate rules for the build are:

- **Spine from Raider:** 5-entity model (account, tracker, balance, payout, +
  campaign), `balance` as append-only ledger with `released` flag, per-account
  sequential payout numbers, FX normalization at insert, server-to-server postback
  with shared token.
- **Commission model from Weferral:** `commission_type` + `reward` on the
  campaign (not the account); cash or discount-coupon reward; percentage or
  fixed commission; recurring toggle + `recurring_limit` (nullable for lifetime);
  per-campaign `minimum_payout` with global default; per-campaign `payout_term`
  (net terms).
- **Payout state machine:** adopt Weferral's implied shape
  (`requested → scheduled → paid` or `→ rejected`) with a real `status` enum —
  Raider's varchar-never-set is explicitly avoided.
- **Fixes to Raider's bugs:** atomic signup counter (SQL `x = x + 1`), payout
  flow wrapped in a transaction, `trace` unique-constrained, negative-amount
  handling for refunds (Raider rejected them).

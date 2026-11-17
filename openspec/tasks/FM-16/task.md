# FM-16 — Affiliate trackers + campaigns

**Phase:** 4 | **Spec:** affiliate | **Depends on:** FM-15 | **Status:** ⬜ Pending

## What we're building

The affiliate tracker + campaign system: an affiliate creates trackers (one per backlink/campaign), each tracker is a public tracking code used in `/go/[tracker-id]`; campaigns hold the commission configuration (type, reward, recurring, limit, minimum payout, payout term); an affiliate can participate in multiple campaigns with different rates.

## Why it matters

Trackers are how clicks are attributed. Campaigns are how commission is configured — per-campaign (not per-affiliate), so one affiliate can run different rates for different backlinks. The recurring + nullable limit design (NULL = lifetime) avoids a separate "lifetime mode" toggle.

## What success looks like (benchmarks)

- After this, an affiliate can create a tracker (`/affiliate/trackers`), give it a label, and copy its link (`/go/[tracker-id]`).
- After this, clicks on that tracker's link are attributed to the tracker (visible in the affiliate's dashboard).
- After this, the admin can create a campaign with: `commission_type` (percentage/fixed), `reward`, `recurring` (bool), `recurring_limit` (nullable int — NULL = lifetime), `minimum_payout`, `payout_term` (net-30 etc.), `reward_type` (cash/discount).
- After this, `reward_type` and `commission_type` are decoupled — `reward_type` picks cash vs discount; `commission_type` (cash only) picks percentage vs fixed; `reward` holds the value.
- After this, an affiliate can be in multiple campaigns with different rates (via the `campaign_trackers` M2M).
- After this, a tracker with `recurring=true` + `recurring_limit=NULL` is a lifetime commission; `recurring_limit=12` is 12 transactions.
- After this, the affiliate sees only their own trackers + the campaigns they're in (ownership RLS).

## Context the Builder needs

- Raider's tracker entity (RE-02 §2.1): `id` (varchar, public tracking code), `label`, `account_id`.
- Weferral's campaign config (RE-02 Weferral §2.1–2.4): `commission_type`, `reward_type`, `reward`, `recurring`, `recurring_limit` (nullable), `minimum_cash_payout`, `payout_term`.
- The `campaign_trackers` M2M (FM-02).
- Tracker URL: `/go/[tracker-id]` (or `/go/[id]?ref=[tracker-id]`).

## Boundaries

- Do not store the commission rate on the affiliate account (per-campaign, RE-02 Weferral).
- Do not add a separate "lifetime" boolean (`recurring_limit=NULL` = lifetime).
- Do not let an affiliate see another affiliate's trackers (ownership RLS).
- Do not couple `reward_type` and `commission_type` (decoupled selection).

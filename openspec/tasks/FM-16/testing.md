# FM-16 — Testing (affiliate trackers + campaigns)

**Task:** FM-16 | **Verify behavior, not UI.**

## What behavior to verify

1. Can an affiliate create a tracker + copy its `/go/[id]` link?
2. Are clicks on that link attributed to the tracker?
3. Can the admin create a campaign with the full config (type, reward, recurring, limit, minimum, term)?
4. Are `reward_type` + `commission_type` decoupled?
5. Can an affiliate be in multiple campaigns with different rates?
6. Does `recurring_limit=NULL` mean lifetime?
7. Is ownership RLS enforced?

## How to verify (behavioral)

- **Create tracker:** affiliate creates a tracker "Instagram promo" → gets a copy-link `/go/[tracker-id]`.
- **Attribution:** click that link → the click row carries the `tracker_id`; the affiliate's dashboard shows the click attributed to that tracker.
- **Campaign config:** admin creates a campaign: `commission_type=percentage, reward=5, recurring=true, recurring_limit=NULL, minimum_payout=50, payout_term=net-30, reward_type=cash` → it saves with those fields.
- **Decoupled:** the campaign form lets you pick `reward_type` (cash/discount) independently of `commission_type` (percentage/fixed); picking `discount` doesn't force a `commission_type`.
- **Multi-campaign:** assign the affiliate's tracker to 2 campaigns (5% + 8%) → both associations exist in `campaign_trackers`.
- **Lifetime:** a campaign with `recurring_limit=NULL` → its display/logic treats it as lifetime (no cap on transactions).
- **Ownership:** affiliate A queries affiliate B's trackers → nothing returned.

## What "working" means

- Trackers attribute clicks correctly.
- Campaigns hold the full Weferral config.
- The decoupling + lifetime semantics are correct.
- Data is isolated per affiliate.

## What to report

- The tracker link + the attributed click row.
- The saved campaign fields.
- Whether `reward_type` + `commission_type` were selectable independently.
- The multi-campaign association.
- The lifetime vs 12-transaction behavior.
- Whether affiliate A saw affiliate B's trackers (they must not).

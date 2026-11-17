# FM-15 — Testing (affiliate signup + onboarding)

**Task:** FM-15 | **Verify behavior, not UI.**

## What behavior to verify

1. Can a visitor self-serve sign up (multi-step) + verify email?
2. Does the admin approve → tracker issued → dashboard accessible?
3. Can a pending (unapproved) affiliate NOT access the dashboard?
4. Is ownership RLS real (affiliate A cannot see affiliate B's data)?
5. Is the affiliate session separate from the admin session?

## How to verify (behavioral)

- **Signup:** open `/affiliate/signup`, complete profile → payout details → terms, submit → a verification email arrives. Click the link → the account is `pending`.
- **Approval:** sign in as admin, open `/admin/affiliates`, see the pending affiliate, approve → the affiliate's status becomes `active`; a tracker is issued.
- **Dashboard:** the approved affiliate signs in, reaches `/affiliate/dashboard`, sees their tracker + copy-link.
- **Pending blocked:** a pending affiliate attempts to sign in → cannot reach the dashboard (blocked, with a "pending approval" message).
- **Ownership RLS:** affiliate A signs in, attempts to query affiliate B's balance/payouts (via the API directly, e.g. `/api/affiliate/balance?account_id=B`) → returns nothing (or only A's own rows).
- **Session separation:** an affiliate session JWT does not grant admin access (`/admin/products` → 404); an admin session does not grant affiliate dashboard access (or if it does, it's deliberate + separate).

## What "working" means

- Affiliates can self-serve join.
- The admin controls approval.
- An affiliate's data is isolated.
- The two auth systems don't bleed.

## What to report

- Whether the multi-step signup + email verify worked end to end.
- Whether approval issued a tracker + granted dashboard access.
- Whether the pending affiliate was blocked.
- Whether affiliate A could see affiliate B's data (they must not).
- Whether the affiliate JWT accessed an admin route (it must not).

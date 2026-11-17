# FM-15 — Affiliate signup + onboarding

**Phase:** 4 | **Spec:** affiliate | **Depends on:** FM-02 | **Status:** ⬜ Pending

## What we're building

The affiliate signup + onboarding flow: a multi-step self-serve form (profile → payout details → terms accept), email verification, admin approval, tracker issuance, and a dashboard — all under ownership-based RLS so an affiliate sees only their own rows.

## Why it matters

This is what makes Athletica a marketplace, not a single-owner shop. Affiliates bring traffic; they need a self-serve path to join, a verified identity, and an isolated view of their own data. Ownership-based RLS is the security boundary — an affiliate can never see another affiliate's balance, trackers, or payouts.

## What success looks like (benchmarks)

- After this, a visitor can open `/affiliate/signup`, complete the multi-step form (profile → payout details → terms), and submit.
- After this, the affiliate receives a verification email; clicking it verifies the account (status: `pending` → awaiting admin approval).
- After this, the admin sees the pending affiliate in `/admin/affiliates`, approves them; the affiliate's status becomes `active`; a tracker is issued.
- After this, the approved affiliate can sign in + reach `/affiliate/dashboard` and see their tracker + a copy-link.
- After this, an affiliate querying another affiliate's balance/tracker/payouts gets **nothing** (ownership RLS — `auth.uid() = account_id`).
- After this, an unapproved (pending) affiliate cannot sign in to the dashboard.
- After this, the affiliate session is a JWT (ownership-scoped), separate from the admin three-locks.

## Context the Builder needs

- The Raider account entity (RE-02 §2.1): email, password, commission default, full_name, address, country, payout_method, payout_instructions, notify_balance, status.
- The NextBase ownership RLS pattern (RE-05 NextBase §2.2): `auth.uid() = account_id` in every affiliate-table policy, wrapped in `(select auth.uid())`.
- Affiliate status state machine: `pending → active → suspended / → closed`.
- Email verification: token emailed, clicked, verified.
- Tracker issuance on approval (a public tracking code for `/go/[tracker-id]`).
- The affiliate JWT is separate from the admin JWT.

## Boundaries

- Do not let an affiliate see another affiliate's data (ownership RLS is the hard boundary).
- Do not let a pending affiliate access the dashboard.
- Do not auto-approve signups (admin approval is required).
- Do not reuse the admin three-locks for affiliates (separate flow).
- Do not store plaintext passwords (Supabase Auth handles hashing).
- Do not skip email verification.

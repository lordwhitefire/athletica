# FM-01 — Three-locks admin auth

**Phase:** 1 Foundation | **Spec:** `openspec/changes/athletica-full-marketplace/specs/foundation/spec.md`
**Supersedes:** ROLL-15 | **Depends on:** — | **Status:** ⬜ Pending

## What we're building

An admin authorization system with three independent gates — invite code, door-key cookie, JWT role — where any gate failing conceals the admin surface entirely (returns 404, not 401/403). The owner is enrolled by invite; the door-key lets the signin page load; the JWT role is the actual authorization.

## Why it matters

The admin workspace manages products, payouts, and affiliates. If it's reachable to the public, anyone can delete products or approve payouts. The three-locks design is defense in depth: even if one gate is bypassed, the others hold. The fail-silent 404 means an attacker probing for admin URLs cannot distinguish a real-but-protected URL from a non-existent one.

## What success looks like (benchmarks)

- After this, when an unauthenticated visitor requests `/admin/products`, the response is a **404** (not a 401, not a 302 to a login page).
- After this, when the owner redeems a valid invite code at `/admin/signup?code=...`, an admin account is created with `app_metadata.role='admin'`, the invite is marked `used_at=now`, and a fresh door-key is issued.
- After this, when two browsers redeem the same invite code simultaneously, only the first succeeds; the second gets "invite no longer valid."
- After this, when the owner signs in with valid credentials + a valid door-key cookie, they reach `/admin/products`; on each valid request the door-key's `expires_at` slides forward 30 days.
- After this, when the owner signs in with a valid password but no door-key cookie, the signin page returns 404.
- After this, when the owner enters a wrong password, the error is "Invalid email or password" — the message is identical whether the email exists or not.
- After this, when someone hits the signin endpoint 6 times in a minute, the 6th is rate-limited (Upstash).
- After this, the owner can run the invite-issuance script from the repo to generate a new invite code (documented; the path is no longer missing).

## Context the Builder needs

- Existing: `rollout/src/lib/auth/admin.ts` (`requireAdmin` / `getAdminUser` using `getUser()`), `rollout/src/lib/auth/door-key-validate.ts`, `rollout/src/app/admin/signin`, `rollout/src/app/admin/signup`, `rollout/src/proxy.ts`, the `admin_access_keys` table (kind='invite'|'door', token_hash UNIQUE, sliding expiry), the RLS policies (role-based, but **unwrapped `auth.jwt()`** — performance bug to fix).
- The blueprint requires `getClaims()` not `getUser()` (saves 50–200ms/page). The blueprint requires `FORCE ROW LEVEL SECURITY` on the sensitive tables. The blueprint requires wrapping `auth.jwt()` in `(select ...)` in every policy.
- Lock #2 (door-key) should be checked in Next.js middleware as a first-line filter; Lock #3 (JWT role) stays per-route.
- The invite-issuance script is referenced in SQL comments but not in the repo — it must be added (a Node script the owner runs locally to generate + insert an invite code).

## Boundaries (what NOT to touch)

- Do not change the `admin_access_keys` table shape (it already has `kind`, `token_hash`, `expires_at`, `used_at`, `revoked_at`).
- Do not return 401 or 403 on admin routes — the fail-silent 404 is the design.
- Do not add a public sign-up route. Admins are invite-only.
- Do not add a permanent route that creates admins (the signup route consumes an invite; it does not create admins freely).
- Do not expose the service-role key or the invite-issuance script to the browser.
- Do not touch the affiliate auth flow (that is FM-15, a separate email/password + approval flow with ownership RLS).

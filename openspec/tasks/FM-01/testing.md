# FM-01 — Testing (three-locks admin auth)

**Task:** FM-01 | **Verify behavior, not UI.**

## What behavior to verify

1. Is the admin surface concealed from the public? (Unauthenticated → 404, not 401/302.)
2. Does each of the three locks reject independently?
3. Does the invite code resist concurrent redemption (only the first wins)?
4. Does the door-key slide forward 30 days on each valid check?
5. Are sign-in errors neutral (no user enumeration)?
6. Is the signin endpoint rate-limited?
7. Can the owner run the invite-issuance script from the repo?

## How to verify (behavioral)

- **No cookies, no session:** request `/admin/products` → expect 404.
- **Door-key cookie only, no JWT:** request `/admin/products` → expect 404 (Lock 3 rejects).
- **JWT session but no door-key:** request `/admin/products` → expect 404 (Lock 2 rejects).
- **All three valid:** request `/admin/products` → expect 200 with the workspace.
- **Invite race:** open two browsers, redeem the same invite at the same time → only one succeeds; the other gets "invite no longer valid."
- **Sliding renewal:** sign in, note the door-key's `expires_at`; wait, make another admin request; `expires_at` should be ~30 days from the second request, not the first.
- **Neutral error:** sign in with a wrong password for a real email; sign in with a wrong password for a fake email → identical error message + identical response shape.
- **Rate limit:** hit `/api/admin/auth/signin` 6 times in a minute with wrong credentials → the 6th is rejected with a rate-limit response.
- **Issuance script:** run the script from the repo → it outputs an invite code; redeeming it at `/admin/signup` works.

## What "working" means

- The admin surface is invisible to anyone without all three locks.
- An attacker probing `/admin/*` cannot tell which URLs are real.
- The door-key renewal is observable in the database.
- The invite path is fully reproducible (issuance → redemption).

## What to report

- Which behaviors passed and which failed.
- The actual HTTP status for each probe (especially: was it ever 401 or 302 when it should have been 404?).
- Whether the rate limit fired at the expected threshold.
- Whether the issuance script ran and produced a working invite.
- Any deviation from the benchmarks and what was observed instead.

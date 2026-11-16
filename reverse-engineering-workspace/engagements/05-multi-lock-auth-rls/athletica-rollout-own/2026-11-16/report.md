# Report — Engagement 05, Sample: athletica/rollout (own)

**Engagement:** 05 — Multi-lock admin auth + RLS-at-DB
**Sample:** athletica/rollout — OUR OWN admin panel
**Stack:** Next.js 16.3.4 + Supabase (auth + Postgres + RLS) + Upstash Redis
**Version:** 0.1.0
**Mode:** Own-software RE, static analysis only
**Date:** 2026-11-16

---

## 0. Note on ownership

This is the only engagement where the sample is ours. No licence gate, no
"don't copy" rule. We are documenting our own three-locks design so the rules
are explicit and can be carried (or revised) in the new single-app build.

## 1. What is it?

`athletica/rollout` is the admin panel for the Athletica football affiliate
marketplace. It lives in our repo at `/home/lordwhitefire/current-project/athletica/rollout/`.
81 source files, ~1 MB. Next.js 16 + Supabase + Upstash. The three-locks admin
auth design we built earlier — this report makes its rules explicit.

## 2. What does it do? (rules and behaviour)

### 2.1 The three locks, in order

A visitor who hits `/admin/products` passes through three independent locks.
Each can reject independently. Each is a different kind of gate.

#### Lock #1 — Invite code (the enrollment gate)

`src/app/api/admin/auth/signup/route.ts:1-110`. The signup endpoint accepts
`{email, password, code}`. The `code` is a one-time, hashed, revocable, expiring
invite token.

**Rule (confirmed):** the invite code is **re-validated at submit time**. The
signup route queries `admin_access_keys` for `kind='invite' AND used_at IS NULL
AND revoked_at IS NULL AND expires_at > now()`. This prevents race conditions
where two browsers redeem the same code simultaneously — only the first wins.

**Rule (confirmed):** on successful redemption:
1. Create user via `supabase.auth.admin.createUser` (service role, email_confirm=true).
2. Set `app_metadata.role = 'admin'` via `updateUserById` (only service role can).
3. Mark invite `used_at = now()`.
4. Issue a NEW door key (Lock #2) — hash a fresh random token, INSERT with
   `kind='door'`, `expires_at = now + 30 days`.
5. Set door-key cookie, redirect to `/admin/signin`.

**Rule (confirmed):** the invite code is SHA-256 hashed before storage; raw code
never persisted. Same hashing as Lock #2.

#### Lock #2 — Door-key cookie (the URL gate)

`src/lib/auth/door-key.ts` + `src/lib/auth/door-key-validate.ts`. The door-key is
a long-lived bearer cookie (`admin_door_key`, HttpOnly, SameSite=Lax, Path=/admin,
Max-Age 30 days).

**Rule (confirmed):** the door-key does NOT authenticate anyone. The inline
comment is explicit: *"The cookie does not authenticate anyone — it only lets
this page load."* Its purpose is to make the signin page itself unreachable to
anyone without the cookie.

**Rule (confirmed):** checked on the signin page (`signin/page.tsx:44-48`) before
the page is sent. `validateDoorKey()` hashes the cookie value with SHA-256 and
queries:

```sql
SELECT id FROM admin_access_keys
WHERE token_hash = sha256(cookie_value)
  AND kind = 'door'
  AND revoked_at IS NULL
  AND expires_at > now()
```

No row → `{ ok: false }` → `notFound()` → HTTP 404. The signin page does not
exist for unauthorized visitors.

**Rule (confirmed):** on every valid check, expiry is **slid forward 30 days**:

```sql
UPDATE admin_access_keys SET expires_at = now() + interval '30 days' WHERE id = ?
```

Sliding renewal: active admins never re-issue; idle admins expire after 30 days
of no use.

**Rule (confirmed):** only the SHA-256 hash is stored. The raw token exists only
in the cookie + the brief moment of issuance. A DB leak does not compromise
active door keys.

#### Lock #3 — Supabase JWT + role (the actual auth)

`src/lib/auth/admin.ts:1-43`. `requireAdmin()` (alias for `getAdminUser()`) reads
the Supabase session, calls `supabase.auth.getUser()`, checks
`user.app_metadata.role === 'admin'`.

**Rule (confirmed):** the role lives in the JWT's `app_metadata`, not a separate
`admins` table. Only the service role can write `app_metadata` (set during
signup). The role travels with every authenticated request — no extra DB lookup.

**Rule (confirmed — the fail-silent rule):** any error, missing user, or missing
role → **fail closed**. Returns `NextResponse.json({error: 'Not found'},
{status: 404})`. **HTTP 404, not 401/403.**

The 404 is deliberate: a 401/403 confirms "this URL is real, you just can't have
it"; a 404 says "this URL doesn't exist." An attacker probing for admin surfaces
cannot distinguish a real-but-protected URL from a non-existent one.

### 2.2 The per-page gate pattern

Every admin page and every admin API route follows the same one-liner:

```typescript
// Pages (SSR):
const admin = await requireAdmin();
if (admin.response) return notFound();

// API routes:
const admin = await requireAdmin(supabase);
if (admin.response) return admin.response;
```

**Rule (confirmed):** the gate is **per-route, not centralized in middleware**.
There is no `src/middleware.ts`. Each route handler calls `requireAdmin()` and
returns the 404 response if not authorized. More verbose, but more flexible —
each route chooses what to do on failure (some `notFound()`, some redirect, some
return JSON).

### 2.3 The RLS-at-DB design — last line of defense

`supabase-rollout-rls-policies.sql` (94 lines). RLS enabled on all three tables.
Eight policies:

#### products (3 policies)

| Policy | For | To | Rule |
|---|---|---|---|
| `anon_can_read_published_products` | SELECT | anon | `status = 'published'` |
| `admin_full_access_products` | ALL | service_role | `true` |
| `admin_can_manage_products` | ALL | authenticated | `JWT.app_metadata.role = 'admin'` (USING + WITH CHECK) |

**Rule (confirmed):** anon can SELECT only published products. Authenticated
non-admins get no policy match → deny by default. Authenticated admins can do
anything. Service role bypasses RLS (server-side scripts only).

#### analytics (3 policies)

| Policy | For | To | Rule |
|---|---|---|---|
| `anon_can_insert_analytics` | INSERT | anon | `WITH CHECK (true)` — anyone can insert |
| `admin_can_read_analytics` | SELECT | service_role | `true` |
| `admin_can_read_analytics_auth` | SELECT | authenticated | `JWT.role = 'admin'` |

**Rule (confirmed):** anon can INSERT (record clicks/views) but never SELECT.
Authenticated admins can SELECT. **No anon SELECT, no authenticated INSERT** —
clicks are write-only from the public internet.

#### admin_access_keys (1 policy)

| Policy | For | To | Rule |
|---|---|---|---|
| `service_role_full_access_admin_access_keys` | ALL | service_role | `true` |

**Rule (confirmed):** **no policy for anon, no policy for authenticated.** With
RLS enabled and no matching policy, the default is DENY. Even a logged-in admin
cannot read the keys table via the anon/authenticated client — only the
service_role (in our controlled server-side code) can touch it. Strictest
possible protection for the table that backs Locks #1 and #2.

### 2.4 The admin_access_keys schema

`supabase-rollout-admin-keys.sql`:

```sql
CREATE TABLE rollout.admin_access_keys (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind          TEXT NOT NULL CHECK (kind IN ('invite', 'door')),
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  token_hash    TEXT NOT NULL UNIQUE,
  browser_label TEXT,
  issued_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at    TIMESTAMPTZ NOT NULL,
  used_at       TIMESTAMPTZ,
  revoked_at    TIMESTAMPTZ
);
```

**Rule (confirmed):** one table backs BOTH invite codes (`kind='invite'`) and
door keys (`kind='door'`), distinguished by the CHECK constraint. `used_at` is
set when an invite is redeemed (door keys are never "used" — validated
repeatedly). `revoked_at` is set by the owner's revoke script. `expires_at` is
the TTL.

**Rule (confirmed):** two indexes — `idx_admin_access_keys_user_id` (lookup all
keys for an admin) and `idx_admin_access_keys_token_hash` (the every-request
lookup).

### 2.5 Neutral error messages

`src/app/api/admin/auth/signin/route.ts:41-46`:

```typescript
if (error) {
  // Neutral error — never reveals whether the account exists.
  return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
}
```

**Rule (confirmed):** sign-in errors are neutral — *"Invalid email or password"*
regardless of whether the email exists. No user enumeration via error messages.

## 3. How do we know? (evidence)

9 evidence blocks in `evidence/excerpts.txt` (566 lines). Each is a `nl -ba`
numbered excerpt from our own source. This is our codebase; the rules are
documented inline in comments.

## 4. What did we not prove?

- **The invite-code issuance path.** The owner's "issue script" (referenced in
  SQL comments) is not in this repo. New invite codes are generated out-of-band.
  The validation/redeem path is fully proven; the issuance path is not.
- **The `signin-preview/` directory.** A preview/test variant of the signin
  flow; not read in full. *Likely* mirrors the live signin flow.
- **The actual Supabase project configuration** (JWT secret, service_role key
  rotation, etc.) — not in this repo.
- **Real-world behaviour under attack.** Source-confirmed only; no penetration
  test run.

## 5. What should the owner do next?

For the **new single-app build**, carry these rules verbatim from our own
design:

1. **Three independent locks:** invite code → door-key cookie → JWT role. Each
   rejects independently. Defense in depth.
2. **One `admin_access_keys` table** for both invite codes and door keys,
   distinguished by `kind` CHECK constraint.
3. **SHA-256 hash all tokens** before storage. Never persist raw tokens.
4. **Re-validate invite codes at submit time** (prevent race conditions).
5. **Sliding renewal on door keys** (30 days on each valid check).
6. **Fail closed + fail silent:** 404 not 401/403. Do not reveal admin surfaces.
7. **Role in JWT `app_metadata.role`**, not a separate table. No extra DB lookup.
8. **Only service_role can write `app_metadata`** — enforced by Supabase.
9. **Per-route `requireAdmin()` one-liner.** Optionally add Next.js middleware
   for the door-key check as a first-line filter.
10. **RLS enabled on every table, deny-by-default.**
11. **`products`:** anon SELECT where published; authenticated ALL where
    role=admin (USING + WITH CHECK).
12. **`analytics`:** anon INSERT only; authenticated SELECT where role=admin.
13. **`admin_access_keys`:** service_role only; no anon/authenticated policy
    (deny by default).
14. **Neutral error messages** — no user enumeration.
15. **Cookie:** HttpOnly, SameSite=Lax, Path=/admin, Max-Age 30d, Secure if https.

Consider improving over the current design:

- **Add `src/middleware.ts`** to run the door-key check (Lock #2) once per
  `/admin/*` request, instead of per-page.
- **Document the invite-code issuance script** and add it to the repo so the
  path is fully reproducible.
- **Add rate limiting on the signin endpoint** (we have Upstash Redis in deps but
  I did not see it used in the signin route — confirm and add if missing).

## 6. Confidence summary

| Finding | Confidence |
|---|---|
| Three independent locks (invite → door-key → JWT role) | confirmed |
| One table backs both invite + door keys via `kind` CHECK | confirmed |
| SHA-256 hash all tokens before storage | confirmed |
| Re-validate invite codes at submit time | confirmed |
| Sliding renewal on door keys (30 days per valid check) | confirmed |
| Fail closed + fail silent (404 not 401/403) | confirmed |
| Role in JWT `app_metadata.role`, not a separate table | confirmed |
| Only service_role can write `app_metadata` | confirmed (Supabase-enforced) |
| Per-route `requireAdmin()` one-liner pattern | confirmed |
| RLS enabled on every table, deny-by-default | confirmed |
| `products` policies (anon SELECT published, auth ALL where role=admin) | confirmed |
| `analytics` policies (anon INSERT only, auth SELECT where role=admin) | confirmed |
| `admin_access_keys` policy (service_role only) | confirmed |
| Neutral error messages (no user enumeration) | confirmed |
| Cookie config (HttpOnly, SameSite=Lax, Max-Age 30d) | confirmed |
| Invite-code issuance path (owner's script) | not proven (not in repo) |
| Rate limiting on signin endpoint | not proven (Upstash in deps, not seen in route) |

---

**Engagement 05 — athletica/rollout (own) sample: complete.** Next sample in
this engagement: NextBase (Next.js + Supabase starter) for the RLS-pattern
comparison and to evaluate whether the three-locks overhead is justified or
whether NextBase's simpler model suffices.

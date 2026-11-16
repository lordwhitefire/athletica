# Analysis — Engagement 05, Sample: athletica/rollout (own)

**Date:** 2026-11-16
**Mode:** Own-software RE, static only
**Working record** — separates what was *observed* from what is *inferred*.

## Files read

| File | Lines | Purpose |
|---|---|---|
| `package.json` | head | Stack: Next 16.3.4, Supabase SSR + JS, Upstash ratelimit + redis |
| `src/app/admin/signin/page.tsx` | 36–49 | Lock #2 check on the signin page |
| `src/app/admin/products/layout.tsx` | 1–20 | SSR third-lock gate (requireAdmin → notFound) |
| `src/lib/auth/admin.ts` | 1–43 (full) | requireAdmin + getAdminUser (Lock #3 brain) |
| `src/lib/auth/door-key.ts` | 1–28 (full) | Cookie config + token hashing |
| `src/lib/auth/door-key-validate.ts` | 1–69 (full) | Sliding-session validator (Lock #2 brain) |
| `src/app/api/admin/auth/signin/route.ts` | 1–47 (full) | Supabase signInWithPassword |
| `src/app/api/admin/auth/signup/route.ts` | 1–110 (full) | Lock #1 invite redemption + door-key issuance |
| `src/app/api/admin/products/route.ts` | 1–50 | API route gate pattern |
| `supabase-rollout-admin-keys.sql` | full | admin_access_keys table + RLS |
| `supabase-rollout-rls-policies.sql` | 1–94 (full) | 8 RLS policies across 3 tables |
| `supabase-rollout-schema-updates.sql` | head | Incremental schema changes |

## Observed: the three locks, in order

A visitor who types `/admin/products` into their browser passes through three
locks in sequence. Each is independent; each can reject independently.

### Lock #1 — Invite code (the enrollment gate)

`src/app/api/admin/auth/signup/route.ts`. The signup endpoint accepts
`{email, password, code}`. The `code` is an invite code — a one-time, hashed,
revocable, expiring token stored in `admin_access_keys` with `kind = 'invite'`.

**Rule (confirmed):** the invite code is **re-validated at submit time**, not just
when the form loads. The signup route re-queries:

```sql
SELECT id FROM admin_access_keys
WHERE token_hash = sha256(code)
  AND kind = 'invite'
  AND used_at IS NULL
  AND revoked_at IS NULL
  AND expires_at > now()
```

This prevents race conditions where two browsers redeem the same code
simultaneously — only the first wins; the second sees `used_at IS NOT NULL` and
is rejected.

**Rule (confirmed):** on successful redemption:

1. Create the user via `supabase.auth.admin.createUser` (service role, bypasses
   email confirmation — `email_confirm: true`).
2. Set `app_metadata.role = 'admin'` via `supabase.auth.admin.updateUserById`
   (only service role can write app_metadata).
3. Mark the invite code as `used_at = now()`.
4. Issue a NEW door key (Lock #2): hash a fresh random token, INSERT into
   `admin_access_keys` with `kind = 'door'`, `user_id`, `token_hash`,
   `expires_at = now + 30 days`.
5. Set the door-key cookie, redirect to `/admin/signin`.

**Rule (confirmed):** the invite code is **hashed with SHA-256** before storage;
the raw code is never persisted. Same hashing as the door key (Lock #2).

### Lock #2 — Door-key cookie (the URL gate)

`src/lib/auth/door-key.ts` + `src/lib/auth/door-key-validate.ts`.

The door-key is a long-lived bearer cookie (`admin_door_key`, HttpOnly,
SameSite=Lax, Path=/admin, Max-Age 30 days). It does **NOT authenticate anyone**
— the comment in `signin/page.tsx` is explicit: *"The cookie does not
authenticate anyone — it only lets this page load."*

**Rule (confirmed):** the door-key is checked on the **signin page itself**, before
the page is sent. `validateDoorKey()` reads the cookie, SHA-256 hashes it, and
queries:

```sql
SELECT id FROM admin_access_keys
WHERE token_hash = sha256(cookie_value)
  AND kind = 'door'
  AND revoked_at IS NULL
  AND expires_at > now()
```

If no row matches → `{ ok: false }` → the signin page calls `notFound()` → HTTP
404. The signin page does not exist for an unauthorized visitor.

**Rule (confirmed):** on every valid check, the expiry is **slid forward 30 days**:

```sql
UPDATE admin_access_keys SET expires_at = now() + interval '30 days'
WHERE id = ?
```

This is sliding renewal: active admins never have to re-issue; idle admins
expire after 30 days of no use.

**Rule (confirmed):** only the SHA-256 hash of the token is stored. The raw token
exists only in the cookie and in the brief moment of issuance. A DB leak does not
compromise active door keys.

### Lock #3 — Supabase JWT + role (the actual auth)

`src/lib/auth/admin.ts`. `requireAdmin()` (alias for `getAdminUser()`) reads the
Supabase session, calls `supabase.auth.getUser()`, and checks
`user.app_metadata.role === 'admin'`.

**Rule (confirmed):** the role lives in the JWT's `app_metadata`, not in a
separate `admins` table. Only the service role can write `app_metadata` (set
during signup via `updateUserById`). The role travels with every authenticated
request — no extra DB lookup needed.

**Rule (confirmed):** any error, missing user, or missing role → **fail closed**.
The function returns `{ user: null, response: NextResponse.json({error: 'Not
found'}, {status: 404}) }`. **HTTP 404, not 401 or 403.**

**Rule (confirmed — the fail-silent rule):** 404 is chosen deliberately to avoid
revealing that admin endpoints exist. A 401/403 confirms "this URL is real, you
just can't have it"; a 404 says "this URL doesn't exist." An attacker probing
for admin surfaces cannot distinguish a real-but-protected URL from a
non-existent one.

## Observed: the per-page gate pattern

Every admin page and every admin API route follows the same one-liner pattern:

```typescript
// Pages (SSR):
const admin = await requireAdmin();
if (admin.response) return notFound();   // or: notFound() directly

// API routes:
const admin = await requireAdmin(supabase);
if (admin.response) return admin.response;
```

**Rule (confirmed):** the gate is **per-route, not centralized in middleware**.
There is no `src/middleware.ts`. Each route handler calls `requireAdmin()` and
returns the 404 response if not authorized. This is more verbose but more
flexible — each route can choose what to do on failure (some pages `notFound()`,
some redirect, some return JSON).

**Implication for the new build:** consider adding a Next.js middleware
(`src/middleware.ts`) that runs the door-key check (Lock #2) on every `/admin/*`
path as a first-line filter, then keep the per-route `requireAdmin()` for Lock #3.
This is a small optimization — currently every page re-runs `validateDoorKey()`
implicitly via the signin page, but admin product pages only check Lock #3.

## Observed: the RLS-at-DB design (the last line of defense)

`supabase-rollout-rls-policies.sql`. RLS is enabled on all three tables:
`products`, `analytics`, `admin_access_keys`. Eight policies total:

### products table (3 policies)

| Policy | For | To | Rule |
|---|---|---|---|
| `anon_can_read_published_products` | SELECT | anon | `status = 'published'` |
| `admin_full_access_products` | ALL | service_role | `true` |
| `admin_can_manage_products` | ALL | authenticated | `JWT.app_metadata.role = 'admin'` (USING + WITH CHECK) |

**Rule (confirmed):** anon users can SELECT only published products. Authenticated
non-admins get no policy match → deny by default. Authenticated admins can do
anything (USING for reads, WITH CHECK for writes). The service_role bypasses
RLS entirely (used only by the owner's server-side scripts).

### analytics table (3 policies)

| Policy | For | To | Rule |
|---|---|---|---|
| `anon_can_insert_analytics` | INSERT | anon | `WITH CHECK (true)` — anyone can insert |
| `admin_can_read_analytics` | SELECT | service_role | `true` |
| `admin_can_read_analytics_auth` | SELECT | authenticated | `JWT.role = 'admin'` |

**Rule (confirmed):** anon users can INSERT (record clicks/views) but never SELECT.
Authenticated admins can SELECT. Service role can SELECT. **No anon SELECT, no
authenticated INSERT** — clicks are write-only from the public internet.

### admin_access_keys table (1 policy)

| Policy | For | To | Rule |
|---|---|---|---|
| `service_role_full_access_admin_access_keys` | ALL | service_role | `true` |

**Rule (confirmed):** **no policy for anon, no policy for authenticated.** With RLS
enabled and no matching policy, the default is DENY. Even a logged-in admin
cannot read the keys table via the anon/authenticated client — only the
service_role (server-side, in our controlled code) can touch it. This is the
strictest possible protection for the table that backs Locks #1 and #2.

## Observed: the admin_access_keys table schema

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

**Rule (confirmed):** one table backs BOTH Lock #1 (invite codes) and Lock #2
(door keys), distinguished by the `kind` CHECK constraint. The CHECK prevents a
bug from writing `kind = 'foo'`. `used_at` is set when an invite is redeemed
(door keys are never "used" — they're validated repeatedly). `revoked_at` is
set by the owner's revoke script. `expires_at` is the TTL.

**Rule (confirmed):** two indexes:
- `idx_admin_access_keys_user_id` — look up all keys for a given admin
- `idx_admin_access_keys_token_hash` — the every-request lookup (Lock #2 validation)

## Observed: neutral error messages

`src/app/api/admin/auth/signin/route.ts`:

```typescript
if (error) {
  // Neutral error — never reveals whether the account exists.
  return NextResponse.json({ error: 'Invalid email or password' }, { status: 401 });
}
```

**Rule (confirmed):** sign-in errors are neutral — *"Invalid email or password"*
regardless of whether the email exists. No user enumeration via error messages.

## What our three-locks design gives us (consolidated rules for the new build)

| Rule | Worth carrying into the new build? |
|---|---|
| Three independent locks: invite code → door-key cookie → JWT role | Yes — defense in depth |
| One table (`admin_access_keys`) backs both invite + door keys via `kind` CHECK | Yes — clean |
| SHA-256 hash all tokens before storage; never persist raw | Yes |
| Re-validate invite codes at submit time (prevent races) | Yes |
| Sliding renewal on door keys (30 days on each valid check) | Yes |
| Fail closed + fail silent: 404 not 401/403 | Yes — do not reveal admin surfaces |
| Role in JWT `app_metadata.role`, not a separate table | Yes — no extra DB lookup |
| Only service_role can write `app_metadata` | Yes — enforced by Supabase |
| Per-route `requireAdmin()` one-liner pattern | Yes — keep; optionally add middleware |
| RLS enabled on every table, deny-by-default | Yes |
| `products`: anon SELECT where published, authenticated ALL where role=admin | Yes |
| `analytics`: anon INSERT only, authenticated SELECT where role=admin | Yes |
| `admin_access_keys`: service_role only, no anon/authenticated policy | Yes |
| Neutral error messages (no user enumeration) | Yes |
| Cookie: HttpOnly, SameSite=Lax, Path=/admin, Max-Age 30d, Secure if https | Yes |

## Confidence

- **confirmed** — every claim above is sourced to `file:line` in
  `evidence/excerpts.txt` (566 lines, 9 evidence blocks). This is our own code;
  the rules are documented inline.
- **likely** — the `signin-preview/` directory (a preview/test variant of the
  signin flow) was not read in full; it likely mirrors the live signin flow.
- **not proven** — the owner's invite-code *issuance* script (referenced in SQL
  comments as "the owner's issue script") is not in this repo. The generation of
  new invite codes happens out-of-band. The validation/redeem path is fully
  proven; the issuance path is not.

## Open question for the next sample (NextBase)

NextBase (Next.js + Supabase starter) likely uses a simpler single-lock model
(Supabase auth + RLS, no door-key, no invite codes). Comparing will tell us:

1. Whether the three-locks overhead is justified for our threat model, or whether
   NextBase's simpler model suffices.
2. Whether NextBase's RLS policies are more granular (per-row, per-column) than
   ours.
3. Whether NextBase uses Next.js middleware for the gate (we don't).

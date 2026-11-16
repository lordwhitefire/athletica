# Analysis — Engagement 05, Sample: NextBase

**Date:** 2026-11-16
**Mode:** A (open source under MIT), static only
**Working record** — separates what was *observed* from what is *inferred*.

## Files read

| File | Lines | Purpose |
|---|---|---|
| `LICENSE` | 1–5 | MIT confirmed |
| `apps/web/src/supabase-clients/middleware.ts` | 1–59 (full) | The single-lock gate |
| `apps/web/src/data/auth/auth.ts` | 1–80 (head) | signUp / signIn / magic-link actions |
| `apps/database/supabase/migrations/20230208104718_private_items.sql` | 1–21 (full) | Canonical RLS pattern |
| `.agents/skills/supabase-postgres-best-practices/references/security-rls-basics.md` | 1–50 (full) | FORCE RLS, multi-tenant |
| `.agents/skills/supabase-postgres-best-practices/references/security-rls-performance.md` | 1–63 (full) | The `(select auth.uid())` caching trick |
| `.agents/skills/safe-action-middleware/auth-patterns.md` | 1–116 (head) | Layered action client |
| `docs/SUPABASE_GETCLAIMS_AUTHENTICATION.md` | 1–80 (head) | getClaims() vs getUser() |

## Observed: the single-lock model (vs our three-locks)

`apps/web/src/supabase-clients/middleware.ts`. NextBase has **ONE** auth check:
`supabase.auth.getUser()`. If no user → redirect to `/login`. No door-key cookie,
no invite code, no role check, no fail-silent.

```typescript
const protectedPages = ['/dashboard', '/private-item', '/private-items', '/items', '/item'] as const;
const { data: { user } } = await supabase.auth.getUser();
if (!user && protectedPages.some((page) => match(page)(request.nextUrl.pathname))) {
  const url = request.nextUrl.clone();
  url.pathname = '/login';
  return NextResponse.redirect(url);
}
```

**Rule (confirmed):** NextBase's gate is **centralized in middleware**, not
per-route. Every request to a protected page passes through `updateSession()`.
This is the opposite of athletica/rollout, which has no middleware and calls
`requireAdmin()` per route.

**Rule (confirmed):** NextBase **redirects** unauthorized users to `/login`
(HTTP 302). athletica/rollout **returns 404**. The trade-off:
- Redirect (NextBase): better UX for legitimate users (they see the login form);
  reveals that the URL exists to attackers.
- 404 (athletica/rollout): no UX (attacker and legitimate-but-logged-out user
  both see "not found"); conceals the URL's existence.

For an admin panel that only 3-5 people will ever use, the 404 approach is
defensible. For a SaaS dashboard with thousands of users, the redirect is correct.
**Our build is the former — keep the 404.**

## Observed: RLS is user-ownership-based, not role-based

`apps/database/supabase/migrations/20230208104718_private_items.sql` (21 lines,
full). Four policies on `private_items`:

```sql
-- 1. Enable RLS
ALTER TABLE public.private_items ENABLE ROW LEVEL SECURITY;

-- 2. SELECT for everyone (USING TRUE — public read)
CREATE POLICY select_all_policy ON public.private_items FOR SELECT USING (TRUE);

-- 3. INSERT requires authenticated
CREATE POLICY insert_auth_policy ON public.private_items FOR INSERT WITH CHECK (auth.uid() IS NOT NULL);

-- 4. UPDATE requires ownership (auth.uid() = id — wait, this checks the row's id, not user_id)
CREATE POLICY update_auth_policy ON public.private_items FOR UPDATE USING (auth.uid() = id);
```

**Rule (confirmed):** NextBase's RLS is **user-ownership-based**, not role-based.
There is no `admin` role in the SQL. Any authenticated user can INSERT; only the
row's owner can UPDATE. (The `auth.uid() = id` check is actually a bug here —
it compares the user's ID to the row's `id`, not to a `user_id` column — but
the *pattern* is ownership-based.)

**Rule (confirmed):** `SELECT USING (TRUE)` makes reads fully public. This is
appropriate for NextBase's demo data (blog posts, public items) but **wrong for
our affiliate products** — we need `SELECT WHERE status = 'published'` (which
athletica/rollout does correctly).

## Observed: the RLS performance optimization (the valuable contribution)

`.agents/skills/supabase-postgres-best-practices/references/security-rls-performance.md`.
Two critical rules:

### Rule 1: Wrap `auth.uid()` in `(select ...)` for caching

```sql
-- INCORRECT (auth.uid() called per row, N times on N rows):
CREATE POLICY orders_policy ON orders USING (auth.uid() = user_id);

-- CORRECT (auth.uid() called once, cached for the query):
CREATE POLICY orders_policy ON orders USING ((select auth.uid()) = user_id);
```

**Rule (confirmed):** the `(select ...)` wrapper makes Postgres treat
`auth.uid()` as a stable subquery, evaluated once per query rather than per row.
100x+ faster on large tables.

**Critical finding:** athletica/rollout's RLS policies use
`auth.jwt() -> 'app_metadata' ->> 'role' = 'admin'` **WITHOUT** the
`(select ...)` wrapper. This is a performance bug to fix in the new build — wrap
the `auth.jwt()` expression in `(select ...)`.

### Rule 2: Use `SECURITY DEFINER` functions for complex checks

```sql
create or replace function private.is_team_member(team_id bigint)
returns boolean language sql security definer set search_path = ''
as $$
  select exists (
    select 1 from public.team_members
    where team_id = $1 and user_id = (select auth.uid())
  );
$$;

revoke execute on function private.is_team_member(bigint) from PUBLIC, anon, authenticated, service_role;

create policy team_orders_policy on orders using ((select private.is_team_member(team_id)));
```

**Rule (confirmed):** for complex membership checks (team membership, org
membership), wrap them in a `SECURITY DEFINER` function in a private schema,
revoke EXECUTE from public roles, and call it from the policy. The function
runs with the creator's privileges and bypasses RLS on tables it touches —
useful for lookups, dangerous if misused. Always include an explicit
`auth.uid()` check inside the function body.

### Rule 3: FORCE ROW LEVEL SECURITY for table owners

```sql
alter table orders force row level security;
```

**Rule (confirmed):** without FORCE, the table owner (the `postgres` role in
Supabase) bypasses RLS. FORCE ensures even admin queries respect RLS unless
explicitly using `service_role`. Use on sensitive tables.

## Observed: getClaims() vs getUser() (performance optimization)

`docs/SUPABASE_GETCLAIMS_AUTHENTICATION.md` (799 lines). The key comparison:

| Feature | `getClaims()` | `getUser()` |
|---|---|---|
| Network call | No | Yes (verifies with server) |
| Speed | ~0ms | ~50-200ms |
| Server verification | No (trusts JWT) | Yes (re-validates token) |
| Security | JWT + RLS | JWT + Server verification + RLS |

**Rule (confirmed):** `getClaims()` extracts JWT claims locally without a
network call. Security is preserved because RLS still enforces authorization at
the DB. Use `getClaims()` for quick auth checks (middleware, page gates); use
`getUser()` only when you need the full user object.

**Critical finding:** athletica/rollout uses `getUser()` everywhere — including
in `requireAdmin()` which runs on every admin route. Switching to `getClaims()`
would eliminate a 50-200ms network call per admin page load. **For the new build,
use `getClaims()` in the gate, `getUser()` only when the full user profile is
needed.**

## Observed: the layered action-client pattern

`.agents/skills/safe-action-middleware/auth-patterns.md`. Compose auth checks as
middleware layers:

```typescript
// Layer 1: require authenticated session
export const authActionClient = actionClient.use(async ({ next }) => {
  const session = await getSession();
  if (!session?.user) throw new Error("You must be logged in.");
  return next({ ctx: { userId: session.user.id, userRole: session.user.role } });
});

// Layer 2: require admin role
export const adminActionClient = authActionClient.use(async ({ next, ctx }) => {
  if (ctx.userRole !== "admin") throw new Error("Admin access required.");
  return next({ ctx });
});

// Layer 3: require org membership (uses validated input)
export const orgActionClient = authActionClient
  .inputSchema(z.object({ orgId: z.string().uuid() }))
  .useValidated(async ({ next, ctx, parsedInput }) => {
    const membership = await db.orgMember.find({ userId: ctx.userId, orgId: parsedInput.orgId });
    if (!membership) throw new Error("You are not a member of this organization.");
    return next({ ctx });
  });
```

**Rule (confirmed):** auth checks compose as layers: `actionClient →
authActionClient → adminActionClient → orgActionClient`. Each layer adds one
check and enriches the context. The endpoint declares which client to use:
`adminActionClient.action(...)` requires admin; `orgActionClient.action(...)`
requires admin + org membership.

**Implication for our build:** athletica/rollout uses inline
`if (admin.response) return admin.response;` per route. The layered client
pattern is cleaner — adopt it for the new build. Define
`adminActionClient` (requires Lock #3) and `doorKeyActionClient` (requires
Lock #2) as composed layers.

## What NextBase contributes vs our three-locks design

| Capability | athletica/rollout (ours) | NextBase | Adopt? |
|---|---|---|---|
| Lock model | Three locks (invite + door-key + JWT role) | One lock (session) | Keep three-locks for admin panel |
| Gate location | Per-route (`requireAdmin()`) | Centralized middleware | Adopt middleware for Lock #2; keep per-route for Lock #3 |
| Fail behaviour | 404 (conceals URL) | 302 redirect (reveals URL) | Keep 404 for admin |
| RLS basis | Role-based (`JWT.role = 'admin'`) | User-ownership (`auth.uid() = user_id`) | Keep role-based for admin tables; add ownership for any user-scoped tables |
| RLS performance | `auth.jwt()` unwrapped (bug) | `(select auth.uid())` cached | **FIX**: wrap `auth.jwt()` in `(select ...)` |
| FORCE RLS | Not used | Recommended | **ADOPT**: use on sensitive tables |
| `getClaims()` perf | Not used (uses `getUser()`) | Documented | **ADOPT**: use `getClaims()` in gates |
| Action client | Inline `if (admin.response)` | Layered `authActionClient → adminActionClient` | **ADOPT**: layered pattern |
| `SECURITY DEFINER` for complex checks | Not used | Documented | **ADOPT** if we add team/org membership later |

## Confidence

- **confirmed** — every claim above is sourced to `file:line` in
  `evidence/excerpts.txt` (459 lines, 6 evidence blocks; some prose echo lines
  with backticks were mangled by bash but the code excerpts are intact).
- **likely** — the `update_auth_policy` in NextBase's `private_items` migration
  has `USING (auth.uid() = id)` which compares user ID to the row's `id`, not
  to a `user_id` column. This is *likely* a bug in the demo (there is no
  `user_id` column on `private_items` in the init migration), not an intentional
  pattern. The 2025-11-17 migration `add_owner_id_to_private_items` suggests
  they later added an `owner_id` column — the policy may have been updated.
- **not proven** — whether NextBase's `getClaims()` approach is actually used in
  the live middleware (the middleware.ts I read calls `getUser()`, not
  `getClaims()`; the docs advocate getClaims but the code doesn't use it yet).

## Engagement 05 consolidated

Two samples reported:

| Sample | Licence | Contribution |
|---|---|---|
| athletica/rollout (own) | N/A | The three-locks design: invite code + door-key cookie + JWT role, fail-silent 404, role-based RLS |
| NextBase | MIT (rules only) | The performance optimizations our three-locks was missing: `(select auth.jwt())` caching, FORCE RLS, `getClaims()` instead of `getUser()`, layered action-client pattern |

The consolidated auth + RLS rules for the build are documented in
`nextbase/2026-11-16/analysis.md` §"What NextBase contributes". The next
engagement (06: Plausible / Umami) covers privacy-first click analytics.

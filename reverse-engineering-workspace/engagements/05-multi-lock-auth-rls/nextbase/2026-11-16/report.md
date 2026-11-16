# Report — Engagement 05, Sample: NextBase

**Engagement:** 05 — Multi-lock admin auth + RLS-at-DB (comparison sample)
**Sample:** NextBase (imbhargav5/nextbase-nextjs-supabase-starter), MIT
**Commit analysed:** `00ad2da857b84322ff359db098cbf1cb4f4b7282` (2026-10-02)
**Mode:** A (open source under licence), static analysis only
**Date:** 2026-11-16

---

## 0. Licence note

NextBase is **MIT**. Direct adaptation permitted. We extract the performance
optimizations and patterns our three-locks design was missing.

## 1. What is it?

A Next.js + Supabase starter kit by Bhargav Ponnapalli. Same stack as
athletica/rollout (Next.js + Supabase), so a direct comparison. 31 MB, 489 files.
Last commit 2026-10-02. Notably includes a `.agents/skills/` folder with
documented RLS best practices — the most valuable artifact in the repo.

## 2. What does it do? (rules and behaviour)

### 2.1 Single-lock model (vs our three-locks)

`apps/web/src/supabase-clients/middleware.ts`. One auth check:
`supabase.auth.getUser()`. If no user → redirect to `/login`.

**Rule (confirmed):** NextBase's gate is **centralized in middleware**, not
per-route. athletica/rollout has no middleware and calls `requireAdmin()` per
route.

**Rule (confirmed):** NextBase **redirects** (HTTP 302, reveals URL exists);
athletica/rollout **returns 404** (conceals URL). For an admin panel used by 3-5
people, the 404 approach is defensible. **Keep the 404 for our build.**

### 2.2 RLS is user-ownership-based, not role-based

`apps/database/supabase/migrations/20230208104718_private_items.sql`. Four
policies: SELECT for everyone (`USING TRUE`), INSERT requires `auth.uid() IS NOT
NULL`, UPDATE requires ownership. No `admin` role in the SQL.

**Rule (confirmed):** NextBase's RLS is ownership-based. athletica/rollout's is
role-based (`JWT.role = 'admin'`). For admin tables, role-based is correct. For
any future user-scoped tables (e.g. an affiliate's own dashboard), adopt
ownership-based RLS.

### 2.3 The RLS performance optimization (critical contribution)

`.agents/skills/supabase-postgres-best-practices/references/security-rls-performance.md`.

**Rule (confirmed — FIX for our build):** wrap `auth.uid()` / `auth.jwt()` in
`(select ...)` to cache the result once per query, not per row:

```sql
-- INCORRECT (auth.uid() called per row):
CREATE POLICY orders_policy ON orders USING (auth.uid() = user_id);

-- CORRECT (cached once per query):
CREATE POLICY orders_policy ON orders USING ((select auth.uid()) = user_id);
```

athletica/rollout's policies use `auth.jwt() -> 'app_metadata' ->> 'role' =
'admin'` **without** the wrapper. **This is a performance bug to fix in the new
build** — wrap the `auth.jwt()` expression in `(select ...)`.

**Rule (confirmed):** use `SECURITY DEFINER` functions in a private schema for
complex membership checks (team, org). Always include `auth.uid()` inside the
function body. Revoke EXECUTE from public roles.

**Rule (confirmed):** use `FORCE ROW LEVEL SECURITY` on sensitive tables. Without
FORCE, the table owner (the `postgres` role in Supabase) bypasses RLS.

### 2.4 getClaims() vs getUser() (performance optimization)

`docs/SUPABASE_GETCLAIMS_AUTHENTICATION.md` (799 lines).

| Feature | `getClaims()` | `getUser()` |
|---|---|---|
| Network call | No | Yes |
| Speed | ~0ms | ~50-200ms |
| Security | JWT + RLS | JWT + Server verification + RLS |

**Rule (confirmed — ADOPT):** use `getClaims()` for quick auth checks
(middleware, page gates); use `getUser()` only when the full user object is
needed. athletica/rollout uses `getUser()` everywhere — including in
`requireAdmin()` on every admin route. Switching to `getClaims()` eliminates a
50-200ms network call per admin page load.

### 2.5 Layered action-client pattern

`.agents/skills/safe-action-middleware/auth-patterns.md`. Compose auth as
middleware layers:

```
actionClient → authActionClient (requires session) → adminActionClient (requires role=admin) → orgActionClient (requires org membership)
```

**Rule (confirmed — ADOPT):** each layer adds one check and enriches the context.
The endpoint declares which client to use. Cleaner than inline
`if (admin.response) return admin.response;` per route.

## 3. How do we know? (evidence)

6 evidence blocks in `evidence/excerpts.txt` (459 lines). Each is a `nl -ba`
numbered excerpt. Licence confirmed from `LICENSE`. Provenance: shallow clone
of the official repo at commit `00ad2da857b84322ff359db098cbf1cb4f4b7282`.

## 4. What did we not prove?

- **Whether NextBase's middleware actually uses `getClaims()`.** The
  `middleware.ts` I read calls `getUser()`, not `getClaims()`. The docs advocate
  `getClaims()` but the code doesn't use it yet. The optimization is documented
  but not yet implemented in NextBase's own codebase.
- **The exact `update_auth_policy` semantics.** The policy has
  `USING (auth.uid() = id)` which compares user ID to the row's `id`, not a
  `user_id` column. *Likely* a demo bug; the 2025-11-17 migration
  `add_owner_id_to_private_items` suggests they later added an `owner_id`
  column.
- **Real-world performance numbers.** The "100x+ faster" claim is from the docs;
  not verified by benchmark.

## 5. What should the owner do next?

For the **new single-app build**, carry these from NextBase (in addition to our
three-locks design from athletica/rollout):

1. **Fix the RLS performance bug:** wrap `auth.jwt()` in `(select ...)` in every
   policy. athletica/rollout's unwrapped version is slow on large tables.
2. **Use `FORCE ROW LEVEL SECURITY`** on sensitive tables (admin_access_keys,
   products, analytics). Prevents the postgres owner from bypassing RLS.
3. **Use `getClaims()` in the auth gate** (`requireAdmin` / `validateDoorKey`),
   not `getUser()`. Eliminates a 50-200ms network call per admin page load. Use
   `getUser()` only when the full user object is needed.
4. **Adopt the layered action-client pattern:** `actionClient → authActionClient
   → adminActionClient`. Cleaner than inline `if (admin.response)` per route.
5. **Use `SECURITY DEFINER` functions** for any complex membership checks (if we
   add team/org features later). Always include `auth.uid()` inside the body.

Keep from athletica/rollout (do NOT adopt NextBase's simpler model):

1. **Three-locks design** (invite + door-key + JWT role) — defense in depth.
2. **Fail-silent 404** — do not redirect (reveals URL exists).
3. **Role-based RLS** for admin tables (not ownership-based).
4. **`admin_access_keys` table** with `kind` CHECK for invite + door keys.
5. **SHA-256 hashed tokens**, sliding renewal, re-validate at submit time.

## 6. Confidence summary

| Finding | Confidence |
|---|---|
| NextBase uses single-lock (session in middleware) | confirmed |
| Gate is centralized in middleware, not per-route | confirmed |
| Unauthorized → redirect (reveals URL) | confirmed |
| RLS is user-ownership-based, not role-based | confirmed |
| `(select auth.uid())` caching pattern is 100x+ faster | confirmed (documented) |
| `FORCE ROW LEVEL SECURITY` for table owners | confirmed (documented) |
| `getClaims()` is faster than `getUser()` (~0ms vs 50-200ms) | confirmed (documented) |
| Layered action-client pattern (actionClient → authActionClient → adminActionClient) | confirmed |
| athletica/rollout's RLS has the unwrapped-`auth.jwt()` performance bug | confirmed (by comparison) |
| NextBase's own middleware uses getClaims() | not proven (code uses getUser()) |
| The `auth.uid() = id` policy is a bug | likely (demo code) |
| Real-world 100x speedup claim | not proven (not benchmarked) |

---

## Engagement 05 — Consolidated

Engagement 05 is now **complete**. Two samples reported:

| Sample | Licence | Contribution |
|---|---|---|
| athletica/rollout (own) | N/A — own code | The three-locks design: invite code + door-key cookie + JWT role, fail-silent 404, role-based RLS, `admin_access_keys` table |
| NextBase | MIT (rules only) | The performance optimizations our three-locks was missing: `(select auth.jwt())` caching, `FORCE RLS`, `getClaims()` instead of `getUser()`, layered action-client pattern |

The **consolidated auth + RLS rules** for the build:

- **Three-locks** (invite → door-key → JWT role) — keep verbatim from our own design.
- **Fail-silent 404** — keep; do not redirect.
- **Centralize Lock #2 in middleware**, keep Lock #3 per-route.
- **Role-based RLS** for admin tables; ownership-based for any user-scoped tables.
- **`FORCE ROW LEVEL SECURITY`** on sensitive tables.
- **Wrap `auth.jwt()` in `(select ...)`** in every RLS policy — fix the performance bug.
- **Use `getClaims()` in the gate**, `getUser()` only when full user object needed.
- **Layered action-client pattern** for cleaner route handlers.
- **`admin_access_keys` table** with `kind` CHECK, SHA-256 hashed tokens, sliding renewal.

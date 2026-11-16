# Sample — NextBase

## Identity

| Field | Value |
|---|---|
| Name | NextBase (imbhargav5/nextbase-nextjs-supabase-starter) |
| Type | Next.js + Supabase starter, Turborepo monorepo |
| Version / commit | `00ad2da857b84322ff359db098cbf1cb4f4b7282` (2026-10-02) |
| Provenance | `git clone --depth 1 https://github.com/imbhargav5/nextbase-nextjs-supabase-starter.git` on 2026-11-16 |
| Licence | **MIT** (Copyright 2023 Bhargav Ponnapalli) |
| Size | 31 MB |
| File count | 489 (excluding `.git/` and `node_modules/`) |

## Provenance handling

Shallow clone of the official repo. Working tree read-only.

## Layout (key files for this engagement)

```
nextbase/
  LICENSE                                 MIT
  apps/
    web/
      src/
        supabase-clients/middleware.ts     THE SINGLE-LOCK GATE (59 lines)
        data/auth/auth.ts                 signUp / signIn / magic-link actions
    database/
      supabase/
        migrations/
          20230208104717_init.sql                   base schema
          20230208104718_private_items.sql         the canonical RLS example
          20251117162807_add_owner_id_to_private_items.sql
          ...
  docs/
    SUPABASE_GETCLAIMS_AUTHENTICATION.md   getClaims() vs getUser() perf guide (799 lines)
  .agents/skills/
    supabase-postgres-best-practices/references/
      security-rls-basics.md              FORCE RLS, multi-tenant pattern
      security-rls-performance.md         the (select auth.uid()) caching trick
    safe-action-middleware/
      auth-patterns.md                    layered actionClient auth middleware
```

The `.agents/skills/` folder is the most valuable artifact in this repo — it's a
curated set of best-practice docs, not just code.

## Lab status

Not applicable. Mode A, static-only.

## Handling rule

Treat as read-only reference under MIT. Direct adaptation permitted but we have
our own three-locks design; we extract the *differences* and the *performance
optimizations* NextBase contributes.

## Open triage questions

1. Single-lock or multi-lock? (Likely single: Supabase session in middleware.)
2. RLS: user-ownership or role-based?
3. RLS performance patterns? (`(select auth.uid())` caching, FORCE RLS)
4. Layered action client? (actionClient → authActionClient → adminActionClient)
5. getClaims() vs getUser() performance trade-off?

# Sample — athletica/rollout (own)

## Identity

| Field | Value |
|---|---|
| Name | rollout (Athletica admin) |
| Type | Next.js 16 + Supabase + Upstash Redis source tree |
| Version | 0.1.0 (per `package.json`) |
| Provenance | In-repo at `/home/lordwhitefire/current-project/athletica/rollout/` (NOT cloned — our own code) |
| Licence | N/A — own software |
| Size | ~1 MB |
| File count | 81 (excluding `.git/`, `node_modules/`, `.next/`) |

## Provenance handling

This is our own codebase. No clone — the source lives in our repo. We treat it
as read-only reference for the new single-app build.

## Layout (key files)

```
athletica/rollout/
  package.json                        name=rollout, Next 16.3.4, Supabase SSR + JS, Upstash
  src/
    middleware.ts                     (none — no edge middleware; gates are per-route)
    app/
      admin/
        layout.tsx                    bare wrapper (NOT the gate)
        products/layout.tsx           the SSR third-lock gate (requireAdmin → notFound)
        signin/page.tsx               Lock #2 check (validateDoorKey → notFound)
        signin/auth-view.tsx          client-side auth UI shell
      api/
        admin/
          auth/signin/route.ts        Supabase signInWithPassword
          auth/signup/route.ts        Lock #1: invite redemption + door-key issuance
          auth/signout/route.ts       signout
          products/route.ts           third-lock on every write endpoint
          products/[id]/route.ts     same pattern, per-resource
          media/...                   same pattern
    lib/
      auth/
        door-key.ts                   cookie config + token hashing (Lock #2 helpers)
        door-key-validate.ts          the sliding-session validator (Lock #2 brain)
        admin.ts                      requireAdmin + getAdminUser (Lock #3 brain)
      supabase/
        server.ts                     createAdminClient (service_role)
        route-client.ts               createRouteClient (user-scoped, RLS-enforced)
  supabase-rollout-schema.sql         the base schema
  supabase-rollout-schema-updates.sql incremental schema changes (box_contents, sizes, source, visitor_hash)
  supabase-rollout-rls-policies.sql   8 RLS policies across 3 tables
  supabase-rollout-admin-keys.sql     admin_access_keys table + its RLS
```

## Lab status

Not applicable. Own-software RE, static only.

## Handling rule

Treat as read-only reference for the new build. We may re-implement any pattern
here freely — it's our own code.

## Open triage questions for static analysis

1. **Lock #1 — invite code:** where stored? how validated? one-time? expiring?
2. **Lock #2 — door-key cookie:** what's it for? sliding renewal? hashed?
3. **Lock #3 — JWT role:** how set? how checked? fail-closed?
4. **RLS:** which tables? which policies? deny-by-default?
5. **Fail-silent rule:** why 404 not 401/403?
6. **Per-page gate pattern:** one-liner per route?

# ROLL-01 — Task Completion Report

## Status
✅ **DONE** — Schema + types for the Rollout system set up and committed (not pushed).

## What was done

1. **Created `rollout/` as a fresh Next.js 14+ app** (App Router, TypeScript, Tailwind, ESLint, `src/` dir, `@/*` alias, npm, `--no-git` to avoid a nested repo).
2. **Installed `@supabase/supabase-js`** — no Supabase CLI (types are manual, per task).
3. **Reused the existing Supabase project** (`mtudltsfcxvjjhmaztrp`) — one project, two schemas (`public` = Mature, `rollout` = Rollout).
4. **Created env files**:
   - `rollout/.env.local` — real values (NOT committed).
   - `rollout/.env.example` — placeholders (force-committed, since the app `.gitignore` excludes `.env*`).
5. **Wrote schema SQL** to `rollout/supabase-rollout-schema.sql` (run in the online SQL Editor by the owner).
6. **Schema created in the existing project** — `rollout` schema with `rollout.products` and `rollout.analytics` + 4 indexes + FK cascade.
7. **Wrote TypeScript types by hand** in `rollout/src/lib/database.types.ts`, under `Database.rollout` (not `Database.public`), with `Row`/`Insert`/`Update` for both tables plus JSONB sub-types (`ProductBenefit`, `ProductDetail`).
8. **Typechecked** — `npx tsc --noEmit` passes with no errors.
9. **Committed** as `feat(rollout): add Rollout app with rollout schema and types` (db7b310). **Not pushed.**

## Verification (types/schema)
- REST API against `rollout` schema returns `200` and the correct tables; `select=*` returns `[]` (tables exist, currently empty).
- No Mature tables or `Database.public` leakage in the Rollout types.

## ⚠️ Architecture notes — MUST be folded into the architecture (roll-arch design/specs)
These are project-level decisions made during execution that the original task SQL did **not** cover. They should be recorded in the architecture so later tasks (ROLL-02+ / ROLL-05+) are not blocked.

1. **RLS is enabled on `rollout.products` and `rollout.analytics`** (owner decision at execution time).
   - Consequence: with RLS on and **no policies yet**, the **anon key returns zero rows** for the public-facing app. The `service_role` key bypasses RLS.
   - **Action needed in a later task:** define RLS policies (e.g. anon read for `products`, anon insert for `analytics`) or document that admin writes go through `service_role` only.

2. **The `rollout` schema must be exposed to the Data API** (dashboard setting, not SQL).
   - Without it, PostgREST returns `PGRST106 Invalid schema: rollout`. This was fixed manually in the dashboard (Integrations → Data API → Exposed schemas → add `rollout`). Document this as a required dashboard step for the single-project/two-schema decision.

3. **Explicit grants are required for the `rollout` schema** (2026 Supabase change: tables are no longer auto-granted to the API roles).
   - `GRANT` statements were run in the editor for `anon`, `authenticated`, `service_role` on schema + tables + sequences + default privileges.
   - **Security caveat (RLS interplay):** the grant gives API roles access to the schema/tables, but RLS is the actual row filter. With RLS on and no policies, anon still sees nothing. Keep grants minimal and pair them with policies.

4. **`.env.example` had to be force-committed** (`git add -f`) because the Next.js scaffold `.gitignore` ignores `.env*`. This is a deviation from the scaffold default but required to satisfy the task's "`.env.example` committed" benchmark.

## Not done (per task scope)
- No UI pages (ROLL-05+).
- No services (ROLL-02+).
- No Mature data migration (fresh Rollout data).
- No second Supabase project.
- No Vercel project (ROLL-09).
- No push (owner reviews and pushes).

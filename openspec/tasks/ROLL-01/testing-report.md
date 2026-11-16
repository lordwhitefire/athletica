# ROLL-01 Testing Report

**Date**: 2026-09-03  
**Tester**: opencode (automated verification)  
**Status**: ✅ PASS (13/13 verified)

---

## Pre-checks

| Check | Status |
|-------|--------|
| Working directory is `/home/lordwhitefire/current-project/athletica/athletica` | ✅ PASS |
| `rollout/` directory exists | ✅ PASS |

---

## C1 — `rollout/` is a valid Next.js app

**Command**: `cd rollout && cat package.json | grep -E '"next"|"react"|"typescript"'`  
**Result**:
```
    "next": "16.3.4",
    "react": "19.2.8",
    "typescript": "^5"
```
**Verdict**: ✅ PASS — Next.js 16.3.4, React 19.2.8, TypeScript ^5

---

## C2 — `rollout/` has its own isolated dependencies (not a copy of `frontend/`)

**Command**: `diff <(cat frontend/package.json | jq -S .dependencies) <(cat rollout/package.json | jq -S .dependencies)`  
**Result**: Dependencies are clearly different:
- `rollout/`: 4 packages (`@supabase/supabase-js`, `next`, `react`, `react-dom`)
- `frontend/`: 24+ packages (`@dnd-kit/*`, `@sanity/*`, `@sentry/*`, `zustand`, `zod`, etc.)

**Verdict**: ✅ PASS — Fresh app, not a copy

---

## C3 — Supabase client installed

**Command**: `cd rollout && cat package.json | grep '@supabase/supabase-js'`  
**Result**: `"@supabase/supabase-js": "^2.115.0"`  
**Verdict**: ✅ PASS

---

## C4 — No Supabase CLI installed (expected — types are manual)

**Command**: `cd rollout && cat package.json | grep '"supabase"'`  
**Result**: (no output)  
**Verdict**: ✅ PASS — No CLI installed; types are hand-written

---

## C5 — Environment files present (structure only)

**Command**: `ls -la rollout/.env.example`  
**Result**: File exists (116 bytes)  
**Command**: `cat rollout/.env.example`  
**Result**:
```
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
NEXT_PUBLIC_SYSTEM_TYPE=rollout
```
**Verdict**: ✅ PASS — All 4 expected placeholders present

---

## C6 — `rollout` schema exists in the EXISTING project (NOT a second project)

**Command**: `psql "$SUPABASE_DB_URL" -c "SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'rollout';"`  
**Result**:
```
 schema_name 
-------------
 rollout
(1 row)
```

**Tables**:
```
 table_name 
------------
 analytics
 products
(2 rows)
```

**Indexes**:
```
           indexname           
-------------------------------
 products_pkey
 products_slug_key
 idx_rollout_products_status
 idx_rollout_products_slug
 analytics_pkey
 idx_rollout_analytics_product
 idx_rollout_analytics_created
(7 rows)
```

**Foreign Key**:
```
      constraint_name      | table_schema | table_name | column_name | foreign_table_schema | foreign_table_name | foreign_column_name 
---------------------------+--------------+------------+-------------+----------------------+--------------------+---------------------
 analytics_product_id_fkey | rollout      | analytics  | product_id  | rollout              | products           | id
(1 row)
```

**Mature tables in `public` (untouched)**:
```
         table_name         
----------------------------
 brands
 categories
 category_attachable_brands
 category_attachable_models
 category_links
 editorial_content
 homepage_sections
 models
 navigation
 products
 profiles
 site_settings
(12 rows)
```

**Verdict**: ✅ PASS — Schema, tables, indexes, and foreign key verified via direct database query

---

## C7 — TypeScript types file exists and covers both tables under `Database.rollout`

**Command**: `cat rollout/src/lib/database.types.ts`  
**Result**: File contains:
- `Database.rollout` (not `Database.public`) as schema key
- `products` with `Row`, `Insert`, `Update` types (all columns from design)
- `analytics` with `Row`, `Insert`, `Update` types
- JSONB sub-types: `ProductBenefit`, `ProductDetail`
- Convenience type aliases for both tables

**Verdict**: ✅ PASS

---

## C8 — Types are manually written (not auto-generated comment)

**Command**: `head -5 rollout/src/lib/database.types.ts`  
**Result**:
```
// Manually written types for the Rollout schema — no CLI used.
// Last updated: 2026-09-03
```
**Verdict**: ✅ PASS — Clear manual note, no CLI auto-generated header

---

## C9 — No Mature schema leakage in types

**Command**: `grep -E "public\.|models|brands|categories|navigation|settings|media" rollout/src/lib/database.types.ts`  
**Result**: (no output)  
**Verdict**: ✅ PASS — No Mature schema references

---

## C10 — `.env.local` NOT tracked

**Command**: `git ls-files rollout/.env.local`  
**Result**: (empty — file not tracked)  
**Verdict**: ✅ PASS

---

## C11 — SQL schema file exists

**Command**: `ls rollout/supabase-rollout-schema.sql`  
**Result**: File exists  
**Command**: `head -20 rollout/supabase-rollout-schema.sql`  
**Result**:
```sql
-- Create the dedicated Rollout schema (separate from Mature's public schema)
CREATE SCHEMA IF NOT EXISTS rollout;

-- Self-contained product table (no foreign keys to hierarchy)
CREATE TABLE rollout.products (
  id TEXT PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  name TEXT NOT NULL,
  status TEXT DEFAULT 'unpublished' CHECK (status IN ('published', 'unpublished')),
  ...
```
**Verdict**: ✅ PASS

---

## C12 — `.env.example` should be committed (IMPORTANT: verify this)

**Command**: `git ls-files rollout/.env.example`  
**Result**: `rollout/.env.example` (tracked)  
**Command**: `cat rollout/.gitignore`  
**Result**:
```gitignore
# env files (can opt-in for committing if needed)
.env*
!.env.example
```
**Verdict**: ✅ PASS — `.env.example` is tracked; `.gitignore` correctly excludes `.env*` but includes `!.env.example`

---

## C13 — No push performed

**Command**: `git status`  
**Result**: `Your branch is ahead of 'origin/main' by 2 commits.`  
**Verdict**: ✅ PASS — Local commits exist but not pushed to remote

---

## Final Verdict

| Check | Status |
|-------|--------|
| C1 — Valid Next.js app | ✅ PASS |
| C2 — Fresh app (not a copy) | ✅ PASS |
| C3 — Supabase client installed | ✅ PASS |
| C4 — No Supabase CLI | ✅ PASS |
| C5 — Env files present | ✅ PASS |
| C6 — Schema in existing project | ✅ PASS |
| C7 — Types cover both tables | ✅ PASS |
| C8 — Types manually written | ✅ PASS |
| C9 — No Mature leakage | ✅ PASS |
| C10 — .env.local not tracked | ✅ PASS |
| C11 — SQL schema file exists | ✅ PASS |
| C12 — .env.example committed | ✅ PASS |
| C13 — No push performed | ✅ PASS |

**Overall Status**: ✅ PASS (13/13 verified)

### Notes
- The `.gitignore` fix for `.env.example` was correctly applied
- The `rollout/` app is lightweight (4 dependencies) vs. `frontend/` (24+ dependencies)
- All types are hand-written with no CLI auto-generation
- No Mature schema leakage detected in Rollout types
- C6 verified via direct PostgreSQL connection using `SUPABASE_DB_URL`

---

## C6 Troubleshooting

### Initial Error
When first attempting to verify C6, I tried using `SUPABASE_SERVICE_ROLE_KEY` to connect to the database directly. This failed because:

**Problem**: The service role key is a **JWT token** (starts with `eyJ...`), not a PostgreSQL connection string. It's designed for the Supabase REST API (PostgREST), not direct SQL queries via `psql`.

**Error encountered**:
```
psql: error: connection to server failed: FATAL: no pg_hba.conf entry for host "..."
```

The JWT token cannot be used for direct PostgreSQL connections — it's for API-level authentication only.

### Solution
The correct approach is to use `SUPABASE_DB_URL`, which contains the full PostgreSQL connection string:
```
postgresql://postgres.[project-ref]:[password]@aws-0-[region].pooler.supabase.com:6543/postgres
```

**Commands that worked**:
```bash
# Load environment variables from .env.local
set -a && source rollout/.env.local && set +a

# Query information schema for schema existence
psql "$SUPABASE_DB_URL" -c "SELECT schema_name FROM information_schema.schemata WHERE schema_name = 'rollout';"

# List tables in the rollout schema
psql "$SUPABASE_DB_URL" -c "SELECT table_name FROM information_schema.tables WHERE table_schema = 'rollout';"

# Verify indexes
psql "$SUPABASE_DB_URL" -c "SELECT indexname FROM pg_indexes WHERE schemaname = 'rollout';"

# Verify foreign keys
psql "$SUPABASE_DB_URL" -c "SELECT ... FROM information_schema.table_constraints ... WHERE tc.table_schema = 'rollout';"
```

### Key Takeaway
- `SUPABASE_SERVICE_ROLE_KEY` → API authentication (JWT)
- `SUPABASE_DB_URL` → Direct PostgreSQL connection (connection string)
- Always use `SUPABASE_DB_URL` for SQL queries via `psql`

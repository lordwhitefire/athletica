# DATA-SEED-01: Testing Task — Product ingestion via Rainforest API

This document is for the tester. Run these checks **after** the implementation task is claimed done. The tester did **not** do the building; verify from scratch.

**Read-only rule:** do not edit files, install packages, run SQL, commit, or push. Commands are allowed only with the owner's explicit approval. Do not "fix" anything you find — report it.

## Pre-checks

1. Confirm the working directory is the repository root:
   `/home/lordwhitefire/current-project/athletica/athletica`
2. Read `openspec/tasks/DATA-SEED-01/task.md` so you know the exact scope.
3. Confirm `developer-workspace/DATA-SEED-01/seed.ts` exists.

## Checks

### C1 — Script reads API key from env, not hardcoded

Read `developer-workspace/DATA-SEED-01/seed.ts`.

Pass only when:

- `RAIN_FOREST_API_KEY` is read from `process.env.RAIN_FOREST_API_KEY`
- No hardcoded API key string appears in the file
- No hardcoded product data (names, ASINs, prices) — all values come from API responses

### C2 — Products inserted via createProductAdmin

Read the script.

Pass only when:

- `createProductAdmin` from `@/lib/products/product-service` is used for insertion
- Products are inserted with `status: 'published'`
- Products have non-null `asin`
- Slugs are generated from product names (not hardcoded)

### C3 — ~5 products inserted

With owner approval, run:

```bash
npx supabase db query --db-url "$SUPABASE_DB_URL" "SELECT id, slug, name, status, asin FROM rollout.products;"
```

Pass only when:

- ~5 rows exist (not zero, not dozens)
- All rows have `status = 'published'`
- All rows have non-null `asin`
- All rows have unique `slug`

### C4 — No app code changed

List changed files. Pass only when:

- No files under `rollout/src/` were modified
- No files under `rollout/app/` were modified
- No commits were made
- The seed script lives only under `developer-workspace/DATA-SEED-01/`

### C5 — TypeScript passes (if script is type-checked)

With owner approval, run:

```bash
cd /home/lordwhitefire/current-project/athletica/athletica/rollout
npx tsc --noEmit
```

Pass only when it exits with code 0. If the seed script isn't part of the tsconfig, this check is N/A — note it in the report.

## Verdict

Return exactly one of:

- **PASS** — every check above passed.
- **FAIL** — one or more checks failed. List the check number, the file and line, what was expected, and what was found. Do not fix it.

Also include a short note on whether the database now has enough published products with ASINs to proceed to ROLL-14.

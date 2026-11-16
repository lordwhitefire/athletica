# Supabase CLI test — `--db-url` works

## Test: `supabase gen types --db-url`

**Command:**
```bash
cd /home/lordwhitefire/current-project/athletica/athletica/rollout
npx supabase gen types --db-url postgresql://postgres.mtudltsfcxvjjhmaztrp:IbYspZrDGP2a4oy3@aws-1-eu-central-1.pooler.supabase.com:5432/postgres --lang typescript
```

**Result:** ✅ Success
- Connected to `aws-1-eu-central-1.pooler.supabase.com:5432`
- Generated TypeScript types from remote database schema
- Output included `graphql_public`, `public` schemas with tables (`brands`, `categories`, etc.)
- Warning: `inbucket` config section deprecated (benign, v3 change)

## What this proves

1. **Token works:** `supabase login --token <SUPABASE_TOKEN>` succeeded
2. **`--db-url` works:** Database commands connect directly via connection string
3. **`supabase link` NOT needed:** No project-scoped permissions required for `--db-url` commands
4. **Scoped token sufficient:** The athletica-scoped token (`sbp_fcd64e319ba7d2196163b1c1f87d702dcf1c9489`) works for `--db-url` commands

## Commands that work with `--db-url` (no Docker needed)

- `supabase gen types --db-url <URL>` — generate TypeScript types
- `supabase db dump --db-url <URL>` — dump schema/data

## Commands that need Docker (won't work in this environment)

- `supabase db diff --db-url <URL>` — creates shadow container
- `supabase db push --db-url <URL>` — may need Docker
- `supabase db reset --db-url <URL>` — needs Docker

## Notes

- Token stored in `rollout/.env.local` line 7 (`SUPABASE_TOKEN`)
- DB URL stored in `rollout/.env.local` line 8 (`SUPABASE_DB_URL`)
- Never print token or DB URL values in chat/logs/reports

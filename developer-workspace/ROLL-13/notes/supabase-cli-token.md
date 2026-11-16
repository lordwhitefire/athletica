# Supabase CLI with scoped token — notes

## Situation

- Supabase CLI v2.122.0 installed in `rollout/` as dev dependency (`npm install supabase --save-dev`)
- Logged in via `supabase login --token <SUPABASE_TOKEN>` → ✅ "You are now logged in."
- `SUPABASE_TOKEN` is stored in `rollout/.env.local` (line 7, scoped to athletica project only)

## Key finding — `supabase link` is NOT required

The Supabase skill and official docs confirm:

- `supabase link` requires **Project Settings → Read**, **API Keys → Read**, and **API Key Secrets → Read** permissions
- A project-scoped token may not have these; that's fine — **you don't need `supabase link`**

## Use `--db-url` instead

Database commands work with `--db-url` and `SUPABASE_DB_PASSWORD` — these bypass the token's project-scoped permissions entirely:

```bash
cd /home/lordwhitefire/current-project/athletica/athletica/rollout

# Push local migrations to remote project
npx supabase db push --db-url <SUPABASE_DB_URL>

# Diff local schema against remote
npx supabase db diff --db-url <SUPABASE_DB_URL>

# Reset local database
npx supabase db reset --local
```

Your `SUPABASE_DB_URL` is in `rollout/.env.local`:
`postgresql://postgres.mtudltsfcxvjjhmaztrp:IbYspZrDGP2a4oy3@aws-1-eu-central-1.pooler.supabase.com:5432/postgres`

## What failed

- `supabase projects list` → needs account-wide `projects_read` (token is project-scoped, doesn't have it)
- `supabase link --project-ref mtudltsfcxvjjhmaztrp` → needs `api_gateway_keys_read` (token lacks it)

Neither is required. Use `--db-url` for database operations.

## Summary

The token works with the CLI. Just don't run `supabase link` — use `--db-url` instead.

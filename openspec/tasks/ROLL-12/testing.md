# ROLL-12: Testing Task — Schema scoping + analytics foundation

This document is for the tester. Run these checks **after** the implementation task is claimed done. The tester did **not** do the building; verify from scratch.

**Read-only rule:** do not edit files, install packages, run SQL, commit, or push. Commands are allowed only with the owner's explicit approval. Do not "fix" anything you find — report it.

## Pre-checks

1. Confirm the working directory is the repository root:
   `/home/lordwhitefire/current-project/athletica/athletica`
2. Confirm these files exist:
   - `rollout/src/lib/supabase/server.ts`
   - `rollout/src/lib/database.types.ts`
   - `rollout/src/lib/analytics/analytics-service.ts`
   - `rollout/src/lib/analytics/source.ts`
   - `rollout/src/lib/analytics/visitor.ts`
   - `rollout/src/lib/analytics/bots.ts`
   - `rollout/src/lib/analytics/rate-limit.ts`
   - `rollout/supabase-rollout-schema-updates.sql`
   - `rollout/.env.example`
   - `rollout/package.json`
3. Read `openspec/tasks/ROLL-12/task.md` so you know the exact scope.

## Checks

### C1 — Both Supabase clients select the `rollout` schema

Read `rollout/src/lib/supabase/server.ts`.

Pass only when:

- `createAdminClient()` passes `{ db: { schema: 'rollout' } }`.
- `createPublicClient()` passes `{ db: { schema: 'rollout' } }`.
- Both use the scoped generic, e.g. `createClient<Database, 'rollout'>(...)`.
- There is **no** bare `createClient<Database>(...)` left.
- There is no `.schema('public')` fallback.
- No other Supabase behavior was changed (same URL/key variables, same exports).

Why this matters: `@supabase/supabase-js` defaults to the `public` schema. Without this, the Production app can read the Development app's data.

### C2 — SQL adds nullable `source` and `visitor_hash`

Read `rollout/supabase-rollout-schema-updates.sql`.

Pass only when:

- `rollout.analytics` gets `source TEXT` with a check allowing only `'instagram'` and `'whatsapp'`.
- `rollout.analytics` gets `visitor_hash TEXT`.
- Neither new column is `NOT NULL`.
- Both indexes exist:
  - `idx_rollout_analytics_source`
  - `idx_rollout_analytics_visitor`
- Within the new ROLL-12 block, only `rollout.analytics` is altered. The existing `rollout.products` statements from ROLL-06/07 are allowed.
- No `DROP`, `TRUNCATE`, or data deletion statement exists.
- The SQL block is written for the owner to run in the Supabase SQL editor. The owner has confirmed it was applied and that both columns exist. The builder must not have run it.

**Do not run the SQL yourself.**

### C3 — Database types include the new columns

Read `rollout/src/lib/database.types.ts`.

Pass only when:

- `export type AnalyticsSource = 'instagram' | 'whatsapp';` exists.
- `rollout.analytics.Row` has:
  - `source: AnalyticsSource | null;`
  - `visitor_hash: string | null;`
- `rollout.analytics.Insert` has both as optional nullable fields.
- `Update` is still `Partial<Insert>`.
- No `any` was introduced.

### C4 — Source normalization is exact

Read `rollout/src/lib/analytics/source.ts`.

Pass only when the exported function:

- accepts `string | null | undefined`;
- trims and lowercases the input;
- returns `'instagram'` for `instagram`;
- returns `'whatsapp'` for `whatsapp`;
- returns `null` for everything else, including empty string, `'ig'`, `'wa'`, `'Instagram '` after trim is handled, and `null`;
- does not throw for bad input;
- imports only the type, not runtime code.

### C5 — Visitor hashing is daily, salted, and does not store the raw IP

Read `rollout/src/lib/analytics/visitor.ts`.

Pass only when:

- `getClientIp` reads the first `x-forwarded-for` value, then falls back to `x-real-ip`, then `null`.
- `hashVisitor` uses `createHash('sha256')` from `node:crypto`.
- The hashed input is exactly:
  `ip + "\n" + (userAgent ?? "") + "\n" + date.toISOString().slice(0, 10) + "\n" + salt`
- The result is hex.
- `getVisitorHash` reads `ANALYTICS_HASH_SALT` at call time.
- A missing salt throws a clear error (`ANALYTICS_HASH_SALT is not set`) rather than silently using a default.
- No raw IP is logged or written to the database. `getClientIp` may return it to the hasher; it must not be persisted or logged.
- No raw IP appears in an error message.
- The module is not imported by a client component.

### C6 — Bot detection is conservative

Read `rollout/src/lib/analytics/bots.ts`.

Pass only when:

- `isBotUserAgent(null)` and `isBotUserAgent('')` return `true`.
- Matching is case-insensitive.
- Known bots are skipped, including at least:
  - `googlebot`
  - `bingbot`
  - `crawler` / `crawl`
  - `spider`
  - `slurp`
  - `facebookexternalhit`
  - `twitterbot`
  - `linkedinbot`
  - `slackbot`
  - `discordbot`
  - `telegrambot`
  - `uptimerobot`
  - `pingdom`
  - `betteruptime`
  - `vercel-screenshot`
  - `headlesschrome`
  - `lighthouse`
  - `pagespeed`
- A normal Chrome, Safari, or Firefox UA returns `false`.
- An Instagram in-app browser UA returns `false`.
- A WhatsApp in-app browser UA returns `false`.
- `instagram` and `whatsapp` are **not** in the bot pattern list.

### C7 — Rate limiting is configured correctly and fails open

Read `rollout/src/lib/analytics/rate-limit.ts`, `rollout/package.json`, and the lockfile.

Pass only when:

- `@upstash/ratelimit` and `@upstash/redis` are in `dependencies`.
- `package.json` records the installed versions: `@upstash/ratelimit` `^2.2.0` and `@upstash/redis` `^1.40.0` (or a compatible resolution recorded in the lockfile).
- The Builder did not change these versions or run `npm audit fix`.
- The limiter uses `Ratelimit.slidingWindow(30, '60 s')`.
- The prefix is `rollout:analytics`.
- The key is the visitor hash, not the raw IP.
- The Redis client is created lazily inside the function, not at module load.
- If `UPSTASH_REDIS_REST_URL` or `UPSTASH_REDIS_REST_TOKEN` is missing:
  - it logs one warning;
  - it returns `{ success: true }`;
  - it does not throw.
- If Upstash throws, it logs a generic error and returns `{ success: true }`.
- No secret is returned.
- No raw IP is used as a key or logged.

This is fail-open on purpose: analytics must never block the page or redirect. ROLL-09 makes the environment variables required in Production.

### C8 — Analytics service keeps existing callers compiling

Read `rollout/src/lib/analytics/analytics-service.ts`.

Pass only when:

- `recordView(productId, source = null, visitorHash = null)` exists.
- `recordClick(productId, source = null, visitorHash = null)` exists.
- The inserts include `source` and `visitor_hash: visitorHash`.
- Existing one-argument callers still compile.
- No bot check or rate-limit check was added inside this service.
- The existing admin query functions were not changed.

### C9 — Environment example is clean

Read `rollout/.env.example`.

Pass only when it contains exactly these keys with blank values:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SANITY_WRITE_TOKEN=
ANALYTICS_HASH_SALT=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

Pass only when:

- `NEXT_PUBLIC_SYSTEM_TYPE` is gone.
- `ANALYTICS_HASH_SALT` is **not** prefixed with `NEXT_PUBLIC_`.
- `UPSTASH_REDIS_REST_TOKEN` is **not** prefixed with `NEXT_PUBLIC_`.
- No real secret value is present.

### C10 — TypeScript passes

With owner approval, run:

```bash
cd /home/lordwhitefire/current-project/athletica/athletica/rollout
npx tsc --noEmit
```

Pass only when it exits with code 0. If it fails, list every error with file and line. Do not fix anything.

### C11 — Scope check

List the changed files. The allowed set is:

- `rollout/supabase-rollout-schema-updates.sql`
- `rollout/src/lib/database.types.ts`
- `rollout/src/lib/supabase/server.ts`
- `rollout/src/lib/analytics/source.ts`
- `rollout/src/lib/analytics/visitor.ts`
- `rollout/src/lib/analytics/bots.ts`
- `rollout/src/lib/analytics/rate-limit.ts`
- `rollout/src/lib/analytics/analytics-service.ts`
- `rollout/.env.example`
- `rollout/package.json`
- `rollout/package-lock.json`

Fail if the builder changed:

- the public product page;
- the `/go` route;
- any admin page or auth file;
- price UI;
- Sentry config;
- test setup;
- any unrelated file.

A justified import/type change may be accepted only if the tester explains it in the report. “Justified” does not include opportunistic refactors.

### C12 — Privacy and secret check

Pass only when:

- The database write path stores `visitor_hash`, not an IP.
- No raw IP is logged.
- The salt and Upstash token are server-only names.
- `.env.example` contains no real values.
- No secret appears in source code, comments, or test fixtures.
- The rate-limit warning does not print the token or URL.

### C13 — Owner actions are clearly recorded

Confirm the implementation report states:

- the SQL was applied by the owner, not the builder;
- the owner verified `source` and `visitor_hash` exist and are nullable;
- the developer agent generated `ANALYTICS_HASH_SALT` in `rollout/.env.local` and did not commit it;
- the owner supplied the Upstash URL/token, or the report says they are still missing and the limiter fails open;
- the owner approved the two Upstash packages;
- the builder did not commit or push.

The SQL is already applied. If the migration file and the live schema disagree, fail. The remaining owner action is the Upstash URL/token; the salt is generated by the developer.

## Explicitly out of scope for this test

Do not test or require:

- live Supabase queries;
- live Upstash rate-limit behavior;
- public page view recording;
- `/go` click recording;
- source-split analytics UI;
- admin auth;
- price behavior;
- Sentry;
- Vitest or any new test framework.

Those belong to ROLL-08 and ROLL-13 through ROLL-18. This task is the foundation only.

## Verdict

Return exactly one of:

- **PASS** — every check above passed, with the owner actions recorded.
- **FAIL** — one or more checks failed. List the check number, the file and line, what was expected, and what was found. Do not fix it.

Also include a short note on anything the owner must still do before ROLL-13 can start.

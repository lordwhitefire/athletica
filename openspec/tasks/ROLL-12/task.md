# ROLL-12: Scope Supabase to `rollout`; add source + visitor hash

## What and why

The Production app must never read the Development app's data. Today both Supabase clients are created without a schema, so `@supabase/supabase-js` defaults to `public` — the Development app's schema. Fix this **before any feature work**.

This task also lays the measurement foundation for ROLL-13/14:

- `rollout.analytics` gets `source` (`instagram` / `whatsapp` / `NULL`) and `visitor_hash` (daily SHA-256).
- The app gets helpers for source normalization, client IP, visitor hashing, bot detection, and Upstash rate limiting.

No customer page or redirect wiring happens here. ROLL-13/14 call these helpers.

## Project rules

Read `rollout/AGENTS.md` before starting. This Next.js version has breaking changes; if you touch a Next.js file, read the relevant guide in `node_modules/next/dist/docs/` first. This task's helpers are plain TypeScript/Node, so no Next.js API should be needed.

## What exists

- `rollout/src/lib/supabase/server.ts` — `createAdminClient()` and `createPublicClient()` both call `createClient<Database>(url, key)`, with no `db.schema`.
- `rollout/src/lib/database.types.ts` — `rollout.analytics` Row/Insert only has `id`, `product_id`, `event_type`, `created_at`.
- `rollout/supabase-rollout-schema-updates.sql` — product-only updates (`box_contents`, `sizes`, `sizes_detail`).
- `rollout/src/lib/analytics/analytics-service.ts` — `recordView(productId)` and `recordClick(productId)`; no source/hash.
- `rollout/.env.example` — legacy `NEXT_PUBLIC_SYSTEM_TYPE=rollout`; no analytics salt or Upstash variables.
- `rollout/package.json` — Upstash packages are now installed (see Dependencies below).

## Decisions

| # | Decision | Resolution |
|---|----------|------------|
| 1 | Schema scoping | Both clients use `createClient<Database, 'rollout'>(url, key, { db: { schema: 'rollout' } })`. No bare `createClient<Database>`. |
| 2 | Source values | `normalizeSource()` returns `'instagram'`, `'whatsapp'`, or `null`. Case- and space-insensitive. Any other value → `null`. |
| 3 | Visitor hash | SHA-256 of `ip + "\n" + userAgent + "\n" + YYYY-MM-DD (UTC) + "\n" + ANALYTICS_HASH_SALT`, hex output. No raw IP stored or logged. |
| 4 | Hash config | `ANALYTICS_HASH_SALT` is server-only. Missing salt → throw a clear error; the caller catches it so the page never breaks. |
| 5 | Client IP | First `x-forwarded-for` value, else `x-real-ip`, else `null`. |
| 6 | Bot detection | Skip known crawler / preview / uptime / headless user agents. Treat Instagram and WhatsApp in-app browsers as real visitors. Missing or empty UA → bot. |
| 7 | Rate limit | Upstash `Ratelimit.slidingWindow(30, '60 s')`, prefix `rollout:analytics`, key = visitor hash. If Upstash env is absent, warn once and allow (fail-open); ROLL-09 makes the env required in Production. |
| 8 | Service signature | `recordView(productId, source = null, visitorHash = null)` and `recordClick(...)`. Existing one-argument callers keep compiling. No bot/rate-limit logic inside the service. |

## Dependencies (owner gate — cleared)

The owner approved the install. The packages are now in `rollout/package.json` and the lockfile:

- `@upstash/ratelimit` `^2.2.0` — npm resolved the `^2.0.8` request to the latest compatible release.
- `@upstash/redis` `^1.40.0` — npm resolved the `^1.38.0` request to the latest compatible release.

Do not reinstall, downgrade, or change these versions as part of this task. If `node_modules` is missing, the owner runs `npm ci` in `rollout`. If the packages are missing from `package.json`, stop and report.

**Audit note:** `npm install` reported 7 vulnerabilities (2 moderate, 4 high, 1 critical). Do **not** run `npm audit fix` or `npm audit fix --force` in this task; that is a separate owner decision.

## Steps (in order)

Run from the repository root: `/home/lordwhitefire/current-project/athletica/athletica`.

### 1. SQL — add the two columns and indexes

Append to `rollout/supabase-rollout-schema-updates.sql`:

```sql
-- ROLL-12: source attribution + daily visitor hash.
ALTER TABLE rollout.analytics
  ADD COLUMN IF NOT EXISTS source TEXT
  CHECK (source IN ('instagram', 'whatsapp'));

ALTER TABLE rollout.analytics
  ADD COLUMN IF NOT EXISTS visitor_hash TEXT;

CREATE INDEX IF NOT EXISTS idx_rollout_analytics_source
  ON rollout.analytics(source);

CREATE INDEX IF NOT EXISTS idx_rollout_analytics_visitor
  ON rollout.analytics(visitor_hash);
```

`source` and `visitor_hash` are nullable. Do not change the four RLS policies. **The builder does not run this SQL.** The owner has already applied this exact block in the Supabase SQL editor and verified both columns exist (`source` text YES, `visitor_hash` text YES). The Builder still appends the block to the migration file so the repository records what was run.

### 2. Types — `rollout/src/lib/database.types.ts`

Add:

```ts
export type AnalyticsSource = 'instagram' | 'whatsapp';
```

In `rollout.analytics.Row`, add:

```ts
source: AnalyticsSource | null;
visitor_hash: string | null;
```

In `rollout.analytics.Insert`, add:

```ts
source?: AnalyticsSource | null;
visitor_hash?: string | null;
```

`Update` stays `Partial<Insert>`. Bump the header comment date.

### 3. Scope both clients — `rollout/src/lib/supabase/server.ts`

Both functions must select `rollout` explicitly:

```ts
return createClient<Database, 'rollout'>(supabaseUrl, supabaseServiceKey, {
  db: { schema: 'rollout' },
});
```

```ts
return createClient<Database, 'rollout'>(supabaseUrl, supabaseAnonKey, {
  db: { schema: 'rollout' },
});
```

There must be **zero** bare `createClient<Database>(...)` calls left in this file. Do not change any other Supabase behavior.

### 4. Helpers — create four files under `rollout/src/lib/analytics/`

#### `source.ts`

```ts
import type { AnalyticsSource } from '@/lib/database.types';

export function normalizeSource(
  value: string | null | undefined
): AnalyticsSource | null;
```

Rules: trim, lowercase; `instagram` → `instagram`; `whatsapp` → `whatsapp`; everything else (including empty, `ig`, `wa`, unknown) → `null`.

#### `visitor.ts`

```ts
export function getClientIp(headers: Headers): string | null;
export function hashVisitor(
  ip: string,
  userAgent: string | null,
  date: Date,
  salt: string
): string;
export function getVisitorHash(
  ip: string,
  userAgent: string | null,
  date?: Date
): string;
```

- `getClientIp`: first `x-forwarded-for` value (split on `,`, trim), else `x-real-ip`, else `null`.
- `hashVisitor`: pure; `createHash('sha256')` from `node:crypto`; exact input `ip + '\n' + (userAgent ?? '') + '\n' + date.toISOString().slice(0, 10) + '\n' + salt`; return hex.
- `getVisitorHash`: reads `process.env.ANALYTICS_HASH_SALT`; if missing, throw `new Error('ANALYTICS_HASH_SALT is not set')`; otherwise delegates to `hashVisitor`.
- Never log or store the raw IP. `getClientIp` returns it only to the hasher; do not write it to the database or a log.

#### `bots.ts`

```ts
export function isBotUserAgent(userAgent: string | null): boolean;
```

- Missing/empty → `true`.
- Skip known crawlers/bots (`bot`, `crawl`, `spider`, `slurp`, `bingpreview`, `googlebot`, `headlesschrome`, `lighthouse`, `pagespeed`), social preview fetchers (`facebookexternalhit`, `twitterbot`, `linkedinbot`, `slackbot`, `discordbot`, `telegrambot`), uptime/monitoring (`uptimerobot`, `pingdom`, `betteruptime`, `vercel-screenshot`), and obvious `preview` user agents.
- Do **not** skip `Instagram` or `WhatsApp` in-app browser UAs. A real Instagram/WhatsApp browser UA must return `false`.
- Normal desktop/mobile Chrome/Safari/Firefox → `false`.

#### `rate-limit.ts`

```ts
export interface RateLimitResult {
  success: boolean;
  reset?: number;
}

export async function checkAnalyticsRateLimit(
  visitorHash: string
): Promise<RateLimitResult>;
```

- Use `Ratelimit` from `@upstash/ratelimit` and `Redis` from `@upstash/redis`.
- `Ratelimit.slidingWindow(30, '60 s')`, prefix `rollout:analytics`, key = `visitorHash`.
- Build the Redis client lazily inside the function, not at module load.
- If `UPSTASH_REDIS_REST_URL` or `UPSTASH_REDIS_REST_TOKEN` is missing: `console.warn` once and return `{ success: true }`.
- If Upstash throws: log a generic error and return `{ success: true }` (analytics must never block the page or redirect).
- Do not log the token or the REST URL.
- No secret in the returned value.

### 5. Analytics service — `rollout/src/lib/analytics/analytics-service.ts`

Change the signatures to:

```ts
export async function recordView(
  productId: string,
  source: AnalyticsSource | null = null,
  visitorHash: string | null = null
): Promise<void>
```

```ts
export async function recordClick(
  productId: string,
  source: AnalyticsSource | null = null,
  visitorHash: string | null = null
): Promise<void>
```

Insert `source` and `visitor_hash: visitorHash` alongside `product_id` and `event_type`. One-argument callers must still compile. Do not add bot/rate-limit calls here; ROLL-13/14 enforce them at the page/redirect boundary.

### 6. Env example — `rollout/.env.example`

Replace the file contents with:

```env
NEXT_PUBLIC_SUPABASE_URL=
NEXT_PUBLIC_SUPABASE_ANON_KEY=
SUPABASE_SERVICE_ROLE_KEY=
SANITY_WRITE_TOKEN=
ANALYTICS_HASH_SALT=
UPSTASH_REDIS_REST_URL=
UPSTASH_REDIS_REST_TOKEN=
```

- Remove `NEXT_PUBLIC_SYSTEM_TYPE` entirely.
- Leave every value blank in `.env.example`; never add a real secret there.
- `ANALYTICS_HASH_SALT`: the developer agent generates a random value (for example, 32 random bytes as hex) and writes it to `rollout/.env.local`. Never commit or print it.
- `UPSTASH_REDIS_REST_URL` and `UPSTASH_REDIS_REST_TOKEN`: owner-supplied from the Upstash dashboard. The developer agent writes them to `.env.local` if the owner provides them. If they are not available yet, continue building; the rate limiter fails open until they are set.

**Current local state:** the owner has already added the two Upstash values to `rollout/.env.local`. `ANALYTICS_HASH_SALT` is not there yet; the developer agent still generates it. Vercel Production is a separate deployment step: the two Upstash values and a Production salt must be added there before deploy, or the developer agent adds them if it has Vercel access.

### 7. Verify

With owner approval:

```bash
cd /home/lordwhitefire/current-project/athletica/athletica/rollout
npx tsc --noEmit
```

Then confirm statically:

```bash
grep -R "createClient<Database>(" src/lib/supabase/server.ts   # expect no matches
grep -n "db: { schema: 'rollout' }" src/lib/supabase/server.ts # expect 2
grep -n "source\|visitor_hash" src/lib/database.types.ts src/lib/analytics/analytics-service.ts supabase-rollout-schema-updates.sql
grep -n "NEXT_PUBLIC_SYSTEM_TYPE" .env.example                  # expect no matches
```

### 8. Stop

Do **not** commit or push. The owner reviews and commits. Do **not** run the SQL. Do **not** install packages without approval.

## Benchmarks (what must be true after this change)

- Both `createAdminClient()` and `createPublicClient()` select the `rollout` schema; no Production query can fall back to `public`.
- `rollout.analytics` SQL has nullable `source` (check `instagram`/`whatsapp`) and `visitor_hash`, plus both indexes.
- TypeScript types include `source` and `visitor_hash` on Row and Insert.
- `normalizeSource(' Instagram ')` → `'instagram'`; `normalizeSource('WHATSAPP')` → `'whatsapp'`; `normalizeSource('ig')` → `null`; `normalizeSource(null)` → `null`.
- `hashVisitor` returns the same hash for the same IP + UA + UTC date + salt; a different date or salt changes it; the output is hex and does not contain the raw IP.
- `isBotUserAgent('Googlebot/2.1')` → `true`; `isBotUserAgent('UptimeRobot/2.0')` → `true`; an Instagram/WhatsApp in-app UA → `false`; normal Chrome → `false`; `null` → `true`.
- `checkAnalyticsRateLimit` returns `{ success: true }` when Upstash is not configured; with Upstash, the 31st call in a minute is limited.
- `recordView('p1')` and `recordClick('p1')` still compile; `recordView('p1', 'instagram', 'hash')` inserts both columns.
- `.env.example` has the three new placeholders and no `NEXT_PUBLIC_SYSTEM_TYPE`.
- `npx tsc --noEmit` passes.
- No customer page or `/go` route changes; no auth, price, Sentry, or test work.

## What is explicitly NOT done in this task

- No page or `/go` call-site wiring — ROLL-13/14.
- No source-split UI or analytics queries — ROLL-08.
- No admin auth — ROLL-15.
- No price changes — ROLL-16.
- No Sentry — ROLL-17.
- No Vitest suite — ROLL-18.
- No SQL execution and no dependency install without owner approval.

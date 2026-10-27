# ROLL-12 — Implementation Plan

## Overview

Scope both Supabase clients to the `rollout` schema and lay the analytics measurement
foundation: `source` and `visitor_hash` columns, TypeScript types, source normalization,
client-IP extraction, daily salted visitor hashing, bot detection, and fail-open Upstash
rate limiting. No page or `/go` wiring, no SQL execution, no dependency changes.

## Decisions carried in

| # | Decision |
|---|----------|
| 1 | Both clients: `createClient<Database, 'rollout'>(url, key, { db: { schema: 'rollout' } })`; zero bare calls. |
| 2 | `normalizeSource` trims/lowercases; only `instagram`/`whatsapp`; everything else `null`. |
| 3 | `hashVisitor` = SHA-256 hex of `ip + "\n" + (ua ?? "") + "\n" + YYYY-MM-DD + "\n" + salt`. |
| 4 | `getVisitorHash` reads `ANALYTICS_HASH_SALT` at call time; missing → throw `ANALYTICS_HASH_SALT is not set`. |
| 5 | `getClientIp`: first `x-forwarded-for` value, else `x-real-ip`, else `null`. |
| 6 | Bot detection: case-insensitive substring tokens; missing/empty UA = bot; Instagram/WhatsApp in-app browsers = real. |
| 7 | Rate limit: `slidingWindow(30, '60 s')`, prefix `rollout:analytics`, key = visitor hash, lazy **singleton**, warn once, fail open. |
| 8 | Service: `(productId, source = null, visitorHash = null)` on both recorders; one-arg callers keep compiling. |
| 9 | Missing IP stays a call-site concern: hash functions keep `ip: string`; no `'unknown'` sentinel. |
| 10 | Verification: `tsc` + one throwaway `/tmp` harness (no new packages); if it cannot run, report “static inspection only”. |
| 11 | Paperwork lives in-repo at `developer-workspace/ROLL-12/`; owner-directed 6 local commits, nothing pushed. |

## Dependency graph

```
T1 (SQL + types)
 ├── T2 (Supabase clients)
 ├── T3 (source + visitor)
 │     └── T5 (service + env)
 └── T4 (bots + rate limit)
        └── T6 (verify + report)  ← also depends on T2, T3, T5
```

## Task list

### Task 1 — SQL block + database types

**Description:** Append the owner-applied ROLL-12 SQL block verbatim to the migration file and
extend the hand-written database types with `AnalyticsSource`, `source`, and `visitor_hash`.

**Acceptance criteria:**
- [ ] Exact block appended after existing content; no other SQL changed; no `DROP`/`TRUNCATE`; RLS policies untouched.
- [ ] `export type AnalyticsSource = 'instagram' | 'whatsapp';` exists.
- [ ] `rollout.analytics.Row` has `source: AnalyticsSource | null` and `visitor_hash: string | null`.
- [ ] `Insert` has both optional and nullable; `Update` still `Partial<...Insert>`.
- [ ] Header `Last updated:` becomes 2026-10-27.
- [ ] No `any`; no other type changed; `product_id` untouched.

**Verification:** read-back against `task.md`; `rg` for the four SQL statements and both type fields; `tsc` at CP1.

**Dependencies:** none.

**Files:**
- `rollout/supabase-rollout-schema-updates.sql`
- `rollout/src/lib/database.types.ts`
- `developer-workspace/ROLL-12/plan.md` (this file)

**Size:** S (2 code files).

**Commit:** `ROLL-12 T1: add analytics source and visitor hash schema/types`

---

### Task 2 — Scope both Supabase clients

**Description:** Make runtime schema match the types so no Production query can fall back to `public`.

**Acceptance criteria:**
- [ ] `createAdminClient()` and `createPublicClient()` both pass `{ db: { schema: 'rollout' } }`.
- [ ] Both use `createClient<Database, 'rollout'>`.
- [ ] Zero bare `createClient<Database>(...)`; no `.schema('public')`.
- [ ] Same env vars, same exports, no other Supabase behavior changed.

**Verification:** `rg` checks (expect 0 bare, 2 schema options); `tsc` at CP1.

**Dependencies:** T1.

**Files:** `rollout/src/lib/supabase/server.ts`

**Size:** S (1 file).

**Commit:** `ROLL-12 T2: scope Supabase clients to rollout schema`

---

### Checkpoint 1 — after T1–T2

- [ ] `npx tsc --noEmit` exits 0.
- [ ] No bare `createClient<Database>(` in `server.ts`.
- [ ] Exactly two `db: { schema: 'rollout' }` occurrences.

---

### Task 3 — Source normalization + visitor hashing

**Description:** Create the two pure helpers used by ROLL-13/14.

**Acceptance criteria:**
- [ ] `normalizeSource(' Instagram ') === 'instagram'`; `'WHATSAPP' → 'whatsapp'`; `'ig'`, `''`, `null`, `undefined` → `null`.
- [ ] `getClientIp` takes first XFF value, falls back to `x-real-ip`, then `null`.
- [ ] `hashVisitor` uses `node:crypto` SHA-256; exact newline-delimited input; 64-char lowercase hex.
- [ ] Same inputs → same hash; different date or salt → different hash; output never contains the IP.
- [ ] `getVisitorHash` reads salt at call time and throws exactly `ANALYTICS_HASH_SALT is not set`.
- [ ] No logging of IP, UA, or salt anywhere in the module.

**Verification:** harness cases for all of the above; `tsc` at CP2.

**Dependencies:** T1.

**Files:**
- `rollout/src/lib/analytics/source.ts`
- `rollout/src/lib/analytics/visitor.ts`

**Size:** M (2 new files).

**Commit:** `ROLL-12 T3: add source normalization and visitor hashing`

---

### Task 4 — Bot detection + rate limiting

**Description:** Add conservative bot classification and the fail-open Upstash limiter.

**Acceptance criteria:**
- [ ] `isBotUserAgent(null)` and `isBotUserAgent('')` → `true`; matching case-insensitive.
- [ ] Tokens cover `bot`, `crawl`, `spider`, `slurp`, `bingpreview`, `googlebot`, `headlesschrome`, `lighthouse`, `pagespeed`, `facebookexternalhit`, `twitterbot`, `linkedinbot`, `slackbot`, `discordbot`, `telegrambot`, `uptimerobot`, `pingdom`, `betteruptime`, `vercel-screenshot`, `preview`.
- [ ] Normal Chrome/Safari/Firefox → `false`; Instagram and WhatsApp in-app UAs → `false`; neither name appears in the token list.
- [ ] Limiter: `slidingWindow(30, '60 s')`, prefix `rollout:analytics`, key = visitor hash.
- [ ] Lazy singleton: constructed on first call, cached per process, never at module load.
- [ ] Missing Upstash env → one warning, `{ success: true }`; Upstash throw → generic error, `{ success: true }`.
- [ ] No URL, token, or raw IP in logs or return value.

**Verification:** harness bot matrix + fail-open call with Upstash env unset; warning counted once; `tsc` at CP2.

**Dependencies:** T1 (sequenced after T3).

**Files:**
- `rollout/src/lib/analytics/bots.ts`
- `rollout/src/lib/analytics/rate-limit.ts`

**Size:** M (2 new files).

**Commit:** `ROLL-12 T4: add bot detection and analytics rate limiting`

---

### Checkpoint 2 — after T3–T4

- [ ] `npx tsc --noEmit` exits 0.
- [ ] Harness passes every source/hash/bot/fail-open case; output captured for the report.
- [ ] No secret or raw IP in any output.

---

### Task 5 — Analytics service, env example, salt

**Description:** Thread `source` and `visitorHash` through the recorders; clean the env template;
add a local development salt without exposing it.

**Acceptance criteria:**
- [ ] `recordView` / `recordClick` accept `(productId, source = null, visitorHash = null)`.
- [ ] Inserts include `source` and `visitor_hash: visitorHash`.
- [ ] `recordView('p1')`, `recordClick('p1')`, `recordView('p1', 'instagram', 'hash')` all compile.
- [ ] Admin query functions untouched; no bot/rate-limit calls inside the service.
- [ ] `.env.example` is exactly the seven blank keys; `NEXT_PUBLIC_SYSTEM_TYPE` gone.
- [ ] `ANALYTICS_HASH_SALT` appended once to `rollout/.env.local`, never printed, never committed.
- [ ] `.env.local` proven ignored and untracked before writing.

**Verification:** `tsc`; `rg` for signatures/insert fields; exact `.env.example` read-back; `git check-ignore` + `git ls-files`.

**Dependencies:** T1, T2, T3.

**Files:**
- `rollout/src/lib/analytics/analytics-service.ts`
- `rollout/.env.example`
- `rollout/.env.local` (untracked, never committed)

**Size:** M (3 files, 2 tracked).

**Commit:** `ROLL-12 T5: pass source and visitor hash through analytics service`

---

### Task 6 — Verify, report, commit

**Description:** Run the full verification batch, write the honest report, and make the final
paperwork commit.

**Acceptance criteria:**
- [ ] `npx tsc --noEmit` exit 0 (or every error listed with file/line and whether pre-existing).
- [ ] Harness output recorded verbatim; anything not run is named.
- [ ] Static checks: 0 bare clients, 2 schema options, 0 `NEXT_PUBLIC_SYSTEM_TYPE`, both columns in all three files.
- [ ] Report has: built, verified, not verified, pre-existing errors, owner actions, commit list.
- [ ] “Noticed, not touched.” section with file/line, wrong, impact, out-of-scope reason for both items.
- [ ] RLS note uses the exact agreed phrasing and is flagged high priority.
- [ ] Six commits exist, nothing pushed; `rollout/.env.local` never staged.

**Verification:** full command batch, then `git log --oneline -6`, `git status --short`.

**Dependencies:** T1–T5.

**Files:** `developer-workspace/ROLL-12/report.md`

**Size:** S (1 doc).

**Commit:** `ROLL-12 T6: verify and report`

---

## Command batch (single approval)

```bash
cd /home/lordwhitefire/current-project/athletica/athletica

# Preflight (read-only)
node --version
command -v vercel || true
git status --short
git diff --stat
git check-ignore -v rollout/.env.local
git ls-files -- rollout/.env.local rollout/.env.example
grep -q '^ANALYTICS_HASH_SALT=' rollout/.env.local && echo SALT_PRESENT || echo SALT_ABSENT

# Salt — only if SALT_ABSENT and .env.local is ignored + untracked
printf '\nANALYTICS_HASH_SALT=%s\n' "$(openssl rand -hex 32)" >> rollout/.env.local

# Typecheck
cd rollout && npx tsc --noEmit

# Harness (outside repo, deleted only with separate approval)
node --experimental-strip-types /tmp/opencode/roll12-check.ts

# Static checks
rg -n "createClient<Database>\(" rollout/src/lib/supabase/server.ts
rg -n "db: \{ schema: 'rollout' \}" rollout/src/lib/supabase/server.ts
rg -n "NEXT_PUBLIC_SYSTEM_TYPE" rollout/.env.example
rg -n "source|visitor_hash" rollout/src/lib/database.types.ts \
  rollout/src/lib/analytics/analytics-service.ts \
  rollout/supabase-rollout-schema-updates.sql

# Six commits, staging only the listed files
git add -f developer-workspace/ROLL-12/plan.md
git add rollout/supabase-rollout-schema-updates.sql rollout/src/lib/database.types.ts
git commit -m "ROLL-12 T1: add analytics source and visitor hash schema/types"

git add rollout/src/lib/supabase/server.ts
git commit -m "ROLL-12 T2: scope Supabase clients to rollout schema"

git add rollout/src/lib/analytics/source.ts rollout/src/lib/analytics/visitor.ts
git commit -m "ROLL-12 T3: add source normalization and visitor hashing"

git add rollout/src/lib/analytics/bots.ts rollout/src/lib/analytics/rate-limit.ts
git commit -m "ROLL-12 T4: add bot detection and analytics rate limiting"

git add rollout/src/lib/analytics/analytics-service.ts rollout/.env.example
git commit -m "ROLL-12 T5: pass source and visitor hash through analytics service"

git add developer-workspace/ROLL-12/
git commit -m "ROLL-12 T6: verify and report"
```

`git add -f` is needed once because the repo-root `.gitignore` is `/*` with only
`frontend/` and `rollout/` unignored. `.gitignore` itself is not modified.

## Risks and mitigations

| Risk | Impact | Mitigation |
|------|--------|------------|
| `.env.local` not actually ignored/untracked | Secret leak | Stop before writing; ask. |
| `.env.example` untracked/ignored | Change cannot be committed | Stop and ask before `-f`. |
| Node lacks `--experimental-strip-types` | No runtime proof | Report “static inspection and tsc only”; do not install anything. |
| Pre-existing dirty files at batch time | Commit sweeps unrelated work | Stage only listed paths; stop if a target file has unrelated edits. |
| Pre-existing `tsc` errors | Checkpoint fails | Report them; fix only if they block this task, call the fix out separately. |
| Harness cannot resolve `@upstash/*` from `/tmp` | Fail-open untested | Import real file via absolute path; if resolution still fails, report the gap. |

## Noticed, not touched (report section)

1. RLS policies exist but no `ENABLE ROW LEVEL SECURITY` found — possible security exposure, high priority.
2. `analytics.product_id` nullable in SQL vs non-null in TypeScript — no SQL or type change in ROLL-12.

## Out of scope

Page/`/go` wiring, source-split UI, admin auth, price changes, Sentry, Vitest suite, SQL execution,
package installs, any fix to the two noticed items, any push.

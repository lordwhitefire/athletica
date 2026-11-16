# Implementation Plan: ROLL-15 — Admin access: three locks + database rules

**Task:** `openspec/tasks/ROLL-15/task.md` (superseded in part — see below)
**Design authority:** `/home/lordwhitefire/Downloads/admin-access-design.md` (owner-supplied, updated 2026-11-01)
**Planned:** Sat Oct 31 2026, rewritten Sun Nov 01 2026
**Repo root:** `/home/lordwhitefire/current-project/athletica/athletica`
**App:** `rollout/`

---

## This plan replaces the spec-only plan

The earlier version of this file followed `openspec/tasks/ROLL-15/task.md` and explicitly rejected
three things the design document requires. **The owner ruled the design document governs.** Where the
two differ, the design wins and the spec is superseded:

| Spec said | Design says — **this now governs** |
|---|---|
| No sign-up surface at all | Sign-up page exists, reachable only with a one-time invite code |
| `/admin/login` always reachable | Sign-in page 404s without the door-key cookie |
| No schema change | A table records issued keys/links |
| 404 gate + role only | Three locks **plus** database rules as the last layer |

The report must state this plainly. It is not a quiet reinterpretation of the spec.

---

## Owner rulings in force

1. All **4** existing accounts are admins.
2. **Security first**, then build.
3. **Server-first by default**; only genuine interaction ("tinkering") stays local, and nothing reaches
   the server until Save is pressed.
4. **The design document governs**, not the spec.
5. Door-key cookie: **30 days**, renewing itself on each visit.
6. **The sign-up page is built now.**
7. Key/link generation is a **script on the owner's machine**.
8. The key record lives in a **database table**.
9. **RLS is the last layer and must be real** — not decorative.
10. **No tests** in ROLL-15.
11. **One commit per task**; nothing pushed.

---

## What we are building

A stranger sees "page not found" everywhere. Invited people reach sign-up with a one-time code. Admins
reach sign-in with their personal door-key cookie. Only a signed-in account with the admin role gets
into the admin area. Behind all of it, the database refuses non-admins.

**The three locks:**

1. **Invite code** → decides who may load the sign-up page.
2. **Door-key cookie** → decides who may load the sign-in page. *It authenticates nobody.*
3. **Email + password + admin role** → decides who gets into the admin.

**Last layer:** database rules, so data survives even if a page is bypassed.

---

## Facts established (read-only recon)

| Fact | Value |
|---|---|
| Auth of any kind in `rollout/` | **none** — no `proxy.ts`, no `cookies()`, no `getUser()`, no login route |
| `src/lib/auth/` | does not exist |
| Admin API handlers | 4 files: `products/route.ts`, `products/[id]/route.ts`, `media/upload/route.ts`, `media/assets/route.ts` |
| Admin API client | `createAdminClient()` — **service role**, bypasses RLS |
| `src/lib/supabase/server.ts` | 20 lines; `createAdminClient()`, `createPublicClient()`; no cookies |
| `@supabase/ssr` in `rollout/node_modules` | **absent** (present in `frontend/` at `^0.10.3`) |
| Admin CSS | **already dark** — `#000`, lemon `#d1fd40`, 1145 lines |
| `src/app/admin/layout.tsx` | does not exist |
| Next.js | **16.3.4** — convention is `proxy.ts`; `middleware.ts` deprecated |
| Not-found page | no `not-found.tsx` anywhere |
| RLS rules on disk | `rollout/supabase-rollout-rls-policies.sql` — only `anon` (published products) and `service_role` (all). **No rule for a signed-in admin.** |
| RLS switched on? | **unknown** — the file is a script; whether it was run cannot be seen without querying the database |
| `rollout.products.id` | `TEXT PRIMARY KEY`, **no default** |
| `rollout/.env.local` | **was tracked** — untracked and committed in `65a3bbf` (T0, done) |

---

## Architecture decisions

1. **Design document governs.** Spec's "no schema change", "no sign-up", "login always reachable" are
   superseded as recorded above.
2. **One table holds both kinds of one-time token** — `kind = 'invite' | 'door'`. An invite code and a
   door-key link are the same object with different lives; splitting them would duplicate the same
   logic twice.
3. **The cookie authenticates nobody.** It only decides whether the sign-in page exists for you. Real
   authentication remains Supabase email + password. This is the design's central point and the thing
   most easily got wrong.
4. **Only hashes are stored.** The raw token exists in the link/cookie and nowhere in the database.
5. **The database rules require moving the admin API off the service role** — otherwise RLS is bypassed
   by definition and the last layer is theatre. This is decision 9 from the owner, and it lands last
   because the 404 gate (T2) closes the live hole first.
6. **Sliding renewal is a row update**, not a new row: on each valid admin page load, the door key's
   `expires_at` moves to `now() + 30 days`. A key untouched for 30 days lapses.
7. **404, never 401/403/redirect.** Except the door-key link route and the sign-up page, which must be
   reachable or nobody could ever get in — and they 404 themselves when the token is bad.
8. **Server-first.** Authority lives on the server. Client code only for interaction.
9. **No tests** (owner ruling). Verification is static analysis plus live HTTP probes, honestly
   reported.
10. **`server-only` is not installed**; the auth module is kept server-side by construction and the
    trade-off is recorded in the report.

---

## Data model (new table)

```sql
CREATE TABLE rollout.admin_access_keys (
  id            UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  kind          TEXT NOT NULL CHECK (kind IN ('invite', 'door')),
  user_id       UUID REFERENCES auth.users(id) ON DELETE CASCADE,
  token_hash    TEXT NOT NULL UNIQUE,
  browser_label TEXT,
  issued_at     TIMESTAMPTZ NOT NULL DEFAULT now(),
  expires_at    TIMESTAMPTZ NOT NULL,
  used_at       TIMESTAMPTZ,
  revoked_at    TIMESTAMPTZ
);
```

- `kind='invite'` — `user_id` null, lives 24 h, one use, consumed by a successful sign-up.
- `kind='door'` — `user_id` set, lives 30 days, one use to deposit the cookie, then `expires_at`
  slides forward on each visit.
- `token_hash` = SHA-256 of the raw token. Raw tokens are never written down.
- Revoking one admin = `UPDATE ... SET revoked_at = now() WHERE user_id = $1`.

**Note:** `rollout.products.id` has no default, so nothing here may assume a generated product id.

---

## Task list

### Phase 0 — hygiene

- [x] **T0 — Untrack `rollout/.env.local`** · DONE · commit `65a3bbf` · **all keys rotated by the owner, 2026-11-01**
- [x] **T0.5 — Commit the uncommitted work honestly** · DONE · commit `0386c87`

**Checkpoint 0** — no live secret is tracked; the tree contains no unlabelled work.

### Phase 1 — security first (the live hole)

- [x] **T1 — Install `@supabase/ssr` + cookie-aware client + `requireAdmin()`** · DONE · commit `f57e7b1`
- [x] **T2 — Gate all four `/api/admin/*` handlers to 404** · DONE · commit `5a57785` · **security-critical**

**Checkpoint 1** — every admin API endpoint returns 404 to a stranger; `tsc` clean.

### Phase 2 — the door

- [x] **T3 — Migration: `rollout.admin_access_keys`** · DONE · commit `a8ef94e` · owner ran the SQL
- [x] **T4 — One-time link route + issue script** · DONE · commit `b033d9b`
- [x] **T5 — Sign-in page, gated by the cookie; sliding renewal** · DONE · commit `cede27b`

**Checkpoint 2** — the owner can issue a link from their machine; opening it deposits the cookie;
the sign-in page then loads; without the cookie it 404s.

### Phase 3 — sign-up

- [x] **T6 — `/admin/signup?code=…`: invite validation, account creation, cookie deposit** · DONE · commit `74c3dcf`

**Checkpoint 3** — a valid invite shows the form once; sign-up creates an **admin** account, deposits
the cookie, and lands on sign-in. A used, wrong or expired code 404s.

### Phase 4 — the admin surface

- [x] **T7 — `/admin` layout gate + sign-out** · DONE · commit `78a6ca0`
- [x] **T11 — SSR admin sign-in and sign-up pages with Tailwind v4 design** · DONE · commit `caa5d98`

**Checkpoint 4** — signed-in admin reaches `/admin/products`; stranger gets 404; `/admin` bare 404s.

### Phase 5 — the last layer

- [x] **T8 — `proxy.ts` optimistic gate** · DONE · commit `f0e2afd`
- [x] **T9 — RLS made real: admin API off the service role + admin policies** · DONE · commit `fdbc88a`

**Checkpoint 5** — with the app's own check deliberately bypassed, the database still refuses a
non-admin.

**Owner action required:** Run `rollout/supabase-rollout-rls-policies.sql` in Supabase → SQL Editor
to enable RLS and add the admin policies. Without this, the policies exist on paper but aren't
enforced.

### Phase 6 — close

- [ ] **T10 — Verify and report** · `S`

**Checkpoint 6** — every checkpoint above re-proven; report names what was **not** tested.

### Phase 7 — product editor: server-first, save-once (PROPOSED, after ROLL-15)

Not part of the three locks. Recorded because the owner ruled it in and it must not be lost.

- [ ] **T15 — Defer image upload to Save** · `M`
- [ ] **T16 — Product writes via Server Actions** · `M`
- [ ] **T17 — URL-driven server filtering on the admin list** · `M`
- [ ] **T18 — Confirm or fix the `id` gap on create** · `S`

**Deliberately excluded:** the editor's micro-interactions stay client-side. Forcing them server-side
makes the form materially worse and buys no security.

---

## Task detail

### T0 — Untrack `rollout/.env.local` · DONE

Committed as `65a3bbf`. File still on disk (1203 bytes); `git ls-files` returns nothing; the ignore
rule is real (`rollout/.gitignore:34: .env*`).

**Keys rotated — owner action completed 2026-11-01.** `NEXT_PUBLIC_SUPABASE_ANON_KEY`,
`SUPABASE_SERVICE_ROLE_KEY`, `SUPABASE_DB_URL`, `SANITY_WRITE_TOKEN` and `RAIN_FOREST_API_KEY` were
all replaced. `SUPABASE_TOKEN` was deleted outright — **nothing in `rollout/` reads it**, verified by
grep, so nothing breaks. The old values remain in history at `f8eb77c` but no longer grant access.

**Trap recorded (it actually happened, 2026-11-01):** `NEXT_PUBLIC_*` values are inlined at build
time. Rotating the publishable key without a rebuild makes every public page 404 **silently** — no
error, just "product not found". Fixed by rebuilding. The service-role, Sanity, Rainforest and DB
values are read at runtime; they need a restart, not a rebuild.

**Lesson for me, written down:** never quote a key from a summary, note, or memory. Read the current
`.env.local` (public values only) or query the live API, every time. The stale-key error is exactly
the class of mistake this project's rules exist to prevent.

---

### T0.5 — Commit the uncommitted work honestly

**Why:** the tree holds the ROLL-13/14 product-page redesign, the image work, and unrelated dirt
(`MegaMenu.tsx` deleted, frontend test scripts untracked). ROLL-15 commits must not swallow it.

**Acceptance**
- [ ] The redesign is committed as its own commit(s) describing what it actually is
- [ ] Unrelated dirt is committed separately or explicitly left dirty and reported
- [ ] Nothing pushed

**Verification:** `git status --short` shows only files ROLL-15 intends to change.
**Depends on:** T0. **Scope:** `S`. **Files:** none (commits only).

---

### T1 — Auth foundation

**Description:** install `@supabase/ssr@^0.10.3` (owner-approved), add a cookie-aware server client
beside the existing two (leave `createAdminClient()` and `createPublicClient()` untouched), and add
`src/lib/auth/admin.ts` exporting `getAdminUser()` and `requireAdmin()`.

**Acceptance**
- [ ] `@supabase/ssr@^0.10.3` installed, lockfile committed
- [ ] Cookie-aware client added without changing the existing clients
- [ ] `getAdminUser()` → `supabase.auth.getUser()`, returns the user only when
      `app_metadata.role === 'admin'`
- [ ] `requireAdmin()` → the route-handler form; fails closed on any error
- [ ] Zero references to `user_metadata` in the auth path
- [ ] Never imported from a `'use client'` file
- [ ] Cookie code written against `rollout/node_modules/next/dist/docs/`, not memory

**Verification:** `npx tsc --noEmit` exits 0; `rg -n "user_metadata" rollout/src/lib/auth` → none.
**Depends on:** T0.5. **Files:** `src/lib/auth/admin.ts` (new), `src/lib/supabase/route-client.ts`
(new), `package.json`, lockfile.

---

### T2 — Gate all four admin API handlers · security-critical

**Description:** the live vulnerability. Every exported handler in all four files calls
`requireAdmin()` before any data access and returns a 404-shaped response on failure. No business
logic changes.

**Acceptance**
- [ ] `requireAdmin()` precedes all data access in **every** exported handler of all four files
- [ ] Stranger → 404; signed-in non-admin → 404
- [ ] The media routes (Sanity **write token**) are covered
- [ ] No behavioural change to the handlers themselves

**Verification:** `curl -s -o /dev/null -w "%{http_code}"` per endpoint → `404`;
`rg -n "requireAdmin" rollout/src/app/api/admin` shows a call in every file.
**Depends on:** T1. **Files:** the four handlers.

---

### T3 — Migration: `rollout.admin_access_keys`

**Description:** create the table from the data model above, in the same style as the existing SQL
files (`supabase-rollout-schema.sql`, `supabase-rollout-rls-policies.sql`).

**Acceptance**
- [ ] SQL file added; table shape matches the data model exactly
- [ ] Index on `token_hash` (unique) and on `user_id`
- [ ] **The owner runs it** — no CLI command is executed by me
- [ ] TypeScript types regenerated (command printed, owner runs it)

**Verification:** `select count(*) from rollout.admin_access_keys` returns 0.
**Depends on:** T1. **Files:** `rollout/supabase-rollout-admin-keys.sql` (new),
`src/lib/database.types.ts`.

---

### T4 — One-time link route + issue script

**Description:** `GET /admin/key/[token]` hashes the token, looks up a live `door` row, marks it used,
sets the door-key cookie, and redirects to `/admin/login`. Bad/used/expired → 404. A script
`rollout/scripts/issue-admin-key.mjs` (run by the owner, service key from `.env.local`) inserts a row
and prints the URL.

**Acceptance**
- [ ] Valid link → cookie set (`HttpOnly`, `Secure`, `SameSite=Lax`, `Path=/admin`, 30 days) → redirect
- [ ] Second use of the same link → 404
- [ ] Expired or revoked → 404
- [ ] Script prints exactly one URL per run and writes only a hash
- [ ] The script is never reachable over HTTP

**Verification:** run the script, open the URL twice — first redirects, second 404s;
`select used_at, token_hash from rollout.admin_access_keys` shows a hash, never the raw token.
**Depends on:** T3. **Files:** `src/app/admin/key/[token]/route.ts` (new),
`scripts/issue-admin-key.mjs` (new), `src/lib/auth/door-key.ts` (new).

---

### T5 — Sign-in page, gated by the cookie

**Description:** `/admin/login` reads the door-key cookie, checks it against the table on the server,
and only then renders the form. Missing/invalid → `notFound()`. Email + password via
`signInWithPassword`; success → `/admin/products`; failure → neutral inline error. On every valid
load the row's `expires_at` slides to `now() + 30 days`.

**Acceptance**
- [ ] No cookie → 404
- [ ] Valid cookie → form renders
- [ ] Renewal updates `expires_at` on each visit
- [ ] Success → `/admin/products`; failure → neutral message with no account hint
- [ ] Styling matches `admin.css` tokens

**Verification:** `curl` without the cookie → 404; with it → 200; sign in with a real account.
**Unverifiable by me:** the actual sign-in, which needs a real credential.
**Depends on:** T4. **Files:** `src/app/admin/login/page.tsx` (new), `src/lib/auth/door-key.ts`,
`admin.css` (additive).

---

### T6 — Sign-up page

**Description:** `/admin/signup?code=…` validates the invite code on the server before rendering. The
form posts email + password; the server creates the user **with `app_metadata.role = 'admin'`**, marks
the code used, issues a door key, sets the cookie, and redirects to `/admin/login`. The code is
re-checked at submit time so two people cannot race one code.

**Acceptance**
- [ ] No code / bad / expired / used → 404, no form shown
- [ ] Valid code → form renders
- [ ] Sign-up creates the account with `app_metadata.role = 'admin'` and nothing else can set the role
- [ ] Code consumed atomically — two submits, one account
- [ ] Cookie deposited; redirect to `/admin/login`
- [ ] No public sign-up path without a code, anywhere

**Verification:** issue a code with the script, sign up once, confirm the account is an admin and the
code is dead; retry the same code → 404.
**Depends on:** T4. **Files:** `src/app/admin/signup/page.tsx` (new),
`src/app/api/admin/signup/route.ts` (new), `scripts/issue-invite.mjs` (new).

---

### T7 — `/admin` layout gate + sign-out

**Description:** `src/app/admin/layout.tsx` calls `requireAdmin()`; null → `notFound()`. Exempts
`/admin/login`, `/admin/signup` and `/admin/key/*` — those three must render without an admin session.
Carries the shared header with the sign-out control.

**Acceptance**
- [ ] Signed-out or non-admin on `/admin/products` → 404
- [ ] The three exempt routes are not swallowed by the gate
- [ ] `/admin` bare → 404; no index page created
- [ ] Sign-out clears the session and returns to `/admin/login`
- [ ] `getUser()` called per request; `user_metadata` never read

**Verification:** `curl -o /dev/null -w "%{http_code}" /admin/products` → 404 signed out, 200 signed in.
**Depends on:** T5. **Files:** `src/app/admin/layout.tsx` (new), sign-out component, `admin.css`.

---

### T8 — `proxy.ts` optimistic gate

**Description:** `rollout/proxy.ts` (Next 16 convention). Refreshes the session cookie when present and
optimistically 404s unauthenticated `/admin/*` and `/api/admin/*`, exempting `/admin/login`,
`/admin/signup`, `/admin/key/*` and auth API paths. **Never the authorization boundary** — cookie
presence only, no role check.

**Acceptance**
- [ ] Single export at the app root
- [ ] Session refreshed when present
- [ ] No session on a gated path → 404-shaped response
- [ ] `/admin/key/*` and `/admin/signup` exempt (or sign-up could never be reached)
- [ ] `matcher` excludes `_next/*` and static assets
- [ ] No role check in the proxy

**Verification:** `curl` gated paths without cookies → 404; assets still load.
**Depends on:** T7. **Files:** `rollout/proxy.ts` (new).

---

### T9 — RLS made real

**Description:** the last layer only exists if the API stops using the master key. Move the admin
handlers onto the user-scoped client so policies apply, and add policies: a signed-in user whose
`app_metadata.role = 'admin'` may select/insert/update/delete on `rollout.products`; anon keeps
read-published only; `admin_access_keys` is **service-role only** (no client ever touches it).

**Acceptance**
- [ ] Admin handlers use the user-scoped client; service role remains only for the owner's script and
      for auth admin calls
- [ ] New policies present for `authenticated` where `app_metadata.role = 'admin'`
- [ ] `admin_access_keys` has RLS on and **no** policy for `anon` or `authenticated`
- [ ] The public product page still reads published products (anon policy intact)
- [ ] RLS confirmed **enabled** on both tables, not merely assumed

**Verification:** as an admin: list/edit works; as a stranger with the anon key: `products` returns
published only, `admin_access_keys` returns nothing.
**Depends on:** T2, T3, T7. **Files:** `src/lib/supabase/*`, four handlers,
`supabase-rollout-rls-policies.sql`.

---

### T10 — Verify and report

**Acceptance**
- [ ] `npx tsc --noEmit` passes
- [ ] Stranger: `/admin/products`, `/admin`, `/admin/products/<id>/edit`, `/admin/login`, `/admin/signup`
      → 404
- [ ] Stranger: all four `/api/admin/*` endpoints → 404
- [ ] Valid door link → cookie → sign-in page loads; second use → 404
- [ ] Valid invite → sign-up form → account is admin → code dead
- [ ] Cookie renewal observed on a second visit
- [ ] `user_metadata` absent from the auth path
- [ ] RLS verified live, including that it is switched on
- [ ] Report states: the spec was superseded; the 4-admin ruling; what was and was not runtime-tested;
      T0's rotation is still outstanding
- [ ] Nothing pushed; no commit the owner has not approved

**Files:** `developer-workspace/ROLL-15/report.md` (new).

---

## Risks

| Risk | Impact | Mitigation |
|---|---|---|
| Old keys remain in git history | Low | Rotated 2026-11-01; old values no longer grant access. History still contains them — recorded, not erased |
| Rotating a `NEXT_PUBLIC_*` key without a rebuild → silent 404s on every public page | High | Happened once on 2026-11-01. Any publishable-key rotation is followed by a rebuild and a live page check |
| RLS is **not actually switched on** in the live database | High | T9 verifies it live; if it was off, that is reported as a pre-existing hole |
| `/admin/signup` and `/admin/key/*` swallowed by the layout gate or proxy | High | Both list the three exemptions explicitly; checkpoint 3 curl-tests them |
| Two people racing one invite code | Med | Code re-checked and consumed atomically at submit |
| Invite code or link leaked over an insecure channel | Med | Hashes only in the DB; one use; 24 h (invite) |
| Hand-rolled cookie code drifting from Next 16 | High | Read `node_modules/next/dist/docs/` before writing; AGENTS.md in `rollout/` says this Next differs from training data |
| Moving off the service role breaks the public product page | Med | T9 keeps the anon published-products policy and curl-tests the public page |
| The `id` gap blocks product create | Med | T14 confirms before anything is built on it |

---

## Closed questions (recorded rulings)

| Question | Ruling |
|---|---|
| Which governs — spec or design doc | **Design doc** |
| Door-key record storage | **Database table** |
| Who generates keys/links | **Script on the owner's machine** |
| Door-key lifetime | **30 days, renewing on each visit** |
| Is the sign-up page built now | **Yes** |
| Is RLS real or decorative | **Real** — API moves off the service role |
| Server vs client split | **Server-first**; only tinkering stays local |
| Tests | **None** in ROLL-15 |

## Deliberately deferred

- **Email recovery** (design §"Later phase") — the owner getting access back by email. Needs an
  email-sending service not in the project. Not MVP.
- **Link generation from the admin dashboard** — later; the script covers it for now.
- **Phase 7 product-editor work** — recorded, not started.

---

## Commits

One per task, `ROLL-15 T<n>: <description>`, matching `ROLL-12`…`ROLL-14`. **Nothing pushed.**

T0 is already committed as `65a3bbf`.

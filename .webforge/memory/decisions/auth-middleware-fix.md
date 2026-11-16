# Auth Middleware Fix

- **Date:** July 17–18, 2026
- **Status:** Completed
- **Filed by:** Memory-Choices (per Lead-Archive delegate, ticket-auth-dd-001)
- **Source:** Work log entries [2026-07-17T02:19:51.583Z] through [2026-07-18T02:41:47.900Z]

---

## 1. Problem Statement

The Athletica admin panel API routes (`/api/admin/*`) were **not protected by authentication middleware**. Six of eight admin API routes had zero auth protection, exposing admin functionality to unauthenticated users. The middleware file (`proxy.ts`) was correctly named for Next.js 16's `proxy` convention but contained two critical bugs that made auth enforcement ineffective.

**Per work-log.md entry [2026-07-17T02:19:51.583Z]:** Hermes assigned Athena to investigate whether admin panel API routes were protected by authentication.

---

## 2. Investigation Findings

Athena discovered the following:

### 2.1 Bug 1 — Pathname Check Too Narrow

**File:** `athletica/frontend/src/proxy.ts`, line 36

The original pathname check only matched `/admin` pages, not `/api/admin` API routes:

```typescript
// BEFORE (Bug 1): Only caught page routes, not API routes
if (pathname.startsWith("/admin")) {
```

This meant all `/api/admin/*` routes bypassed the auth middleware entirely. Admins hitting API routes directly (e.g., `/api/admin/orders`, `/api/admin/products`) were never authenticated.

**Per work-log.md entry [2026-07-17T04:07:49.823Z]:** Hermes assigned Athena to investigate proxy.ts middleware logic.

**Per work-log.md entry [2026-07-17T04:32:45.785Z]:** "Two critical bugs in proxy.ts: (1) add /api/admin path check."

### 2.2 Bug 2 — `.single()` Causes 500 on Missing Profile

**File:** `athletica/frontend/src/proxy.ts`, line 49 (original)

The Supabase query used `.single()`, which throws a **500 error** if no profile row exists for the authenticated user:

```typescript
// BEFORE (Bug 2): .single() throws PostgrestError if no row found
const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .single();
```

`.single()` expects exactly one row. If the user has a Supabase auth account but no corresponding row in the `profiles` table, the query throws a `PostgrestError` — crashing the middleware and returning a 500 response.

**Per work-log.md entry [2026-07-17T04:32:45.785Z]:** "(2) replace .single() with .maybeSingle() to prevent crashes on missing profiles."

### 2.3 Pre-existing Concern — Same `.single()` Bug in Login Route

**File:** `athletica/frontend/src/app/api/admin/login/route.ts`, line 53 (original)

The login route had the identical `.single()` bug. If an admin user signed in successfully but had no `profiles` row, the login endpoint would crash with a 500 error instead of gracefully returning a "not admin" response.

**Per Minos review [2026-07-17T04:42:24.944Z]:** "Same .single() bug exists in /api/admin/login/route.ts:53."

---

## 3. Fixes Applied

All four fixes were applied via the delegation chain: Hermes → Hephaestus → Titan → Lead-Terra → Sr-Stone → Jr-Granite (for Fix 1 & 2), and Hermes → Hephaestus (for Fix 3 & 4).

### Fix 1 — Broaden Pathname Check

**File:** `athletica/frontend/src/proxy.ts`, line 36
**Applied by:** Jr-Granite (per Sr-Stone delegation, work-log entry [2026-07-17T04:33:52.610Z])

```typescript
// AFTER (Fix 1): Catches both /admin pages and /api/admin API routes
if (pathname.startsWith("/admin") || pathname.startsWith("/api/admin")) {
```

**Rationale:** The `||` operator ensures both regular admin pages AND admin API routes are caught by the auth middleware. This protects all 8 admin API routes behind the authentication gate.

**Verification:** Per Sr-Stone work-log entry [2026-07-17T04:34:33.649Z] — "Line 36: added /api/admin route protection." Confirmed by Titan review [2026-07-17T04:35:05.964Z].

### Fix 2 — `.single()` → `.maybeSingle()` in proxy.ts

**File:** `athletica/frontend/src/proxy.ts`, line 49
**Applied by:** Jr-Granite (per Sr-Stone delegation, work-log entry [2026-07-17T04:33:52.610Z])

```typescript
// AFTER (Fix 2): .maybeSingle() returns null gracefully when no profile exists
const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", user.id)
    .maybeSingle();

if (profile?.role !== "admin") {
```

**Rationale:** `.maybeSingle()` returns `null` when no row is found (instead of throwing). The optional chaining `profile?.role` handles the `null` case gracefully — `null !== "admin"` is `true`, so unprofiled users get redirected to `/admin/login` instead of crashing the middleware.

**Verification:** Per Lead-Terra review [2026-07-17T04:34:47.481Z] — "Line 49 uses .maybeSingle() to avoid 500 on missing profile." Confirmed by Minos review [2026-07-17T04:42:24.944Z].

### Fix 3 — Add `/api/admin/login` Bypass

**File:** `athletica/frontend/src/proxy.ts`, line 37
**Applied by:** Hephaestus (work-log entry [2026-07-17T20:32:05.043Z])

```typescript
// AFTER (Fix 3): Login endpoint bypassed so admins can authenticate
if (pathname === "/admin/login" || pathname === "/api/admin/login") {
```

**Rationale:** Without this bypass, the auth middleware would redirect admins away from the login endpoint before they could authenticate. Adding `/api/admin/login` to the bypass list allows the POST login request to reach `login/route.ts` unblocked. The page route `/admin/login` was already bypassed (line 37 originally had only `/admin/login`); this fix extends the bypass to the API route.

**Per Minos review [2026-07-17T04:42:24.944Z]:** Pre-existing concern: "/api/admin/login bypass missing."

**Verification:** Per Hephaestus review [2026-07-17T20:36:23.591Z] — "Fix 1: proxy.ts line 37 now includes || pathname === '/api/admin/login'."

### Fix 4 — `.single()` → `.maybeSingle()` in login/route.ts

**File:** `athletica/frontend/src/app/api/admin/login/route.ts`, line 53
**Applied by:** Hephaestus (work-log entry [2026-07-17T20:32:05.043Z])

```typescript
// AFTER (Fix 4): .maybeSingle() instead of .single() — same pattern as proxy.ts
const { data: profile } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", data.user.id)
    .maybeSingle();

if (profile?.role !== "admin") {
```

**Rationale:** Same as Fix 2. Prevents a 500 crash on successful login when the user's `profiles` row is missing. Returns a proper 403 "not admin" error instead.

**Per Minos review [2026-07-17T04:42:24.944Z]:** "Same .single() bug exists in /api/admin/login/route.ts:53."

**Verification:** Per Hephaestus review [2026-07-17T20:36:23.591Z] — "Fix 2: route.ts line 53 changed .single() to .maybeSingle()."

---

## 4. Review Verdict — Minos (CONDITIONAL PASS)

**Date:** 2026-07-17T04:42:24.944Z
**Reviewer:** Minos

**Verdict:** CONDITIONAL PASS

**Per work-log.md entry [2026-07-17T04:42:24.944Z]:**
> CONDITIONAL PASS — Both bug fixes correctly applied. Security fix: line 36 now catches /api/admin routes. Crash fix: line 49 uses .maybeSingle() — null profile correctly redirects via optional chaining. Pre-existing concerns noted: file must be renamed to middleware.ts, /api/admin/login bypass missing, same .single() bug exists in /api/admin/login/route.ts:53.

**Final review (2026-07-18):** Per Minos final review on [2026-07-18T02:40:38.386Z], all 4 fixes were verified and approved.

---

## 5. Key Decisions and Rationale

| Decision | Rationale | Source |
|---|---|---|
| Use `|| pathname.startsWith("/api/admin")` instead of a separate check | Simplest fix — single condition catches both page and API routes without duplicating logic | proxy.ts line 36; work-log [2026-07-17T04:32:45.785Z] |
| Use `.maybeSingle()` instead of `.single()` | `.maybeSingle()` returns `null` for missing rows; `.single()` throws. The `profile?.role` optional chaining handles `null` naturally | proxy.ts line 49; work-log [2026-07-17T04:32:45.785Z] |
| Add `/api/admin/login` to bypass list | Without bypass, admins cannot authenticate — the middleware blocks login requests before they reach the handler | proxy.ts line 37; Minos review [2026-07-17T04:42:24.944Z] |
| Apply `.maybeSingle()` to login/route.ts | Same bug, same fix — prevents crash on successful login if `profiles` row is missing | route.ts line 53; Minos review [2026-07-17T04:42:24.944Z] |
| Keep proxy.ts filename (defer rename to middleware.ts) | Rename is a pre-existing concern that is out of scope for this fix. The code itself is correct under either filename | Minos review [2026-07-17T04:42:24.944Z] |

---

## 6. Files Affected

| File | Lines Changed | Fixes |
|---|---|---|
| `athletica/frontend/src/proxy.ts` | Lines 36, 37, 49 | Fix 1 (path check), Fix 2 (`.maybeSingle()`), Fix 3 (login bypass) |
| `athletica/frontend/src/app/api/admin/login/route.ts` | Line 53 | Fix 4 (`.maybeSingle()`) |

**Per Hermes work-log entry [2026-07-17T20:36:51.391Z]:** "Files changed: athletica/frontend/src/proxy.ts, athletica/frontend/src/app/api/admin/login/route.ts"

---

## 7. Chain of Delegation

```
Hermes (CEO)
├── Athena — Investigation (task-auth-investigation-001) [2026-07-17T02:19:51.583Z]
│   └── Identified 2 critical bugs in proxy.ts
├── Hephaestus — Fix proxy.ts (task-fix-proxy-auth-001) [2026-07-17T04:32:45.785Z]
│   └── Titan
│       └── Lead-Terra
│           └── Sr-Stone
│               └── Jr-Granite — Applied Fix 1 & Fix 2 [2026-07-17T04:33:52.610Z]
├── Minos — Review (task-review-proxy-fix-001) [2026-07-17T04:40:21.476Z]
│   └── CONDITIONAL PASS with pre-existing concerns
├── Hephaestus — Remaining fixes (task-fix-proxy-remaining-001) [2026-07-17T20:31:46.344Z]
│   └── Applied Fix 3 & Fix 4 directly [2026-07-17T20:36:23.591Z]
├── Minos — Final review (task-review-final-auth-001) [2026-07-18T02:40:38.386Z]
│   └── All 4 fixes verified and approved
└── Thoth — Documentation (task-doc-auth-fix-001) [2026-07-18T02:41:27.991Z]
    └── Lead-Archive
        └── Memory-Choices — This document (ticket-auth-dd-001)
```

---

## 8. Pre-existing Concerns (Out of Scope)

These issues were identified during the review but were not addressed in this fix set:

1. **File rename required:** `proxy.ts` must be renamed to `middleware.ts` for Next.js 16 production readiness. Per Minos review [2026-07-17T04:42:24.944Z].
2. **Matcher review:** The `config.matcher` in proxy.ts (lines 63–66) includes a broad catch-all pattern that may need refinement.
3. **Other admin API routes:** While now caught by the middleware, individual route-level auth checks were not implemented — the middleware is the sole auth gate.

---

## 9. Current State (Verified)

**proxy.ts** (67 lines):
- Line 36: `pathname.startsWith("/admin") || pathname.startsWith("/api/admin")` — catches both page and API routes
- Line 37: `pathname === "/admin/login" || pathname === "/api/admin/login"` — bypasses login
- Line 49: `.maybeSingle()` — graceful null handling
- Line 51: `if (profile?.role !== "admin")` — optional chaining handles null

**login/route.ts** (73 lines):
- Line 53: `.maybeSingle()` — graceful null handling
- Line 55: `if (profile?.role !== "admin")` — optional chaining handles null

All four fixes verified in place as of 2026-07-18.

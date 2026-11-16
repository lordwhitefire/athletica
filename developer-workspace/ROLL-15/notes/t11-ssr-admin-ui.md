# Plan — SSR Admin Sign-In and Sign-Up Pages (Tailwind v4)

**Date:** Mon Nov 02 2026
**Context:** ROLL-15 Phase 4 completion + UI polish. Owner wants the admin sign-in and sign-up pages rebuilt as **Server Components (SSR)** with the visual design from `athletica-sign-in-nextjs-tailwind-v4.md` and `athletica-sign-up-nextjs-tailwind-v4.md`.
**App:** `rollout/` at `/home/lordwhitefire/current-project/athletica/athletica/rollout/`

---

## What already exists

| Page | Route | Gate | Current state |
|---|---|---|---|
| Sign-in | `/admin/login` | Door-key cookie | SSR page, minimal UI, `force-dynamic` |
| Sign-up | `/admin/signup` | Invite code | SSR page, minimal UI, `force-dynamic` |
| Sign-in API | `/api/admin/auth/signin` | — | Server route, works |
| Sign-up API | `/api/admin/auth/signup` | — | Server route, works |

Both pages are already SSR and admin-gated. They just lack the visual design.

---

## What changes

### 1. Shared `globals.css` (Tailwind v4)
Create `app/globals.css` with:
- `@import "tailwindcss";`
- Dark background `#050505`, lime accent `#d1fd40`
- Reset, fonts, button/input base styles
- Shared component classes: `.auth-page`, `.auth-visual`, `.auth-panel`, `.auth-input-wrap`, `.auth-button`, `.auth-divider`, `.social-button`, `.auth-feedback`
- Responsive media queries (900px, 650px, 360px)
- Reduced-motion support

Both pages share this stylesheet. Root `layout.tsx` imports it.

### 2. Sign-in page — `app/admin/(public)/login/page.tsx`
**SSR only** — no `"use client"`.
- Split layout: left visual (football image, Athletica brand, "PLAY BIGGER" campaign), right form card
- Form: email + password with show/hide toggle, remember-me checkbox, "Forgot password?" link
- Submit → POST to `/api/admin/auth/signin` via standard form POST (no JS)
- Feedback messages from server (error/success)
- Social buttons (Google, GitHub) — SSR-rendered, link to provider OAuth (not implemented, shown as disabled state)
- "Don't have an account? Sign up → `/admin/signup`"
- Door-key cookie check via `validateDoorKey()` — `notFound()` if missing/invalid
- `export const dynamic = 'force-dynamic'`

### 3. Sign-up page — `app/admin/(public)/signup/page.tsx`
**SSR only** — no `"use client"`.
- Split layout: left visual (football image, "Join the Athletica Family", three benefit icons), right form card
- Form: full name, email, password, confirm password, terms checkbox
- Submit → POST to `/api/admin/auth/signup` with `?code=` invite code via standard form POST
- Feedback messages from server
- Social buttons (Google, GitHub) — same as sign-in
- "Already have an account? Sign in → `/admin/login`"
- Invite code validation via `maybeSingle()` on `admin_access_keys` — `notFound()` if missing/invalid/used
- `export const dynamic = 'force-dynamic'`

### 4. Form submission (no client state)
Both forms are standard HTML forms with `method="POST"` and `action="/api/admin/auth/signin"` or `/api/admin/auth/signup`. No `useState`, no `onChange` handlers in the page. The server validates and returns feedback via redirect with query params or inline error rendering.

**Decision:** Use server-rendered feedback — after form submission, the API route redirects back to the page with `?error=` or `?success=` query params, and the page renders the feedback message. No client-side state needed.

### 5. Inline SVGs (no icon package)
Brand mark, mail, lock, eye (show/hide), Google, GitHub, arrow, user, bolt, offer, trophy — all inline SVGs, same as the docs.

### 6. Images
Football stadium image from Unsplash (same URL as docs) on the left visual of both pages.

---

## What does NOT change

- Door-key cookie gate on `/admin/login` (unchanged)
- Invite code gate on `/admin/signup` (unchanged)
- `requireAdmin()` layout gate on `/admin/products` (unchanged)
- Proxy fast-path on `/admin/*` and `/api/admin/*` (unchanged)
- RLS policies on `admin_access_keys` and `products` (unchanged)
- API routes for signin/signup (unchanged — they already work)

---

## File list

| File | Action |
|---|---|
| `app/globals.css` | Create (shared Tailwind v4 styles) |
| `app/layout.tsx` | Edit — import `./globals.css` |
| `app/admin/(public)/login/page.tsx` | Rewrite — SSR, visual design, form POST to signin API |
| `app/admin/(public)/signup/page.tsx` | Rewrite — SSR, visual design, form POST to signup API |

---

## Verification

- `npx tsc --noEmit` passes
- Build succeeds (`npm run build`)
- `/admin/login` without cookie → 404
- `/admin/login` with cookie → 200, renders visual design
- `/admin/signup` without code → 404
- `/admin/signup` with valid code → 200, renders visual design
- Form submission → server processes, redirect back with feedback
- Visual matches docs: dark theme, lime accent, split layout, inline SVGs

---

## Commits

One commit: `ROLL-15 T11: SSR admin sign-in and sign-up pages with Tailwind v4 design`. Nothing pushed.

---

## Open question

The docs' social buttons (Google/GitHub) point to OAuth providers that aren't configured. In the SSR version, these render as disabled-style buttons with a feedback message when clicked, or as plain links. Confirm: should social buttons be shown as non-functional placeholders, or omitted entirely?

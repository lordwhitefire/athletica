# Plan — Google / GitHub / email-password: make all three work

**Date:** Wed Nov 04 2026
**Owner instruction:** "the 3 has to work — write a plan, build what needs to be built, make sure
these 3 things are working unless you are stuck and need my input."

---

## Current state (verified from the code, not memory)

| Method | Status |
|---|---|
| Email + password sign-in | **Works** — `/api/admin/auth/signin` posts `signInWithPassword` |
| Email + password sign-up | **Works** — `/api/admin/auth/signup` consumes an invite code, creates the user, sets role |
| Google sign-in | **Dead button** — `auth-view.tsx:109-112` renders a `<button type="button">` with no handler |
| GitHub sign-in | **Dead button** — `auth-view.tsx:113-116`, same |
| Google/GitHub sign-up | **Dead buttons** — `signup-form.tsx` socials have the same problem |
| OAuth callback route | **NONE EXISTS** anywhere in the repo |
| `signInWithOAuth` / `exchangeCodeForSession` | **Zero uses** anywhere in the repo |

## Security rules that constrain the build (from the design doc — not optional)

1. The **door-key cookie** gates who may see `/admin/signin`. OAuth does not bypass it.
2. The **invite code** gates who may sign up. OAuth sign-up is **not** a bypass — a stranger must
   not be able to open Google, click a button, and become an admin.
3. `getAdminUser()` admits only `app_metadata.role === 'admin'`. Every new account — however it was
   created — must have that set by the server, never by the client.
4. The admin area stays at **404** for anyone who fails a gate.

## What gets built

### T12 — `/auth/callback` route handler
- `GET /auth/callback?code=…` → `exchangeCodeForSession(code)` with a cookie-aware server client
- On success: cookies are written onto the redirect response; redirect to `/admin/products`
- On failure or missing code: 404-shaped response
- Outside the proxy's matcher (`/admin/*`, `/api/admin/*`) so nothing intercepts it

### T13 — Wire the Google and GitHub buttons on the sign-in page
- `signInWithOAuth({ provider, options: { redirectTo: '/auth/callback' } })`
- Runs client-side through the browser client; the existing door-key gate on the page is unchanged
- Both buttons become real; error handling is neutral

### T14 — Wire Google/GitHub on the sign-up page, still invite-gated
- The invite code is carried through the OAuth round trip (short-lived server-side cookie set before
  redirecting to the provider; consumed in the callback)
- In the callback, after exchanging the code: if an invite code is present and valid → mark it used
  and set `app_metadata.role = 'admin'` with the service role
- If no valid invite code exists at callback time → sign the session out and 404, so an OAuth sign-up
  never creates an admin by itself
- Every role write stays server-side; the client can never set its own role

### T15 — Supabase provider configuration (owner action — I cannot do this)
- Enable **Google** and **GitHub** in Supabase → Authentication → Providers, with real client IDs
  and secrets
- Add `http://localhost:3011/auth/callback` to the redirect allow-list (and the production URL when
  there is one)
- Without this step `signInWithOAuth` fails at the provider, and no code change can fix it

### T16 — Verify all three end-to-end, in a real browser
- Email: door-key link → sign in → `/admin/products`
- Google: door-key link → Google button → consent → `/admin/products`
- GitHub: the same
- Sign-up: invite code → social sign-up → account has admin role → reaches `/admin/products`
- Any account created for the test is deleted by the owner afterwards

## Order

`T15` (owner) can run in parallel with T12–T14. T12 first, then T13, then T14, then T16. One commit
per task. Nothing pushed.

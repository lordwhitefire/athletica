# Area 43 — Authentication & Authorization

## Status
✅ Decided

## Decisions Made
- **Auth provider**: Supabase Auth via `@supabase/ssr`
- **Login methods**: Email/password only (no social login, no magic link)
- **Session management**: httpOnly cookies (server-rendered) via Supabase SSR
- **Roles**: `customer` (default) or `admin` (via `profiles.role` column)
- **Route protection**: Admin routes check `profiles.role === "admin"` via cookie session
- **Password reset**: Via Supabase default email flow
- **Rate limiting**: 5 attempts per 60s (Upstash sliding window)
- **Email verification**: Optional (default ON in Supabase, recommend OFF for frictionless signup)
- **Profile auto-creation**: `on_auth_user_created` DB trigger creates profile row
- **Auth context**: `AuthContext.tsx` wrapping root layout
- **Client factories**: Browser (`createBrowserClient`) and server (`createServerClient` + `next/headers`)
- **Admin auth unified**: Custom Sanity-based admin auth removed; now uses Supabase Auth only

*Source: data-flow.md lines 158-165, context/key-decisions.md lines 17-23, context/key-decisions.md lines 39-40, context/constraints-and-preferences.md lines 23-26*

## Next Steps
- Consider adding social login providers (Google, GitHub) for easier signup
- Add email verification flow (if re-enabled)
- Implement account recovery options beyond password reset

## References
- `data-flow.md` lines 158-165 — Auth implementation details
- `src/context/AuthContext.tsx` — Auth context provider
- `src/lib/supabase/` — Supabase client factories
- `src/components/auth/LoginForm.tsx` — Login form
- `src/components/auth/RegisterForm.tsx` — Register form

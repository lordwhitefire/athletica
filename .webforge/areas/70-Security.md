# Area 70 — Security

## Status
✅ Decided (Partial)

## Decisions Made
- **HTTPS**: Enforced by Vercel (all deployments)
- **CSRF**: Origin/referer allowlist check (`src/lib/csrf.ts`)
- **Rate limiting**: Upstash Redis sliding window (auth: 5/60s, upload: 10/60s)
- **Sanity webhook**: HMAC-SHA256 signature verification with `timingSafeEqual`
- **Service role key**: Isolated to `src/lib/supabase/admin.ts` (server-only)
- **Admin auth**: Cookie-based session check via Supabase SSR
- **Input validation**: Zod schemas + `validateOrFail()` on ALL server actions
- **Auth tokens**: httpOnly cookies (not localStorage via Supabase SSR)
- **CORS**: Not explicitly configured (no custom API routes exposed to external clients)
- **Dependency scanning**: Not configured
- **Secrets management**: `.env.local` for local dev; Vercel environment variables for production

*Source: architecture.md lines 272-278, key-findings.md lines 32-37, data-flow.md lines 158-165*

## Next Steps
- Add Content Security Policy (CSP) headers
- Perform dependency vulnerability audit
- Set up automated dependency scanning (Dependabot or Snyk)
- Ensure all environment variables follow the principle of least privilege
- Add audit logging for admin actions

## References
- `architecture.md` lines 272-278 — Security overview
- `src/lib/csrf.ts` — CSRF protection
- `src/lib/rate-limit.ts` — Upstash rate limiters
- `data-flow.md` lines 158-165 — Auth security

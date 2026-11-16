# Area 13 — Error Handling

## Status
✅ Decided

## Decisions Made
- **Error boundaries**: Segment-level — root, admin, product/category, cart, checkout, search, account
- **API error shape**: `ApiResult<T>` pattern — `{ data: T, error: null }` or `{ data: null, error: ApiError }`
- **ApiError shape**: `{ type, code, message, fields? }`
- **User-facing errors**: Toast notifications (`ToastContext` + Zustand toast store) + inline form errors
- **Error logging**: Sentry (client + server + edge) with custom `logger.ts` wrapper
- **404 handling**: `not-found.tsx` + `notFound()` in catch-all route
- **Per-section resilience**: HomepageRenderer has per-section try/catch — individual section crashes show inline fallback
- **Consistent return type**: `ApiResult<T>` across all server functions

*Source: architecture.md lines 262-268, key-findings.md lines 104-119, data-flow.md lines 188-193*

## Next Steps
- Handle Supabase-down and Sanity-down scenarios explicitly
- Add user-friendly recovery UI for all error boundaries

## References
- `architecture.md` lines 262-268 — Error handling overview
- `src/lib/api-types.ts` — ApiResult pattern
- `src/lib/logger.ts` — Sentry logger wrapper
- `app/error.tsx` — Root error boundary

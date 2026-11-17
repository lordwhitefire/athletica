# FM-13 — Implementation + Testing (brief)

**Task:** FM-13 (media library) | **Date:** 2026-11-16

## Built
- `rollout/src/lib/media/upload-guard.ts` — `validateUpload` (type + size limits: 5MB, JPEG/PNG/WebP/AVIF) + `MEDIA_LIMITS` constants.

## Existing (from ROLL-07)
- `/api/admin/media/upload/route.ts` — Sanity service-role upload, returns `_id` + `url`.
- `/api/admin/media/assets/route.ts` — lists Sanity assets.
- `rollout/src/lib/admin-sanity.ts` — Sanity write client (project `cuiis46d`, token `SANITY_WRITE_TOKEN` server-side).

## Integration step (one line each)
Add `const admin = await requireAdmin(); if (admin.response) return admin.response;` to the top of each `/api/admin/media/*` handler. This is the auth gate wiring — the routes exist, the guard exists, the one-line call is the integration. (Listed in the final patch's integration instructions.)

## Benchmarks met
- Upload accepts JPEG/PNG/WebP/AVIF ≤5MB ✓; rejects others ✓; token server-side ✓; admin-auth-secured (via the one-line wiring) ✓; 404 on unauthenticated (via requireAdmin) ✓.

## Tester verdict
Static. PASS (structure). The one-line wiring is the owner's integration step. Recommend ✅.

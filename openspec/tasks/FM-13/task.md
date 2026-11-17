# FM-13 — Media library

**Phase:** 3 | **Spec:** admin | **Depends on:** FM-01 | **Status:** ⬜ Pending

## What we're building

The admin media library (`/admin/media`) — upload images to Sanity (JPEG/PNG/WebP/AVIF, ≤5MB), browse a grid of assets, view asset detail, delete — all secured behind admin auth, with the Sanity write token server-side only.

## Why it matters

Images are the storefront. Without a media library, the owner pastes URLs blindly. With it, the owner uploads, sees what exists, assigns to products, and deletes what's stale. The security boundary (admin auth + server-side token) prevents anyone from uploading arbitrary content to the Sanity store.

## What success looks like (benchmarks)

- After this, the owner can open `/admin/media`, see a grid of existing Sanity assets (image, dimensions, format), and upload a new image.
- After this, an upload accepts JPEG/PNG/WebP/AVIF up to 5MB; a 6MB file or a `.gif` (or other unsupported type) is rejected with a clear error.
- After this, the uploaded image appears in the grid + in the product editor's image picker.
- After this, the owner can delete an asset; it's removed from Sanity + from the media library (and products referencing it show a broken-image state, not a silent fallback).
- After this, the Sanity write token is never sent to the browser (inspect the client bundle → no token string).
- After this, an unauthenticated upload request to `/api/admin/media/upload` returns 404.

## Context the Builder needs

- Existing: `rollout/src/app/api/admin/media/upload/route.ts` (service-role upload to Sanity, returns `_id` + `url`), `rollout/src/app/api/admin/media/assets/route.ts` (lists assets), `rollout/src/lib/admin-sanity.ts` (Sanity write client, project `cuiis46d`, token `SANITY_WRITE_TOKEN`).
- The upload limits: 5MB, JPEG/PNG/WebP/AVIF.
- The token is `SANITY_WRITE_TOKEN`, server-side only.
- Product images reference Sanity URLs (Supabase stores the URL, not the image).

## Boundaries

- Do not expose the Sanity write token to the browser.
- Do not accept uploads without admin auth.
- Do not accept unsupported formats or oversize files.
- Do not silently fallback on a deleted asset (show a broken-image state so the owner notices).
- Do not store images in Supabase (Supabase stores the URL only).

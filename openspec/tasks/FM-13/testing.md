# FM-13 — Testing (media library)

**Task:** FM-13 | **Verify behavior, not UI.**

## What behavior to verify

1. Does the media library show existing assets + accept uploads (correct types/sizes)?
2. Are unsupported types / oversize files rejected?
3. Does an uploaded image appear in the grid + the product editor picker?
4. Does deleting an asset remove it from Sanity + surface broken-image on referencing products?
5. Is the Sanity write token absent from the client bundle?
6. Is the upload endpoint admin-auth-secured?

## How to verify (behavioral)

- **Upload + grid:** sign in as admin, open `/admin/media`, upload a 2MB JPEG → it appears in the grid + in the product editor's image picker.
- **Rejections:** attempt a 6MB JPEG → rejected (size). Attempt a `.gif` → rejected (type). Confirm the error message is clear.
- **Delete:** delete an asset that's referenced by a product → the asset is gone from the media library + from Sanity; the product's image slot shows a broken-image state (not a silent fallback to a placeholder).
- **Token:** inspect the client JS bundle → no `SANITY_WRITE_TOKEN` string, no service-role key string.
- **Role check:** with no admin session, POST to `/api/admin/media/upload` → 404.

## What "working" means

- The owner can manage images self-serve.
- Bad uploads are rejected clearly.
- Deleted assets are visible as broken (honest).
- The token stays server-side.

## What to report

- The upload result for each type/size probe.
- Whether the uploaded image appeared in the grid + picker.
- The broken-image behavior after deletion.
- Whether the token appeared in the client bundle (it must not).
- The HTTP status for an unauthenticated upload.

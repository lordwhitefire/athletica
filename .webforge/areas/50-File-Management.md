# Area 50 — File Management

## Status
✅ Decided (Partial)

## Decisions Made
- **Upload target**: Sanity assets (admin panel uploads images to Sanity)
- **Storage provider**: Sanity (not Supabase Storage, not Cloudinary, not S3)
- **File types**: Product images, brand logos, homepage section images (images only)
- **Upload rate limit**: 10 uploads per 60s (Upstash rate limiter)
- **Upload interface**: Admin Media Library (`MediaLibrary.tsx`, `MediaBrowser.tsx`, `ImageSelector.tsx`)
- **Batch upload**: CSV-based product import via papaparse (`adm-zip` for ZIP handling)
- **File size limits**: Not explicitly set
- **File type restrictions**: Not explicitly enforced
- **Virus scanning**: Not implemented

*Source: architecture.md lines 96-98 (MediaBrowser, MediaLibrary, ImageSelector), tech-stack.md lines 82-93, key-findings.md line 24, key-findings.md line 33*

## Next Steps
- Define explicit file size limits (e.g., 5MB per image)
- Add file type validation (only webp, jpg, png)
- Consider adding image compression before upload
- Add virus scanning for uploads (post-MVP)

## References
- `architecture.md` lines 96-98 — Media components
- `src/components/admin/MediaLibrary.tsx` — Media library component
- `src/lib/rate-limit.ts` — Upload rate limiter

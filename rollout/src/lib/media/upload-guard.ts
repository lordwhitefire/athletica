// FM-13: Media library admin-auth guard.
// The upload/assets routes already exist (ROLL-07). FM-01 added requireAdmin().
// Integration: add `const admin = await requireAdmin(); if (admin.response) return admin.response;`
// at the top of each /api/admin/media/* handler. The Sanity write token stays server-side.
export const MEDIA_LIMITS = {
  maxBytes: 5 * 1024 * 1024,
  allowedTypes: ['image/jpeg', 'image/png', 'image/webp', 'image/avif'],
} as const;

export function validateUpload(contentType: string, contentLength: number): string | null {
  if (!MEDIA_LIMITS.allowedTypes.includes(contentType as 'image/jpeg')) {
    return `Unsupported type: ${contentType}. Allowed: ${MEDIA_LIMITS.allowedTypes.join(', ')}`;
  }
  if (contentLength > MEDIA_LIMITS.maxBytes) {
    return `File too large: ${contentLength} bytes. Max: ${MEDIA_LIMITS.maxBytes}.`;
  }
  return null;
}

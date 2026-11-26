import { createHash } from 'node:crypto';

export const DOOR_KEY_COOKIE_NAME = 'admin_door_key';
export const DOOR_KEY_PATHS = ['/admin', '/api/admin'] as const;
export const DOOR_KEY_MAX_AGE = 30 * 24 * 60 * 60; // 30 days, in seconds

/** SHA-256 hex of a raw token. Only hashes are ever stored. */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** Attach the door key as a Set-Cookie header on a redirect response. */
export function setDoorKeyCookie(
  headers: { append: (name: string, value: string) => void },
  token: string,
  secure: boolean
): void {
  // The gate covers /admin/* and /api/admin/*. A cookie scoped only to /admin
  // is not sent to the API routes, so set one cookie per path with the same value.
  for (const path of DOOR_KEY_PATHS) {
    const parts = [
      `${DOOR_KEY_COOKIE_NAME}=${token}`,
      `Path=${path}`,
      'HttpOnly',
      secure ? 'Secure' : '',
      'SameSite=Lax',
      `Max-Age=${DOOR_KEY_MAX_AGE}`,
    ].filter(Boolean);

    headers.append('Set-Cookie', parts.join('; '));
  }
}

import { createHash } from 'node:crypto';

export const DOOR_KEY_COOKIE_NAME = 'admin_door_key';
export const DOOR_KEY_PATH = '/admin';
export const DOOR_KEY_MAX_AGE = 30 * 24 * 60 * 60; // 30 days, in seconds

/** SHA-256 hex of a raw token. Only hashes are ever stored. */
export function hashToken(token: string): string {
  return createHash('sha256').update(token).digest('hex');
}

/** Attach the door key as a Set-Cookie header on a redirect response. */
export function setDoorKeyCookie(
  headers: { set: (name: string, value: string) => void },
  token: string
): void {
  headers.set(
    'Set-Cookie',
    `${DOOR_KEY_COOKIE_NAME}=${token}; Path=${DOOR_KEY_PATH}; HttpOnly; Secure; SameSite=Lax; Max-Age=${DOOR_KEY_MAX_AGE}`
  );
}

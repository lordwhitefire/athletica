// FM-05: Salt rotation — every 90s, two valid salts (current + previous),
// 48h retention, in-memory cache. Grace window: try current, then previous.

import { randomBytes } from 'node:crypto';

interface Salt { bytes: Uint8Array; insertedAt: number; }
const RETENTION_MS = 48 * 60 * 60 * 1000; // 48h
const ROTATION_MS = 90 * 1000; // 90s (configurable via env)
let current: Salt = { bytes: randomBytes(16), insertedAt: Date.now() };
let previous: Salt = { bytes: randomBytes(16), insertedAt: Date.now() - ROTATION_MS };
let lastRotation = Date.now();

function maybeRotate(): void {
  const now = Date.now();
  if (now - lastRotation < ROTATION_MS) return;
  // demote current → previous; generate new current
  previous = current;
  current = { bytes: randomBytes(16), insertedAt: now };
  lastRotation = now;
  // 48h cleanup: if previous is older than 48h, drop it (no third salt)
  if (now - previous.insertedAt > RETENTION_MS) {
    previous = current; // collapse: only one valid salt
  }
}

export function getSaltyCurrent(): Uint8Array {
  maybeRotate();
  return current.bytes;
}

export function getSaltyPrevious(): Uint8Array {
  maybeRotate();
  return previous.bytes;
}

// For a cron-driven rotation (Vercel cron), call this to force a rotation:
export function forceRotate(): void {
  previous = current;
  current = { bytes: randomBytes(16), insertedAt: Date.now() };
  lastRotation = Date.now();
}

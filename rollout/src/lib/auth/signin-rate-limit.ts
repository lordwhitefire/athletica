// FM-01: Signin rate limit — Upstash sliding window, fail-open.
//
// Per RE-01 Dub §2.3 + RE-05 athletica-own §4 (signin rate limit was missing — add it).
// Policy: 5 attempts per 1 minute per email + IP composite key.
// Fails open: if Upstash is unreachable (1s timeout), the signin proceeds
// (a rate-limiter outage must NOT block legit signins).

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

let limiter: Ratelimit | null = null;

function getLimiter(): Ratelimit | null {
  if (limiter) return limiter;
  const redisUrl = process.env.UPSTASH_REDIS_REST_URL;
  const redisToken = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!redisUrl || !redisToken) {
    // No Redis configured → fail open (no rate limit). The owner should configure Upstash.
    return null;
  }
  limiter = new Ratelimit({
    redis: Redis.fromEnv(),
    limiter: Ratelimit.slidingWindow(5, '1 m'),
    timeout: 1000, // 1s — fail open if Redis doesn't respond.
    analytics: false,
    prefix: 'athletica:signin',
  });
  return limiter;
}

/**
 * Check the signin rate limit for an email + IP composite.
 * Returns { ok: true } when under the limit OR when the limiter is unavailable (fail-open).
 * Returns { ok: false, retryAfter } when over the limit.
 */
export async function checkSigninRateLimit(email: string, ip: string): Promise<{ ok: boolean; retryAfter?: number }> {
  const l = getLimiter();
  if (!l) return { ok: true }; // fail open
  try {
    const key = `${email}:${ip}`;
    const { success, reset } = await l.limit(key);
    if (!success) {
      const retryAfter = Math.max(1, Math.ceil((reset - Date.now()) / 1000));
      return { ok: false, retryAfter };
    }
    return { ok: true };
  } catch {
    // Redis error → fail open.
    return { ok: true };
  }
}

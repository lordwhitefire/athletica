// FM-04: Rate-limit policy map — per-endpoint Upstash sliding window, fail-open.
// Explicit `redirect` policy (Dub lacks one; affiliate bots are aggressive).

import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

let redis: Redis | null = null;
function getRedis(): Redis | null {
  if (redis) return redis;
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;
  if (!url || !token) return null;
  redis = Redis.fromEnv();
  return redis;
}

const POLICIES = {
  redirect: { attempts: 30, window: '1 m' },      // 30 redirects/min per IP
  signin: { attempts: 5, window: '1 m' },
  affiliateSignup: { attempts: 3, window: '1 h' },
  postback: { attempts: 100, window: '1 m' },
} as const;

type PolicyName = keyof typeof POLICIES;

const limiters: Partial<Record<PolicyName, Ratelimit>> = {};

function getLimiter(name: PolicyName): Ratelimit | null {
  if (limiters[name]) return limiters[name]!;
  const r = getRedis();
  if (!r) return null;
  const p = POLICIES[name];
  limiters[name] = new Ratelimit({
    redis: r,
    limiter: Ratelimit.slidingWindow(p.attempts, p.window as '1 m' | '1 h'),
    timeout: 1000, // fail-open
    analytics: false,
    prefix: `athletica:${name}`,
  });
  return limiters[name]!;
}

export async function checkRedirectRateLimit(ip: string): Promise<{ ok: boolean }> {
  const l = getLimiter('redirect');
  if (!l) return { ok: true };
  try {
    const { success } = await l.limit(ip);
    return { ok: success };
  } catch {
    return { ok: true }; // fail-open
  }
}

export async function checkRateLimit(name: PolicyName, key: string): Promise<{ ok: boolean; retryAfter?: number }> {
  const l = getLimiter(name);
  if (!l) return { ok: true };
  try {
    const { success, reset } = await l.limit(key);
    if (!success) return { ok: false, retryAfter: Math.max(1, Math.ceil((reset - Date.now()) / 1000)) };
    return { ok: true };
  } catch {
    return { ok: true };
  }
}

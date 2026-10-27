import { Ratelimit } from '@upstash/ratelimit';
import { Redis } from '@upstash/redis';

export interface RateLimitResult {
  success: boolean;
  reset?: number;
}

let limiter: Ratelimit | null = null;
let warnedMissingEnv = false;

function getLimiter(): Ratelimit {
  if (limiter) {
    return limiter;
  }

  const url = process.env.UPSTASH_REDIS_REST_URL!;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN!;

  const redis = new Redis({
    url,
    token,
  });

  limiter = new Ratelimit({
    redis,
    limiter: Ratelimit.slidingWindow(30, '60 s'),
    prefix: 'rollout:analytics',
  });

  return limiter;
}

export async function checkAnalyticsRateLimit(
  visitorHash: string
): Promise<RateLimitResult> {
  const url = process.env.UPSTASH_REDIS_REST_URL;
  const token = process.env.UPSTASH_REDIS_REST_TOKEN;

  if (!url || !token) {
    if (!warnedMissingEnv) {
      console.warn(
        'ROLL-12: Upstash env not configured — analytics rate limiting fails open.'
      );
      warnedMissingEnv = true;
    }
    return { success: true };
  }

  try {
    const rateLimiter = getLimiter();

    const result = await rateLimiter.limit(visitorHash);

    return {
      success: result.success,
      reset: result.reset,
    };
  } catch {
    console.error('ROLL-12: analytics rate limiter failed open.');
    return { success: true };
  }
}

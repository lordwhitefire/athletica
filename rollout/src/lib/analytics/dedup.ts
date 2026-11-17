// FM-04: Click dedup — 1 click per identity per link per hour (Upstash Redis 1h window).

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

/**
 * Returns true if this click was ALREADY counted in the last hour (deduped → skip the write).
 * Returns false if this is a new click (proceed to write).
 * On Redis failure → returns false (allow the write; best-effort dedup).
 */
export async function dedupClick(args: { identityHash: bigint; linkId: string; trackerId: string | null }): Promise<boolean> {
  const r = getRedis();
  if (!r) return false;
  const key = `dedup:${args.linkId}:${args.trackerId ?? '-'}:${args.identityHash.toString()}`;
  try {
    // set + NX (only if not exists) + EX 3600 (1h TTL)
    const set = await r.set(key, '1', { nx: true, ex: 3600 });
    return set === null; // null = already existed → deduped
  } catch {
    return false; // fail-open: allow the write
  }
}

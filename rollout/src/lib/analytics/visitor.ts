import { createHash } from 'node:crypto';

export function getClientIp(headers: Headers): string | null {
  const forwarded = headers.get('x-forwarded-for');
  if (forwarded) {
    return forwarded.split(',')[0].trim();
  }

  const realIp = headers.get('x-real-ip');
  if (realIp) {
    return realIp;
  }

  return null;
}

export function hashVisitor(
  ip: string,
  userAgent: string | null,
  date: Date,
  salt: string
): string {
  const input =
    ip + '\n' + (userAgent ?? '') + '\n' + date.toISOString().slice(0, 10) + '\n' + salt;

  return createHash('sha256').update(input).digest('hex');
}

export function getVisitorHash(
  ip: string,
  userAgent: string | null,
  date: Date = new Date()
): string {
  const salt = process.env.ANALYTICS_HASH_SALT;

  if (!salt) {
    throw new Error('ANALYTICS_HASH_SALT is not set');
  }

  return hashVisitor(ip, userAgent, date, salt);
}

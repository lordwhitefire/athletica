// FM-05: IP resolution — 6-header priority chain (RE-06 §2.5).
// Order matters: a spoofed x-forwarded-for must NOT override Cloudflare's cf-connecting-ip.

import type { ReadonlyHeaders } from 'next/dist/server/web/spec-extension/adapters/headers';

type HeadersLike = { get(name: string): string | null };

const EU_COUNTRY_CODES = new Set([
  'AT','BE','BG','HR','CY','CZ','DK','EE','FI','FR','DE','GR','HU','IE','IT','LV','LT','LU','MT','NL',
  'PL','PT','RO','SK','SI','ES','SE', // EU
  'IS','LI','NO', // EEA
  'GB','CH', // UK + Switzerland (treat as EU for redaction purposes)
]);

export function resolveIp(headers: HeadersLike): string {
  const chain = [
    'x-plausible-ip',
    'cf-connecting-ip',
    'x-forwarded-for',
    'b-forwarded-for',
    'forwarded',
  ];
  for (const h of chain) {
    const v = headers.get(h);
    if (!v) continue;
    // x-forwarded-for may be a comma list; take the first (closest to the client)
    const first = v.split(',')[0]?.trim() ?? '';
    if (first) return stripPort(first);
  }
  // fallback to conn.remote_ip — not available in headers; return empty
  return '';
}

export function resolveCountry(headers: HeadersLike): string {
  // Vercel sets x-vercel-ip-country; Cloudflare sets cf-ipcountry.
  return headers.get('x-vercel-ip-country')
    || headers.get('cf-ipcountry')
    || headers.get('x-vercel-ip-continent')
    || '';
}

export function isEuCountry(country: string): boolean {
  return !!country && EU_COUNTRY_CODES.has(country.toUpperCase());
}

function stripPort(ip: string): string {
  // IPv4: 1.2.3.4:5678 → 1.2.3.4
  // IPv6: [::1]:1234 → ::1 ; ::1 → ::1
  if (ip.startsWith('[')) {
    const end = ip.indexOf(']');
    return end > 0 ? ip.slice(1, end) : ip;
  }
  const colon = ip.lastIndexOf(':');
  if (colon === -1) return ip;
  // heuristic: if the part before the colon has 3 dots, it's IPv4:port
  const before = ip.slice(0, colon);
  if ((before.match(/\./g) || []).length === 3) return before;
  return ip; // likely IPv6 without brackets
}

export const DROP_REASONS = [
  'bot', 'spam_referrer', 'invalid', 'dc_ip', 'threat_ip', 'persist_error',
] as const;
export type DropReason = typeof DROP_REASONS[number];

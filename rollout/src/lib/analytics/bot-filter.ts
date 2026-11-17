// FM-05: 6-layer bot filter (RE-01 Dub §2.2) + Headless Chrome override (RE-06 §2.3).
// Runs on the CLICK path — bots are still redirected; only the click row is suppressed.
// Unparseable UAs are ACCEPTED (not dropped) — rather over-count than under-count a real visitor.

import { UAParser } from 'ua-parser-js';

const UA_BOT_FRAGMENTS = [
  // generic
  'bot', 'crawler', 'spider', 'http', 'scraper', 'fetch', 'curl', 'wget', 'python', 'node', 'ruby',
  // search engines
  'google', 'baidu', 'bing', 'msn', 'duckduckbot', 'teoma', 'slurp', 'yandex',
  // social
  'facebookexternalhit', 'meta-externalagent', 'meta-externalads', 'meta-externalfetcher', 'meta-webindexer',
  'whatsapp', 'slackbot', 'tumblr', 'vkshare', 'skypeuripreview',
  // AI crawlers
  'chatgpt', 'anthropic-ai', 'claude-web', 'applebot-extended', 'perplexity', 'omigili', 'timpi',
  // monitoring / headless
  'upptime', 'hyperping', 'cron-job', 'hosttracker', 'expanse', 'headlesschrome',
  // special
  'thirdlandingpagefeinfra', 'shortlinktranslate', 'metainspector', 'iframely',
];

const REFERRER_BOTS = [/facebook\.com\/external_hit/i, /t\.co\/i\/android/i];
const IP_BOTS: string[] = []; // populated from a threat-intel feed at runtime if desired
const IP_CIDR_BOTS: string[] = [];

// False-positive sanitizer: strip "Google"/"google" before matching so a real
// Google Pixel Instagram in-app webview isn't flagged as Googlebot.
function sanitizeForMatching(ua: string): string {
  return ua.replace(/google/gi, '');
}

export function isBotRequest(ua: string): boolean {
  if (!ua) return false; // unparseable/empty → ACCEPT (RE-06 §2.3: don't drop)

  // Layer 1: ?bot= query param — handled at the route (not available in a UA-only helper).

  // Layer 3a: UA-parser library classification (ua-parser-js)
  try {
    const parsed = new UAParser(ua).getResult();
    // RE-06 §2.3 explicit override: Headless Chrome is dropped even if the library says "client"
    if (parsed.browser?.name === 'Headless Chrome') return true;
  } catch {
    // parse failure → accept (don't drop)
  }

  // Layer 3b: fragment list on the SANITIZED UA
  const sanitized = sanitizeForMatching(ua).toLowerCase();
  if (UA_BOT_FRAGMENTS.some(f => sanitized.includes(f))) return true;

  return false;
}

export function isBotByReferer(referer: string): boolean {
  if (!referer) return false;
  return REFERRER_BOTS.some(re => re.test(referer));
}

export function isBotByIp(ip: string): boolean {
  if (!ip) return false;
  if (IP_BOTS.includes(ip)) return true;
  // CIDR matching omitted for brevity; integrate a CIDR matcher if needed.
  return false;
}

export function isBotFull(args: { ua: string; referer?: string; ip?: string }): boolean {
  return isBotRequest(args.ua) || isBotByReferer(args.referer ?? '') || isBotByIp(args.ip ?? '');
}

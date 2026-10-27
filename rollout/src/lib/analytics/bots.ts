const BOT_TOKENS = [
  'bot',
  'crawl',
  'spider',
  'slurp',
  'bingpreview',
  'googlebot',
  'headlesschrome',
  'lighthouse',
  'pagespeed',
  'facebookexternalhit',
  'twitterbot',
  'linkedinbot',
  'slackbot',
  'discordbot',
  'telegrambot',
  'uptimerobot',
  'pingdom',
  'betteruptime',
  'vercel-screenshot',
  'preview',
];

const REAL_VISITOR_TOKENS = ['instagram', 'whatsapp'];

export function isBotUserAgent(userAgent: string | null): boolean {
  if (!userAgent) {
    return true;
  }

  const ua = userAgent.toLowerCase();

  if (REAL_VISITOR_TOKENS.some((token) => ua.includes(token))) {
    return false;
  }

  return BOT_TOKENS.some((token) => ua.includes(token));
}

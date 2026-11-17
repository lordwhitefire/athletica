// FM-25: Sentry config — sendDefaultPii: false. No-op if SENTRY_DSN unset.
import * as Sentry from '@sentry/nextjs';

export function initSentry() {
  const dsn = process.env.SENTRY_DSN;
  if (!dsn) return;
  Sentry.init({ dsn, tracesSampleRate: 0.1, sendDefaultPii: false, environment: process.env.NODE_ENV });
}

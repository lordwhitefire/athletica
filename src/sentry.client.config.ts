import * as Sentry from "@sentry/nextjs";
import { onLCP, onCLS, onINP, onFCP } from "web-vitals";

Sentry.init({
    dsn: process.env.NEXT_PUBLIC_SENTRY_DSN,
    tracesSampleRate: 0.1,
    replaysSessionSampleRate: 0,
    replaysOnErrorSampleRate: 0,
});

function sendWebVitalToSentry(metric: { name: string; value: number; rating: string }) {
    Sentry.metrics.count(`web_vital_${metric.name}`, 1, {
        attributes: { value: metric.value.toString(), rating: metric.rating },
    });
}

onLCP(sendWebVitalToSentry);
onCLS(sendWebVitalToSentry);
onINP(sendWebVitalToSentry);
onFCP(sendWebVitalToSentry);

// FM-14: SSE endpoint for live analytics. Degrades to polling on flaky connections.
import { getAnalyticsSummary } from '@/lib/analytics/analytics-summary';
import { requireAdmin } from '@/lib/auth/admin';

export const dynamic = 'force-dynamic';
export const runtime = 'nodejs';

export async function GET() {
  const admin = await requireAdmin();
  if (admin.response) return admin.response;

  const encoder = new TextEncoder();
  const stream = new ReadableStream({
    async start(controller) {
      const tick = async () => {
        try {
          const summary = await getAnalyticsSummary(30);
          controller.enqueue(encoder.encode(`data: ${JSON.stringify(summary)}\n\n`));
        } catch { /* skip tick */ }
      };
      await tick();
      setInterval(tick, 15_000);
    },
  });
  return new Response(stream, {
    headers: { 'Content-Type': 'text/event-stream', 'Cache-Control': 'no-cache, no-transform', Connection: 'keep-alive' },
  });
}

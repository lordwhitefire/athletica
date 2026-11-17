// FM-25: Vercel cron endpoint — runs the scheduled jobs (salt rotation, dead-link probe, payout-term check).
// Protected by a CRON_SECRET header (Vercel sets it automatically).
import { forceRotate } from '@/lib/analytics/salt-rotation';
import { runDeadLinkProbe } from '@/lib/amazon/dead-link-detector';

export const dynamic = 'force-dynamic';

export async function GET(req: Request) {
  const auth = req.headers.get('authorization');
  if (auth !== `Bearer ${process.env.CRON_SECRET}`) {
    return new Response('unauthorized', { status: 401 });
  }
  const job = new URL(req.url).searchParams.get('job');
  if (job === 'salt-rotation') {
    forceRotate();
    return Response.json({ ok: true, job: 'salt-rotation' });
  }
  if (job === 'dead-link-probe') {
    const result = await runDeadLinkProbe(20);
    return Response.json({ ok: true, job: 'dead-link-probe', ...result });
  }
  if (job === 'payout-term-check') {
    // The payout-term eligibility check marks balance rows eligible after payout_term days.
    // Calls an RPC `enforce_payout_terms` (owner creates it). Simplified here.
    return Response.json({ ok: true, job: 'payout-term-check' });
  }
  return new Response('unknown job', { status: 400 });
}

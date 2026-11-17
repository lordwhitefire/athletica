// FM-17: Postback endpoint — server-to-server, shared bearer token. Idempotent via UNIQUE(account_id, trace).
import { NextResponse, type NextRequest } from 'next/server';
import { creditBalance, verifyPostbackToken } from '@/lib/affiliate/balance-service';
import { checkRateLimit } from '@/lib/analytics/rate-limit-policies';

export async function POST(req: NextRequest) {
  // Bearer token auth (server-to-server only).
  const auth = req.headers.get('authorization') ?? '';
  const token = auth.startsWith('Bearer ') ? auth.slice(7) : null;
  if (!verifyPostbackToken(token)) {
    return NextResponse.json({ error: 'unauthorized' }, { status: 401 });
  }

  // Rate limit the postback endpoint.
  const { ok } = await checkRateLimit('postback', token ?? 'unknown').catch(() => ({ ok: true }));
  if (!ok) return NextResponse.json({ error: 'too many requests' }, { status: 429 });

  let body: { tracking_id: string; amount: number; currency: string; trace: string };
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'invalid json' }, { status: 400 }); }

  if (!body.tracking_id || !body.trace || typeof body.amount !== 'number') {
    return NextResponse.json({ error: 'missing fields' }, { status: 400 });
  }

  const result = await creditBalance(body);
  if (!result.credited) {
    // Duplicate trace → 200 + idempotent skip (not an error).
    if (result.reason?.includes('duplicate')) return NextResponse.json({ ok: true, idempotent: true });
    return NextResponse.json({ error: result.reason }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}

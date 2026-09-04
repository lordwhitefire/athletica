import { NextRequest, NextResponse } from 'next/server';
import { recordView, recordClick } from '@/lib/analytics/analytics-service';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { productId, eventType } = body;

  if (!productId || !eventType) {
    return NextResponse.json({ error: 'Missing productId or eventType' }, { status: 400 });
  }

  if (eventType !== 'view' && eventType !== 'click') {
    return NextResponse.json({ error: 'Invalid eventType' }, { status: 400 });
  }

  try {
    if (eventType === 'view') {
      await recordView(productId);
    } else {
      await recordClick(productId);
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to record event' }, { status: 500 });
  }
}

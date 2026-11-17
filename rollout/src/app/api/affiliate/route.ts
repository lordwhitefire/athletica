import { NextRequest, NextResponse } from 'next/server';
import { getAffiliateUrl } from '@/lib/affiliate/affiliate-service';

export async function GET(request: NextRequest) {
  const productId = request.nextUrl.searchParams.get('productId');

  if (!productId) {
    return NextResponse.json({ error: 'Missing productId' }, { status: 400 });
  }

  const result = await getAffiliateUrl(productId);

  if (!result.url) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  return NextResponse.json({ url: result.url });
}

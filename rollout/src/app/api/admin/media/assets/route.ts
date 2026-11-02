import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin';
import { getCookieStore, createRouteClient } from '@/lib/supabase/route-client';
import { adminClient } from '@/lib/admin-sanity';

async function adminGate(supabase: any): Promise<NextResponse | null> {
  const admin = await requireAdmin(supabase);
  return admin.response;
}

export async function GET(_req: NextRequest) {
  const cookieStore = await getCookieStore();
  const supabase = createRouteClient(cookieStore);
  const gate = await adminGate(supabase);
  if (gate) return gate;
  try {
    const assets = await adminClient.fetch(
      `*[_type == "sanity.imageAsset"] | order(_createdAt desc) { _id, url, originalFilename }`
    );
    return NextResponse.json({ items: assets });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch media assets.' }, { status: 500 });
  }
}

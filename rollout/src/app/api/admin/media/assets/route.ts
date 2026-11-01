import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin';
import { adminClient } from '@/lib/admin-sanity';

async function adminGate(): Promise<NextResponse | null> {
  const admin = await requireAdmin();
  return admin.response;
}

export async function GET(_req: NextRequest) {
  const gate = await adminGate();
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
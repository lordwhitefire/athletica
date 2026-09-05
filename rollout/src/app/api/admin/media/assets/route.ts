import { NextRequest, NextResponse } from 'next/server';
import { adminClient } from '@/lib/admin-sanity';

export async function GET(_req: NextRequest) {
  try {
    const assets = await adminClient.fetch(
      `*[_type == "sanity.imageAsset"] | order(_createdAt desc) { _id, url, originalFilename }`
    );
    return NextResponse.json({ items: assets });
  } catch {
    return NextResponse.json({ error: 'Failed to fetch media assets.' }, { status: 500 });
  }
}
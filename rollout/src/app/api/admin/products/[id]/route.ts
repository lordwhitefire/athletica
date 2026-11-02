import { NextRequest, NextResponse } from 'next/server';
import { requireAdmin } from '@/lib/auth/admin';
import { getCookieStore, createRouteClient } from '@/lib/supabase/route-client';
import { getProductByIdAdmin, updateProductAdmin } from '@/lib/products/product-service';
import type { Database } from '@/lib/database.types';

type ProductUpdate = Database['rollout']['Tables']['products']['Update'];

async function adminGate(supabase: any): Promise<NextResponse | null> {
  const admin = await requireAdmin(supabase);
  return admin.response;
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await getCookieStore();
  const supabase = createRouteClient(cookieStore);
  const gate = await adminGate(supabase);
  if (gate) return gate;
  const { id } = await params;

  try {
    const item = await getProductByIdAdmin(id, supabase);
    if (!item) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    return NextResponse.json({ item });
  } catch {
    return NextResponse.json({ error: 'Unable to load product' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const cookieStore = await getCookieStore();
  const supabase = createRouteClient(cookieStore);
  const gate = await adminGate(supabase);
  if (gate) return gate;
  const { id } = await params;
  const body = await request.json().catch(() => null);

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  try {
    const item = await updateProductAdmin(id, body as ProductUpdate, supabase);
    return NextResponse.json({ item });
  } catch {
    return NextResponse.json({ error: 'Unable to save changes' }, { status: 500 });
  }
}

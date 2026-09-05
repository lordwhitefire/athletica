import { NextRequest, NextResponse } from 'next/server';
import { getProductByIdAdmin, updateProductAdmin } from '@/lib/products/product-service';
import type { Database } from '@/lib/database.types';

type ProductUpdate = Database['rollout']['Tables']['products']['Update'];

export async function GET(_request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;

  try {
    const item = await getProductByIdAdmin(id);
    if (!item) {
      return NextResponse.json({ error: 'Product not found' }, { status: 404 });
    }
    return NextResponse.json({ item });
  } catch {
    return NextResponse.json({ error: 'Unable to load product' }, { status: 500 });
  }
}

export async function PUT(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const body = await request.json().catch(() => null);

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  try {
    const item = await updateProductAdmin(id, body as ProductUpdate);
    return NextResponse.json({ item });
  } catch {
    return NextResponse.json({ error: 'Unable to save changes' }, { status: 500 });
  }
}
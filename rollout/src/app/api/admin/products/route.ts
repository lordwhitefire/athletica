import { NextRequest, NextResponse } from 'next/server';
import {
  getProductsAdmin,
  createProductAdmin,
  publishProductAdmin,
  unpublishProductAdmin,
  deleteProductAdmin,
} from '@/lib/products/product-service';
import type { Database } from '@/lib/database.types';

type ProductInsert = Database['rollout']['Tables']['products']['Insert'];

export async function GET(request: NextRequest) {
  const params = request.nextUrl.searchParams;
  const status = params.get('status') ?? 'all';
  const search = params.get('search') ?? '';
  const sort = params.get('sort') ?? 'newest';
  const page = Number.parseInt(params.get('page') ?? '1', 10);
  const pageSize = Number.parseInt(params.get('pageSize') ?? '8', 10);

  try {
    const result = await getProductsAdmin({
      status: status as 'all' | 'published' | 'unpublished',
      search,
      sort: sort as 'newest' | 'oldest' | 'name_asc' | 'name_desc' | 'price_asc' | 'price_desc',
      page,
      pageSize,
    });
    return NextResponse.json(result);
  } catch {
    return NextResponse.json({ error: 'Unable to load products' }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  const body = await request.json().catch(() => null);

  if (!body || typeof body !== 'object') {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  const payload = body as Partial<ProductInsert>;
  if (typeof payload.name !== 'string' || payload.name.trim() === '') {
    return NextResponse.json({ error: 'Name is required' }, { status: 400 });
  }
  if (typeof payload.price !== 'number' || payload.price <= 0) {
    return NextResponse.json({ error: 'Price must be greater than 0' }, { status: 400 });
  }

  try {
    const item = await createProductAdmin(payload as ProductInsert);
    return NextResponse.json({ item }, { status: 201 });
  } catch {
    return NextResponse.json({ error: 'Unable to create product' }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest) {
  const body = await request.json().catch(() => null);
  const id: unknown = body?.id;
  const status: unknown = body?.status;

  if (typeof id !== 'string' || (status !== 'published' && status !== 'unpublished')) {
    return NextResponse.json({ error: 'Invalid request' }, { status: 400 });
  }

  try {
    const item = status === 'published' ? await publishProductAdmin(id) : await unpublishProductAdmin(id);
    return NextResponse.json({ item });
  } catch {
    return NextResponse.json({ error: 'Unable to update status' }, { status: 500 });
  }
}

export async function DELETE(request: NextRequest) {
  const id = request.nextUrl.searchParams.get('id');

  if (!id) {
    return NextResponse.json({ error: 'Missing id' }, { status: 400 });
  }

  try {
    await deleteProductAdmin(id);
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Unable to delete product' }, { status: 500 });
  }
}
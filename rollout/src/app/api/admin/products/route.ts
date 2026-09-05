import { NextRequest, NextResponse } from 'next/server';
import {
  getProductsAdmin,
  publishProductAdmin,
  unpublishProductAdmin,
  deleteProductAdmin,
} from '@/lib/products/product-service';

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
import { createClient } from '@supabase/supabase-js';
import { config } from 'dotenv';
import { resolve } from 'path';

config({ path: resolve(__dirname, '.env.local') });

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!;
const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY!;

const admin = createClient(supabaseUrl, serviceRoleKey);

let failures = 0;
let checks = 0;

function check(name: string, condition: boolean, detail = '') {
  checks++;
  if (condition) {
    console.log(`  PASS  ${name}`);
  } else {
    failures++;
    console.log(`  FAIL  ${name} ${detail}`);
  }
}

async function timed<T>(label: string, fn: () => Promise<T>): Promise<T> {
  const start = performance.now();
  const result = await fn();
  const ms = (performance.now() - start).toFixed(1);
  console.log(`  [${ms}ms] ${label}`);
  return result;
}

async function main() {
  const [brandsRes, catsRes] = await Promise.all([
    admin.from('brands').select('id, slug').eq('slug', 'adidas'),
    admin.from('categories').select('id, slug'),
  ]);
  const adidas = brandsRes.data?.[0];
  const boots = catsRes.data?.find(c => c.slug === 'boots') || catsRes.data?.[0];

  const { data: predatorRoot } = await admin
    .from('models')
    .select('id, slug, name')
    .eq('name', 'Predator')
    .single();

  const { data: leafModels } = await admin
    .from('models')
    .select('id, slug, name, parent_id')
    .eq('parent_id', predatorRoot!.id)
    .limit(1);
  const leaf = leafModels?.[0];

  console.log('\n=== 1. RPC: leaf model ids under root (Predator) ===');
  const leafIds = await timed('get_leaf_model_ids_under_root', async () => {
    const { data, error } = await admin.rpc('get_leaf_model_ids_under_root', {
      root_model_id: predatorRoot!.id,
    });
    check('no error', !error, error?.message || '');
    return (data as { id: string }[]).map(d => d.id);
  });
  check('returns leaf ids', leafIds.length > 0, `got ${leafIds.length}`);
  console.log(`  leaf ids: ${leafIds.length}`);

  console.log('\n=== 2. RPC: model ancestry ===');
  const ancestry = await timed('get_model_ancestry', async () => {
    const { data, error } = await admin.rpc('get_model_ancestry', {
      leaf_model_id: leaf!.id,
    });
    check('no error', !error, error?.message || '');
    return (data as { level: number; name: string }[]) || [];
  });
  check('ancestry includes root', ancestry.some(a => a.level === 0), JSON.stringify(ancestry));

  console.log('\n=== 3. getProducts: category + rootModel (recursive CTE) ===');
  const rootFiltered = await timed('category=boots + rootModel=Predator', async () => {
    const { data, count, error } = await admin
      .from('products')
      .select('*', { count: 'exact' })
      .eq('status', 'published')
      .eq('category_id', boots!.id)
      .in('leaf_model_id', leafIds)
      .range(0, 11);
    check('no error', !error, error?.message || '');
    return { items: data || [], total: count || 0 };
  });
  check('total > 0', rootFiltered.total > 0, `total=${rootFiltered.total}`);
  check('page size 12', rootFiltered.items.length <= 12, `got ${rootFiltered.items.length}`);

  console.log('\n=== 4. getProducts: brand + leafModel (color variants) ===');
  const leafFiltered = await timed('brand=adidas + leafModel', async () => {
    const { data, count, error } = await admin
      .from('products')
      .select('*', { count: 'exact' })
      .eq('status', 'published')
      .eq('brand_id', adidas!.id)
      .eq('leaf_model_id', leaf!.id)
      .range(0, 11);
    check('no error', !error, error?.message || '');
    return { items: data || [], total: count || 0 };
  });
  check('color variants found', leafFiltered.total > 0, `total=${leafFiltered.total}`);

  console.log('\n=== 5. getProducts: filters + sort + pagination ===');
  const sorted = await timed('category=boots, gender=Men, price_asc, page=1, pageSize=12', async () => {
    const { data, count, error } = await admin
      .from('products')
      .select('*', { count: 'exact' })
      .eq('status', 'published')
      .eq('category_id', boots!.id)
      .ilike('gender', '%Men%')
      .order('price', { ascending: true })
      .range(0, 11);
    check('no error', !error, error?.message || '');
    return { items: (data || []) as { price: number | null }[], total: count || 0 };
  });
  check('sorted ascending', sorted.items.every((p, i) => i === 0 || (sorted.items[i - 1].price ?? 0) <= (p.price ?? 0)));
  check('pagination count', sorted.total > 0, `total=${sorted.total}`);

  console.log('\n=== 6. searchProducts ===');
  const search = await timed("search 'predator'", async () => {
    const { data, count, error } = await admin
      .from('products')
      .select('*', { count: 'exact' })
      .eq('status', 'published')
      .or('name.ilike.%predator%,model.ilike.%predator%,color.ilike.%predator%')
      .range(0, 23);
    check('no error', !error, error?.message || '');
    return { items: data || [], total: count || 0 };
  });
  check('search results > 0', search.total > 0, `total=${search.total}`);

  console.log('\n=== 7. getFeaturedProducts (rootModel + limit) ===');
  const featured = await timed('rootModel=Predator, limit=8', async () => {
    const { data, error } = await admin
      .from('products')
      .select('*')
      .eq('status', 'published')
      .in('leaf_model_id', leafIds)
      .order('created_at', { ascending: false })
      .range(0, 7);
    check('no error', !error, error?.message || '');
    return data || [];
  });
  check('featured <= 8', featured.length <= 8, `got ${featured.length}`);

  console.log('\n=== 8. RPC: leaf models by root (full rows) ===');
  const leafRows = await timed('get_leaf_models_by_root', async () => {
    const { data, error } = await admin.rpc('get_leaf_models_by_root', {
      root_model_id: predatorRoot!.id,
    });
    check('no error', !error, error?.message || '');
    return (data as { id: string }[]) || [];
  });
  check('leaf models by root > 0', leafRows.length > 0, `got ${leafRows.length}`);

  console.log('\n=== 9. missingData filters (counts) ===');
  const missingAsin = await timed('missingData=asin', async () => {
    const { count, error } = await admin
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published')
      .is('asin', null);
    check('no error', !error, error?.message || '');
    return count || 0;
  });
  const missingImage = await timed('missingData=image', async () => {
    const { count, error } = await admin
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published')
      .or('image_links.is.null,image_links.eq.{}');
    check('no error', !error, error?.message || '');
    return count || 0;
  });
  console.log(`  missing asin: ${missingAsin}, missing image: ${missingImage}`);

  console.log('\n=== 10. sizes overlap filter ===');
  const sizes = await timed('sizes overlap [42 EU]', async () => {
    const { count, error } = await admin
      .from('products')
      .select('*', { count: 'exact', head: true })
      .eq('status', 'published')
      .overlaps('sizes', ['42 EU']);
    check('no error', !error, error?.message || '');
    return count || 0;
  });
  check('sizes overlap > 0', sizes > 0, `count=${sizes}`);

  console.log('\n=== 11. getProductBySlug (single + relations) ===');
  const single = await timed('slug=first product', async () => {
    const { data: slugProd } = await admin.from('products').select('slug').limit(1).single();
    const { data, error } = await admin
      .from('products')
      .select('*, brand:brands(id, slug, name, logo_link), category:categories(id, slug, name)')
      .eq('slug', slugProd?.slug)
      .single();
    check('no error', !error, error?.message || '');
    return { product: data, slug: slugProd?.slug };
  });
  check('single product with brand+category', !!single.product?.brand && !!single.product?.category);

  console.log('\n=== 12. getSubModels / getRootModels ===');
  const roots = await timed('root models (level=0)', async () => {
    const { data, error } = await admin.from('models').select('*').eq('level', 0).order('name');
    check('no error', !error, error?.message || '');
    return data || [];
  });
  check('root models >= 2', roots.length >= 2, `got ${roots.length}`);

  const sub = await timed('sub models of Predator', async () => {
    const { data, error } = await admin.from('models').select('*').eq('parent_id', predatorRoot!.id);
    check('no error', !error, error?.message || '');
    return data || [];
  });
  check('sub models > 0', sub.length > 0, `got ${sub.length}`);

  console.log(`\n===== RESULT: ${checks - failures}/${checks} passed =====`);
  process.exit(failures > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Test crashed:', err);
  process.exit(1);
});
import { config } from 'dotenv';
import { resolve } from 'path';
config({ path: resolve(__dirname, '.env.local') });

async function main() {
  const { adminSupabase } = require('@/lib/supabase/admin');

  const { data: pred } = await adminSupabase.from('models').select('id').eq('name', 'Predator').eq('level', 0);
  const predRootId = pred?.[0]?.id;
  const { data: leaves } = await adminSupabase.rpc('get_leaf_model_ids_under_root', { root_model_id: predRootId });
  console.log('leaf ids:', leaves?.length);

  const q = adminSupabase.from('products').select('*', { count: 'exact' })
    .eq('status', 'published')
    .in('leaf_model_id', leaves.map((l: { id: string }) => l.id))
    .range(0, 99);
  const r = await q;
  console.log('direct in-clause count:', r.count, 'items:', r.data?.length);
  console.log('href:', (q as any).url.href.slice(0, 220));

  const svc = require('@/lib/products/product-service');
  const res = await svc.getProducts({ model: 'Predator', pageSize: 100 });
  console.log('service model=Predator total:', res.total);
  console.log('slugs:', res.items.map((p: { slug: string }) => p.slug).join(', '));

  process.exit(0);
}
main().catch(e => { console.error('ERR:', e.message); process.exit(1); });

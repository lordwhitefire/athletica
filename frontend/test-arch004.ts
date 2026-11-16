import { config } from 'dotenv';
import { resolve } from 'path';
import * as fs from 'fs';
import * as path from 'path';

import {
  toPageProduct,
  toPageProductSummary,
  toFilterOptions,
  activeFiltersToProductFilters,
} from '@/lib/products/product-adapter';
import { filterProducts } from '@/lib/filterProducts';
import type { Product, ActiveFilters } from '@/types/product';

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

function legacyProducts(): Product[] {
  const dir = path.join(process.cwd(), 'data', 'products');
  return fs.readdirSync(dir)
    .filter(f => f.endsWith('.json'))
    .map(f => {
      const raw = JSON.parse(fs.readFileSync(path.join(dir, f), 'utf8')) as Record<string, unknown>;
      return {
        ...raw,
        brand: typeof raw.brand === 'object' && raw.brand
          ? (raw.brand as Record<string, unknown>).name as string
          : raw.brand as string,
      } as Product;
    });
}

function legacyFilter(active: ActiveFilters): string[] {
  const all = legacyProducts();
  return filterProducts(all, active).map(p => p.url_slug);
}

async function main() {
  config({ path: resolve(__dirname, '.env.local') });

  const svc = require('@/lib/products/product-service') as typeof import('@/lib/products/product-service');
  const {
    getProducts,
    getFacets,
    searchProducts,
    resolveBrandFilter,
    resolveCategoryFilter,
    resolveModelPath,
    getProductBySlug,
  } = svc;

  console.log('\n=== 1. Resolvers ===');
  const brand = await timed('resolveBrandFilter("Adidas")', () => resolveBrandFilter('Adidas'));
  const brand2 = await timed('resolveBrandFilter("new balance")', () => resolveBrandFilter('new balance'));
  const cat = await timed('resolveCategoryFilter("Boots")', () => resolveCategoryFilter('Boots'));
  const model = await timed('resolveModelPath("Predator")', () => resolveModelPath('Predator'));
  const leaf = await timed('resolveModelPath("Predator/Elite-FG")', () => resolveModelPath('Predator/Elite-FG'));
  const nike = await timed('resolveModelPath("Mercurial Vapour 17")', () => resolveModelPath('Mercurial Vapour 17'));
  check('brand Adidas -> adidas', brand === 'adidas', String(brand));
  check('brand new balance -> new-balance', brand2 === 'new-balance', String(brand2));
  check('category Boots -> boots', cat === 'boots', String(cat));
  check('Predator is root with children', model?.hasChildren === true, JSON.stringify(model));
  check('Predator/Elite-FG is leaf', leaf?.hasChildren === false, JSON.stringify(leaf));
  check('nike root=leaf has no children', nike?.hasChildren === false, JSON.stringify(nike));

  console.log('\n=== 2. getProducts: traction filter (attributes->>traction) ===');
  const traction = await timed('traction=FG', async () => {
    const r = await getProducts({ traction: 'FG', pageSize: 100 });
    check('total > 0', r.total > 0, `total=${r.total}`);
    check('all have traction FG', r.items.every(p => (p.attributes as { traction?: string }).traction === 'FG'));
    return r;
  });

  console.log('\n=== 3. getProducts: size filter (available in sizes_detail) ===');
  const size = await timed('size=42 EU', async () => {
    const r = await getProducts({ sizes: ['42 EU'], pageSize: 100 });
    check('total > 0', r.total > 0, `total=${r.total}`);
    check('all have 42 EU available', r.items.every(p => {
      const detail = (p.attributes as { sizes_detail?: { size: string; available: boolean }[] }).sizes_detail ?? [];
      return detail.some(d => d.size === '42 EU' && d.available);
    }));
    return r;
  });
  const legacySize = legacyFilter({ size: ['42 EU'] }).sort();
  const dbSize = size.items.map(p => p.slug).sort();
  check('size filter matches legacy (available only)', JSON.stringify(dbSize) === JSON.stringify(legacySize), `db=${dbSize.length} legacy=${legacySize.length}`);

  console.log('\n=== 4. getProducts: color + gender exact ===');
  const color = await timed('color=Black', async () => {
    const r = await getProducts({ color: 'Black', pageSize: 100 });
    check('all colors exactly Black', r.items.every(p => p.color === 'Black'), `total=${r.total}`);
    return r;
  });
  const gender = await timed('gender=Men', async () => {
    const r = await getProducts({ gender: 'Men', pageSize: 100 });
    check('all genders Men', r.items.every(p => p.gender === 'Men'), `total=${r.total}`);
    return r;
  });

  console.log('\n=== 5. Benchmark 3: equivalence spot-checks (DB SQL vs legacy semantics on DB data) ===');
  const cleanAll = (await getProducts({ pageSize: 100 })).items.map(toPageProductSummary);
  console.log(`  [reference set: ${cleanAll.length} products mapped through the adapter]`);
  const cleanFilter = (active: ActiveFilters): string[] =>
    filterProducts(cleanAll, active).map(p => p.url_slug).sort();
  const spotChecks: { name: string; active: ActiveFilters; allowedOnlyDb?: string[] }[] = [
    { name: 'brand=adidas', active: { brand: ['adidas'] } },
    { name: 'brand=adidas&color=Black&sort=price_asc', active: { brand: ['adidas'], color: ['Black'], sort: 'price_asc' } },
    { name: 'category=Boots&gender=Men', active: { category: ['Boots'], gender: ['Men'] } },
    { name: 'traction=FG', active: { traction: ['FG'] } },
    { name: 'model=Predator', active: { model: ['Predator'] }, allowedOnlyDb: ['id1323'] },
    { name: 'price range 100-200', active: { min_price: 100, max_price: 200 } },
  ];
  for (const spot of spotChecks) {
    const dbFilters = activeFiltersToProductFilters(spot.active);
    if (dbFilters.brand) dbFilters.brand = (await resolveBrandFilter(dbFilters.brand)) ?? dbFilters.brand;
    if (dbFilters.category) dbFilters.category = (await resolveCategoryFilter(dbFilters.category)) ?? dbFilters.category;
    const db = (await getProducts({ ...dbFilters, pageSize: 100 })).items.map(p => p.slug).sort();
    const legacy = cleanFilter(spot.active);
    const onlyDb = db.filter(s => !legacy.includes(s));
    const onlyLegacy = legacy.filter(s => !db.includes(s));
    const allowed = spot.allowedOnlyDb ?? [];
    const unexpectedOnlyDb = onlyDb.filter(s => !allowed.includes(s));
    check(`${spot.name}: db=${db.length} legacy=${legacy.length}`, unexpectedOnlyDb.length === 0 && onlyLegacy.length === 0, `onlyDb=${onlyDb.join(',')} onlyLegacy=${onlyLegacy.join(',')}`);
  }

  console.log('\n=== 6. getFacets (server-side facets) ===');
  const facets = await timed('getFacets({category: boots})', async () => {
    const f = await getFacets({ category: 'boots' });
    check('brands include adidas/nike', f.brands.some(b => b.slug === 'adidas') && f.brands.some(b => b.slug === 'nike'), JSON.stringify(f.brands.map(b => b.slug)));
    check('models include Predator', f.models.includes('Predator'), JSON.stringify(f.models));
    check('tractions include FG', f.tractions.includes('FG'), JSON.stringify(f.tractions));
    check('colors include Black', f.colors.includes('Black'), JSON.stringify(f.colors.slice(0, 5)));
    check('genders include Men', f.genders.includes('Men'), JSON.stringify(f.genders));
    check('sizes include 42 EU', f.sizes.includes('42 EU'), JSON.stringify(f.sizes.slice(0, 5)));
    check('price range sane', f.min_price > 0 && f.max_price >= f.min_price, `${f.min_price}-${f.max_price}`);
    return f;
  });
  const legacyBrands = [...new Set(
    filterProducts(cleanAll, { category: ['Boots'] }).map(p => p.brand)
  )].sort();
  check('facet brands match reference set', JSON.stringify(facets.brands.map(b => b.name).sort()) === JSON.stringify(legacyBrands), JSON.stringify({ db: facets.brands.map(b => b.name), legacy: legacyBrands }));

  console.log('\n=== 7. searchProducts ===');
  const search = await timed('search predator', async () => {
    const r = await searchProducts('predator', { pageSize: 100 });
    check('results > 0', r.total > 0, `total=${r.total}`);
    const legacyMatches = cleanAll
      .filter(p => (p.model ?? '').toLowerCase().includes('predator') || (p.name ?? '').toLowerCase().includes('predator'))
      .map(p => p.url_slug).sort();
    const dbMatches = r.items.map(p => p.slug).sort();
    check('search matches reference model/name search', JSON.stringify(dbMatches) === JSON.stringify(legacyMatches), `onlyDb=${dbMatches.filter(s => !legacyMatches.includes(s))} onlyLegacy=${legacyMatches.filter(s => !dbMatches.includes(s))}`);
    return r;
  });

  console.log('\n=== 8. Adapter: summary -> legacy Product ===');
  const first = (await getProducts({ pageSize: 1 })).items[0];
  const pageProduct = toPageProductSummary(first);
  check('url_slug mapped', pageProduct.url_slug === first.slug, `${pageProduct.url_slug} vs ${first.slug}`);
  check('brand display name', pageProduct.brand === first.brand?.name, `${pageProduct.brand}`);
  check('price from attributes', ['€', 'USD'].includes(pageProduct.price.currency), JSON.stringify(pageProduct.price));
  check('sizes from sizes_detail', pageProduct.sizes.length > 0 && typeof pageProduct.sizes[0].available === 'boolean', JSON.stringify(pageProduct.sizes.slice(0, 2)));
  check('traction from attributes', pageProduct.traction === (first.attributes as { traction?: string }).traction, `${pageProduct.traction}`);
  check('image from image_links', pageProduct.main_image === first.image_links?.[0], `${pageProduct.main_image}`);
  check('discount from attributes.price', pageProduct.price.discount_percent > 0, JSON.stringify(pageProduct.price));

  console.log('\n=== 9. Adapter: full ProductWithRelations ===');
  const detail = await getProductBySlug(first.slug);
  if (detail) {
    const full = toPageProduct(detail);
    check('description parsed (subtitle non-empty)', full.description.subtitle.length > 0, full.description.subtitle.slice(0, 60));
    check('technical_details present', Boolean(full.description.technical_details.sole_type), JSON.stringify(full.description.technical_details));
    check('color_variants mapped', (full.color_variants ?? []).every(v => v.product_id.length > 0 && v.thumbnail.length > 0), JSON.stringify((full.color_variants ?? []).slice(0, 2)));
    check('original price from attributes', full.price.original > 0, JSON.stringify(full.price));
  } else {
    check('detail product fetched', false, 'null');
  }

  console.log('\n=== 10. toFilterOptions ===');
  const filterOptions = toFilterOptions(facets);
  check('FilterOptions brands shape', filterOptions.brands.every(b => 'name' in b && 'logo' in b), JSON.stringify(filterOptions.brands.slice(0, 2)));

  console.log(`\n===== RESULT: ${checks - failures}/${checks} passed =====`);
  process.exit(failures > 0 ? 1 : 0);
}

main().catch(err => {
  console.error('Test crashed:', err);
  process.exit(1);
});
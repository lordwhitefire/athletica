import { resolveModelPath, resolveBrandFilter, resolveCategoryFilter } from '@/lib/products/product-service';

async function main() {
  const brand = await resolveBrandFilter('Adidas');
  const cat = await resolveCategoryFilter('Boots');
  const model = await resolveModelPath('Predator');
  const model2 = await resolveModelPath('Predator/Elite-FG');
  console.log(JSON.stringify({ brand, cat, model, model2 }, null, 2));
  process.exit(0);
}
main().catch(e => { console.error(e); process.exit(1); });
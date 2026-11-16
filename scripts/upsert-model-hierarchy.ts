import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

const SUPABASE_URL = process.env.SUPABASE_URL || 'https://mtudltsfcxvjjhmaztrp.supabase.co';
const SUPABASE_SERVICE_ROLE_KEY = process.env.SUPABASE_SERVICE_ROLE_KEY;

if (!SUPABASE_SERVICE_ROLE_KEY) {
  console.error('ERROR: SUPABASE_SERVICE_ROLE_KEY environment variable is required');
  process.exit(1);
}

const supabase = createClient(SUPABASE_URL, SUPABASE_SERVICE_ROLE_KEY, {
  auth: { autoRefreshToken: false, persistSession: false }
});

const DATA_DIR = path.join(__dirname, '../data');
const PRODUCTS_DIR = path.join(DATA_DIR, 'products');

interface ProductJson {
  id: string;
  brand: { _id: string; name: string; logo: string };
  category: string;
  color: string;
  color_variants: Array<{ _key: string; color: string; product_id: string; thumbnail: string | null }>;
  description: Record<string, unknown>;
  gender: string;
  model: string;
  name: string | null;
  price: Record<string, unknown>;
  sizes: Array<{ _key: string; size: string; available: boolean; stock: number }>;
  image_gallery: string[];
  main_image: string;
  traction: string;
  url_slug: string;
  thumbnail: string | null;
}

interface ModelHierarchy {
  brandId: string;
  path: string[]; // e.g., ['Predator', 'Elite', 'Elite-FT-FG']
  slugs: string[]; // slugified versions
  level: number; // 0 = root, 1 = sub, 2 = leaf
}

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[()]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
}

function parseModelString(modelStr: string): string[] {
  // Clean the string
  const cleaned = modelStr.trim().replace(/^\(|\)$/g, ''); // Remove surrounding parentheses
  // Split by /
  const parts = cleaned.split('/').map(p => p.trim()).filter(p => p.length > 0);
  return parts;
}

function readJsonFile<T>(filePath: string): T {
  const content = fs.readFileSync(filePath, 'utf-8');
  return JSON.parse(content);
}

function getProductFiles(): string[] {
  return fs.readdirSync(PRODUCTS_DIR)
    .filter(f => f.endsWith('.json'))
    .map(f => path.join(PRODUCTS_DIR, f));
}

function getBrandSlug(brandId: string): string {
  return slugify(brandId.replace('brand-', ''));
}

async function main() {
  console.log('=== Model Hierarchy Upsert ===\n');

  // Step 1: Load brand mapping (slug -> id)
  console.log('Loading brands...');
  const { data: brands, error: brandsError } = await supabase
    .from('brands')
    .select('id, slug');
  
  if (brandsError) throw brandsError;
  
  const brandSlugToId = new Map<string, string>();
  for (const b of brands || []) {
    brandSlugToId.set(b.slug, b.id);
  }
  console.log(`Loaded ${brandSlugToId.size} brands`);

  // Step 2: Parse all products and build model hierarchy
  console.log('\nParsing model hierarchies from product JSONs...');
  const productFiles = getProductFiles();
  
  // Map: brandId -> pathKey -> ModelHierarchy
  const hierarchyMap = new Map<string, Map<string, ModelHierarchy>>();
  
  for (const file of productFiles) {
    const product = readJsonFile<ProductJson>(file);
    
    const brandSlug = getBrandSlug(product.brand._id);
    const brandId = brandSlugToId.get(brandSlug);
    
    if (!brandId) {
      console.warn(`  Warning: Brand not found for ${product.brand._id} (slug: ${brandSlug})`);
      continue;
    }
    
    const modelParts = parseModelString(product.model);
    if (modelParts.length === 0) {
      console.warn(`  Warning: Empty model for product ${product.id}`);
      continue;
    }
    
    // Build hierarchy for this product
    let currentPath = '';
    for (let i = 0; i < modelParts.length; i++) {
      const part = modelParts[i];
      const slug = slugify(part);
      const parentPath = currentPath;
      currentPath = currentPath ? `${currentPath}/${slug}` : slug;
      const level = i; // 0 = root, 1 = sub, 2 = leaf
      
      if (!hierarchyMap.has(brandId)) {
        hierarchyMap.set(brandId, new Map());
      }
      const brandMap = hierarchyMap.get(brandId)!;
      
      if (!brandMap.has(currentPath)) {
        brandMap.set(currentPath, {
          brandId,
          path: modelParts.slice(0, i + 1),
          slugs: modelParts.slice(0, i + 1).map(slugify),
          level
        });
      }
    }
  }

  // Step 3: Upsert models in hierarchy order (roots first, then subs, then leafs)
  console.log('\nUpserting models...');
  const pathToModelId = new Map<string, string>(); // fullPath -> model.id
  
  for (const [brandId, brandMap] of hierarchyMap) {
    // Sort by level (0 first, then 1, then 2)
    const sortedEntries = Array.from(brandMap.entries()).sort((a, b) => a[1].level - b[1].level);
    
    for (const [fullPath, hierarchy] of sortedEntries) {
      const slug = hierarchy.slugs[hierarchy.slugs.length - 1];
      const name = hierarchy.path[hierarchy.path.length - 1];
      
      // Find parent ID
      let parentId: string | null = null;
      if (hierarchy.level > 0) {
        const parentPath = hierarchy.slugs.slice(0, -1).join('/');
        parentId = pathToModelId.get(`${brandId}:${parentPath}`) || null;
      }
      
      // Upsert model
      const { data, error } = await supabase
        .from('models')
        .upsert({
          slug,
          name,
          brand_id: brandId,
          parent_id: parentId,
          level: hierarchy.level,
          description: `${name} ${hierarchy.level === 0 ? 'root model' : hierarchy.level === 1 ? 'sub-model' : 'leaf model'}`
        }, { onConflict: 'brand_id,slug' })
        .select('id')
        .single();
      
      if (error) {
        console.error(`  Error upserting model ${fullPath}:`, error);
        throw error;
      }
      
      pathToModelId.set(`${brandId}:${fullPath}`, data.id);
      console.log(`  ✓ Model: ${hierarchy.path.join(' > ')} (level ${hierarchy.level}) -> ${data.id}`);
    }
  }

  // Step 4: Link products to leaf models
  console.log('\nLinking products to leaf models...');
  
  for (const file of productFiles) {
    const product = readJsonFile<ProductJson>(file);
    
    const brandSlug = getBrandSlug(product.brand._id);
    const brandId = brandSlugToId.get(brandSlug);
    
    if (!brandId) continue;
    
    const modelParts = parseModelString(product.model);
    if (modelParts.length === 0) continue;
    
    // Build full path to leaf
    const fullPath = modelParts.map(slugify).join('/');
    const leafModelId = pathToModelId.get(`${brandId}:${fullPath}`);
    
    if (!leafModelId) {
      console.warn(`  Warning: Leaf model not found for ${product.id} (${fullPath})`);
      continue;
    }
    
    // Update product
    const { error } = await supabase
      .from('products')
      .update({ leaf_model_id: leafModelId })
      .eq('id', product.id);
    
    if (error) {
      console.error(`  Error updating product ${product.id}:`, error);
      throw error;
    }
    
    console.log(`  ✓ Product ${product.id} -> leaf model ${leafModelId} (${modelParts.join(' > ')})`);
  }

  console.log('\n=== Model Hierarchy Upsert Complete ===');
  
  // Verification
  await verifyHierarchy(brandSlugToId, pathToModelId);
}

async function verifyHierarchy(
  brandSlugToId: Map<string, string>,
  pathToModelId: Map<string, string>
) {
  console.log('\n=== Verification ===');
  
  // Check models table
  const { data: models, error: modelsError } = await supabase
    .from('models')
    .select('*')
    .order('brand_id, level, slug');
  
  if (modelsError) throw modelsError;
  
  console.log(`\nModels in DB: ${models?.length || 0}`);
  
  // Group by brand
  for (const [brandSlug, brandId] of brandSlugToId) {
    const brandModels = models?.filter(m => m.brand_id === brandId) || [];
    console.log(`\n${brandSlug} (${brandModels.length} models):`);
    
    const roots = brandModels.filter(m => m.level === 0);
    const subs = brandModels.filter(m => m.level === 1);
    const leafs = brandModels.filter(m => m.level === 2);
    
    console.log(`  Roots (${roots.length}): ${roots.map(m => m.name).join(', ')}`);
    console.log(`  Subs (${subs.length}): ${subs.map(m => m.name).join(', ')}`);
    console.log(`  Leafs (${leafs.length}): ${leafs.map(m => m.name).join(', ')}`);
  }
  
  // Check products linked
  const { data: products, error: productsError } = await supabase
    .from('products')
    .select('id, model, leaf_model_id, brand_id');
  
  if (productsError) throw productsError;
  
  let linkedCount = 0;
  let unlinkedCount = 0;
  
  for (const p of products || []) {
    if (p.leaf_model_id) {
      linkedCount++;
    } else {
      unlinkedCount++;
      console.log(`  Unlinked: ${p.id} (${p.model})`);
    }
  }
  
  console.log(`\nProducts linked: ${linkedCount}`);
  console.log(`Products unlinked: ${unlinkedCount}`);
  
  // Check color variants per leaf model
  console.log('\nColor variants per leaf model:');
  const { data: productsWithColors } = await supabase
    .from('products')
    .select('id, leaf_model_id, color')
    .not('leaf_model_id', 'is', null);
  
  if (productsWithColors) {
    const colorMap = new Map<string, Set<string>>();
    for (const p of productsWithColors) {
      if (!colorMap.has(p.leaf_model_id)) {
        colorMap.set(p.leaf_model_id, new Set());
      }
      colorMap.get(p.leaf_model_id)!.add(p.color);
    }
    
    for (const [modelId, colors] of colorMap) {
      if (colors.size > 1) {
        console.log(`  Model ${modelId}: ${colors.size} colors - ${Array.from(colors).join(', ')}`);
      }
    }
  }
}

main().catch(err => {
  console.error('\n❌ Failed:', err);
  process.exit(1);
});
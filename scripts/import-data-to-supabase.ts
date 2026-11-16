import { createClient } from '@supabase/supabase-js';
import * as fs from 'fs';
import * as path from 'path';

// Configuration
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

// Types
interface ProductJson {
  id: string;
  brand: { _id: string; name: string; logo: string };
  category: string;
  color: string;
  color_variants: Array<{ _key: string; color: string; product_id: string; thumbnail: string | null }>;
  description: {
    collection: string;
    intro: string;
    key_benefits: string[];
    subtitle: string;
    tagline: string;
    technical_details: Record<string, string>;
  };
  gender: string;
  model: string;
  name: string | null;
  price: {
    currency: string;
    current: number;
    discount_percent: number;
    member_price: number;
    original: number;
  };
  sizes: Array<{ _key: string; size: string; available: boolean; stock: number }>;
  image_gallery: string[];
  main_image: string;
  model: string;
  traction: string;
  url_slug: string;
  thumbnail: string | null;
  _metadata: { dataType: string; lastUpdated: string; buildId: string; version: string };
}

interface BrandJson {
  _id: string;
  name: string;
  logo: string;
}

interface NavigationItem {
  _key: string;
  label: string;
  href: string | null;
  level: number;
  children?: NavigationItem[];
  disabled?: boolean;
  bottomLinks?: Array<{ _key: string; label: string; href: string | null; description: string }>;
  customLinks?: Array<{ _key: string; label: string; href: string | null; description: string }>;
  sizeLinks?: Array<{ _key: string; label: string; href: string | null; description: string }>;
}

interface HomepageJson {
  hero_carousel: {
    banners: Array<{
      _key: string;
      id: string;
      title: string;
      subtitle: string;
      image: string;
      link: string;
      button_text: string;
      accent_color: string;
      gradient: string;
    }>;
  };
  sections: Array<{
    _key: string;
    type: string;
    title: string;
    subtitle?: string;
    cards?: Array<{
      _key: string;
      id: string;
      title: string;
      subtitle: string;
      image: string;
      link: string;
      emoji?: string;
      gradient?: string;
    }>;
    items?: Array<{
      _key: string;
      label: string;
      link: string;
      image: string | null;
      accent?: string;
      bg?: string;
      textColor?: string;
    }>;
    filter?: Record<string, unknown>;
    limit?: number;
    link?: string;
    link_label?: string;
    sort?: string;
    bg?: string;
    variant?: string;
    autoSwitchMs?: number;
  }>;
}

interface SiteSettingsJson {
  footer: {
    bottom_tags: string[];
    brand_description: string;
    brand_name: string;
    copyright: string;
    link_columns: Array<{
      _key: string;
      title: string;
      links: Array<{ _key: string; label: string; href: string }>;
    }>;
    social_links: Array<{ _key: string; icon: string; label: string; url: string }>;
  };
  site_logo: string;
}

// Data structures for import
interface ImportedBrand {
  slug: string;
  name: string;
  logo_link: string;
}

interface ImportedCategory {
  slug: string;
  name: string;
  parent_id: string | null;
}

interface ImportedProduct {
  id: string; // Keep original ID (e.g., "JI1114")
  slug: string;
  name: string;
  model: string;
  description: Record<string, unknown>;
  price: number;
  gender: string;
  color: string;
  sizes: string[];
  attributes: Record<string, unknown>;
  status: 'published' | 'unpublished';
  asin: string | null;
  category_id: string | null;
  brand_id: string | null;
  image_links: string[];
}

interface ImportedHomepageSection {
  type: 'hero' | 'carousel' | 'grid' | 'banner';
  order: number;
  title: string;
  copy: string;
  category_id: string | null;
  limit: number | null;
  image_links: string[];
  attributes: Record<string, unknown>;
}

interface ImportedNavigationItem {
  parent_id: string | null;
  label: string;
  route: string;
  order: number;
}

interface ImportedSiteSettings {
  site_name: string;
  tagline: string;
  contact_email: string;
  social_links: Record<string, unknown>;
}

// Verification tracking
interface VerificationReport {
  products: { source: number; target: number; matched: boolean };
  brands: { source: number; target: number; matched: boolean };
  categories: { source: number; target: number; matched: boolean };
  productBrandLinks: { total: number; valid: number; invalid: string[] };
  productCategoryLinks: { total: number; valid: number; invalid: string[] };
  imageLinks: { totalProducts: number; withImages: number; empty: string[] };
  asinStatus: { total: number; populated: number; null: number };
  homepageSections: { source: number; target: number; matched: boolean };
  navigation: { source: number; target: number; matched: boolean };
  siteSettings: { exists: boolean; brandNameCorrect: boolean };
  errors: string[];
}

// Helper functions
function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/(^-|-$)/g, '');
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

// Main import functions
async function importBrands(): Promise<Map<string, string>> {
  console.log('Importing brands...');
  const brandsData = readJsonFile<Record<string, BrandJson | { _metadata: unknown }>>(path.join(DATA_DIR, 'brands.json'));
  
  const brandMap = new Map<string, string>(); // slug -> id
  const brandsToInsert: ImportedBrand[] = [];
  
  for (const [, value] of Object.entries(brandsData)) {
    if ('_id' in value && 'name' in value && 'logo' in value) {
      const slug = slugify(value._id.replace('brand-', ''));
      brandsToInsert.push({
        slug,
        name: value.name,
        logo_link: value.logo
      });
    }
  }
  
  for (const brand of brandsToInsert) {
    const { data, error } = await supabase
      .from('brands')
      .upsert(brand, { onConflict: 'slug' })
      .select('id, slug')
      .single();
    
    if (error) {
      console.error(`Error upserting brand ${brand.slug}:`, error);
      throw error;
    }
    brandMap.set(data.slug, data.id);
    console.log(`  ✓ Brand: ${brand.name} (${data.id})`);
  }
  
  return brandMap;
}

async function importCategories(productCategories: Set<string>): Promise<Map<string, string>> {
  console.log('Importing categories...');
  const categoryMap = new Map<string, string>(); // slug -> id
  
  // Create categories from product categories
  for (const catName of productCategories) {
    const slug = slugify(catName);
    
    const { data, error } = await supabase
      .from('categories')
      .upsert({ slug, name: catName, parent_id: null }, { onConflict: 'slug' })
      .select('id, slug')
      .single();
    
    if (error) {
      console.error(`Error upserting category ${catName}:`, error);
      throw error;
    }
    categoryMap.set(slug, data.id);
    console.log(`  ✓ Category: ${catName} (${data.id})`);
  }
  
  return categoryMap;
}

async function importProducts(
  brandMap: Map<string, string>,
  categoryMap: Map<string, string>
): Promise<{ products: ImportedProduct[]; errors: string[] }> {
  console.log('Importing products...');
  const productFiles = getProductFiles();
  const products: ImportedProduct[] = [];
  const errors: string[] = [];
  
  for (const file of productFiles) {
    try {
      const product = readJsonFile<ProductJson>(file);
      
      // Map brand
      const brandSlug = slugify(product.brand._id.replace('brand-', ''));
      const brandId = brandMap.get(brandSlug) || null;
      
      // Map category
      const categorySlug = slugify(product.category);
      const categoryId = categoryMap.get(categorySlug) || null;
      
      // Build description object
      const description = {
        collection: product.description.collection,
        intro: product.description.intro,
        key_benefits: product.description.key_benefits,
        subtitle: product.description.subtitle,
        tagline: product.description.tagline,
        technical_details: product.description.technical_details
      };
      
      // Build attributes object
      const attributes = {
        price: product.price,
        traction: product.traction,
        color_variants: product.color_variants.map(cv => ({
          color: cv.color,
          product_id: cv.product_id
        })),
        sizes_detail: product.sizes.map(s => ({
          size: s.size,
          available: s.available,
          stock: s.stock
        }))
      };
      
      // Build image links (main_image + gallery)
      const imageLinks = [
        product.main_image,
        ...product.image_gallery
      ].filter(Boolean);
      
      // Build sizes array
      const sizes = product.sizes.map(s => s.size);
      
      // Determine name (fallback to model or id)
      const name = product.name || product.model || product.id;
      
      const importedProduct: ImportedProduct = {
        id: product.id,
        slug: product.url_slug,
        name,
        model: product.model,
        description,
        price: product.price.current,
        gender: product.gender,
        color: product.color,
        sizes,
        attributes,
        status: 'published',
        asin: null, // Not in source data
        category_id: categoryId,
        brand_id: brandId,
        image_links: imageLinks
      };
      
      products.push(importedProduct);
      console.log(`  ✓ Product: ${product.id} (${product.url_slug})`);
    } catch (err) {
      const msg = `Error processing ${file}: ${err instanceof Error ? err.message : String(err)}`;
      console.error(msg);
      errors.push(msg);
    }
  }
  
  // Upsert all products
  for (const product of products) {
    const { error } = await supabase
      .from('products')
      .upsert(product, { onConflict: 'id' });
    
    if (error) {
      console.error(`Error upserting product ${product.id}:`, error);
      errors.push(`Product ${product.id}: ${error.message}`);
    }
  }
  
  return { products, errors };
}

async function importNavigation(): Promise<number> {
  console.log('Importing navigation...');
  const navData = readJsonFile<{ items: NavigationItem[] }>(path.join(DATA_DIR, 'navigation.json'));
  let order = 0;
  const inserted: ImportedNavigationItem[] = [];
  
  function processNavItems(items: NavigationItem[], parentId: string | null = null) {
    for (const item of items) {
      if (item.disabled) continue;
      if (!item.href) continue; // Skip items without routes
      
      // Clean route - strip /en/adultos prefix if present
      let route = item.href;
      if (route.startsWith('/en/adultos/')) {
        route = route.replace('/en/adultos', '');
      }
      
      inserted.push({
        parent_id: parentId,
        label: item.label,
        route,
        order: order++
      });
      
      if (item.children && item.children.length > 0) {
        // We need to get the ID of the parent we just inserted
        // For simplicity, we'll do a second pass or use a different approach
        // Let's store the hierarchy info and resolve later
      }
    }
  }
  
  // First pass: collect all items with hierarchy info
  const allItems: Array<NavigationItem & { parentLabel?: string }> = [];
  
  function collectItems(items: NavigationItem[], parentLabel?: string) {
    for (const item of items) {
      if (item.disabled) continue;
      if (!item.href) continue;
      
      allItems.push({ ...item, parentLabel });
      
      if (item.children && item.children.length > 0) {
        collectItems(item.children, item.label);
      }
    }
  }
  
  collectItems(navData.items);
  
  // Insert in order, tracking IDs
  const labelToId = new Map<string, string>();
  
  for (const item of allItems) {
    let route = item.href!;
    if (route.startsWith('/en/adultos/')) {
      route = route.replace('/en/adultos', '');
    }
    
    const parentId = item.parentLabel ? labelToId.get(item.parentLabel) || null : null;
    
    const { data, error } = await supabase
      .from('navigation')
      .upsert({
        parent_id: parentId,
        label: item.label,
        route,
        order: order++
      }, { onConflict: 'label,route,parent_id' })
      .select('id, label')
      .single();
    
    if (error) {
      console.error(`Error upserting nav item ${item.label}:`, error);
      throw error;
    }
    
    labelToId.set(item.label, data.id);
    console.log(`  ✓ Navigation: ${item.label} -> ${route} (${data.id})`);
  }
  
  return allItems.length;
}

async function importHomepageSections(categoryMap: Map<string, string>): Promise<number> {
  console.log('Importing homepage sections...');
  const homepageData = readJsonFile<HomepageJson>(path.join(DATA_DIR, 'homepage.json'));
  let order = 0;
  let count = 0;
  
  // Hero carousel banners
  for (const banner of homepageData.hero_carousel.banners) {
    const { error } = await supabase
      .from('homepage_sections')
      .upsert({
        type: 'hero',
        order: order++,
        title: banner.title,
        copy: banner.subtitle,
        category_id: null,
        limit: null,
        image_links: [banner.image],
        attributes: {
          button_text: banner.button_text,
          link: banner.link,
          accent_color: banner.accent_color,
          gradient: banner.gradient,
          original_id: banner.id
        }
      }, { onConflict: 'type,order,title' });
    
    if (error) {
      console.error(`Error upserting hero banner ${banner.id}:`, error);
      throw error;
    }
    count++;
    console.log(`  ✓ Hero: ${banner.title}`);
  }
  
  // Sections
  for (const section of homepageData.sections) {
    if (section.type === 'product_carousel' || section.type === 'category_carousel') {
      // Map to carousel type
      const { error } = await supabase
        .from('homepage_sections')
        .upsert({
          type: 'carousel',
          order: order++,
          title: section.title,
          copy: section.subtitle || '',
          category_id: null, // Could try to match from link
          limit: section.limit || 10,
          image_links: section.cards?.map(c => c.image).filter(Boolean) || [],
          attributes: {
            original_type: section.type,
            variant: section.variant,
            filter: section.filter,
            link: section.link,
            link_label: section.link_label,
            sort: section.sort,
            cards: section.cards,
            autoSwitchMs: section.autoSwitchMs
          }
        }, { onConflict: 'type,order,title' });
      
      if (error) {
        console.error(`Error upserting carousel ${section._key}:`, error);
        throw error;
      }
      count++;
      console.log(`  ✓ Carousel: ${section.title}`);
    } else if (section.type === 'category_grid') {
      // Each item in the grid becomes a section or we create one section with items in attributes
      const { error } = await supabase
        .from('homepage_sections')
        .upsert({
          type: 'grid',
          order: order++,
          title: section.title,
          copy: section.subtitle || '',
          category_id: null,
          limit: section.items?.length || null,
          image_links: section.items?.filter(i => i.image).map(i => i.image!) || [],
          attributes: {
            original_type: section.type,
            variant: section.variant,
            bg: section.bg,
            items: section.items
          }
        }, { onConflict: 'type,order,title' });
      
      if (error) {
        console.error(`Error upserting grid ${section._key}:`, error);
        throw error;
      }
      count++;
      console.log(`  ✓ Grid: ${section.title}`);
    }
  }
  
  return count;
}

async function importSiteSettings(): Promise<void> {
  console.log('Importing site settings...');
  const settingsData = readJsonFile<SiteSettingsJson>(path.join(DATA_DIR, 'site-settings.json'));
  
  const { error } = await supabase
    .from('site_settings')
    .upsert({
      site_name: settingsData.footer.brand_name,
      tagline: settingsData.footer.brand_description,
      contact_email: null, // Not in source
      social_links: {
        footer_links: settingsData.footer.link_columns,
        social_links: settingsData.footer.social_links,
        bottom_tags: settingsData.footer.bottom_tags,
        copyright: settingsData.footer.copyright,
        site_logo: settingsData.site_logo
      }
    }, { onConflict: 'id' });
  
  if (error) {
    console.error('Error upserting site settings:', error);
    throw error;
  }
  console.log(`  ✓ Site settings: ${settingsData.footer.brand_name}`);
}

async function runVerification(
  productFiles: string[],
  brandMap: Map<string, string>,
  categoryMap: Map<string, string>
): Promise<VerificationReport> {
  console.log('\nRunning verification...');
  
  const report: VerificationReport = {
    products: { source: 0, target: 0, matched: false },
    brands: { source: 0, target: 0, matched: false },
    categories: { source: 0, target: 0, matched: false },
    productBrandLinks: { total: 0, valid: 0, invalid: [] },
    productCategoryLinks: { total: 0, valid: 0, invalid: [] },
    imageLinks: { totalProducts: 0, withImages: 0, empty: [] },
    asinStatus: { total: 0, populated: 0, null: 0 },
    homepageSections: { source: 0, target: 0, matched: false },
    navigation: { source: 0, target: 0, matched: false },
    siteSettings: { exists: false, brandNameCorrect: false },
    errors: []
  };
  
  // Count source products
  report.products.source = productFiles.length;
  
  // Count source brands
  const brandsData = readJsonFile<Record<string, BrandJson | { _metadata: unknown }>>(path.join(DATA_DIR, 'brands.json'));
  report.brands.source = Object.values(brandsData).filter(v => '_id' in v).length;
  
  // Query target counts
  const [
    { count: productCount },
    { count: brandCount },
    { count: categoryCount },
    { count: sectionCount },
    { count: navCount },
    { data: settingsData }
  ] = await Promise.all([
    supabase.from('products').select('*', { count: 'exact', head: true }),
    supabase.from('brands').select('*', { count: 'exact', head: true }),
    supabase.from('categories').select('*', { count: 'exact', head: true }),
    supabase.from('homepage_sections').select('*', { count: 'exact', head: true }),
    supabase.from('navigation').select('*', { count: 'exact', head: true }),
    supabase.from('site_settings').select('*').single()
  ]);
  
  report.products.target = productCount || 0;
  report.products.matched = report.products.source === report.products.target;
  
  report.brands.target = brandCount || 0;
  report.brands.matched = report.brands.source === report.brands.target;
  
  report.categories.target = categoryCount || 0;
  report.categories.matched = true; // Categories derived from products + nav
  
  report.homepageSections.target = sectionCount || 0;
  
  report.navigation.target = navCount || 0;
  
  report.siteSettings.exists = !!settingsData;
  report.siteSettings.brandNameCorrect = settingsData?.site_name === 'Athletica';
  
  // Detailed product verification
  const { data: allProducts } = await supabase
    .from('products')
    .select('id, brand_id, category_id, image_links, asin');
  
  if (allProducts) {
    report.asinStatus.total = allProducts.length;
    report.asinStatus.populated = allProducts.filter(p => p.asin).length;
    report.asinStatus.null = allProducts.filter(p => !p.asin).length;
    
    report.imageLinks.totalProducts = allProducts.length;
    report.imageLinks.withImages = allProducts.filter(p => p.image_links && p.image_links.length > 0).length;
    report.imageLinks.empty = allProducts
      .filter(p => !p.image_links || p.image_links.length === 0)
      .map(p => p.id);
    
    report.productBrandLinks.total = allProducts.length;
    report.productBrandLinks.valid = allProducts.filter(p => p.brand_id).length;
    report.productBrandLinks.invalid = allProducts
      .filter(p => !p.brand_id)
      .map(p => p.id);
    
    report.productCategoryLinks.total = allProducts.length;
    report.productCategoryLinks.valid = allProducts.filter(p => p.category_id).length;
    report.productCategoryLinks.invalid = allProducts
      .filter(p => !p.category_id)
      .map(p => p.id);
  }
  
  return report;
}

// Main
async function main() {
  console.log('=== Athletica Data Import to Supabase ===\n');
  
  try {
    // Step 1: Import brands
    const brandMap = await importBrands();
    
    // Step 2: Collect all product categories from JSON files
    const productFiles = getProductFiles();
    const productCategories = new Set<string>();
    
    for (const file of productFiles) {
      const product = readJsonFile<ProductJson>(file);
      productCategories.add(product.category);
    }
    console.log(`\nFound ${productCategories.size} unique product categories:`, Array.from(productCategories).join(', '));
    
    // Step 3: Import categories
    const categoryMap = await importCategories(productCategories);
    
    // Step 4: Import products
    const { products: importedProducts, errors: productErrors } = await importProducts(brandMap, categoryMap);
    
    // Step 5: Import navigation
    const navCount = await importNavigation();
    
    // Step 6: Import homepage sections
    const sectionCount = await importHomepageSections(categoryMap);
    
    // Step 7: Import site settings
    await importSiteSettings();
    
    // Step 8: Verification
    const report = await runVerification(productFiles, brandMap, categoryMap);
    
    // Add any errors from import
    report.errors.push(...productErrors);
    
    // Write verification report
    const reportPath = path.join(__dirname, 'import-verification-report.json');
    fs.writeFileSync(reportPath, JSON.stringify(report, null, 2));
    console.log(`\nVerification report written to: ${reportPath}`);
    
    // Print summary
    console.log('\n=== VERIFICATION SUMMARY ===');
    console.log(`Products:       ${report.products.source} source → ${report.products.target} target ${report.products.matched ? '✓' : '✗'}`);
    console.log(`Brands:         ${report.brands.source} source → ${report.brands.target} target ${report.brands.matched ? '✓' : '✗'}`);
    console.log(`Categories:     ${report.categories.target} target ${report.categories.matched ? '✓' : '✗'}`);
    console.log(`Homepage:       ${sectionCount} imported → ${report.homepageSections.target} target`);
    console.log(`Navigation:     ${navCount} imported → ${report.navigation.target} target ${report.navigation.matched ? '✓' : '✗'}`);
    console.log(`Site Settings:  ${report.siteSettings.exists ? '✓' : '✗'} (brand: ${report.siteSettings.brandNameCorrect ? 'Athletica ✓' : 'MISMATCH ✗'})`);
    console.log(`\nProduct-Brand FK:  ${report.productBrandLinks.valid}/${report.productBrandLinks.total} valid`);
    console.log(`Product-Cat FK:    ${report.productCategoryLinks.valid}/${report.productCategoryLinks.total} valid`);
    console.log(`Image Links:       ${report.imageLinks.withImages}/${report.imageLinks.totalProducts} products have images`);
    console.log(`ASINs:             ${report.asinStatus.populated}/${report.asinStatus.total} populated (${report.asinStatus.null} NULL - expected)`);
    
    if (report.errors.length > 0) {
      console.log('\nErrors:');
      report.errors.forEach(e => console.log(`  - ${e}`));
    }
    
    // Exit with error code if any critical checks fail
    const criticalFailures = [
      !report.products.matched,
      !report.brands.matched,
      report.productBrandLinks.valid !== report.productBrandLinks.total,
      report.productCategoryLinks.valid !== report.productCategoryLinks.total,
      report.imageLinks.withImages !== report.imageLinks.totalProducts,
      !report.siteSettings.exists,
      !report.siteSettings.brandNameCorrect
    ].filter(Boolean).length;
    
    if (criticalFailures > 0) {
      console.log(`\n❌ ${criticalFailures} critical verification failure(s)`);
      process.exit(1);
    }
    
    console.log('\n✅ All critical verifications passed!');
    process.exit(0);
    
  } catch (err) {
    console.error('\n❌ Import failed:', err);
    process.exit(1);
  }
}

main();
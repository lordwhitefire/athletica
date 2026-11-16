/**
 * sync-to-sanity.mjs
 *
 * One-time migration: reads all JSON data files from ../frontend/data/
 * and writes them to the Sanity project via createOrReplace.
 *
 * Usage:
 *   SANITY_WRITE_TOKEN=... node sync-to-sanity.mjs
 *
 * Order (respects references):
 *   1. Brands   (products reference them)
 *   2. Products
 *   3. Homepage
 *   4. Navigation
 *   5. Amazon Links
 *   6. Site Settings
 */

import { createClient } from '@sanity/client'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, '..', 'frontend', 'data')
const PRODUCTS_DIR = path.join(DATA_DIR, 'products')

const SANITY_WRITE_TOKEN = process.env.SANITY_WRITE_TOKEN
if (!SANITY_WRITE_TOKEN) {
  console.error('ERROR: SANITY_WRITE_TOKEN environment variable is required')
  process.exit(1)
}

const client = createClient({
  projectId: 'cuiis46d',
  dataset: 'production',
  token: SANITY_WRITE_TOKEN,
  apiVersion: '2025-01-01',
  useCdn: false,
})

// ── Helpers ──────────────────────────────────────────────

function extractAssetRef(value) {
  if (!value) return null
  if (typeof value === 'string' && value.startsWith('image-')) return value
  if (typeof value === 'object' && value?.asset?._ref) return value.asset._ref
  if (typeof value === 'string' && value.includes('cdn.sanity.io')) {
    const match = value.match(/production\/(.+)\.(\w+)$/)
    if (match) {
      const base = match[1]
      const ext = match[2]
      const lastDash = base.lastIndexOf('-')
      if (lastDash !== -1) {
        return `image-${base.substring(0, lastDash)}-${base.substring(lastDash + 1)}-${ext}`
      }
    }
  }
  return null
}

function urlToImageRef(value) {
  const ref = extractAssetRef(value)
  if (!ref) return value || null // return original if can't extract
  return { _type: 'image', asset: { _ref: ref, _type: 'reference' } }
}

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  } catch (err) {
    console.error(`  ⚠  Failed to read ${filePath}: ${err.message}`)
    return null
  }
}

// Decode the `{ "0": {...}, "1": {...}, "_metadata": {...} }` array encoding
function decodeArray(obj) {
  if (!obj || typeof obj !== 'object') return obj
  const keys = Object.keys(obj).filter(k => !isNaN(Number(k)))
  if (keys.length === 0) return obj
  return keys.map(k => obj[k])
}

function stripMeta(obj) {
  if (!obj || typeof obj !== 'object') return obj
  const { _metadata, ...rest } = obj
  return rest
}

// ── Cleanup ────────────────────────────────────────────────

async function cleanupAll() {
  console.log('\n── Cleanup old documents ──')
  for (const type of ['product', 'brand', 'homepage', 'navigation', 'amazonLinks', 'siteSettings']) {
    const ids = await client.fetch(`*[_type == "${type}"]._id`)
    if (ids.length === 0) { console.log(`  ∅ No ${type} docs to delete`); continue }
    // Sanity allows deleting up to 500 docs in one transaction
    const tx = client.transaction()
    for (const id of ids) tx.delete(id)
    await tx.commit()
    console.log(`  ✗ Deleted ${ids.length} ${type} doc(s)`)
  }
}

// ── 1. Brands ────────────────────────────────────────────

async function syncBrands() {
  console.log('\n── Brands ──')

  const raw = readJson(path.join(DATA_DIR, 'brands.json'))
  if (!raw) { console.log('  SKIPPED (brands.json not found)'); return }

  const brands = decodeArray(stripMeta(raw))
  let count = 0

  for (const b of brands) {
    const name = (b.name || '').trim()
    if (!name) continue

    const doc = {
      _id: `brand-${name.toLowerCase().replace(/\s+/g, '-')}`,
      _type: 'brand',
      name,
      logo: urlToImageRef(b.logo),
    }

    await client.createOrReplace(doc)
    console.log(`  ✓ ${doc._id} (${name})`)
    count++
  }

  console.log(`  → ${count} brand(s) synced`)
}

// ── 2. Products ──────────────────────────────────────────

function productBrandRef(brand) {
  if (!brand) return null
  // Brand in JSON: { _id: "65de...", name: "adidas", logo: {...} }
  // Brand in Sanity: { _ref: "brand-adidas", _type: "reference" }
  // Map old _id → new fixed ID based on name
  const name = (brand.name || '').trim().toLowerCase().replace(/\s+/g, '-')
  if (!name) return { _ref: brand._id, _type: 'reference' }
  return { _ref: `brand-${name}`, _type: 'reference' }
}

async function syncProducts() {
  console.log('\n── Products ──')

  if (!fs.existsSync(PRODUCTS_DIR)) {
    console.log('  SKIPPED (products/ directory not found)')
    return
  }

  const files = fs.readdirSync(PRODUCTS_DIR).filter(f => f.endsWith('.json'))
  let count = 0

  for (const file of files) {
    const raw = readJson(path.join(PRODUCTS_DIR, file))
    if (!raw) continue

    const doc = {
      _id: `product-${raw.id}`,
      _type: 'product',
      id: raw.id,
      url_slug: { _type: 'slug', current: raw.url_slug || raw.id },
      model: raw.model || '',
      brand: productBrandRef(raw.brand),
      category: raw.category || '',
      traction: raw.traction || null,
      gender: raw.gender || '',
      name: raw.name || null,
      main_image: urlToImageRef(raw.main_image),
      thumbnail: urlToImageRef(raw.thumbnail),
      image_gallery: (raw.image_gallery || []).map(urlToImageRef).filter(Boolean),
      color: raw.color || '',
      color_variants: (raw.color_variants || []).map(v => ({
        _key: v.color ? `cv-${v.color.toLowerCase().replace(/\s+/g, '-')}` : undefined,
        color: v.color,
        product_id: v.product_id,
        thumbnail: urlToImageRef(v.thumbnail),
      })),
      price: raw.price || { current: 0, original: 0, discount_percent: 0, member_price: 0, currency: '£' },
      sizes: (raw.sizes || []).map(s => ({
        _key: s._key || s.size,
        size: s.size,
        available: s.available ?? true,
        stock: s.stock ?? 0,
      })),
      description: raw.description || {
        subtitle: '', tagline: '', intro: '', collection: '',
        key_benefits: [],
        technical_details: { range: '', sole_type: '', upper_material: '', adjustment: '' },
      },
    }

    await client.createOrReplace(doc)
    console.log(`  ✓ product-${raw.id} (${raw.url_slug || raw.id})`)
    count++
  }

  console.log(`  → ${count} product(s) synced`)
}

// ── 3. Homepage ──────────────────────────────────────────

function processHomepageBannerImage(value) {
  if (!value) return null
  if (typeof value === 'string') return urlToImageRef(value)
  if (typeof value === 'object' && value?.asset?._ref) return value // already image ref
  return null
}

async function syncHomepage() {
  console.log('\n── Homepage ──')

  const raw = readJson(path.join(DATA_DIR, 'homepage.json'))
  if (!raw) { console.log('  SKIPPED (homepage.json not found)'); return }

  const data = stripMeta(raw)
  const hero = data.hero_carousel || {}

  const doc = {
    _id: 'homepage',
    _type: 'homepage',
    hero_carousel: {
      id: hero.id || 'hero',
      auto_switch_ms: hero.auto_switch_ms || 4000,
      banners: (hero.banners || []).map(b => ({
        _key: b._key,
        id: b.id,
        title: b.title || '',
        subtitle: b.subtitle || '',
        button_text: b.button_text || '',
        link: b.link || '/',
        gradient: b.gradient || '',
        accent_color: b.accent_color || '#d1fd40',
        image: processHomepageBannerImage(b.image),
      })),
    },
    sections: (data.sections || []).map(s => {
      const section = {
        _key: s._key,
        type: s.type || s._type,
        title: s.title || '',
        variant: s.variant || 'default',
      }

      if (section.type === 'category_grid') {
        section.bg = s.bg || 'bg-surface'
        section.viewAllLink = s.viewAllLink || undefined
        section.viewAllLabel = s.viewAllLabel || undefined
        section.items = (s.items || []).map(item => ({
          _key: item._key,
          label: item.label || item.title || '',
          link: item.link || '/',
          bg: item.bg || '',
          textColor: item.textColor || '',
          accent: item.accent || '',
          image: processHomepageBannerImage(item.image),
        }))
      }

      if (section.type === 'product_carousel') {
        section.subtitle = s.subtitle || undefined
        section.sort = s.sort || 'newest'
        section.limit = parseInt(s.limit) || 10
        section.link = s.link || undefined
        section.link_label = s.link_label || undefined
        section.filter = {}
        if (s.category) section.filter.category = s.category
        if (s.brand) section.filter.brand = s.brand
        if (s.modelLine) section.filter.name = s.modelLine
        if (s.traction) section.filter.traction = s.traction
        if (s.minPrice) section.filter.min_price = parseFloat(s.minPrice)
        if (s.maxPrice) section.filter.max_price = parseFloat(s.maxPrice)
      }

      if (section.type === 'category_carousel') {
        section.autoSwitchMs = parseInt(s.autoSwitchMs) || 4000
        section.cards = (s.cards || []).map(card => ({
          _key: card._key,
          id: card.id || card._key,
          title: card.title || '',
          subtitle: card.subtitle || '',
          link: card.link || '/',
          gradient: card.gradient || '',
          emoji: card.emoji || '⚡',
          image: processHomepageBannerImage(card.image),
        }))
      }

      return section
    }),
  }

  await client.createOrReplace(doc)
  console.log('  ✓ homepage')
}

// ── 4. Navigation ────────────────────────────────────────

async function syncNavigation() {
  console.log('\n── Navigation ──')

  const raw = readJson(path.join(DATA_DIR, 'navigation.json'))
  if (!raw) { console.log('  SKIPPED (navigation.json not found)'); return }

  const data = stripMeta(raw)

  const doc = {
    _id: 'navigation',
    _type: 'navigation',
    title: data.title || 'Main Navigation',
    items: data.items || [],
  }

  await client.createOrReplace(doc)
  console.log('  ✓ navigation')
}

// ── 5. Amazon Links ──────────────────────────────────────

async function syncAmazonLinks() {
  console.log('\n── Amazon Links ──')

  const raw = readJson(path.join(DATA_DIR, 'amazon-links.json'))
  if (!raw) { console.log('  SKIPPED (amazon-links.json not found)'); return }

  const arr = decodeArray(stripMeta(raw))
  const first = arr?.[0]
  const links = first?.links || []

  const doc = {
    _id: 'amazonLinks',
    _type: 'amazonLinks',
    links,
  }

  await client.createOrReplace(doc)
  console.log(`  ✓ amazonLinks (${links.length} link(s))`)
}

// ── 6. Site Settings ─────────────────────────────────────

async function syncSiteSettings() {
  console.log('\n── Site Settings ──')

  const raw = readJson(path.join(DATA_DIR, 'site-settings.json'))
  if (!raw) { console.log('  SKIPPED (site-settings.json not found)'); return }

  const data = stripMeta(raw)

  const doc = {
    _id: 'siteSettings',
    _type: 'siteSettings',
    site_logo: data.site_logo || null,
    logo: data.logo ? urlToImageRef(data.logo) : null,
    footer: data.footer || {},
  }

  await client.createOrReplace(doc)
  console.log('  ✓ siteSettings')
}

// ── Main ─────────────────────────────────────────────────

async function main() {
  console.log('')
  console.log('  ╔══════════════════════════════════════════════════╗')
  console.log('  ║        SYNC: data/ → Sanity                    ║')
  console.log('  ╚══════════════════════════════════════════════════╝')
  console.log('')

  let ok = true

  try {
    await cleanupAll()
  } catch (err) {
    console.error('  ✗ Cleanup failed:', err.message)
    ok = false
  }

  try {
    await syncBrands()
  } catch (err) {
    console.error('  ✗ Brands failed:', err.message)
    ok = false
  }

  try {
    await syncProducts()
  } catch (err) {
    console.error('  ✗ Products failed:', err.message)
    ok = false
  }

  try {
    await syncHomepage()
  } catch (err) {
    console.error('  ✗ Homepage failed:', err.message)
    ok = false
  }

  try {
    await syncNavigation()
  } catch (err) {
    console.error('  ✗ Navigation failed:', err.message)
    ok = false
  }

  try {
    await syncAmazonLinks()
  } catch (err) {
    console.error('  ✗ Amazon Links failed:', err.message)
    ok = false
  }

  try {
    await syncSiteSettings()
  } catch (err) {
    console.error('  ✗ Site Settings failed:', err.message)
    ok = false
  }

  console.log('')
  if (ok) {
    console.log('  ✅ All data synced to Sanity successfully!')
  } else {
    console.log('  ⚠  Some data types failed. Check errors above.')
    process.exit(1)
  }
  console.log('')
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})

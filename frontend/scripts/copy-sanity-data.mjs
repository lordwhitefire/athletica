/**
 * copy-sanity-data.js
 *
 * Reads all content from Sanity and writes it to data/ JSON files.
 * This is the Sanity → data/ direction (used by CI/CD webhook).
 *
 * Usage:
 *   node copy-sanity-data.js
 */

import { createClient } from '@sanity/client'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, '..', 'data')
const PRODUCTS_DIR = path.join(DATA_DIR, 'products')

const PROJECT_ID = 'cuiis46d'
const DATASET = 'production'

const client = createClient({
  projectId: PROJECT_ID,
  dataset: DATASET,
  apiVersion: '2025-01-01',
  useCdn: true,
})

function imageRefToUrl(ref) {
  if (!ref || typeof ref !== 'string') return null
  const m = ref.match(/^image-(.+)-(\d+)x(\d+)-(\w+)$/)
  if (!m) return null
  return `https://cdn.sanity.io/images/${PROJECT_ID}/${DATASET}/${m[1]}-${m[2]}x${m[3]}.${m[4]}`
}

function imageToUrl(val) {
  if (!val) return null
  if (typeof val === 'string') return val
  if (val._type === 'image' && val.asset?._ref) return imageRefToUrl(val.asset._ref)
  return null
}

function makeMetadata(dataType) {
  return {
    dataType,
    lastUpdated: new Date().toISOString(),
    buildId: 'sanity-sync',
    version: '1.0.0',
  }
}

function stripInternalFields(obj) {
  if (!obj || typeof obj !== 'object') return obj
  const clone = { ...obj }
  delete clone._createdAt
  delete clone._updatedAt
  delete clone._rev
  delete clone._system
  return clone
}

async function copyBrands() {
  console.log('\n── Brands ──')

  const brands = await client.fetch(
    '*[_type == "brand"]{_id, name, logo} | order(name asc)',
  )

  const encoded = {}
  brands.forEach((b, i) => {
    encoded[String(i)] = {
      _id: b._id,
      name: b.name,
      logo: imageToUrl(b.logo) || b.logo,
    }
  })
  encoded._metadata = makeMetadata('brands')

  fs.writeFileSync(path.join(DATA_DIR, 'brands.json'), JSON.stringify(encoded, null, 2) + '\n')
  console.log(`  ✓ ${brands.length} brand(s)`)
}

async function copyProducts() {
  console.log('\n── Products ──')

  const products = await client.fetch(`
    *[_type == "product"]{
      _id,
      id,
      url_slug,
      model,
      brand->{_id, name, logo},
      category,
      traction,
      gender,
      name,
      main_image,
      thumbnail,
      image_gallery,
      color,
      color_variants,
      price,
      sizes,
      description
    } | order(id asc)
  `)

  if (!fs.existsSync(PRODUCTS_DIR)) {
    fs.mkdirSync(PRODUCTS_DIR, { recursive: true })
  }

  const writtenFiles = new Set()

  for (const p of products) {
    const slug = p.url_slug?.current || p.id
    const fileName = slug + '.json'
    writtenFiles.add(fileName)

    const doc = {
      brand: p.brand
        ? {
            _id: p.brand._id,
            logo: imageToUrl(p.brand.logo) || null,
            name: p.brand.name,
          }
        : null,
      category: p.category,
      color: p.color || '',
      color_variants: (p.color_variants || []).map(v => ({
        _key: v._key || undefined,
        color: v.color,
        product_id: v.product_id,
        thumbnail: imageToUrl(v.thumbnail) || null,
      })),
      description: p.description || {
        subtitle: '',
        tagline: '',
        intro: '',
        collection: '',
        key_benefits: [],
        technical_details: {
          range: '',
          sole_type: '',
          upper_material: '',
          adjustment: '',
        },
      },
      gender: p.gender || '',
      id: p.id,
      image_gallery: (p.image_gallery || [])
        .map(img => imageToUrl(img))
        .filter(Boolean),
      main_image: imageToUrl(p.main_image) || null,
      model: p.model || '',
      name: p.name || null,
      price: p.price || {
        current: 0,
        original: 0,
        discount_percent: 0,
        member_price: 0,
        currency: '\u00a3',
      },
      sizes: (p.sizes || []).map(s => ({
        _key: s._key || s.size,
        size: s.size,
        available: s.available ?? true,
        stock: s.stock ?? 0,
      })),
      thumbnail: imageToUrl(p.thumbnail) || null,
      traction: p.traction || null,
      url_slug: slug,
      _metadata: makeMetadata('product'),
    }

    fs.writeFileSync(
      path.join(PRODUCTS_DIR, fileName),
      JSON.stringify(doc, null, 2) + '\n',
    )
  }

  const existingFiles = fs.readdirSync(PRODUCTS_DIR).filter(f => f.endsWith('.json'))
  for (const f of existingFiles) {
    if (!writtenFiles.has(f)) {
      fs.unlinkSync(path.join(PRODUCTS_DIR, f))
      console.log(`  ✗ Removed stale: ${f}`)
    }
  }

  console.log(`  ✓ ${products.length} product(s)`)
}

async function copyHomepage() {
  console.log('\n── Homepage ──')

  const doc = await client.fetch('*[_type == "homepage"][0]')
  if (!doc) { console.log('  ∅ No homepage doc'); return }

  if (doc.hero_carousel?.banners) {
    for (const b of doc.hero_carousel.banners) {
      if (b.image) b.image = imageToUrl(b.image) || b.image
    }
  }

  if (doc.sections) {
    for (const s of doc.sections) {
      if (
        (s.type === 'category_grid' || s._type === 'category_grid') &&
        s.items
      ) {
        for (const item of s.items) {
          if (item.image) item.image = imageToUrl(item.image) || item.image
        }
      }
      if (
        (s.type === 'category_carousel' || s._type === 'category_carousel') &&
        s.cards
      ) {
        for (const card of s.cards) {
          if (card.image) card.image = imageToUrl(card.image) || card.image
        }
      }
    }
  }

  const cleaned = stripInternalFields(doc)
  cleaned._metadata = makeMetadata('homepage')

  fs.writeFileSync(
    path.join(DATA_DIR, 'homepage.json'),
    JSON.stringify(cleaned, null, 2) + '\n',
  )
  console.log('  ✓ homepage')
}

async function copyNavigation() {
  console.log('\n── Navigation ──')

  const doc = await client.fetch('*[_type == "navigation"][0]')
  if (!doc) { console.log('  ∅ No navigation doc'); return }

  const cleaned = stripInternalFields(doc)
  cleaned._metadata = makeMetadata('navigation')

  fs.writeFileSync(
    path.join(DATA_DIR, 'navigation.json'),
    JSON.stringify(cleaned, null, 2) + '\n',
  )
  console.log('  ✓ navigation')
}

async function copyAmazonLinks() {
  console.log('\n── Amazon Links ──')

  const docs = await client.fetch('*[_type == "amazonLinks"]')
  if (docs.length === 0) { console.log('  ∅ No amazonLinks'); return }

  const encoded = {}
  docs.forEach((d, i) => {
    encoded[String(i)] = stripInternalFields(d)
  })
  encoded._metadata = makeMetadata('amazon-links')

  fs.writeFileSync(
    path.join(DATA_DIR, 'amazon-links.json'),
    JSON.stringify(encoded, null, 2) + '\n',
  )
  console.log(`  ✓ ${docs.length} amazonLink(s)`)
}

async function copySiteSettings() {
  console.log('\n── Site Settings ──')

  const doc = await client.fetch('*[_type == "siteSettings"][0]')
  if (!doc) { console.log('  ∅ No siteSettings doc'); return }

  if (doc.logo) doc.logo = imageToUrl(doc.logo) || doc.logo
  if (doc.site_logo) doc.site_logo = imageToUrl(doc.site_logo) || doc.site_logo

  const cleaned = stripInternalFields(doc)
  cleaned._metadata = makeMetadata('site-settings')

  fs.writeFileSync(
    path.join(DATA_DIR, 'site-settings.json'),
    JSON.stringify(cleaned, null, 2) + '\n',
  )
  console.log('  ✓ siteSettings')
}

async function main() {
  console.log('')
  console.log('  ╔═══════════════════════════════════════════════════════════╗')
  console.log('  ║   COPY: Sanity → data/                          ║')
  console.log('  ╚═══════════════════════════════════════════════════════════╝')

  let ok = true
  for (const fn of [
    copyBrands,
    copyProducts,
    copyHomepage,
    copyNavigation,
    copyAmazonLinks,
    copySiteSettings,
  ]) {
    try {
      await fn()
    } catch (err) {
      console.error(`  ✗ Failed:`, err.message)
      ok = false
    }
  }

  console.log('')
  if (ok) {
    console.log('  ✅ All data copied from Sanity to data/ successfully!')
  } else {
    console.log('  ⚠  Some errors occurred.')
    process.exit(1)
  }
  console.log('')
}

main().catch(err => {
  console.error('Fatal:', err)
  process.exit(1)
})

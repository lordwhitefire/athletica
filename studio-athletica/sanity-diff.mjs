import { createClient } from '@sanity/client'
import fs from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const DATA_DIR = path.join(__dirname, '..', 'frontend', 'data')

const client = createClient({
  projectId: 'cuiis46d',
  dataset: 'production',
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

function readJson(filePath) {
  try {
    return JSON.parse(fs.readFileSync(filePath, 'utf-8'))
  } catch {
    return null
  }
}

// Decode the `{ "0": {...}, "1": {...}, _metadata: {...} }` array encoding
function decodeArray(obj) {
  if (!obj || typeof obj !== 'object') return obj
  const keys = Object.keys(obj).filter(k => !isNaN(Number(k)))
  if (keys.length === 0) return obj
  return keys.map(k => obj[k])
}

function stripMeta(obj) {
  if (!obj || typeof obj !== 'object') return obj
  const { _metadata, _createdAt, _updatedAt, _rev, _system, ...rest } = obj
  return rest
}

function stripMetaDeep(obj) {
  if (!obj || typeof obj !== 'object') return obj
  if (Array.isArray(obj)) return obj.map(stripMetaDeep)
  const cleaned = {}
  for (const [k, v] of Object.entries(obj)) {
    if (['_metadata', '_createdAt', '_updatedAt', '_rev', '_system', '_key', '_type'].includes(k)) continue
    cleaned[k] = stripMetaDeep(v)
  }
  return cleaned
}

// ── Normalizers ──────────────────────────────────────────

function normalizeProduct(p) {
  const brandId = p.brand?._id || p.brand?._ref
  const brandName = p.brand?.name
  return {
    id: p.id,
    url_slug: p.url_slug?.current || p.url_slug,
    model: p.model,
    brand_ref: brandId,
    brand_name: brandName,
    category: p.category,
    traction: p.traction,
    gender: p.gender,
    name: p.name,
    main_image: extractAssetRef(p.main_image),
    thumbnail: extractAssetRef(p.thumbnail),
    image_gallery: (p.image_gallery || []).map(extractAssetRef),
    color: p.color,
    color_variants: (p.color_variants || []).map(v => ({
      color: v.color,
      product_id: v.product_id,
      thumbnail: extractAssetRef(v.thumbnail),
    })),
    price: p.price,
    sizes: p.sizes,
    description: p.description,
  }
}

function normalizeBrand(b) {
  return {
    _id: b._id,
    name: (b.name || '').trim(),
    logo: extractAssetRef(b.logo),
  }
}

function normalizeBannerImage(value) {
  if (!value) return null
  if (typeof value === 'string') return extractAssetRef(value)
  if (typeof value === 'object' && value?.asset?._ref) return value.asset._ref
  return null
}

function normalizeHomepage(h) {
  if (!h) return null
  const hero = h.hero_carousel || {}
  return {
    id: h.id,
    hero_carousel: {
      id: hero.id,
      auto_switch_ms: hero.auto_switch_ms,
      banners: (hero.banners || []).map(b => ({
        id: b.id,
        _key: b._key,
        title: b.title,
        subtitle: b.subtitle,
        button_text: b.button_text,
        link: b.link,
        gradient: b.gradient,
        accent_color: b.accent_color,
        image: normalizeBannerImage(b.image),
      })),
    },
    sections: (h.sections || []).map(s => {
      const section = { ...s }
      if (section.type === 'category_grid') {
        section.items = (section.items || []).map(item => {
          const i = { ...item }
          i.image = normalizeBannerImage(i.image)
          return i
        })
      }
      if (section.type === 'category_carousel') {
        section.cards = (section.cards || []).map(card => {
          const c = { ...card }
          c.image = normalizeBannerImage(c.image)
          return c
        })
      }
      if (section.type === 'product_carousel') {
        delete section.previewProducts
      }
      return section
    }),
  }
}

function normalizeNavigation(n) {
  if (!n) return null
  return stripMetaDeep(n)
}

function normalizeAmazonLinks(a) {
  if (!a) return null
  const arr = Array.isArray(a) ? a : decodeArray(a)
  return arr.map(item => ({
    _id: item._id,
    links: item.links || [],
  }))
}

function normalizeSiteSettings(s) {
  if (!s) return null
  const cleaned = stripMetaDeep(s)
  cleaned.site_logo = extractAssetRef(s.site_logo)
  cleaned.logo = extractAssetRef(s.logo)
  return cleaned
}

// ── Deep diff ────────────────────────────────────────────

function deepDiff(objA, objB, prefix = '') {
  const diffs = []
  const allKeys = new Set([...Object.keys(objA || {}), ...Object.keys(objB || {})])

  for (const key of allKeys) {
    const p = prefix ? `${prefix}.${key}` : key
    const a = objA?.[key]
    const b = objB?.[key]

    if (a === b) continue
    if (a == null && b == null) continue
    if (a == null || b == null) {
      diffs.push({ path: p, json: a ?? '<MISSING>', sanity: b ?? '<MISSING>' })
      continue
    }
    if (Array.isArray(a) && Array.isArray(b)) {
      // Compare arrays item-by-item if both contain objects with _key/id
      const keyedA = a.length > 0 && typeof a[0] === 'object' && (a[0]._key || a[0].id)
      const keyedB = b.length > 0 && typeof b[0] === 'object' && (b[0]._key || b[0].id)
      if (keyedA && keyedB) {
        const matchKey = a[0]._key ? '_key' : 'id'
        const bMap = Object.fromEntries(b.map(item => [item[matchKey], item]))
        const aMap = Object.fromEntries(a.map(item => [item[matchKey], item]))
        const allItemKeys = new Set([...Object.keys(bMap), ...Object.keys(aMap)])
        for (const itemKey of allItemKeys) {
          if (!bMap[itemKey]) {
            diffs.push({ path: `${p}[${itemKey}]`, json: aMap[itemKey], sanity: '<MISSING>' })
          } else if (!aMap[itemKey]) {
            diffs.push({ path: `${p}[${itemKey}]`, json: '<MISSING>', sanity: bMap[itemKey] })
          } else {
            diffs.push(...deepDiff(aMap[itemKey], bMap[itemKey], `${p}[${itemKey}]`))
          }
        }
      } else {
        const sa = JSON.stringify(a)
        const sb = JSON.stringify(b)
        if (sa !== sb) diffs.push({ path: p, json: a, sanity: b, kind: 'array' })
      }
      continue
    }
    if (typeof a === 'object' && typeof b === 'object' && !Array.isArray(a) && !Array.isArray(b)) {
      diffs.push(...deepDiff(a, b, p))
      continue
    }
    if (a !== b) diffs.push({ path: p, json: a, sanity: b })
  }
  return diffs
}

// ── Report printer ───────────────────────────────────────

function printSection(title) {
  const line = '─'.repeat(68)
  console.log(`\n${line}`)
  console.log(`  ${title}`)
  console.log(`${line}`)
}

function printDiff(diffs, context) {
  if (diffs.length === 0) {
    console.log(`  ✓ ${context} — MATCH`)
    return
  }
  console.log(`  ✗ ${context} — ${diffs.length} difference(s)`)
  for (const d of diffs.slice(0, 20)) {
    const j = typeof d.json === 'object' ? JSON.stringify(d.json).substring(0, 120) : String(d.json)
    const s = typeof d.sanity === 'object' ? JSON.stringify(d.sanity).substring(0, 120) : String(d.sanity)
    console.log(`      ${d.path}`)
    console.log(`        JSON:   ${j}`)
    console.log(`        Sanity: ${s}`)
  }
  if (diffs.length > 20) {
    console.log(`      ... and ${diffs.length - 20} more`)
  }
}

// ── Main ─────────────────────────────────────────────────

async function main() {
  console.log('\n  ╔══════════════════════════════════════════════════════╗')
  console.log('  ║           DATA vs SANITY — COMPARISON             ║')
  console.log('  ╚══════════════════════════════════════════════════════╝')

  // ── Products ────────────────────────────────────────────
  printSection('PRODUCTS')

  const sanityProductsRaw = await client.fetch(`*[_type == "product"]{
    id, "url_slug": url_slug.current, model,
    "brand": { "_id": brand._ref, "name": brand->name },
    category, traction, gender, name,
    main_image, image_gallery, thumbnail, color,
    color_variants, price, sizes, description
  }`)

  const sanityProducts = Object.fromEntries(
    (sanityProductsRaw || []).map(p => [p.id, normalizeProduct(p)])
  )

  const productsDir = path.join(DATA_DIR, 'products')
  const productFiles = fs.readdirSync(productsDir).filter(f => f.endsWith('.json'))
  let productMatch = 0, productDiff = 0, productMissing = 0
  const productDiffLog = []

  for (const file of productFiles) {
    const raw = readJson(path.join(productsDir, file))
    if (!raw) continue
    const json = normalizeProduct(raw)
    const sanity = sanityProducts[json.id]
    if (!sanity) {
      productMissing++
      productDiffLog.push({ id: json.id || file, diffs: [{ path: '—', json: 'exists in JSON', sanity: '<MISSING in Sanity>' }] })
      continue
    }
    const diffs = deepDiff(json, sanity)
    if (diffs.length === 0) {
      productMatch++
    } else {
      productDiff++
      productDiffLog.push({ id: json.id, diffs })
    }
  }

  // Check for products in Sanity not in JSON
  const jsonProductIds = new Set(productFiles.map(f => {
    const raw = readJson(path.join(productsDir, f))
    return raw?.id
  }).filter(Boolean))
  for (const [id] of Object.entries(sanityProducts)) {
    if (!jsonProductIds.has(id)) {
      productDiffLog.push({ id, diffs: [{ path: '—', json: '<MISSING in JSON>', sanity: 'exists in Sanity' }] })
    }
  }

  console.log(`  Total in JSON: ${productFiles.length}`)
  console.log(`  Total in Sanity: ${sanityProductsRaw?.length || 0}`)
  console.log(`  Match: ${productMatch}  Different: ${productDiff}  Missing in Sanity: ${productMissing}`)
  for (const p of productDiffLog) {
    printDiff(p.diffs, p.id)
  }

  // ── Brands ──────────────────────────────────────────────
  printSection('BRANDS')

  const sanityBrandsRaw = await client.fetch(`*[_type == "brand"]{ _id, name, logo }`)
  const sanityBrands = Object.fromEntries(
    (sanityBrandsRaw || []).map(b => [b._id, normalizeBrand(b)])
  )

  const brandsJsonRaw = readJson(path.join(DATA_DIR, 'brands.json'))
  const brandsJsonArr = decodeArray(stripMeta(brandsJsonRaw))
  const brandsJson = Object.fromEntries(
    (brandsJsonArr || []).map(b => [b._id, normalizeBrand(b)])
  )

  const allBrandIds = new Set([...Object.keys(brandsJson), ...Object.keys(sanityBrands)])
  let brandMatch = 0, brandDiff = 0
  for (const id of allBrandIds) {
    const j = brandsJson[id]
    const s = sanityBrands[id]
    if (!j) {
      console.log(`  ✗ ${id} — only in Sanity (missing in JSON)`)
      brandDiff++
      continue
    }
    if (!s) {
      console.log(`  ✗ ${id} — only in JSON (missing in Sanity)`)
      brandDiff++
      continue
    }
    const diffs = deepDiff(j, s)
    if (diffs.length === 0) {
      brandMatch++
    } else {
      brandDiff++
      printDiff(diffs, id)
    }
  }
  console.log(`  Match: ${brandMatch}  Different: ${brandDiff}`)

  // ── Homepage ────────────────────────────────────────────
  printSection('HOMEPAGE')

  const sanityHome = normalizeHomepage(await client.fetch(`*[_type == "homepage"][0]`))
  const jsonHomeRaw = readJson(path.join(DATA_DIR, 'homepage.json'))
  const jsonHome = normalizeHomepage(stripMeta(jsonHomeRaw))

  if (jsonHome && sanityHome) {
    const diffs = deepDiff(jsonHome, sanityHome)
    printDiff(diffs, 'homepage')
  } else if (!jsonHome) {
    console.log('  ✗ homepage — MISSING in JSON')
  } else {
    console.log('  ✗ homepage — MISSING in Sanity')
  }

  // ── Navigation ──────────────────────────────────────────
  printSection('NAVIGATION')

  const sanityNav = normalizeNavigation(await client.fetch(`*[_type == "navigation"][0]`))
  const jsonNavRaw = readJson(path.join(DATA_DIR, 'navigation.json'))
  const jsonNav = normalizeNavigation(stripMeta(jsonNavRaw))

  if (jsonNav && sanityNav) {
    const diffs = deepDiff(jsonNav, sanityNav)
    printDiff(diffs, 'navigation')
  } else if (!jsonNav) {
    console.log('  ✗ navigation — MISSING in JSON')
  } else {
    console.log('  ✗ navigation — MISSING in Sanity')
  }

  // ── Amazon Links ────────────────────────────────────────
  printSection('AMAZON LINKS')

  const sanityAmazon = normalizeAmazonLinks(await client.fetch(`*[_type == "amazonLinks"]`))
  const jsonAmazonRaw = readJson(path.join(DATA_DIR, 'amazon-links.json'))
  const jsonAmazon = normalizeAmazonLinks(stripMeta(jsonAmazonRaw))

  if (jsonAmazon && sanityAmazon) {
    const diffs = deepDiff(jsonAmazon, sanityAmazon)
    printDiff(diffs, 'amazon-links')
  } else if (!jsonAmazon) {
    console.log('  ✗ amazon-links — MISSING in JSON')
  } else {
    console.log('  ✗ amazon-links — MISSING in Sanity')
  }

  // ── Site Settings ───────────────────────────────────────
  printSection('SITE SETTINGS')

  const sanitySettings = normalizeSiteSettings(await client.fetch(`*[_type == "siteSettings"][0]`))
  const jsonSettingsRaw = readJson(path.join(DATA_DIR, 'site-settings.json'))
  const jsonSettings = normalizeSiteSettings(jsonSettingsRaw)

  if (jsonSettings && sanitySettings) {
    const diffs = deepDiff(jsonSettings, sanitySettings)
    printDiff(diffs, 'site-settings')
  } else if (!jsonSettings) {
    console.log('  ✗ site-settings — MISSING in JSON')
  } else {
    console.log('  ✗ site-settings — MISSING in Sanity')
  }

  // ── Summary ─────────────────────────────────────────────
  const line = '═'.repeat(68)
  console.log(`\n${line}`)
  console.log('  Done. Review the differences above.')
  console.log('  Run the sync script after you confirm.')
  console.log(`${line}\n`)
}

main().catch(err => {
  console.error('Fatal error:', err)
  process.exit(1)
})

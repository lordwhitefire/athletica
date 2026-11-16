import {createClient} from '@sanity/client'
import path from 'path'
import {fileURLToPath} from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

const client = createClient({
  projectId: 'cuiis46d',
  dataset: 'production',
  token: process.env.SANITY_TOKEN,
  apiVersion: '2025-01-01',
  useCdn: false,
})

const FRONTEND_DATA = path.resolve(__dirname, '../frontend/data')

if (!process.env.SANITY_TOKEN) {
  console.error('❌ SANITY_TOKEN env variable is required')
  process.exit(1)
}

async function loadJSON(filename) {
  const data = await import(path.join(FRONTEND_DATA, filename), {with: {type: 'json'}})
  return data.default
}

let keyCounter = 0

function addKeys(obj) {
  if (Array.isArray(obj)) {
    return obj.map((item) => {
      if (typeof item === 'object' && item !== null) {
        if (!item._key) {
          item._key = `k-${++keyCounter}`
        }
        return addKeys(item)
      }
      return item
    })
  }
  if (typeof obj === 'object' && obj !== null) {
    for (const [key, val] of Object.entries(obj)) {
      if (Array.isArray(val)) {
        obj[key] = addKeys(val)
      } else if (typeof val === 'object' && val !== null) {
        obj[key] = addKeys(val)
      }
    }
  }
  return obj
}

// ─── Products ─────────────────────────────────────────────────────────────

function buildProductDoc(product) {
  const doc = {
    _type: 'product',
    _id: product.id,
    id: product.id,
    url_slug: {_type: 'slug', current: product.url_slug},
    model: product.model,
    brand: product.brand,
    category: product.category,
    traction: product.traction || null,
    model_line: product.model_line || null,
    gender: product.gender,
    age_group: product.age_group,
    color: product.color,
    price: {
      current: product.price.current,
      original: product.price.original,
      discount_percent: product.price.discount_percent,
      member_price: product.price.member_price,
      currency: product.price.currency,
    },
    sizes: product.sizes.map((s, i) => ({
      _key: `size-${i}`,
      size: s.size,
      available: s.available,
      stock: s.stock,
    })),
    description: {
      subtitle: product.description.subtitle,
      tagline: product.description.tagline,
      intro: product.description.intro,
      collection: product.description.collection || '',
      key_benefits: product.description.key_benefits || [],
      technical_details: {
        range: product.description.technical_details.range,
        sole_type: product.description.technical_details.sole_type,
        upper_material: product.description.technical_details.upper_material,
        adjustment: product.description.technical_details.adjustment,
      },
    },
  }

  if (product.color_variants?.length > 0) {
    doc.color_variants = product.color_variants.map((cv, i) => ({
      _key: `cv-${i}`,
      color: cv.color,
      product_id: cv.product_id,
    }))
  }

  return doc
}

async function seedProducts() {
  const products = await loadJSON('products.json')
  console.log(`📦 Products: ${products.length}`)
  let ok = 0, fail = 0
  for (const p of products) {
    process.stdout.write(`  ${p.id} - ${p.model} ... `)
    try {
      await client.createOrReplace(buildProductDoc(p))
      console.log('✅')
      ok++
    } catch (err) {
      console.log(`❌ ${err.message}`)
      fail++
    }
  }
  return {ok, fail}
}

// ─── Homepage ──────────────────────────────────────────────────────────────

async function seedHomepage() {
  // Fetch existing homepage — hero carousel is kept verbatim from Sanity
  let existingHero = null
  try {
    const existing = await client.fetch('*[_type == "homepage"][0]')
    if (existing?.hero_carousel) {
      existingHero = existing.hero_carousel
    }
  } catch {
    // first seed — no existing doc yet
  }

  const data = addKeys(await loadJSON('homepage.json'))
  if (data.sections) {
    data.sections = data.sections.map((s) => ({
      ...s,
      _type: s.type,
    }))
  }

  // Keep the existing hero carousel from Sanity; discard the JSON one
  if (existingHero) {
    data.hero_carousel = existingHero
  }

  process.stdout.write(`🏠 Homepage ... `)
  try {
    await client.createOrReplace({
      _type: 'homepage',
      _id: 'homepage',
      ...data,
    })
    console.log('✅')
    console.log(`   → hero banners: ${data.hero_carousel?.banners?.length ?? 0} (kept from Sanity)`)
    console.log(`   → sections: ${data.sections?.length ?? 0}`)
    return true
  } catch (err) {
    console.log(`❌ ${err.message}`)
    return false
  }
}

// ─── Navigation ───────────────────────────────────────────────────────────

async function seedNavigation() {
  const items = addKeys(await loadJSON('navigation.json'))
  process.stdout.write(`🧭 Navigation (${items.length} top-level items) ... `)
  try {
    await client.createOrReplace({
      _type: 'navigation',
      _id: 'navigation',
      title: 'Main Navigation',
      items,
    })
    console.log('✅')
    return true
  } catch (err) {
    console.log(`❌ ${err.message}`)
    return false
  }
}

// ─── Amazon Links ─────────────────────────────────────────────────────────

async function seedAmazonLinks() {
  const links = await loadJSON('amazon-links.json')
  const entries = Object.entries(links)
  process.stdout.write(`🔗 Amazon Links (${entries.length} entries) ... `)
  try {
    const linksArray = entries
      .filter(([, url]) => url && url.trim() !== '')
      .map(([productId, url], i) => ({_key: `link-${i}`, productId, url}))
    await client.createOrReplace({
      _type: 'amazonLinks',
      _id: 'amazonLinks',
      links: linksArray,
    })
    console.log('✅')
    return true
  } catch (err) {
    console.log(`❌ ${err.message}`)
    return false
  }
}

// ─── Main ─────────────────────────────────────────────────────────────────

async function main() {
  console.log('')
  const home = await seedHomepage()

  console.log(`\n✅ Done — Homepage: ${home ? '✅' : '❌'}`)
}

main().catch(console.error)

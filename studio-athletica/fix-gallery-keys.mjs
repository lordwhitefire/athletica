import {createClient} from '@sanity/client'

const client = createClient({
  projectId: 'cuiis46d',
  dataset: 'production',
  token: process.env.SANITY_TOKEN,
  apiVersion: '2025-01-01',
  useCdn: false,
})

if (!process.env.SANITY_TOKEN) {
  console.error('❌ SANITY_TOKEN env variable is required')
  process.exit(1)
}

async function main() {
  const products = await client.fetch(`*[_type == "product" && defined(image_gallery)]`)
  console.log(`Found ${products.length} products with image_gallery\n`)

  let fixed = 0
  for (const product of products) {
    const gallery = product.image_gallery
    if (!gallery || gallery.length === 0) continue

    const needsFix = gallery.some((item) => !item._key)
    if (!needsFix) continue

    const fixedGallery = gallery.map((item, i) => ({
      ...item,
      _key: item._key || `gallery-${i}`,
    }))

    process.stdout.write(`📦 ${product.id} ... `)
    try {
      await client.patch(product._id).set({image_gallery: fixedGallery}).commit()
      console.log('✅')
      fixed++
    } catch (err) {
      console.log(`❌ ${err.message}`)
    }
  }

  console.log(`\n✅ Fixed ${fixed} products`)
}

main().catch(console.error)

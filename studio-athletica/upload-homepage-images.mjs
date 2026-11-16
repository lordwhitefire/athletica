import {createClient} from '@sanity/client'
import {readFileSync, readdirSync} from 'fs'
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

const PUBLIC_DIR = path.resolve(__dirname, '../frontend/public')

if (!process.env.SANITY_TOKEN) {
  console.error('❌ SANITY_TOKEN env variable is required')
  process.exit(1)
}

async function main() {
  // 1. Get all images from public/
  const files = readdirSync(PUBLIC_DIR).filter((f) => /\.(jpg|jpeg|png|webp)$/i.test(f))
  console.log(`📁 Found ${files.length} images in public/`)

  // 2. Fetch existing assets from Sanity
  const existingAssets = await client.fetch(`*[_type == "sanity.imageAsset"]{_id, originalFilename}`)
  const existingMap = {}
  for (const asset of existingAssets) {
    existingMap[asset.originalFilename] = asset._id
  }

  // 3. Upload new images, build filename → asset ID map
  const assetMap = {}
  let uploaded = 0
  let skipped = 0

  for (const file of files) {
    const nameLower = file.toLowerCase()
    if (existingMap[file] || existingMap[nameLower]) {
      const id = existingMap[file] || existingMap[nameLower]
      console.log(`⏭️  ${file} — already uploaded (${id})`)
      assetMap[file] = id
      skipped++
      continue
    }

    const filepath = path.join(PUBLIC_DIR, file)
    const buffer = readFileSync(filepath)
    if (buffer.length === 0) {
      console.log(`  ⚠️  ${file} is empty, skipping`)
      continue
    }

    try {
      const asset = await client.assets.upload('image', buffer, {
        filename: file,
        contentType: `image/${path.extname(file).slice(1)}`,
      })
      console.log(`  ✅ ${file} → ${asset._id}`)
      assetMap[file] = asset._id
      uploaded++
    } catch (err) {
      console.log(`  ❌ ${file}: ${err.message}`)
    }
  }

  console.log(`\n📦 Uploaded ${uploaded}, skipped ${skipped}`)

  // 4. Fetch homepage document
  console.log('\n📄 Fetching homepage document...')
  const homepage = await client.fetch(`*[_type == "homepage"][0]`)
  if (!homepage) {
    console.log('❌ No homepage document found')
    return
  }

  // 5. Build patches for hero carousel banners
  const patches = {}

  if (homepage.hero_carousel?.banners) {
    for (let i = 0; i < homepage.hero_carousel.banners.length; i++) {
      const banner = homepage.hero_carousel.banners[i]
      if (typeof banner.image === 'string' && banner.image) {
        const filename = banner.image.replace(/^\//, '')
        const assetId = assetMap[filename]
        if (assetId) {
          patches[`hero_carousel.banners[${i}].image`] = {
            _type: 'image',
            asset: {_type: 'reference', _ref: assetId},
          }
          console.log(`  🖼️  hero banner ${i}: ${banner.image} → ${assetId}`)
        }
      }
    }
  }

  // 6. Build patches for category grid items
  if (homepage.sections) {
    for (let si = 0; si < homepage.sections.length; si++) {
      const section = homepage.sections[si]
      if (section._type === 'category_grid' || section.type === 'category_grid') {
        if (section.items) {
          for (let ii = 0; ii < section.items.length; ii++) {
            const item = section.items[ii]
            if (typeof item.image === 'string' && item.image) {
              const filename = item.image.replace(/^\//, '')
              const assetId = assetMap[filename]
              if (assetId) {
                patches[`sections[${si}].items[${ii}].image`] = {
                  _type: 'image',
                  asset: {_type: 'reference', _ref: assetId},
                }
                console.log(`  🖼️  section ${si} item ${ii}: ${item.image} → ${assetId}`)
              }
            }
          }
        }
      }
    }
  }

  // 7. Apply patches
  const patchKeys = Object.keys(patches)
  if (patchKeys.length === 0) {
    console.log('\n⚠️  No images to patch')
    return
  }

  console.log(`\n📝 Patching ${patchKeys.length} fields...`)
  try {
    await client.patch(homepage._id).set(patches).commit()
    console.log('✅ Homepage patched successfully')
  } catch (err) {
    console.log(`❌ Patch failed: ${err.message}`)
  }

  console.log('\n✅ Done')
}

main().catch(console.error)

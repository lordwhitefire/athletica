import {createClient} from '@sanity/client'
import {readFileSync} from 'fs'
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

const PROMPTS_FILE = path.resolve(__dirname, '../frontend/public/image-prompts.md')
const IMAGES_DIR = path.resolve(__dirname, '../frontend/public/images')

if (!process.env.SANITY_TOKEN) {
  console.error('❌ SANITY_TOKEN env variable is required')
  process.exit(1)
}

function parsePrompts(md) {
  const lines = md.split('\n')
  const map = {}
  let currentSku = null

  for (const line of lines) {
    const match = line.match(/\d+\.\s+\*\*([A-Z0-9]+)\*\*\s+[—–-]\s+(.+)/)
    if (match) {
      currentSku = match[1]
      const colorPart = extractColorPart(match[2])
      map[currentSku] = {name: match[2].trim(), colorPart}
    }
  }
  return map
}

function extractColorPart(name) {
  const m = name.match(/\((.+)\)$/)
  return m ? m[1] : ''
}

function safeFilename(name) {
  return name.replace(/\//g, '-').replace(/[<>:"|?*\\]/g, '')
}

async function main() {
  const md = readFileSync(PROMPTS_FILE, 'utf-8')
  const productMap = parsePrompts(md)

  const products = await client.fetch(`*[_type == "product"]`)
  console.log(`Found ${products.length} products in Sanity\n`)

  let uploaded = 0
  let skipped = 0
  let failed = 0

  for (const product of products) {
    const info = productMap[product.id]
    if (!info) {
      console.log(`⚠️  No prompt mapping for ${product.id} — skipping`)
      skipped++
      continue
    }

    if (product.main_image?.asset?._ref) {
      console.log(`⏭️  ${product.id} — already has images, skipping`)
      skipped++
      continue
    }

    const baseName = safeFilename(info.name)
    const views = [
      {key: 'main', view: '45-degree angle', field: 'main_image'},
      {key: 'gallery-0', view: 'side profile', field: 'image_gallery'},
      {key: 'gallery-1', view: 'sole view', field: 'image_gallery'},
    ]

    const patches = {}
    const gallery = []

    process.stdout.write(`📦 ${product.id} - ${info.name} ... `)

    for (const v of views) {
      const filename = `${baseName} (${v.view}).png`
      const filepath = path.join(IMAGES_DIR, filename)

      try {
        const buffer = readFileSync(filepath)
        if (buffer.length === 0) {
          console.log(`\n  ⚠️  ${filename} is empty, skipping`)
          continue
        }
        const asset = await client.assets.upload('image', buffer, {
          filename,
          contentType: 'image/png',
        })
        const imgRef = {_type: 'image', asset: {_type: 'reference', _ref: asset._id}}

        if (v.field === 'main_image') {
          patches.main_image = imgRef
        } else {
          const key = `gallery-${gallery.length}`
          gallery.push({...imgRef, _key: key})
        }
      } catch (err) {
        if (err.code === 'ENOENT') {
          console.log(`\n  ⚠️  ${filename} not found, skipping`)
        } else {
          console.log(`\n  ❌  ${filename}: ${err.message}`)
          failed++
        }
      }
    }

    if (gallery.length > 0) patches.image_gallery = gallery

    if (patches.main_image || patches.image_gallery) {
      try {
        await client.patch(product._id).set(patches).commit()
        console.log('✅')
        uploaded++
      } catch (err) {
        console.log(`\n  ❌  Patch failed: ${err.message}`)
        failed++
      }
    } else {
      console.log('⚠️  no images found')
      skipped++
    }
  }

  console.log(`\n✅ Done — ${uploaded} updated, ${skipped} skipped, ${failed} failed`)
}

main().catch(console.error)

import { readFileSync, mkdirSync, writeFileSync } from 'fs'
import path from 'path'
import { fileURLToPath } from 'url'

const __dirname = path.dirname(fileURLToPath(import.meta.url))
const PROMPTS_FILE = path.resolve(__dirname, '../frontend/public/image-prompts.md')
const OUTPUT_DIR = path.resolve(__dirname, '../frontend/public/images/products')

const VIEWS = [
  { key: 'main', label: '45-degree angle' },
  { key: 'side', label: 'side profile' },
  { key: 'sole', label: 'sole view' },
]

function parsePrompts(md) {
  const lines = md.split('\n')
  const products = []
  let current = null

  for (const line of lines) {
    const match = line.match(/^(\d+)\.\s+\*\*(.+?)\*\*.*?\((.+?)\)$/)
    if (match) {
      if (current) products.push(current)
      current = { num: match[1], id: match[2], promptBase: '' }
      continue
    }
    if (current && line.includes('`')) {
      const codeMatch = line.match(/`(.+)`/)
      if (codeMatch) {
        current.promptBase = codeMatch[1]
      }
    }
  }
  if (current) products.push(current)
  return products
}

async function generateImage(prompt, outputPath) {
  const url = `https://image.pollinations.ai/prompt/${encodeURIComponent(prompt)}?width=1024&height=1024&nologo=true`
  process.stdout.write(`    ${outputPath} ... `)
  try {
    const res = await fetch(url)
    if (!res.ok) throw new Error(`HTTP ${res.status}`)
    const buffer = Buffer.from(await res.arrayBuffer())
    writeFileSync(outputPath, buffer)
    console.log('✅')
  } catch (err) {
    console.log(`❌ ${err.message}`)
  }
}

async function main() {
  const md = readFileSync(PROMPTS_FILE, 'utf-8')
  const products = parsePrompts(md)

  mkdirSync(OUTPUT_DIR, { recursive: true })
  console.log(`Found ${products.length} products in prompts file\n`)

  for (const product of products) {
    const dir = path.join(OUTPUT_DIR, product.id)
    mkdirSync(dir, { recursive: true })

    console.log(`📦 ${product.id} (${product.num}/${products.length})`)
    for (const view of VIEWS) {
      const prompt = product.promptBase.replace('[VIEW]', view.label)
      const ext = '.jpg'
      const outputPath = path.join(dir, `${product.id}-${view.key}${ext}`)
      await generateImage(prompt, outputPath)
    }
    console.log('')
  }

  console.log('✅ All images generated!')
}

main().catch(console.error)

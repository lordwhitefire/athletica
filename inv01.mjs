import dotenv from 'dotenv'
import { existsSync, writeFileSync } from 'node:fs'
import { join } from 'node:path'

const envCandidates = ['rollout/.env.local', '.env']
const envPath = envCandidates.find(p => existsSync(p))
if (envPath) dotenv.config({ path: envPath })

const asin = process.argv[2]
const apiKey = process.env.RAIN_FOREST_API_KEY

if (!asin) {
  console.error('Usage: node inv01.mjs <ASIN>')
  process.exit(1)
}

if (!apiKey) {
  console.error('Missing RAIN_FOREST_API_KEY in .env — add it as: RAIN_FOREST_API_KEY=your_key')
  process.exit(1)
}

const url = `https://api.rainforestapi.com/request?type=product&asin=${encodeURIComponent(asin)}&amazon_domain=amazon.com&api_key=${encodeURIComponent(apiKey)}`

console.log(`Fetching ASIN ${asin} from Rainforest (amazon.com)...`)
console.log('Making exactly 1 request, no retries, no pagination.\n')

let response
try {
  response = await fetch(url)
} catch (err) {
  console.error('Network error:', err.message)
  process.exit(1)
}

const rawText = await response.text()
const outputPath = join(process.cwd(), `inv01-${asin}.json`)
writeFileSync(outputPath, rawText, 'utf-8')
console.log(`Raw response saved to: ${outputPath}\n`)

let json
try {
  json = JSON.parse(rawText)
} catch {
  console.log('Response was not valid JSON:')
  console.log(rawText.slice(0, 500))
  process.exit(1)
}

console.log(`HTTP ${response.status} — credits_used=${json.request_info?.credits_used ?? 'n/a'} credits_remaining=${json.request_info?.credits_remaining ?? 'n/a'} success=${json.request_info?.success ?? 'n/a'}`)

const SAMPLE_LENGTH = 80

function describeValue(value) {
  const type = Array.isArray(value) ? `array(${value.length})` : typeof value
  const populated = value !== null && value !== undefined && !(typeof value === 'string' && value.trim() === '') && !(Array.isArray(value) && value.length === 0) && !(typeof value === 'object' && !Array.isArray(value) && Object.keys(value).length === 0)
  let sample = ''
  if (populated) {
    sample = JSON.stringify(value)
    if (sample.length > SAMPLE_LENGTH) sample = sample.slice(0, SAMPLE_LENGTH) + '…'
    if (typeof value === 'string') sample = value
  }
  return { type, populated, sample }
}

const inventory = []
function walk(obj, currentPath = '') {
  if (obj === null || typeof obj !== 'object') return
  for (const [key, value] of Object.entries(obj)) {
    const path = currentPath ? `${currentPath}.${key}` : key
    if (Array.isArray(value)) {
      const first = value[0]
      if (value.length > 0 && first !== null && typeof first === 'object' && Object.keys(first).length > 0) {
        const { type, populated, sample } = describeValue(value)
        inventory.push({ path: `${path}[${value.length}]`, type, populated, sample })
        walk(first, `${path}[0]`)
      } else {
        const { type, populated, sample } = describeValue(value)
        inventory.push({ path, type, populated, sample })
      }
    } else if (value !== null && typeof value === 'object' && Object.keys(value).length > 0) {
      walk(value, path)
    } else {
      const { type, populated, sample } = describeValue(value)
      inventory.push({ path, type, populated, sample })
    }
  }
}

walk(json)

const padded = (text, width) => String(text).padEnd(width)
console.log('FIELD INVENTORY (flattened)')
console.log('—'.repeat(120))
console.log(`${padded('population', 10)} ${padded('type', 12)} ${padded('field', 60)} sample`)
console.log('—'.repeat(120))

const populatedRows = inventory.filter(r => r.populated)
const emptyRows = inventory.filter(r => !r.populated)

for (const row of populatedRows) {
  console.log(`${padded('populated', 10)} ${padded(row.type, 12)} ${padded(row.path, 60)} ${row.sample}`)
}
console.log('—'.repeat(120))
for (const row of emptyRows) {
  console.log(`${padded('EMPTY', 10)} ${padded(row.type, 12)} ${padded(row.path, 60)}`)
}

console.log(`\n${populatedRows.length} populated fields, ${emptyRows.length} empty/missing fields.`)

const rolloutSchemaFields = ['name', 'slug', 'price', 'asin', 'gender', 'color', 'collection', 'tagline', 'subtitle', 'intro', 'key_benefits', 'technical_details', 'adjustment', 'range', 'sole_type', 'upper_material', 'traction', 'main_image', 'images', 'meta', 'tags', 'box_contents', 'sizes', 'sizes_detail', 'availability']

console.log('\nSCHEMA COVERAGE (rollout product schema vs this response)')
console.log('—'.repeat(120))
const allSegments = new Set(inventory.flatMap(r => r.path.toLowerCase().replace(/\[\d+\]/g, '').split('.')))
for (const field of rolloutSchemaFields) {
  const match = [...allSegments].find(seg => seg === field)
  console.log(`${padded(match ? 'FOUND' : 'missing', 10)} ${field}${match ? ` → schema field present as a key` : ''}`)
}
console.log('—'.repeat(120))
console.log('\nRead the raw JSON next to verify anything the inventory truncates.')
/**
 * Throwaway diagnostic — why does /api/admin/media/assets return 500?
 * Prints metadata about the Sanity token and the API's own error message.
 * It NEVER prints the token value.
 *
 * Run from the repo root:  node developer-workspace/ROLL-15/diagnose-sanity.mjs
 */
import fs from 'node:fs';

const ENV_PATH = '/home/lordwhitefire/current-project/athletica/athletica/rollout/.env.local';
const PROJECT = 'cuiis46d';
const DATASET = 'production';
const API_VERSION = '2025-01-01';

const src = fs.readFileSync(ENV_PATH, 'utf8');
const line = src.split(/\r?\n/).find((l) => l.startsWith('SANITY_WRITE_TOKEN='));

if (!line) {
  console.log('SANITY_WRITE_TOKEN: NOT PRESENT in .env.local');
  process.exit(1);
}

const raw = line.slice('SANITY_WRITE_TOKEN='.length);
const token = raw.trim().replace(/^["']|["']$/g, '');

console.log('--- token shape (no value printed) ---');
console.log('present            : yes');
console.log('raw length         :', raw.length);
console.log('trimmed length     :', token.length);
console.log('surrounded by quotes:', /^["']/.test(raw));
console.log('has trailing CR    :', raw.endsWith('\r'));
console.log('starts with "sk"   :', token.startsWith('sk'));
console.log('contains whitespace:', /\s/.test(token));
console.log('');

const checks = [
  ['simple read (count)', `https://${PROJECT}.api.sanity.io/v${API_VERSION}/data/query/${DATASET}?query=${encodeURIComponent('count(*[])')}`],
  ['the exact page query', `https://${PROJECT}.api.sanity.io/v${API_VERSION}/data/query/${DATASET}?query=${encodeURIComponent('*[_type == "sanity.imageAsset"] | order(_createdAt desc) { _id, url, originalFilename }')}`],
  ['write-permission probe', `https://${PROJECT}.api.sanity.io/v${API_VERSION}/data/query/${DATASET}?query=${encodeURIComponent('sanity.projectId')}`],
];

for (const [name, url] of checks) {
  process.stdout.write(`[${name}] `);
  try {
    const res = await fetch(url, { headers: { Authorization: `Bearer ${token}` } });
    const body = await res.text();
    console.log(`HTTP ${res.status}`);
    console.log('   ', body.slice(0, 300).replace(/\s+/g, ' '));
  } catch (err) {
    console.log(`network error — ${err.message}`);
  }
}

console.log('');
console.log('--- how to read this ---');
console.log('HTTP 401  -> the token itself is invalid (wrong value, wrong project, or revoked)');
console.log('HTTP 403  -> the token is real but lacks permission on this dataset');
console.log('HTTP 200  -> the token is fine, and the 500 comes from somewhere else');

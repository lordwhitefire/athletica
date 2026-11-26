// Test the Google Translate method on 100 unique strings: 12 concurrent, cache-aware,
// saves as it goes. Does not touch product files.
import fs from "node:fs";

const ROOT = "/home/lordwhitefire/current-project/athletica";
const REQ = `${ROOT}/scrape-workspace/deliverables/translation/translation-request.json`;
const CACHE_PATH = `${ROOT}/scrape-workspace/structures/translation-cache.json`;
const OUT = `${ROOT}/scrape-workspace/deliverables/translation/test-100.json`;
const CONCURRENCY = 12;

const data = JSON.parse(fs.readFileSync(REQ, "utf8"));
const strings = data.strings.slice(0, 100);
const cache = fs.existsSync(CACHE_PATH) ? JSON.parse(fs.readFileSync(CACHE_PATH, "utf8")) : {};

async function translate(text) {
  const t = (text || "").trim();
  if (!t) return "";
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const url =
        "https://translate.googleapis.com/translate_a/single?client=gtx&sl=es&tl=en&dt=t&q=" +
        encodeURIComponent(t);
      const r = await fetch(url, { signal: AbortSignal.timeout(20000) });
      const j = await r.json();
      return (j[0] || []).map((x) => x[0]).join("");
    } catch (e) {
      if (attempt === 2) return t;
      await new Promise((res) => setTimeout(res, 1200 * (attempt + 1)));
    }
  }
  return t;
}

const results = [];
const t0 = Date.now();
let cached = 0;
let errors = 0;

for (let i = 0; i < strings.length; i += CONCURRENCY) {
  const chunk = strings.slice(i, i + CONCURRENCY);
  const res = await Promise.all(
    chunk.map(async (s) => {
      const start = Date.now();
      const hit = cache[s.text] !== undefined;
      let translation;
      if (hit) {
        translation = cache[s.text];
        cached++;
      } else {
        translation = await translate(s.text);
        if (translation === s.text) errors++;
        cache[s.text] = translation;
      }
      return { id: s.id, source: s.text, translation, ms: Date.now() - start, cached: hit };
    }),
  );
  results.push(...res);
  fs.writeFileSync(
    OUT,
    JSON.stringify(
      {
        meta: {
          tested: results.length,
          total: strings.length,
          concurrency: CONCURRENCY,
          elapsed_ms: Date.now() - t0,
          cached,
          errors,
        },
        results,
      },
      null,
      2,
    ),
  );
  console.log(`[${results.length}/${strings.length}] elapsed ${Date.now() - t0} ms, cached ${cached}, errors ${errors}`);
}

fs.writeFileSync(CACHE_PATH, JSON.stringify(cache));
const elapsed = Date.now() - t0;
console.log(`\ndone: ${results.length} strings in ${elapsed} ms`);
console.log(`cached: ${cached}, errors: ${errors}`);
console.log(`average: ${(elapsed / results.length).toFixed(1)} ms/string`);
console.log(`projected 23,625 strings: ${((elapsed / results.length) * 23625 / 60000).toFixed(1)} min`);
console.log("\nsamples:");
for (const r of results.slice(0, 6)) {
  console.log(`- ${r.source.slice(0, 70)} -> ${r.translation.slice(0, 70)}`);
}
console.log(`\nwrote ${OUT}`);
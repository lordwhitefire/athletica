// Translate/clean the classified product files: English descriptions and names.
// Updates deliverables/products/*.json in place. Spanish original stays in `source`.
import fs from "node:fs";
import path from "node:path";

const ROOT = "/home/lordwhitefire/current-project/athletica";
const DIR = `${ROOT}/scrape-workspace/deliverables/products`;
const CACHE_PATH = `${ROOT}/scrape-workspace/structures/translation-cache.json`;
const CONCURRENCY = 14;
const LIMIT = Number(process.argv[2] || 0);
const START_AT = Number(process.env.START_AT || 0);

const SPANISH =
  /[áéíóúñ¿¡]|\b(botas?|fútbol|futbol|césped|cesped|blanc[oa]s?|negr[oa]s?|roj[oa]s?|azul(?:es)?|verdes?|amarill[oa]s?|naranjas?|rosas?|morad[oa]s?|grises?|marron(?:es)?|jugadores?|unidad|espuma|tejido|suela|ajuste|colección|coleccion|medias?|calcetines?|camiseta|camisetas|equipación|equipacion|pantalón|pantalon|sudadera|chaqueta|gorra|guantes|portero|balón|balon|espinilleras|niño|niña|mujer|hombre|entrenamiento|manga larga)\b/i;

const REPLACEMENTS = [
  [/\bniños?\b/gi, "Kids"], [/\bniñas?\b/gi, "Kids"],
  [/\bmujer\b/gi, "Women"], [/\bhombre\b/gi, "Men"],
  [/\bmanga larga\b/gi, "Long Sleeve"],
  [/\bentrenamiento\b/gi, "Training"],
  [/\bporteros?\b/gi, "Goalkeeper"],
  [/\bbalones\b/gi, "Balls"], [/\bbal[oó]n\b/gi, "Ball"],
  [/\bbotas\b/gi, "Boots"], [/\bzapatillas\b/gi, "Shoes"],
  [/\bcamisetas?\b/gi, "Jersey"], [/\bcamisola\b/gi, "Jersey"],
  [/\bequipaciones?\b/gi, "Kit"], [/\bequipaci[oó]n\b/gi, "Kit"],
  [/\bpantalones\b/gi, "Pants"], [/\bpantal[oó]n corto\b/gi, "Shorts"],
  [/\bpantal[oó]n\b/gi, "Pants"],
  [/\bmedias\b/gi, "Socks"], [/\bcalcetines?\b/gi, "Socks"],
  [/\bguantes\b/gi, "Gloves"], [/\bgorras?\b/gi, "Cap"],
  [/\bmochilas?\b/gi, "Backpack"], [/\bbotellas?\b/gi, "Bottle"],
  [/\bespinilleras\b/gi, "Shin Guards"],
  [/\bsudaderas?\b/gi, "Hoodie"], [/\bchaquetas?\b/gi, "Jacket"],
  [/\bblanc[oa]s?\b/gi, "White"], [/\bnegr[oa]s?\b/gi, "Black"],
  [/\broj[oa]s?\b/gi, "Red"], [/\bazul(?:es)?\b/gi, "Blue"],
  [/\bverdes?\b/gi, "Green"], [/\bamarill[oa]s?\b/gi, "Yellow"],
  [/\bnaranjas?\b/gi, "Orange"], [/\brosas?\b/gi, "Pink"],
  [/\bmorad[oa]s?\b/gi, "Purple"], [/\bgrises?\b/gi, "Grey"],
  [/\bdorad[oa]s?\b/gi, "Gold"], [/\bplatead[oa]s?\b/gi, "Silver"],
];

const LEADING = /^(botas de f[uú]tbol|botas|zapatillas de f[uú]tbol|zapatillas|cami?setas?|equipaciones?|medias|calcetines|espinilleras|balones|bal[oó]n|guantes|gorras?|sudaderas?|chaquetas?|pantalones?|pantal[oó]n|shorts?|ropa|accesorios?)\s+/i;

function cleanName(name) {
  let s = (name || "").trim();
  for (const [re, to] of REPLACEMENTS) s = s.replace(re, to);
  s = s.replace(LEADING, " ");
  s = s.replace(/\s+(-|–|—)?\s*(color\s+)?(white|black|red|blue|green|yellow|orange|pink|purple|grey|gold|silver)\s*$/i, "");
  s = s.replace(/\s+para\s+.*$/i, "");
  s = s.replace(/\s+/g, " ").trim(" -–—");
  return s || (name || "").trim();
}

let cache = {};
if (fs.existsSync(CACHE_PATH)) {
  try { cache = JSON.parse(fs.readFileSync(CACHE_PATH, "utf8")); } catch {}
}
let cacheDirty = false;

async function translate(text) {
  const t = (text || "").trim();
  if (!t) return "";
  if (cache[t] !== undefined) return cache[t];
  for (let attempt = 0; attempt < 3; attempt++) {
    try {
      const url =
        "https://translate.googleapis.com/translate_a/single?client=gtx&sl=es&tl=en&dt=t&q=" +
        encodeURIComponent(t);
      const r = await fetch(url, { signal: AbortSignal.timeout(20000) });
      const j = await r.json();
      const out = (j[0] || []).map((x) => x[0]).join("");
      cache[t] = out;
      cacheDirty = true;
      return out;
    } catch (e) {
      if (attempt === 2) return t;
      await new Promise((res) => setTimeout(res, 1200 * (attempt + 1)));
    }
  }
  return t;
}

const files = fs.readdirSync(DIR).filter((f) => f.endsWith(".json"));
const todo = LIMIT > 0 ? files.slice(START_AT, START_AT + LIMIT) : files.slice(START_AT);
console.log(`products: ${files.length}; starting at ${START_AT}; processing ${todo.length}`);

let done = 0;
let changed = 0;
let translated = 0;
let fallbacks = 0;

async function processOne(file) {
  const p = JSON.parse(fs.readFileSync(path.join(DIR, file), "utf8"));
  let dirty = false;

  const newName = cleanName(p.name || "");
  if (newName !== p.name) {
    if (p.model === p.name || !p.model) p.model = newName;
    if (p.classification?.product_model === p.name || !p.classification?.product_model) {
      p.classification.product_model = newName;
    }
    p.name = newName;
    dirty = true;
  }
  if (p.classification) {
    p.classification.root_model = cleanName(p.classification.root_model || "");
    p.classification.submodel = cleanName(p.classification.submodel || "");
  }

  const d = p.description || {};
  for (const key of ["subtitle", "tagline", "intro", "collection"]) {
    if (typeof d[key] === "string" && d[key] && SPANISH.test(d[key])) {
      const out = await translate(d[key]);
      if (out === d[key]) fallbacks++;
      d[key] = out;
      translated++;
      dirty = true;
    }
  }
  if (Array.isArray(d.key_benefits)) {
    const list = [];
    for (const b of d.key_benefits) {
      if (typeof b === "string" && b && SPANISH.test(b)) {
        const tr = await translate(b);
        if (tr === b) fallbacks++;
        list.push(tr);
        translated++;
        dirty = true;
      } else {
        list.push(b);
      }
    }
    d.key_benefits = list;
  }
  p.description = d;

  if (dirty) {
    fs.writeFileSync(path.join(DIR, file), JSON.stringify(p, null, 2));
    changed++;
  }
  done++;
  if (done % 100 === 0 || done === todo.length) {
    console.log(`[${done}/${todo.length}] changed ${changed}, translated ${translated}`);
    if (cacheDirty) {
      fs.writeFileSync(CACHE_PATH, JSON.stringify(cache));
      cacheDirty = false;
    }
  }
}

for (let i = 0; i < todo.length; i += CONCURRENCY) {
  const chunk = todo.slice(i, i + CONCURRENCY);
  await Promise.all(chunk.map(processOne));
  fs.writeFileSync(CACHE_PATH, JSON.stringify(cache));
  cacheDirty = false;
  await new Promise((r) => setTimeout(r, 200));
}
fs.writeFileSync(CACHE_PATH, JSON.stringify(cache));
console.log(`done: changed ${changed}, translated ${translated}, fallbacks ${fallbacks}`);
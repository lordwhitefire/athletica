// Fix the first test product: English text, clean colour variants, variant thumbnails
// uploaded to Sanity, and app-shaped top-level image fields.
// Reads the saved capture and the v1 product JSON. Writes only inside scrape-workspace
// (plus the one variant thumbnail uploaded to Sanity, already approved).
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { execFileSync } from "node:child_process";

const require = createRequire("/home/lordwhitefire/current-project/athletica/frontend/package.json");
const { createClient } = require("@sanity/client");

const ROOT = "/home/lordwhitefire/current-project/athletica";
const CAP = path.join(ROOT, "scrape-workspace/captures/futbolmania");
const OUT = path.join(ROOT, "scrape-workspace/deliverables");
const IMG_DIR = path.join(CAP, "images/im2513-102");
const VARIANT_DIR = path.join(IMG_DIR, "variants");
fs.mkdirSync(VARIANT_DIR, { recursive: true });

// --- env (rollout token is the valid one) ---
const env = {};
for (const file of ["frontend/.env.local", "rollout/.env.local"]) {
  const p = path.join(ROOT, file);
  if (!fs.existsSync(p)) continue;
  for (const line of fs.readFileSync(p, "utf8").split("\n")) {
    const m = line.match(/^([A-Z0-9_]+)=(.*)$/);
    if (m) env[m[1]] = m[2];
  }
}
const token = env.SANITY_WRITE_TOKEN || env.SANITY_TOKEN;
if (!token) throw new Error("no Sanity write token");
const client = createClient({
  projectId: "cuiis46d",
  dataset: "production",
  token,
  apiVersion: "2025-01-01",
  useCdn: false,
});

const html = fs.readFileSync(path.join(CAP, "product-im2513-102.html"), "utf8");
const v1Path = path.join(OUT, "test-product-im2513-102.json");
const v1 = JSON.parse(fs.readFileSync(v1Path, "utf8"));

const decode = (s) =>
  s
    .replace(/<[^>]+>/g, " ")
    .replace(/&nbsp;/g, " ")
    .replace(/&amp;/g, "&")
    .replace(/&quot;/g, '"')
    .replace(/&#39;/g, "'")
    .replace(/\s+/g, " ")
    .trim();
const slugify = (s) =>
  s
    .toLowerCase()
    .normalize("NFD")
    .replace(/[\u0300-\u036f]/g, "")
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "");

const colorMap = {
  blanco: "White",
  negro: "Black",
  rojo: "Red",
  azul: "Blue",
  verde: "Green",
  amarillo: "Yellow",
  naranja: "Orange",
  rosa: "Pink",
  morado: "Purple",
  gris: "Grey",
  marron: "Brown",
  "blanco rosa": "White/Pink",
  "azul verde": "Blue/Green",
  oro: "Gold",
  plata: "Silver",
  "blanco y negro": "White and Black",
};
const toEnglishColor = (es) => colorMap[es.trim().toLowerCase()] || es.trim();

// --- collection (fixed parse) ---
const detailStart = html.indexOf('id="text-main0"');
const detailEnd = html.indexOf("product-details-items-container", detailStart);
const detail = detailStart > 0 ? html.slice(detailStart, detailEnd > 0 ? detailEnd : detailStart + 12000) : "";
const collectionEs = decode((detail.match(/Colección:\s*(?:<strong>)?([^<]+)/) || [])[1] || "");
const collection = collectionEs.trim();

// --- related variants ---
const currentSku = v1.id;
const currentName = v1.name;
const currentColor = v1.color;

const entries = [
  ...html.matchAll(
    /<a class="product-image([^"]*)" id="product-\d+" href="([^"]+)" title="([^"]*)">([\s\S]*?)<\/a>/g,
  ),
].map((m) => {
  const [, cls, href, colorEs, body] = m;
  const attr = (name) => {
    const mm = body.match(new RegExp(`${name}="([^"]*)"`));
    return mm ? decode(mm[1]) : null;
  };
  return {
    current: cls.includes("current-product"),
    href,
    colorEs: decode(colorEs),
    sku: (attr("data-replace-ref") || "").toUpperCase(),
    title: attr("data-replace-title") || "",
    image: attr("data-replace-img"),
    subtitle: attr("data-replace-subtitle") || "",
    alt: attr("alt") || "",
  };
});

const sameModel = entries.filter(
  (e) => !e.current && e.sku && e.title === currentName && e.image,
);

const seenColors = new Set([currentColor.toLowerCase()]);
const variants = [];
for (const e of sameModel) {
  const color = toEnglishColor(e.colorEs);
  if (seenColors.has(color.toLowerCase())) continue;
  seenColors.add(color.toLowerCase());
  variants.push({
    color,
    sku: e.sku,
    product_id: slugify(`${currentName}-${color}`),
    thumbnail: null,
    source_image: e.image,
    source_color_es: e.colorEs,
    source_subtitle_es: e.subtitle,
  });
}

console.log(`same-model entries: ${sameModel.length}; kept variants: ${variants.length}`);
for (const v of variants) console.log(`  ${v.sku} ${v.color} -> ${v.product_id}`);

// --- upload variant thumbnails ---
async function download(url, file) {
  const buf = execFileSync("curl", ["-sL", "--fail", "--max-time", "60", url], {
    maxBuffer: 20 * 1024 * 1024,
  });
  fs.writeFileSync(file, buf);
  return buf;
}

for (const v of variants) {
  const file = path.join(VARIANT_DIR, `${v.sku}.jpg`);
  const buf = await download(v.source_image, file);
  const asset = await client.assets.upload("image", buf, {
    filename: `${v.sku}.jpg`,
    contentType: "image/jpeg",
  });
  v.thumbnail = asset.url;
  v.sanity_asset = { _id: asset._id, url: asset.url };
  console.log(`  uploaded variant ${v.sku}: ${asset._id}`);
}

// --- English description ---
const description = {
  subtitle: "Nike AG-PRO football boots for artificial grass – white",
  tagline: "Explosive speed to dominate",
  intro:
    "The Nike Mercurial Zoom Superfly 11 Elite AG-PRO football boots are built for the fastest, most explosive players. An Air Zoom unit in the forefoot and reactive ZoomX foam deliver explosive response with every acceleration. FlyWeave Ultra fabric wraps the foot in a firm, lightweight fit, while the AG-PRO soleplate optimises traction on modern artificial-grass pitches so you can unleash your full speed.",
  collection,
  key_benefits: [
    "Air Zoom: A reactive unit that improves acceleration and running response.",
    "ZoomX: High-energy-return foam that powers every stride.",
    "FlyWeave Ultra: A lightweight, snug fit for excellent ball contact.",
    "AG-PRO soleplate: A configuration built to maximise traction on artificial grass.",
  ],
  technical_details: {
    range: "Mercurial Superfly 11 Elite",
    sole_type: "AG-PRO",
    upper_material: "FlyWeave Ultra",
    adjustment: "Lace-up",
  },
};

const mainImage = v1.images.main_image;
const gallery = v1.images.image_gallery;
const imageLinks = [mainImage, ...gallery];

const fixed = {
  id: v1.id,
  slug: v1.slug,
  name: v1.name,
  model: v1.model,
  brand: v1.brand,
  category: v1.category,
  gender: v1.gender,
  color: currentColor,
  color_variants: variants.map(({ source_image, source_color_es, source_subtitle_es, ...v }) => v),
  price: v1.price,
  sizes: [],
  description,
  traction: v1.traction,
  asin: null,
  status: "published",
  main_image: mainImage,
  thumbnail: mainImage,
  image_gallery: gallery,
  image_links: imageLinks,
  sanity_assets: v1.images.sanity_assets,
  _source: {
    url: "https://www.futbolmania.com/es/im2513-102",
    language: "es",
    captured_at: "2026-11-18",
    subtitle: v1.description.subtitle,
    tagline: v1.description.tagline,
    intro: v1.description.intro,
    collection: collectionEs ? `Colección: ${collectionEs}` : "",
    key_benefits: v1.description.key_benefits,
  },
};

// --- validation ---
const problems = [];
const spanishTokens = /\b(botas|fútbol|cesped|césped|blancas|blancos|negras|negros|velocidad|jugadores|unidad|espuma|tejido|suela|ajuste|colección)\b/i;
for (const [key, value] of Object.entries(description)) {
  if (typeof value === "string" && spanishTokens.test(value)) problems.push(`description.${key} still Spanish`);
  if (Array.isArray(value)) {
    for (const item of value) if (spanishTokens.test(item)) problems.push(`description.${key} still Spanish: ${item}`);
  }
}
if (!mainImage || !mainImage.startsWith("https://cdn.sanity.io/")) problems.push("main_image is not a Sanity URL");
if (imageLinks.length !== 10) problems.push(`image_links is ${imageLinks.length}, expected 10`);
for (const v of fixed.color_variants) {
  if (!v.thumbnail?.startsWith("https://cdn.sanity.io/")) problems.push(`variant ${v.sku} has no Sanity thumbnail`);
  if (spanishTokens.test(v.color)) problems.push(`variant ${v.sku} colour still Spanish`);
}
if (!description.collection) problems.push("collection is empty");

fs.copyFileSync(v1Path, path.join(OUT, "test-product-im2513-102.v1.json"));
fs.writeFileSync(v1Path, JSON.stringify(fixed, null, 2));

console.log(`\ncollection: ${description.collection || "(empty)"}`);
console.log(`images: ${imageLinks.length} (main + ${gallery.length} gallery)`);
console.log(`variants: ${fixed.color_variants.length}`);
console.log(`problems: ${problems.length ? problems.join("; ") : "none"}`);
console.log(`wrote ${v1Path}`);

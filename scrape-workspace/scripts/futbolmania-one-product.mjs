// One-product test: Futbolmania product -> images uploaded to Sanity -> product JSON.
// Read-only on Futbolmania; writes only to Sanity (images) and scrape-workspace (files).
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
fs.mkdirSync(IMG_DIR, { recursive: true });
fs.mkdirSync(OUT, { recursive: true });

// --- env ---
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
if (!token) throw new Error("no Sanity write token in env files");

const client = createClient({
  projectId: "cuiis46d",
  dataset: "production",
  token,
  apiVersion: "2025-01-01",
  useCdn: false,
});

// --- helpers ---
const html = fs.readFileSync(path.join(CAP, "product-im2513-102.html"), "utf8");
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

// --- product JSON-LD ---
const ld = [...html.matchAll(/<script[^>]*type="application\/ld\+json"[^>]*>([\s\S]*?)<\/script>/g)]
  .map((m) => {
    try {
      return JSON.parse(m[1]);
    } catch {
      return null;
    }
  })
  .filter(Boolean);
const productLd = ld.find((x) => x["@type"] === "Product") || {};
const sku = productLd.sku || "IM2513-102";
const name = productLd.name?.replace(/\s+IM2513-102$/, "").trim() || "Nike Mercurial Zoom Superfly 11 Elite AG-PRO";
const brand = productLd.brand?.name || "Nike";
const colorEs = productLd.color || "Blanco";

const colorMap = {
  blanco: "White", negro: "Black", rojo: "Red", azul: "Blue", verde: "Green",
  amarillo: "Yellow", naranja: "Orange", rosa: "Pink", morado: "Purple",
  gris: "Grey", marron: "Brown", "blanco y negro": "White and Black",
};
const color = colorMap[colorEs.toLowerCase()] || colorEs;

// --- description block ---
const detailStart = html.indexOf('id="text-main0"');
const detailEnd = html.indexOf("product-details-items-container", detailStart);
const detail = detailStart > 0 ? html.slice(detailStart, detailEnd > 0 ? detailEnd : detailStart + 12000) : "";
const desc1 = decode((detail.match(/<div class="desc1">([\s\S]*?)<\/div>/) || [])[1] || "");
const desc1Html = (detail.match(/<div class="desc1">([\s\S]*?)<\/div>/) || [])[1] || "";
const desc1H4 = decode((desc1Html.match(/<h4>([\s\S]*?)<\/h4>/) || [])[1] || "");
const desc1P = decode((desc1Html.match(/<p>([\s\S]*?)<\/p>/) || [])[1] || "");
const collection = decode((desc1Html.match(/Colección:\s*<strong>([\s\S]*?)<\/strong>/) || [])[1] || "");
const desc2Html = (detail.match(/<div class="desc2">([\s\S]*?)<\/div>/) || [])[1] || "";
const keyBenefits = [...desc2Html.matchAll(/<li>([\s\S]*?)<\/li>/g)].map((m) => decode(m[1])).filter(Boolean);
const subtitle = decode((detail.match(/<h3>([\s\S]*?)<\/h3>/) || [])[1] || "");

// --- gallery images (this SKU only) ---
const gallery = [
  ...new Set(
    [...html.matchAll(/data-image="([^"]+)"/g)]
      .map((m) => m[1])
      .filter(
        (u) =>
          u.includes(sku) &&
          u.includes("media.futbolmania.com") &&
          u.includes("/cache/1//") &&
          !u.includes("fm_imagen_"),
      ),
  ),
];

// --- colour variants (siblings) ---
const variants = [
  ...new Set(
    [...html.matchAll(/<a class="product-image[^"]*" id="product-\d+" href="([^"]+)" title="([^"]*)"/g)].map(
      (m) => `${m[1]}|${m[2]}`,
    ),
  ),
]
  .filter((x) => !x.includes(sku))
  .map((x) => {
    const [href, title] = x.split("|");
    return { color: colorMap[title.toLowerCase()] || title, product_id: href.split("/").pop(), thumbnail: null };
  });

// --- download images ---
async function download(url, file) {
  const buf = execFileSync("curl", ["-sL", "--fail", "--max-time", "60", url], {
    maxBuffer: 20 * 1024 * 1024,
  });
  fs.writeFileSync(file, buf);
  return buf;
}

console.log(`product: ${name} (${sku}), gallery: ${gallery.length}, variants: ${variants.length}`);

const assets = [];
for (let i = 0; i < gallery.length; i++) {
  const url = gallery[i];
  const ext = (url.match(/\.(jpg|jpeg|png|webp)$/i) || [, "jpg"])[1];
  const file = path.join(IMG_DIR, `${sku}-${i + 1}.${ext}`);
  const buf = await download(url, file);
  const asset = await client.assets.upload("image", buf, {
    filename: `${sku}-${i + 1}.${ext}`,
    contentType: `image/${ext === "jpg" ? "jpeg" : ext}`,
  });
  assets.push({ _id: asset._id, url: asset.url, originalFilename: asset.originalFilename, source: url });
  console.log(`  uploaded ${i + 1}/${gallery.length}: ${asset._id}`);
}

const product = {
  id: sku,
  slug: slugify(`${name}-${color}`),
  name,
  model: "Mercurial Superfly 11 Elite AG-PRO",
  brand,
  category: "Boots",
  gender: "Unisex",
  color,
  color_variants: variants,
  price: { current: 0, original: 0, discount_percent: 0, member_price: 0, currency: "€" },
  sizes: [],
  description: {
    subtitle,
    tagline: desc1H4,
    intro: desc1P,
    collection,
    key_benefits: keyBenefits,
    technical_details: {
      range: "Mercurial Superfly 11 Elite",
      sole_type: "AG-PRO",
      upper_material: "FlyWeave Ultra",
      adjustment: "Lace-up",
    },
  },
  traction: "AG",
  asin: null,
  status: "published",
  images: {
    main_image: assets[0]?.url || null,
    image_gallery: assets.slice(1).map((a) => a.url),
    sanity_assets: assets,
  },
};

fs.writeFileSync(path.join(OUT, "test-product-im2513-102.json"), JSON.stringify(product, null, 2));
console.log(`\nwrote ${path.join(OUT, "test-product-im2513-102.json")}`);
console.log(`main image: ${product.images.main_image}`);
console.log(`gallery: ${product.images.image_gallery.length}`);
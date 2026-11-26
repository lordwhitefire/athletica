// Phase B: download every product image and upload it to Sanity, then write the
// final app-shaped product JSON. Uses the real Chrome ref tab for image downloads.
import fs from "node:fs";
import path from "node:path";
import { createRequire } from "node:module";
import { attach, takeTabs, detach, chromiumCount } from "/home/lordwhitefire/.agents/skills/browser-attach/scripts/attach.mjs";

const require = createRequire("/home/lordwhitefire/current-project/athletica/frontend/package.json");
const { createClient } = require("@sanity/client");

const ROOT = "/home/lordwhitefire/current-project/athletica";
const RAW_DIR = `${ROOT}/scrape-workspace/structures/futbolmania-products-raw`;
const OUT_DIR = `${ROOT}/scrape-workspace/deliverables/products`;
const LOG = `${ROOT}/scrape-workspace/structures/futbolmania-image-upload-errors.json`;
const CONCURRENCY = 12;
const LIMIT = Number(process.argv[2] || 0);
const FORCE = process.argv[3] === "force";
const TAB = process.env.TAB || "build";

fs.mkdirSync(OUT_DIR, { recursive: true });

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

const safeId = (id) => id.replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "product";

const files = fs
  .readdirSync(RAW_DIR)
  .filter((f) => f.endsWith(".json"))
  .map((f) => ({ file: f, raw: JSON.parse(fs.readFileSync(path.join(RAW_DIR, f), "utf8")) }))
  .filter(({ raw }) => FORCE || !fs.existsSync(path.join(OUT_DIR, `${safeId(raw.id)}.json`)));

if (LIMIT > 0) files.length = Math.min(files.length, LIMIT);
console.log(`raw products: ${files.length} to process`);

const errors = fs.existsSync(LOG) ? JSON.parse(fs.readFileSync(LOG, "utf8")) : {};
const before = chromiumCount();
const browser = await attach();
try {
  const tabs = await takeTabs(browser, [TAB]);
  const page = tabs[TAB];
  await page
    .goto("https://media.futbolmania.com/", { waitUntil: "domcontentloaded", timeout: 30000 })
    .catch(() => {});

  async function download(url) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const res = await page.request.get(url, { timeout: 60000 });
        if (res.ok()) return await res.body();
        if (res.status() === 429 || res.status() >= 500) {
          await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
          continue;
        }
        throw new Error(`http ${res.status()}`);
      } catch (e) {
        if (attempt === 2) throw e;
        await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
      }
    }
  }

  async function uploadImage(url, filename) {
    const buf = await download(url);
    const ext = (url.match(/\.(jpg|jpeg|png|webp)$/i) || [, "jpg"])[1].toLowerCase();
    const contentType = ext === "jpg" ? "image/jpeg" : `image/${ext}`;
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        const asset = await client.assets.upload("image", buf, { filename, contentType });
        return { _id: asset._id, url: asset.url, source: url };
      } catch (e) {
        if (attempt === 2) throw e;
        await new Promise((r) => setTimeout(r, 1500 * (attempt + 1)));
      }
    }
  }

  async function processOne(raw) {
    const final = { ...raw };
    const fileId = safeId(raw.id);
    const sourceImages = raw.images?.source_gallery || [];
    const assets = [];
    const failed = [];

    for (let i = 0; i < sourceImages.length; i += CONCURRENCY) {
      const chunk = sourceImages.slice(i, i + CONCURRENCY);
      const res = await Promise.all(
        chunk.map(async (url, j) => {
          try {
            const idx = i + j + 1;
            return await uploadImage(url, `${fileId}-${idx}.jpg`);
          } catch (e) {
            failed.push({ url, error: String(e) });
            return null;
          }
        }),
      );
      assets.push(...res.filter(Boolean));
    }

    // Variant thumbnails
    const variantAssets = new Map();
    for (const v of raw.color_variants || []) {
      if (!v.source_image) continue;
      try {
        const asset = await uploadImage(v.source_image, `${fileId}-${v.sku}.jpg`);
        variantAssets.set(v.sku, asset);
      } catch (e) {
        failed.push({ variant: v.sku, url: v.source_image, error: String(e) });
      }
    }

    final.main_image = assets[0]?.url || null;
    final.thumbnail = assets[0]?.url || null;
    final.image_gallery = assets.slice(1).map((a) => a.url);
    final.image_links = assets.map((a) => a.url);
    final.sanity_assets = assets.map((a) => ({ _id: a._id, url: a.url }));
    final.color_variants = (raw.color_variants || []).map((v) => ({
      color: v.color,
      sku: v.sku,
      product_id: v.product_id,
      thumbnail: variantAssets.get(v.sku)?.url || "",
      sanity_asset: variantAssets.get(v.sku)
        ? { _id: variantAssets.get(v.sku)._id, url: variantAssets.get(v.sku).url }
        : undefined,
    }));
    if (raw.source) raw.source.images = sourceImages;
    delete final.images;

    fs.writeFileSync(path.join(OUT_DIR, `${fileId}.json`), JSON.stringify(final, null, 2));
    if (failed.length) errors[raw.id] = failed;
    return { id: raw.id, images: assets.length, failed: failed.length };
  }

  const PRODUCT_CONCURRENCY = 8;
  let done = 0;
  for (let i = 0; i < files.length; i += PRODUCT_CONCURRENCY) {
    const chunk = files.slice(i, i + PRODUCT_CONCURRENCY);
    const res = await Promise.all(chunk.map(({ raw }) => processOne(raw)));
    done += res.length;
    console.log(`[${done}/${files.length}] ${res.map((r) => `${r.id}:${r.images}img`).join(" ")}`);
    fs.writeFileSync(LOG, JSON.stringify(errors, null, 2));
    await new Promise((r) => setTimeout(r, 200));
  }
} finally {
  await detach(browser);
}
console.log("automation browser processes after:", chromiumCount(), "(before:", before + ")");
console.log(`wrote ${OUT_DIR}`);
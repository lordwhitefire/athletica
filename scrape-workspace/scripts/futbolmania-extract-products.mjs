// Phase A: extract every unique Futbolmania product (data + English translation).
// Uses the real Chrome ref tab. Writes one raw JSON per product; resumable.
import fs from "node:fs";
import path from "node:path";
import { attach, takeTabs, detach, chromiumCount } from "/home/lordwhitefire/.agents/skills/browser-attach/scripts/attach.mjs";

const ROOT = "/home/lordwhitefire/current-project/athletica";
const STRUCT = `${ROOT}/scrape-workspace/structures`;
const UNIQUE = JSON.parse(fs.readFileSync(`${STRUCT}/futbolmania-unique-products.json`, "utf8"));
const CRAWL = JSON.parse(fs.readFileSync(`${STRUCT}/futbolmania-full-crawl.json`, "utf8"));
const MENU = JSON.parse(fs.readFileSync(`${STRUCT}/futbolmania-menu.json`, "utf8"));
const OUT_DIR = `${STRUCT}/futbolmania-products-raw`;
const PROGRESS = `${STRUCT}/futbolmania-extract-progress.json`;
const BATCH = 20;
const CONCURRENCY = 10;
const LIMIT = Number(process.argv[2] || 0);
const FORCE = process.argv[3] === "force";
const TAB = process.env.TAB || "ref";

const categoryMap = {
  "Botas de fútbol": "Boots",
  "Botas multitaco": "Multi-Stud Boots",
  "Zapatillas fútbol sala": "Indoor Shoes",
  "Espinilleras fútbol": "Shin Guards",
  "Balón de fútbol": "Balls",
  "Guantes de portero": "Goalkeeper Gloves",
  "Medias y calcetines": "Socks",
  "Camisetas de fútbol": "Jerseys",
  "Equipaciones de fútbol": "Kits",
  "Ropa entrenamiento": "Training Apparel",
  "Ropa de fútbol": "Clothing",
  "Accesorios fútbol": "Accessories",
  "Ofertas fútbol": "Offers",
  "Equipos fútbol": "Clubs",
  "La Liga": "La Liga Kids",
  "Equipos internacionales": "International Clubs Kids",
  "Calzado fútbol": "Kids Footwear",
  "Botas fútbol niño": "Kids Boots",
  "Botas niño multitaco": "Kids Multi-Stud Boots",
  "Botas niño fútbol sala": "Kids Indoor Shoes",
  "Balones": "Kids Balls",
  "Porteros": "Kids Goalkeeper",
  "Espinilleras": "Kids Shin Guards",
  "Equipaciones": "Kids Kits",
  "Accesorios": "Kids Accessories",
  "Ofertas": "Kids Offers",
  "Ídolos": "Kids Idols",
  "Marcas": "Kids Brands",
};

fs.mkdirSync(OUT_DIR, { recursive: true });

// product URL -> menu items
const productMenu = new Map();
for (const item of MENU.items) {
  const c = CRAWL[item.href];
  if (!c || !Array.isArray(c.product_urls)) continue;
  for (const url of c.product_urls) {
    if (!productMenu.has(url)) productMenu.set(url, []);
    productMenu.get(url).push({
      audience: item.audience,
      root: item.root,
      level: item.level,
      name: item.name,
      href: item.href,
    });
  }
}

const colorMap = {
  blanco: "White", negro: "Black", rojo: "Red", azul: "Blue", verde: "Green",
  amarillo: "Yellow", naranja: "Orange", rosa: "Pink", morado: "Purple",
  gris: "Grey", marron: "Brown", "blanco rosa": "White/Pink", "azul verde": "Blue/Green",
  oro: "Gold", plata: "Silver", "blanco y negro": "White and Black",
};
const toEnglishColor = (es) => colorMap[(es || "").trim().toLowerCase()] || (es || "").trim();
const slugify = (s) =>
  s.toLowerCase().normalize("NFD").replace(/[\u0300-\u036f]/g, "").replace(/[^a-z0-9]+/g, "-").replace(/^-+|-+$/g, "");

const safeId = (id) => id.replace(/[^A-Za-z0-9._-]+/g, "-").replace(/^-+|-+$/g, "") || "product";

const progress = fs.existsSync(PROGRESS) ? JSON.parse(fs.readFileSync(PROGRESS, "utf8")) : {};
let todo = UNIQUE.products.filter((p) => FORCE || !progress[p.url] || progress[p.url].error);
if (LIMIT > 0) todo = todo.slice(0, LIMIT);
console.log(`unique products: ${UNIQUE.products.length}; todo: ${todo.length}`);
if (todo.length === 0) process.exit(0);

const before = chromiumCount();
const browser = await attach();
try {
  const tabs = await takeTabs(browser, [TAB]);
  const page = tabs[TAB];
  if (!page.url().startsWith("https://www.futbolmania.com/")) {
    for (let attempt = 0; attempt < 3; attempt++) {
      try {
        await page.goto("https://www.futbolmania.com/es/botas-de-futbol", {
          waitUntil: "domcontentloaded",
          timeout: 60000,
        });
        break;
      } catch (e) {
        if (attempt === 2) throw e;
        await page.waitForTimeout(5000);
      }
    }
  }

  let done = UNIQUE.products.length - todo.length;
  for (let i = 0; i < todo.length; i += BATCH) {
    const batch = todo.slice(i, i + BATCH);
    const results = await page.evaluate(
      async ({ items, concurrency }) => {
        const parse = (html) => new DOMParser().parseFromString(html, "text/html");
        const txt = (el) => (el?.textContent || "").replace(/\s+/g, " ").trim();
        const cache = new Map();
        const translate = async (text) => {
          const t = (text || "").trim();
          if (!t) return "";
          if (cache.has(t)) return cache.get(t);
          for (let attempt = 0; attempt < 3; attempt++) {
            try {
              const url =
                "https://translate.googleapis.com/translate_a/single?client=gtx&sl=es&tl=en&dt=t&q=" +
                encodeURIComponent(t);
              const r = await fetch(url, { signal: AbortSignal.timeout(20000) });
              const j = await r.json();
              const out = (j[0] || []).map((x) => x[0]).join("");
              cache.set(t, out);
              return out;
            } catch (e) {
              if (attempt === 2) return t;
              await new Promise((res) => setTimeout(res, 1200 * (attempt + 1)));
            }
          }
          return t;
        };

        const extractOne = async ({ url, sku }) => {
          try {
            const r = await fetch(url, { credentials: "include", signal: AbortSignal.timeout(60000) });
            if (!r.ok) return { url, error: `http ${r.status}` };
            const doc = parse(await r.text());

            let ld = null;
            for (const s of doc.querySelectorAll('script[type="application/ld+json"]')) {
              try {
                const j = JSON.parse(s.textContent);
                if (j && j["@type"] === "Product") { ld = j; break; }
              } catch { /* ignore */ }
            }
            if (!ld || !ld.sku) return { url, error: "no product json-ld" };

            const fullSku = String(ld.sku || sku);
            const name = String(ld.name || "")
              .replace(new RegExp("\\s+" + fullSku + "$", "i"), "")
              .trim();
            const brand = ld.brand?.name || "";
            const colorEs = ld.color || "";

            const detail = doc.querySelector("#text-main0");
            const subtitle = txt(detail?.querySelector("h3"));
            const desc1 = detail?.querySelector(".desc1");
            const tagline = txt(desc1?.querySelector("h4"));
            const desc1Ps = [...(desc1?.querySelectorAll("p") || [])].map(txt).filter(Boolean);
            const collection = (
              desc1Ps.find((p) => /Colección:/i.test(p)) || ""
            ).replace(/Colección:\s*/i, "").trim();
            const intro = desc1Ps.find((p) => !/Colección:/i.test(p)) || "";
            const benefits = [...(detail?.querySelectorAll(".desc2 li") || [])].map(txt).filter(Boolean);

            const galleryFromMain = [
              ...new Set(
                [...doc.querySelectorAll("#amasty_gallery a[data-image], #amasty_gallery a[data-zoom-image]")]
                  .map((a) => a.getAttribute("data-image") || a.getAttribute("data-zoom-image"))
                  .filter(Boolean),
              ),
            ];
            let gallery = galleryFromMain;
            if (gallery.length === 0) {
              const base = fullSku.replace(/^0+/, "").replace(/[A-Za-z]+$/, "").toLowerCase();
              gallery = [
                ...new Set(
                  [...doc.querySelectorAll("a[data-image]")]
                    .map((a) => a.getAttribute("data-image"))
                    .filter(
                      (u) =>
                        u &&
                        u.includes("media.futbolmania.com") &&
                        u.includes("/cache/1//") &&
                        !u.includes("fm_imagen_") &&
                        (u.includes(fullSku) || u.includes(base)),
                    ),
                ),
              ];
            }

            const variants = [...doc.querySelectorAll(".related-carousel a.product-image")]
              .filter((a) => !a.classList.contains("current-product"))
              .map((a) => ({
                color: a.getAttribute("title") || "",
                sku: (a.getAttribute("data-replace-ref") || "").toUpperCase(),
                title: a.getAttribute("data-replace-title") || "",
                image: a.getAttribute("data-replace-img") || "",
              }))
              .filter((v) => v.title === name && v.image && v.sku);

            const [subtitleEn, taglineEn, introEn, collectionEn, benefitsEn] = await Promise.all([
              translate(subtitle),
              translate(tagline),
              translate(intro),
              translate(collection),
              Promise.all(benefits.map(translate)),
            ]);

            return {
              url,
              sku: fullSku,
              name,
              brand,
              colorEs,
              subtitle,
              tagline,
              intro,
              collection,
              benefits,
              gallery,
              variants,
              translated: {
                subtitle: subtitleEn,
                tagline: taglineEn,
                intro: introEn,
                collection: collectionEn,
                key_benefits: benefitsEn,
              },
            };
          } catch (e) {
            return { url, error: String(e) };
          }
        };

        const out = [];
        for (let i = 0; i < items.length; i += concurrency) {
          const chunk = items.slice(i, i + concurrency);
          const res = await Promise.all(chunk.map(extractOne));
          out.push(...res);
        }
        return out;
      },
      { items: batch, concurrency: CONCURRENCY },
    );

    let ok = 0;
    for (const item of batch) {
      const r = results.find((x) => x.url === item.url) || { url: item.url, error: "missing result" };
      if (r.error) {
        progress[item.url] = { error: r.error };
        continue;
      }
      const menu = productMenu.get(item.url) || [];
      const deepest = [...menu].sort(
        (a, b) => (b.level || "").localeCompare(a.level || "") || a.name.localeCompare(b.name),
      )[0];
      const sourceCategory = deepest?.root || "";
      const category = categoryMap[sourceCategory] || sourceCategory;
      const audience = deepest?.audience || "adult";
      const gender = audience === "kids" ? "Kids" : "Unisex";
      const color = toEnglishColor(r.colorEs);

      const soleMatch = r.name.match(/\b(AG-PRO|AG|FG|SG|MG|TF|IC|HG|FG-PRO|SG-PRO)\b/i);
      const soleType = soleMatch ? soleMatch[1].toUpperCase() : "";
      const range = soleType
        ? r.name.replace(new RegExp("\\s+" + soleType + "$", "i"), "").replace(/^\S+\s+/, "").trim()
        : r.name.replace(/^\S+\s+/, "").trim();

      const variants = [];
      const seen = new Set([color.toLowerCase()]);
      for (const v of r.variants) {
        const vc = toEnglishColor(v.color);
        if (seen.has(vc.toLowerCase())) continue;
        seen.add(vc.toLowerCase());
        variants.push({
          color: vc,
          sku: v.sku,
          product_id: slugify(`${r.name}-${vc}`),
          source_image: v.image,
        });
      }

      const raw = {
        id: r.sku,
        slug: slugify(`${r.name}-${color}`),
        name: r.name,
        model: r.name,
        brand: r.brand,
        category,
        audience,
        gender,
        color,
        color_variants: variants,
        price: { current: 0, original: 0, discount_percent: 0, member_price: 0, currency: "€" },
        sizes: [],
        description: {
          subtitle: r.translated.subtitle || r.subtitle,
          tagline: r.translated.tagline || r.tagline,
          intro: r.translated.intro || r.intro,
          collection: r.translated.collection || r.collection,
          key_benefits: r.translated.key_benefits?.length ? r.translated.key_benefits : r.benefits,
          technical_details: {
            range,
            sole_type: soleType,
            upper_material: "",
            adjustment: soleType ? "Lace-up" : "",
          },
        },
        traction: soleType || null,
        asin: null,
        status: "published",
        source: {
          url: r.url,
          language: "es",
          category: sourceCategory,
          captured_at: new Date().toISOString().slice(0, 10),
          subtitle: r.subtitle,
          tagline: r.tagline,
          intro: r.intro,
          collection: r.collection,
          key_benefits: r.benefits,
        },
        images: {
          source_gallery: r.gallery,
          source_main: r.gallery[0] || null,
        },
        menu_items: menu,
      };

      const fileId = safeId(raw.id);
      fs.writeFileSync(path.join(OUT_DIR, `${fileId}.json`), JSON.stringify(raw, null, 2));
      progress[item.url] = { ok: true, sku: raw.id, images: r.gallery.length, variants: variants.length };
      ok++;
    }

    done += batch.length;
    fs.writeFileSync(PROGRESS, JSON.stringify(progress, null, 2));
    console.log(
      `[${Math.min(done, UNIQUE.products.length)}/${UNIQUE.products.length}] batch ${i + batch.length} done — ok ${ok}/${batch.length}`,
    );
    await page.waitForTimeout(300);
  }
} finally {
  await detach(browser);
}
console.log("automation browser processes after:", chromiumCount(), "(before:", before + ")");
console.log(`raw product files: ${OUT_DIR}`);
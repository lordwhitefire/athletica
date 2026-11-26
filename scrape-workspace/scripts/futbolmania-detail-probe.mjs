// Futbolmania detail probe — open one product in the skill's own ref tab, save the HTML,
// and report the fields that are available. Read-only.
import fs from "node:fs";
import {
  attach,
  takeTabs,
  detach,
} from "/home/lordwhitefire/.agents/skills/browser-attach/scripts/attach.mjs";

const URL = "https://www.futbolmania.com/es/im2513-102";
const OUT = "/home/lordwhitefire/current-project/athletica/scrape-workspace/captures/futbolmania";
fs.mkdirSync(OUT, { recursive: true });

const browser = await attach();
try {
  const tabs = await takeTabs(browser, ["ref"]);
  const page = tabs.ref;

  await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 0 });
  await page.waitForTimeout(2500);

  const html = await page.content();
  fs.writeFileSync(`${OUT}/product-im2513-102.html`, html);

  const info = await page.evaluate(() => {
    const text = (sel) => (document.querySelector(sel)?.textContent || "").trim();
    const all = (sel) => [...document.querySelectorAll(sel)].map((e) => (e.textContent || "").trim()).filter(Boolean);
    const crumbs = [...document.querySelectorAll(".breadcrumbs a, nav.breadcrumbs a, .breadcrumb a")].map((a) => ({
      text: (a.textContent || "").trim(),
      href: a.getAttribute("href") || "",
    }));
    const imgs = [...document.querySelectorAll(".product-gallery img, .gallery img, [data-gallery] img, .product-image img")].map(
      (i) => i.src || i.getAttribute("data-src") || "",
    );
    const jsonld = [...document.querySelectorAll('script[type="application/ld+json"]')].map((s) => s.textContent.slice(0, 4000));
    return {
      title: document.title,
      h1: text("h1"),
      brand: text(".product-brand, .brand, [itemprop='brand']"),
      sku: text(".sku, [itemprop='sku']"),
      breadcrumbs: crumbs,
      images: imgs.slice(0, 12),
      jsonld,
      descriptionHeadings: all("h2, h3").slice(0, 20),
      bodyText: (document.body.innerText || "").slice(0, 2500),
    };
  });

  console.log(JSON.stringify(info, null, 2));
} finally {
  await detach(browser);
}
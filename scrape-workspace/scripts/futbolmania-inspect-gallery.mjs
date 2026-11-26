// Inspect the gallery selectors on one product page (real Chrome ref tab).
import { attach, takeTabs, detach } from "/home/lordwhitefire/.agents/skills/browser-attach/scripts/attach.mjs";

const url = process.argv[2] || "https://www.futbolmania.com/es/019228a";
const browser = await attach();
try {
  const tabs = await takeTabs(browser, ["ref"]);
  const page = tabs.ref;
  await page.goto(url, { waitUntil: "domcontentloaded", timeout: 0 });
  const info = await page.evaluate(() => {
    const abs = (u) => {
      try { return new URL(u, location.href).href; } catch { return u; }
    };
    return {
      title: document.title,
      dataImages: [...document.querySelectorAll("a[data-image]")].map((a) => abs(a.getAttribute("data-image"))),
      galleryAnchors: [...document.querySelectorAll("#amasty_gallery a")].map((a) =>
        abs(a.getAttribute("data-image") || a.getAttribute("href")),
      ),
      detailImgs: [...document.querySelectorAll(".product-details-items img")].map((i) =>
        abs(i.getAttribute("src") || i.getAttribute("data-src")),
      ),
      allCatalogImgs: [...document.querySelectorAll('img[src*="media.futbolmania.com"]')]
        .map((i) => abs(i.getAttribute("src")))
        .slice(0, 20),
    };
  });
  console.log(JSON.stringify(info, null, 2));
} finally {
  await detach(browser);
}
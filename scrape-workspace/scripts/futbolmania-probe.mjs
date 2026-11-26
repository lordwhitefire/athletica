// Futbolmania probe — open the Boots category in the skill's own ref tab, save the HTML,
// and report what product selectors exist. Does not touch the owner's tabs.
import fs from "node:fs";
import {
  attach,
  takeTabs,
  detach,
  chromiumCount,
} from "/home/lordwhitefire/.agents/skills/browser-attach/scripts/attach.mjs";

const URL = "https://www.futbolmania.com/es/botas-de-futbol";
const OUT = "/home/lordwhitefire/current-project/athletica/scrape-workspace/captures/futbolmania";
fs.mkdirSync(OUT, { recursive: true });

const before = chromiumCount();
const browser = await attach();
try {
  const tabs = await takeTabs(browser, ["ref"], { recreate: true });
  const page = tabs.ref;

  await page.goto(URL, { waitUntil: "domcontentloaded", timeout: 0 });
  try {
    await page.waitForSelector("a.product-item-link", { timeout: 30000 });
  } catch {
    // fall through — the HTML dump will show what rendered
  }
  await page.waitForTimeout(2500);

  const html = await page.content();
  fs.writeFileSync(`${OUT}/boots.html`, html);

  const info = await page.evaluate(() => {
    const pick = (sel) => [...document.querySelectorAll(sel)].length;
    const samples = (sel, n = 8) =>
      [...document.querySelectorAll(sel)]
        .slice(0, n)
        .map((el) => ({
          text: (el.textContent || "").trim().slice(0, 120),
          href: el.getAttribute("href") || "",
        }));
    return {
      title: document.title,
      url: location.href,
      counts: {
        productItemLink: pick("a.product-item-link"),
        productItemInfo: pick(".product-item-info"),
        productItems: pick(".product-item"),
        productName: pick(".product-item-name"),
        productPrice: pick(".product-item-price"),
        productImg: pick(".product-item-photo"),
      },
      samples: {
        productItemLink: samples("a.product-item-link"),
        productItemInfo: samples(".product-item-info a"),
      },
    };
  });

  console.log(JSON.stringify(info, null, 2));
} finally {
  await detach(browser);
}
console.log("automation browser processes after:", chromiumCount(), "(before:", before + ")");
// Probe: count products on a few Futbolmania category pages from inside the real Chrome tab.
import { attach, takeTabs, detach, chromiumCount } from "/home/lordwhitefire/.agents/skills/browser-attach/scripts/attach.mjs";

const URLS = [
  "https://www.futbolmania.com/es/botas-de-futbol",
  "https://www.futbolmania.com/es/camisetas-futbol",
  "https://www.futbolmania.com/es/botas-futbol-adidas",
];

const before = chromiumCount();
const browser = await attach();
try {
  const tabs = await takeTabs(browser, ["ref"]);
  const page = tabs.ref;
  await page.goto("https://www.futbolmania.com/es/botas-de-futbol", {
    waitUntil: "domcontentloaded",
    timeout: 0,
  });

  const counts = await page.evaluate(async (urls) => {
    const parse = (html) => new DOMParser().parseFromString(html, "text/html");
    const cards = (doc) => doc.querySelectorAll("li.item.box-item").length;
    const maxPage = (doc) => {
      let max = 1;
      doc.querySelectorAll('a[href*="?p="]').forEach((a) => {
        const m = (a.getAttribute("href") || "").match(/[?&]p=(\d+)/);
        if (m) max = Math.max(max, parseInt(m[1], 10));
      });
      return max;
    };
    const out = {};
    for (const url of urls) {
      try {
        const r = await fetch(url, { credentials: "include" });
        const html = await r.text();
        const doc = parse(html);
        const page1 = cards(doc);
        const pages = maxPage(doc);
        let last = page1;
        if (pages > 1) {
          const lastUrl = url + (url.includes("?") ? "&" : "?") + "p=" + pages;
          const r2 = await fetch(lastUrl, { credentials: "include" });
          const doc2 = parse(await r2.text());
          last = cards(doc2);
        }
        out[url] = {
          status: r.status,
          page1,
          pages,
          last,
          total: pages === 1 ? page1 : (pages - 1) * page1 + last,
        };
      } catch (e) {
        out[url] = { error: String(e) };
      }
    }
    return out;
  }, URLS);

  console.log(JSON.stringify(counts, null, 2));
} finally {
  await detach(browser);
}
console.log("automation browser processes after:", chromiumCount(), "(before:", before + ")");
// Crawl every Futbolmania menu category and count products, using the real Chrome tab.
// Page 1 gives the page size and the max page number; the last page gives its own count.
// Results are written after every batch, so the run is resumable.
import fs from "node:fs";
import { attach, takeTabs, detach, chromiumCount } from "/home/lordwhitefire/.agents/skills/browser-attach/scripts/attach.mjs";

const ROOT = "/home/lordwhitefire/current-project/athletica";
const MENU_PATH = `${ROOT}/scrape-workspace/structures/futbolmania-menu.json`;
const OUT_PATH = `${ROOT}/scrape-workspace/structures/futbolmania-product-counts.json`;
const CONCURRENCY = 8;
const BATCH = 16;
const DELAY_MS = 300;
const LIMIT = Number(process.argv[2] || 0); // optional: only process the first N todo URLs

const menu = JSON.parse(fs.readFileSync(MENU_PATH, "utf8"));
const allUrls = [...new Set(menu.items.map((i) => i.href))];
const results = fs.existsSync(OUT_PATH) ? JSON.parse(fs.readFileSync(OUT_PATH, "utf8")) : {};

let todo = allUrls.filter((u) => !results[u] || results[u].error);
if (LIMIT > 0) todo = todo.slice(0, LIMIT);

console.log(`menu urls: ${allUrls.length}; todo: ${todo.length}`);
if (todo.length === 0) {
  console.log("nothing to do");
  process.exit(0);
}

const before = chromiumCount();
const browser = await attach();
try {
  const tabs = await takeTabs(browser, ["ref"]);
  const page = tabs.ref;
  await page.goto("https://www.futbolmania.com/es/botas-de-futbol", {
    waitUntil: "domcontentloaded",
    timeout: 0,
  });

  let done = allUrls.length - todo.length;
  for (let i = 0; i < todo.length; i += BATCH) {
    const batch = todo.slice(i, i + BATCH);
    const counts = await page.evaluate(
      async ({ batch, concurrency }) => {
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
        const fetchHtml = async (url) => {
          for (let attempt = 0; attempt < 3; attempt++) {
            const r = await fetch(url, { credentials: "include" });
            if (r.ok) return { status: r.status, html: await r.text() };
            if (r.status === 429 || r.status >= 500) {
              await new Promise((res) => setTimeout(res, 1500 * (attempt + 1)));
              continue;
            }
            return { status: r.status, html: "" };
          }
          throw new Error("fetch failed after retries");
        };
        const countOne = async (url) => {
          try {
            const r1 = await fetchHtml(url);
            const doc1 = parse(r1.html);
            const page1 = cards(doc1);
            const pages = maxPage(doc1);
            let last = page1;
            if (pages > 1) {
              const lastUrl = url + (url.includes("?") ? "&" : "?") + "p=" + pages;
              const r2 = await fetchHtml(lastUrl);
              const doc2 = parse(r2.html);
              last = cards(doc2);
            }
            return {
              status: r1.status,
              page1,
              pages,
              last,
              total: pages === 1 ? page1 : (pages - 1) * page1 + last,
            };
          } catch (e) {
            return { error: String(e) };
          }
        };
        const out = {};
        for (let i = 0; i < batch.length; i += concurrency) {
          const chunk = batch.slice(i, i + concurrency);
          const res = await Promise.all(chunk.map(countOne));
          chunk.forEach((u, j) => (out[u] = res[j]));
        }
        return out;
      },
      { batch, concurrency: CONCURRENCY },
    );

    Object.assign(results, counts);
    done += batch.length;
    fs.writeFileSync(OUT_PATH, JSON.stringify(results, null, 2));
    const last = counts[batch[batch.length - 1]];
    console.log(
      `[${Math.min(done, allUrls.length)}/${allUrls.length}] batch ${i + batch.length} done` +
        (last ? ` — last: ${last.total ?? last.error}` : ""),
    );
    await page.waitForTimeout(DELAY_MS);
  }
} finally {
  await detach(browser);
}
console.log("automation browser processes after:", chromiumCount(), "(before:", before + ")");
console.log(`wrote ${OUT_PATH}`);
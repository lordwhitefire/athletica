// Full Futbolmania crawl: every menu category, every page, every product URL.
// Uses the real Chrome ref tab. Resumable: results are written after every batch.
import fs from "node:fs";
import { attach, takeTabs, detach, chromiumCount } from "/home/lordwhitefire/.agents/skills/browser-attach/scripts/attach.mjs";

const ROOT = "/home/lordwhitefire/current-project/athletica";
const MENU_PATH = `${ROOT}/scrape-workspace/structures/futbolmania-menu.json`;
const OUT_PATH = `${ROOT}/scrape-workspace/structures/futbolmania-full-crawl.json`;
const CONCURRENCY = 16;
const BATCH = 16;
const DELAY_MS = 300;
const LIMIT = Number(process.argv[2] || 0);

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
        const productUrls = (doc) => {
          const urls = [];
          doc.querySelectorAll("li.item.box-item").forEach((card) => {
            const a = card.querySelector("a[href]");
            if (a) urls.push(a.href);
          });
          return urls;
        };
        const nextUrl = (doc, baseUrl) => {
          const a = doc.querySelector("a.next, a.i-next");
          if (a && a.getAttribute("href")) {
            try {
              return new URL(a.getAttribute("href"), baseUrl).href;
            } catch {
              /* ignore */
            }
          }
          const link = doc.querySelector('link[rel="next"]');
          if (link && link.getAttribute("href")) {
            try {
              return new URL(link.getAttribute("href"), baseUrl).href;
            } catch {
              /* ignore */
            }
          }
          return null;
        };
        const fetchHtml = async (url) => {
          for (let attempt = 0; attempt < 3; attempt++) {
            try {
              const r = await fetch(url, {
                credentials: "include",
                signal: AbortSignal.timeout(30000),
              });
              if (r.ok) return { status: r.status, html: await r.text() };
              if (r.status === 429 || r.status >= 500) {
                await new Promise((res) => setTimeout(res, 1500 * (attempt + 1)));
                continue;
              }
              return { status: r.status, html: "" };
            } catch (e) {
              if (attempt === 2) throw e;
              await new Promise((res) => setTimeout(res, 1500 * (attempt + 1)));
            }
          }
          throw new Error("fetch failed after retries");
        };
        const countOne = async (url) => {
          try {
            const pageCounts = [];
            const urls = new Set();
            let current = url;
            const seen = new Set();
            for (let p = 0; p < 300; p++) {
              if (seen.has(current)) break;
              seen.add(current);
              const r = await fetchHtml(current);
              if (!r.html) {
                pageCounts.push(0);
                break;
              }
              const doc = parse(r.html);
              pageCounts.push(cards(doc));
              for (const u of productUrls(doc)) urls.add(u);
              const next = nextUrl(doc, current);
              if (!next || next === current || next.includes("#")) break;
              current = next;
            }
            return {
              status: 200,
              pages: pageCounts.length,
              page_counts: pageCounts,
              total: pageCounts.reduce((a, b) => a + b, 0),
              product_urls: [...urls],
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
        (last ? ` — last: ${last.total ?? last.error} products, ${last.pages ?? "?"} pages` : ""),
    );
    await page.waitForTimeout(DELAY_MS);
  }
} finally {
  await detach(browser);
}
console.log("automation browser processes after:", chromiumCount(), "(before:", before + ")");
console.log(`wrote ${OUT_PATH}`);
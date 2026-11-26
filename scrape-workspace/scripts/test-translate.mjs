// Test Spanish -> English translation from inside the real Chrome tab (no curl).
import { attach, takeTabs, detach } from "/home/lordwhitefire/.agents/skills/browser-attach/scripts/attach.mjs";

const browser = await attach();
try {
  const tabs = await takeTabs(browser, ["ref"]);
  const page = tabs.ref;
  await page.goto("https://www.futbolmania.com/es/im2513-102", {
    waitUntil: "domcontentloaded",
    timeout: 0,
  });
  const out = await page.evaluate(async () => {
    const q = "Las botas de fútbol Nike están diseñadas para los jugadores más rápidos. Incorporan la unidad Air Zoom y la espuma reactiva ZoomX.";
    const url =
      "https://translate.googleapis.com/translate_a/single?client=gtx&sl=es&tl=en&dt=t&q=" +
      encodeURIComponent(q);
    try {
      const r = await fetch(url);
      const j = await r.json();
      return { ok: true, status: r.status, text: (j[0] || []).map((x) => x[0]).join("") };
    } catch (e) {
      return { ok: false, error: String(e) };
    }
  });
  console.log(JSON.stringify(out, null, 2));
} finally {
  await detach(browser);
}
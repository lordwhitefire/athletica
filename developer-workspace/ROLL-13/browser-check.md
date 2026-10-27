# Working procedure — the browser check (ROLL-13)

**What this is:** the project's established way of checking the built app **in a real browser**, written
down once so it is never re-derived. Refer to **this file**, not to the old task's plan.
**Status:** standing procedure, applies to every layer.
**Authority for rules:** the layer's model/spec, **never** the browser. This procedure checks **surfaces** only.
**Underlying method:** `~/.agents/skills/runtime-divergence/` (SKILL.md + `scripts/{browser,run,model,compare,extract,normalize}.mjs`).

---

## 1. The discipline — non-negotiable

- **Attach, never launch.** Attach to the **one persistent, visible** Chrome already listening on
  **CDP `:9222`** (`connectOverCDP("http://127.0.0.1:9222")`). If nothing is there, **stop with a clear
  message** — do **not** start one.
- **Never headless. Never a second instance. Never a swarm.**
- **Confirm the Chrome is ours before navigating** — its User-Agent must contain no `Headless`.
- **≤10 chromium guard** — count real browser processes (`google-chrome|chromium`, excluding `--type=`)
  before and after; the count must not go up. The owner's own browser (e.g. a snap chromium) is not ours and
  is never touched.
- **Detach on exit** (`finally`) — the window and its tabs stay open for the next run and for the human to
  watch and click.
- **No screenshots.** The owner checks the look by hand.
- **Interact like a user, don't just look.** Drive states through actions (click, navigate, resize). Extract
  everything at each state — no passive "looking," no shortlist.

## 2. Servers and ports

- **Build:** the rollout dev server on **`:3011`** — `BUILD_URL`. Only one server is used.
- **Port `3000` is never used** — not for dev, not for leak-check, not for any probe.
- **Runtime confirmation (required):** nothing is done until the browser loads and verifies. Before any check,
  confirm the server is up on `:3011` (`curl -s http://127.0.0.1:3011/` returns HTML). The owner starts the
  server with `next dev -p 3011` in `rollout/`; the builder does not start it autonomously.

## 3. Checklist (required before any runtime check)

Write a **checklist file** (`developer-workspace/ROLL-13/checklist.json`) listing the states/actions to drive,
so the runtime check is directed and repeatable — not random checking of everything on the page. Each state
reloads the page from scratch, applies its actions, then extracts.

Example checklist:

```json
{
  "build": "http://127.0.0.1:3011",
  "states": [
    { "name": "home-page", "url": "/" },
    { "name": "published-product", "url": "/product/TS-1001", "actions": [] },
    { "name": "missing-product", "url": "/product/does-not-exist" },
    { "name": "cta-disabled", "url": "/product/TS-1001", "actions": [{ "click": { "role": "button", "name": "Link coming soon" } }] },
    { "name": "mobile-view", "url": "/product/TS-1001", "actions": [{ "resize": [360, 800] }] }
  ]
}
```

The checklist drives **interaction**, not just observation:
- `navigate` — load a URL
- `click` — click a button/link by role and name
- `resize` — change viewport width/height

## 4. The harness

- Lives under `developer-workspace/scripts/ROLL-12/` (reusing the ROLL-12 harness patterns).
- `_lib.mjs` attaches to Chrome on CDP `:9222`, creates **one tab**, reuses it.
- **Do not use any tab that this harness did not open.** Create your own tab, reuse it, close nothing that
  the human opened.
- `node _lib.mjs` is the smoke check: attach → prove it is ours → create one tab → navigate to `:3011` → print
  the tab → confirm no Chrome was launched → detach on exit (tab stays open for the human).

## 5. Extraction (full, at each state)

For each state in the checklist, extract **everything** from the runtime:

- Page title, URL, readyState, userAgent
- Full DOM tree (all elements with tag, class, id, text, href, src, role, aria-label)
- All links, images, buttons, forms, tabs, hidden elements
- Computed styles, CSS variables, viewport size
- All scripts and CSS links loaded
- Console errors captured during the state
- Accessibility tree

This is full extraction — not selective retrieval. The checklist defines *which states to drive*, not *what to look for*.

## 6. What it produces

- Per-state artefacts under `scripts/ROLL-12/runs/<state>/` — `surface-probe.txt`, `surface-probe.json`.
- A report at `developer-workspace/reports/ROLL-13-browser-check.md` that states:
  - each state in the checklist and whether it loaded;
  - **what was verified at runtime** (404 works, no price, CTA disabled, next/image with fill+alt, disclosure visible, etc.);
  - **what was NOT checked** (interactive behaviour beyond what was driven; anything outside the layer's surface);
  - the guard result (chromium before → after) and that no Chrome was launched;
  - no screenshots taken.

## 7. Quick checklist for a run

- [ ] Automation Chrome visible and listening on `:9222`; attach-only; UA has no `Headless`.
- [ ] Build on `:3011`; port `3000` untouched; server confirmed up before checking.
- [ ] Checklist file written (`developer-workspace/ROLL-13/checklist.json`).
- [ ] `node _lib.mjs` smoke check: attach, ours, one tab created by this harness, no launch, detach.
- [ ] Drive each state in the checklist; extract everything; compare like-for-like.
- [ ] Artefacts under `scripts/ROLL-12/runs/<state>/`; report written.
- [ ] No screenshots. Detach on exit (tab stays open).

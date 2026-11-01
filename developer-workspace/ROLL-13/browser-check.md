# Working procedure — the browser check (ROLL-13)

**What this is:** the project's established way of checking the built app **in a real browser**, written
down once so it is never re-derived. Refer to **this file**, not to an old task's plan.
**Status:** standing procedure, applies to every layer.
**Authority for rules:** the layer's model/spec, **never** the browser. This procedure checks **surfaces** only.
**Underlying method:** `~/.agents/skills/runtime-parity/` (SKILL.md, `references/`, `scripts/`) — two
Runtime Maps, never two live sites; a **production build**, never a dev server; a mismatch is **FAIL** and
to be fixed, then the check runs again. **Browser procedure:** `~/.agents/skills/browser-attach/` — the one
attach-only discipline, restated nowhere else.

---

## 1. The discipline — non-negotiable

Carried in full by `~/.agents/skills/browser-attach/SKILL.md`. This project adds nothing to it, and takes
nothing away:

- **Attach, never launch.** One visible automation Chrome already listens on **CDP `:9222`**. If nothing is
  there, **stop with a clear message** — do **not** start one.
- **Never headless. Never a second instance. Never a swarm** (≤10).
- **Confirm the Chrome is ours before navigating** — UA has no `Headless`, and the process carries the
  automation profile.
- **Detach on exit** (`finally`); the window and its tabs stay open for the next run and for the human.
- **No screenshots.** The owner checks the look by hand.
- **Interact like a user, don't just look.** Drive states through actions (click, navigate, resize). Capture
  everything at each state — no passive "looking," no shortlist.

## 2. Servers and ports

- **Build:** the app's **production build** is served on **`:3011`** — `BUILD_URL`. Only one server is used.
  - `next build`, then `next start -p 3011` in `rollout/` (or the project's production server).
  - **`next dev` is never checked.** It injects its own runtime and recompiles while the source stands still;
    it is not the artifact.
- **Retired ports are not used and not named** — not for dev, not for leak-check, not for any probe.
- **Runtime confirmation (required):** nothing is done until the browser loads and verifies. Before any check,
  confirm the server answers on `:3011` (`curl -s http://127.0.0.1:3011/` returns HTML) and that what is
  serving is the built output. The owner starts the server; the builder does not start one autonomously.

## 3. The jobs

From `runtime-parity`: **gate** (`--site URL --maps runtime-maps/`) re-checks the site against its confirmed
maps; **claim** (`--claim claim.json`) checks one written expectation and waits for the owner's confirmation;
**compare** (`--ref URL --build URL`) needs two real sites. This project normally runs **gate** and **claim**.
Each ends **PASS / FAIL / NOT RUN**, NOT RUN never a pass. A FAIL is fixed and the check runs again; a PASS is
not a map until the owner confirms.

## 4. Checklist (required before any runtime check)

Write a **checklist file** (`developer-workspace/ROLL-13/checklist.json`) listing the states/actions to drive,
so the runtime check is directed and repeatable — not random checking of everything on the page. Each state
reloads the page from scratch, applies its actions, then captures.

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

## 5. The harness

- Lives under `developer-workspace/scripts/ROLL-12/` (reusing the ROLL-12 harness patterns).
- `_lib.mjs` attaches to Chrome on CDP `:9222`, creates **one tab**, reuses it.
- **Do not use any tab that this harness did not open.** Create your own tab, reuse it, close nothing that
  the human opened.
- `node _lib.mjs` is the smoke check: attach → prove it is ours → create one tab → navigate to the build →
  print the tab → confirm no Chrome was launched → detach on exit (tab stays open for the human).
- The parity CLI owns its own tab handling — call it as a tool, do not wrap its browser steps in a second
  attach.

## 6. Capture (full, at each state)

For each state in the checklist, capture **everything** from the runtime:

- Page title, URL, readyState, userAgent
- Full DOM tree (all elements with tag, class, id, text, href, src, role, aria-label)
- All links, images, buttons, forms, tabs, hidden elements
- Computed styles, CSS variables, viewport size
- All scripts and CSS links loaded
- Console errors captured during the state
- Accessibility tree

This is full capture — not selective retrieval. The checklist defines *which states to drive*, not *what to look
for*. Every state is captured **twice, 1100 ms apart**; values that move between the reads are excluded and
listed as **not checked**, and a shape change between the reads stops the capture as NOT RUN.

## 7. What it produces

- Per-state artefacts under `scripts/ROLL-12/runs/<state>/` — `surface-probe.txt`, `surface-probe.json`, and the
  check's `report.txt`.
- A report at `developer-workspace/reports/ROLL-13-browser-check.md` that states:
  - each state in the checklist and whether it loaded;
  - **what was verified at runtime** (404 works, no price, CTA disabled, next/image with fill+alt, disclosure
    visible, etc.) — with the fact named, not "it looked right";
  - **what was NOT checked** (interactive behaviour beyond what was driven; anything outside the layer's
    surface) — listed, never omitted;
  - the guard result (chromium before → after) and that no Chrome was launched;
  - no screenshots taken.
- **Working maps** under `developer-workspace/parity/<project>/runs/<id>/`; a confirmed map is promoted to the
  project's `runtime-maps/` with the confirmation date in its header.

## 8. When a surface legitimately differs

Where the current requirement **changes** a surface on purpose, the requirement is written into the model/spec
**first**, and the standard is re-captured against it. The browser never logs a difference as "expected" —
there is no intended/unintended split in the report; a difference is a defect until the spec moves.

---

## 9. Quick checklist for a run

- [ ] Automation Chrome visible and listening on `:9222`; attach-only; ours-check passed.
- [ ] Build is the **production build** on `:3011` (`next build` + `next start`), confirmed answering; no
  `next dev`.
- [ ] Checklist file written (`developer-workspace/ROLL-13/checklist.json`).
- [ ] `node _lib.mjs` smoke check: attach, ours, one tab created by this harness, no launch, detach.
- [ ] Drive each state in the checklist; capture everything, twice per state; compare like-for-like.
- [ ] Artefacts under `scripts/ROLL-12/runs/<state>/`; report written.
- [ ] No screenshots. Detach on exit (tab stays open).

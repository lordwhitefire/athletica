# Working procedure — the browser check

**What this is:** the project's established way of checking the built app **in a real browser**, written
down once so it is never re-derived. Refer to **this file**, not to the old task's plan.
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
- **No screenshots.** The owner checks the look by hand.
- **Detach on exit** (`finally`); the window and its tabs stay open for the next run and for the human.

## 2. Servers and ports

- **Build:** the app's **production build** is served on **`:3011`** — `BUILD_URL`. Only one server is used;
  there is no reference server for this task.
  - `next build`, then `next start -p 3011` in `rollout/` (or the project's production server).
  - **`next dev` is never checked.** It injects its own runtime and recompiles while the source stands still;
    it is not the artifact.
- **Runtime confirmation (required):** before any check, confirm the server answers on `:3011`
  (`curl -s http://127.0.0.1:3011/` returns HTML) and that what is serving is the built output. The owner
  starts the server; the builder does not start one autonomously.
- **Retired ports are not used and not named** — not for dev, not for leak-check, not for any probe.
- **No reference server** — one-site jobs check the build against its declared standard (a confirmed Runtime
  Map or a written expectation), not against a second live site.

## 3. The three jobs (from `runtime-parity`)

| Job | Inputs | What it does |
|---|---|---|
| **2 — gate** | `--site URL --maps runtime-maps/` | open each confirmed map's route on this site, re-capture, compare to the map |
| **3 — claim** | `--claim claim.json` | load the real page, drive the action, check a written expectation |
| **1 — compare** | `--ref URL --build URL` | two sites against each other — only when a reference genuinely exists |

This project normally runs **gate** and **claim**. Each ends **PASS**, **FAIL** or **NOT RUN**; NOT RUN is
never a pass and carries its reason. A FAIL is fixed and the check runs again. No map is written from a PASS
without the owner's confirmation.

## 4. The harness

- Lives under `developer-workspace/scripts/<task>/` (`scripts/ROLL-12/`).
- `_lib.mjs` attaches to the Chrome on CDP `:9222`, proves it is ours, and uses **one tab** that this
  harness creates in the existing window, reusing it across the whole run.
- **Do not use any tab this harness did not create.** Create your own, reuse it, close nothing the human
  opened.
- `node _lib.mjs` is the smoke check: attach → prove it is ours → create one tab → navigate to the build →
  print the tab → confirm no Chrome was launched → detach on exit (the tab stays open for the human).
- The parity CLI (`gate.mjs`, `claim.mjs`, `watch.mjs`) owns its own tab handling — call it as a tool, do not
  wrap its browser steps in a second attach.

## 5. The checklist (states)

A **state** is a condition the page is put in so a conditional surface shows up; the complete set is the
**checklist**. Ambient (as-loaded) is always included. The checklist is enumerated by reading the **build's own
source for discovery only** — every surface check is runtime-vs-standard at the same state.

- **Public surfaces:** `560 / 820 / 1100` × `dark / light` → 6 cells per screen.
- **Office surfaces:** `1440 / 820 / 560 / 390` × `dark / light` → 8 cells per screen.
- Matrices are held in `checklist.public.json` / `checklist.office.json` beside the harness.
- Every state is captured **twice, 1100 ms apart**. Values that move between the two reads are excluded and
  listed as **not checked**; a shape change between the reads stops the capture as NOT RUN.

**Capture is always the same tab at the same state** — ambient vs ambient, conditional vs conditional.
For each cell, capture the **named surface facts** at that state across the three layers (HTML / CSS / JS).

## 6. Probes

- **One probe per screen**, under `scripts/ROLL-12/`.
- **Role-first locators**; **no `waitForTimeout`**; `waitUntil: "domcontentloaded"`.
- Each cell prints the **same named surface facts** for the state.
- Where a full check is needed, use the `runtime-parity` CLI — it does the pairing and comparing; no one
  compares by eye.

## 7. What it produces

- Per-screen artefacts under `scripts/ROLL-12/runs/<screen>/` — `surface-probe.txt`, `surface-probe.json`,
  and the check's `report.txt`.
- A report at `developer-workspace/reports/ROLL-12-browser-check.md` that states:
  - the cell count and that every cell loaded;
  - **every mismatch, named**: the paired nodes, the rule, the standard's value and the build's value;
  - what was fixed and what check id fixed it;
  - the guard result (chromium before → after) and that no Chrome was launched;
  - **what was NOT checked** (look/CSS/pixels — no screenshots; interactive behaviour unless actually driven;
    anything outside the layer's surface) — listed, never omitted.
- **Working maps** under `developer-workspace/parity/<project>/runs/<id>/`. A confirmed map is promoted to the
  project's `runtime-maps/` with the confirmation date in its header. A run never promotes on its own.

## 8. When a surface legitimately differs

Where the current requirement **changes** a surface on purpose, the requirement is written into the model/spec
**first**, and the standard is re-captured against it. The browser never logs a difference as "expected" —
there is no intended/unintended split in the report; a difference is a defect until the spec moves. The
attach-only discipline, the state checklist, surfaces-only and no-screenshots rules do **not** change.

---

### Quick checklist for a run

- [ ] Automation Chrome visible and listening on `:9222`; attach-only; ours-check passed.
- [ ] Build is the **production build** on `:3011` (`next build` + `next start`), confirmed answering; no
  `next dev`.
- [ ] `node _lib.mjs` smoke check: attach, ours, **one tab created by this harness**, navigate to the build,
  **no launch** (guard unchanged), detach (tab stays open).
- [ ] Every state captured twice, 1100 ms apart; moved values listed as not checked.
- [ ] Run the right job (gate / claim) and record PASS / FAIL / NOT RUN with evidence.
- [ ] No screenshots. Detach on exit.

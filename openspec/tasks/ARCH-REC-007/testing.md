# ARCH-REC-007 — Testing task

You are testing work you did not build. The implementation task is `openspec/tasks/ARCH-REC-007/task.md` — read it first: three owner goals, benchmarks 1–7 (Round 1), 8–10 (Round 2), 11–17 (Fix Round 3), 18–21 (Fix Round 4). Run through every item below against the running app and report PASS/FAIL per item with evidence. Do not fix anything; report only.

> **Round 2 note:** T9–T12 are Round 2 tests. T10 is a hunting license.
>
> **Fix Round 3 note (2026-08-24):** T14 covers the seven fixes (member price, ASIN buy button, sidebar data loading, category page correction, Adultos deduplication, Import Center double-click safety, phantom field removal). Re-run the T1/T2 condensed sweep too since product rendering changed.
>
> **Fix Round 4 note (2026-08-24):** T15 is the final micro-round — targeted checks only (€0.00 member line, silent Brands failure, nav stale-guard wiring, Adultos container deletion). No full-suite re-run.

## Where your report goes (mandatory)

- Write your final report to **`openspec/tasks/ARCH-REC-007/testing-report.md`**. For fix-round passes, APPEND a section to that same file rather than overwriting history.
- Structure: verdict up front (**APPROVED / PARTIAL / BLOCKED**), then one section per test with PASS/FAIL and evidence (steps taken, DB rows / HTTP status observed, script names under `/home/lordwhitefire/playwright/`).
- Blockers go in a dedicated "Blockers for the Builder" section with exact reproduction steps.
- Do not rename, relocate, or omit the file — the Architect reads that exact path when confirming the task.

## Setup

- Run the frontend dev server as usual.
- Log in to the admin. Confirm the sidebar is the NEW one (`SpecSidebar` groups), not the old flat list.

## Method & evidence rules (OWNER-MANDATED — read before writing any test code)

- **Browser: the system-installed Google Chrome ONLY.** Launch Playwright with `executable_path="/usr/bin/google-chrome"` and `headless=True` (add `--no-sandbox` if needed). **NEVER run `playwright install` or anything that downloads a browser bundle.** This already happened twice (~641 MB of metered data wasted). Fix launch options — never download.
- **Installing automation tools is FORBIDDEN — no exceptions.** No Playwright or Lighthouse installs via npm/pip/global/dev-dependency anywhere. The pre-existing system Python Playwright behind `/home/lordwhitefire/playwright/` is the ONLY sanctioned toolchain.
- **Scripts live in `/home/lordwhitefire/playwright/`** — name yours `arch-rec007-t*.py`. That folder's README is canonical (Python sync API, base URL localhost:3000, credentials from `frontend/.env.local`, never hardcoded).
- **Evidence standard:** verify actual DB rows / HTTP status via Supabase REST after every meaningful UI action — screen appearance alone is not proof.
- **Independence:** reuse helpers freely; adversarial probes must be your own work, not reruns of Builder bench scripts.

## T1 — Product create is complete (benchmark 1)

Fill EVERY field with distinct values → storefront detail shows every value exactly (slug in URL, brand, category, model breadcrumb, gender/traction/color, all five price values, subtitle/tagline/intro/collection, key benefits, sizes with unavailable marked, tech details, gallery + thumbnail, ASIN-driven Buy button).

## T2 — Product edit preserves and updates (benchmark 2)

Editor opens pre-filled; size availability + intro change both appear on storefront; updated not duplicated; ASIN survives.

## T3 — Homepage is real (benchmark 3)

Real sections, no invented metrics; banner edit reflects on storefront; carousel filter/limit drives products; matched-products preview before saving.

## T4 — Navigation single builder (benchmark 4)

Sidebar Navigation lands inside new shell; renames/reorders reflect on storefront menu; no second builder UI anywhere.

## T5 — Categories never silently blank (benchmark 5)

Real tree with counts; forced failure shows error panel + Retry; orphans visible under "Unsorted".

## T6 — Old admin retired by archive (benchmark 6)

Retired routes don't resolve; archive intact; zero deletions; login/logout works.

## T7 — Regression sweep

Import Center flow completes; Media upload returns link; Models tree + protected delete blocked; Brands loads; Analytics pages don't crash.

## T8 — Hygiene

tsc passes; no leftover archived imports.

---

# ROUND 2 TESTS

## T9 — Recovery (benchmark 8): banners live in admin + storefront ("CHAOS VS CONTROL", "MANCHESTER UNITED", "F.C BARCELONA"); script re-run idempotent.

## T10 — Adversarial publishing (benchmark 9): fresh-load publish keeps data; two-tab conflict rejected (edit + add cases); empty-state needs double confirm; mid-publish failure rolls back untouched; double-click = one save; ≥3 self-invented attacks; row counts before/after everything.

## T11 — Snapshots (benchmark 10): first load exactly ONE dump; quick reload nothing; aged + concurrent loads exactly one; >7 prunes oldest only; network cut harmless to admin UX; restore drill succeeds on scratch; no auth/storage in dump.

## T12 — Sibling sweep (benchmark 9 extension): navigation save, categories ops, Import Center confirm, product bulk ops — interrupt each; report atomic/stale-guard/double-click/partial-failure per flow.

## T13 — Hygiene: env placeholder only; tsc passes; recovery touches only homepage_sections.

---

# FIX ROUND 3 TESTS (2026-08-24)

## T14 — Fix round verification (benchmarks 11–17)

**FR3-A / member price (benchmark 11):**
1. Product WITH member price set → detail page price block shows it, same prominence as cards. Products WITHOUT render cleanly (no empty gap).
2. Card vs page values match for at least two products.

**FR3-B / Buy button source (benchmark 12):**
1. A product whose slug+ASIN exist ONLY in Supabase → Buy uses saved ASIN, never "Coming Soon".
2. Product WITHOUT saved ASIN falls back gracefully (JSON entry if present).
3. Rendered href's ASIN equals `products.asin` (DB check).

**FR3-C / Sidebar navigation loads data first time (benchmark 13):**
1. Fresh login; WITHOUT hard-refreshing walk sidebar through Brands → Categories → Models → Navigation → Homepage → Products → Import Center → Settings. Every page shows real Supabase items IMMEDIATELY.
2. Repeat reverse order + after an intermediate save (rename a brand) — still immediate.
3. Narrow viewport spot-check.
4. Categories failure path still shows error panel + Retry.
5. Any empty list on first arrival → FAIL with exact click path + REST check at that moment (fetch failure vs render suppression).

**FR3-D / Category page correction (benchmark 14):**
1. NO subcategory concept reachable in UI (no add-subcategory control, no creation path).
2. Sections present: Brands, Models, Submodels, Product Models (+ existing details / SEO & Content).
3. ATTACH an existing brand + model to a test category → save → reload → persisted in correct sections.
4. CREATE brand/model/submodel/product-model from category page impossible; creating a new CATEGORY still works.
5. Detach afterwards; clean removal.

**FR3-E / Adultos deletion with backup (benchmark 15):**
1. Backup file named in implementation report EXISTS; row count matches report.
2. Storefront header: Adultos EXACTLY ONCE.
3. Single Adultos subtree editable in nav editor; quick stale-tab guard probe still fires.
4. REST count of duplicate Adultos roots = expected post-delete number.

**FR3-F / Import Center double-click safe (benchmark 16):**
1. Run an import to the confirm step; click confirm TWICE rapidly (and once try thrice). ZERO duplicate rows (REST count before vs after), no errors.
2. Busy state visibly blocks resubmission while the save runs.
3. Normal single-click import still completes end-to-end.

**FR3-G / Phantom fields gone (benchmark 17):**
1. Navigation editor contains NO Custom Links / Size Links / Bottom Links / Description inputs anywhere.
2. Rename + reorder still saves correctly and reflects on storefront menu.

**Regression spot-checks (fast but mandatory):**
- Condensed T1 create→storefront sweep (rendering changed).
- One homepage two-tab guard probe.
- One Import Center normal-flow pass (covered above).
- `npx tsc --noEmit` passes.

---

# FIX ROUND 4 TESTS (2026-08-24) — micro-round

## T15 — Final verification (benchmarks 18–21)

Targeted checks ONLY; the full suite is NOT repeated. Append results as a "Fix Round 4 Verification" section in `testing-report.md`.

**T15-a / member-line gating (benchmark 18):**
1. Set Discount % = 24 and Member Price = 0 on any test product → NO card in the storefront grid shows a "€0.00" member line (scan all cards, not just one).
2. A product WITH a real member price still shows the line on card AND detail page.
3. Revert the test product's discount afterwards; REST-check restoration.

**T15-b / loud failures (benchmark 19):**
1. Force `**/rest/v1/**` + `**/api/**` to fail (route-block or 500) before opening Brands → error panel + Retry appears, NOT "No brands found".
2. Spot-check ≥2 more admin list pages under the same block (Products, Models, Import history) — same loud-failure behavior.
3. Remove the block, click Retry → real data loads everywhere probed.
4. Genuinely-empty case unchanged: an empty list still shows its normal empty state (not an error).

**T15-c / stale-save guard wired (benchmark 20):**
1. Two tabs open `/admin/navigation`. Tab B renames an item and saves successfully.
2. Tab A (loaded BEFORE tab B's save) attempts a save → REJECTED with the visible "tree changed since you loaded" message; tab B's change survives (REST check); NO silent overwrite.
3. Reload tab A → its save now succeeds normally.
4. Single-tab rename/reorder still saves and reflects on the storefront header.

**T15-d / Adultos container deleted (benchmark 21):**
1. Report confirms backup verification happened BEFORE the delete: dated backup matched DB row-for-row at write time.
2. REST after: ZERO nodes labeled "Adultos"; total nav rows = pre-delete count minus EXACTLY 1.
3. Former root's direct children are now top-level (`parent_id` NULL) in preserved relative order (diff against backup).
4. Storefront header renders identical items/order as before removal (children were already flat) — screenshot/DOM diff against previous run acceptable evidence.
5. Nav editor shows the former children as ordinary top-level items; one rename probe still saves correctly (then revert).
6. Homepage untouched: section count + titles unchanged.

**Hygiene:** `npx tsc --noEmit` exit 0; database restored to pre-test state after every probe (row-count checks like previous rounds).

## Verdict rules

- Any FAIL on T1–T6, T14 FR3-A/B/C, or T15-a/b/c = BLOCKED; list exact steps to reproduce.
- Any FAIL on T9–T12, T14 FR3-D/E/F/G, or T15-d = BLOCKED for that scope; list reproduction steps.
- FAILs only on hygiene items unrelated to goals = PARTIAL with explicit blocker list.
- All PASS = APPROVED (REC-007 closes; ARCH-07 un-pauses; ARCH-11 becomes current).

**Tester standing order (owner, 2026-08-23): never soften a finding because a scenario seems unlikely or wasn't listed. If you can break it, report it. Exposing weaknesses is the job; the Builder owns making them impossible.**

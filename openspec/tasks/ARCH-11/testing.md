# ARCH-11 — Testing task

You are testing work you did not build. Read `openspec/tasks/ARCH-11/task.md` first, then the specs it points to. This is a COMBINED final pass: you also execute ARCH-REC-007's `§T15` checks (`openspec/tasks/ARCH-REC-007/testing.md`) in this same session — one pass, two reports.

## Where your report goes (mandatory)

- Write findings to **`openspec/tasks/ARCH-11/testing-report.md`**: verdict up front (**APPROVED / PARTIAL / BLOCKED**), then PASS/FAIL per check with evidence (steps, REST row counts / HTTP statuses observed, script names under `/home/lordwhitefire/playwright/`).
- REC-007 T15 results go in a dedicated section of THIS report; also append a one-line cross-reference to `openspec/tasks/ARCH-REC-007/testing-report.md` pointing here.
- Blockers: dedicated section with exact reproduction steps.
- Do not rename or relocate these files.

## Method & evidence rules (OWNER-MANDATED)

- **System Google Chrome ONLY** via Python Playwright from `/home/lordwhitefire/playwright/`: `executable_path="/usr/bin/google-chrome"`, `headless=True`. NEVER run `playwright install`; never download any browser bundle; never install Playwright/Lighthouse by any route. Scripts named `arch011-t*.py`.
- **Evidence standard:** verify real DB rows / HTTP status via Supabase REST after every meaningful action. Screenshots alone prove nothing.
- Keep it lean: targeted probes below only — no full-suite re-run of earlier rounds beyond what is listed.

## Part 1 checks — Excel import

**T-A1 / xlsx happy path:** Build a small workbook (~5 rows: 3 new products, 1 update of an existing product by slug, 1 intentional duplicate) → upload `.xlsx` → validation report matches expectations computed against the live catalog → confirm → REST row-counts prove exactly 3 created + 1 updated + duplicate reported; result report matches DB truth.

**T-A2 / format equivalence:** Convert the same data to CSV → both uploads produce IDENTICAL validation reports (same rows flagged, same counts).

**T-A3 / invalid rows held:** Workbook with 2 invalid rows (e.g., missing name, bad price) → errors listed before save, nothing written to DB until confirmed (REST count unchanged), then confirm with errors present behaves as designed (valid rows' fate per Builder's documented rule — report what actually happens).

**T-A4 / double-click guard:** Rapid double/triple click on confirm during an `.xlsx` import → exactly ONE import, ZERO duplicate rows (REST delta proof).

## Part 2 checks — hierarchy

**T-H1 / migrated-shape audit (SQL/REST):**
1. Zero model nodes hold 2+ direct products.
2. Every product references exactly one product model; product-model count == product count for linked products; zero products missing `model_id` unless explicitly reported as known gaps.
3. Every model chain walks up to a category anchor.
4. Product total unchanged vs pre-migration backup; list any slug that changed.

**T-H2 / auto-restructure (live):** In admin, add a second variant under an occupied product model → tree restructures (parent becomes submodel, two product-model leaves); REST confirms shape; Models page reflects immediately.

**T-H3 / delete cleanup:** Delete one probe product → its product model row disappears (REST); no empty terminal nodes linger on that branch.

**T-H4 / brandless product:** Create product without brand → save succeeds; its product model anchors to category (walk ancestors via REST); product appears in category listing.

**T-H5 / deep nesting:** Create sub-submodel chain (root → sub → sub-sub), attach product at deepest level → breadcrumb shows full chain; filter by top root model returns it; filter by intermediate submodel returns it.

**T-H6 / Models admin:** Tree renders category → brand? → root → submodels → product models with counts; rename works; deleting a referenced node is blocked with clear message; deleting an EMPTY branch succeeds.

**T-H7 / storefront:** On migrated data: breadcrumbs correct on ≥2 deep products; root-model filter and submodel filter each return expected sets; color variants show sibling products sharing parent.

**T-H8 / import respects invariant:** Via `.xlsx` AND separately via `.csv`, import a row constituting a second variant of an EXISTING model → restructure happens (never a 2-product node); REST proves it.

**T-H9 / terminology:** No user-visible "leaf model" strings anywhere in admin or storefront (grep rendered DOM of key pages).

**T-H10 / combined regression (fast):**
- Condensed product create→storefront→delete sweep (12-field spot check incl. member price + ASIN Buy).
- One homepage two-tab guard probe.
- Nav editor: single-tab rename/reorder saves; stale-save rejection fires when tab B saved after tab A loaded (this doubles as REC-007 FR4-C verification).
- Brands page under forced API failure shows error panel + Retry (doubles as FR4-B); product card with discount-but-no-member-price shows NO €0.00 line (FR4-A); header contains NO "Adultos" entry and nav DB has zero such nodes (FR4-D).

## Round 3 checks — storefront nav, cascading menu, and logo

### Categories-only top nav

**T-H11 / homepage nav shows only categories:**
1. Open the homepage (`/`) — hard refresh.
2. Read the main navigation bar items from the DOM (desktop: `MainNav` in header row 2; mobile: hamburger menu).
3. Assert: every top-level nav item is a category (Boots, Jerseys, Training Jersey, National Team Jersey, or any other real category from the `navigation` table).
4. Assert: no brand names (adidas, Nike, Puma, etc.) appear as top-level nav items.
5. Client-navigate from another page back to `/` — same result: categories only, no brands.

### Cascading flyout menu (desktop)

**T-H12 / cascading flyout — level 1 to level 2:**
1. Desktop viewport (xl+). Open homepage, hard refresh.
2. Hover on a category in the nav bar (e.g. "Boots").
3. Assert: a dropdown appears below the category showing ONLY its direct children (level 2 items — likely brands like adidas, Nike, Puma).
4. Assert: no level-3 or deeper items are visible in this dropdown.
5. Assert: items with children show a right-arrow indicator (▸ or `›` or chevron).

**T-H13 / cascading flyout — level 2 to level 3:**
1. Continuing from T-H12: hover on a level-2 item that has children (e.g. "adidas" under Boots).
2. Assert: a flyout appears to the RIGHT of that item, vertically aligned to its top.
3. Assert: the flyout shows ONLY that item's direct children (level 3 — e.g. Predator, Copa, X under adidas).
4. Assert: the original level-2 dropdown stays open (both visible simultaneously).
5. Assert: no level-4+ items visible.

**T-H14 / cascading flyout — deeper levels + terminal:**
1. Hover on a level-3 item that has children → level-4 flyout appears to its right, showing only direct children.
2. Hover on a level-4 item that has children → level-5 flyout appears, showing product models (terminal links).
3. Hover on a terminal item (no children) → no flyout opens; item renders as a plain link.
4. Click a terminal link → navigates to the product page; menu closes.

**T-H15 / cascading flyout — path switching:**
1. Open a full cascade path (category → brand → model → submodel).
2. Hover a DIFFERENT brand in the level-2 dropdown.
3. Assert: all previous descendant flyouts (level 3, 4, 5 from the old brand) close immediately.
4. Assert: a new flyout opens for the newly hovered brand.
5. Move the cursor off the entire menu (outside nav bar + all flyouts) with a 150ms grace → all flyouts close.

**T-H16 / old mega-panel removed:**
1. Hover on any category → assert the old full-width mega-panel (`buildColumns` layout with columns spanning the full viewport width) does NOT appear.
2. Code-level check: `MegaMenu.tsx` is not imported in `MainNav.tsx` or `Header.tsx` (it should be archived or removed from the storefront import graph).

### Mobile accordion menu

**T-H17 / mobile accordion:**
1. Mobile viewport (< xl). Open hamburger menu.
2. Tap a category → it expands to show level-2 items (accordion-style, inline).
3. Tap a level-2 item → it expands to show level-3 items inline.
4. Only one expanded branch at a time — tapping a different category collapses the previous.
5. Tap a terminal link → navigates and closes the menu.

### Logo

**T-H18 / site logo renders:**
1. With a known-good logo saved in admin settings → hard-refresh homepage.
2. Assert: the `<img>` or `<Image>` element with `alt="Athletica"` renders and its `src` is a valid, loadable URL (HTTP 200 on the image URL).
3. Assert: the same logo appears in both the mobile header row and the desktop header row.
4. Remove the logo from admin settings → hard-refresh → assert: the fallback text mark ("A" + "athletica") displays instead (no broken image).
5. Save the logo back → hard-refresh → logo renders again.

## Hygiene

- Pre-migration dated backup file exists; row counts match what the report claims.
- Generated TypeScript types committed post-migration; `npx tsc --noEmit` exits 0.
- Database returned to pre-test state after destructive probes (row counts verified).

## Verdict rules

- Any FAIL on T-A1–A4 or T-H1/H2/H8 = **BLOCKED** (data integrity scope).
- Any FAIL on T-H3–H7, H9, H10 = **BLOCKED** scope-limited; exact repro steps required.
- Any FAIL on T-H11–H18 = **BLOCKED** (storefront visibility — customer-facing).
- Hygiene-only failures = PARTIAL with explicit blocker list.
- ALL PASS (+ REC-007 §T15 all pass) = APPROVED — closes BOTH tasks: ARCH-REC-007 ✅ and ARCH-11 ✅.

**Tester standing order (owner): never soften a finding because a scenario seems unlikely or wasn't listed. If you can break it, report it.**

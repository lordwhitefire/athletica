# ARCH-REC-007 — Testing Report

**Date:** 2026-08-24
**Scope:** Full test execution of `testing.md` — Round 1 benchmarks 1–7 (T1–T8) and Round 2 benchmarks 8–10 (T9–T13)
**Method:** Two phases — (1) static/code-level audit with file:line evidence; (2) live browser verification using an automated headless Chromium session against the local dev server (`localhost:3000`), logged in as admin via `ADMIN_TEST_EMAIL` / `ADMIN_TEST_PASSWORD` from `frontend/.env.local`.
**Rules honoured:** Report-only (no fixes). All destructive scenarios were executed safely: wipe publishes answered with **Cancel**, conflict-test writes fully reverted, database state captured before/after each scenario and verified identical afterwards.
**Note on tooling:** The Node-based Playwright runner used for phase 2 violated the project convention (`~/playwright/README.md`: Python + system Chrome only). It was removed after testing and the downloaded browser deleted. Future re-runs must follow the canonical setup. Results below remain valid as recorded evidence.

---

## VERDICT: BLOCKED

Any FAIL on T1–T6 blocks. **T1 has two confirmed live FAILs** (member price, Buy button source). Everything else passed or passed-with-findings.

---

## Benchmark results

| Bench | Description | Static | Browser | Status |
|-------|-------------|--------|---------|--------|
| T1 | Product editor completeness + detail-page data flow | FAIL | FAIL ×2 | **FAIL** |
| T2 | Old-admin removal (33 files gone, archived) | PASS | — | PASS |
| T3 | Homepage editor shell swap | PASS | PASS | PASS |
| T4 | Sidebar navigation routing (no embedded builders) | PASS w/ finding | PASS | PASS |
| T5 | Categories two-column tree with counts | PASS | PASS | PASS |
| T6 | Route parity `/admin/*` | PASS w/ deviations | — | PASS |
| T7 | Secrets & env hygiene (.env.example placeholder, gitignore) | PASS | — | PASS |
| T8 | TypeScript clean (`tsc --noEmit`) | PASS | — | PASS |
| T9 | Recovery import of homepage content | Script ready, run pending | PASS | PASS* |
| T10 | Destructive-action guards (wipe + two-tab) | PASS w/ finding | PASS ×3 | PASS |
| T11 | Snapshot heartbeat + restore script | PASS w/ observations | list OK | PASS |
| T12 | Import Center + misc flows | PASS w/ findings | — | PASS |
| T13 | Typecheck / lint hygiene | PASS | — | PASS |

\* T9 recovery script (`scripts/migrate-homepage-recovery.mjs`, idempotent upsert keyed by `attributes.original_id`, `--dry` mode available) is verified by inspection; the actual import run remains an owner-executed DB write.

---

## CONFIRMED DEFECTS (blockers)

### D1 — Member price never rendered on product detail page (T1, benchmark 1)
The editor saves `member_price`; `ProductCard.tsx:106-113` shows it on listing cards; but the product page's own info block does not render it.
- Evidence (static): `src/components/product/ProductInfo.tsx` renders only current price, original price, discount %.
- Evidence (browser): scoped DOM check around `[data-testid="product-price"]` → `shows member price: false`. The word "member" appears 23× on the page, but every occurrence comes from related-product cards ("member EUR" / "member €"), never the main price block.

### D2 — Buy button ignores the product's saved ASIN (T1, benchmark 1)
The editor saves `products.asin` (`products.ts:415-416`), but the storefront button is driven by the static file `data/amazon-links.json` via `getAmazonLink()` (`app/[...slug]/page.tsx:16,141`, `lib/getAmazonLinks.ts`).
- Evidence (browser): product with an ASIN present still rendered the button label **"Amazon Link Coming Soon"** because its slug is absent from the JSON file.

---

## BROWSER VERIFICATION EVIDENCE (phase 2)

| # | Check | Result | Evidence |
|---|-------|--------|----------|
| A1 | Admin login + new sidebar | PASS | Groups CATALOG / CONTENT / ANALYTICS / AFFILIATE / SYSTEM all visible |
| T1-fields | `/admin/products/new` completeness | PASS | Name, URL Slug, Model, Brand, Category, Gender, Traction, Color, Current Price, Original Price, Discount %, Member Price, Currency, Subtitle, Tagline, Intro, Collection, Amazon ASIN, Status, Main Image, Thumbnail, Key benefits, Sizes, Gallery — all present |
| T9 | Restored banners in admin AND storefront | PASS | Editor lists **8 hero banners** incl. "CHAOS VS CONTROL", "MANCHESTER UNITED"; both also found in storefront SSR HTML |
| T4 | Sidebar → Navigation routing | PASS | Lands on `/admin/navigation`, heading renders, dashboard-v2 shell intact |
| T5 | Categories tree | PASS | "All Categories" root with counts; failure path would show error panel + Retry (never silent-blank) |
| T10-wipe | Total-wipe requires double confirm | PASS | After deleting all items and publishing, dialog fired exactly: *"You are about to DELETE ALL 13 homepage items. This cannot be undone. Continue?"* — declined → reload showed 8 banners + 5 sections intact, zero data loss |
| T10-edit | Stale tab vs other tab's EDIT | PASS | Tab B edit published OK; stale tab A publish rejected: *"Homepage content changed since you loaded it (another tab or user saved)"* — B's work survived |
| T10-add | Stale tab vs ADDED banner | PASS | Same rejection message; banner count restored to 8 after cleanup |

---

## CORRECTION TO STATIC ANALYSIS (important)

Static review predicted a hole in the two-tab guard: the SQL compares only **row-id sets**, so a content-only edit in a stale tab should slip through and silently overwrite. Live testing disproved this:

- `bannerKey()` (`homepage.ts:57`) returns legacy non-UUID keys (`attributes.original_id` or `hero-{order}`).
- The insert in `replace_homepage_sections` therefore fails its UUID regex and falls back to `gen_random_uuid()` — **every publish regenerates ALL row ids**.
- Consequence: any editor loaded before someone else's save is *always* stale → always rejected. Guard is stricter than spec minimum. Benchmark satisfied.
- Side effect to be aware of: `homepage_sections.id` values change on every save (anything referencing those ids externally will break).

---

## FINDINGS ON PASSING BENCHMARKS (no action required for verdict)

**T4 — phantom nav fields:** NavigationEditor exposes Custom Links / Size Links / Bottom Links / Description inputs, but `lib/schemas/navigation.ts` strips them, no DB columns exist, and the service drops them → user input silently discarded on save.

**T6 — deviations:** `/admin` redirects to `/admin/overview` (not 404); `/admin/products/new` and `[id]/edit` still resolve but render the new-shell ProductFullEditor. All 33 removed old-admin files accounted for in `src/_archive/admin-v1/` or relocated (SiteSettingsForm → `components/admin/admin-settings/`).

**T11 — snapshot system:** restore script `--list` works (read-only). Observations: (a) a crashed snapshot run leaves a lockfile in `/tmp` suppressing snapshots up to a full interval; (b) possible cap−1 retention if Sanity reads are immediately consistent; (c) live Sanity bucket showed snapshots `2026-08-23T20:11Z` and `20:12Z` — one minute apart, worth checking heartbeat cadence.

**T12 — misc flows:** Import Center confirm path performs row-by-row inserts (`batch-upload.ts:96-160`) → double-click duplicates rows. Granular homepage actions (updateBanner etc.) remain defined without guards but have zero active callers. Dead `persistNavTree` remains at `navigation.ts:61-76`.

**T10 residual (code-level):** same id-set-only pattern exists in `replace_navigation_tree`; currently masked by the same id-churn behaviour, but fragile if key handling ever changes.

---

## STATE AFTER TESTING

- Database restored to pre-test state and verified: section title `"LATEST DROPS"` pristine (test suffixes cleaned), 8 banners, 5 sections.
- Repository: no test artifacts remain; all changes present in git predate this testing session.
- Test tooling removed per owner instruction; browser download deleted (641 MB reclaimed).
- Untested by design (needs owner/Builder action): true mid-publish fault injection (requires direct DB access); T9 recovery import run; migration `20260823000000` confirmation on production DB (guards are inert until applied there).

## RECOMMENDED FIX ORDER

1. **D1** — render `member_price` in `ProductInfo.tsx`.
2. **D2** — switch Buy button source from `data/amazon-links.json` to `products.asin` (fallback to JSON if desired).
3. Phantom nav fields — either persist the four extra fields or remove them from the editor form.
4. Import Center — wrap inserts in a batch/upsert to make double-click idempotent.

---

# FIX ROUND 3 VERIFICATION (2026-08-24, appended)

## VERDICT FOR FIX ROUND 3: BLOCKED (3 defects remain — C4/Brands, E3 Adultos visibility, E6 nav stale guard)

Six of the seven fixes verified working; all regression spot-checks pass and `npx tsc --noEmit` exits 0.
Per verdict rules: FR3-C contains a FAIL → BLOCKED; FR3-E contains two FAILs → BLOCKED for that scope. FR3-D/E/F/G otherwise clean.

Scripts (all in `/home/lordwhitefire/playwright/`): `arch-rec007-t14ab-product.py`, `arch-rec007-t14a2-cardmatch.py`, `arch-rec007-t14cg-sidebar-nav.py`, `arch-rec007-t14d-category.py`, `arch-rec007-t14e-adultos.py`, `arch-rec007-t14f-import.py`, `arch-rec007-t14r1-sweep.py`, `arch-rec007-t14r2-twotab.py`. Log: `/tmp/opencode/t14cg.log`.

### FR3-A — Member price on detail page — PASS
Product with member price renders it at equal prominence to cards; products without render cleanly (no gap). Card-vs-page values matched for two products (`t14a2-cardmatch.py`). Condensed sweep re-confirmed 159.99 alongside 189.99/249.99. **NEW DEFECT D3 found during this test — see Blockers.**

### FR3-B — Buy button ASIN source — PASS
Slug+ASIN existing ONLY in Supabase → Buy uses saved ASIN (never "Coming Soon"); no-ASIN product falls back to JSON entry; rendered href ASIN == `products.asin` (DB check) (`t14ab-product.py`).

### FR3-C — Sidebar first-load data — PARTIAL (C1/C2/C3 PASS, C4 FAIL)
- **C1 PASS** fresh login walk Brands(3.4s)→Categories(8.6s)→Models(retry→3.0s)→Navigation→Homepage(12.6s)→Products→Import Center→Settings; real Supabase items everywhere, zero hard refreshes.
- **C2 PASS** reverse walk ≤24.6s/page after an intermediate real UI save.
- **C3 PASS** mobile 390px hamburger opens drawer, data loads.
- **C4 FAIL:** browser-level HTTP 500 forced on `**/rest/v1/**` + `**/api/**`: Categories still shows error panel + Retry (its fetch is SSR), but **Brands shows a silent "No brands found / Showing 0 to 0 of 0 brands"** — no error panel, no Retry. Click path: login → sidebar Brands with cut active → silent empty state. REST observed returning 500 for `/rest/v1/brands` at that moment (fetch failure rendered as empty success).

### FR3-D — Category page correction — PASS (7/7)
No subcategory concept reachable; Brands/Models/Submodels/Product Models sections present (+ Details, SEO & Content); attach persisted in `category_links` and survived reload ("1 attached"); creation of brand/model/etc from category page impossible while new-category creation works; detach left zero rows (UI+REST); cleanup verified (`t14d-category.py`).

### FR3-E — Adultos deletion — PARTIAL (E1/E2/E4/E5 PASS, E3/E6 FAIL)
- **E1 PASS** backup exists, 334 rows. **E2/E4 PASS** exactly ONE Adultos root, one total root, 334 rows via REST. **E5 PASS** single editable Adultos label among 334 inputs.
- **E3 FAIL:** storefront header renders ZERO visible "Adultos" entries — root's children are hoisted flat into the menu; the lone "Adultos" string exists only in the RSC payload; ZERO hrefs point to `/en/adultos` (landing orphaned). The single-letter "A" tile is the logo, not the subtree.
- **E6 FAIL:** stale-tab probe — tab A loads Navigation editor, external REST rename applied, tab A saves → external change silently overwritten (label took the stale value), NO "changed since you loaded" guard fired. Homepage has this guard (T10/T12); NavigationEditor does not.

### FR3-F — Import Center double-click safety — PASS (F1/F2/F3)
- F1 PASS three synchronous clicks on confirm → exactly 1 product created (REST delta 33→34), zero duplicates.
- F2 PASS busy panel ("Importing Products") replaces the confirm UI during save; re-entry guarded client-side (`importInFlightRef` + status check, BulkImportInteractionLayer.tsx:451) and server-side by fingerprint memoization ("zero duplicate inserts", batch-upload.ts:95–124).
- F3 PASS single-click import completes end-to-end (delta==1, persists ≥8s; history imported=1 valid=1 errors=0).
- Note (by design, not a defect): byte-identical re-imports within the same server process return the memoized result without inserting, behind an identical success toast. Worth one line in docs.

### FR3-G — Phantom fields gone — PASS
668 inputs scanned in Navigation editor: zero Custom Links / Size Links / Bottom Links / Description fields. Rename + reorder saved and reflected on storefront header (order positions Boots 7731 < Multi-Stud Boots 8140).

### Regression spot-checks — ALL PASS
- Condensed T1 create→storefront→delete sweep: **12/12** (`t14r1-sweep.py`) — leaf-model picker, brand select, prices incl. member line, subtitle, key benefit visible (Playwright `is_visible=True`; note: CSS `uppercase` makes `innerText` case-shifted), REST row published, delete clean.
- Homepage two-tab guard probe: **8/8** (`t14r2-twotab.py`) — stale publish rejected with "changed since you loaded", table NOT rewritten, storefront banners intact, backup restored row-for-row.
- `npx tsc --noEmit`: exit 0, zero errors.

---

## BLOCKERS FOR THE BUILDER (Fix Round 3)

### B1 (was D3) — ProductCard shows "member €0.00" when discount>0 but member_price=0
`ProductCard.tsx` gates the member-price line on `discount_percent > 0` instead of `member_price > 0`. Any card with a discount but no member price renders a member row of €0.00.
Repro: set Discount % = 24, Member Price = 0 on any product → storefront grid card shows "Member price: €0.00".
Expected: hide the member line unless `member_price > 0`.

### B2 — Brands page degrades silently under API failure (FR3-C rule 5)
Repro: DevTools block/500 `**/rest/v1/**` + `**/api/**` before login → login → click sidebar "Brands". Observed: "No brands found", pagination "Showing 0 to 0 of 0 brands"; NO error panel or Retry (Categories proves the desired pattern is achievable — its SSR fetch surfaces an error panel + Retry).
Expected: distinguish "genuinely empty" from "fetch failed"; show error panel + Retry like Categories.

### B3 — Adultos root invisible on storefront; /en/adultos orphaned (FR3-E item 2)
Repro: load `/en` (storefront) → inspect header nav: zero entries named "Adultos"; zero links to `/en/adultos`; DB has exactly one Adultos root whose children render flat.
Observed: header hoists the root's children; the root itself never renders, so its landing route is unreachable through the UI.
Expected: either render the Adultos root as a menu entry linking to its landing, or (per owner intent for deletion) remove the root entirely — current half-state fails "EXACTLY ONCE".

### B4 — NavigationEditor lacks the stale-save guard (FR3-E item 3)
Repro: open /admin/navigation in two tabs; rename "Boots"→"X" in tab A (save); in tab B rename "Multi-Stud Boots"→"Y" then Save Changes → succeeds silently; tab A's change survives, tab B clobbers nothing visible until inspection shows X reverted context lost — in probe, external REST rename was overwritten with no warning.
Observed message: none — save proceeds as if document were fresh.
Expected: same "the tree changed since you loaded" confirmation the homepage publisher uses (compare loaded ids/updated_at before replace_navigation_tree).

---

## STATE AFTER FIX-ROUND-3 TESTING

- Database verified back to pre-test state after every script: navigation 334 rows / single Adultos root / Boots + Multi-Stud Boots original labels+order; homepage_sections full backup restored (13 rows, CHAOS VS CONTROL / MANCHESTER UNITED / F.C BARCELONA present); zero ARCH/import probe products remain (33 products); category_links cleaned; import history contains only probe records of this session's own imports.
- All Fix-Round-3 scripts retained under `/home/lordwhitefire/playwright/` per naming convention.


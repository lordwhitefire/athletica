# ARCH-REC-007 — New-admin reconciliation (dashboard-v2 becomes the only admin)

Owner decision (2026-08-22): the **new dashboard** (`dashboard-v2` / `SpecSidebar`, 15 items) is THE admin. The old admin (`AdminShell` chrome + its exclusive routes) is retired — **archived by moving files, never deleting** — and only after each old page's capabilities are confirmed present in the new dashboard. Affiliate work (ARCH-07) is paused until this reconciliation is done.

> **ROUND 2 added 2026-08-23**: recover wiped homepage content, make every admin action safe to click, audit destructive code paths, add automatic backups.
>
> **FIX ROUND 3 added 2026-08-24**: fixes the two tester blockers (D1 member price, D2 ASIN buy button), the sidebar data-loading defect, executes the category-page correction + Adultos deduplication, hardens Import Center double-click, and removes phantom nav fields — all per owner rulings of 2026-08-24.
>
> **FIX ROUND 4 added 2026-08-24** (final micro-round): four narrow defects found by the tester's fix-round verification — €0.00 member lines (FR4-A), silent Brands failure (FR4-B), unwired nav stale guard (FR4-C), and complete removal of the leftover "Adultos" navigation container per owner ruling of 2026-08-24 (FR4-D).

## Standing tooling rule (owner, 2026-08-23 — binds EVERY agent: Builder, tester, any session)

**On no account may any agent install Playwright or Lighthouse** — not via npm (`playwright`, `@playwright/test`, `lighthouse`, related packages), not via pip, not globally, not as a dev dependency, neither in this repo nor in any sub-project. **No browser bundles either:** `playwright install` (downloads Chromium/Firefox/WebKit into `~/.cache/ms-playwright`) is forbidden and already wasted ~641 MB of metered data on 2026-08-23. UI automation uses ONLY the pre-existing system Python Playwright from `/home/lordwhitefire/playwright/` driving the system-installed Google Chrome (`executable_path="/usr/bin/google-chrome"`, headless). If something appears "missing", fix launch options or ask the owner — never install, never download.

## The three owner goals

1. **Products**: upload and edit products successfully from the new dashboard — with **every** product detail filled in the form actually appearing on the storefront product page afterwards.
2. **Homepage**: banners and carousels manageable from the new dashboard, with products really appearing in them.
3. **Navigation**: organize the navigation menu from the new dashboard.

## Verified findings (why this reconciliation exists)

All checked in code on 2026-08-22:

- **F1 — New product editor is a 9-field quick dialog.** `components/admin/product-catalog/ProductCatalogInteractionLayer.tsx` (~lines 194–339): name, SKU, free-text model, flat image list, single price, brand, category, ASIN, status. Missing entirely: url slug, gender, traction, color, currency/original/discount/member price, subtitle/tagline/intro/collection, key benefits, sizes with availability, technical details, main-vs-thumbnail image roles.
- **F2 — The full editor only exists in the OLD world.** `components/admin/ProductForm.tsx`: all fields but Sanity-coupled and old-chrome; cannot be reused as-is.
- **F3 — The new Homepage page is a mock.** Ran on seed data + localStorage while the real editor lived behind old chrome. (RESOLVED Round 1.)
- **F4 — Categories page fails silently.** Errors swallowed at three layers = permanent blank workspace with zero feedback. (RESOLVED Round 1.)
- **F5 — Navigation is split/duplicated.** Three fragments, one job. (RESOLVED Round 1; end-state folder explorer comes after ARCH-11 as a separate task.)
- **F6 — Old-exclusive routes** pending retirement. (RESOLVED 2026-08-23, architect-verified archive.)
- **F7 (Round 2 incident) — Homepage content wiped from Supabase.** Delete-before-insert without transaction in `saveHomepage`. RESOLVED Round 2: recovery import + guard migration `20260823000000` applied to production by owner 2026-08-24.

## Work pieces (Rounds 1–2 — all delivered, kept for record)

### WP1 — Product completeness inside the new dashboard ✅
One flow covering every storefront-visible field: identity (name/SKU/slug), classification (model picker bound to models table, category, brand), attributes (gender/traction/color), pricing (current/original/discount/member/currency), description (subtitle/tagline/intro/collection/key benefits), commerce (sizes+availability, ASIN, status), images (main/thumbnail/gallery roles). Live routes `/admin/products/new` + `[id]/edit` serve new-shell `ProductFullEditor`.

### WP2 — Real homepage management in the new shell ✅
Real reads/writes against `homepage_sections`; matched-products preview before saving; fake metrics removed.

### WP3 — One navigation builder ✅
SpecSidebar route push fixed; `/admin/navigation` re-shelled in dashboard-v2; duplicate embedded form removed from categories page. **Future:** folder/file-style explorer replaces this layout AFTER ARCH-11 (owner design 2026-08-24) — separate task, not REC-007 scope.

### WP4 — Categories empty-page fix ✅
Visible error panel + Retry instead of blank; orphan handling; REC-005 behaviors confirmed.

### WP5 — Old-admin retirement ✅ (architect-verified 2026-08-23)
All old-exclusive routes archived to `src/_archive/admin-v1/`; AdminShell replaced by minimal `AdminGuard`; zero deletions.

### WP-R2-A — Homepage recovery ✅ — 13 rows restored from `frontend/data/homepage.json`, idempotent.
### WP-R2-B — Destructive-action safety ✅ — transactional guards (`replace_homepage_sections`, `replace_navigation_tree`): atomic, wipe-guarded w/ double-confirm, stale-editor guarded, double-click safe. Same-pattern audit in report. Owner applied migration to production 2026-08-24. Known quirk (documented, not a blocker): every publish regenerates `homepage_sections.id`s (legacy non-UUID keys → uuid fallback); same pattern in nav RPC. **Note (fix-round testing):** the nav RPC's stale-editor rejection exists server-side but NavigationEditor does not send load-time state — wiring gap closed in FR4-C.
### WP-R2-C — Rolling snapshots to Sanity ✅ — non-blocking heartbeat, single-flight, pg_dump public-only, 7-file cap, scripted restore drill passed (9/9 tables row-identical).

---

# FIX ROUND 3 (2026-08-24) — VERIFIED BY TESTER (A/B/D/F/G PASS incl. regressions + tsc; C and E partially pass, defects folded into Fix Round 4)

Triggered by the independent tester report (verdict BLOCKED) + owner reports/rulings from live use. Scope was exactly items FR3-A…FR3-G.

## FR3-A — Member price must render on the product page (tester blocker D1) ✅
`ProductInfo.tsx` renders only current price, original price, discount %. Add member price display wherever original/discount pricing is shown (same treatment cards already give it, `ProductCard.tsx:106-113`). Detail page shows member price for any product that has one.

## FR3-B — Buy button must read the product's saved ASIN (tester blocker D2) ✅
Storefront Buy button currently driven by static `data/amazon-links.json` via `getAmazonLink()`. Source of truth becomes the product's own `products.asin` column. JSON file remains purely as fallback when no ASIN is saved — DB wins whenever an ASIN exists. A product with a saved ASIN must NEVER render "Amazon Link Coming Soon".

## FR3-C — Sidebar navigation must load Supabase data (owner-reported defect) ✅ (C1–C3 pass; residual failure-state defect → FR4-B)
Symptom: clicking through the sidebar renders the page shell fine, but Supabase-sourced lists stay EMPTY until a hard browser refresh. Fixed at root (not `router.refresh()` bandaids): fresh-login walks forward/reverse, post-save navigation, and mobile drawer all show real data immediately.

## FR3-D — Category page correction (owner ruling 2026-08-24) ✅ 7/7
The world has NO subcategories. Category → Brand → Model → Submodel → Product Model. No create-subcategory controls anywhere; sections Brands / Models / Submodels / Product Models (+ Details, SEO & Content); ATTACH-only for existing nodes via `category_links`; creation impossible except new categories; attachments persist across reload; detach cleans up fully.

## FR3-E — Delete stray duplicate "Adultos" navigation tree(s) (OWNER GO 2026-08-24) ✅ (E1/E2/E4/E5 pass; residual container defect → FR4-D)
Backup-first procedure followed: dated backup file with all rows (334), duplicates deleted keeping exactly ONE canonical Adultos subtree. Residual discovered by tester: the header hoists the root's children, so the container itself is invisible dead weight — full removal ordered in FR4-D after owner confirmed there is NO adults/kids concept in the business at all.

## FR3-F — Import Center confirm must be double-click safe (OWNER RULING: FIX) ✅
Busy state blocks resubmission client-side AND batched insert keyed on validated import fingerprint server-side. Triple rapid click produces exactly one import, zero duplicates. Documented-by-design note: byte-identical re-imports within one server process return the memoized result behind an identical success toast.

## FR3-G — Remove phantom navigation fields (OWNER RULING: REMOVE FOR NOW) ✅
Custom Links / Size Links / Bottom Links / Description inputs removed from NavigationEditor; nothing was ever persisted so no schema changes were needed; rename/reorder still saves correctly.

---

# FIX ROUND 4 (final micro-round, added 2026-08-24) — CURRENT WORK

Four narrow defects from the tester's fix-round verification (`testing-report.md` → blockers B1–B4), plus the owner's FR4-D ruling delivered same day. Nothing else changes; targeted re-tests only (`testing.md` §T15).

## FR4-A — Member-price line gating on product cards (tester blocker B1)
`ProductCard.tsx` gates the member-price row on `discount_percent > 0` instead of `member_price > 0`, so any card with a discount but no member price renders "Member price: €0.00". Change the condition: render the member line ONLY when `member_price > 0`. Discount display itself stays as-is.

## FR4-B — Admin list pages fail loudly, never silently (tester blocker B2)
With API requests failing, Brands shows "No brands found / Showing 0 to 0 of 0 brands" — indistinguishable from a genuinely empty catalog. Apply the Categories pattern (visible error panel + Retry) to Brands, then sweep the other admin list pages (Products, Models, Import history, Settings reads, etc.) for the same silent-failure shape: every fetch failure must render an error state with Retry; truly-empty data keeps its normal empty state. This closes FR3-C rule 5 properly.

## FR4-C — Wire the stale-save guard into NavigationEditor (tester blocker B4)
The `replace_navigation_tree` RPC already rejects out-of-date saves server-side, but NavigationEditor never sends WHAT WAS LOADED — a tab opened before someone else's save overwrites silently. Capture the tree's identity/version AT LOAD TIME (row ids or updated_at — same approach the homepage editor uses) and send it with every save; on mismatch the server rejects with a homepage-style message ("the tree changed since you loaded…") and the user reloads before saving.

## FR4-D — Delete the leftover "Adultos" navigation container (OWNER RULING 2026-08-24: REMOVE COMPLETELY)

Established by investigation (architect, 2026-08-24): "Adultos" is **NOT a category** — the real categories are Boots / Jerseys / Training Jersey / National Team Jersey. It is ONE leftover navigation root inherited from the old site's adult/kids menu split; its children are the real top-level menu items, which the header ALREADY renders flat. Nothing else in the system splits by adults/kids (products carry only a gender attribute). The business has no children/adult distinction — the container is pure legacy weight.

Procedure (backup-first, minimal blast radius):
1. Verify the existing dated backup (`frontend/data/navigation-adultos-backup-20260824.json`, 334 rows) matches the current DB row-for-row BEFORE any write. If anything drifted since FR3-E, take a fresh backup first and report the path.
2. Re-parent the Adultos root's DIRECT CHILDREN to top level (`parent_id = NULL`), preserving their relative order.
3. Delete ONLY the single Adultos root row.
4. Acceptance: ZERO nodes labeled "Adultos" anywhere in the DB (REST check); total nav rows reduced by exactly 1 vs pre-delete count; storefront header unchanged (children were already rendered flat); navigation editor shows the former children as ordinary top-level items; homepage sections untouched.
5. No product/category/brand/model data is touched. The static seed/backup JSONs under `frontend/` stay as historical artifacts (archive-never-delete).

## Constraints (Fix Round 4)
- Standing tooling rule applies to everyone, no exceptions.
- `npx tsc --noEmit` passes after all fixes.
- Nothing destructive outside FR4-D's scoped single-row deletion (with verified backup).
- Implementation report: APPEND a "Fix Round 4" section to `openspec/tasks/ARCH-REC-007/implementation-report-round2.md`.

## Benchmarks (consolidated)

1. Create product filling every field → storefront detail shows every value exactly incl. member price and ASIN-driven Buy button.
2. Edit existing product → updated not duplicated; ASIN preserved.
3. Homepage real sections; edits reflect; carousel filters drive products; preview before saving.
4. Navigation lands in new shell via sidebar; one builder; renames reflect on storefront.
5. Categories show real tree; forced failure shows error panel + Retry; orphans visible.
6. Retired routes gone; archive intact; zero deletions; auth works.
7. tsc passes.
8. Recovery content live in admin + storefront.
9. Adversarial publishing passes.
10. Snapshot system behaves per spec incl. restore drill.
11. **(FR3-A)** Member price visible on detail page matching card display; absent-member-price renders cleanly.
12. **(FR3-B)** Saved ASIN drives Buy link even without JSON entry; no-ASIN falls back gracefully.
13. **(FR3-C)** First-time sidebar navigation to every data-bearing page shows real items immediately — no hard refresh, desktop + narrow viewport.
14. **(FR3-D)** No subcategory concept; four attach-sections present; attach persists across reload; creation impossible except new categories.
15. **(FR3-E)** One Adultos subtree; dated backup file exists with pre-delete rows; guards still hold.
16. **(FR3-F)** Rapid double-click (and triple-click) on Import Center confirm produces ZERO duplicate rows and no errors; busy state visibly blocks resubmission.
17. **(FR3-G)** The four phantom inputs no longer exist anywhere in the navigation editor UI; renaming/reordering still saves correctly.
18. **(FR4-A)** Discount-without-member-price products show NO €0.00 member line on cards; real member prices still show on cards AND detail page.
19. **(FR4-B)** Forced API failures produce error panel + Retry on Brands and swept list pages; genuine empties keep normal empty states; Retry recovers real data.
20. **(FR4-C)** Two-tab nav probe: stale save rejected with visible message, external change survives, save succeeds after reload; single-tab rename/reorder unaffected.
21. **(FR4-D)** Zero "Adultos" nodes in the DB; nav rows −1 vs verified pre-delete count; former root's children promoted to top level in order; header unchanged; backup verified before deletion.

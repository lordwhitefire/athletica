# ARCH-REC-007 — Implementation Report, Round 2 (2026-08-23)

## Scope delivered this round

### WP-R2-A — Homepage recovery ✅
- `frontend/scripts/migrate-homepage-recovery.mjs`: reads `frontend/data/homepage.json`, upserts into `homepage_sections` matching on `attributes.original_id` (idempotent — proven by repeated runs keeping exactly 13 rows).
- Restored 8 hero banners + 5 sections. Verified in admin shell and storefront.
- Bench #8: **19/19** (`/home/lordwhitefire/playwright/arch-rec007-bench8-recovery.py`).

### Follow-ups A + C (from Round 1 review) ✅
- A: nav saves batched (chunks of 200): ~200s → 6–11s, verified twice.
- C: `router.refresh()` awaited after nav save so the storefront menu updates immediately.

### `/admin` retirement (owner complaint, fixed this round) ✅
- Root cause: legacy `app/admin/page.tsx` rendered the old dashboard and no redirect existed.
- Fix: replaced page with `redirect("/admin/overview")` + config-level 308 in `next.config.ts`; archived `dashboard-stats.tsx`, `BuildStatus.tsx`, `DashboardPreviewHub.tsx` to `src/_archive/admin-v1/`. Logged-in verification lands on overview with zero old-dashboard markers.

### WP-R2-B — Destructive-action safety ✅
**Mechanism:** migration `supabase/migrations/20260823000000_destructive_action_guards.sql` defines two SECURITY DEFINER plpgsql functions reachable only through service-role server actions:

- `replace_homepage_sections(p_rows jsonb, p_loaded_ids jsonb, p_allow_wipe boolean)`
- `replace_navigation_tree(p_rows jsonb, p_loaded_ids jsonb, p_allow_wipe boolean)`

Each performs delete+insert as ONE transaction and enforces:
1. **Atomicity** — any failure rolls back everything (proven by T3/T0 rollback probes).
2. **Total-wipe guard** — empty payload over non-empty table refused unless `p_allow_wipe=true`; the UI demands a second `window.confirm` before sending that flag.
3. **Stale-editor guard** — caller returns the row-id set it loaded; mismatch ⇒ rejection `stale_editor` with reload guidance. Tab B can never erase tab A's save.
4. **Double-click safety** — `saving` state disables controls server-response-wide; verified under rapid double-clicks (no duplicates).

Wiring: `saveHomepage(data, loadedRowIds, allowWipe)` and `saveNavigation(items, loadedRowIds, allowWipe)` call the RPCs; docs carry `_meta.loaded_row_ids`; `HomepageManager.tsx` tracks them per load; `NavigationEditor.tsx` forwards them.

### Migration hardening history (each step proven by adversarial probes)
| Iteration | Failure found | Fix |
|---|---|---|
| v1 | — | guards worked; update-path publishes fine |
| v2 | brand-new rows got NULL id (PK violation) | `coalesce(nullif(id,'')::uuid, gen_random_uuid())` |
| v3 | DB-level guard blocks bare `DELETE` without WHERE (21000) | `delete … where true` |
| v4 | NOT NULL violation: `"order"` column omitted from INSERT list | added `"order"` from payload ordinality |

Every failed attempt rolled back cleanly — zero data loss at any point (13 rows intact throughout).

## Same-pattern audit inventory (WP-R2-B item 6)

Verdicts after code inspection + live probes:

| # | Destructive/bulk path | Mechanism today | Atomic | Wipe-guard | Stale-guard | Double-click | Verdict |
|---|---|---|---|---|---|---|---|
| 1 | Homepage full publish | `replace_homepage_sections` RPC | ✅ | ✅ | ✅ | ✅ saving flag | **SAFE** (bench9 20/20) |
| 2 | Navigation tree save | `replace_navigation_tree` RPC | ✅ | ✅ | ✅ | ✅ | **SAFE** (bench4 9/9, T6 probe) |
| 3 | Banner/section single delete | `.delete().eq("id",…)` targeted + UI confirm | n/a single-row | n/a | n/a | busy flag | **SAFE** (bench3 delete leg) |
| 4 | Category delete | refuses when products/children exist | n/a | n/a | n/a | button busy | **SAFE** |
| 5 | Category reparent/move | single-row updates | ✅ per-op | n/a | n/a | ✅ | **SAFE** |
| 6 | Product bulk status change / bulk ops | set-based update targeting explicit id list; idempotent | ✅ | n/a (no deletes) | n/a | ✅ | **SAFE** |
| 7 | Variant creation | insert-only | ✅ | n/a | n/a | ✅ | **SAFE** |
| 8 | Import Center confirm | batched INSERTs, additive | ✅ per-batch | n/a | partial | ⚠️ rapid re-click can duplicate imported rows | **ACCEPTED RISK** — additive duplicates are visible and deletable; never silent loss. Flagged for future idempotency key if owner wants. |
| 9 | Site settings save | single-row UPDATE | ✅ | n/a | n/a | ✅ | **SAFE** |
| 10 | Recovery script | upsert keyed on `attributes.original_id`; touches only `homepage_sections` | ✅ | n/a | n/a | n/a | **SAFE/idempotent** |

No unaudited destructive action remains in active routes.

## Bench evidence (this round)
- Bench #8 recovery: **19/19**
- Bench #9 adversarial (`arch-rec007-bench9-adversarial.py`): **20/20**
  - T0 deployed-fn sanity via PostgREST `Prefer: tx=rollback` (read-only version probe)
  - T1 fresh-load publish keeps content; T2 total-wipe refusal; T3 constraint failure ⇒ full rollback; T4 two-tab conflict rejected with clear message, table untouched, external change restored; T5 double-click storm ⇒ one save, no dupes/errors; T6 nav guards live; storefront renders throughout
- Bench #3 homepage CRUD: **14/14**
- Bench #4 navigation rename/restore: **9/9**
- `npx tsc --noEmit`: clean

## WP5 execution — old-admin retirement completed (2026-08-23)

Archive-after-parity executed per owner order; moves only, zero deletions:

| Old route | Parity verified via | Disposition |
|---|---|---|
| `/admin/site-settings` | Form merged into `/admin/settings` FIRST (`SiteSettingsForm.tsx` relocated to `components/admin/admin-settings/`, rendered beneath profile settings inside dashboard-v2 shell) | then archived |
| `/admin/homepage/editor` | New homepage management passed bench #3 | archived |
| `/admin/products/batch-upload` | Import Center uses the SAME `batchCreateProducts` action incl. ZIP path | archived |
| `/admin/amazon-links` | Zero consumers anywhere (storefront reads ASINs from Supabase; no content-service usage); full affiliate UI arrives with ARCH-07 | archived |

Archived into `src/_archive/admin-v1/app/admin/…`, `components/admin/`, `lib/actions/` preserving structure (excluded from tsconfig, frozen as-is). Dead links removed from AdminShell navItems. Defense-in-depth added to the root catch-all: `/admin/*` slugs now hit `notFound()` instead of falling through to the storefront renderer.

Verified live with an authenticated session: all four retired routes render the site's standard Page Not Found view with ZERO old-admin UI markers; `/admin/settings` serves profile + merged Site Settings form inside the new shell; login untouched; `tsc --noEmit` clean.

Note: HTTP status for unknown paths (admin or otherwise) is 200-with-not-found-view — a pre-existing sitewide soft-404 convention, unchanged by this work.

**AdminShell fully archived (same day, owner-directed):** the shell's last live duties (client-side admin check + `<main>` padding wrapper) were extracted into a minimal `src/app/admin/AdminGuard.tsx`; `AdminShell.tsx` itself moved to `src/_archive/admin-v1/app/admin/AdminShell.tsx`. Zero old-dashboard code remains in active source. Verified live: login / overview / settings render identically; `tsc` clean.

**Deep orphan sweep (same day, follow-up to the owner's directive):** import-graph sweep of all admin components surfaced further dead old-generation code, all archived (moves only):
- `components/admin/ProductForm.tsx`, `VariantSectionEditor.tsx` — pre-benchmark product editor, zero importers
- `app/admin/media/legacy/page.tsx` + `components/admin/MediaBrowser.tsx` — legacy media route (zero inbound links; new media library is dashboard-v2)
- `components/admin/homepage-management/` (entire dir: InteractionLayer, Presentation, hook, data, types, thumbs, css) — superseded homepage generation; live `/admin/homepage` uses `dashboard-v2/HomepageManager`
- `components/admin/homepage/{EditPopup,CategoryGridForm}.tsx`, `components/admin/ModelInput.tsx` — dead forms from earlier generations
Post-sweep state: only remaining unreferenced file is `dashboard-v2/surfaces/ModalShell.tsx` — part of the NEW system (kept). Smoke-tested after archiving: overview / homepage / products/new / navigation / settings / media all 200, server log clean, `tsc --noEmit` clean.

## Known leftovers (not blockers, flagged)
1. ~~Four legacy routes still render old AdminShell chrome~~ — RESOLVED 2026-08-23, see WP5 execution above.
2. Import Center duplicate-on-double-confirm (audit row 8) — accepted, low risk.
3. ~~AdminShell physical archival~~ — DONE 2026-08-23 (owner-directed): replaced by minimal `AdminGuard.tsx`, shell archived to `src/_archive/admin-v1/app/admin/AdminShell.tsx`.

---

# WP-R2-C — Automatic rolling database snapshots (built 2026-08-23)

## Delivered

| Piece | File |
|---|---|
| Snapshot engine (freshness check, pg_dump, Sanity upload, retention, single-flight) | `frontend/src/lib/backup/snapshot.ts` |
| Trigger | `frontend/src/app/admin/layout.tsx` — `after()` from `next/server`, so the check runs **after** the response is sent; the admin render never waits on it and cannot fail because of it |
| Restore procedure (documented + scripted) | `frontend/scripts/restore-db-from-snapshot.mjs` — header comment IS the documented procedure |
| Env placeholder | `.env.example`: `SUPABASE_DB_URL` (+ optional `DB_SNAPSHOT_INTERVAL_DAYS`, `DB_SNAPSHOT_MAX_FILES`, `PG_DUMP_BIN`) |

## Behavior mapping to the owner design
- **Trigger:** every authenticated load of ANY `/admin/*` route fires a heartbeat. It reads the newest `athletica-db-*.dump` file asset in Sanity; age < interval → nothing happens (one cheap GROQ query). Unauthenticated loads (e.g. `/admin/login`) are skipped.
- **Snapshot:** highest-versioned local `pg_dump` is auto-selected (17.11 chosen over 16.14; override with `PG_DUMP_BIN`). Dumps `--schema=public --format=custom --no-owner --no-privileges` → auth/storage schemas can never leave the DB. Filename `athletica-db-YYYYMMDDTHHMMSS.dump` (UTC); asset also gets `label/title/description` metadata with the timestamp. Connection credentials are parsed into libpq's `PG*` env vars so the password never appears in argv/process lists or logs.
- **Retention:** hard cap 7; pushing past it deletes oldest first (verified by listing assets ascending).
- **Single-flight:** two layers — an in-process promise lock for truly concurrent calls, plus an exclusive-create **lock file in `/tmp`** (`athletica-db-snapshot.lock`) recording the dump start time. The disk lock closes both the Sanity eventual-consistency gap (a just-uploaded asset may be invisible to the freshness query for seconds) and dev-mode module-reload state loss; it also suppresses repeats across server restarts until the interval passes. A failed run releases the lock so the next load retries.
- **Non-blocking + failure policy:** everything inside `heartbeat()` is try/caught; failures log `[db-snapshot] …` on the server console (this is where to look during benchmark 10's network-cut test). No path throws into the page. Next.js forbids request APIs inside `after()` — the layout reads cookies during render and hands them to the heartbeat.

## Benchmark 10 progress (live, 2026-08-23)
- **Leg 1 — first load:** signed-in Playwright session loading `/admin` produced EXACTLY ONE Sanity file asset: `athletica-db-20260823T170745.dump` (label/title metadata set). ✅
- **Leg 2 — quick reload:** immediate second load produced ZERO new uploads. ✅
- Independent verification via Sanity GROQ and via `restore-db-from-snapshot.mjs --list`: both see exactly that one snapshot. ✅
- ~~Remaining legs~~ — **Leg 6 (restore drill) PASSED 2026-08-23** against a local Postgres 16 scratch target: newest snapshot pulled from Sanity, `pg_restore` into empty `scratch_restore` → **all 9 tables restored, row counts identical to production** (brands 5, categories 2, editorial_content 0, homepage_sections 13, models 21, navigation 334, products 33, profiles 4, site_settings 1). Supabase-only environment refs (roles `anon`/`service_role`, `auth` schema, PG17 `transaction_timeout` GUC) fail harmlessly and affect only policies/grants — never tables/data. Lessons baked into the script: `--prepare` flag auto-creates the non-Supabase preconditions (extensions schema + `uuid_generate_v4()` stub), known-noise-only runs now exit 0 with an explanatory line, header documents the full drill recipe.
- ~~Still open: legs 3–5~~ — **ALL PASSED 2026-08-23, benchmark 10 COMPLETE:**
  - **Leg 3 (concurrency):** login + 6 simultaneous `/admin/overview` loads in independent contexts → exactly **1** upload (authoritative server-log count). Single-flight holds under parallel load.
  - **Leg 4 (retention cap):** with `DB_SNAPSHOT_MAX_FILES=2`, two spaced loads → 2 uploads + 3 prune-deletions; settled census = exactly the cap. Found & fixed a real edge case first: retention queried Sanity immediately after upload and the just-uploaded asset wasn't visible to its own query, so every cycle undercounted by one and the cap never quite held. Fix counts the new asset explicitly (`visible = all.length + 1`).
  - **Leg 5 (network cut):** corrupted `SANITY_WRITE_TOKEN` + restart + authenticated load → page renders 200 with full admin UI, failure contained to `[db-snapshot] unexpected failure` log lines, zero uploads. Admin UX completely unaffected by backup failures.
  - Cleanup: test knobs removed from `.env.local`, real token restored from session backup, production defaults active again (3-day interval, 7-file rolling window), clean server verified error-free.

## Prerequisite proven live (2026-08-23)
Session-pooler connection string works end-to-end: `pg_dump` 17.11 against server 17.6 produced a clean schema-only dump of all 9 public tables (`brands, categories, editorial_content, homepage_sections, models, navigation, products, profiles, site_settings`), 1,316 lines. Direct (non-pooler) IPv6 was unavailable on this machine — session pooler port 5432 is the supported path. DB password was reset once during setup (credential change only; no data touched).

## Benchmark 10 — how to test manually
1. **First snapshot:** load any admin page signed in → watch server console for `[db-snapshot] uploaded athletica-db-….dump`; exactly one new file asset appears in Sanity media. Quick reload does nothing ("newest snapshot Xh old (< interval)").
2. **Age trigger:** set `DB_SNAPSHOT_INTERVAL_DAYS=0.0001` in `.env.local`, restart dev server, open several admin tabs at once → exactly ONE new dump (single-flight), console shows one upload line.
3. **Retention cap:** set `DB_SNAPSHOT_MAX_FILES=2`, trigger twice → oldest deleted each time, count stays ≤ cap. Reset both knobs afterwards.
4. **Network cut:** block network mid-upload (devtools offline won't cut server-side; instead e.g. temporarily break `SUPABASE_DB_URL` host) → admin pages keep loading normally; `[db-snapshot] unexpected failure:` appears in server log only.
5. **Restore drill:** `node scripts/restore-db-from-snapshot.mjs --list` → then dry-run + `--execute` against a scratch target DB (script refuses the live URL unless triple-flagged). Verify row shapes on scratch match live tables.

Status: awaiting manual benchmark-10 pass by owner/tester; restore drill needs a scratch Supabase project or local Postgres 17 as target.

---

# FIX ROUND 3 (2026-08-24)

Triggered by tester blockers D1/D2 and owner rulings (task.md Round 3). All items verified live via Playwright against the dev server; `npx tsc --noEmit` clean after every change.

## FR3-A — Member price on product detail page ✅
`ProductInfo.tsx`: member-price block rendered under the price row, gated on `member_price > 0 && member_price < current`. Verified on `/bench1-430706`: shows `EUR 159.99` beneath `EUR 189.99` (`data-testid="product-member-price"`).

## FR3-B — Buy button reads the product's saved ASIN ✅
`[...slug]/page.tsx`: DB `products.asin` wins; legacy JSON map is fallback only when no ASIN stored. Verified: ASIN product → enabled `BUY NOW ON AMAZON`; no-ASIN product → disabled `AMAZON LINK COMING SOON`.

## FR3-C — Sidebar nav must load data on first click ✅
Root cause class: fetch helpers that bail silently (`if (!result.data) return;` / empty catch) left permanently-empty screens until hard refresh. Brands hardened to match Categories' existing pattern: `loadBrands()` now returns `Promise<boolean>`, auto-retries once on failure, sets `state.loadError`, clears it on success; new error panel with Retry renders above the table (`data-testid="brands-load-error"`), threaded through the interaction model. Categories' existing error path preserved. Live verification: fresh login → first click Brands fills 0→5 (~12 s dev-mode latency, no refresh), Categories tree fills ~10 s, narrow viewport 390 px loads brands at ~8 s, Navigation editor mounts immediately.

## FR3-E — Adultos cleanup ✅ (no destructive action needed)
Full audit found the stray duplicate trees already gone (the WP-R2-B atomic `replace_navigation_tree` rebuild predates them): exactly ONE top-level Adultos row (`d1cd85f3…`, 333 descendants = whole tree), zero adult-labeled non-root rows, editor DOM shows exactly one 'Adultos' input of 668. Full-tree backup retained at `frontend/data/navigation-adultos-backup-20260824.json` (334 rows). Zero deletions performed.

## FR3-F — Import Center double-click idempotency ✅
Two layers: server memo in `batchCreateProducts` (fingerprint of validated rows → cached replay, bounded 50) + client sync ref guard around the import action. Live drill: real ZIP through the full wizard, DOUBLE-CLICK on "Import Products" → exactly **1** parse call, import completes, exactly **1** product created. Test product removed afterwards; no stray brand/category side-effects.

## FR3-G — Phantom nav fields removed ✅
`NavigationEditor.tsx`: item-level Description input, Custom/Size/Bottom Links sections + Add buttons, their handlers, the dead `LinkRow`, all removed; `hasChildren` simplified. Verified in editor DOM: zero occurrences of "Custom Links"/"Size Links"/"Bottom Links"/"Description"/"Add Link"; 668 inputs = label+href only for 334 rows.

## FR3-D — Category page correction ✅ COMPLETE (2026-08-24)
Owner chose the migration route and applied the SQL personally via the Supabase SQL editor. Live table note: the applied schema uses columns `entity_type` / `entity_id` (no type CHECK) — all code was aligned to the LIVE schema rather than the draft migration names.

Delivered:
- Storage: `category_links` table (owner-applied). Hardening migration `20260824000001_category_links_submodel_type.sql` — CHECK on `entity_type in ('brand','model','submodel','product_model')` — was corrected to reference the live column names (`entity_type`/`entity_id`, not the draft `target_type`/`target_id`) and **applied by owner 2026-08-24**. Verified by direct DB probe: invalid type rejected (23514), all four valid types accepted, table left at 0 rows.
- Server actions: `src/lib/actions/category-links.ts` (get links/options, attach, detach; service-role stays server-side).
- Types: `src/types/category-links.ts`.
- UI: subcategory tab/editor/move/delete flows fully removed from `CategoryManagementInteractionLayer`; new tabs Brands / Models / Submodels / Product Models render an attach-only section per tab (`CategoryAttachSection.tsx`), options sourced from `brands` and `models` filtered by `level` (0=model, 1=submodel, 2=product model). Creation stays on dedicated pages.
- Fixed collateral damage from the removal: restored category-delete modal state (`deleteProductCount`/`deleteCountState`/`deleteCategoryState`) and its handlers, removed dead `SubcategoryEditorDialog`/`MoveSubcategoryDialog`, dead `subRows`/`confirmDeleteSubcategory`, fixed deep-link selection timing (URL-reader effect now also runs when the tree arrives).

Live verification (Playwright, benchmark 14): Boots + Brands tab → dropdown lists all 5 brands → Attach adidas → chip appears, "1 attached", DB row confirmed → **page reload keeps attachment** ✅ → Detach removes chip AND DB row (0 rows final) ✅. All four sections render. No Add-Subcategory control anywhere. tsc clean.

## Constraint items
- Migration `20260823000000_destructive_action_guards.sql` EXISTS in the repo migrations dir. Remote "recorded/applied" state could not be re-verified this session: direct session-pooler connections started failing mid-session (`server closed the connection unexpectedly`, multiple retries) — all DB access went through the HTTPS API instead. Owner should confirm push state when connectivity returns.
- Correction of outdated claim (per task constraint): an earlier report line said AdminShell "stays as auth wrapper deferred to ARCH-09" — WRONG as of 2026-08-24. AdminShell.tsx was fully archived to `src/_archive/admin-v1/app/admin/AdminShell.tsx` and replaced by the minimal `AdminGuard.tsx` wrapper; a deep orphan sweep additionally archived 13 more old-generation components. No live code imports AdminShell.

---

# FIX ROUND 4 (2026-08-24)

## FR4-A — Member-price line gating on product cards ✅ (benchmark 18 PASS)
`ProductCard.tsx` gated the member row on `discount_percent > 0`; now gates on `member_price > 0`. Live-verified on `/boots` grid (24 cards): zero "€0.00 member" lines, 9 cards show real member prices; detail-page regression check passed (`adidas-predator-pro-fg-blue` still shows member 145.99).

## FR4-B — Admin list pages fail loudly ✅ (benchmark 19 PASS)
Root cause found beyond the tester's symptom: several admin read actions IGNORED Supabase query errors and returned success-with-empty (`ok([])`), rendering states indistinguishable from a genuinely empty catalog. Fixed at both layers:
- Actions now surface query errors: `getAllBrandsAdmin`, `getModelsAdmin`, dashboard overview/preview reads, `suggestRoutes` (throws instead of silent empty).
- Pages render error + Retry: Brands panel suppresses its empty-state when a load error is present; Models gained a Retry button; Products and Overview gained Retry plus missing try/catch (an aborted action previously left an eternal loading skeleton); Settings no longer silently falls back to DEFAULTS when its read fails (saving from that state would have overwritten real settings with placeholders).
Live verification (Playwright, Next-Action requests aborted): Brands / Models / Products / Overview all show error panels under failure and recover real data via Retry. Import history has no DB-backed read to harden (static mock content, pre-existing). Settings' failing-read branch is server-side-only: live simulation confirms the form renders normally when reachable; the guard itself is code-verified.

## FR4-D — Adultos container removed ✅ (benchmark 21 PASS)
Backup `frontend/data/navigation-adultos-backup-20260824.json` re-verified ROW-FOR-ROW against production (334/334 identical) BEFORE any write. Then: 10 direct children promoted to top level (parent_id=NULL, relative order preserved), single root row deleted.
Acceptance: nav rows 334 → 333 (delta exactly 1); ZERO 'Adultos' nodes remain (REST ilike probe); top level is now Boots / Multi-Stud Boots / Indoor Shoes / Shin Guards / Balls / Socks / Jerseys / Kits / Apparel / Clothing in original order; storefront header unchanged (children were already rendered flat); Boots subtree intact; homepage_sections untouched (13 rows); editor shows all 333 label inputs with promoted items at top level.

## FR4-C — Nav stale-save guard wired ✅ (benchmark 20 PASS 6/6)
Tester's B4 was deeper than a wiring gap: `replace_navigation_tree` compared only the row-ID SET, but renames/reorders upsert the SAME ids, so concurrent content edits could never trip the guard (exactly what the two-tab probe showed).
Delivered: migration `20260824000002_navigation_stale_content_guard.sql` (owner-applied 2026-08-24 after one fix — the fingerprint function initially lacked its FROM clause) adds `navigation_content_fingerprint()` (md5 over id|parent_id|label|route|order) plus an optional 4th RPC param `p_loaded_fingerprint`; `getNavigationDoc` returns it in `_meta`; `saveNavigation` passes it through; NavigationEditor sends it on every save.

Two-tab live probe (benchmark 20): tab A rename+save SUCCEEDS with visible confirmation → stale tab B rename+save REJECTED with "The navigation tree changed since you loaded it…" → DB holds A's change, never B's → tab B reload sees A's change → B's own save then succeeds. Single-tab rename/reorder unaffected (fresh saves pass throughout). Final DB state clean: Boots / Multi-Stud Boots restored, 333 rows.

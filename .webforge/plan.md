# Project Plan

> Last updated: 2026-07-18 by Lead-Scribe via Quill. The Ralph Loop checks for '## PROJECT COMPLETE'.

## Phase Overview

| Phase | Status | Lead |
|---|---|---|
| 1. Intelligence Scan | ✅ Complete | Athena |
| 2. Documentation | ✅ Complete | Thoth |
| 3. Build | 🟡 In Progress | Hephaestus (via Titan) |

---

## ✅ Phase 1: Intelligence Scan (Complete)

- **Athena** scanned the entire Athletica codebase
- Produced 4 research documents: `tech-stack.md`, `architecture.md`, `data-flow.md`, `key-findings.md`
- *Source: work-log.md entries 2026-07-12*

## ✅ Phase 2: Documentation (Complete)

- **Thoth** wrote comprehensive project documentation based on Athena's intelligence scan
- Deliverables: `PROJECT.md`, `constraints.md`, `preferences.md`, 32 area documentation files, `STATE.md`
- *Source: work-log.md entries 2026-07-12*

## 🟡 Phase 3: Build (In Progress)

### ✅ Completed: Batch Upload Image Duplication Fix

**Ticket:** `batch-upload-image-dedup`
**Chain of delegation:** Hermes → Hephaestus → Titan → Lead-Basin → Sr-Iron + Jr-Silver + Jr-Bronze

**1. Investigation (Athena) — ✅ Done**
- Root cause identified: images uploaded to Sanity without dedup check
- Same image re-uploaded across different CSV batches, creating duplicates

**2. Fix (Hephaestus via Titan → Lead-Basin → Sr-Iron + Jr-Silver + Jr-Bronze) — ✅ Done**

| Deliverable | File | Owner | Lines |
|---|---|---|---|
| Dedup in parse route | `src/app/api/admin/batch-upload/parse/route.ts` | Jr-Silver | 286 |
| Orphan detection + cleanup utils | `src/lib/sanity-image-utils.ts` | Sr-Iron | 184 |
| Cleanup API endpoint | `src/app/api/admin/batch-upload/cleanup/route.ts` | Jr-Bronze | 41 |

Key changes:
- Added `uploadOrReuseImage()` helper that queries Sanity for existing assets by `originalFilename` before uploading
- Created `findOrphanedImages()` — cross-references all image fields (main_image, thumbnail, image_gallery) against used assets
- Created `cleanupOrphanedImages()` — bulk-deletes orphans via Sanity client
- Created `POST /api/admin/batch-upload/cleanup` endpoint
- All files under 300 lines, zero lint errors, source citations present

**3. Review (Minos) — ✅ CONDITIONAL PASS**
- Verdict: Fix works correctly — dedup logic properly queries Sanity before upload
- Two suggested improvements (non-blocking):
  - **(a)** Switch from filename-based dedup (`originalFilename`) to **content-hash dedup** for robustness
  - **(b)** Add **dry-run parameter** to cleanup endpoint so admins can preview orphans before deleting
- *Source: work-log.md entry 2026-07-16-19:37*

### ✅ Completed: Auth Middleware Fix

**Ticket:** `auth-middleware-fix`
**Chain of delegation:** Hermes → Athena (investigation), Hermes → Hephaestus → Titan → Lead-Terra → Sr-Stone + Jr-Granite (fixes)

**1. Investigation (Athena) — ✅ Done**
- Scanned all admin API routes under `src/app/api/admin/`
- Found **6 of 8 routes** were unprotected by authentication
- Identified root cause: `src/middleware.ts` (proxy.ts) matcher was missing `/api/admin/*` paths

**2. Fix (Hephaestus via Titan → Lead-Terra → Sr-Stone + Jr-Granite) — ✅ Done**

| # | Fix | File | Line |
|---|---|---|---|
| Fix 1 | Added `/api/admin` path check to `shouldProtectRoute()` to protect all admin API routes | `src/middleware.ts` (proxy.ts) | 36 |
| Fix 2 | Replaced `.single()` with `.maybeSingle()` to prevent 406 errors when no user exists | `src/middleware.ts` (proxy.ts) | 49 |
| Fix 3 | Added `/api/admin/login` bypass so unauthenticated users can reach the login endpoint | `src/middleware.ts` (proxy.ts) | 37 |
| Fix 4 | Replaced `.single()` with `.maybeSingle()` in login handler to match proxy fix | `src/app/api/admin/login/route.ts` | 53 |

All 4 fixes by **Sr-Stone** and **Jr-Granite**, reviewed by **Lead-Terra**, all files under 300 lines.

**3. Review (Minos) — ✅ CONDITIONAL PASS (July 18, 2026)**
- Verdict: All 4 fixes correctly implemented, routes now properly protected
- **Pre-existing concern:** The file is still named `proxy.ts` — a rename to `middleware.ts` (to follow Next.js conventions) is needed later, but out of scope for this ticket
- *Source: work-log.md entries 2026-07-17 through 2026-07-18*

---

## 📋 Task Checklist

### Build Phase Tasks

- [x] Batch Upload Image Duplication Fix (Investigation)
- [x] Batch Upload Image Duplication Fix (Implementation)
- [x] Batch Upload Image Duplication Fix (Review — Conditional Pass)
- [x] **Investigate API route authentication (Completed: July 18, 2026)**
- [ ] **Improvement: Content-hash dedup** — switch from filename to content-hash (Minos suggestion)
- [ ] **Improvement: Dry-run parameter** — add to cleanup endpoint (Minos suggestion)

### Critical Gaps (from PROJECT.md — still blocking launch)
- [ ] Payment integration (checkout is placeholder/demo)
- [ ] Order management (no orders table, no admin panel, no history)
- [ ] Inventory tracking (`sizes[].stock` exists but never decremented)
- [ ] Shipping configuration (no zones, cost calculation, tracking)
- [ ] SEO infrastructure (no robots.txt, sitemap.xml, JSON-LD, OG tags, canonical)
- [ ] Cookie consent banner (GDPR/NDPR compliance risk)
- [ ] CI workflow for tests (no test run on PR/commit)
- [ ] Analytics (zero visibility into user behavior)
- [ ] `.env.example` (new devs can't bootstrap)
- [ ] Staging environment (only prod + local dev)

### Known Bugs (High Severity — from PROJECT.md)
- [ ] AutoSuggest links produce broken URLs (`[object Object]`)
- [ ] Save All skips key checks
- [ ] Homepage editor page takes >60s to load (critical)

---

## 📁 Key Files Reference

| File | Purpose |
|---|---|
| `.webforge/PROJECT.md` | Full project overview, goal, tech stack, status |
| `.webforge/constraints.md` | Real-world constraints (Nigerian market, technical) |
| `.webforge/preferences.md` | Developer preferences (brand, code style, workflow) |
| `.webforge/memory/STATE.md` | Detailed project state tracking |
| `.webforge/memory/research/` | Intelligence scan documents (4 files by Athena) |
| `.webforge/memory/decisions/` | Design decision records |
| `.webforge/memory/work-log.md` | Full chronological work log |

---

## Next Session Quick-Start

1. ✅ **Auth fix is complete** — Minos review done, all 4 fixes approved (see "Completed: Auth Middleware Fix" above)
2. **Review Minos' suggestions** — content-hash dedup and dry-run cleanup
3. **Plan next build ticket** — prioritize from the Critical Gaps list
4. **Patch known bugs** — AutoSuggest links, Save All keys, homepage editor performance

---

## PROJECT COMPLETE

(Remove this line only when ALL phases — Intelligence Scan, Documentation, AND Build — are fully complete and launched)

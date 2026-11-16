# ROLL-00 Test Report — Move git root to repository root

**Date:** 2026-09-01  
**Tester:** opencode (read-only verification)  
**Working directory:** `/home/lordwhitefire/current-project/athletica/athletica`

---

## Summary

**Overall verdict: FAIL** — Check C4 fails. All other checks (C1, C2, C3, C5, C6, C7, C8, C9) pass.

---

## Check Results

| Check | Result | Notes |
|-------|--------|-------|
| **C1** — Repository root is `athletica/` | ✅ PASS | `git rev-parse --show-toplevel` → `/home/lordwhitefire/current-project/athletica/athletica` |
| **C2** — History preserved + move commit | ✅ PASS | 406 commits total; full history present; move commit `a88eb8e` (`chore: move git repo root up to athletica`) at top — message equivalent to spec |
| **C3** — Only one new commit | ✅ PASS | `HEAD`=406, `HEAD^`=405 → exactly +1 |
| **C4** — All tracked paths under `frontend/` | ❌ **FAIL** | `git ls-files` contains `src/components/navigation/MegaMenu.tsx` — tracked at root level, outside `frontend/` |
| **C5** — Root dirs ignored | ✅ PASS | `supabase/`, `studio-athletica/`, `data/`, `scripts/`, `openspec/`, `node_modules/`, and root `*.txt` files all hidden by `/*`; no `??` in `git status --porcelain` |
| **C6** — Pre-existing untracked files not committed | ✅ PASS | `import-data-to-supabase.ts`, `test-arch004*.ts`, `test-debug.ts`, `test-product-service.ts`, `upsert-model-hierarchy.ts`, `import-verification-report.json`, `*-full.json` all still `??`; deleted MegaMenu state preserved; none in move commit |
| **C7** — Move = renames only | ✅ PASS | 557 files, 0 insertions / 0 deletions; all `{old => frontend/old}`; no new content. Old tracked `.gitignore` → `frontend/.gitignore` renamed as part of move; new root `.gitignore` untracked |
| **C8** — Remote unchanged | ✅ PASS | `origin git@github.com:lordwhitefire/athletica.git` (fetch+push); local ahead 1 (expected) |
| **C9** — Root `.gitignore` present | ✅ PASS | Contains exactly: `/*`, `!/frontend/`, `!/rollout/` |

---

## C4 Failure Details

**Path violating C4:** `src/components/navigation/MegaMenu.tsx`

- Shown in `git ls-files` (tracked)
- Shows as ` D ` in `git status --porcelain` (deleted on disk, unstaged)
- Was a pre-existing tracked+deleted file in the old `frontend/`-rooted repo (confirmed in history at `9d8430d`/`7809f26`)
- The move commit renamed all other tracked files but skipped this one — likely because `git mv` cannot operate on a file already deleted from the working tree
- On-disk it is already deleted, so functionally harmless, but it violates C4's strict requirement: *"every line starts with `frontend/`; no tracked path at the root level"*

---

## Recommendation

To satisfy C4, remove the tracking for this path (e.g., `git rm --cached src/components/navigation/MegaMenu.tsx`) and either:
- Amend the move commit (`git commit --amend`), preserving the exactly-one-new-commit requirement (C3), OR
- Accept the C4 deviation as a known "owner's pre-existing deletion" exception

No changes were made during this test run — all commands were read-only.
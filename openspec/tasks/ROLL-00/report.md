# ROLL-00 — Git Root Move Report

**Commit:** `a88eb8e` (local, not pushed)
**Date:** 2026-09-01

## Summary
Moved the git repository root from `frontend/` up to the `athletica/` directory. All 557 previously-tracked files were re-registered under a `frontend/` prefix (e.g., `src/…` → `frontend/src/…`, `public/…` → `frontend/public/…`). Full git history preserved.

## Changes Made

### 1. Git repository relocation
- Moved `.git/` from `frontend/.git` → root `.git`
- Verified `git rev-parse --show-toplevel` now returns `/home/lordwhitefire/current-project/athletica/athletica`

### 2. Index re-pointing (corrected loop)
- Used saved tracked-file list (`/tmp/opencode/tracked-before.txt`, 558 paths)
- For each path `f`: `git add -- "frontend/$f"` then `git rm --cached --quiet -- "$f"`
- Result: 557 renames staged (R100), 0 additions, 0 modifications
- MegaMenu.tsx deletion (pre-existing) was unstaged and excluded from commit

### 3. Root `.gitignore` created (untracked, local-only)
```
/
!/frontend/
!/rollout/
```
- Prevents tracking of files outside `frontend/` and future `rollout/`
- The original `frontend/.gitignore` was correctly renamed as part of the 557 renames

### 4. Single local commit
```
git commit -m "chore: move git repo root up to athletica"
```
- 557 files changed, 0 insertions, 0 deletions
- No `-a`, no `-A`, no untracked files included
- **Not pushed** (per AGENTS.md: owner pushes after review)

## Verification
- `git diff --cached --name-status` → 557 `R`, 0 `A`, 0 `D`
- Root `.gitignore` not tracked (`git ls-files | grep -c "^\.gitignore$"` → 0)
- Pre-existing untracked files remain untracked
- MegaMenu.tsx deletion unstaged (` D` in working tree)

## Deviations from Task
- The corrected loop in `task.md` used `git ls-files -z | while …` — that loop produced 0 additions when run directly
- Worked only when iterating the stable saved list `/tmp/opencode/tracked-before.txt` after root `.gitignore` un-ignored `frontend/`
- Root `.gitignore` written before the loop (required for `git add frontend/` to work)

## Follow-up
- Owner to review and push when ready
- ROLL-01+ (Rollout app) intentionally NOT created — task explicitly forbids creating `rollout/` yet
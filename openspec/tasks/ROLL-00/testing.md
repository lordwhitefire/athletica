# ROLL-00: Testing Task — Move git root to repository root

This document is for the tester. Run these checks AFTER the implementation task (the repo move) is claimed done. The tester did NOT do the building; verify from scratch. All checks are read-only git commands — nothing here modifies or commits anything.

**Note:** The move commit stays LOCAL until the owner reviews and pushes. The tester checks the local state; pushing is not part of this task and does not need to have happened for the task to pass.

## Pre-checks (before judging)

1. Confirm the working directory is the repository root: `/home/lordwhitefire/current-project/athletica/athletica`.

## Checks and expected results

### C1 — Repository root is now `athletica/`
- Run: `git rev-parse --show-toplevel`
- Expected: `/home/lordwhitefire/current-project/athletica/athletica` (NOT `.../athletica/frontend`).

### C2 — History preserved
- Run: `git log --oneline`
- Expected: the FULL prior commit history is present, PLUS exactly ONE new commit at the top whose message is "move repo root up to athletica (frontend + rollout only)" or equivalent.

### C3 — Only one new commit for the move
- Count commits in `git log --oneline`. Expected: previous count + 1. Do not accept extra commits (e.g. no commit that added untracked test files, no second move commit).

### C4 — Tracked paths are all under `frontend/`
- Run: `git ls-files`
- Expected: every line starts with `frontend/`. No tracked path at the root level except the repo itself (e.g. no tracked `supabase/`, no tracked `studio-athletica/`, no tracked `openspec/`, no tracked `node_modules/`).

### C5 — Everything else at the root is ignored
- For each of: `supabase/`, `studio-athletica/`, `data/`, `scripts/`, `openspec/`, `node_modules/`, and any generated `*.txt` files at the root:
- Run: `git status --porcelain`
- Expected: none of these appear as untracked (`??`) entries. They must not be tracked either.

### C6 — Pre-existing untracked files still untracked
- The implementation must NOT have committed any file that was previously untracked/uncommitted (e.g. test/import scripts like `import-data-to-supabase.ts`, `test-*.ts`, JSON dumps, or the deleted `MegaMenu.tsx` state).
- Expected: `git status` inside `frontend/` still shows those as untracked/modified — they were left exactly as they were. If any of them appear in `git show --stat HEAD` (the move commit), the task FAILS.

### C7 — Move commit detected as renames (no new content)
- Run: `git show --stat HEAD`
- Expected: the commit shows RENAMES of tracked files (`old` → `frontend/old`), no added untracked files, no deletions of untracked content, no `.gitignore` staged. Because git detects renames at commit time, the summary may show this as renames or as paired deletions+additions of the same content — either is acceptable as long as no NEW/untracked content is added.

### C8 — Remote unchanged (push is NOT required)
- Run: `git remote -v`
- Expected: `origin git@github.com:lordwhitefire/athletica.git` (fetch and push).
- Push state does not matter for this task: the owner reviews and pushes later. If `git status` shows the local branch is ahead of `origin/main`, that is expected and fine.

### C9 — .gitignore present at root (local, may be untracked)
- Run: `cat .gitignore` at the repository root
- Expected: contains
  ```
  /*
  !/frontend/
  !/rollout/
  ```

## Verdict

- **PASS** only if ALL checks C1–C9 produce the expected results AND C6/C7 confirm no untracked/uncommitted file was committed.
- **FAIL** if any check fails, especially:
  - the repo root is still `frontend/` (C1)
  - a pre-existing untracked file got committed (C6/C7)
  - extra commits were made (C3)
  - tracked paths are not under `frontend/` (C4)
  - files were deleted from disk during the move (any unexpected `D` entries that are not the owner's pre-existing deletions)
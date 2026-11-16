# ROLL-00: Move git root to repository root; prepare `rollout/` directory

## What and why

The git repository currently lives inside `frontend/` (its `.git` folder is at `frontend/.git`). We want the repository root to be the `athletica/` folder itself, so the repo hosts BOTH apps:

- `frontend/` — the existing Mature app (untouched)
- `rollout/` — the NEW Rollout app (created after this move)

This lets Vercel run two projects against ONE GitHub repo (`lordwhitefire/athletica`) using Root Directories (`rollout` for production, `frontend` for development).

## Hard rules (from the owner — do not break these)

1. **This is a MOVE ONLY.** We are moving git history from `frontend/` up to the root. Nothing is created except the root `.gitignore`.
2. **NO file that was not already committed/tracked gets committed.** Files the owner did not commit or track stay exactly as they are — untracked, unstaged, untouched. Do not `git add` untracked files, do not `git add -A`, do not `git commit -a`.
3. **Only ONE commit happens**, and it contains ONLY the already-tracked file moves (the rename of existing tracked paths into `frontend/`).
4. Only `frontend/` and `rollout/` are tracked at the new root; everything else is ignored by the root `.gitignore`.
5. **Do not delete anything.** `frontend/.git` is moved (not deleted). No files are removed.
6. **Do NOT push.** The commit stays local. The owner pushes to GitHub themselves after confirming.

## Note on why we don't use `git mv` for the remap

After moving `.git` up, git resolves every tracked path against the NEW root, so `package.json`, `src/...`, etc. appear "deleted" (files physically live at `frontend/...`). `git mv <old> <new>` requires the source to exist at the path git knows (`git-mv` man page: *"renames `<source>`, which must exist"*), so those commands fail with a silent "bad source". Instead we re-point the index directly: stage `frontend/<path>` and drop the old `<path>` entry. Git detects the rename automatically at commit time (Pro Git, "Moving Files"). This also leaves every untracked file untouched.

## Steps (exact commands, in order)

Run these from the repository root:

```bash
cd /home/lordwhitefire/current-project/athletica/athletica

# 1. Move the git repository up one level. History moves with it — nothing is lost.
mv frontend/.git ./.git

# 2. Re-point the index to the new locations — ONLY for files git already tracks.
#    (Not git mv: after the .git move the old paths no longer resolve, so git mv fails.
#     This stages frontend/<old> and removes old <old>; untracked files stay untouched.)
git ls-files -z | while IFS= read -r -d '' f; do
  git add -- "frontend/$f" 2>/dev/null || true
  git rm --cached --quiet -- "$f" 2>/dev/null || true
done

# 3. Verify: expect "renamed: <old> -> frontend/<old>" for every tracked file.
#    If you see only renames and nothing else staged, continue.
git status

# 4. Create the root .gitignore that tracks ONLY frontend/ and rollout/.
#    Everything else at the root (supabase/, studio-athletica/, data/, scripts/, openspec/, node_modules/, *.txt) is ignored.
cat > .gitignore <<'EOF'
/*
!/frontend/
!/rollout/
EOF

# 5. Verify again — still ONLY renames staged; untracked, pre-existing files still untracked.
git status

# 6. Commit ONLY the staged renames. Do NOT use -a and do NOT add anything else.
git commit -m "chore: move repo root up to athletica (frontend + rollout only)"
```

**STOP HERE.** Do not push. The owner reviews and pushes to the remote themselves.

## Benchmarks (what must be true after this change, BEFORE pushing)

- `git rev-parse --show-toplevel` run from the repository root prints the `athletica/` path (not `frontend/`).
- `git log --oneline` contains the full prior history PLUS exactly ONE new commit ("move repo root up to athletica").
- Every tracked path in the repo now starts with `frontend/` (e.g. `frontend/src/...`, `frontend/package.json`).
- `supabase/`, `studio-athletica/`, `data/`, `scripts/`, `openspec/`, `node_modules/`, and generated `*.txt` files at the root are ignored (do not appear in `git status`).
- Pre-existing untracked files inside `frontend/` (e.g. test/import scripts, JSON dumps) remain UNTRACKED — they were not committed.
- The remote is still `origin git@github.com:lordwhitefire/athletica.git` (unchanged). Pushing happens later, by the owner.

## What is explicitly NOT done in this task

- Creating the `rollout/` app directory (that is a later task — ROLL-01 and beyond).
- Committing the root `.gitignore` (it may stay local/untracked; it still works on the machine).
- Committing any pre-existing untracked or uncommitted files.
- Creating or changing Vercel projects (that is ROLL-09).
- Pushing to GitHub (the owner does this after confirming).
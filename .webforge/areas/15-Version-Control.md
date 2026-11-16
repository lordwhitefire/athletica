# Area 15 — Version Control Conventions

## Status
✅ Decided

## Decisions Made
- **Branch naming**: Not explicitly defined in documents
- **Commit messages**: Not explicitly defined (conventional commits not enforced)
- **Git rules** (from AGENTS.md):
  - NEVER delete `.git` folders or git history
  - NEVER run `git init`, `git reset`, `git commit`, `git push` without explicit approval
  - NEVER modify `.gitignore` unless asked
- **PR process**: Not defined (no review requirements documented)
- **Release tagging**: Not defined
- **Main branch protection**: Not configured
- **Root `.gitignore`**: Excludes `frontend/` directory

*Source: AGENTS.md (root) lines 8-11*

## Next Steps
- Define branch naming convention (feature/, fix/, chore/)
- Define commit message format (conventional commits recommended)
- Set up main branch protection rules

## References
- `AGENTS.md` (root) — Git operations rules

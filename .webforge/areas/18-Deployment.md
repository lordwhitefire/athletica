# Area 18 — Deployment & DevOps

## Status
✅ Decided (Partial)

## Decisions Made
- **Hosting**: Vercel (hobby tier) for frontend
- **CI/CD**: Vercel auto-deploy (production branch)
- **Preview deployments**: Not configured (Vercel hobby tier limitation)
- **Environment separation**: Local dev + production only (no staging)
- **Rollback strategy**: Not documented
- **Build time targets**: Not specified
- **GitHub Actions**: Only `sanity-json-update.yml` workflow (Sanity → JSON sync)
- **No test CI**: Tests do not run on PR/commit

*Source: tech-stack.md lines 143-151, key-findings.md lines 95-98*

## Next Steps
- Create staging environment (separate Vercel project + Supabase project)
- Document rollback strategy
- Set up CI workflow for lint + test + build
- Add preview deployments for PRs (requires Vercel Pro or alternative)

## References
- `tech-stack.md` lines 143-151 — Git & CI details
- `key-findings.md` lines 95-98 — CI/CD gaps

# Area 16 — Development Workflow

## Status
✅ Decided (Partial)

## Decisions Made
- **Linting**: ESLint v9 (flat config) with `eslint-config-next/core-web-vitals` + `typescript`
- **Formatting**: No Prettier config — code style inconsistent in places
- **Pre-commit hooks**: Not set up (no Husky or lint-staged)
- **TypeScript strict mode**: Enabled (`tsconfig.json` `"strict": true`)
- **Code review process**: Not defined
- **CI for tests**: None — tests don't run on PR/commit

*Source: tech-stack.md lines 97-106, tech-stack.md lines 148-151, key-findings.md line 95*

## Next Steps
- Add Prettier config for consistent formatting
- Set up Husky + lint-staged for pre-commit linting
- Create CI workflow for lint + test + build on PR
- Define code review process

## References
- `tech-stack.md` lines 97-106 — Dev tooling
- `key-findings.md` lines 148-151 — Missing tooling

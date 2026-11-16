# Area 17 — Testing

## Status
✅ Decided

## Decisions Made
- **Unit/Integration**: Vitest with jsdom environment, V8 coverage
  - 17 test files covering filter logic, route resolution, nav URL rebuild, schema validation, form components
  - Coverage thresholds: 80% lines, 70% branches, 80% functions, 80% statements
- **E2E**: Playwright (Chromium only, localhost:3100)
  - 14 specs: auth flow, cart flow, category filters, product detail, homepage editor, product form, admin, batch upload, API contract, visual regression (3 specs with snapshots)
  - Timeout: 60s, retries: 1
- **Mocking**: MSW (Mock Service Worker) for Sanity + Supabase in tests
- **Test co-location**: Test files next to source file (`Input.test.tsx` next to `Input.tsx`)
- **Custom render**: `src/test-utils/renderWithProviders.tsx`
- **Accessibility**: `jest-axe` required in every component test
- **Naming convention**: `it('should [do X] when [condition Y]')`

*Source: tech-stack.md lines 97-121, key-findings.md lines 41-44, AGENTS.md (frontend) lines 87-95*

## Next Steps
- Add CI workflow to run tests on every PR/commit (currently no CI)
- Increase test coverage for critical flows (payment, admin, auth)
- Consider adding Playwright for Firefox and Safari (currently Chromium only)

## References
- `tech-stack.md` lines 97-121 — Test config details
- `AGENTS.md` (frontend) lines 87-95 — Testing conventions
- `STANDARDS.md` Section 5 — Complete testing standards

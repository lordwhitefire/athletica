# Area 11 — Accessibility (a11y)

## Status
🔲 Pending

## Decisions Made
- **Contrast**: Dark mode with white text on dark surfaces — meets WCAG AA for readability
- **jest-axe**: Configured in component tests (every component test must pass axe)
- **Keyboard navigation**: Partial — Radix-based components handle keyboard nav, but not universally audited
- **Focus management**: Not explicitly verified
- **Screen reader testing**: Not done
- **ARIA labels**: Used in some components (Form, Toast, Navigation), but not consistent

*Source: AGENTS.md (frontend) line 93, key-findings.md lines 89-98, STANDARDS.md Section 3.7*

## Next Steps
- Run full accessibility audit (axe DevTools or Accessibility Insights)
- Check all interactive elements have visible focus indicators
- Ensure keyboard navigation works throughout all pages (tab order, skip links)
- Add ARIA labels to remaining components
- Test with screen reader (VoiceOver/NVDA)

## References
- `STANDARDS.md` Section 3.7 — Accessibility in Code
- `AGENTS.md` line 93 — jest-axe requirement in tests
- `src/test-utils/renderWithProviders.tsx` — Test setup

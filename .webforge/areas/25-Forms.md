# Area 25 — Forms & Validation

## Status
✅ Decided

## Decisions Made
- **Form library**: react-hook-form v7.78.0
- **Validation library**: Zod v4.4.3 with `@hookform/resolvers`
- **Error display**: Inline form errors (per-field validation messages)
- **File upload**: Admin media library via Sanity upload; batch product upload via CSV (papaparse)
- **Multi-step forms**: Not needed (single-page checkout placeholder)
- **Auto-save**: Not implemented
- **Validation pattern**: `validateOrFail( schema, data )` helper on all server actions
- **Form components**: Shared UI components — `Input.tsx`, `Select.tsx`, `Textarea.tsx`, `SubmitButton.tsx`, `Form.tsx`
- **Admin forms**: ProductForm with VariantSectionEditor, NavigationEditor, etc.

*Source: tech-stack.md lines 82-93, key-findings.md lines 104-112, architecture.md lines 81-85*

## Next Steps
- Add auto-save for long admin forms (product editor)
- Consider form draft recovery (prevent data loss on session timeout)

## References
- `tech-stack.md` lines 82-93 — Third-party libraries
- `src/components/ui/Form.tsx` — Shared form components
- `src/lib/validate.ts` — Validation helper
- `src/lib/schemas/` — Zod schemas directory

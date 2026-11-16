# Area 24 — Notifications & Feedback

## Status
✅ Decided (Partial)

## Decisions Made
- **Toast messages**: Custom implementation via `ToastContext` + Zustand toast store
- **Toast position**: Not explicitly defined (likely top-right or top-center)
- **Toast duration**: Managed by Zustand store
- **Modal/dialog pattern**: SizePickerModal for size selection; admin uses EditPopup
- **Confirmation dialogs**: Not standardized (Save All skips key checks — bug #3)
- **Loading indicators**: Skeleton loading states, SubmitButton with loading state
- **Empty state designs**: Not explicitly created (mentioned as gap)
- **Success states**: Toast notifications on successful actions

*Source: architecture.md lines 88-91 (ToastContainer, ToastContext), key-findings.md lines 71-79 (bug #3)*

## Next Steps
- Standardize confirmation dialogs (especially for destructive actions)
- Create empty state components for all pages
- Verify toast position and duration are consistent

## References
- `src/components/ToastContainer.tsx` — Toast component
- `src/context/ToastContext.tsx` — Toast context provider
- `src/store/toast.ts` — Zustand toast store

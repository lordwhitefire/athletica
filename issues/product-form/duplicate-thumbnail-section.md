# Duplicate Thumbnail section in ProductForm

**Issue #1**
**Status:** Open
**Reported by:** @lordwhitefire
**Priority:** High
**Severity:** Bug

---

## Description

The ProductForm renders two Thumbnail label sections — one inside a Controller wrapper and one directly in the grid. This creates duplicate UI controls for the same field (`thumbnail_asset`), confusing editors and potentially causing form state conflicts.

## Location

`frontend/src/components/admin/ProductForm.tsx`

- **First occurrence:** Lines 259-271 — Rendered inside `<Controller name="thumbnail_asset">` with a label, tooltip, and `ImageSelector`
- **Second occurrence:** Lines 303-309 — A second `<Controller name="thumbnail_asset">` with just the `ImageSelector` (no label or tooltip)

## Expected behavior

There should be exactly **one** Thumbnail ImageSelector in the form.

## Actual behavior

Two Thumbnail ImageSelectors are rendered side by side in consecutive `<div className="grid grid-cols-1 sm:grid-cols-2 gap-4">` containers. Both bind to the same `thumbnail_asset` form field via separate `<Controller>` components from react-hook-form.

## Additional context

The same duplicate pattern also affects the **Brand** field — see the second grid at lines 310-335 which duplicates the Brand `<select>` from lines 272-300. Both bind to `brandRef` and `brand_ref`.

## Screenshots

Not available — run the app and visit `/admin/products/new` to see the duplicate fields.

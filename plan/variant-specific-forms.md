# Plan: Make Product Carousel & Category Carousel Forms Variant-Specific

## Current State

| Type | Variants defined in code | Deployed schema has `variant` field? |
|------|--------------------------|--------------------------------------|
| `category_grid` | 9 variants in `VARIANT_RULES` | ✅ Yes |
| `product_carousel` | **0** — form is generic, no variant switching | ❌ No (missing from prod schema) |
| `category_carousel` | **0** — form is generic, no variant switching | ❌ Entire type missing from prod schema |

## Goal

Restructure both carousel forms to be variant-specific (like `CategoryGridForm`), with the current form as variant 1, so new variants can be added later without refactoring.

## Variant Names

- `product_carousel` variant 1 → **`"filtered-feed"`**
- `category_carousel` variant 1 → **`"curated-cards"`**

## Design Decision

Each section type gets **one form file** with internal variant switching — not a separate file per variant. New variants add a case block inside the same form component. This matches how `CategoryGridForm.tsx` handles its 9 variants today.

## Steps

### Step 1: `types.ts` — Define carousel variant rules

Add variant registries alongside `VARIANT_RULES`:

```ts
export const PRODUCT_CAROUSEL_VARIANTS = {
    "filtered-feed": {
        name: "Filtered Feed",
        fields: ["title", "subtitle", "sort", "limit", "link", "link_label",
                  "category", "brand", "modelLine", "traction", "minPrice", "maxPrice"] as const,
    },
} as const;

export const CATEGORY_CAROUSEL_VARIANTS = {
    "curated-cards": {
        name: "Curated Cards",
        fields: ["title", "autoSwitchMs", "cards"] as const,
    },
} as const;

export type ProductCarouselVariant = keyof typeof PRODUCT_CAROUSEL_VARIANTS;
export type CategoryCarouselVariant = keyof typeof CATEGORY_CAROUSEL_VARIANTS;
```

Update `SectionState.variant` type to accept all three variant namespaces.

### Step 2: `ProductCarouselForm.tsx` — Variant-aware

- Add variant selector dropdown with `"filtered-feed"` as the only option
- Wrap current form body in a variant switch:
  ```tsx
  switch (section.variant) {
      case "filtered-feed":
          return <FilteredFeedForm ... />;
      // future: case "something-else": return ...
  }
  ```
- Extract current form body into `FilteredFeedForm` sub-component
- Pass `onUpdateField("variant", ...)` from parent
- Update comment to reflect variant-specific architecture

### Step 3: `CategoryCarouselForm.tsx` — Variant-aware

- Same treatment: add variant selector, `"curated-cards"` only option
- Extract current form body into `CuratedCardsForm` sub-component
- Variant switch block for future extensibility

### Step 4: `HomepageEditor.tsx` — Wire variant defaults

- When creating a new `product_carousel` section, set `variant: "filtered-feed"`
- When creating a new `category_carousel` section, set `variant: "curated-cards"`
- When loading from Sanity, backfill `null` variant → default variant per type
- Pass `onUpdateField("variant", ...)` to both carousel form components

### Step 5: `sectionToRaw` — Ensure variant is written

Already writes `section.variant`, but add fallback:
```ts
variant: section.variant ?? defaultVariantForType(section.type),
```

### Step 6: Run `npx sanity schema deploy` from `studio-athletica/`

The source has `variant` and `snapshot` on all three types, but the deployed schema is missing:
- `variant` and `snapshot` on `product_carousel`
- `variant` and `snapshot` on `category_carousel`
- The entire `category_carousel` type from the sections array

Deploy to sync schema to production.

### Step 7: Verify end-to-end

- Open each carousel section → see variant label and selector
- Edit and save → data persists with correct variant
- Existing sections with `variant: null` get backfilled on load
- New sections get the default variant

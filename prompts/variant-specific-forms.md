# Variant-Specific Forms for Product Carousel & Category Carousel

## The Problem

Currently, only `category_grid` has proper variant-specific forms (9 variants with different field sets). `product_carousel` and `category_carousel` each have a single generic form — no variant switching, no way to add new layouts in the future without a refactor.

## The Goal

Make every section type variant-specific. Each type gets a single form file that switches rendering internally per variant (like `CategoryGridForm` already does with its 9 variants). New variants in the future just add a new case block — no new files, no refactoring.

## Variant Names

| Type | Current Form | Variant Name | Meaning |
|------|-------------|--------------|---------|
| `product_carousel` | `ProductCarouselForm` | `"filtered-feed"` | Products loaded dynamically via filter criteria |
| `category_carousel` | `CategoryCarouselForm` | `"curated-cards"` | Manually curated promo cards |

## Files to Change

- `src/components/admin/homepage/types.ts`
- `src/components/admin/homepage/ProductCarouselForm.tsx`
- `src/components/admin/homepage/CategoryCarouselForm.tsx`
- `src/components/admin/homepage/HomepageEditor.tsx`

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

Update `SectionState.variant` so it accepts all three variant namespaces.

### Step 2: `ProductCarouselForm.tsx` — Make variant-aware

- Add variant selector dropdown with `"filtered-feed"` as the only option
- Wrap current form body in a variant switch:
  ```tsx
  switch (section.variant) {
      case "filtered-feed":
          return <FilteredFeedForm ... />;
  }
  ```
- Extract the current form body into a `FilteredFeedForm` sub-component
- Pass `onUpdateField("variant", ...)` from parent
- Update all comments to say "variant-specific form"

### Step 3: `CategoryCarouselForm.tsx` — Make variant-aware

- Same treatment: add variant selector, `"curated-cards"` only option
- Extract current form body into `CuratedCardsForm` sub-component
- Variant switch block for future extensibility

### Step 4: `HomepageEditor.tsx` — Wire variant defaults

- New `product_carousel` section → default `variant: "filtered-feed"`
- New `category_carousel` section → default `variant: "curated-cards"`
- Load from Sanity → backfill `variant: null` to the default for that type
- Pass `onUpdateField("variant", ...)` to both carousel form components

### Step 5: `sectionToRaw` — Fallback variant

Add fallback if variant is missing:

```ts
variant: section.variant ?? defaultVariantForType(section.type),
```

### Step 6: Deploy Sanity schema

Run `npx sanity schema deploy` from `studio-athletica/`. The source already has `variant` and `snapshot` fields on all three types, but the deployed schema is missing:
- `variant` and `snapshot` on `product_carousel`
- `variant` and `snapshot` on `category_carousel`
- The entire `category_carousel` type from sections array

### Step 7: Verify

- Open each carousel section → see variant label and selector
- Edit and save → data persists with correct variant
- Existing sections with `variant: null` get backfilled on load
- New sections get the default variant
- `category_grid` still works (no regressions)

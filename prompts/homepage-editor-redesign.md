# Homepage Editor — Redesign Plan

## The Big Idea

Currently, the Homepage Editor shows **everything at once** — all banners, all sections, all item forms, all previews — on one long, crowded page. This makes it hard to use, especially on smaller screens or when you have many sections.

The new design splits the page into two layers:

1. **The Overview** — A clean list of all sections. Each section shows a small preview and an **Edit** button. Nothing else. No forms, no inputs.
2. **The Edit Popup** — When you click the Edit button, a large popup opens and covers most of the screen. Inside the popup: all the form fields for that section **plus** a full-size live preview.

This way, you focus on one section at a time, and the main page is never cluttered.

---

## Step 1: Fix the AutoSuggest URL bug

**Problem:** `suggestRoutes` returns `/products/[object Object]` because it fetches a slug object instead of a plain text string.

**Fix:** Change the GROQ query to ask for `url_slug.current` (the text part of the slug) instead of `url_slug` (the whole object). This is a one-line fix in `suggestions.ts`. Every link AutoSuggest in the editor will immediately work correctly.

**Test:** Open the editor, type in any link field, check that suggestions look like `/products/nike-phantom` and not `/products/[object Object]`.

---

## Step 2: Build the Overview page

Replace the current inline form layout with a clean overview:

- Each banner or section is shown as a **compact card** with:
  - The section title and type
  - A **small preview thumbnail** (the section rendered at a reduced size)
  - An **Edit button**
- No form fields visible on the overview page
- "Add Banner" and "Add Section" buttons stay at the top
- The "Save All" button stays in the top toolbar

The main page is now just a scrollable list of cards with edit buttons. Nothing more.

---

## Step 3: Build the Edit Popup

The edit popup is a large overlay that appears when you click Edit on any section. It should:

- Cover the screen from edge to edge with a dark backdrop
- Have a **Close** button (X) in the top-right corner
- Have a **Save** button at the bottom
- Be scrollable if the form is tall

Inside the popup, two panels side by side (or stacked on small screens):

**Left panel (or top) — Form fields:**
- For Category Grid sections: title, background, view all link, view all label, then the items
- For Product Carousel sections: subtitle, sort order, limit, link, link label, and all filter fields
- For Category Carousel sections: auto switch time, then the cards
- For Banners: title, subtitle, button text, link, gradient, accent color, image

**Right panel (or bottom) — Live Preview:**
- Shows the section at full size (or as close to it as the popup allows)
- Updates in real time as you change the form fields
- No scaling down to 60%

---

## Step 4: Build the nine variant-specific item forms

Each Category Grid variant gets its own form template. This means each variant has a fixed number of item slots, and each slot has the specific fields that variant needs.

**The seven fixed variants (items cannot be added or removed):**

1. **Grid 4 Equal** — 4 items, each with: label, link, background, text color, image
2. **Grid 3 Bordered** — 3 items, each with: label, link, background, image
3. **Asymmetric 3-2** — 2 items, each with: label, link, image
4. **Asymmetric 2 Split** — 2 items, each with: label, link, image
5. **Split 1-2** — 2 items, each with: label, link, image
6. **Grid Tiles Dark** — 4 items, each with: label, link, background, text color, accent, image
7. **Stacked Banners** — 2 items, each with: label, link, background, text color, image

**The two flexible variants (items can be added, removed, and reordered):**

8. **Scroll Brands** — minimum 3, maximum 10 items. Each item: label, link, image. Has Add, Remove, and Reorder buttons.
9. **Scroll Categories** — minimum 3, maximum 10 items. Each item: label, link, image. Has Add, Remove, and Reorder buttons.

Each variant form is hardcoded with the right number of item slots and the right fields. When you select a variant, the form changes to match that variant's template.

---

## Step 5: Category Carousel editing

The Category Carousel has only one variant. It always has:

- A minimum of 3 cards
- No maximum limit (editor can add as many as they want)
- Each card: title, subtitle, link, gradient, emoji, image
- Add and Remove buttons for cards

The edit popup shows the card list on the left and the carousel preview on the right.

---

## Step 6: Product Carousel editing

The Product Carousel has no items or cards. It only has filter settings:

- Subtitle, Sort Order, Limit
- Link and Link Label
- Category, Brand, Model, Traction filters
- Min and Max Price

The edit popup shows the filter form on the left and the product carousel preview on the right.

---

## Step 7: Save All — keep as is, but make it consistent

The current "Save All" button already works well. Keep it. But also add the same pattern to other admin editors that need it (Navigation Editor, Product Form, etc.) so every editor has the same "Save All" → "Saved!" flow.

---

## Step 8: After the redesign — write tests

Once the new design is built, write Playwright tests that check:

1. The overview page loads with all sections listed
2. Clicking Edit opens the popup
3. The popup shows form fields for the correct section type
4. Changing a field updates the preview in real time
5. Saving works and shows the "Saved!" message
6. Validation catches missing required fields
7. Adding and removing items (for scroll variants) works correctly
8. Reordering items works correctly

---

## Files that will be affected

- `src/components/admin/HomepageEditor.tsx` — Major rewrite. Split into Overview + Edit Popup.
- `src/lib/actions/suggestions.ts` — Fix the one-line GROQ bug.
- `src/lib/actions/homepage.ts` — Fix _key generation, add validation to Save All.
- New files:
  - `CategoryGridForm.tsx` — The popup form for category grid sections (or one per variant)
  - `ProductCarouselForm.tsx` — The popup form for product carousel sections
  - `CategoryCarouselForm.tsx` — The popup form for category carousel sections
  - `BannerForm.tsx` — The popup form for banner editing
  - `EditPopup.tsx` — The reusable popup wrapper component

---

## What stays the same

- The `HeroCarousel`, `CategorySection`, `CategoryCarousel`, and `ProductCarousel` preview components are not changing.
- The `AutoSuggest`, `ImageSelector`, and `InfoTooltip` components are not changing.
- The Sanity data structure (hero_carousel, sections array) is not changing.
- The server actions (`saveHomepage`, `getPreviewProducts`, etc.) are mostly staying the same.

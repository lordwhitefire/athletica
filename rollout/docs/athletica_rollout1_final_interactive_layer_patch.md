# ATHLETICA — ROLLOUT 1 FINAL UI + INTERACTIVE LAYER PATCH

## Purpose

Final patch for the complete interactive layer across:
1. Customer Product Details
2. Admin Product Management
3. Add/Edit Product modal
4. Product Database
5. Analytics

The UI must not be a static mockup. Every visible control needs a real state and outcome.

---

## 1. GLOBAL VISUAL CONTRACT

```text
Background: #000000
Accent: #d1fd40
Primary text: #ffffff
Maximum customer/admin composition: 1440px
Alignment: centered
```

Customer Product Details:
- ATHLETICA-only minimal header
- no navigation
- no search
- no cart
- no account
- no breadcrumbs
- no customer footer
- no white surfaces
- white is text only
- never expand beyond 1440px

At 1680px, 1920px, 2560px+:
```css
.shell {
  width: 1440px;
  max-width: 1440px;
  margin-inline: auto;
}
```
Do not add wider desktop breakpoints.

---

## 2. SHARED ACTION STATES

```ts
type ActionState = "idle" | "loading" | "success" | "error";

type AsyncState<T> = {
  status: ActionState;
  data?: T;
  error?: string;
};
```

Every mutation must expose:
- idle
- busy/loading
- success
- error

Busy buttons are disabled and show progress text. Never allow double submission.

---

## 3. SHARED TOAST SYSTEM

Implement a reusable `ToastViewport`.

```tsx
type Toast = {
  id: string;
  kind: "success" | "error" | "info";
  title: string;
  message?: string;
};

function ToastViewport({ toasts, onDismiss }: {
  toasts: Toast[];
  onDismiss: (id: string) => void;
}) {
  return (
    <div className="toast-viewport" aria-live="polite">
      {toasts.map(t => (
        <div className={`toast toast--${t.kind}`} key={t.id} role="status">
          <div>
            <strong>{t.title}</strong>
            {t.message && <p>{t.message}</p>}
          </div>
          <button onClick={() => onDismiss(t.id)} aria-label="Dismiss">×</button>
        </div>
      ))}
    </div>
  );
}
```

Success messages:
- Product created
- Product updated
- Product deleted
- Product published
- Product unpublished
- Changes saved

Errors:
- Unable to create product
- Unable to save changes
- Unable to delete product
- Unable to update status
- Unable to load products
- Unable to load analytics

---

## 4. CONFIRMATION DIALOG

All destructive actions require confirmation:
- product delete
- bulk delete if legacy UI exposes it
- any future destructive product action

Never delete on first click.

```tsx
<ConfirmDialog
  open={confirm.open}
  title="Delete “X/Speedportal.3-LL-FG”?"
  description="This will permanently remove the product from the catalog."
  confirmLabel="Delete Product"
  busy={deleteState === "loading"}
  onCancel={closeConfirm}
  onConfirm={confirmDelete}
/>
```

Dialog behavior:
- focus trap
- Escape closes when idle
- Escape is ignored while submitting
- restore focus to triggering control
- background cannot be interacted with

---

# 5. CUSTOMER PRODUCT DETAILS — INTERACTIVE LAYER

## Image gallery

```ts
const [activeImage, setActiveImage] = useState(0);
```

Thumbnail click changes hero image and active lemon border.

Keyboard:
- ArrowLeft = previous
- ArrowRight = next
- Home = first
- End = last

Gallery image click also changes the hero.

Broken image:
```text
IMAGE UNAVAILABLE
```
on a black/dark fallback surface.

## Shop Product

States:
```text
SHOP PRODUCT
OPENING...
OPENED
TRY AGAIN
```

Flow:
```text
click
→ Amazon Affiliate Service
→ loading
→ open generated affiliate URL
```

Never construct Amazon URLs inside the component.

Failure must visibly report the error.

## Customer loading/error states

Loading:
- black-background geometry-matching skeleton

Not found:
```text
PRODUCT NOT FOUND
This product is no longer available.
```

Error:
```text
UNABLE TO LOAD PRODUCT
[TRY AGAIN]
```

Customer queries expose published products only.

---

# 6. CUSTOMER RESPONSIVE BEHAVIOR

Desktop:
```text
Hero: image | product information
Story | benefits
Specs | gallery
Inside box | collection
```

Tablet:
- hero stacks where required
- story/benefits stack
- specs/gallery stack

Phone:
```text
logo
image
thumbnails
product information
CTA
story
benefits
specs
gallery
inside box
collection
```

No horizontal page overflow.

---

# 7. PRODUCT DATABASE / ADMIN

Route:
```text
/admin/products
```

Core controls:
- Add Product
- Search
- Status filter
- Sort
- Pagination
- Open/Edit
- Publish/Unpublish
- Delete

## Search

Search:
```text
name
id
slug
color
```

Typing updates visible results.

No results:
```text
NO PRODUCTS FOUND
Try another search term or clear the filter.
[CLEAR SEARCH]
```

## Status filter

```text
All Statuses
Published
Unpublished
```

Admin default = all statuses.

Customer default = published only.

## Sort

```text
Newest
Oldest
Name A–Z
Name Z–A
Price Low–High
Price High–Low
```

Changing search/filter/sort resets page to 1.

## Pagination

```ts
const pageSize = 8;
```

Show:
```text
Showing 1 to 8 of 24 products
```

Disable previous on first page and next on last page.

If deletion empties the current page, move back one page.

---

# 8. PRODUCT ROW ACTIONS

Every product exposes:
```text
Open
Edit
Publish / Unpublish
Delete
```

Product name links to:
```text
/admin/products/:id/edit
```

Edit must load the current server record, not stale mock data.

---

# 9. PUBLISH / UNPUBLISH

Flow:
```text
click
→ Publishing... / Unpublishing...
→ server confirms
→ table status updates
→ success toast
```

Failure:
```text
row remains unchanged
error toast
button returns to idle
```

Publish/unpublish is not destructive and does not require confirmation.

---

# 10. DELETE

Flow:
```text
Delete
→ confirmation dialog
→ Delete Product
→ Deleting...
→ server confirmation
→ row removed
→ success toast
```

Failure:
```text
row remains
error toast
```

Never silently fail.

---

# 11. ADD PRODUCT MODAL

Click:
```text
+ ADD PRODUCT
```

opens a responsive modal/sheet.

Sections:
```text
IDENTITY
DESCRIPTION
KEY BENEFITS
TECHNICAL DETAILS
ATTRIBUTES
SIZES
IMAGES
SEO
TAGS
```

Fields:

Identity:
```text
Product ID
Name
Slug
Status
Gender
Color
ASIN
SKU
```

Description:
```text
Collection
Tagline
Subtitle
Intro
```

Technical:
```text
Adjustment
Range
Sole Type
Upper Material
Traction
Price
```

Sizes:
```text
sizes[]
sizes_detail
```

Images:
```text
main image
gallery images
```

SEO:
```text
SEO title
SEO description
keywords
```

Tags:
```text
tags[]
```

---

# 12. PRODUCT FORM INTERACTIONS

## Slug

When name changes and slug has not been manually edited:
```text
Name
→ slugify
→ Slug
```

Once manually edited, stop overwriting it.

Before save, ensure uniqueness using the existing service.

## SKU

SKU is optional input.

If empty:
```text
auto-generate SKU from name/model/slug
```

Never reject a product because SKU was omitted.

## ASIN

ASIN is optional.

CRITICAL:
```ts
// WRONG
asin: null
```

Do not erase an existing ASIN during unrelated saves.

Only change ASIN when the user intentionally changes it.

---

# 13. BENEFITS EDITOR

Each benefit:
```text
Title
Text
Icon
```

Controls:
```text
+ Add Benefit
Remove
Move Up
Move Down
```

Recommended maximum = 8.

Do not silently discard data.

---

# 14. SIZES EDITOR

Support:
```text
sizes
sizes_detail
```

Example:
```text
[7] [8] [9] [10] [11]
US Men's sizing
```

Add/remove sizes.

Editing another field must not erase sizes.

---

# 15. IMAGE INTERACTIONS

Support:
```text
Add
Remove
Reorder
Set as main
```

Show:
```text
MAIN
```
on the main image.

Upload states:
```text
Uploading...
Uploaded
Upload failed
Retry
```

If upload infrastructure is unavailable, support image URLs as the prototype fallback.

Validate URL and show a preview.

Broken preview:
```text
Unable to preview image
```

Dashboard quick-create and Product Database quick-create must use the same image interaction model.

---

# 16. FORM VALIDATION

On submit:
```text
validate
→ if errors:
   stay open
   show field errors
   focus first invalid field
```

Examples:
```text
Name is required
Price must be greater than 0
Slug is required
```

ASIN is NOT required.

Do not close the modal on validation errors.

---

# 17. SAVE STATES

Create:
```text
Create Product
→ Creating...
→ saved
→ modal closes
→ table updates
→ success toast
```

Failure:
```text
modal stays open
entered values remain
error visible
button returns to idle
```

Edit:
```text
Save Changes
→ Saving...
→ Saved
→ editor updates
```

Prevent double-submit.

---

# 18. DIRTY FORM STATE

Track:
```ts
isDirty = hasChanges(initialProduct, formState);
```

If user closes while dirty:
```text
UNSAVED CHANGES

You have changes that haven't been saved.

[Keep Editing] [Discard Changes]
```

If clean, close immediately.

Cancel/discard restores original values.

Opening Add Product always starts from a fresh form.

---

# 19. PRODUCT DATABASE LOADING / ERROR / EMPTY

Loading:
- geometry-matching row skeletons
- metric skeletons

Error:
```text
PRODUCTS COULDN'T BE LOADED
Something went wrong while loading the catalog.
[TRY AGAIN]
```

Empty:
```text
PRODUCT DATABASE
No products yet.
[+ ADD PRODUCT]
```

Never display fake rows in the real-data state.

---

# 20. ANALYTICS

Route:
```text
/admin/analytics
```

Rollout 1 metrics ONLY:
```text
Total Product Views
Total Amazon Clicks
CTR
Views per Product
Clicks per Product
```

Do not add:
```text
traffic sources
funnels
search analytics
brand analytics
category analytics
advanced attribution
```

## Date range

Presets:
```text
Last 7 days
Last 30 days
Last 90 days
```

Changing range:
```text
loading
→ fetch
→ update KPIs
→ update chart
→ update product ranking
```

---

# 21. ANALYTICS CHART

If the current visual has metric tabs:
```text
Views
Clicks
CTR
```

Clicking each tab changes the active series.

Active control:
```text
#d1fd40
```

No unrelated chart colors.

Tooltip on hover/focus:
```text
Aug 24
Views
2,014
```

Provide an accessible tabular representation for keyboard/screen-reader users.

---

# 22. TOP PRODUCTS

Show:
```text
Rank
Product
Views
Clicks
CTR
```

Clicking a product opens:
```text
/admin/products/:id/edit
```

---

# 23. ANALYTICS STATES

Loading:
- KPI skeletons
- chart skeleton
- ranking skeletons

No data:
```text
NO PRODUCT ACTIVITY YET
Analytics will appear after customers begin viewing products.
```

Error:
```text
ANALYTICS COULDN'T BE LOADED
[TRY AGAIN]
```

Never turn an API failure into fake zeros.

---

# 24. SERVICE BOUNDARIES

UI must use service abstractions.

Product:
```ts
getProductBySlug(slug)
getProductById(id)

listProducts({
  search,
  status,
  sort,
  page,
  pageSize,
})

createProduct(input)
updateProduct(id, input)
deleteProduct(id)

publishProduct(id)
unpublishProduct(id)
```

Analytics:
```ts
getProductAnalytics({ from, to })
getProductPerformance({ from, to, productId })
```

Amazon:
```ts
amazonAffiliateService.getProductUrl(product.id)
```

Do not duplicate Supabase queries inside components.

---

# 25. DATA CONSISTENCY

Mutation:
```text
UI
→ service
→ Supabase
→ server confirms
→ update local UI
→ success
```

The Product Database and Product Details must use the same authoritative product record.

Admin:
```text
published + unpublished
```

Customer:
```text
published only
```

---

# 26. KEYBOARD / ACCESSIBILITY

Required:
```text
Tab
Shift+Tab
Enter
Space
Escape
ArrowLeft
ArrowRight
Home
End
```

Modal:
- focus trap
- Escape closes when safe
- focus restored after close

Dropdown:
- ArrowUp/ArrowDown
- Enter
- Escape

All controls require visible focus.

---

# 27. MOBILE ADMIN

At phone widths:

Product Database:
```text
search
filter
sort
```
stack vertically.

Product rows may become cards showing:
```text
Product
Status
Price
Edit
Delete
```

Do not squeeze a desktop table into 320px.

Add Product becomes a full-height sheet with a sticky bottom action area:
```text
Cancel
Create Product
```

Analytics:
```text
KPIs
↓
chart
↓
top products
```

---

# 28. NO-DEAD-CLICK RULE

Every visible control must:
```text
change state
open UI
navigate
submit
cancel
or show feedback
```

If an interaction is not implemented, remove the control.

---

# 29. NO-SILENT-FAILURE RULE

Never swallow errors.

Bad:
```ts
try {
  await save();
} catch {}
```

Correct:
```text
catch
→ error state
→ visible message
→ recover/retry
```

---

# 30. NO-FAKE-DATA RULE

Mocks are acceptable only for visual prototype mode.

When real services are connected:
- no fabricated counts
- no fabricated analytics
- no fake success
- no success before server confirmation

---

# 31. FINAL INTERACTION MATRIX

| Surface | Interaction | Required result |
|---|---|---|
| Product Details thumbnail | click | hero changes |
| Product Details gallery | click | hero changes |
| Shop Product | click | affiliate flow |
| Product load | fail | visible retry |
| Add Product | click | modal opens |
| Product search | type | filtered results |
| Status | change | filtered results |
| Sort | change | reordered results |
| Product name | click | editor |
| Edit | click | editor |
| Publish | click | status mutation |
| Unpublish | click | status mutation |
| Delete | click | confirmation |
| Confirm delete | click | mutation |
| Pagination | click | page changes |
| Clear search | click | reset |
| Add image | click | image added/uploaded |
| Remove image | click | image removed |
| Set main image | click | main changes |
| Benefit add/remove | click | list changes |
| Size add/remove | click | list changes |
| Save | click | validate + mutate |
| Dirty close | click | discard confirmation |
| Analytics date | change | refresh data |
| Chart metric | click | series changes |
| Chart point | hover/focus | tooltip |
| Analytics product | click | editor |
| Retry | click | request repeated |

---

# 32. FINAL ACCEPTANCE CHECKLIST

## Product Details
- [ ] Fully interactive image gallery
- [ ] Keyboard gallery controls
- [ ] Shop CTA has real states
- [ ] Loading/error/not-found states
- [ ] Responsive
- [ ] 1440px hard maximum
- [ ] No navigation
- [ ] No footer
- [ ] Black/lemon/white-text visual system

## Product Database
- [ ] Search
- [ ] Status filter
- [ ] Sort
- [ ] Pagination
- [ ] Add Product
- [ ] Edit
- [ ] Publish
- [ ] Unpublish
- [ ] Delete confirmation
- [ ] Loading/error/empty states
- [ ] Retry
- [ ] Mobile cards/layout

## Add/Edit
- [ ] Complete product record
- [ ] SKU auto-generation
- [ ] ASIN optional
- [ ] ASIN preservation
- [ ] Sizes editor
- [ ] Image management
- [ ] Benefit editor
- [ ] Validation
- [ ] Busy/success/error states
- [ ] Dirty-state protection
- [ ] Keyboard accessibility

## Analytics
- [ ] Views
- [ ] Amazon clicks
- [ ] CTR
- [ ] Per-product views/clicks
- [ ] Date range
- [ ] Chart switching
- [ ] Tooltips
- [ ] Product navigation
- [ ] Loading/error/empty states
- [ ] Retry
- [ ] No fabricated production data

---

# 33. IMPLEMENTATION ORDER

```text
Shared action state
↓
Toast system
↓
Confirmation dialog
↓
Modal/focus handling
↓
Product Service bindings
↓
Product Database interactions
↓
Add/Edit Product
↓
Product Details interactions
↓
Analytics interactions
↓
Responsive states
↓
Loading/error/empty states
↓
Keyboard accessibility
↓
End-to-end verification
```

## Final principle

Rollout 1 is complete only when a user can:

```text
Product Database
→ Add Product
→ fill form
→ add images
→ Create
→ see success
→ see product in database
→ Edit
→ Publish/Unpublish
→ Delete with confirmation
```

and:

```text
Product Details
→ inspect images
→ read product story
→ inspect benefits/specs
→ Shop Product
```

and:

```text
Analytics
→ choose date range
→ inspect views
→ inspect clicks
→ inspect CTR
→ identify top products
→ open a product
```

Every visible interaction must have a real outcome and every asynchronous action must have a visible state.

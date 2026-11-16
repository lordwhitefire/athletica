## Purpose

The Production admin/office is the operational interface for the Production app. It is intentionally smaller than the Development app's office and covers four surfaces: sign-in, the Product Database, the Product Editor (Add/Edit), and Basic Analytics. Every visible control must have a real state and outcome — no dead clicks, no silent failures, no fabricated data.

## ADDED Requirements

### Requirement: Production admin routes (the office)
The system SHALL provide Production admin routes:
- `/admin/login` — office sign-in (after auth is live)
- `/admin/products` — Product Database
- `/admin/products/:id/edit` — Product Editor
- `/admin/analytics` — Basic Analytics

These routes SHALL operate on the `rollout` schema and SHALL NOT expose the Development app's admin routes in production.

#### Scenario: Product Database route
- **WHEN** an admin opens `/admin/products`
- **THEN** they see the Production Product Database

#### Scenario: Editor route
- **WHEN** an admin opens `/admin/products/:id/edit`
- **THEN** they see the editor for that product loaded from the server record

#### Scenario: Analytics route
- **WHEN** an admin opens `/admin/analytics`
- **THEN** they see Production Basic Analytics

#### Scenario: Development-only admin route
- **WHEN** an admin opens a Development-only admin route on the Production app
- **THEN** the app returns 404 and does not expose the Development office

### Requirement: Admin authentication and route protection
The office SHALL be invite-only. It SHALL use Supabase Auth with public sign-ups disabled and the admin role in `app_metadata.role = 'admin'`. Every admin page, server action, and `/api/admin/*` route SHALL call `getUser()` and verify the role. `@supabase/ssr` SHALL provide the cookie-based server client. Until auth is live, `/admin/*` and `/api/admin/*` SHALL return 404. After auth is live, `/admin/login` SHALL be public; unauthenticated page requests SHALL redirect there; API requests SHALL return 401; authenticated non-admins SHALL get 404. No route or UI SHALL create admins. The service-role key SHALL stay server-only.

#### Scenario: Admin routes dark until auth is live
- **WHEN** auth has not been built yet
- **THEN** every `/admin/*` and `/api/admin/*` request returns 404

#### Scenario: Unauthenticated API rejected
- **WHEN** an anonymous request hits `/api/admin/products`
- **THEN** it returns 401 and no admin data

#### Scenario: Non-admin gets 404
- **WHEN** an authenticated non-admin opens `/admin/products`
- **THEN** the app returns 404

#### Scenario: No public admin creation
- **WHEN** a visitor looks for a sign-up or admin-creation route
- **THEN** none exists; admins are invited in Supabase

#### Scenario: Service key never reaches the client
- **WHEN** the admin client is created
- **THEN** the service-role key stays server-only

### Requirement: Product Database interactions
The Production Product Database SHALL support Add Product, Search, Status filter, Sort, Pagination, Open/Edit, Publish/Unpublish, and Delete. Publish/unpublish SHALL mutate status without confirmation. Delete SHALL require a confirmation dialog and never delete on first click.

#### Scenario: Add Product opens modal
- **WHEN** an admin clicks + ADD PRODUCT
- **THEN** the Add Product modal opens

#### Scenario: Publish without confirmation
- **WHEN** an admin clicks Publish on a row
- **THEN** the product status mutates to published with a success toast; failure keeps the row unchanged and shows an error toast

#### Scenario: Delete requires confirmation
- **WHEN** an admin clicks Delete on a row
- **THEN** a confirmation dialog opens; only confirming deletes the product; failure keeps the row and shows an error toast

### Requirement: Product Editor (Add/Edit Product)
The system SHALL provide a complete product form covering Identity (id, name, slug, status, gender, color, ASIN, SKU), Description (collection, tagline, subtitle, intro), Key Benefits, Technical Details, Attributes, Sizes, Images, SEO, and Tags.

#### Scenario: Complete product record
- **WHEN** an admin creates or edits a product
- **THEN** they can edit all sections of the product record

#### Scenario: Slug auto-generation
- **WHEN** the name changes and the slug has not been manually edited
- **THEN** the slug auto-generates from the name via slugify; once manually edited it stops being overwritten

#### Scenario: SKU auto-generation
- **WHEN** SKU is left empty
- **THEN** a SKU is auto-generated from name/model/slug; SKU omission never rejects a product

#### Scenario: ASIN optional and preserved
- **WHEN** an admin edits a product without touching ASIN
- **THEN** an existing ASIN is preserved and not erased by an unrelated save; ASIN is never required

### Requirement: Publish without affiliate configuration
An admin SHALL be able to publish a product without an ASIN or real Amazon tag/store. The customer page SHALL render the product with the CTA disabled; publishing SHALL NOT be blocked by missing affiliate configuration.

#### Scenario: Publish before affiliate details
- **WHEN** an admin publishes a product with no ASIN
- **THEN** the product is published and the customer page shows the disabled CTA

### Requirement: Product form validation and save states
The system SHALL validate the product form on submit (name required, slug required; price MAY be empty), keep the modal open on validation errors, focus the first invalid field, and expose busy/success/error states on save. The form SHALL prevent double submission.

#### Scenario: Validation errors keep modal open
- **WHEN** an admin submits a form with validation errors
- **THEN** the modal stays open, field errors show, and the first invalid field is focused

#### Scenario: Price is optional
- **WHEN** an admin saves a product with an empty price
- **THEN** the product saves successfully; price is not required

#### Scenario: Save success closes modal
- **WHEN** an admin submits a valid create form
- **THEN** the modal closes, the table updates, and a success toast shows

#### Scenario: Save failure stays open
- **WHEN** a save fails
- **THEN** the modal stays open, entered values remain, the error is visible, and the button returns to idle

### Requirement: Price is internal-only
The admin MAY expose an optional price column and price sort. Price SHALL NOT be required and SHALL NOT appear on the customer product page.

#### Scenario: Internal price hidden from customers
- **WHEN** a product has an internal price
- **THEN** the customer product page does not display it

### Requirement: Dirty-form protection
The system SHALL track whether the product form has unsaved changes. Closing a dirty form SHALL show an UNSAVED CHANGES dialog with Keep Editing / Discard Changes. A clean form closes immediately. Opening Add Product always starts fresh.

#### Scenario: Dirty close shows warning
- **WHEN** an admin closes a form with unsaved changes
- **THEN** an UNSAVED CHANGES dialog appears; Discard restores original values

#### Scenario: Clean close is immediate
- **WHEN** an admin closes a clean form
- **THEN** it closes immediately without a warning

### Requirement: Benefits and sizes editors
The system SHALL provide editors for key benefits (title, text, icon; add/remove/move up/move down) and sizes (add/remove, with a sizes detail label). Editing other fields SHALL NOT erase benefits or sizes.

#### Scenario: Add benefit
- **WHEN** an admin clicks + Add Benefit
- **THEN** a new benefit row appears and is saved with the product

#### Scenario: Sizes preserved
- **WHEN** an admin edits another field after setting sizes
- **THEN** the sizes are preserved

### Requirement: Image management
The system SHALL support add, remove, reorder, and set-as-main for product images, with a MAIN badge on the primary image. It SHALL accept Sanity-hosted image URLs or uploads, reject non-Sanity domains with a clear error, show a preview, and report broken previews.

#### Scenario: Set main image
- **WHEN** an admin marks an image as main
- **THEN** the MAIN badge moves to that image

#### Scenario: Non-Sanity URL rejected
- **WHEN** an admin enters an image URL from a non-Sanity host
- **THEN** the editor rejects it with a clear error

#### Scenario: Broken preview
- **WHEN** an image URL cannot be previewed
- **THEN** the editor shows "Unable to preview image"

### Requirement: Admin API and media protection
Every `/api/admin/products`, `/api/admin/products/[id]`, and `/api/admin/media/*` request SHALL require an authenticated admin.

#### Scenario: Anonymous media request rejected
- **WHEN** an anonymous request hits `/api/admin/media/*`
- **THEN** it returns 401 and no media is changed or returned

### Requirement: Nested confirmations and accessibility
The system SHALL provide a confirmation dialog for destructive actions with focus trap, Escape-close-when-idle, restore-focus-to-trigger, and background disabled. All controls SHALL support Tab, Shift+Tab, Enter, Space, Escape, and visible focus.

#### Scenario: Confirmation dialog focus
- **WHEN** a confirmation dialog opens
- **THEN** focus is trapped inside, Escape closes when idle, and focus returns to the trigger on close

### Requirement: No dead clicks and no silent failures
Every visible control in the Rollout Admin SHALL change state, open UI, navigate, submit, cancel, or show feedback. If an interaction is not implemented, the control SHALL be removed. Errors SHALL never be swallowed; every failure SHALL show a visible, recoverable message.

#### Scenario: Dead control removed
- **WHEN** a control has no implemented behavior
- **THEN** it is removed rather than left unresponsive

#### Scenario: Failure is visible
- **WHEN** an async action fails
- **THEN** an error state with a visible message and retry is shown, never a silent catch

### Requirement: No fake data
The system SHALL use real server data once services are connected. Mock data is allowed only for visual prototype mode; when real services are connected there SHALL be no fabricated counts, fabricated analytics, fake success, or success before server confirmation. Never turn API failure into fake zeros.

#### Scenario: Real data once connected
- **WHEN** real services are connected
- **THEN** the admin shows real server records and no fabricated values

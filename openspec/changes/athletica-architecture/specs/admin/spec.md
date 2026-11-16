## Purpose

The business operating tool for a one-person operator — dashboard, catalog management, bulk import, content management, data quality, analytics views, and affiliate settings — where product operations never require Sanity Studio.

## ADDED Requirements

### Requirement: Admin is a business operating tool
The system SHALL provide an admin treated as a business operating tool, not just a CMS. It SHALL help the owner operate the affiliate business without needing to understand Sanity, databases, code, or technical maintenance, and SHALL NOT depend on opening Sanity Studio for normal product management. The admin screens SHALL exist as application pages (dashboard, catalog, content, analytics, affiliate, system) with full interactions, backed by real data.

#### Scenario: Product managed without Sanity Studio
- **WHEN** the owner edits a product in the admin
- **THEN** the change is saved to Supabase and no Sanity Studio interaction is required

#### Scenario: Admin covers business tasks
- **WHEN** the owner needs to run the business
- **THEN** the admin provides screens for dashboard, catalog, content, analytics, affiliate, and system tasks

### Requirement: Admin data pages render on the server (owner decision 2026-08-24)
Every admin page that displays catalog or content data SHALL be a React Server Component that fetches its data directly during server rendering and passes it to client components as props. Client components SHALL handle interactivity only (filters, sorting UI, pagination controls, dialogs, action buttons) and SHALL NOT fetch a page's initial list data. Initial reads SHALL NEVER depend on browser-executed JavaScript (no post-render effect firing dynamic-imported server actions for reads). Mutations remain server actions and each mutation SHALL refresh the affected server-rendered data via revalidation, so lists update without a manual browser reload. A failed server-side fetch SHALL render a visible error state with retry; an empty dataset SHALL render its normal empty state.

#### Scenario: Client navigation arrives populated
- **WHEN** the owner navigates via the sidebar to any admin data page
- **THEN** the page arrives with its data already rendered — the browser fires ZERO read requests for the initial list

#### Scenario: Mutation refreshes the visible list
- **WHEN** the owner creates, edits, or deletes an item from an admin data page
- **THEN** the server-rendered list reflects the change without a manual full-page reload

#### Scenario: Server fetch fails loudly
- **WHEN** the database query behind an admin data page fails
- **THEN** the page renders a visible error state with retry instead of an empty success

#### Scenario: Deep link restores a filtered view
- **WHEN** the owner opens a URL carrying filter/pagination parameters for a large list (e.g., products)
- **THEN** the server component renders that exact filtered view directly

### Requirement: Product admin
The system SHALL let the owner search products, filter products, edit products, publish/unpublish products, assign categories, assign brands, add/change ASIN, manage images, edit product information (including sizes and product-distinct details), delete products, and perform bulk actions. The admin SHALL query Supabase directly through the product data layer. The product list SHALL default to showing all statuses (published and unpublished).

- **ASIN is per-product**: the ASIN field belongs to one product only and SHALL be edited per product; bulk actions SHALL NOT include product-distinct fields such as ASIN.
- **Bulk actions** SHALL cover only fields shared across products (status, category, brand, delete).
- **Full editor reachable from the catalog**: the full product editor (images, sizes, description, technical details) SHALL be reachable from the product list in one click; quick-edit dialogs are for fast field tweaks only.

#### Scenario: Search and filter products
- **WHEN** the owner searches or filters the product list
- **THEN** the admin returns matching products from Supabase through the product service

#### Scenario: Publish/unpublish product
- **WHEN** the owner publishes or unpublishes a product
- **THEN** the product status is updated in Supabase and customer-facing queries reflect the change

#### Scenario: Assign category and brand
- **WHEN** the owner assigns a category or brand to a product
- **THEN** the product's classification is updated in the product database

#### Scenario: Add or change ASIN
- **WHEN** the owner adds or changes a product's ASIN
- **THEN** the product record in Supabase is updated, and saving other product fields never erases an existing ASIN

#### Scenario: Unpublished products visible by default
- **WHEN** the owner opens the product list without choosing a status filter
- **THEN** both published and unpublished products are shown

#### Scenario: Full editor reached from the catalog
- **WHEN** the owner clicks a product in the catalog
- **THEN** the full product editor opens (images, sizes, description, technical details) without typing a URL

### Requirement: Model hierarchy management
The system SHALL provide a models management surface in the admin showing the hierarchy as brand → root model → submodel → product model, with product counts on product models. The owner SHALL be able to create root models, create child models under a parent, rename, reparent, and delete models. A model referenced by products or children SHALL NOT be deletable (clear error message). Creating a second variant under a node SHALL trigger the automatic restructure: the node becomes a submodel and each variant becomes a product model (see product-catalog spec — model hierarchy with derived node types).

#### Scenario: Models page shows the tree
- **WHEN** the owner opens the models page
- **THEN** the tree shows root models, submodels, and product models with their single product per product model

#### Scenario: Variant add restructures
- **WHEN** the owner adds a product that would share a node with an existing product
- **THEN** the tree restructures so each product has its own product model, and the page reflects the new tree

#### Scenario: Protected delete
- **WHEN** the owner tries to delete a model that products or child models reference
- **THEN** the delete is blocked with a clear error message

### Requirement: Bulk import workflow
The system SHALL provide a bulk import workflow: upload, read file, validate, show errors, show preview, confirm, save to Supabase, show result. The system SHALL clearly report products that will be created, products that will be updated, duplicate products, missing ASIN, missing images, missing categories, invalid values, and failed rows. The user SHALL never have to guess whether an import worked. The validation/preview data SHALL be computed from the real Supabase catalog, never from mock constants.

**Import formats:** the upload SHALL accept Microsoft Excel workbooks (`.xlsx`) as well as CSV files (owner order 2026-08-24). Both formats flow through the SAME parse → validate → preview → confirm → save pipeline and produce identical validation and result reports; format only changes how raw rows are read, never how they are checked or saved.

#### Scenario: Excel workbook accepted
- **WHEN** the owner uploads an `.xlsx` file to the Import Center
- **THEN** it is parsed and validated exactly like a CSV upload, producing the same preview, error report, and result report

#### Scenario: Import with errors shows them before saving
- **WHEN** an uploaded file contains invalid rows
- **THEN** the system shows the errors and does not save until the owner confirms the preview

#### Scenario: Import result is explicit
- **WHEN** the owner confirms an import
- **THEN** the system saves to Supabase and shows a result report of what was created, updated, or failed — with per-row failure reasons

#### Scenario: Duplicate products reported
- **WHEN** an upload contains products that already exist
- **THEN** the system reports them as duplicates and handles them as updates when confirmed

#### Scenario: Import center shows real numbers
- **WHEN** the owner opens the import center
- **THEN** the validation report is computed from the Supabase catalog and matches direct database counts

### Requirement: Data Quality
The system SHALL provide a Data Quality area that answers "what is wrong with my catalog": counts of products missing ASIN, missing images, missing category, duplicate products, and invalid products. Each problem SHALL be clickable to view the affected products.

#### Scenario: Data Quality counts
- **WHEN** the owner opens Data Quality
- **THEN** the system shows counts such as products missing ASIN, products missing images, products missing category, duplicates, and invalid products

#### Scenario: Problem drills into affected products
- **WHEN** the owner clicks a Data Quality problem
- **THEN** the system shows the list of affected products

### Requirement: Admin dashboard
The system SHALL provide a dashboard as the owner's starting point showing catalog health (total products, active products, products needing attention, missing ASIN, missing images, missing categories), affiliate performance (Amazon clicks, top products, top brands, top categories), recent activity (recent imports, recent product updates, recent content changes), and tasks (products missing ASIN, products missing images, failed imports, other data problems). The dashboard SHALL be actionable.

#### Scenario: Dashboard shows catalog health
- **WHEN** the owner opens the dashboard
- **THEN** it shows total and active products plus products needing attention

#### Scenario: Dashboard shows tasks
- **WHEN** the owner opens the dashboard
- **THEN** it lists actionable tasks such as products missing ASIN, products missing images, and failed imports

### Requirement: Content management in admin
The system SHALL let the owner manage homepage content, navigation, and media through the admin. Homepage content and navigation SHALL be stored as text in Supabase, with navigation pointing at product-database categories. Images SHALL be uploaded to Sanity and their links stored in Supabase.

#### Scenario: Homepage content edited in admin
- **WHEN** the owner edits homepage content in the admin
- **THEN** the content is saved to Supabase and the website reflects the change without touching product data

#### Scenario: Image uploaded in admin
- **WHEN** the owner uploads an image in the admin media area
- **THEN** the image asset is stored in Sanity and its link is saved in Supabase for reference

### Requirement: Affiliate settings and link generator
The system SHALL let the owner manage Amazon settings and generate Amazon links/cart links from the admin.

#### Scenario: Affiliate settings saved
- **WHEN** the owner saves Amazon Associate settings
- **THEN** the affiliate service uses the new configuration for link generation

#### Scenario: Link generator
- **WHEN** the owner uses the link/cart generator
- **THEN** the admin produces the Amazon destination for selected products using the affiliate service

### Requirement: Admin data ownership
Each type of admin data SHALL have one owner: products, bulk import, categories, and brands go to Supabase; homepage content, navigation, and all text content go to Supabase; images go to Sanity with links stored in Supabase; analytics come from the analytics data source.

#### Scenario: Brand created in admin
- **WHEN** the owner creates a brand in the admin
- **THEN** the brand is stored in Supabase

#### Scenario: Category created in admin
- **WHEN** the owner creates a category in the admin
- **THEN** the category is stored in Supabase and product classification references it

### Requirement: Destructive actions require confirmation
Every destructive admin action (delete product, bulk delete, delete brand, delete category, delete model, delete import rows) SHALL require an explicit confirmation before executing — a confirmation dialog stating what will be deleted and how many items are affected. No destructive action SHALL execute on a single click.

#### Scenario: Delete product asks for confirmation
- **WHEN** the owner clicks delete on a product (or on a bulk selection)
- **THEN** the admin shows a confirmation dialog naming the product(s) before any row is deleted

### Requirement: Action buttons show their state
Every admin action button SHALL show distinct UI states: idle, busy (pending), success, and error. While an action runs, the button SHALL be disabled and show progress; on failure, the error SHALL be visible (inline or toast) and the button SHALL return to idle.

#### Scenario: Saving shows progress and error
- **WHEN** the owner submits a save or bulk action
- **THEN** the button shows a busy state while running, a success confirmation when done, and a visible error with idle state restored if it fails

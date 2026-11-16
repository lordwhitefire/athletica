## Purpose

The Production catalog is the self-contained, user-facing product system. It holds a small, launch-viable product set in the `rollout` schema of one shared Supabase project; the Development app uses `public`.

## ADDED Requirements

### Requirement: Self-contained production product storage
The system SHALL store products in `rollout.products` with no foreign keys to the Development hierarchy (categories, brands, models). A product SHALL carry all its own content directly (name, slug, color, gender, optional price, description, box contents, sizes, benefits, technical details, images, ASIN, SEO, tags).

#### Scenario: Product stored independent of hierarchy
- **WHEN** an admin creates a product
- **THEN** it is stored in `rollout.products` with all content fields inline and no reference to any Development category, brand, or model

#### Scenario: One product is enough to launch
- **WHEN** the catalog contains exactly one published product
- **THEN** the Product Details page, Product Database, and Analytics all function with that single product

### Requirement: Price is optional and internal
The catalog SHALL accept a nullable price for internal admin use. Price SHALL NOT be required and SHALL NOT be displayed on the customer product page.

#### Scenario: Product without price
- **WHEN** an admin saves a product with no price
- **THEN** the product is stored successfully and the customer page shows no price

### Requirement: Publish and unpublish
The system SHALL let an admin publish or unpublish a product. Publishing SHALL NOT require an ASIN or real Amazon tag/store. Only published products appear on the customer-facing `/product/:slug` page. The admin sees published and unpublished.

#### Scenario: Publish a product
- **WHEN** an admin publishes a product
- **THEN** it becomes visible on the customer product page

#### Scenario: Publish without affiliate details
- **WHEN** an admin publishes a product with no ASIN or missing Amazon config
- **THEN** the product is published and the customer page shows the disabled CTA

#### Scenario: Unpublish a product
- **WHEN** an admin unpublishes a product
- **THEN** it is no longer visible on the customer product page but remains in the admin Product Database

### Requirement: Production product CRUD
The system SHALL let an admin create, read, update, and delete products through the Production Admin Product Database.

#### Scenario: Create a product
- **WHEN** an admin fills the Add Product form and submits
- **THEN** a new product is created in `rollout.products` and appears in the Product Database

#### Scenario: Edit a product
- **WHEN** an admin edits an existing product
- **THEN** the changes are saved to `rollout.products`

#### Scenario: Delete a product
- **WHEN** an admin confirms deletion of a product
- **THEN** the product is removed from `rollout.products` and the Product Database

### Requirement: ASIN and derived affiliate URL
The system SHALL store the ASIN on the product record. The final affiliate destination URL SHALL be derived from the ASIN plus affiliate configuration at click time in the backend — it SHALL NOT be permanently stored on the product record. When the ASIN is missing, the customer CTA SHALL be disabled; the product SHALL still be publishable.

#### Scenario: Store ASIN only
- **WHEN** a product record is saved
- **THEN** only the ASIN is stored, not a generated affiliate URL

#### Scenario: Derive on click
- **WHEN** a customer clicks SHOP PRODUCT
- **THEN** the backend derives the affiliate URL from the stored ASIN and affiliate configuration and redirects to Amazon

#### Scenario: Missing ASIN disables the CTA
- **WHEN** a published product has no ASIN
- **THEN** the customer page shows the disabled CTA and no affiliate URL is derived

### Requirement: Production product search
The system SHALL let an admin search products by name, id, slug, and color in the Product Database.

#### Scenario: Search filters results
- **WHEN** an admin types a search term in the Product Database
- **THEN** visible products update to those matching name, id, slug, or color

### Requirement: Production product status filter and sort
The system SHALL let an admin filter by status (All, Published, Unpublished) and sort by Newest, Oldest, Name A–Z, Name Z–A, Price low–high, Price high–low. Price sorts SHALL place products with no price last.

#### Scenario: Filter by status
- **WHEN** an admin selects a status filter
- **THEN** the Product Database shows only products in that status

#### Scenario: Sort products
- **WHEN** an admin changes the sort order
- **THEN** products reorder accordingly

#### Scenario: Sort with empty prices
- **WHEN** an admin sorts by price and some products have no price
- **THEN** the empty-price products appear last

### Requirement: Production product pagination
The system SHALL paginate the Production Product Database (page size 8) and reset to page 1 when search, filter, or sort changes.

#### Scenario: Paginated product list
- **WHEN** there are more than 8 products
- **THEN** the Product Database paginates, showing page size 8 and disabling previous/next appropriately

#### Scenario: Empty-page deletion
- **WHEN** deleting a product empties the current page
- **THEN** the list moves back one page

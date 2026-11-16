## Purpose

The authoritative product catalog owned by Supabase — products, categories, brands, model hierarchy, attributes, ASINs, status, relationships, and image links — the single answer to "what is this product".

## ADDED Requirements

### Requirement: Supabase is the source of truth for product data
The system SHALL keep every important piece of product data — product ID, name, brand, category, model, description, price, gender, color, sizes, attributes, Amazon ASIN, status, slug, relationships, and image links — in the product database (Supabase). There SHALL NOT be another product database competing with Supabase (no product copies in Sanity, no product copies in local JSON files).

#### Scenario: Product lookup answered from Supabase
- **WHEN** anyone asks "what is this product"
- **THEN** the answer comes from Supabase and from no other source

#### Scenario: Filtered product query answered from Supabase
- **WHEN** anyone asks "which products match these filters"
- **THEN** the answer comes from Supabase

#### Scenario: Category membership answered from Supabase
- **WHEN** anyone asks "which products belong in this category"
- **THEN** the answer comes from Supabase

### Requirement: Complete product record
The system SHALL store for each product: unique product ID, unique slug, name, brand, category, product model reference (the terminal model node it belongs to), description, price, gender, color, sizes, product attributes, Amazon ASIN, product status, and links to its images.

#### Scenario: Product record contains image links
- **WHEN** a product record is read
- **THEN** it contains the links needed to display its images

#### Scenario: Product has unique slug
- **WHEN** two products would have the same slug
- **THEN** the system rejects the duplicate slug

### Requirement: Product status controls visibility
The system SHALL support at least the product statuses published and unpublished, and SHALL exclude unpublished products from customer-facing product queries while still showing them in the admin.

#### Scenario: Unpublished product hidden from customers
- **WHEN** a product is unpublished and a customer-facing query runs
- **THEN** the product does not appear in results

#### Scenario: Unpublished products visible by default in admin
- **WHEN** an admin user views the product list
- **THEN** unpublished products appear with their status shown, and the admin product list SHALL default to showing all statuses (published and unpublished), never silently hiding unpublished products behind a default filter

### Requirement: Product classification
The system SHALL classify products through the product database: a product has a category (required), optionally a brand, and a product model; the database SHALL answer which products belong to a category, how many products are in a category, which brands are available in a category, and which products belong under a brand/category combination.

#### Scenario: Category product count
- **WHEN** a category page asks how many products are in a category
- **THEN** the product database returns the count

#### Scenario: Brands available in a category
- **WHEN** a category page asks which brands are available in a category
- **THEN** the product database returns the distinct brands of products in that category

### Requirement: Model hierarchy with derived node types (category-anchored)
The classification doctrine (owner decision 2026-08-22, amending D13):

- **A product model belongs to its product** — it is the terminal node representing exactly that one product, not a property of any brand.
- **Category is the only required container.** Every model chain SHALL be anchored to exactly one category: walking up from any model through its parents reaches a node attached to a category.
- **Brand, root model, and submodel are optional layers.** Valid paths include, non-exhaustively: category → product model; category → brand → product model; category → brand → root model → product model; category → brand → root model → submodel → … (any nesting depth) → product model. A root model without a brand SHALL be representable.
- Models are stored as a self-referential hierarchy (each model has an optional parent model). Root models are top-level silos within their category (e.g., "Predator", "X", "Mercurial"). Sub-models represent lines (e.g., "League", "Elite", "Superfly") and MAY nest arbitrarily.
- **Products link to the terminal node — the product model. A product model references exactly one product.** Node type is derived from attachments: 0 direct products = branch (root/submodel); exactly 1 direct product = product model (terminal, no children); 2+ direct products SHALL NOT persist — the write restructures the node into a submodel and gives each variant product its own product model child (named after the node + variant).
- When a product is deleted, its product model holds zero products and no children and SHALL be removed automatically rather than lingering as an empty terminal node.

#### Scenario: Product links to product model
- **WHEN** a product is created or updated
- **THEN** its `model_id` references a model with no children and no other product attached, whose ancestor chain is anchored to the product's category

#### Scenario: Second variant restructures the tree
- **WHEN** a second product is attached to a node that already holds one product (e.g., a color variant)
- **THEN** the node becomes a submodel and both products get their own product model children; no node holds more than one direct product

#### Scenario: Product model without brand
- **WHEN** a product has no brand
- **THEN** it can still own a product model anchored directly to its category (optionally through root/submodel layers)

#### Scenario: Query all products under a root model
- **WHEN** a customer filters by "Predator"
- **THEN** the system returns all products whose product model descends from the "Predator" root model (via recursive CTE on `models.parent_id`)

#### Scenario: Query products under a sub-model
- **WHEN** a customer filters by "Predator League"
- **THEN** the system returns all products whose product model descends from "Predator League"

### Requirement: Brand identity
The system SHALL support brands as an optional classification layer: each brand has one clear identity in the product database; products MAY reference a brand; models MAY carry a brand reference; brand SHALL NEVER be a structural prerequisite for a product or product model to exist. The system SHALL support creating a brand, editing a brand, adding a logo, and showing how many products belong to the brand.

#### Scenario: Create a brand
- **WHEN** an admin creates a brand
- **THEN** the brand exists in the product database and products/models can reference it

#### Scenario: Brand product count
- **WHEN** an admin views a brand
- **THEN** the number of products belonging to the brand is shown

#### Scenario: Brandless product remains valid
- **WHEN** a product is saved without a brand
- **THEN** the save succeeds and the product remains fully queryable and classifiable by category and product model

### Requirement: Product-to-image ownership split
The system SHALL store product data in Supabase and image assets in Sanity; the product record SHALL hold the links to its Sanity images, and Sanity SHALL NOT become the owner of a product because the product's image is stored there.

#### Scenario: Product page shows Sanity image
- **WHEN** a customer views a product whose record is in Supabase
- **THEN** its image (stored in Sanity, linked from the product record) is displayed

### Requirement: Product relationships
The system SHALL support product relationships derived from product data:
- **Same parent submodel** (color variants) — products whose product models share the same parent
- **Same sub-model** — products whose product models share the same parent branch
- **Same root model** — products whose product models share the same root ancestor
- **Same brand** (when both have one)
- **Same category**
- **Shared attributes** (e.g., traction type, sole type)

#### Scenario: Color variants shown
- **WHEN** a product detail page asks for color variants
- **THEN** products whose product models share the same parent submodel are returned

#### Scenario: Same sub-model products shown
- **WHEN** a product detail page asks for "other League models"
- **THEN** products whose product models descend from the same sub-model (e.g., "League FT FG/MG" and "League FG") are returned

#### Scenario: Same root model products shown
- **WHEN** a product detail page asks for "other Predator models"
- **THEN** products whose product models descend from "Predator" root are returned

### Requirement: Data quality visibility
The system SHALL be able to report catalog problems from the product database: products missing ASIN, products missing images, products missing category, products missing product model, products missing brand (reported, not invalid), duplicate products, invalid products, and any model node with more than one direct product (a restructure anomaly).

#### Scenario: Missing ASIN count
- **WHEN** an admin opens Data Quality
- **THEN** the number of products missing an ASIN is reported and each problem is clickable to view the affected products

#### Scenario: Missing product model
- **WHEN** an admin opens Data Quality
- **THEN** products with NULL `model_id` are reported and clickable

#### Scenario: Missing brand is informational
- **WHEN** a product has no brand
- **THEN** Data Quality MAY surface it as information, but the absence of a brand is never treated as invalid data

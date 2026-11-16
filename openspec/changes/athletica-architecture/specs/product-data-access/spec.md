## Purpose

The single product data layer every page uses — one service in front of Supabase providing product lookup, filtered listing, search, related products, featured products, and model hierarchy navigation, with filtering and sorting done in the database.

## ADDED Requirements

### Requirement: One product data layer
The system SHALL provide one clear product data layer (Product Service) as the only way pages access product data. Pages SHALL NOT build their own database queries, and the layer SHALL be the single place for filtering, sorting, searching, pagination, relationships, caching, and database optimization.

#### Scenario: Page asks the service for products
- **WHEN** any page needs products
- **THEN** it asks the product service and does not construct database queries itself

### Requirement: Product lookup functions
The system SHALL provide functions to get a product by ID, get a product by slug, get products by category, get products by brand, get products by product model, get products by root model, get color variants, get sub-model siblings, search products, and get featured products. The exact function names MAY change (existing `LeafModel`-named functions MAY keep their internal spelling); the behavior SHALL exist.

#### Scenario: Product detail page by slug
- **WHEN** a customer opens a product page for a slug
- **THEN** the product service returns the product for that slug or a not-found result

#### Scenario: Category page lists products
- **WHEN** a category page loads
- **THEN** the product service returns the products in that category with pagination

### Requirement: Database-side filtering
The system SHALL perform filtering in the database, not by loading the entire catalog into the browser and filtering with frontend logic. When a user selects brand, category, model, and gender filters, the service SHALL query Supabase for products matching all selected filters.

#### Scenario: Combined filters including model
- **WHEN** a user selects Brand = Nike, Category = Football Boots, Model = Mercurial Superfly, Gender = Men
- **THEN** the product service returns products where category = Football Boots and brand = Nike and model descends from Mercurial Superfly and gender = Men

#### Scenario: Filtered count
- **WHEN** a category page shows the number of products matching active filters
- **THEN** the count comes from the database for the filtered query

### Requirement: Sorting and pagination in the database
The system SHALL sort and paginate product listings in the database.

#### Scenario: Sorted category listing
- **WHEN** a category page requests products sorted by price
- **THEN** products are returned sorted by price by the database

#### Scenario: Paginated results
- **WHEN** a listing has more products than one page size
- **THEN** the service returns the requested page of products

### Requirement: Model hierarchy queries
The system SHALL provide functions to navigate the model hierarchy:
- Get root models (top-level silos) for a brand or category
- Get sub-models of a given model
- Get product models (terminal nodes) under a root or sub-model
- Get the full ancestry path of a product model (for breadcrumbs)
- Get products by root model (recursive CTE on `models.parent_id`)
- Get products by sub-model

#### Scenario: Filter by root model
- **WHEN** a customer selects "Predator" from the model filter
- **THEN** the service returns all products whose product model descends from "Predator" root

#### Scenario: Filter by sub-model
- **WHEN** a customer selects "Predator League"
- **THEN** the service returns all products whose product model descends from "Predator League"

#### Scenario: Model ancestry for breadcrumbs
- **WHEN** a product detail page loads
- **THEN** the service returns the model ancestry: Predator → League → League FT FG/MG

### Requirement: Product model invariant
The system SHALL keep every terminal model node (product model) attached to exactly one product. Node type SHALL be derived from what is attached: a node with 0 products directly attached is a branch (root model or submodel) that MAY have children; a node with exactly 1 product directly attached is a product model and SHALL have no children; a node with 2+ products directly attached SHALL NOT persist — on any write that would create it (product create, update, import, variant add), the system SHALL restructure: the node becomes a submodel and every variant product gets its own product model child under it.

#### Scenario: Second variant attached to a node
- **WHEN** a write attaches a second product to a model node that already holds one product
- **THEN** the node becomes a submodel, the existing product and the new product each get their own product model child (named after the node + variant), and no node ends up with more than one direct product

#### Scenario: Admin queries the tree
- **WHEN** an admin views the model hierarchy
- **THEN** the tree shows root models, submodels, and product models, each product model showing its single product

### Requirement: Color variants
The system SHALL provide color variants — products whose product models are siblings under the same parent submodel (the same model line in different colors).

#### Scenario: Color variants on product page
- **WHEN** a product detail page asks for color variants
- **THEN** the service returns the other products whose product models share the same parent submodel, with their colors

### Requirement: Search
The system SHALL provide search over products that returns matching products from the database.

#### Scenario: Search query
- **WHEN** a customer searches for a product name or brand
- **THEN** the service returns matching products from Supabase

### Requirement: Related products
The system SHALL provide related products generated from product data (same brand, same category, same root model, same sub-model, same product model parent, or same attributes).

#### Scenario: Related products on product page
- **WHEN** a product detail page asks for related products
- **THEN** the service returns products related by brand, category, root model, sub-model, product model parent, or attributes

### Requirement: Featured products
The system SHALL provide featured products for homepage sections, where a section references products (e.g., category + limit, root model + limit) and the service fetches the current products from Supabase.

#### Scenario: Homepage featured section
- **WHEN** the homepage renders a "Featured Football Boots" section referencing category football-boots with limit 12
- **THEN** the service returns up to 12 current products in that category from Supabase

#### Scenario: Homepage featured by root model
- **WHEN** the homepage renders a "Predator Collection" section referencing root model Predator with limit 12
- **THEN** the service returns up to 12 current products under the Predator root model from Supabase
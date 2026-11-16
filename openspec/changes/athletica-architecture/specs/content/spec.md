## Purpose

Website content and media — homepage sections, banners, marketing copy, editorial text, and navigation — stored as text in Supabase, with image assets stored in Sanity and referenced by links from Supabase records.

## ADDED Requirements

### Requirement: All text content lives in Supabase
The system SHALL store all website text content — homepage banners, homepage sections, promotional content, marketing text, editorial content, navigation, and settings — in Supabase. Sanity SHALL NOT store text content and SHALL NOT store complete product records or copies of products.

#### Scenario: Homepage banner edited in Supabase
- **WHEN** the owner edits a homepage banner
- **THEN** the change is saved to Supabase and appears on the website, with no text stored in Sanity

#### Scenario: No product copies in Sanity
- **WHEN** a product is displayed on the homepage
- **THEN** no duplicate product record is created in Sanity

### Requirement: Sanity stores image assets only
The system SHALL use Sanity exclusively to store image assets. Supabase records — products, brands, homepage sections, editorial content — SHALL hold the links needed to display those images. Sanity SHALL NOT become the owner of any product or content record because an image is stored there.

#### Scenario: Product image served from Sanity
- **WHEN** a product page displays a product image
- **THEN** the image asset is served from Sanity using the link stored in the Supabase product record

#### Scenario: Brand logo served from Sanity
- **WHEN** a brand page displays a brand logo
- **THEN** the logo asset is served from Sanity using the link stored in the Supabase brand record

### Requirement: Homepage sections reference products
The system SHALL let homepage sections reference products by query (e.g., category + limit) instead of copying complete product records, and the website SHALL fetch the referenced products from Supabase through the product data layer.

#### Scenario: Featured section resolves to current products
- **WHEN** a homepage section declares category = football-boots, limit = 12
- **THEN** the website fetches up to 12 current products from that category from Supabase

### Requirement: Navigation as content without product classification
The system SHALL manage website navigation (the menu customers see) as content stored in Supabase, while product classification (category, brand, model) stays owned by the product database. A navigation item that represents a product category SHALL point to that category and SHALL NOT contain another copy of the category's products.

#### Scenario: Navigation points to category
- **WHEN** the menu shows Football → Football Boots
- **THEN** the navigation item references the Football Boots category in the product database, and the category page queries Supabase for its products

### Requirement: Content and product data flow together to the website
The website SHALL read product data and text content from Supabase, and image files from Sanity, and SHALL NOT become another place where data is stored.

#### Scenario: Website combines both sources
- **WHEN** a customer visits the homepage
- **THEN** the page renders Supabase content and product data, with image files served from Sanity, without storing either
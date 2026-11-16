## Purpose

The customer-facing Product Details page for the Production app. It presents a single published product as a premium black / lemon / white-text editorial story. The page has minimal chrome (ATHLETICA header only), no storefront navigation or footer, and a hard 1440px maximum composition width that never expands on wider screens.

## ADDED Requirements

### Requirement: Customer product page route
The system SHALL serve a customer product page at `/product/:slug` that loads only published products from `rollout.products` by their slug.

#### Scenario: Published product by slug
- **WHEN** a customer opens `/product/:slug` for a published product
- **THEN** the page renders the product details

#### Scenario: Plain 404 for missing or unpublished product
- **WHEN** a customer opens `/product/:slug` for an unpublished or nonexistent product
- **THEN** the app returns a plain 404 with no product-specific "no longer available" copy

### Requirement: Plain 404 for the production root
The Production app SHALL return a plain 404 for `/`. It SHALL NOT render a marketing homepage, a product list, or a redirect.

#### Scenario: Root is 404
- **WHEN** a customer opens `/` on the Production app
- **THEN** the app returns a plain 404

### Requirement: No price or currency
The customer product page SHALL NOT display a price, currency symbol, or currency amount.

#### Scenario: No price rendered
- **WHEN** a customer views a product page
- **THEN** no price or currency is shown anywhere on the page

### Requirement: Product metadata and real content
The page SHALL provide `generateMetadata` with the product title, description, and Open Graph image, and the root layout SHALL use Athletica metadata rather than "Create Next App". It SHALL render only real content from the product record; mock box contents, placeholder copy, and Unsplash/placeholder image fallbacks SHALL NOT be used. If a section has no data, the section SHALL be omitted.

#### Scenario: Share preview uses product data
- **WHEN** the product URL is shared
- **THEN** the preview shows the product title, description, and Open Graph image, not starter metadata

#### Scenario: No mock content
- **WHEN** a product has no box contents or gallery images
- **THEN** those sections are omitted; no mock or placeholder content is shown

### Requirement: Product images
The page SHALL render product images with `next/image`, allow only the `cdn.sanity.io` remote host, use `fill` with `sizes` inside the existing fixed-ratio containers, mark the hero image `priority`, lazy-load the rest, and provide alt text for every image.

#### Scenario: Images optimized and accessible
- **WHEN** a product page renders
- **THEN** its images are optimized by `next/image`, the hero loads with priority, and every image has alt text

### Requirement: Minimal product header
The customer product page SHALL show only a centered ATHLETICA logo with a thin lemon rule. It SHALL have no navigation, search, cart, account, breadcrumbs, or customer footer.

#### Scenario: Header has no nav
- **WHEN** a customer views a product page
- **THEN** the only header element is the centered ATHLETICA logo, with no storefront chrome

#### Scenario: No footer
- **WHEN** a customer views a product page
- **THEN** there is no customer-facing footer

### Requirement: Visual system
The customer product page SHALL use the black / lemon / white-text visual system: background `#000000`, accent `#d1fd40`, white for text only, no white UI surfaces, near-black borders. The page SHALL cap its composition at 1440px and never expand at wider viewports (1680px, 1920px, 2560px+).

#### Scenario: Hard 1440px cap
- **WHEN** the viewport is wider than 1440px
- **THEN** the composition stays centered at 1440px with black breathing room, with no media query increasing the width

#### Scenario: No white surfaces
- **WHEN** a customer views the page
- **THEN** white appears only as text, never as a background, card, input, or button surface

### Requirement: Interactive image gallery
The customer product page SHALL provide a main hero image with thumbnail selection. Clicking a thumbnail or a large gallery image changes the active hero image and moves the lemon border. Keyboard support: ArrowLeft/ArrowRight previous/next, Home/End first/last.

#### Scenario: Thumbnail changes hero
- **WHEN** a customer clicks a thumbnail
- **THEN** the hero image changes and the active thumbnail receives a lemon border

#### Scenario: Keyboard gallery control
- **WHEN** a customer presses ArrowRight on the gallery control
- **THEN** the next image becomes active

### Requirement: Shop Product CTA
The page SHALL show a lemon SHOP PRODUCT CTA. The server SHALL determine availability from the published status, a present ASIN, and real Amazon tag/store configuration. When available, the CTA SHALL be a normal link to `GET /go/:id?source=...`; the browser SHALL navigate to that route, and the server SHALL derive the Amazon URL and redirect. The component SHALL NOT call `window.open`, SHALL NOT receive the ASIN, and SHALL NOT construct an Amazon URL. When unavailable, the CTA SHALL be visible, greyed out, disabled, and labelled "Link coming soon"; no click event SHALL be recorded.

#### Scenario: CTA routes through the backend
- **WHEN** a customer clicks SHOP PRODUCT on an available product
- **THEN** the browser navigates to `/go/:id` and the server records the click, derives the Amazon URL, and redirects to Amazon

#### Scenario: No ASIN
- **WHEN** a product has no ASIN
- **THEN** SHOP PRODUCT is greyed out, disabled, and labelled "Link coming soon", and no click is recorded

#### Scenario: Missing or placeholder tag/store
- **WHEN** the Amazon tag or store is missing, empty, or a placeholder
- **THEN** SHOP PRODUCT is greyed out, disabled, and labelled "Link coming soon", and no click is recorded

### Requirement: Server-side view recording and source attribution
The product page SHALL record a view on the server for each rendered published product. It SHALL derive `source` from `utm_source` and store only `instagram` or `whatsapp`; any other value SHALL be stored as `NULL`. It SHALL store a daily `visitor_hash` derived from the visitor IP, user agent, UTC date, and a server-side salt; the raw IP SHALL NOT be stored. Known crawler, preview, and uptime user agents SHALL be skipped; Instagram and WhatsApp in-app browsers SHALL be treated as real visitors. The page SHALL be rendered per request, not statically cached. Recording failures SHALL NOT block the page.

#### Scenario: Instagram view attributed
- **WHEN** a customer opens `/product/:slug?utm_source=instagram`
- **THEN** a view is recorded with `source='instagram'` and a daily `visitor_hash`, not the raw IP

#### Scenario: Direct view has no source
- **WHEN** a customer opens `/product/:slug` without a platform tag
- **THEN** a view is recorded with `source=NULL` and a daily `visitor_hash`

#### Scenario: Bot is not counted
- **WHEN** a crawler or uptime monitor requests the page
- **THEN** no view is recorded

#### Scenario: Analytics failure does not break the page
- **WHEN** the analytics insert fails
- **THEN** the product page still renders

### Requirement: Affiliate disclosure
The page SHALL show a short Amazon Associates disclosure near the CTA or in the footer area.

#### Scenario: Disclosure visible
- **WHEN** a customer views a product page
- **THEN** the Amazon Associates disclosure is visible

### Requirement: Loading and error states
The customer product page SHALL show a geometry-matching skeleton while loading and an UNABLE TO LOAD PRODUCT state with a TRY AGAIN button on error. Missing and unpublished products are a plain 404, not a "PRODUCT NOT FOUND" page.

#### Scenario: Loading skeleton
- **WHEN** the product page is loading
- **THEN** it shows a black-background skeleton matching the layout

#### Scenario: Load error retry
- **WHEN** loading fails
- **THEN** the page shows "UNABLE TO LOAD PRODUCT" with a TRY AGAIN button that repeats the request

### Requirement: Responsive product layout
The customer product page SHALL be responsive: two-column hero on desktop (image | product info), stacking on tablet, and a defined phone order (logo → image → thumbnails → product info → CTA → story → benefits → specs → gallery → inside box → collection). There SHALL be no horizontal page overflow.

#### Scenario: Tablet stacks
- **WHEN** the viewport is tablet width
- **THEN** the hero, story/benefits, and specs/gallery stack vertically as needed

#### Scenario: Phone order
- **WHEN** the viewport is phone width
- **THEN** the page renders in the specified single-column order

### Requirement: Editorial product sections
The customer product page SHALL present the product as an editorial story with sections: hero, story + key benefits, technical details + product gallery, and a final strip with "What's inside the box" and "Collection".

#### Scenario: Full editorial page
- **WHEN** a customer scrolls a product page
- **THEN** they see hero, story + benefits, technical details + gallery, and the inside-box / collection strip

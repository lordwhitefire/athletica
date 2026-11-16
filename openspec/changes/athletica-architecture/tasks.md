## 1. Supabase schema (products + content + models)

- [ ] 1.1 Create Supabase migration(s) for the product catalog: `products` (id, slug unique, name, description, price, gender, color, sizes, attributes JSONB, status, asin, category_id, brand_id, **product model reference (`leaf_model_id`)**, image links, timestamps), `categories` (id, slug, name, parent), `brands` (id, slug, name, logo link), **`models`** (id, slug unique, name, brand_id, parent_id self-ref, level, description), with indexes for filtering (status, category, brand, **leaf_model_id**, price) and unique constraints (slug, product ID, **models: (brand_id, slug)**)
- [ ] 1.2 Create Supabase migration(s) for content tables: `homepage_sections` (type, order, title, copy, category reference, limit, image links), `navigation` (menu items pointing at categories/routes), `editorial_content` (banners, marketing text), `site_settings`
- [ ] 1.3 Regenerate TypeScript types from the new schema (`supabase gen types typescript`) and commit the generated types
- [ ] 1.4 Define RLS policies so customer-facing reads exclude unpublished products and admin writes require authenticated admin access

## 2. Move product data into Supabase (with model hierarchy)

- [ ] 2.1 Build a one-time import script that reads the existing product data (JSON snapshots in `data/products/` and/or Sanity export), **parses the model hierarchy from the source `model` field** (e.g., "Predator/League-FT-(FG/MG)" → root: Predator, sub: League, sub-sub: League FT FG/MG), upserts the model hierarchy first, then inserts/upserts products linked to their **product models** (terminal nodes), mapping brands and categories first
- [ ] 2.2 Verify the import against the old system: product count matches, IDs map, categories and brands match, **model hierarchy correctly built** (root models, sub-models, product models linked correctly), ASINs present, image links present, required fields filled, products linked to correct product models
- [ ] 2.3 Keep the old data source readable until verification passes; record any products that failed to import and why
- [ ] 2.4 **Split shared nodes into product models (variant rule, D13):** every model node holding 2+ direct products becomes a submodel with per-variant product model children (named node + variant); verify no node holds more than one direct product afterward (SQL check against the imported data)

## 3. Product data layer (with model hierarchy)

- [ ] 3.1 Create the Product Service module in `frontend/` exposing: getProduct(id), getProductBySlug(slug), getProducts(filters), getProductsByCategory(category), getProductsByBrand(brand), **getProductsByProductModel(model_id), getProductsByRootModel(root_model_id), getProductModelsByRoot(root_model_id), getSubModels(parent_model_id), getModelAncestry(product_model_id), getColorVariants(product_model_id)**, getRelatedProducts(product), searchProducts(query), getFeaturedProducts() (existing `LeafModel`-named functions MAY keep internal spelling; behavior is the product-model behavior)
- [ ] 3.2 Implement database-side filtering, sorting, and pagination for all listing functions (filters: category, brand, **product model, root model, sub-model**, gender, color, sizes, price; sorting by price/name; pagination)
- [ ] 3.3 Implement related-products logic (same brand, same category, **same root model, same sub-model, same product model parent**, shared attributes) and featured products (category + limit, **root model + limit**)
- [ ] 3.4 Implement **model hierarchy queries**: getRootModels(brand/category), getSubModels(parent_model_id), getProductModelsByRoot(root_model_id), getModelAncestry(product_model_id) for breadcrumbs
- [ ] 3.5 Add caching/optimization at the service layer for frequently queried listings
- [ ] 3.6 **Enforce the product model invariant (D13):** every write path (product create/update/import/variant add) restructures a node that would hold 2+ direct products into a submodel + per-variant product models, in one transaction; no node ever persists with 2+ direct products

## 4. Move the website to the product data layer

- [ ] 4.1 Replace homepage product sections (featured, new, category, brand, best-performing) with Product Service queries driven by homepage section records (category + limit, **root model + limit**) now stored in Supabase
- [ ] 4.2 Replace category/listing page data fetching with Product Service queries, including filter state (**root model, sub-model, product model**), sorting, pagination, and category counts
- [ ] 4.3 Replace search with Product Service search
- [ ] 4.4 Replace product detail page fetching with getProductBySlug; render name, brand, category, **model ancestry (breadcrumbs)**, images, price, description, attributes, variants, sizes, ASIN, and related products from the Product Service
- [ ] 4.5 Verify every customer page against the old JSON/Sanity reads during a parallel-run period before removing the old path

## 5. Wire admin product operations to Supabase (reuse existing pages)

- [ ] 5.1 Wire the existing Products admin page (ProductCatalogInteractionLayer + `@/lib/actions/products.ts`) to Supabase through the Product Service: search, filter (**by root model, sub-model, product model**), paginate, KPIs; replace Sanity reads. **Default the list to all statuses (published + unpublished)**; unpublished products must never be hidden by a default filter
- [ ] 5.2 Wire the existing product editor/create flows (ProductForm, product editor page) to Supabase writes: product info (including **sizes** and **ASIN** fields), category/brand assignment, **product model selection (with hierarchy picker)**, images, publish/unpublish, delete. **Saving SHALL never erase an existing ASIN**; **quick create SHALL auto-generate the SKU** and include an **image upload** surface
- [ ] 5.3 Rebuild the bulk import server action to save to Supabase: upload (**.xlsx or .csv** — see 10.0), read file, validate, show errors, show preview, confirm, save, show result report (created/updated/duplicates/missing ASIN/missing images/missing categories/invalid/failed rows with per-row reasons; **unique slugs within a batch**). **Import center validation SHALL be computed from the real Supabase catalog, never mock constants**
- [ ] 5.4 Wire the existing Categories and Brands admin pages to Supabase (create, edit, logo link, product counts, view products); **add Models admin page** (create/edit model hierarchy, view products under model, product-model nodes); replace seed data (INITIAL_BRANDS) and Sanity reads
- [ ] 5.5 Wire the existing dashboard (overview page) to Supabase counts: catalog health, quality metrics, tasks; replace Sanity counts and hardcoded zero clicks
- [ ] 5.6 **Admin UX safety (owner requirements):** every destructive action (product/bulk/brand/category/model delete) requires an explicit confirmation dialog; every action button has idle/busy/success/error states; **bulk actions exclude product-distinct fields (ASIN stays per-product)**

## 6. Move all text content to Supabase; Sanity becomes images only

- [ ] 6.1 Move homepage sections to Supabase (homepage_sections table); wire the existing Homepage admin page to save/load Supabase content instead of localStorage/Sanity
- [ ] 6.2 Move navigation to Supabase (navigation table) pointing at categories; wire the existing Navigation admin page
- [ ] 6.3 Move editorial content and site settings text to Supabase (editorial_content, site_settings); wire the existing Settings page
- [ ] 6.4 Reduce Sanity Studio schemas to image assets only (remove product, brand, category, navigation, homepage content schemas from Studio usage)
- [ ] 6.5 Wire the existing Media admin page: upload image assets to Sanity, store the returned links in Supabase, list media from Supabase links (replace localStorage seed assets)

## 7. Amazon affiliate service

- [ ] 7.1 Create the Amazon Affiliate Service module: buildProductLink, buildCartLink, getAffiliateConfiguration, validateAmazonProductData
- [ ] 7.2 Verify the exact Amazon multi-product cart URL/request format against current Amazon affiliate capabilities; implement single-product and multi-product cart destinations
- [ ] 7.3 Route cart "Buy on Amazon"/"Continue to Amazon" actions through the affiliate service; remove any manual Amazon URL construction elsewhere
- [ ] 7.4 Wire the existing Affiliate Settings admin page: save Amazon Associate configuration to Supabase and generate links through the affiliate service (replace mock config/products)

## 8. Data quality and analytics

- [ ] 8.1 Wire the existing System Health / Data Quality admin page to real Supabase data quality queries (missing ASIN, missing images, missing category, **missing product model**, duplicates, invalid, **nodes with 2+ direct products**) with clickable problem lists (replace hardcoded issues)
- [ ] 8.2 Record product views and Amazon clicks (and search activity where available) at the business boundaries
- [ ] 8.3 Replace the analytics seed data with real queries from recorded events: overview, products, traffic views (product views, Amazon clicks, CTR, top products/brands/categories, search activity)
- [ ] 8.4 Wire the dashboard analytics panels (clicks, top products, category distribution) to real event data

## 9. Removal of the old product path

- [ ] 9.1 After all verifications pass, remove the old product data path (JSON snapshots and Sanity product/content reads) and the now-unused data files
- [ ] 9.2 Final verification against the definition of success: owner can answer every catalog/analytics question from the admin, update products and content without Sanity Studio, and customers can find products and continue to Amazon

## 10. Product-model hierarchy (D13 — owner decision 2026-08-20; owner sequencing 2026-08-24: FIRST implementation after ARCH-REC-007 approval)

- [ ] 10.0 **Import format upgrade — Excel support (owner order 2026-08-24: do this FIRST, before any hierarchy work).** The Import Center accepts Microsoft Excel `.xlsx` uploads alongside CSV; both feed the identical parse → validate → preview → confirm → save pipeline with identical reporting (admin spec, "Bulk import workflow"). Adding a spreadsheet-parsing dependency REQUIRES the owner's approval of package AND version BEFORE any install (standing dependency rule).
- [ ] 10.1 Migrate the existing model tree: split every node with 2+ direct products into a submodel + per-variant product models (named node + variant, e.g. "Predator Elite FG Black"); verify 1:1 across all products (optional partial unique index via migration, user applies)
- [ ] 10.2 Enforce the invariant on every write path (service + admin actions + **Excel and CSV import**): second product on a node triggers the restructure; surface any anomaly in Data Quality
- [ ] 10.3 Update terminology across service, admin UI, and specs: leaf model → product model (terminal node = one product); models admin page shows brand → root model → submodel → product model with product counts
- [ ] 10.4 Storefront: model filters/breadcrumbs/color variants work with the product-model tree (variants = siblings under the same submodel)

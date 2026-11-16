# Analysis — Engagement 04, Sample: Spree

**Date:** 2026-11-16
**Mode:** A (open source under BSD-3), static only
**Working record** — separates what was *observed* from what is *inferred*.

## Files read

| File | Lines | Purpose |
|---|---|---|
| `LICENSE` | 1–5 | BSD 3-Clause confirmed |
| `spree/core/app/models/spree/product.rb` | 1–80, 80–260, 420–460, 690–728 | Product model + status + associations + publish gate |
| `spree/core/app/models/spree/import.rb` | 55–230 | Import engine + state machine |
| `spree/core/app/models/spree/imports/products.rb` | 1–14 | Product-specific import subclass |
| `spree/api/app/controllers/spree/api/v3/admin/products_controller.rb` | 1–120 | Admin CRUD + bulk API |
| `spree/api/app/controllers/concerns/spree/api/v3/bulk_operations.rb` | 1–101 | Shared bulk concern |

## Observed: product = catalog grouping, not purchasable thing

`product.rb:80-260`. The Product model has:

**belongs_to:** `seller`, `store`, `product_type`, `tax_category`, `delivery_profile`,
`default_variant`

**has_many:**
- `variants` (the purchasable units — SKU/price/stock live here, NOT on the product)
- `prices` (through variants)
- `stock_levels` (through variants)
- `line_items` → `orders` → `completed_orders` (sales graph)
- `media` (images/videos, polymorphic `viewable`)
- `digital_assets` (downloads through variants)
- `product_option_types` → `option_types` (variant attributes like color/size)
- `option_value_variants` → `option_values`
- `product_categories` → `categories` (many-to-many)
- `product_collections` → `collections` (manual collections only; automatic kept as-is)
- `catalog_products` → `catalogs`
- `product_submissions` (the seller-review workflow)
- `promotion_rules` → `promotions`

The controller comment (`products_controller.rb:14`) makes the rule explicit:
> *"Product is purely a catalog grouping in API v3: every purchasable attribute lives
> on variants (docs/plans/6.0-remove-master-variant.md)."*

**Rule (confirmed):** in Spree v6, **Product is a grouping**. SKU, price, stock,
weight, dimensions — all live on `Variant`. A product has one `default_variant`
(the one the buy-box leads with) and zero-or-more additional variants (color/size
combinations). This is the "master variant" pattern made explicit: the master
became the default_variant, and the product itself stopped being purchasable.

**Implication for our build:** our affiliate products are single-variant (one
ASIN = one buyable thing). We don't need the full variant graph, but we should
model `Product` and `Variant` as separate entities from day one — adding variants
later is painful.

## Observed: status state machine — 5 statuses, 2 workflows

`product.rb:51-52`:

```ruby
STATUSES = %w[draft active archived].freeze
REVIEW_STATUSES = %w[proposed rejected].freeze
ALL_STATUSES = (STATUSES + REVIEW_STATUSES).freeze
```

- **`draft`** — default on create. Operator is still configuring. Not visible.
- **`active`** — visible in the catalog (subject to the `available?` gate, see below).
- **`archived`** — soft-hidden. Not deleted, but not in the catalog.
- **`proposed`** — a seller has submitted this for marketplace review. (Seller-driven.)
- **`rejected`** — an operator has turned down the submission. (Operator-driven.)

**Rule (confirmed):** the operator-set statuses (`draft`, `active`, `archived`) are
bulk-updateable. The review statuses (`proposed`, `rejected`) are NOT bulk-updateable
— the controller's `bulk_status_update` validates against `STATUSES` only, with the
comment: *"reaching `proposed` is a seller submitting and reaching `rejected` is an
operator deciding, and neither is a value to assign in bulk."*

**Rule (confirmed):** status transitions belong in **service workflows**, not on
the model. `product.rb:434-460` deprecates `activate!`, `archive!`, `draft!` in
favor of `Spree.product_activate_workflow`, `product_archive_workflow`,
`product_draft_workflow`. The inline comment explains: side-effects (event
publishing, notifications, cache invalidation) belong in the workflow, not the
model. The model owns the *state*; the workflow owns the *transitions*.

**Rule (confirmed):** the model publishes lifecycle events via
`publishes_events :activated, :approved, :archived, :back_in_stock, :drafted,
:out_of_stock, :proposed, :rejected`. Other systems subscribe to these.

## Observed: the publish gate — three conditions

`product.rb:701`:

```ruby
def available?
  active? && !deleted? && (available_on.nil? || available_on <= Time.current)
end
```

**Rule (confirmed):** a product is visible in the catalog when **all three** hold:

1. `status == 'active'` (not draft, not archived, not proposed, not rejected)
2. NOT soft-deleted (`deleted_at IS NULL` — via `acts_as_paranoid`)
3. `available_on IS NULL` (no schedule) OR `available_on <= now` (future-publish)

**Implication for our build:** adopt this exact three-condition gate. The
`available_on` field enables "schedule this product to go live next Monday"
without a cron job flipping the status.

## Observed: discontinue! force-archives

`product.rb:718-728`:

```ruby
def discontinue!
  write_publication_date(:discontinue_on, Time.current)
  self.status = 'archived'
  save(validate: false)
end
```

**Rule (confirmed):** a discontinued product is force-archived with
`save(validate: false)` — validations are bypassed. This is intentional: a product
that has been sold can be discontinued even if some validation (e.g. category
presence) no longer passes. You don't want a stale validation to block a
discontinue operation.

**Implication for our build:** model a `discontinue()` action that bypasses
validation, sets `discontinue_on = now`, sets `status = 'archived'`.

## Observed: soft-delete + tags via gems

`product.rb:21-23`:

```ruby
acts_as_paranoid
acts_as_taggable_on :tags, :labels
acts_as_taggable_tenant :store_id
```

**Rule (confirmed):** products are soft-deleted (`deleted_at` column; default scope
excludes deleted records). Tags are scoped per `store_id` (multi-tenant tag
isolation).

**Implication for our build:** Postgres tables get a `deleted_at TIMESTAMPTZ`
column; the default query scope adds `WHERE deleted_at IS NULL`. Tags are scoped
per-store via a composite index.

## Observed: admin CRUD — single + bulk, id-validated

`products_controller.rb:1-120` — the admin API supports:

**Single-resource actions** (inherited from `ResourceController`):
- `index` (list with filtering, sorting, pagination)
- `show`
- `create`
- `update`
- `destroy`

**Bulk actions** (explicit, with `require_ids!` guard):

| Action | Purpose | Skip counting? |
|---|---|---|
| `bulk_status_update` | Set status on many products | Yes — `skipped_in_review_count` |
| `bulk_add_to_categories` | File products into categories | — |
| `bulk_remove_from_categories` | Remove from categories | — |
| `bulk_add_to_collections` | File into manual collections | — |
| `bulk_remove_from_collections` | Remove from collections | — |
| `bulk_add_to_channels` | Publish to sales channels | — |
| `bulk_remove_from_channels` | Unpublish from channels | — |
| `bulk_destroy` | Soft-delete many | — |

**Rule (confirmed):** `require_ids!` validates the `ids` array is present and
non-empty before any bulk action runs. No accidental "destroy everything" by
passing an empty array.

**Rule (confirmed):** `bulk_status_update` validates against `STATUSES` only (not
`REVIEW_STATUSES`). Products in `proposed` state are skipped and counted in
`skipped_in_review_count` — the response includes this so the admin UI can show
"N products skipped because they're in review."

**Implication for our build:** adopt the bulk-action-with-skip-counting pattern.
For our affiliate products, the relevant bulk actions are: `bulk_publish`,
`bulk_unpublish`, `bulk_archive`, `bulk_assign_to_category`, `bulk_destroy`.

## Observed: bulk operations as a shared concern

`bulk_operations.rb:1-101` — a Rails concern included by `products_controller`
(and presumably other resource controllers). Provides:

- `require_ids!` — id-array validation
- `bulk_add_tags` / `bulk_remove_tags` — tag mass-assignment
- `bulk_collection` — the scoped ActiveRecord relation
- `bulk_tags_response` — the JSON response shape
- `decode_ids` — handles encoded id formats (Spree uses `prod_XXX` style)
- `after_bulk_tags_change` — hook for cache invalidation

**Rule (confirmed):** bulk operations are not duplicated per resource — they live in
a shared concern. Each resource controller includes it and gets `require_ids!`,
`bulk_collection`, etc. for free.

**Implication for our build:** extract a `BulkOperations` TypeScript module that
any admin resource controller can use. Don't duplicate bulk logic per entity.

## Observed: import engine — two-phase state machine with row tracking

`import.rb:55-230`. The `Spree::Import` base class has:

```ruby
has_status :pending, :mapping, :completed_mapping, :processing, :completed, :failed,
  default: :pending
```

Transitions:
- `start_mapping!` — begin parsing the file
- `complete_mapping!` — mapping phase done (rows parsed + validated in memory)
- `start_processing!` — begin persisting to DB
- `complete!` — all rows persisted

The `fail!` method is **deprecated** (`import.rb:190-194`) — failure is now a
status you write directly, not a transition. The comment: *"Failure was never a
step of the state machine."*

**Rule (confirmed):** the import is **two-phase**: MAPPING (parse + validate rows,
build the in-memory model without persisting) then PROCESSING (persist). This
separates "is the data shape right?" from "did the DB writes succeed?" — so a
10,000-row file with one bad row can report the bad row at the mapping phase
without leaving 9,999 partial writes in the DB.

**Rule (confirmed):** each row has its own status — `rows_status_counts` returns
a grouped COUNT in one query (memoized). The API can show "10,000 rows: 9,998
completed, 1 failed, 1 pending" without N queries.

**Rule (confirmed):** `can_be_deleted?` returns true only for statuses in
`%w[pending mapping completed failed]` — you can't delete an import that's
mid-processing.

**Rule (confirmed):** `Spree::Imports::Products` (`imports/products.rb`, 14 lines)
is a thin subclass that declares `row_processor_class` and `group_column`. Every
import type (customers, products, price_list_prices, product_translations,
purchase_orders) follows the same engine, with type-specific row processing.

**Implication for our build:** adopt the two-phase import pattern. For CSV import
of Amazon products: Phase 1 parses + validates every row (ASIN format, marketplace
exists, category exists), Phase 2 inserts. Per-row status. One grouped COUNT query
for progress.

## Observed: multi-vendor marketplace support

`product.rb:170` — `belongs_to :seller, class_name: 'Spree::Seller', optional: true`.
`product.rb:222` — `has_many :submissions, class_name: 'Spree::ProductSubmission'`.

**Rule (confirmed):** a product can belong to a seller (multi-vendor) or to the
store directly (`optional: true`). The `ProductSubmission` model records the
seller-review workflow — a seller submits a product (`status: 'proposed'`), an
operator approves (`status: 'active'`) or rejects (`status: 'rejected'`).

**Implication for our build:** this is more complex than we need for v1 — we
are the only seller (the affiliate). But the submission/review pattern is worth
remembering if we ever open the marketplace to other curators.

## What Spree gives us that's worth keeping

| Rule / pattern | Worth keeping? |
|---|---|
| Product = catalog grouping; Variant = purchasable unit | Yes — even for single-variant products, model them separately |
| 5-status state machine (draft/active/archived + proposed/rejected) | Yes — adopt draft/active/archived for v1 |
| Status transitions in service workflows, not model methods | Yes — keep side-effects in workflow layer |
| 3-condition publish gate: active + not-deleted + available_on <= now | Yes — verbatim |
| `discontinue!` bypasses validation, sets archived | Yes |
| Soft-delete via `deleted_at` (acts_as_paranoid pattern) | Yes |
| Tags scoped per-tenant (store_id) | Yes |
| Bulk operations as shared concern, with `require_ids!` + skip counting | Yes |
| Two-phase import: mapping (parse+validate) then processing (persist) | Yes |
| Per-row status tracking with grouped COUNT | Yes |
| `can_be_deleted?` guard on import (no deleting mid-processing) | Yes |
| Lifecycle events published for subscribers | Yes |
| Multi-vendor seller + submission review | No for v1 — we're the only seller |

## Confidence

- **confirmed** — every claim above is sourced to `file:line` in `evidence/excerpts.txt`
  (838 lines, 10 evidence blocks).
- **likely** — the `Products::Propose`, `Products::Approve`, `Products::Reject`
  service workflows exist under `spree/core/app/models/spree/products/` (located
  via `find` but not read line-by-line). Their exact transition logic is *likely*
  straightforward status writes + event publishes, but not proven.
- **not proven** — the actual row processor class for product imports (the
  `row_processor_class` method returns a constant I did not read). The mapping
  logic (which CSV column → which model attribute) is *not proven* here.

## Engagement 04 — consolidated rules for the build

- **Data model:** `Product` (catalog grouping) + `Variant` (purchasable unit) +
  `Media` (polymorphic) + `Category` (M2M) + `Tag` (per-store scoped). For v1,
  products are single-variant, but model them as separate entities.
- **Status state machine:** `draft → active → archived` (operator-set, bulk-
  updateable) + `proposed ↔ rejected` (seller-review only, NOT bulk-updateable).
  Default on create: `draft`.
- **Publish gate:** `available? = (status == 'active') && (deleted_at IS NULL) &&
  (available_on IS NULL OR available_on <= now)`.
- **Status transitions in service workflows** (not model methods). Side-effects
  (event publishing, notifications, cache invalidation) in the workflow.
- **`discontinue()` action** bypasses validation, sets `discontinue_on = now`,
  `status = 'archived'`.
- **Soft-delete** via `deleted_at` column. Tags scoped per-tenant.
- **Admin CRUD:** single + bulk. Bulk actions: `bulk_publish`, `bulk_unpublish`,
  `bulk_archive`, `bulk_assign_to_category`, `bulk_destroy`. All guarded by
  `require_ids!`. Skip-counting in response (`skipped_in_review_count`).
- **Bulk operations as shared module** — not duplicated per entity.
- **Two-phase CSV import:** Phase 1 = mapping (parse + validate, in-memory),
  Phase 2 = processing (persist). Per-row status. Grouped COUNT for progress.
- **Import delete guard:** can only delete imports in `pending/mapping/completed/
  failed` states — never mid-processing.
- **Lifecycle events:** publish `activated, approved, archived, drafted,
  out_of_stock, proposed, rejected` for subscribers.

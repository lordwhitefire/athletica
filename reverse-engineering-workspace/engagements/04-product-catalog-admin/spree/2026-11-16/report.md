# Report — Engagement 04, Sample: Spree

**Engagement:** 04 — Manual product catalog + admin CRUD + bulk import
**Sample:** Spree (spree/spree), Ruby on Rails, BSD 3-Clause
**Commit analysed:** `53d2936a5750d9a3b806b97a45c7712393b35622` (2026-11-16)
**Mode:** A (open source under licence), static analysis only
**Date:** 2026-11-16

---

## 0. Licence note

Spree is **BSD 3-Clause** — the most permissive licence in this engagement set. No
copyleft, no restrictions on commercial use. Direct adaptation would be permitted,
but Ruby ≠ TypeScript, so we extract rules and re-implement in TypeScript.

## 1. What is it?

An open-source Ruby on Rails e-commerce platform, 17+ years in development. v5.x /
v6 (multi-vendor marketplace support added). 272 MB, 9,324 files. Last commit
today (2026-11-16). The most mature product-catalog model we will study.

## 2. What does it do? (rules and behaviour)

### 2.1 Product = catalog grouping; Variant = purchasable unit

`product.rb:80-260` + controller comment at `products_controller.rb:14`:
*"Product is purely a catalog grouping in API v3: every purchasable attribute lives
on variants (docs/plans/6.0-remove-master-variant.md)."*

**Rule (confirmed):** in Spree v6, Product is a grouping. SKU, price, stock,
weight, dimensions — all live on `Variant`. A product has one `default_variant`
(the buy-box leader) and zero-or-more additional variants (color/size combinations).

Associations:
- `belongs_to`: seller, store, product_type, tax_category, delivery_profile, default_variant
- `has_many`: variants, prices (through variants), stock_levels (through variants),
  media (polymorphic), digital_assets (through variants), option_types, option_values,
  categories (M2M), collections (M2M), catalogs (M2M), product_submissions,
  promotion_rules → promotions

**Implication for our build:** model Product and Variant as separate entities from
day one, even though our affiliate products are single-variant.

### 2.2 Status state machine — 5 statuses, 2 categories

`product.rb:51-52`:

```ruby
STATUSES = %w[draft active archived].freeze           # operator-set, bulk-updateable
REVIEW_STATUSES = %w[proposed rejected].freeze          # seller-review only
ALL_STATUSES = (STATUSES + REVIEW_STATUSES).freeze
```

- **`draft`** — default on create. Not visible.
- **`active`** — visible (subject to the `available?` gate).
- **`archived`** — soft-hidden.
- **`proposed`** — seller submitted for review.
- **`rejected`** — operator turned down.

**Rule (confirmed):** `bulk_status_update` validates against `STATUSES` only —
`proposed` and `rejected` are not bulk-assignable. The controller comment: *"reaching
`proposed` is a seller submitting and reaching `rejected` is an operator deciding,
and neither is a value to assign in bulk."*

**Rule (confirmed):** status transitions belong in **service workflows**, not on
the model. `activate!`, `archive!`, `draft!` are deprecated in 6.3 in favor of
`Spree.product_activate_workflow`, `product_archive_workflow`, `product_draft_workflow`.
Side-effects (events, notifications, cache invalidation) belong in the workflow.

**Rule (confirmed):** the model publishes lifecycle events via
`publishes_events :activated, :approved, :archived, :back_in_stock, :drafted,
:out_of_stock, :proposed, :rejected`.

### 2.3 Publish gate — three conditions

`product.rb:701`:

```ruby
def available?
  active? && !deleted? && (available_on.nil? || available_on <= Time.current)
end
```

**Rule (confirmed):** a product is visible in the catalog when all three hold:

1. `status == 'active'`
2. NOT soft-deleted (`deleted_at IS NULL`)
3. `available_on IS NULL` OR `available_on <= now`

The `available_on` field enables future-publish scheduling without a cron job.

### 2.4 Discontinue! bypasses validation

`product.rb:718-728`:

```ruby
def discontinue!
  write_publication_date(:discontinue_on, Time.current)
  self.status = 'archived'
  save(validate: false)
end
```

**Rule (confirmed):** discontinuing force-archives with `save(validate: false)`.
A product that has been sold can be discontinued even if some validation (e.g.
category presence) no longer passes. Stale validations must not block discontinue.

### 2.5 Soft-delete + per-tenant tags

`product.rb:21-23`:

```ruby
acts_as_paranoid                    # soft-delete via deleted_at column
acts_as_taggable_on :tags, :labels  # tag system
acts_as_taggable_tenant :store_id   # tags scoped per store (multi-tenant)
```

**Rule (confirmed):** products are soft-deleted. Default scope excludes
`deleted_at IS NOT NULL`. Tags scoped per-tenant.

### 2.6 Admin CRUD — single + bulk, id-validated

`products_controller.rb:1-120`. Admin API supports:

**Single-resource:** `index`, `show`, `create`, `update`, `destroy` (inherited
from `ResourceController`).

**Bulk actions** (explicit, `require_ids!` guard):

| Action | Purpose | Skip counting? |
|---|---|---|
| `bulk_status_update` | Set status on many products | Yes — `skipped_in_review_count` |
| `bulk_add_to_categories` / `bulk_remove_from_categories` | File into / out of categories | — |
| `bulk_add_to_collections` / `bulk_remove_from_collections` | Manual collections | — |
| `bulk_add_to_channels` / `bulk_remove_from_channels` | Publish/unpublish channels | — |
| `bulk_destroy` | Soft-delete many | — |

**Rule (confirmed):** `require_ids!` validates the `ids` array is present and
non-empty. No accidental "destroy everything" by passing empty array.

**Rule (confirmed):** `bulk_status_update` skips products in `proposed` state and
counts them in `skipped_in_review_count`. Response includes this so the admin UI
shows "N products skipped."

### 2.7 Bulk operations as shared concern

`bulk_operations.rb:1-101` — a Rails concern included by `products_controller`
and other resource controllers. Provides:
- `require_ids!`, `bulk_collection`, `bulk_add_tags`/`bulk_remove_tags`,
  `bulk_tags_response`, `decode_ids`, `after_bulk_tags_change`

**Rule (confirmed):** bulk operations live in a shared concern, not duplicated
per resource.

### 2.8 Two-phase bulk import with row-level tracking

`import.rb:55-230`. The `Spree::Import` base class state machine:

```
pending → mapping → completed_mapping → processing → completed
                                                    ↘ failed
```

Transitions: `start_mapping! → complete_mapping! → start_processing! → complete!`.

**Rule (confirmed):** the import is **two-phase**: MAPPING (parse + validate
rows in memory) then PROCESSING (persist to DB). Separates "is the data shape
right?" from "did the DB writes succeed?" — so a 10,000-row file with one bad
row reports the bad row at the mapping phase without leaving partial writes.

**Rule (confirmed):** each row has its own status. `rows_status_counts` returns
a grouped COUNT in one query (memoized) — the API can show "10,000 rows: 9,998
completed, 1 failed, 1 pending" without N queries.

**Rule (confirmed):** `fail!` is deprecated — failure is now a status you write
directly, not a transition. *"Failure was never a step of the state machine."*

**Rule (confirmed):** `can_be_deleted?` returns true only for `pending / mapping
/ completed / failed` — never mid-processing.

**Rule (confirmed):** `Spree::Imports::Products` is a 14-line thin subclass
declaring `row_processor_class` + `group_column`. Every import type (customers,
products, price_list_prices, product_translations, purchase_orders) follows the
same engine.

### 2.9 Multi-vendor marketplace support

`product.rb:170` — `belongs_to :seller, optional: true`. `product.rb:222` —
`has_many :submissions, class_name: 'Spree::ProductSubmission'`.

**Rule (confirmed):** a product can belong to a seller or to the store directly.
The `ProductSubmission` records the seller-review workflow: seller submits
(`proposed`) → operator approves (`active`) or rejects (`rejected`).

## 3. How do we know? (evidence)

10 evidence blocks in `evidence/excerpts.txt` (838 lines). Each is a `nl -ba`
numbered excerpt. Licence confirmed from `LICENSE`. Provenance: shallow clone of
the official `spree/spree` repository at commit
`53d2936a5750d9a3b806b97a45c7712393b35622`.

## 4. What did we not prove?

- **The exact service workflow transition logic.** `Products::Propose`,
  `Products::Approve`, `Products::Reject`, `Products::Duplicator` exist under
  `spree/core/app/models/spree/products/` (located via `find`) but were not read
  line-by-line. *Likely* straightforward status writes + event publishes, but
  not proven.
- **The product import row processor.** `row_processor_class` returns a constant
  I did not read. The CSV-column-to-model-attribute mapping is *not proven*.
- **Spree's full Variant model.** Read only the Product model. The Variant's
  SKU/price/stock structure is inferred from associations, not directly read.
- **Real-world performance of bulk operations** at Spree's scale. Source-confirmed
  only.

## 5. What should the owner do next?

For the **football affiliate marketplace build**, take from Spree (re-implement
in TypeScript; BSD-3 permits direct adaptation but Ruby ≠ TS):

1. **Product + Variant as separate entities**, even for single-variant products.
2. **5-status state machine:** `draft / active / archived` (operator-set, bulk-
   updateable) + `proposed / rejected` (review only, NOT bulk-updateable). Default
   on create: `draft`.
3. **3-condition publish gate:** `available? = (status == 'active') && (deleted_at
   IS NULL) && (available_on IS NULL OR available_on <= now)`.
4. **Status transitions in service workflows**, not model methods. Side-effects
   (events, notifications, cache invalidation) in the workflow.
5. **`discontinue()` action** that bypasses validation, sets `discontinue_on =
   now`, `status = 'archived'`.
6. **Soft-delete via `deleted_at` column.** Default query scope excludes deleted.
7. **Tags scoped per-tenant** (composite index on `(store_id, tag)`).
8. **Bulk operations as shared module**, not duplicated per entity. All guarded
   by `require_ids!`. Skip-counting in response.
9. **Two-phase CSV import:** mapping (parse + validate) → processing (persist).
   Per-row status. Grouped COUNT for progress. No delete mid-processing.

Do **not** take from Spree:

- Multi-vendor seller/submission workflow (we're the only seller in v1).
- Spree's full checkout/payments/shipping/tax logic (Amazon handles money).
- The Rails admin dashboard UI (we'll model our own).
- The `acts_as_paranoid` / `acts_as_taggable` gems directly — re-implement the
  patterns in Postgres + TypeScript.

## 6. Confidence summary

| Finding | Confidence |
|---|---|
| Product = catalog grouping; Variant = purchasable | confirmed |
| 5-status state machine (draft/active/archived + proposed/rejected) | confirmed |
| Status transitions in service workflows, not model methods | confirmed |
| 3-condition publish gate (active + not-deleted + available_on <= now) | confirmed |
| `discontinue!` bypasses validation | confirmed |
| Soft-delete via `deleted_at` | confirmed |
| Tags scoped per-tenant | confirmed |
| Bulk actions with `require_ids!` + skip counting | confirmed |
| Bulk operations as shared concern | confirmed |
| Two-phase import (mapping → processing) | confirmed |
| Per-row status tracking with grouped COUNT | confirmed |
| `can_be_deleted?` guard on import | confirmed |
| Lifecycle events published for subscribers | confirmed |
| Multi-vendor seller + submission review | confirmed |
| Exact service workflow transition logic | likely (located, not read line-by-line) |
| Exact product import row mapping | not proven (row processor class not read) |
| Spree at scale behaves as in source | not proven (would need a run) |

---

**Engagement 04 — complete.** Next: engagement 05 (athletica/rollout own +
NextBase — multi-lock admin auth + RLS), engagement 06 (Plausible / Umami —
privacy-first click analytics), engagement 07 (Vercel Commerce — storefront UX).

# Sample — Spree

## Identity

| Field | Value |
|---|---|
| Name | Spree (spree/spree) |
| Type | Ruby on Rails monorepo (Turborepo-style `packages/`, Rails engines under `spree/`) |
| Version / commit | `53d2936a5750d9a3b806b97a45c7712393b35622` (2026-11-16) |
| Provenance | `git clone --depth 1 https://github.com/spree/spree.git` on 2026-11-16 |
| Licence | **BSD 3-Clause** — most permissive in this engagement set |
| Size | 272 MB |
| File count | 9,324 (excluding `.git/` and `node_modules/`) |

## Provenance handling

Shallow clone of the official `spree/spree` repository on GitHub. No fork, no mirror.
Working tree read-only.

## Layout (key directories)

```
spree/
  LICENSE                            BSD 3-Clause
  spree/
    core/
      app/models/spree/
        product.rb                    THE PRODUCT MODEL (1,066 lines)
        import.rb                     THE IMPORT ENGINE (556 lines)
        imports/products.rb           product-specific import subclass
        import_schemas/products.rb     the import schema definition
      app/models/spree/products/     service workflows (Propose, Approve, Reject, Duplicator)
    api/
      app/controllers/spree/api/v3/
        admin/products_controller.rb  THE ADMIN CRUD + BULK API (488 lines)
        concerns/spree/api/v3/
          bulk_operations.rb          shared bulk action concern (101 lines)
  packages/
    dashboard/                        the admin React frontend (out of scope)
    core/                             shared TS packages (out of scope)
```

## Lab status

Not applicable. Mode A, static-only. No lab named, none required.

## Handling rule

Treat as read-only reference under BSD-3. Most permissive licence in the engagement
set — direct adaptation would be permitted. But Ruby ≠ TypeScript, so we extract
rules and re-implement in TypeScript regardless.

## Open triage questions for static analysis

1. **Product model fields + associations** — what columns? What's the variant/price/stock graph?
2. **Status state machine** — what statuses? Who transitions them? Service objects?
3. **Publish gate** — when is a product available? Three conditions?
4. **Admin CRUD endpoints** — single + bulk?
5. **Bulk operations** — status update, category/collection assignment, destroy?
6. **Import engine** — two-phase? Row-level status? Retry?
7. **Multi-vendor** — sellers, submissions, review workflow?

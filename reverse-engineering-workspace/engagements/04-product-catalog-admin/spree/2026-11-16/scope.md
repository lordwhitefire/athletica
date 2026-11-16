# Scope — Engagement 04, Sample: Spree

**Date:** 2026-11-16
**Engagement:** 04 — Manual product catalog + admin CRUD + bulk import
**Sample slug:** spree
**Mode:** A — open-source RE under licence, static only

## 1. The target

Spree (spree/spree) — an open-source Ruby on Rails e-commerce platform. 17+ years of
development (v5.x, last commit today 2026-11-16). 272 MB, 9,324 files. The most
mature product-catalog model we will study. Multi-vendor marketplace support added
in v6.

Local path: `reverse-engineering-workspace/samples/spree/`

## 2. The question

The previous engagements gave us redirect (01), commissions (02), and Amazon
marketplace routing (03). This engagement answers the catalog + admin questions:

1. **Product data model** — what entities? How is a product structured (variants,
   prices, stock, media, options)? Is the product a "catalog grouping" or a
   purchasable thing?
2. **Status lifecycle** — what states does a product go through? (draft, active,
   archived, plus review states proposed/rejected.) Who can transition them?
3. **Publish / unpublish rule** — when is a product visible in the storefront?
   Three conditions? Soft-delete? Future-publish scheduling?
4. **Admin CRUD** — what does the admin API support? Single-resource create/update/
   destroy + bulk variants?
5. **Bulk operations** — bulk status update, bulk add/remove from categories,
   bulk destroy? Id validation? Status-aware skip counting?
6. **Bulk import** — CSV/JSON import? Two-phase (mapping + processing)? Row-level
   status tracking?
7. **Multi-vendor marketplace** — sellers, product submissions, review workflow.

## 3. Ownership basis (mode A — BSD 3-Clause)

| Field | Value |
|---|---|
| Repository owner | Vendo Sp. z o.o., Vendo Connect Inc. (formerly Spark Solutions, Spree Commerce Inc.) |
| Licence | **BSD 3-Clause** (`LICENSE` head confirms) — most permissive in this engagement set |
| Permission basis for RE | BSD-3 permits unrestricted use, modification, distribution, even commercial. We exercise *study*. |
| What we extract | Data model, status state machine, publish gate, bulk operation patterns, import engine rules. |
| What we will NOT do | Copy Ruby source into our build (different stack — TypeScript). Run Rails. `bundle install`. |

## 4. Mode

**A** — open source under a permissive licence. Static analysis only. No lab.

## 5. Allowed actions

- **Static analysis:** yes. `rg`, `find`, plain `Read` on Ruby source.
- **Dynamic analysis:** no. No Rails, no `bundle`, no DB setup.
- **Network:** no.
- **Modify original:** no.
- **Patch / forward-engineer:** no.

## 6. Out of scope

- Spree's frontend storefront views (separate engagement for storefront UX — engagement 07).
- Spree's checkout / payments / shipping logic (we don't handle money — Amazon does).
- Spree's tax / promotions / inventory (not relevant to our affiliate model).
- The full Rails admin dashboard UI (we'll model our own admin).

## 7. Tools present

`rg`, `find`, `file`, `xxd`, `strings`, `python3`, `node`. Sufficient for Ruby source.

## 8. Stop conditions

Stop if a rule cannot be supported by `file:line`; if the sample is a non-official
fork; if copying code would be required (then stop — re-implement, don't copy).

## 9. Approver

Owner: `lordwhitefire`. Date: 2026-11-16.

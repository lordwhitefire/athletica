# Scope — Engagement 07, Sample: Vercel Commerce

**Date:** 2026-11-16
**Engagement:** 07 — Storefront UX (product grid, detail page, "Buy on Amazon" CTA)
**Sample slug:** vercel-commerce
**Mode:** A — open-source RE under licence, static only

## 1. The target

Vercel Commerce (vercel/commerce) — the canonical Next.js + Shopify storefront
template by Vercel. Last commit 2026-10-19 (the repo is being archived, per
README, but the UX patterns are still current and widely copied). Small and
focused: 78 files, 1.2 MB. Next.js 15.6 canary + React 19 + Tailwind 4 + Shopify
GraphQL.

Local path: `reverse-engineering-workspace/samples/vercel-commerce/`

## 2. The question

The previous engagements gave us redirect (01), commissions (02), Amazon
routing (03), catalog (04), auth (05), analytics (06). Engagement 07 answers the
storefront UX questions:

1. **Homepage layout** — what's the hierarchy? Hero grid, carousel, footer?
2. **Product grid** — how is a product card laid out? What information hierarchy?
3. **Product detail page** — image gallery + buy-box split? What's in the buy-box?
4. **Variant selection** — URL params or React state? How is availability shown?
5. **SEO** — metadata generation? JSON-LD structured data? Tag-based visibility?
6. **CTA placement** — where does the "Add to Cart" / "Buy" button sit?
7. **Affiliate adaptation** — how do we map "Add to Cart" → "Buy on Amazon" (external redirect)?

## 3. Ownership basis (mode A — MIT)

| Field | Value |
|---|---|
| Repository owner | Vercel, Inc. |
| Licence | **MIT** (`license.md` confirms) |
| Permission basis | MIT permits unrestricted use, copy, modify, sublicense. We may adapt code directly. |
| What we extract | Homepage layout rules, product card hierarchy, buy-box composition, variant-selector state pattern, SEO + JSON-LD rules, CTA placement. |
| What we will NOT do | Run the storefront. `pnpm install`. Connect Shopify. |

## 4. Mode

**A** — open source under a permissive licence. Static analysis only. No lab.

## 5. Allowed actions

- **Static analysis:** yes. `rg`, `find`, plain `Read` on TypeScript + TSX.
- **Dynamic analysis:** no.
- **Network:** no.
- **Modify original:** no.
- **Patch / forward-engineer:** no.

## 6. Out of scope

- The Shopify GraphQL integration (we use Amazon, not Shopify).
- The cart + checkout flow (we redirect to Amazon — no cart).
- The full navbar / search / footer components (extract pattern only).
- The `revalidate` API route.

## 7. Tools present

`rg`, `find`, `file`, `python3`, `node`. Sufficient.

## 8. Stop conditions

Stop if a rule cannot be supported by `file:line`; if copying code would be
required to answer (then stop — though MIT permits it, we re-implement for
consistency with the rest of the build).

## 9. Approver

Owner: `lordwhitefire`. Date: 2026-11-16.

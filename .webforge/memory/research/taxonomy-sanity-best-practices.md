# Sanity CMS: Hierarchical Taxonomies for E-Commerce

**Author:** Odin-Birch  
**Date:** 2026-07-18  
**Task:** taxonomy-research-001  
**Part:** 2 of 2 (Sanity CMS)

---

## 1. Document References vs Nested Structures

### References (`_ref`) — Recommended for Categories

**Use Sanity references for taxonomies.** The `reference` type is the standard way to model relationships. (source: [Sanity Reference Type Docs](https://www.sanity.io/docs/reference-type))

```typescript
// Recommended: category as standalone document with parent reference
export default {
  name: 'category',
  type: 'document',
  fields: [
    { name: 'title', type: 'string' },
    { name: 'slug', type: 'slug', options: { source: 'title' } },
    {
      name: 'parent',
      type: 'reference',
      to: [{ type: 'category' }],
      weak: true
    }
  ]
}
```

**Why references over nested objects:**
1. **Reusability** — Same category across multiple products (normalized).
2. **Queryability** — GROQ filters by reference efficiently using `references()`.
3. **Studio UX** — Autocomplete, inline creation, search.
4. **Integrity** — Strong references prevent deleting referenced documents.

### Performance Implications

- Each `->` operator is a **hidden subquery**. Resolve once, don't repeat.
- **No hard depth limit** on reference chains, but performance degrades with depth.
- **Pre-computed `ancestors` array** (CommerceTools pattern) recommended for deep hierarchies. (source: [Sanity High-Performance GROQ](https://www.sanity.io/docs/developer-guides/high-performance-groq))

---

## 2. Best Practices for E-commerce Taxonomies

### Recommended Category Schema

```typescript
import { defineType, defineField } from 'sanity'

export default defineType({
  name: 'category', title: 'Category', type: 'document',
  fields: [
    defineField({ name: 'title', type: 'string', validation: Rule => Rule.required() }),
    defineField({ name: 'slug', type: 'slug', options: { source: 'title' } }),
    defineField({
      name: 'parent', title: 'Parent Category', type: 'reference',
      to: [{ type: 'category' }],
      options: { filter: '!(_id in path("drafts.**"))' }
    }),
    defineField({ name: 'description', type: 'text', rows: 3 }),
    defineField({ name: 'image', type: 'image' }),
    defineField({ name: 'sortOrder', type: 'number', initialValue: 0 })
  ]
})
```

### Self-Referencing Pattern

Standard for hierarchical taxonomies in Sanity. (source: [Sanity Reference Type Docs](https://www.sanity.io/docs/reference-type))

```groq
// Get category with parent details
*[_type == "category" && slug.current == $slug][0] {
  title, slug,
  "parentTitle": parent->title,
  "parentSlug": parent->slug.current
}
```

### GROQ — Category Tree with Nested Children

**Option 1: Flat query + client-side tree building (RECOMMENDED):**
```groq
*[_type == "category"] {
  _id, title, slug, sortOrder,
  "parentId": parent->_id
} | order(sortOrder asc)
```

**Option 2: Recursive GROQ (max 3-4 levels):**
```groq
*[_type == "category" && !defined(parent)] {
  _id, title, slug,
  "children": *[_type == "category" && parent._ref == ^._id] {
    _id, title, slug,
    "children": *[_type == "category" && parent._ref == ^._id] {
      _id, title, slug
    }
  }
} | order(sortOrder asc)
```

**Option 3: Pre-computed ancestors (like CommerceTools):**
```typescript
{
  name: 'ancestors',
  type: 'array',
  of: [{ type: 'reference', to: [{ type: 'category' }] }],
  readOnly: true, hidden: true
}
```

---

## 3. GROQ Query Patterns for E-commerce

### "All Products in This Category"

**Direct reference query (most efficient, indexed):**
```groq
*[_type == "product" && references($categoryId)] { _id, title, slug, price }
```

**Using `references()` with parent operator:**
```groq
// Products in the same category as a given product
*[_type == "product" && _id == $productId][0] {
  _id, title,
  "relatedProducts": *[_type == "product"
    && _id != ^._id
    && count(categories[]->_id in ^.categories[]->_id) > 0
  ] { _id, title, slug, price }
}
```

**Products in category OR its children:**
```groq
{
  "categoryData": *[_type == "category" && slug.current == $slug][0] {
    _id,
    "childIds": *[_type == "category" && _id in path("^._id + ".**")]
  },
  "products": *[_type == "product" && references(^.categoryData.childIds)]
}
```

### Export Products with Expanded Categories

```groq
*[_type == "product"] {
  _id, title, slug, price,
  "brand": brand->name,
  "categories": categories[]-> {
    _id, title, slug,
    "path": [...ancestors[]->title, title]
  },
  variants
}
```

### Export Category Tree to JSON

```groq
// Flat export (for client-side tree building)
*[_type == "category"] {
  _id, title, slug,
  "parentId": parent->_id, sortOrder
} | order(sortOrder asc)
```

### Build-Time Script Pattern (Next.js + Sanity)

```typescript
// lib/sanity/queries.ts
import { groq } from 'next-sanity'

export const categoriesQuery = groq`*[_type == "category"] {
  _id, title, slug, "parentId": parent->_id, sortOrder
} | order(sortOrder asc)`

export const productsWithCategoriesQuery = groq`*[_type == "product"] {
  _id, title, slug, price,
  "brand": brand->name,
  "categories": categories[]-> { _id, title, slug }
}`
```

```typescript
// data/generate-static-data.ts
import { client } from '@/lib/sanity/client'

export async function generateCategoryTree() {
  const categories = await client.fetch(categoriesQuery)
  return buildTree(categories)
}

function buildTree(flatList) {
  const map = {}; const roots = []
  flatList.forEach(c => { map[c._id] = { ...c, children: [] } })
  flatList.forEach(c => {
    if (c.parentId) map[c.parentId]?.children.push(map[c._id])
    else roots.push(map[c._id])
  })
  return roots
}
```

---

## 4. Key Performance Considerations

1. **References are subqueries** — Each `->` is a hidden subquery. Resolve once. (source: [Sanity High-Performance GROQ](https://www.sanity.io/docs/developer-guides/high-performance-groq))
2. **Filter by `_ref` directly** — Use `author._ref == "bob-id"` not `author->name == "Bob"`.
3. **Use `references()` function** — GROQ-engine optimized.
4. **Prefer flat queries** for large trees. Recursive GROQ doesn't scale past 3-4 levels.
5. **Avoid joins in filters** — `*[author->name == "Bob"]` is expensive. Use ID directly.
6. **Parallel independent queries** — Break superqueries into parallel requests.

---

## Source Reference Index

| # | Source | URL |
|---|--------|-----|
| 1 | Sanity Reference Type Docs | https://www.sanity.io/docs/reference-type |
| 2 | Sanity GROQ Introduction | https://www.sanity.io/docs/content-lake/groq-introduction |
| 3 | Sanity GROQ Query Cheat Sheet | https://www.sanity.io/docs/content-lake/query-cheat-sheet |
| 4 | Sanity High-Performance GROQ | https://www.sanity.io/docs/developer-guides/high-performance-groq |
| 5 | Sanity How GROQ Queries Work | https://www.sanity.io/docs/content-lake/how-queries-work |

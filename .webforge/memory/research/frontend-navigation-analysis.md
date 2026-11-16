# Frontend Navigation Analysis — Types, Validation, Server Actions

**Analyzed files:**
- `frontend/src/types/navigation.ts`
- `frontend/src/lib/schemas/navigation.ts`
- `frontend/src/lib/actions/navigation.ts`

**Supporting files referenced for context:**
- `frontend/src/lib/rebuild-nav-urls.ts`
- `frontend/src/lib/getNavigation.ts`
- `frontend/src/lib/validate.ts`
- `studio-athletica/schemaTypes/navigation.ts` (Sanity schema)
- `studio-athletica/schemaTypes/navItem.ts` (Sanity schema)
- `studio-athletica/schemaTypes/navLink.ts` (Sanity schema)

---

## 1. Type Definitions (`types/navigation.ts`)

### `NavLink`
| Field | Type | Required | Notes |
|---|---|---|---|
| `label` | `string` | ✅ | |
| `href` | `string` | ✅ | |
| `description` | `string` | ❌ (optional) | |

Maps to Sanity `navLink` schema (§ `navLink.ts` fields: label, href, description).

### `NavItem`
| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | |
| `level` | `number` | ✅ | |
| `label` | `string` | ✅ | |
| `href` | `string \| null` | ✅ | Note: nullable, unlike Sanity |
| `disabled` | `boolean` | ❌ (optional) | |
| `description` | `string` | ❌ (optional) | |
| `slug` | `string` | ❌ (optional) | |
| `featuredImage` | `string` | ❌ (optional) | Type is `string` (URL path), Sanity stores as `image` type |
| `customLinks` | `NavLink[]` | ❌ (optional) | Matches Sanity `customLinks` array of `navLink` |
| `sizeLinks` | `NavLink[]` | ❌ (optional) | Matches Sanity `sizeLinks` array of `navLink` |
| `bottomLinks` | `NavLink[]` | ❌ (optional) | Matches Sanity `bottomLinks` array of `navLink` |
| `children` | `NavItem[]` | ❌ (optional) | Recursive self-reference |

Maps to Sanity `navItem` schema (§ `navItem.ts`). All Sanity fields are represented.

### `NavigationData`
| Field | Type | Required | Notes |
|---|---|---|---|
| `id` | `string` | ✅ | |
| `level` | `number` | ✅ | |
| `slug` | `string` | ✅ | Derived from `_key` in `getNavigation.ts` |
| `label` | `string` | ✅ | |
| `href` | `string` | ✅ | |
| `children` | `NavItem[]` | ✅ | The top-level groups always have children |

This type represents a **top-level navigation group** (e.g., "Boots", "Multi-Stud Boots"). It is constructed in `getNavigation.ts` from the root-level items in the Sanity `items` array.

---

## 2. Zod Validation Schemas (`lib/schemas/navigation.ts`)

### Local interface `CategoryNavItem`
| Field | Type | Required | Notes |
|---|---|---|---|
| `_key` | `string` | ❌ (optional) | Sanity array key |
| `label` | `string` | ✅ | |
| `href` | `string` | ❌ (optional) | |
| `children` | `CategoryNavItem[]` | ❌ (optional) | Recursive |

**Note:** The name `CategoryNavItem` is potentially misleading — it has nothing to do with product categories. It's simply a recursive nav node.

### `navigationItemSchema` (Zod)
```typescript
z.object({
  _key: z.string().optional(),
  label: z.string().min(1, "Label is required."),
  href: z.string().optional().default(""),
  children: z.array(z.lazy(() => navigationItemSchema)).optional().default([]),
})
```

**Validation rules:**
- `label`: **required**, must have min length 1 (cannot be empty)
- `_key`: **optional** string, no length validation
- `href`: **optional** string, **defaults to `""`** if not provided. Note: the TypeScript type `NavItem.href` is `string | null`, but Zod coerces missing `href` to `""`, never `null`.
- `children`: **optional** array of the same schema, **defaults to `[]`** if not provided

### `navigationSchema`
```typescript
z.array(navigationItemSchema)
```
Simply wraps the item schema in an array.

### `NavigationItemInput`
```typescript
type NavigationItemInput = z.infer<typeof navigationItemSchema>
```
This is the inferred TypeScript type from the Zod schema. It would be:
```typescript
{
  _key?: string;
  label: string;
  href?: string;
  children?: NavigationItemInput[];
}
```

---

## 3. Server Actions (`lib/actions/navigation.ts`)

### `getNavigationDoc()`
| Aspect | Value |
|---|---|
| **Input** | None |
| **Output** | `ApiResult<Record<string, unknown>>` |
| **Query** | `*[_type == "navigation"][0]` |
| **Behavior** | Fetches the single navigation document from Sanity. Returns raw `Record<string, unknown>` (no type enforcement). |

### `saveNavigation(items)`
| Aspect | Value |
|---|---|
| **Input** | `Record<string, unknown>[]` — an array of raw navigation items |
| **Output** | `ApiResult<{ saved: true }>` |
| **Pipeline** | 1. `validateOrFail(navigationSchema, items)` — Zod validation against `navigationItemSchema`<br>2. `rebuildNavUrls(parsed.data as NavItem[])` — generate auto-IDs and `/en/{segments}` hrefs<br>3. `getNavigationDoc()` — check if doc exists<br>4. If no doc: `adminClient.create(...)` with `_type: "navigation", _id: "navigation"`<br>5. If doc exists: `adminClient.patch(...).set({ items: rebuilt }).commit()` |
| **Side effects** | `revalidatePath("/admin/navigation")` |

### `getModelNavTreeAction()`
| Aspect | Value |
|---|---|
| **Input** | None |
| **Output** | `ApiResult<ModelNavNode[]>` |
| **Behavior** | Delegates to `getModelNavTree()` from `getNavigation.ts` which reads from `data/navigation.json` and builds a deduplicated tree of labels for level ≥ 3 items. |

---

## 4. Key Observations

### 4.1 Zod Schema is a Subset of TypeScript Types (Major Gap)

The Zod schema (`navigationItemSchema`) only validates 4 fields: `_key`, `label`, `href`, `children`. The TypeScript `NavItem` has **13 fields**. This means:

- **Extra fields are silently stripped** by `validateOrFail` → `schema.safeParse()`. Zod's `safeParse` discards unknown properties by default (no `.passthrough()` call). So `id`, `level`, `description`, `disabled`, `slug`, `featuredImage`, `customLinks`, `sizeLinks`, `bottomLinks` are all **removed** before the data reaches `rebuildNavUrls`.

- **This works only because** `rebuildNavUrls` re-generates `id` and `href` from scratch, and the `NavItem` type's other fields are optional — they get dropped but the system doesn't crash. However, this means **`description`, `disabled`, `slug`, `featuredImage`, `customLinks`, `sizeLinks`, `bottomLinks` cannot be saved through the `saveNavigation` action** as currently implemented.

### 4.2 `href` Nullability Mismatch

| Layer | `href` type |
|---|---|
| Sanity `navItem` | `string` (optional → undefined) |
| TS `NavItem` | `string \| null` |
| Zod `navigationItemSchema` | `string` (defaults to `""`) |

In real data (see `navigation.json`), `href` is `null` for `NavLink` entries, not for `NavItem` entries. The TypeScript type is slightly broader than reality.

### 4.3 `_key` vs `id` Dualism

- **Sanity** uses `_key` as the auto-generated array item identifier.
- **TypeScript types** use `id` as a required string field.
- **`getNavigation.ts`** coalesces: `item.id || item._key || ""` (line 13).
- **`rebuild-nav-urls.ts`** coalesces: `item.id || generateId()` (line 13).
- **Zod schema** only validates `_key` (optional) — it has **no `id` field**.
- **Important downstream**: in `getNavigation.ts`, `NavigationData.slug` is derived from `item._key` (line 40), not from `item.slug`.

### 4.4 `NavigationData` vs `NavItem` — Two Related But Different Types

`NavigationData` is the **top-level group wrapper** (the root items from the Sanity `items` array). `NavItem` is the recursive node used within those groups. They share common fields but differ in:
- `NavigationData.slug` is **required** (derived from `_key`); `NavItem.slug` is **optional**
- `NavigationData.children` is **required**; `NavItem.children` is **optional**
- `NavigationData.href` is **`string`** (not nullable); `NavItem.href` is **`string | null`**

### 4.5 `featuredImage` Type Mismatch

- **Sanity** stores `featuredImage` as an `image` type (object with asset reference).
- **TypeScript** types it as `string` (presumably a URL).
- The transform in `getNavigation.ts` just casts: `item.featuredImage as string | undefined`.
- The Zod schema doesn't include `featuredImage` at all.

### 4.6 "Category" is Not a Navigation Concept

- The word "category" **does not appear** in `types/navigation.ts`, `lib/schemas/navigation.ts`, or `lib/actions/navigation.ts` (except as a local interface name `CategoryNavItem` in the schemas file, which is misleading but unrelated to product categories).
- The **only** reference to `product.category` is in `getNavigation.ts` line 220, where it's used to **match** a product's category string against navigation item labels for breadcrumb routing. That's a read-time concern, not a data model concern.

### 4.7 Nested Structure Handling

The Zod validation handles nested structure via `z.lazy(() => navigationItemSchema)` — this allows recursive validation of `children` arrays to arbitrary depth. However, since the schema strips unknown fields, all nested children also lose their optional fields.

The `rebuildNavUrls` function then recursively processes the validated (stripped) tree, assigning auto-generated IDs and `/en/{segments}` paths.

The Sanity save upserts the entire tree as one document (`navigation`), creating or patching as needed. There is no individual item CRUD — it's always a full-tree replacement.

### 4.8 Data Source Split

- **Write path**: `saveNavigation` → Zod validation → `rebuildNavUrls` → Sanity `adminClient`
- **Read path**: `getNavigation` → `data/navigation.json` file (NOT Sanity directly)
- **Server actions also read**: `getNavigationDoc` → Sanity directly (for determining create vs. patch)
- **Webhook**: `app/api/webhooks/sanity-navigation/route.ts` watches for navigation changes and presumably regenerates the JSON file.

This split (write to Sanity, read from JSON file) is a common pattern for performance but introduces a potential staleness gap.

### 4.9 `ModelNavNode` Tree

The `ModelNavNode` interface (defined in `getNavigation.ts`):
```typescript
export interface ModelNavNode {
    label: string;
    children: ModelNavNode[];
}
```
This is used exclusively for building model-level navigation trees (only items at level ≥ 3, deduplicated by label). It's a simplified read-model, separate from the NavItem/NavigationData hierarchy.

---

## Summary of Disconnects

| Issue | Severity | Details |
|---|---|---|
| Zod strips extra fields | **High** | `saveNavigation` silently discards `id`, `level`, `description`, `disabled`, `slug`, `featuredImage`, `customLinks`, `sizeLinks`, `bottomLinks` |
| `href` nullability | Medium | TS says `string \| null`, Zod defaults to `""` |
| `featuredImage` type mismatch | Medium | Sanity has `image` object, TS has `string` |
| `CategoryNavItem` naming | Low | Interface name suggests category but it's just a recursive nav node |
| No per-item CRUD | Low | Always full-tree replacement, no granular updates |
| Read/write split | Low | Writes to Sanity, reads from `navigation.json` |
| `_key` vs `id` dualism | Medium | Two identifier concepts, coalesced inconsistently |

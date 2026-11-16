# Data Architecture & State Management — Athletica

> Compiled by Athena (Intelligence Dept) on 2026-07-12
> Source: Full source tree scan

---

## Data Sources Overview

| Data | Source | Frontend Read | Admin Write |
|---|---|---|---|
| Products | Sanity → JSON files | `data/products/*.json` (file read) | Direct Sanity mutation (admin panel) |
| Homepage | Sanity → JSON file | `data/homepage.json` (file read) | Direct Sanity mutation (homepage editor) |
| Navigation | Sanity → JSON file | `data/navigation.json` (file read) | Direct Sanity mutation (navigation editor) |
| Brands | Sanity → JSON file | `data/brands.json` (file read) | Direct Sanity mutation (brands editor) |
| Amazon Links | Sanity → JSON file | `data/amazon-links.json` (file read) | Direct Sanity mutation (amazon-links editor) |
| Site Settings | Sanity → JSON file | `data/site-settings.json` (file read) | Direct Sanity mutation (settings editor) |
| User Profiles | Supabase `profiles` table | Supabase client (browser/server) | Auth signup trigger |
| Auth State | Supabase Auth | Supabase SSR session | Login/Register/Logout actions |
| Cart | Browser cookie | Cookie parse on mount | `addToCart`, `removeFromCart`, etc. |
| Wishlist | localStorage (via Zustand persist) | Zustand store hydrate | `toggleWishlist` |

---

## Sanity → JSON Sync Pipeline

### Webhook Flow
```
Sanity document change
    ↓ (webhook POST /api/webhooks/sanity-navigation)
Next.js API route (HMAC verification)
    ↓
GitHub Actions workflow (.github/workflows/sanity-json-update.yml)
    ↓
Reads Sanity documents, writes to data/*.json
    ↓
Commit + push to repo
```

### Revalidation
- `revalidatePath()` called after admin mutations (products, homepage, navigation, etc.)
- Page-level `revalidate = 60` (ISR at 60s) on homepage and catch-all routes
- Admin layout uses `export const dynamic = "force-dynamic"`

---

## Product Data Schema

**Sanity Schema** (`studio-athletica/schemaTypes/product.ts`):
```
product document:
  - id: string
  - url_slug: slug (source: model)
  - model: string
  - brand: reference → brand document
  - category: string
  - traction: string (optional)
  - name: string (optional)
  - gender: string
  - main_image: image
  - image_gallery: array of images
  - thumbnail: image
  - color: string
  - color_variants: array of colorVariant (color, product_id, thumbnail)
  - price: productPrice (current, original, discount_percent, member_price, currency)
  - sizes: array of productSize (size, available, stock)
  - description: productDescription (subtitle, tagline, intro, collection, key_benefits[], technical_details)
```

**Frontend Type** (`src/types/product.ts`):
```typescript
interface Product {
  id: string; url_slug: string; model: string; brand: string;
  category: string; traction: string | null; name: string | null;
  gender: string; main_image: string; image_gallery?: string[];
  thumbnail: string; color: string; color_variants?: ColorVariant[];
  price: Price; sizes: Size[]; description: Description;
}
```

**Data Directory** (`data/products/`): ~28 product JSON files (e.g., `adidas-predator-elite-fg-black.json`)

---

## Homepage Data Schema

**Sanity Schema** (`studio-athletica/schemaTypes/homepage.ts`):
```
homepage document:
  - hero_carousel: { id, auto_switch_ms, banners[] }
  - sections: array of:
    - category_grid: { id, type, title, variant, bg, snapshot, viewAllLink, viewAllLabel, items[] }
    - product_carousel: { id, type, variant, title, subtitle, snapshot, filter{}, sort, limit, link, link_label }
    - category_carousel: { id, type, variant, title, snapshot, autoSwitchMs, cards[] }
```

**Current homepage sections**: 28 sections (3 category carousels, 16 product carousels, 9 category section panels)

**Data resolution** (`src/lib/getHomepageJson.ts`):
1. Read `data/homepage.json`
2. Transform Sanita data to frontend shape
3. For each `product_carousel` section: derive filter from link → `filterProducts()` → slice to limit
4. Cached with React `cache()`

---

## Navigation Schema

**Sanity Schema** (`studio-athletica/schemaTypes/navigation.ts`):
```
navigation document:
  - title: string
  - items: array of navItem (recursive)
```

**NavItem structure**:
```typescript
interface NavItem {
  id: string; level: number; label: string;
  href: string | null; disabled?: boolean;
  description?: string; slug?: string;
  featuredImage?: string;
  customLinks?: NavLink[]; sizeLinks?: NavLink[]; bottomLinks?: NavLink[];
  children?: NavItem[];
}
```

Navigation is 4 levels deep: Group (L1) → Category (L2) → Subcategory (L3) → Items (L4)

---

## State Management Strategy

### Server State (React Server Components)
- Product data, homepage, navigation → `cache()` wrapped readFile
- ISR with `revalidate = 60` on public pages
- No SWR/React Query — all data fetched at request time or build time

### Client State

| State | Mechanism | Persistence | Scope |
|---|---|---|---|
| Auth | Context (`AuthContext`) | Supabase session cookie | Global |
| Cart | Context (`CartContext`) | Cookie `athletica_cart` (30 day) | Global |
| Toast | Zustand + Context (`ToastContext`) | None (ephemeral) | Global |
| Wishlist | Zustand (`wishlist.ts`) | localStorage (`athletica_wishlist`) | Global |
| Category filters | URL search params | URL (shareable) | Per page |
| Form state | react-hook-form | None | Per form |

### Cart Implementation
- **Storage**: Cookie `athletica_cart`, JSON-serialized, 30-day expiry
- **Operations**: addToCart, removeFromCart, updateQuantity, clearCart, isInCart
- **Persistence**: Loaded from cookie on mount, saved on every mutation
- **No server-side cart**: Cart is purely client-side — no database storage
- **Guest checkout**: No account required
- **Limitation**: Per-device only, no cross-device sync

### Auth Implementation
- **Provider**: Supabase Auth via `@supabase/ssr`
- **Session**: httpOnly cookies (server-rendered)
- **User profile**: `profiles` table in Supabase (auto-created on signup via trigger)
- **Roles**: `customer` (default) or `admin`
- **Login methods**: Email/password only (no social, no magic link)
- **Rate limiting**: 5 attempts per 60s (Upstash sliding window)
- **Password reset**: Via Supabase default email flow

---

## API Pattern

### Server Actions (`use server`)
All admin mutations are server actions in `src/lib/actions/`:
```typescript
export async function createProduct(formData: FormData): Promise<ApiResult<{ id: string }>> {
  // 1. validateOrFail(productFormSchema, raw)
  // 2. Transform data to Sanity document shape
  // 3. adminClient.createOrReplace(doc)
  // 4. revalidatePath("/admin/products")
  // 5. Return ok({ id })
}
```

### API Routes
Only used for:
- `/api/webhooks/*` — Webhook handlers (Sanity → JSON sync)
- `/api/admin/*` — Admin endpoints that can't be server actions (batch upload, media, build status)

### Error Pattern
```typescript
type ApiResult<T> = { data: T; error: null } | { data: null; error: ApiError }
// ApiError: { type, code, message, fields? }
```

---

## Data Fetching Functions

| Function | File | Source | Caching |
|---|---|---|---|
| `getAllProducts()` | `lib/getProducts.ts` | `data/products/*.json` | React `cache()` |
| `getHomepageConfig()` | `lib/getHomepageJson.ts` | `data/homepage.json` | React `cache()` |
| `getHomepageSections()` | `lib/getHomepageJson.ts` | `data/homepage.json` | React `cache()` |
| `getProductsForCarousel()` | `lib/getHomepageJson.ts` | Products + filter | React `cache()` |
| `getNavigation()` | `lib/getNavigation.ts` | `data/navigation.json` | React `cache()` |
| `getProductBySlug()` | `lib/getProducts.ts` | Products JSON | React `cache()` |
| `getSiteLogoUrl()` | `lib/sanity.ts` | `data/site-settings.json` | None |
| `getAmazonLink()` | `lib/getAmazonLinks.ts` | `data/amazon-links.json` | None |

---

## Supabase Schema

From `supabase/seed.sql`:

```sql
profiles (
  id uuid PK (references auth.users),
  name text,
  email text,
  avatar_url text,
  role text DEFAULT 'customer' (CHECK: customer | admin),
  created_at timestamptz DEFAULT now(),
  updated_at timestamptz DEFAULT now()
)
```

**RLS Policies:**
- Users can view own profile
- Users can update own profile
- Auto-create profile on signup via trigger

**Note**: No `orders`, `order_items`, `shipping_addresses`, or `reviews` tables exist yet.

---

## Testing Data Flow

```
Vitest setup (src/test-utils/setup.tsx)
  ↓
Mocks: next/navigation, next/link, next/image, supabase/client, admin-sanity, framer-motion
  ↓
MSW server (src/lib/mocks/server.ts) with Sanity + Supabase handlers
  ↓
Tests run in jsdom environment
```

MSW intercepts network requests to Sanity CDN and Supabase API during tests.

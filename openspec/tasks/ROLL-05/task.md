# ROLL-05: Customer Product Details Page (Real Data + Pixel-Match UI)

## What and why

Build the customer-facing Product Details page using the pixel-match CSS (File 4) as the visual base and the interactive layer specs (File 3) for behavior. Use real data from ROLL-02 services where available; use mock data only for fields not yet in the database.

## What exists

**Services (real data):**
- `getProductBySlug(slug)` — returns product from `rollout.products` (ROLL-02)
- `recordView(productId)` — records page view (ROLL-03)
- `getAffiliateUrl(productId)` — derives Amazon URL from ASIN (ROLL-04)

**UI code (from files):**
- File 4 (`athletica_rollout1_pixel_match_patch.md`) — pixel-match CSS + component structure
- File 3 (`athletica_rollout1_final_interactive_layer_patch.md`) — interactive layer specs

## What this task does

1. Set up Next.js App Router route at `/product/[slug]`
2. Create the pixel-match component with real data
3. Add affiliate logic (Shop Product with states)
4. Add analytics recording
5. Add loading/error/not-found states
6. Add keyboard gallery controls

## Hard rules

1. **Use pixel-match CSS** — `rollout1-pixel-match.css` with `.pixel-*` classes
2. **Use existing services** — `getProductBySlug`, `recordView`, `getAffiliateUrl`
3. **Real data where available** — use product fields from DB; mock only fields not in schema
4. **No navigation/footer** — customer page has only ATHLETICA header
5. **1440px max** — hard cap, never expand on larger screens
6. **Interactive layer** — Shop Product must have idle/loading/opened/error states
7. **No dead clicks** — every visible control must have a real outcome

## Steps (in order)

Run from the repository root (`/home/lordwhitefire/current-project/athletica/athletica`).

### 1. Create the route directory

```bash
mkdir -p rollout/src/app/product/\[slug\]
```

### 2. Create the pixel-match CSS file

Create `rollout/src/app/product/[slug]/rollout1-pixel-match.css` with the CSS from File 4 (the `pixel-match` patch). This replaces the original `rollout1.css` for the customer page.

### 3. Create the Product Details page (Server Component)

Create `rollout/src/app/product/[slug]/page.tsx`:

```tsx
import { getProductBySlug } from '@/lib/products/product-service';
import { recordView } from '@/lib/analytics/analytics-service';
import ProductDetailsClient from './ProductDetailsClient';
import { notFound } from 'next/navigation';

interface PageProps {
  params: Promise<{ slug: string }>;
}

export default async function ProductPage({ params }: PageProps) {
  const { slug } = await params;
  const product = await getProductBySlug(slug);

  if (!product) {
    notFound();
  }

  // Record view (fire and forget)
  recordView(product.id).catch(console.error);

  return <ProductDetailsClient product={product} />;
}
```

### 4. Create the Client Component (pixel-match structure)

Create `rollout/src/app/product/[slug]/ProductDetailsClient.tsx`:

- Use the component structure from File 4 (pixel-match)
- Replace hardcoded `product` with real data from `getProductBySlug()`
- Map database fields to component props
- Add Shop Product interactive states (idle → loading → opened → error)
- Add keyboard gallery controls (ArrowLeft, ArrowRight, Home, End)
- Add loading/error states for broken images
- Import `rollout1-pixel-match.css`

**Field mapping (DB → component):**

| DB Field | Component Use |
|----------|---------------|
| `name` | Product title (uppercase) |
| `slug` | Route parameter |
| `price` | Price display |
| `color` | Meta pill |
| `gender` | Meta pill |
| `collection` | Collection section + tagline |
| `subtitle` | Subtitle text |
| `intro` | Story section |
| `key_benefits` (JSON) | Benefits grid (cast to `{title, text, icon}[]`) |
| `technical_details` (JSON) | Spec table (cast to `{label, value}[]`) |
| `images` (JSON) | Gallery images |
| `main_image` | Fallback if `images` empty |

### 5. Create the Affiliate API route

Create `rollout/src/app/api/affiliate/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { getAffiliateUrl } from '@/lib/affiliate/affiliate-service';

export async function GET(request: NextRequest) {
  const productId = request.nextUrl.searchParams.get('productId');

  if (!productId) {
    return NextResponse.json({ error: 'Missing productId' }, { status: 400 });
  }

  const result = await getAffiliateUrl(productId);

  if (!result.url) {
    return NextResponse.json({ error: result.error }, { status: 404 });
  }

  return NextResponse.json({ url: result.url });
}
```

### 6. Create the Analytics API route

Create `rollout/src/app/api/analytics/route.ts`:

```typescript
import { NextRequest, NextResponse } from 'next/server';
import { recordView, recordClick } from '@/lib/analytics/analytics-service';

export async function POST(request: NextRequest) {
  const body = await request.json();
  const { productId, eventType } = body;

  if (!productId || !eventType) {
    return NextResponse.json({ error: 'Missing productId or eventType' }, { status: 400 });
  }

  if (eventType !== 'view' && eventType !== 'click') {
    return NextResponse.json({ error: 'Invalid eventType' }, { status: 400 });
  }

  try {
    if (eventType === 'view') {
      await recordView(productId);
    } else {
      await recordClick(productId);
    }
    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: 'Failed to record event' }, { status: 500 });
  }
}
```

### 7. Create the not-found page

Create `rollout/src/app/product/[slug]/not-found.tsx`:

```tsx
import '../rollout1-pixel-match.css';

export default function NotFound() {
  return (
    <main className="pixel-product-page">
      <header className="pixel-product-header">
        <div className="pixel-product-header__inner">
          <div className="pixel-logo">ATHLETICA</div>
        </div>
      </header>
      <article className="pixel-product-shell" style={{ padding: '100px 0', textAlign: 'center' }}>
        <h1 style={{ fontSize: '48px', letterSpacing: '-0.055em' }}>PRODUCT NOT FOUND</h1>
        <p style={{ color: '#a5a5a5', marginTop: '16px' }}>
          This product is no longer available.
        </p>
      </article>
    </main>
  );
}
```

### 8. Verify the code compiles

```bash
cd /home/lordwhitefire/current-project/athletica/athletica/rollout
npx tsc --noEmit
```

Expected: no errors.

### 9. Commit the changes

```bash
cd /home/lordwhitefire/current-project/athletica/athletica
git add rollout/src/app/product/ rollout/src/app/api/
git commit -m "feat(rollout): add customer product details page with pixel-match UI"
```

**Do NOT push.** Owner reviews and pushes.

## Benchmarks (what must be true after this change)

- `/product/[slug]` route exists and loads published products
- Product page fetches from `getProductBySlug()` (real data, not mock)
- Shop Product button calls `/api/affiliate` which derives URL from ASIN
- Shop Product shows states: idle → loading → opened → error
- Page view is recorded on load via `recordView()`
- Shop Product click is recorded via `/api/analytics` (`eventType: 'click'`)
- Gallery supports keyboard navigation (ArrowLeft, ArrowRight, Home, End)
- Not found page shows "PRODUCT NOT FOUND" for missing/unpublished products
- CSS is `rollout1-pixel-match.css` (black/lemon system, `.pixel-*` classes)
- No navigation or footer on customer page
- `npx tsc --noEmit` passes with no errors
- One commit with message `feat(rollout): add customer product details page with pixel-match UI`

## What is explicitly NOT done in this task

- No admin pages (ROLL-06, ROLL-07, ROLL-08)
- No analytics page UI
- No product editor
- No toast system or confirmation dialogs (those are for admin tasks)
- No tests (add later)

---

## ⚠️ ROUND 2 — C8 FIX (testing report 2026-09-04)

Testing found **1 functional gap** (C8). The fix is part of ROLL-05 (Round 2) — **not a new task**.

### STRICT SCOPE — Round 2 touches ONLY ONE FILE, ONE SPOT

The Round 2 fix changes **exactly one spot**: `handleShop()` inside `rollout/src/app/product/[slug]/ProductDetailsClient.tsx` — adding the fire-and-forget POST to `/api/analytics`.

**No other file may change. No other code may change.** The tester will FAIL the round if the diff touches anything else — CSS, routes, services, other components, config. Do not "improve" anything else while you are in there.

### C8 — Shop clicks are NOT recorded in analytics

`handleShop()` currently opens the affiliate URL but never records a click. Clicking "SHOP PRODUCT" records only a view (server-side page load), never a click event.

**Fix** — after successfully opening the affiliate link, fire-and-forget POST to `/api/analytics`:

```js
// inside handleShop(), after window.open(data.url, ...) succeeds:
fetch('/api/analytics', {
  method: 'POST',
  headers: { 'Content-Type': 'application/json' },
  body: JSON.stringify({ productId: product.id, eventType: 'click' }),
}).catch(console.error);
```

Place it after `setShopState('opened')` so the click is recorded only when the affiliate URL was actually derived and opened (not on failure).

**Verification:** run `grep -n "fetch.*analytics" rollout/src/app/product/\[slug\]/ProductDetailsClient.tsx` — expected a match for `/api/analytics` POST inside the Shop click handler.

### C4 — Client does not import service functions directly (NOT a defect)

The tester's literal grep failed because the client component correctly avoids importing server-only service modules. This is the correct architecture (services run in API routes / server components). C4 is a PASS by design — no action needed.
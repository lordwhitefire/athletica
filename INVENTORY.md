# Athletica Frontend — Complete Structural & Content Inventory

---

## GLOBAL LAYOUT (`app/layout.tsx`)

All pages are wrapped by this root layout. It provides:
- **Providers:** `AuthProvider` wraps `CartProvider` which wraps everything
- **Header** — rendered on every page, receives `navigation` data from `getNavigation()`
- **`<main>`** — the page-specific content slot
- **Footer** — rendered on every page
- **Fonts:** Geist Sans, Geist Mono (Google/Next fonts)
- **Meta title template:** `"%s | Athletica"` (default: `"Athletica | Football Store"`)

---

## 1. HOMEPAGE (`/`)

**File:** `app/page.tsx`  
**Purpose:** The main landing page showcasing hero banners, category carousels, product carousels, and category section panels.

### Components on this page
- `HeroCarousel` — full-width banner carousel at the top
- `HomepageRenderer` — orchestrates all sections below the hero (category carousel, product carousels, category section panels)

### Data flow
- `getHomepageConfig()` → hero carousel config (banners array + `auto_switch_ms`)
- `getHomepageSections()` → ordered array of sections from `homepage.json`
- `getProductsForCarousel(section)` → product arrays for `product_carousel` sections

### Homepage Sections — In Exact Order (28 sections total)

Below the HeroCarousel, the HomepageRenderer renders these 28 sections in this exact order:

1.  CATEGORY CAROUSEL — "Football Boots, Firm Ground, Artificial Ground, Turf Boots"
2.  PRODUCT CAROUSEL — "Top Football Boots"
3.  CATEGORY CAROUSEL — "Adidas Boots, Nike Boots, Puma Boots, New Balance"
4.  PRODUCT CAROUSEL — "Adidas Football Boots"
5.  PRODUCT CAROUSEL — "Nike Football Boots"
6.  CATEGORY CAROUSEL — "Predator, Phantom GX, X Crazyfast, Mercurial"
7.  PRODUCT CAROUSEL — "Predator Collection"
8.  PRODUCT CAROUSEL — "Speed Boots"
9.  CATEGORY CAROUSEL — "AG Boots, FG Boots, TF Boots, Indoor Boots"
10. PRODUCT CAROUSEL — "AG Football Boots"
11. CATEGORY CAROUSEL — "Goalkeeper Gloves, Shin Guards, Footballs, Training Gear"
12. PRODUCT CAROUSEL — "FG Football Boots"
13. PRODUCT CAROUSEL — "Best Deals Right Now"
14. CATEGORY SECTION — 2 panels side by side: "Adidas Predator" + "Nike Phantom"
15. PRODUCT CAROUSEL — "Top Picks This Week"
16. PRODUCT CAROUSEL — "Budget Boots Under EUR 50"
17. CATEGORY SECTION — 2 panels side by side: "Goalkeeper Gloves" + "Training Gear"
18. PRODUCT CAROUSEL — "New Arrivals"
19. PRODUCT CAROUSEL — "Goalkeeper Essentials"
20. CATEGORY SECTION — 2 panels side by side: "Puma Future" + "Mercurial Superfly"
21. CATEGORY SECTION — 2 panels side by side: "X Crazyfast" + "Puma King"
22. PRODUCT CAROUSEL — "Puma & Nike Speed Boots"
23. CATEGORY SECTION — 2 panels side by side: "Premium Boots" + "Sale Boots"
24. PRODUCT CAROUSEL — "Premium Boots"
25. PRODUCT CAROUSEL — "Adidas X Crazyfast"
26. PRODUCT CAROUSEL — "Staff Picks"
27. PRODUCT CAROUSEL — "Under EUR 100"
28. PRODUCT CAROUSEL — "Top Rated Brands"

CATEGORY CAROUSEL = horizontal scrollable row of category cards (max 3 visible at once on desktop, 1 on mobile). Has left/right arrow buttons. Auto-switches. Does NOT paginate — cards scroll out of view as screen shrinks.

PRODUCT CAROUSEL = horizontal scrollable row of product cards (6 visible on desktop). Has left/right arrow buttons. Cards have fixed width — scroll out of view on smaller screens.

CATEGORY SECTION = 2 large promotional panels displayed side by side on desktop, stacked vertically on mobile. Each panel is a clickable link with a title, subtitle, optional badge, and "Shop Now" CTA.

---

## 2. CATEGORY PAGE (`/[...slug]` — when `resolveRoute` returns `type: "category"`)

**File:** `app/[...slug]/page.tsx` → renders `<CategoryPage />`  
**Purpose:** Displays a filtered, paginated grid of products for a given category URL (e.g. `/football-boots`, `/adidas-football-boots`, `/fg-football-boots`).

### Components on this page
| Component | What it does |
|---|---|
| `Breadcrumb` | Shows "Home / Page Title" trail |
| `ActiveFilters` | Tag bar of currently active filters with remove buttons |
| `FilterSidebar` | Left sidebar (desktop) / slide-in drawer (mobile) with all filter controls |
| `SortDropdown` | Dropdown to sort results |
| `ProductGrid` | Responsive grid of `ProductCard` items |
| `Pagination` | Page navigation controls |

### Page-level text elements
- `<h1>` — displays `pageTitle` (e.g. "Football Boots", "Adidas Football Boots")
- `<p>` — optional `pageSubtitle` shown below title
- `<p>` — count of total products ("N products")

### Buttons
- **Filters button** (mobile only) — opens `FilterSidebar` drawer; icon: ⚙; label: "Filters"

### Metadata
- `title` = `resolved.pageTitle`
- `description` = `resolved.pageSubtitle` or `resolved.pageTitle`

### Loading state
- `<Suspense fallback>` — displays "Loading..." in a container while the page resolves

---

## 3. PRODUCT DETAIL PAGE (`/[...slug]` — when `resolveRoute` returns `type: "product"`)

**File:** `app/[...slug]/page.tsx` → renders `<ProductPage />`  
**Purpose:** Full product detail view for a single product (football boot).

### Components on this page
| Component | What it does |
|---|---|
| `Breadcrumb` | Shows "Home / Category / Brand / Model Name" |
| `ImageGallery` | Main image + thumbnail strip with zoom on hover |
| `ProductInfo` | Brand, model, price, size picker, add to cart, buy on Amazon |
| `ProductDescription` | Tagline, intro, key benefits list, technical details table |
| `ProductCarousel` (×3) | Related products by model line, brand, and traction surface |

### Breadcrumb items built server-side
1. `product.category` → link to `/{category-slug}`
2. `product.brand` → link to `/{brand}-football-boots`
3. `product.model` → no link (current page)

### Metadata
- `title` = `product.model`
- `description` = `product.description.subtitle`

---

## 4. CART PAGE (`/cart`)

**File:** `app/cart/page.tsx` → renders `<CartPage />`  
**Purpose:** Displays all items in the shopping cart with quantity controls and order summary.

### Meta
- `title` = "Your Cart"

---

## 5. LOGIN PAGE (`/login`)

**File:** `app/login/page.tsx` → renders `<LoginForm />`  
**Purpose:** Allows returning users to sign in.

### Meta
- `title` = "Sign In"

---

## 6. REGISTER PAGE (`/register`)

**File:** `app/register/page.tsx` → renders `<RegisterForm />`  
**Purpose:** Allows new users to create an account.

### Meta
- `title` = "Create Account"

---
---

## COMPONENT INVENTORY

---

### `Header` (`components/navigation/Header.tsx`)

**Purpose:** Global sticky top navigation bar rendered on every page.

**Interactive elements:**

| Element | Type | What it does |
|---|---|---|
| Hamburger button `☰` | Button | Opens `MobileNav` drawer (mobile only, hidden on `md+`) |
| Logo `A` badge + "athletica" text | Link → `/` | Navigates to homepage |
| Search input (desktop) | `type="search"` | Accepts text; placeholder: "Search football boots, gloves, balls..." — **no submit action wired up** |
| Search icon `🔍` | Decorative span | No action |
| Search input (mobile) | `type="search"` | Accepts text; placeholder: "Search products..." — **no submit action wired up** |
| "Hi, [FirstName]" | Text span | Displays first name of logged-in user (desktop, visible when logged in) |
| "Logout" | Button | Calls `logout()` from `AuthContext`; visible when logged in |
| "Login" | Link → `/login` | Navigates to login page (visible when logged out) |
| "Register" | Link → `/register` | Navigates to register page (visible when logged out) |
| Cart button `🛒` | Button | Opens `MiniCart` slide-in drawer |
| Cart badge | Span (conditional) | Shows item count; hidden when cart is empty; capped at "99+" |

**Sub-components rendered:**
- `MainNav` — desktop category navigation bar
- `MobileNav` — slide-in drawer navigation
- `MiniCart` — slide-in cart drawer

---

### `MainNav` (`components/navigation/MainNav.tsx`)

**Purpose:** Horizontal desktop navigation bar (hidden on mobile). Lists top-level nav groups and their child links. Triggers `MegaMenu` on hover.

**Structure:**
- Renders each top-level navigation group label as a non-clickable uppercase text label (e.g. "BOOTS", "GOALKEEPING")
- Under each group, renders child nav items as clickable links with a dropdown arrow `▾` if they have grandchildren
- **Child links** are `<Link>` elements navigating to their `href` (e.g. `/football-boots`, `/adidas-football-boots`)
- If a child is `disabled` or has no `href`, it renders as a plain `<span>` (non-clickable)
- **On hover** of a child that has `children`, triggers `MegaMenu` for that item
- **Mouse-leave delay:** 150ms debounce before closing the MegaMenu

**Interactive elements:**

| Element | Type | What it does |
|---|---|---|
| Top-level group label | Non-interactive span | Displays category group name (e.g. "BOOTS") |
| Child nav item link | Link | Navigates to the item's `href`; shows `▾` if it has sub-items |
| Child nav item (disabled) | Non-interactive span | Displays label, no navigation |
| MegaMenu trigger | Hover event on `<li>` | Shows `MegaMenu` for that item |

---

### `MegaMenu` (`components/navigation/MegaMenu.tsx`)

**Purpose:** Full-width dropdown panel that appears on hover over a nav item that has children. Shows categorized links in a grid with optional sidebar panels.

**Main grid area (left side):**
- Renders children of the hovered nav item as column headers
- Each column header: if `disabled`, renders as plain text; otherwise renders as a clickable link (`href`) in uppercase bold
- Under each column header, renders a list of grandchild links (normal text links)
- Under each grandchild, renders a list of level-4 links if present (smaller text links)
- All links call `onClose()` on click to close the menu

**Right sidebar panel (conditional — shown only if `customLinks`, `sizeLinks`, or `bottomLinks` exist on the hovered item):**

| Sidebar section | Header label | Content |
|---|---|---|
| `customLinks` | "Quick Links" | List of plain links |
| `sizeLinks` | "Shop by Size" | Wrapped size buttons (e.g. "UK 6", "UK 7") as links |
| `bottomLinks` | "Related" | List of plain links |

**All links in MegaMenu:** `<Link>` — navigates to `href`, calls `onClose` on click.

---

### `MobileNav` (`components/navigation/MobileNav.tsx`)

**Purpose:** Slide-in drawer navigation for mobile viewports. Full-screen overlay with accordion-style category tree.

**Overlay:** Fixed black semi-transparent overlay — clicking it calls `onClose()`

**Drawer header:**
- Logo (link → `/`, calls `onClose`) — green "A" badge + "athletica" text
- Close button `x` — calls `onClose()`

**Navigation body (scrollable):**
- For each top-level navigation group:
  - Green header bar with the group's label as a clickable link to `topLevel.href`
  - Below: each child rendered as an `AccordionItem`

**`AccordionItem` (recursive sub-component):**
- Renders the item's label as a `<Link>` (if it has an `href` and is not disabled) or a plain `<span>`
- If item has children, shows an expand/collapse button `▼` / `▲`
- When expanded: renders child items as nested `AccordionItem` components with increased left padding (`depth * 12 + 16 px`)
- All links call `onClose()` on click

**Footer of drawer:**
- "Login" button — Link → `/login` (full-width border button), calls `onClose`
- "Create Account" button — Link → `/register` (full-width green button), calls `onClose`

**States:**
- **Closed:** drawer translated `-translateX-full` (off-screen left)
- **Open:** drawer at `translateX(0)`, overlay visible

---

### `Footer` (`components/ui/Footer.tsx`)

**Purpose:** Site-wide footer with link columns, social icons, and legal links.

**Brand column (left):**
- Logo link (→ `/`) — green "A" badge + "athletica" text
- Tagline text: "The ultimate destination for football gear. Boots, gloves, balls and more from the world top brands."
- Social icon buttons (3): Facebook (`f`), Instagram (`ig`), Twitter (`x`) — all `href="#"` (placeholder, no real links)

**Link columns:**

| Column heading | Links |
|---|---|
| Football Boots | All Football Boots → `/football-boots` |
| | adidas Football Boots → `/adidas-football-boots` |
| | Nike Football Boots → `/nike-football-boots` |
| | Puma Football Boots → `/puma-football-boots` |
| | FG Boots → `/fg-football-boots` |
| | AG Boots → `/ag-football-boots` |
| Goalkeeper Gloves | All Goalkeeper Gloves → `/goalkeeper-gloves` |
| | adidas Gloves → `/adidas-goalkeeper-gloves` |
| | Nike Gloves → `/nike-goalkeeper-gloves` |
| | Puma Gloves → `/puma-goalkeeper-gloves` |
| Other Products | Footballs → `/footballs` |
| | Shin Guards → `/shin-guards` |
| | Training Wear → `/training-wear` |
| | Futsal Shoes → `/futsal-shoes` |
| My Account | Login → `/login` |
| | Register → `/register` |
| | My Cart → `/cart` |

**Bottom bar:**
- Copyright text: "[current year] Athletica. All rights reserved."
- Legal links (all `href="#"`, placeholder): "Privacy Policy", "Terms of Service", "Cookie Policy"

---

### `Breadcrumb` (`components/navigation/Breadcrumb.tsx`)

**Purpose:** Hierarchical navigation trail shown at the top of category and product pages.

**Always-present first item:**
- "Home" → Link → `/`

**Dynamic items (from props):**
- Each item renders a `/` separator then either:
  - A clickable `<Link>` (if item has `href` and is not the last item)
  - A plain `<span>` (if it is the last item or has no `href`)

---

### `HeroCarousel` (`components/homepage/HeroCarousel.tsx`)

**Purpose:** Large animated banner carousel at the top of the homepage. Displays 2–N slides with auto-advance.

**Each slide (banner):**
- The entire banner area is a clickable `<Link>` pointing to `banner.link`
- **If `banner.image` is set:** renders an `<img>` (`src=banner.image`, `alt=banner.title`, full-cover)
- **If no image (gradient fallback):**
  - Background gradient: `banner.gradient` CSS class
  - Decorative background `⚽` emoji (low opacity)
  - Branding text: "Athletica" (small, uppercase, low opacity)
  - `<h2>` — `banner.title`
  - `<p>` — `banner.subtitle`
  - CTA button — `banner.button_text` (styled with `banner.accent_color`)

**Controls:**
- Dot indicator buttons (one per slide) — clicking sets the active slide
- Active dot: wider (24px wide), green
- Inactive dot: small (8px), translucent white

**Behavior:**
- Auto-advances every `autoSwitchMs` milliseconds
- Pauses auto-advance on mouse hover
- Previous and next slides visible at reduced scale and opacity on left/right edges

**Empty state:** Returns `null` if `banners` array is empty.

---

### `HomepageRenderer` (`components/homepage/HomepageRenderer.tsx`)

**Purpose:** Reads the ordered sections array from `homepage.json` and delegates rendering to the appropriate section component.

**Section types handled:**
| `section.type` | Component rendered | Description |
|---|---|---|
| `category_carousel` | `CategoryCarousel` | Scrollable category card carousel |
| `product_carousel` | `ProductCarousel` | Scrollable product card carousel with title/subtitle/link |
| `category_section` | `CategorySection` | Grid of large promotional category panels |

- Returns `null` for any unrecognized section type or empty product lists.

---

### `CategoryCarousel` (`components/homepage/CategoryCarousel.tsx`)

**Purpose:** Horizontal scrollable carousel of category cards on the homepage.

**Each card:**
- The entire card is a `<Link>` pointing to `card.link`
- **If `card.image` is set:** renders `<img>` (full cover)
- **If no image (gradient fallback):**
  - Gradient background (`card.gradient`)
  - `card.emoji` displayed large (background decorative) and small (foreground)
  - `<h3>` — `card.title`
  - `<p>` — `card.subtitle`
- Card title text below the card: `card.title`
- Active card: highlighted with a green ring

**Navigation controls (shown when > 3 cards):**
- `‹` (Previous) button — scrolls left; positioned left of the track
- `›` (Next) button — scrolls right; positioned right of the track

**Behavior:**
- Auto-advances every `autoSwitchMs` milliseconds
- Pauses auto-advance on mouse hover
- Scroll-snaps to keep the active card centered

**Empty state:** Returns `null` if `cards` array is empty.

---

### `CategorySection` (`components/homepage/CategorySection.tsx`)

**Purpose:** A 2-column grid of large promotional panels on the homepage.

**Each panel:**
- Entire panel is a `<Link>` pointing to `panel.link`
- **If `panel.image` is set:** `<img>` (cover, scale-up on hover)
- **If no image (gradient fallback):**
  - `panel.emoji` decorative background (top-right corner + large faded center)
  - Optional badge: `panel.badge` — green pill badge in top-left corner (e.g. "New Season")
  - `<h3>` — `panel.title`
  - `<p>` — `panel.subtitle`
  - "Shop Now →" text link (green)
- Green ring border appears on hover

**Empty state:** Returns `null` if `panels` array is empty.

---

### `ProductCarousel` (`components/product/ProductCarousel.tsx`)

**Purpose:** Horizontally scrollable carousel of `ProductCard` items, used on both the homepage and product detail page.

**Header row:**
- `<h2>` — section `title`
- `<p>` — optional `subtitle`
- Optional "View all" link: `<Link>` → `link` with label `linkLabel || "View all"` (only shown if `link` prop is provided)
- `‹` Scroll-left button — scrolls the track left by 660px
- `›` Scroll-right button — scrolls the track right by 660px

**Track:**
- Hidden scrollbar, overflow-x auto
- Each item: a fixed-width (240px) `<div>` containing one `ProductCard`

**Empty state:** Returns `null` if `products` array is empty.

---

### `ProductCard` (`components/category/ProductCard.tsx`)

**Purpose:** Individual product tile displayed in grids and carousels.

**Image area (clickable Link → `/{product.url_slug}`):**
- `<img>` — shows `product.main_image` normally; switches to `product.image_gallery[0]` on hover
- Image scales up 5% on hover
- **"Quick Add" button** (appears on hover, overlaid on image center):
  - On click (preventing link navigation): opens `SizePickerModal`
  - Label: "Quick Add"

**Below image:**
- "AT" black badge (brand badge pill — hardcoded "AT" branding mark)
- Thin horizontal divider line

**Product info (clickable Link → `/{product.url_slug}`):**
- `<h3>` — `product.model` (single line, truncated with ellipsis)
- Price display:
  - Current price: `{product.price.currency} {product.price.current.toFixed(2)}`
  - Member price (conditional — shown when `discount_percent > 0`):
    - Label: `"member {currency}"`
    - Value: 95% of current price (stacked on right side)

**Sub-components:**
- `SizePickerModal` — triggered by "Quick Add" button

---

### `FilterSidebar` (`components/category/FilterSidebar.tsx`)

**Purpose:** Filter controls for the category page. On desktop (≥ `lg`), renders as a fixed left sidebar. On mobile, renders as a slide-in drawer from the left.

**Filter sections (each collapsible with a `▲`/`▼` toggle button):**

| Filter section | Default open | Input type | What it filters |
|---|---|---|---|
| **Brand** | Yes | Checkbox list | Brand name (e.g. adidas, Nike, Puma) |
| **Model Line** | No | Checkbox list | Model line name (e.g. Predator, Phantom) |
| **Surface** | Yes | Toggle buttons | Traction type (e.g. FG, AG, TF, IC) |
| **Size** | No | Toggle buttons (grid 3 cols) | Shoe size (e.g. UK 6, UK 7.5) |
| **Color** | No | Toggle buttons | Color description |
| **Price Range** | No | Two number inputs | Min price / Max price |

**FilterSection sub-component (each filter group header):**
- Heading text: filter category name (e.g. "Brand", "Surface")
- Toggle button: `▲` (open) / `▼` (closed)

**Brand / Model Line filter items:**
- `<input type="checkbox">` — checked state reflects URL params
- `<span>` — label text (brand/model name)
- Checked items highlighted in green

**Surface / Color / Size filter items:**
- `<button>` — toggles filter; active state: filled green; inactive: bordered gray

**Price Range inputs:**
- `<label>` "Min" + `<input type="number">` — placeholder = min price in dataset; updates `min_price` URL param on change
- `<label>` "Max" + `<input type="number">` — placeholder = max price in dataset; updates `max_price` URL param on change

**Mobile drawer (≤ `lg`):**
- Overlay: fixed black semi-transparent background — clicking calls `onClose()`
- Drawer header: "Filters" heading + close `x` button
- Drawer body: same `sidebarContent` as desktop

**All filter interactions:** Update URL query params (using `router.push`) and reset `page` param to 1.

---

### `ActiveFilters` (`components/category/ActiveFilters.tsx`)

**Purpose:** Shows a horizontal bar of currently active filter tags above the product grid, with remove buttons.

**Always-present label:** "Active Filters:" (small uppercase text)

**Per active filter:**
- `<button>` tag — displays label like "Brand: adidas", "Surface: FG"
- Clicking the tag removes that single filter from URL params
- Hover state: turns red to signal removal

**Filter types recognized (with display labels):**
- `brand` → "Brand"
- `model_line` → "Model"
- `traction` → "Surface"
- `color` → "Color"
- `gender` → "Gender"
- `size` → "Size"
- `min_price` → "Min Price"
- `max_price` → "Max Price"
- (Note: `sort` and `page` params are ignored — not shown as filter tags)

**"Clear all" button:**
- Removes all active filters from URL (preserves `sort` param if set)

**Empty state:** Returns `null` (renders nothing) when no active filters are set.

---

### `SortDropdown` (`components/category/SortDropdown.tsx`)

**Purpose:** Dropdown selector to sort products on the category page.

**Label:** "Sort by:" (plain text)

**`<select>` dropdown with options:**
| Option value | Display label |
|---|---|
| `newest` | Newest |
| `price_asc` | Price: Low to High |
| `price_desc` | Price: High to Low |
| `biggest_discount` | Biggest Discount |

- Default selection: "Newest" (when no `sort` param in URL)
- On change: updates `sort` URL param; removes `page` param; navigates without reload

---

### `Pagination` (`components/category/Pagination.tsx`)

**Purpose:** Page navigation for the product grid on category pages.

**"Prev" button:**
- Label: "Prev"
- Disabled when on page 1 (opacity 30%, not-allowed cursor)
- On click: navigates to previous page

**Page number buttons (dynamic):**
- Up to 7 pages shown directly; for larger ranges, shows ellipsis (`...`) between page 1, current range, and last page
- Active page: filled green background, bold text
- Inactive pages: bordered, hover green
- On click: navigates to that page and scrolls to top

**"Next" button:**
- Label: "Next"
- Disabled when on last page
- On click: navigates to next page

**Empty state:** Returns `null` if there is only 1 total page.

---

### `MiniCart` (`components/cart/MiniCart.tsx`)

**Purpose:** Slide-in cart drawer accessible from the header cart icon on any page.

**Overlay:** Fixed black semi-transparent overlay — clicking it calls `onClose()`

**Drawer header:**
- `<h2>` — "Your Cart" + item count: "([N] item/items)" (conditional; hidden when empty)
- Close `x` button — calls `onClose()`

**Empty cart state (body):**
- `🛒` emoji icon (large, in gray circle)
- Text: "Your cart is empty"
- Sub-text: "Add some products to get started"
- "Continue Shopping" button — calls `onClose()`

**Cart items list (when items exist — `<ul>`):**

Per item (`<li>`):
- `<img>` — `product.thumbnail` (product preview image)
- `<p>` — `product.model` (name, truncated)
- `<p>` — `product.brand`
- `<p>` — "Size: [selectedSize]"
- `<p>` — "Color: [product.color]"
- Quantity stepper:
  - `-` button → `updateQuantity(..., quantity - 1)` (removes item when quantity reaches 0)
  - Quantity display: plain `<span>` showing current quantity
  - `+` button → `updateQuantity(..., quantity + 1)`
- Price: `{currency} {current * quantity}` (formatted to 2 decimal places)
- "Remove" button → `removeFromCart(productId, selectedSize)`

**Footer (shown only when cart has items):**
- "Subtotal" label + `EUR {totalPrice}` value
- "View Cart" link → `/cart` (calls `onClose()` on click, full-width green button)
- Text: "Shipping calculated at checkout"

---

### `CartPage` (`components/cart/CartPage.tsx`)

**Purpose:** Full cart page (`/cart`). Displays all cart items with quantity controls and a sticky order summary panel.

**Empty cart state:**
- `🛒` emoji (large gray circle)
- `<h1>` — "Your cart is empty"
- `<p>` — "Looks like you haven't added anything yet."
- "Shop Football Boots" button → Link → `/football-boots` (green)

**Filled cart state:**

**Header row:**
- `<h1>` — "Your Cart ([N] item/items)"
- "Clear cart" button — calls `clearCart()` from `CartContext`

**Cart items list (left column, 2/3 width on large screens):**

Per item card:
- `<img>` — `product.thumbnail` (contained in square)
- `<p>` — `product.brand` (uppercase, gray)
- Product name: `<Link>` → `/{product.url_slug}` — displays `product.model`
- `<p>` — "Color: [product.color]"
- `<p>` — "Size: [selectedSize]"
- Remove `×` button → `removeFromCart(productId, selectedSize)`
- Quantity stepper:
  - `−` button → decrease quantity
  - Quantity display: `<span>`
  - `+` button → increase quantity
- Item total price: `{currency} {(current * quantity).toFixed(2)}` (bold, right-aligned)
- Unit price (conditional — shown when `quantity > 1`): `{currency} {current} each` (small, gray)

**Order summary panel (right column, 1/3 width on large screens, sticky):**
- `<h2>` — "Order Summary"
- Per-item summary list: product model + quantity, price subtotal
- "Subtotal" row: `EUR {totalPrice.toFixed(2)}`
- "Shipping" row: label "Shipping", value "Calculated at checkout"
- "Total" row (bold): `EUR {totalPrice.toFixed(2)}`
- Tax note: "Tax included where applicable"
- "Proceed to Checkout" button (full-width green, no action wired)
- "Continue Shopping" link → `/football-boots` (full-width bordered)
- Trust badges: `🔒 Secure checkout` | `📦 Free returns`

---

### `LoginForm` (`components/auth/LoginForm.tsx`)

**Purpose:** Login page UI at `/login`.

**Page structure:**
- Logo link → `/` (green "A" badge + "athletica" text)
- `<h1>` — "Welcome back"
- `<p>` — "Sign in to your account"

**Form fields:**
| Label | Input type | Placeholder | Validation |
|---|---|---|---|
| Email address | `email` | `you@example.com` | Required |
| Password | `password` | `••••••••` | Required |

**Buttons:**
- "Sign In" (submit) — calls `login(email, password)` from `AuthContext`; label changes to "Signing in..." while loading; disabled when loading
- On success: redirects to `/`

**Error state:**
- Red error banner displayed above the form when login fails or fields are empty
- Messages: "Please fill in all fields." / "Invalid email or password." / custom error from `AuthContext`

**Links:**
- "Create one" → `/register` (inline text link)
- "Privacy Policy" → `/privacy` (underlined text link)
- "Terms of Service" → `/terms` (underlined text link)

**States:**
- Default: form empty, button active
- Loading: button disabled, label "Signing in..."
- Error: red error banner visible above form

---

### `RegisterForm` (`components/auth/RegisterForm.tsx`)

**Purpose:** Registration page UI at `/register`.

**Page structure:**
- Logo link → `/` (green "A" badge + "athletica" text)
- `<h1>` — "Create your account"
- `<p>` — "Join Athletica and start shopping"

**Form fields:**
| Label | Input type | Placeholder | Validation |
|---|---|---|---|
| Full name | `text` | `John Smith` | Required |
| Email address | `email` | `you@example.com` | Required |
| Password | `password` | `At least 6 characters` | Required, min 6 chars |
| Confirm password | `password` | `Repeat your password` | Required, must match password |

**Inline validation feedback (below confirm password field):**
- Red text: "Passwords do not match" — shown when both fields are filled but don't match
- Green text: "✓ Passwords match" — shown when both fields are filled and match

**Buttons:**
- "Create Account" (submit) — calls `register(name, email, password)` from `AuthContext`; label changes to "Creating account..." while loading; disabled when loading
- On success: redirects to `/`

**Error state:**
- Red error banner above form for: "Please fill in all fields." / "Password must be at least 6 characters." / "Passwords do not match." / server-side error

**Links:**
- "Sign in" → `/login` (inline text link)
- "Privacy Policy" → `/privacy` (underlined text link)
- "Terms of Service" → `/terms` (underlined text link)

**States:**
- Default: form empty, button active
- Loading: button disabled, label "Creating account..."
- Error: red error banner visible

---

### `ImageGallery` (`components/product/ImageGallery.tsx`)

**Purpose:** Main product image viewer on the product detail page.

**Main image area:**
- `<img>` — displays `allImages[activeIndex]` (main image + gallery images merged); `alt=productName`
- On mouse hover: image zooms to 2× scale centered on cursor position (`cursor-zoom-in`)
- On mouse leave: zoom resets

**Thumbnail strip (shown only when > 1 image exists):**
- Per image: `<button>` containing a small `<img>` thumbnail
- Active thumbnail: green border
- On click: sets that image as the main displayed image

---

### `ProductInfo` (`components/product/ProductInfo.tsx`)

**Purpose:** Right-side product information panel on the product detail page. Handles size selection, add to cart, and buy on Amazon.

**Text elements:**
- `<p>` — `product.brand` ("adidas", uppercase green text)
- `<h1>` — `product.model`
- `<p>` — `product.description.subtitle`

**Badges (conditional):**
- Traction badge — `product.traction` (e.g. "FG", "AG")
- Category badge — `product.category` (e.g. "Football Boots")
- Collection badge — `product.description.collection` (e.g. "Champions League Pack")

**Price display:**
- **Without discount:** `<span>` — `{currency} {current}`
- **With discount:**
  - Current price: `<span>` — `{currency} {current}` (large, black)
  - Original price: `<span>` — `{currency} {original}` (strikethrough, gray)
  - Discount badge: `<span>` — `-{discount_percent}%` (red, rounded)

**Color variants section (shown only when `color_variants.length > 0`):**
- Label: "Color: [current color name]"
- Current color swatch: `<img>` thumbnail with green border (selected indicator)
- Variant swatches: `<Link>` → `/{variant.product_id}` — each wraps a thumbnail `<img>`; hover turns border green

**Size picker grid:**
- Label: "Size: [selectedSize]" (selectedSize shown inline when selected)
- "Out of Stock" text (shown when no sizes are available)
- Grid of size buttons (4 per row on mobile, 5 on sm+):
  - Available + unselected: bordered gray, hover green
  - Available + selected: filled green, bold
  - Unavailable: bordered light gray, text gray, strikethrough, disabled

**Action buttons:**
- **"Add to Cart" / "Select Size to Add to Cart" / "Added to Cart!"** button:
  - If no size selected: opens `SizePickerModal`
  - If size selected: calls `addToCart(product, selectedSize)`, shows "Added to Cart!" for 2 seconds, then resets
  - Dark background (gray-900); turns green-700 after adding
- **"Buy Now on Amazon" / "Amazon Link Coming Soon"** button:
  - If `amazonLink` exists: opens the URL in a new tab
  - If no `amazonLink`: button is disabled with "Amazon Link Coming Soon" label

**Sub-components:**
- `SizePickerModal` — triggered when "Add to Cart" is clicked without a selected size

---

### `ProductDescription` (`components/product/ProductDescription.tsx`)

**Purpose:** Extended product description section below the image/info grid on the product detail page.

**Left column:**
- `<h2>` — `description.tagline`
- `<p>` — `description.intro`
- **Key Benefits list** (conditional — shown when `key_benefits.length > 0`):
  - Section heading: "Key Benefits"
  - `<ul>` — each `<li>` has a green `✓` badge and benefit text

**Right column — Technical Details table:**
- Section heading: "Technical Details"
- `<table>` with the following rows:

| Row label | Data source |
|---|---|
| Brand | `product.brand` |
| Model Line | `product.model_line` (or "—" if null) |
| Surface | `description.technical_details.sole_type` |
| Upper Material | `description.technical_details.upper_material` |
| Adjustment | `description.technical_details.adjustment` |
| Range | `description.technical_details.range` |
| Gender | `product.gender` |
| Color | `product.color` |

---

### `ProductPage` (`components/product/ProductPage.tsx`)

**Purpose:** Container component that assembles the full product detail page layout.

**Sections rendered in order:**
1. `Breadcrumb` — navigation trail
2. Two-column grid:
   - Left: `ImageGallery` (`mainImage`, `gallery`, `productName`)
   - Right: `ProductInfo` (`product`, `amazonLink`)
3. `ProductDescription` — full product description section
4. `ProductCarousel` — "More [ModelLine] Boots" — `relatedByModelLine` products; link → `/{brand}-{model_line}-football-boots`
5. `ProductCarousel` — "More [Brand] Products" — `relatedByBrand` products; link → `/{brand}-football-boots`
6. `ProductCarousel` (conditional) — "More [Traction] Boots" — `relatedByTraction` products if non-empty; link → `/{traction}-football-boots`

---

### `CategoryPage` (`components/category/CategoryPage.tsx`)

**Purpose:** Container component that assembles the full category page with filtering, sorting, and pagination.

**Renders in order:**
1. `Breadcrumb`
2. `<h1>` page title + optional subtitle
3. `ActiveFilters` bar
4. Control row: Filters button (mobile) + product count text + `SortDropdown`
5. Two-column layout:
   - Left: `FilterSidebar`
   - Right: `ProductGrid` + `Pagination`

**Filter state management:**
- Reads URL search params and merges with `baseFilters` (from server-side route resolution)
- Filter params recognized: `brand`, `model_line`, `traction`, `color`, `gender`, `size`, `min_price`, `max_price`, `sort`, `page`
- Pagination: 24 products per page (`PRODUCTS_PER_PAGE = 24`)

---

### `SizePickerModal` (`components/ui/SizePickerModal.tsx`)

**Purpose:** A modal overlay for quickly selecting a size and adding a product to cart. Triggered from `ProductCard` ("Quick Add") and `ProductInfo` (when "Add to Cart" is tapped without a size).

**Overlay:** Fixed black semi-transparent background — clicking outside closes the modal

**Modal header:**
- `<h3>` — "Select Size"
- Close `x` button — calls `onClose()`

**Product preview (inside modal body):**
- `<img>` — `product.thumbnail`
- `<p>` — `product.model`
- `<p>` — `product.brand`
- `<p>` — `product.color`
- `<p>` — `{product.price.currency} {product.price.current}`

**Available Sizes label:** "Available Sizes" (uppercase, gray)

**Size button grid (4 columns):**
- Available + unselected: bordered gray, hover green
- Available + selected: filled green, bold
- Unavailable: bordered light, gray, strikethrough, disabled

**"Add to Cart" / "Select a Size" / "Added to Cart!" button:**
- Disabled and labeled "Select a Size" when no size is selected
- Active and labeled "Add to Cart" when a size is selected
- On click: calls `addToCart(product, selectedSize)`, shows "Added to Cart!" for 1 second, then closes modal and resets

---
---

## 4. NAVIGATION STRUCTURE

### Desktop Top Navigation Bar (`MainNav`)

Navigation is driven by `navigation.json` via `getNavigation()`. The structure has 4 levels:

**Top-level groups (non-clickable labels):**
These are category group headers rendered as uppercase gray text labels. They are NOT links.

**Second-level items (clickable links in the nav bar):**
These appear as horizontal text links below the top-level group labels. Items with children show a `▾` arrow and open a `MegaMenu` on hover.

**Third-level items (MegaMenu column headers):**
Displayed as uppercase bold column headings inside the MegaMenu dropdown. Clickable if not `disabled`.

**Fourth-level items (MegaMenu list items):**
Listed under column headers as normal text links.

**MegaMenu right sidebar sections (optional per nav item):**
- "Quick Links" section — `customLinks`
- "Shop by Size" section — `sizeLinks` (rendered as size label buttons)
- "Related" section — `bottomLinks`

> Note: The exact link labels and hrefs are fully data-driven from `navigation.json`. The component supports unlimited nesting of level-4 items under level-3 items under level-2 items.

---

### Mobile Navigation (`MobileNav`)

- Top-level group: rendered as a green header bar with a clickable group link
- Children: accordion items with toggle expand buttons
- Any depth of nesting supported via recursive `AccordionItem`
- Footer: "Login" (border button) + "Create Account" (green button)

---

### Footer Links

**Football Boots column:**
- All Football Boots → `/football-boots`
- adidas Football Boots → `/adidas-football-boots`
- Nike Football Boots → `/nike-football-boots`
- Puma Football Boots → `/puma-football-boots`
- FG Boots → `/fg-football-boots`
- AG Boots → `/ag-football-boots`

**Goalkeeper Gloves column:**
- All Goalkeeper Gloves → `/goalkeeper-gloves`
- adidas Gloves → `/adidas-goalkeeper-gloves`
- Nike Gloves → `/nike-goalkeeper-gloves`
- Puma Gloves → `/puma-goalkeeper-gloves`

**Other Products column:**
- Footballs → `/footballs`
- Shin Guards → `/shin-guards`
- Training Wear → `/training-wear`
- Futsal Shoes → `/futsal-shoes`

**My Account column:**
- Login → `/login`
- Register → `/register`
- My Cart → `/cart`

**Bottom bar:**
- Privacy Policy → `#`
- Terms of Service → `#`
- Cookie Policy → `#`

---
---

## 5. DATA DISPLAYED

### Homepage
- Hero banners: title, subtitle, CTA button text, link URL, image or gradient fallback
- Category carousel cards: title, subtitle, emoji, link URL, image or gradient fallback
- Product carousel sections:
  - Section title + subtitle
  - "View all" link + label
  - For each product: model name, current price, currency, member price (if discounted), main image, hover image
- Category section panels: title, subtitle, badge (optional), emoji, link URL, "Shop Now →" CTA, image or gradient fallback

### Category Page
- Page title + optional subtitle
- Total product count ("N products")
- Showing range text ("Showing X–Y of N products")
- Per product in grid: model name, current price, currency, member price (if discount > 0%), main image (swaps to gallery[0] on hover)

#### Filters available on Category Page
| Filter | Type | Notes |
|---|---|---|
| Brand | Multi-select checkboxes | Populated from products in the category |
| Model Line | Multi-select checkboxes | Populated from products in the category |
| Surface (Traction) | Multi-select toggle buttons | e.g. FG, AG, TF, IC, IN |
| Size | Multi-select toggle buttons | EU sizes from product data |
| Color | Multi-select toggle buttons | Color descriptions from product data |
| Min Price | Number input | Placeholder = minimum price in dataset |
| Max Price | Number input | Placeholder = maximum price in dataset |

Sort options: Newest, Price: Low to High, Price: High to Low, Biggest Discount

### Product Detail Page
- Brand name (green text)
- Model name (`<h1>`)
- Description subtitle
- Badges: traction type, category, collection name
- Price: current, original (if discounted), discount percentage
- Color name + color variant swatches (thumbnails)
- Available sizes with availability state (available / out of stock)
- Key benefits list (bullet points with `✓`)
- Technical details table: Brand, Model Line, Surface, Upper Material, Adjustment, Range, Gender, Color
- Description tagline + intro paragraph
- Related product carousels (up to 3 sections: by model line, by brand, by traction)

### Cart Page
Per item:
- Product thumbnail image
- Brand name
- Model name (link to product page)
- Color
- Selected size
- Quantity (editable stepper)
- Item subtotal (price × quantity)
- Unit price (when quantity > 1)

Order summary:
- Per-item name + quantity + price
- Subtotal
- Shipping status ("Calculated at checkout")
- Total (bold, with tax note)

### Login Form
Fields: Email address, Password

### Register Form
Fields: Full name, Email address, Password, Confirm password

---
---

## 6. STATES & VARIATIONS

### Empty States

| Component | Empty condition | What is shown |
|---|---|---|
| `CartPage` | `cart.items.length === 0` | 🛒 icon, "Your cart is empty", "Looks like you haven't added anything yet.", "Shop Football Boots" button |
| `MiniCart` | `cart.items.length === 0` | 🛒 icon, "Your cart is empty", "Add some products to get started", "Continue Shopping" button |
| `ProductGrid` | `products.length === 0` | 🔍 icon, "No products found", "Try adjusting your filters...", "Back to Home" button |
| `ActiveFilters` | No active filters | Renders `null` — nothing displayed |
| `Pagination` | Only 1 page | Renders `null` — nothing displayed |
| `HeroCarousel` | `banners.length === 0` | Renders `null` |
| `CategoryCarousel` | `cards.length === 0` | Renders `null` |
| `CategorySection` | `panels.length === 0` | Renders `null` |
| `ProductCarousel` | `products.length === 0` | Renders `null` |
| `MegaMenu` | No children on nav item | Renders `null` |

### Loading States

| Location | What is shown |
|---|---|
| `LoginForm` | Submit button disabled, label changes to "Signing in..." |
| `RegisterForm` | Submit button disabled, label changes to "Creating account..." |
| Category page `<Suspense>` | "Loading..." text in a container div |

### Error States

| Component | Error condition | What is shown |
|---|---|---|
| `LoginForm` | Invalid credentials / empty fields | Red banner with error message above form |
| `RegisterForm` | Validation failure / server error | Red banner with error message above form |
| `RegisterForm` | Passwords don't match (inline) | Red text "Passwords do not match" below confirm field |
| `[...slug]` page | `resolveRoute` returns `not_found` | Next.js `notFound()` → 404 page |

### Feedback States

| Component | Trigger | What is shown |
|---|---|---|
| `ProductInfo` "Add to Cart" button | Size selected + button clicked | Button label changes to "Added to Cart!" for 2 seconds, button turns green-700 |
| `SizePickerModal` "Add to Cart" button | Size selected + button clicked | Button label changes to "Added to Cart!" for 1 second, then modal closes |

### Logged In vs Logged Out (Header)

| State | What is shown |
|---|---|
| Logged out (desktop) | "Login" link + "Register" button |
| Logged in (desktop) | "Hi, [FirstName]" text + "Logout" button |
| Mobile (all states) | Neither shown in header; `MobileNav` footer shows "Login" + "Create Account" buttons regardless of auth state |

### Size Availability (ProductInfo + SizePickerModal)

| State | Visual treatment |
|---|---|
| Available, unselected | Bordered gray button, hover green |
| Available, selected | Filled green, bold text |
| Unavailable | Bordered light gray, gray strikethrough text, `disabled` attribute |
| No sizes available at all | "Out of Stock" text shown in the size section header |

### Amazon Buy Button (ProductInfo)

| State | What is shown |
|---|---|
| `amazonLink` exists | "Buy Now on Amazon" — green bordered, opens URL in new tab |
| `amazonLink` is null | "Amazon Link Coming Soon" — light gray border, disabled |

### Cart Badge (Header)

| State | What is shown |
|---|---|
| Cart is empty | No badge shown |
| 1–99 items | Green badge with item count |
| 100+ items | Green badge showing "99+" |

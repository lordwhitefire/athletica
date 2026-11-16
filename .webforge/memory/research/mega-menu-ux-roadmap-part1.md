# Mega Menu UX — Implementation Roadmap (Part 1: Parts A-B)

> **Compiled by:** Probe-Sable
> **Task:** task-mega-menu-ux-004
> **Date:** 2026-07-19
> **Senior:** Probe

---

## PART A: What Needs to Change in MegaMenu.tsx

### A.1 Current State Analysis

**File:** `MegaMenu.tsx` (322 lines)

| Section | Lines | Current Behavior | Research Gap |
|---------|-------|------------------|-------------|
| `buildColumns()` | 26-161 | 5-slot packing, L1 header repeating, mixed L2-L4 in one array | NN/g: mega menus support 2-3 tiers, L4 should not be in menu (per Part 3 §2.2 line 35) |
| Column rendering | 179-257 | Level-based indentation (`.pl-3`, `.pl-5`), flex-wrap columns | Level-based indentation is poor UX for scannability (per Part 3 §2.7 line 134) |
| Featured banner | 260-289 | Separate `flex-shrink-0 w-40` to the right | Should be Column 4 of 4-column layout (per Part 5 §4.1 lines 28-48) |
| Right sidebar | 291-318 | 400px Quick Links section | Not in recommended design — evaluate removal |
| Hover/click logic | N/A | No hover/click logic in this file | Handled in parent MainNav.tsx |
| Mobile | N/A | No mobile-responsive code here | Handled in separate MobileNav.tsx |

### A.2 `buildColumns()` (lines 26-161) — Complete Rewrite

**Current behavior (MegaMenu.tsx lines 26-161):**
- `interface Column` (lines 15-24): `parentLabel`, `parentHref`, `items[]` with mixed levels 2/3/4
- 5-slot packing: `slotsUsed()` (line 35), `fits()` (line 40)
- L1 label repeats as column header (lines 50-53, 68-70, 87-93, 107-113)
- L4 handling (lines 123-154): batches L4 items across columns with re-inserted parent labels

**Needed (per Part 5 §4.1 lines 20-48, Part 3 §2.1 lines 22-27):**
Replace with `build4Columns()` returning 4 typed column objects:

```typescript
interface Column1_Edits {
    type: 'edits';
    heading: string;
    allLink: { label: string; href: string };
    editLinks: { label: string; href: string }[];
}

interface Column2_Brands {
    type: 'brands';
    heading: string;
    brands: { label: string; href: string; logoUrl?: string }[];
}

interface Column3_Models {
    type: 'models';
    heading: string;
    groups: { brandLabel: string; brandHref: string; models: { label: string; href: string; thumbnailUrl?: string }[] }[];
}

interface Column4_Featured {
    type: 'featured';
    imageUrl?: string;
    ctaLink: string;
    ctaLabel: string;
}
```

**Specific deletions:**
- Remove L4 handling entirely (MegaMenu.tsx lines 123-154) — per Part 3 §2.5 "Cut off after Level 3"
- Remove repeating parent label logic (lines 50-53, 68-70, 87-93, 107-113)
- Remove old `Column` interface (lines 15-24)
- Remove level tracking

### A.3 Column Rendering (lines 179-257) — Complete Redesign

**Current:** `flex-wrap` of columns (line 179), level-based rendering with `.pl-3`/`.pl-5` indentation

**Needed (per Part 5 §4.1 lines 51-82):**

**Column 1 — Edits List:**
```tsx
<div className="flex flex-col gap-1" style={{ minWidth: "180px" }}>
    <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-2">
        <Link href={allLink.href}>{heading}</Link>
    </h3>
    <span className="text-xs font-black uppercase tracking-widest text-zinc-500 mb-1 mt-2">Edits</span>
    {editLinks.map(link => (
        <Link href={link.href} className="text-sm text-zinc-300 hover:text-primary-container">
            {link.label}
        </Link>
    ))}
</div>
```
Source: Part 5 §4.1 lines 53-57

**Column 2 — Brands with 48px logos:**
```tsx
<div className="flex flex-col gap-1" style={{ minWidth: "200px" }}>
    <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-2">Brands</h3>
    {brands.map(brand => (
        <Link href={brand.href} className="flex items-center gap-3 py-1 hover:text-primary-container">
            {brand.logoUrl ? (
                <Image src={brand.logoUrl} alt={brand.label} width={48} height={48} className="rounded" />
            ) : (
                <div className="w-12 h-12 bg-zinc-800 rounded flex items-center justify-center text-xs text-zinc-500">
                    {brand.label.charAt(0)}
                </div>
            )}
            <span className="text-sm font-bold text-zinc-200">{brand.label}</span>
        </Link>
    ))}
</div>
```
Source: Part 5 §4.1 lines 59-64, Part 3 §2.4 line 82

**Column 3 — Models with 60px thumbnails:**
```tsx
<div className="flex flex-col gap-1" style={{ minWidth: "220px" }}>
    <h3 className="text-xs font-black uppercase tracking-widest text-zinc-400 mb-2">Models</h3>
    {groups.map(group => (
        <>
            <Link href={group.brandHref} className="text-xs font-black uppercase text-zinc-500 mt-2 hover:text-primary-container">
                {group.brandLabel}
            </Link>
            {group.models.map(model => (
                <Link href={model.href} className="flex items-center gap-3 py-1 hover:text-primary-container">
                    {model.thumbnailUrl ? (
                        <Image src={model.thumbnailUrl} alt={model.label} width={60} height={60} className="rounded object-cover" />
                    ) : (
                        <div className="w-[60px] h-[60px] bg-zinc-800 rounded flex items-center justify-center text-xs text-zinc-500">
                            {model.label.charAt(0)}
                        </div>
                    )}
                    <span className="text-sm text-zinc-300">{model.label}</span>
                </Link>
            ))}
        </>
    ))}
</div>
```
Source: Part 5 §4.1 lines 66-70, Part 3 §2.4 line 83

**Bottom row (NEW):**
```tsx
<div className="col-span-4 flex justify-between border-t border-zinc-800 pt-3 mt-3">
    <Link href={viewAllLink} className="text-sm font-bold text-primary-container hover:underline">
        View All {category} →
    </Link>
    <Link href={viewAllBrandsLink} className="text-sm font-bold text-primary-container hover:underline">
        View All Brands →
    </Link>
</div>
```
Source: Part 5 §4.1 lines 79-82 (Adidas-inspired "View All" links)

### A.4 Featured Banner (lines 260-289) — Merge into Column 4

**Current:** Separate `flex-shrink-0 w-40` div to the right of columns

**Needed:** Integrate as Column 4 of the 4-column layout. Keep gradient fallback (MegaMenu.tsx lines 273-287) as placeholder. Source: Part 5 §4.1 lines 72-77.

### A.5 Right Sidebar (lines 291-318) — Evaluate

**Current:** 400px Quick Links (Track Order, Authenticity Guarantee, Pro Support)

**Recommendation:** Move to footer or header utility bar. Not present in recommended 4-column wireframe (Part 5 §4.1). If kept, reduce to slim section below columns.

### A.6 Hover/Click in MainNav.tsx (parent component)

**Current (MainNav.tsx lines 18-27):**
- Immediate open on hover (NO delay)
- 150ms exit delay
- No click-to-open
- No keyboard handlers
- `aria-haspopup` missing on items without children

**Needed changes (per Part 3 §2.3 lines 55-68):**

1. **Click-to-open primary trigger** — NN/g guideline #13 (Part 3 §2.3 line 58)
2. **400ms hover delay** — Baymard 300-500ms (Part 3 §2.3 line 60)
3. **500ms exit delay** — NN/g "Mega Menus Work Well" (Part 3 §2.3 line 68)
4. **Amazon triangle** — trajectory calculation prevents accidental close (Part 3 §2.3 lines 66-67)
5. **Keyboard navigation** — Tab, Arrow keys, Enter/Space, Escape (Part 3 §2.8 line 145)
6. **ARIA** — `aria-haspopup`, `aria-expanded` (Part 3 §2.8 lines 146-147)

### A.7 Mobile Navigation (separate component)

**Current (MobileNav.tsx lines 1-401):**
- Pure accordion for all levels (L1→L2→L3→L4)
- No drill-down/push navigation
- No breadcrumbs
- No search bar in overlay
- No "View All" links
- Touch targets vary

**Needed (per Part 4 §3.1 lines 14-30, Part 4 §3.5 lines 122-140):**
- Switch to hybrid: accordion for L1→L2, drill-down for L2→L3+
- Add breadcrumb trail (e.g., "Boots > Nike")
- Add persistent search bar
- Add "View All" at every level
- 44×44px touch targets minimum
- `prefers-reduced-motion` support
- Keyboard navigation + focus management
- Lazy-load L4+ on intent (SGS pattern per Part 4 §3.5 line 136)

---

## PART B: Phased Implementation Plan

### Phase 1: Column Restructure (Quick Win — ~1-2 days)

**Goal:** Replace 5-slot packing with clean 4-column layout.

**Tasks:**
1. Replace `buildColumns()` with `build4Columns()` returning 4 typed column objects
2. Remove L4 handling (MegaMenu.tsx lines 123-154)
3. Remove repeating parent label logic (lines 50-53, 68-70, 87-93, 107-113)
4. Remove level-based indentation classes (`.pl-3`, `.pl-5`)
5. Re-render columns as 4 distinct `<div>` sections
6. Merge featured banner as Column 4
7. Add bottom "View All" row
8. Remove or reduce right sidebar

**Files:** `MegaMenu.tsx` (~180 lines changed)

### Phase 2: Brand Logos + Model Thumbnails (Medium — ~2-3 days)

**Goal:** Add visual information scent.

**Tasks:**
1. Add `logoUrl` and `thumbnailUrl` to `NavItem` type
2. Update Column 2 to render 48px brand `<Image>` with fallback
3. Update Column 3 to render 60px model `<Image>` with fallback
4. Add loading/error states for images
5. Lazy-load images below fold

**Files:** `MegaMenu.tsx`, `navigation.ts`, `navigation.json`

### Phase 3: Hover/Click Interaction (Medium — ~2-3 days)

**Goal:** Proper interaction patterns per NN/g + Baymard.

**Tasks:**
1. Add click-to-open primary trigger
2. Add 400ms hover delay
3. Add 500ms exit delay
4. Amazon triangle trajectory calculation
5. Keyboard navigation (Tab, Arrow, Enter, Escape)
6. ARIA attributes (`aria-haspopup`, `aria-expanded`)

**Files:** `MainNav.tsx`, `MegaMenu.tsx`

### Phase 4: Top-Level Nav Reduction (Medium — ~1-2 days)

**Goal:** Reduce from ~11 categories to ~6 with "More" dropdown.

**Current L1 (from navigation.json):** Boots, Multi-Stud Boots, Indoor Shoes, Shin Guards, Balls, Socks, Clothing, Accessories, Equipment, Brands, Sale

**Recommended:** Boots, Clothing, Equipment, Accessories, Brands, Sale — sub-categories grouped under parents.

**Files:** `navigation.json`, `MainNav.tsx`

### Phase 5: Mobile Navigation (Complex — ~3-5 days)

**Goal:** Replace pure-accordion MobileNav with hybrid accordion+drill-down.

**Tasks:**
1. Accordion for L1→L2, drill-down for L2→L3+
2. Breadcrumb trail at top of drill-down
3. Persistent search bar
4. "View All" at every level
5. 44×44px touch targets
6. `prefers-reduced-motion`
7. Keyboard + focus management
8. Staggered fade-in animations

**Files:** `MobileNav.tsx` (major), `Header.tsx` (minor)

### Phase 6: PLP Integration (Complex — ~3-5 days)

**Goal:** Handle Levels 4-5 on PLP.

**Tasks:**
1. Left sidebar on PLP showing sibling sub-models
2. Breadcrumbs: Boots > Nike > Mercurial > Vapor 16 Elite > FG
3. Level 4 sub-model filter groups
4. Level 5 product type filter facets

**Files:** PLP components, breadcrumb component

# Mega Menu UX Gap Analysis — Stream 4 Part C1: Mobile Implementation (Pattern + UI)

> **Compiled by:** Probe-Sable | **Task:** task-mega-menu-ux-3level-001 | **Date:** 2026-07-19
> **Sources:** Part 4 (§3.1-3.5), Part 5 (§4.3 wireframes), Part 6 (§5 sources 1-41)

---

## C.1 Recommended Pattern: Hybrid Accordion + Drill-Down

**Primary recommendation:** Accordion for L1→L2 → Drill-down/push for L2→L3+ (*Part 4 §3.1*)

**Rationale:**
- NN/g decision algorithm: <6 items → accordion; 6-15 → section menu; 15+ → landing page (*Part 4 §3.1*)
- Athletica's Level 2 has 8+ brands per category → accordion for L1→L2
- Level 3 has 3-6 models per brand → drill-down for L2→L3
- Level 4+ resolved via PLP filters, not in nav (*Part 5 §4.2*)

**Component tree:**
```
MobileNav
├── HamburgerButton (always visible on mobile)
└── Overlay (fixed inset-0, z-50, bg-black)
    ├── CloseButton (✕ top-right)
    ├── SearchBar (persistent at top)
    ├── NavigationStack (AnimatePresence wrapper)
    │   ├── Level1Panel (accordion)
    │   ├── Level2Panel (drill-down from brand tap)
    │   └── Level3Panel (drill-down from model tap)
    └── Footer (utility links)
```
*Source: Part 5 §4.3 wireframes*

---

## C.2 Full-Screen Overlay Structure

```tsx
const MobileNav = ({ items }: { items: NavItem[] }) => {
    const [isOpen, setIsOpen] = useState(false);
    const [stack, setStack] = useState<Panel[]>([{
        items, breadcrumb: [], title: 'Menu'
    }]);

    return (
        <>
            <button onClick={() => setIsOpen(true)}
                aria-label="Open navigation menu"
                className="min-h-[44px] min-w-[44px]"
            >
                <MenuIcon />
            </button>

            {isOpen && (
                <div className="fixed inset-0 z-50 bg-black"
                    role="dialog" aria-modal="true"
                >
                    {/* Close + Search row */}
                    <div className="flex items-center gap-4 p-4 border-b border-gray-800">
                        <button onClick={() => setIsOpen(false)}
                            aria-label="Close menu"
                            className="min-h-[44px] min-w-[44px]"
                        >
                            <XIcon />
                        </button>
                        <SearchInput className="flex-1" />
                    </div>

                    {/* Animated panel stack */}
                    <AnimatePresence mode="wait">
                        <motion.div key={stack.length}
                            initial={{ x: '100%' }}
                            animate={{ x: 0 }}
                            exit={{ x: '-100%' }}
                            transition={{ duration: 0.25, ease: 'easeInOut' }}
                        >
                            {stack.length > 1 && (
                                <Breadcrumb
                                    path={stack[stack.length-1].breadcrumb}
                                    onBack={() => setStack(s => s.slice(0, -1))}
                                />
                            )}
                            <LevelPanel
                                items={stack[stack.length-1].items}
                                onNavigate={(item) => pushPanel(item)}
                            />
                        </motion.div>
                    </AnimatePresence>
                </div>
            )}
        </>
    );
};
```
*Source: Part 4 §3.2 — "Full-screen overlay: Nike (per muffingroup.com)"*
*Source: Part 4 §3.5 — "CSS transforms 200-300ms"*

---

## C.3 Navigation Stack State Management

```typescript
interface Panel {
    items: NavItem[];
    breadcrumb: string[];
    title: string;
}

const pushPanel = (item: NavItem) => {
    setStack(prev => [...prev, {
        items: item.children || [],
        breadcrumb: [...prev[prev.length-1].breadcrumb, item.label],
        title: item.label,
    }]);
};

const popPanel = () => {
    setStack(prev => prev.length > 1 ? prev.slice(0, -1) : prev);
};
```
*Source: Part 4 §3.1 — "Sequential menus (drill-down) for deep hierarchies"*

---

## C.4 Accordion for Level 1→2

```tsx
const Level1Panel = ({ items, onNavigate }: Level1PanelProps) => {
    const [expandedId, setExpandedId] = useState<string | null>(null);

    return (
        <ul className="divide-y divide-gray-800">
            {items.map(item => (
                <li key={item.id}>
                    <button
                        onClick={() => setExpandedId(
                            expandedId === item.id ? null : item.id
                        )}
                        aria-expanded={expandedId === item.id}
                        className="w-full flex justify-between items-center
                                   py-3 px-4 min-h-[44px] text-left"
                    >
                        <span className="text-base font-bold">{item.label}</span>
                        <ChevronDown className={`transition-transform ${
                            expandedId === item.id ? 'rotate-180' : ''
                        }`} />
                    </button>

                    {expandedId === item.id && (
                        <div className="ml-4 border-l-2 border-gray-700 pl-4">
                            {/* "All Boots" heading link */}
                            {item.href && (
                                <Link href={item.href}
                                    className="block py-3 min-h-[44px]
                                               text-sm font-semibold text-primary"
                                >
                                    ▶ All {item.label}
                                </Link>
                            )}

                            {/* Level 2 items (brands) */}
                            {item.children?.map(child => (
                                <button key={child.id}
                                    onClick={() => onNavigate(child)}
                                    className="w-full flex justify-between items-center
                                               py-3 min-h-[44px] text-sm text-zinc-300"
                                >
                                    <span>{child.label}</span>
                                    <ChevronRight size={16} />
                                </button>
                            ))}

                            {/* View All */}
                            <Link href="/brands"
                                className="block py-3 min-h-[44px] text-sm text-zinc-500"
                            >
                                View All Brands →
                            </Link>
                        </div>
                    )}
                </li>
            ))}
        </ul>
    );
};
```
*Source: Part 5 §4.3 — wireframe "Accordion Expanded (Level 1→2)"*

---

## C.5 Drill-Down Panels (Level 2→3+)

```tsx
const LevelPanel = ({ items, onNavigate }: LevelPanelProps) => {
    return (
        <ul className="divide-y divide-gray-800">
            {items.map(item => (
                <li key={item.id}>
                    {(item.children?.length ?? 0) > 0 ? (
                        <button onClick={() => onNavigate(item)}
                            className="w-full flex justify-between items-center
                                       py-3 px-4 min-h-[44px] text-left"
                        >
                            <span className="text-sm">{item.label}</span>
                            <ChevronRight size={16} />
                        </button>
                    ) : (
                        <Link href={item.href ?? '#'}
                            className="block py-3 px-4 min-h-[44px]
                                       text-sm text-zinc-300"
                        >
                            {item.label}
                        </Link>
                    )}
                </li>
            ))}
            {/* View All link */}
            {items.length > 0 && (
                <li>
                    <Link href="#"
                        className="block py-3 px-4 text-sm text-primary font-semibold"
                    >
                        View All {items[0].label} →
                    </Link>
                </li>
            )}
        </ul>
    );
};
```
*Source: Part 5 §4.3 — wireframes "Drill-Down (Level 3: Models)", "Further Drill-Down (Level 4)"*

---

## C.6 Breadcrumb Trail

```tsx
const Breadcrumb = ({ path, onBack }: { path: string[]; onBack: () => void }) => (
    <div className="flex items-center gap-2 px-4 py-3 border-b border-gray-800">
        <button onClick={onBack}
            className="flex items-center gap-1 min-h-[44px] text-sm text-primary"
        >
            <ArrowLeft size={16} />
            Back
        </button>
        <span className="text-zinc-600 mx-1">/</span>
        <span className="text-xs text-zinc-400 truncate">
            {path.join(' > ')}
        </span>
    </div>
);
```
*Source: Part 5 §4.3 — wireframe headers show "← Back  Boots > Nike"*

---

## C.7 Animated Transitions

| Transition | Property | Duration | Easing | Trigger |
|-----------|----------|----------|--------|---------|
| Push in | `translateX: 100% → 0%` | 250ms | `easeInOut` | Drill-down tap |
| Pop out | `translateX: 0% → -30%` | 200ms | `easeOut` | Back button |
| Overlay open | `opacity: 0 → 1` | 150ms | `easeOut` | Hamburger tap |
| Overlay close | `opacity: 1 → 0` | 100ms | `easeIn` | Close/X tap |
| Accordion expand | `max-height: 0 → 1000px` | 200ms | `easeOut` | Category tap |
| Accordion collapse | `max-height: 1000px → 0` | 200ms | `easeIn` | Category tap |

```tsx
<AnimatePresence mode="wait">
    <motion.div
        key={stack.length}
        initial={{ x: '100%' }}
        animate={{ x: 0 }}
        exit={{ x: '-30%', opacity: 0.5 }}
        transition={{ duration: 0.25, ease: 'easeInOut' }}
    >
        {/* Panel content */}
    </motion.div>
</AnimatePresence>
```

```css
@media (prefers-reduced-motion: reduce) {
    .nav-panel { transition: none !important; animation: none !important; }
}
```
*Source: Part 4 §3.5 — "CSS transforms 200-300ms" + "prefers-reduced-motion"*

---

*Continues in Part C2: Loading, Accessibility, Integration, and Competitor Validation.*

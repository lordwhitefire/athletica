# FM-07 — Testing (catalog browse)

**Task:** FM-07 | **Verify behavior, not UI.**

## What behavior to verify

1. Does `/shop` show a grid with search + filter + sort + pagination?
2. Does filtering update the URL + grid (and back-button restore)?
3. Does filter change not scroll to top?
4. Are out-of-stock variants visible-but-disabled?
5. Does empty show "No products match"?
6. Is price absent from filter + sort?
7. Are shareable URLs loadable?

## How to verify (behavioral)

- **Renders:** open `/shop` → grid of active products + search bar + filter + sort + pagination.
- **Search:** type "boot" → grid filters; URL becomes `/shop?q=boot`; only matching products show.
- **Filter + URL:** select category "boots" → URL becomes `/shop?category=boots&q=boot`; grid filters. Press back → previous view restores.
- **No scroll-to-top:** change sort from "newest" to "popular" while scrolled down → the scroll position stays.
- **OOS visible-disabled:** a product whose variant is out of stock → tile renders with strike-through + "Out of Stock" label (not hidden).
- **Empty:** search for a nonsense string → "No products match" (not an empty grid, not "0 results found" with fake zeros).
- **No price filter:** inspect the filter controls + sort dropdown → no price/currency option.
- **Shareable URL:** copy `/shop?category=boots&q=indoor&sort=newest`, open in a fresh browser → the exact filtered view loads.

## What "working" means

- Browsing + search + filter work and are shareable.
- Out-of-stock is honest (visible but disabled).
- Empty is honest (no fakes).
- Price never appears.

## What to report

- The URL changes for each filter/sort action.
- Whether back-button restored the view.
- Whether scroll position held on filter change.
- The OOS tile rendering (visible + disabled).
- The empty-state copy.
- Whether the shareable URL loaded the right view.
- Any price filter/sort found (there should be none).

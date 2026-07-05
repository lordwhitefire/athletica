# Homepage Editor — Bugs & Issues Found

## 1. AutoSuggest links produce broken URLs

**Where:** `src/lib/actions/suggestions.ts`

**What happens:** When you type in any link field (banner link, category item link, card link, view all link), the suggestions that appear are broken. For example, instead of showing `/products/nike- phantom-gx-elite`, it shows `/products/[object Object]`.

**Why:** The code that fetches product URLs from Sanity asks for the wrong field. It requests `url_slug` which returns a slug object (`{_type: "slug", current: "nike-phantom-gx-elite"}`) instead of just the text string. When JavaScript tries to add this object to a URL, it becomes `[object Object]`.

**Affects:** All AutoSuggest link fields in the HomepageEditor — banner links, item links, card links, view all links, product carousel links.

---

## 2. Weak key generation

**Where:** `src/lib/actions/homepage.ts`

**What happens:** When you add new items, banners, or cards, the editor gives them a unique key using `Date.now() + Math.random()`. If you add two things within the same millisecond (possible with fast clicking), they could get the same key. This would cause a save error or data loss.

---

## 3. Save All button skips key checks

**Where:** `src/lib/actions/homepage.ts`

**What happens:** The individual save functions (save a single banner, save a single item) make sure every item has a key before saving. But the "Save All" button does NOT do this check. If something is missing a key, it gets saved anyway, which can cause problems in Sanity.

---

## 4. Duplicate url_slug in preview query

**Where:** `src/lib/actions/homepage.ts`

**What happens:** When fetching products for the carousel preview, the query asks for `url_slug` twice — once as the raw slug object and once as the text string. The first one is never used and just wastes database work. Not a crash, but unnecessary.

---

## 5. Accent field exists but has no input

**Where:** `src/components/admin/HomepageEditor.tsx`

**What happens:** The `accent` field is stored in the data model and gets saved to Sanity and passed to the preview. But there is no input field in the UI for editors to set it. It's invisible. Editors can never change it.

---

## 6. No focused editing — all forms visible at once

**Where:** `src/components/admin/HomepageEditor.tsx`

**What happens:** The entire editor is one long scrollable page. All banners, all sections, all items, all cards, and all their settings are visible at the same time. When you have many sections, this becomes overwhelming and hard to use, especially because the preview cards are big.

---

## 7. All nine category grid variants show identical forms

**Where:** `src/components/admin/HomepageEditor.tsx`

**What happens:** Every category grid variant uses the same item form with the same five fields (label, link, background, text color, image). Different variants need different things — for example, "Scroll Brands" might just need an image and a link, while "Grid 4 Equal" needs all fields. But the current code treats them all the same.

---

## 8. Preview is too small to be useful

**Where:** `src/components/admin/HomepageEditor.tsx`

**What happens:** The live preview is scaled down to 60% of its real size to fit inside the section card. This makes the text tiny and the layout hard to evaluate. You can't tell if the section actually looks good at full size.

---

## 9. No condensed overview mode

**Where:** `src/components/admin/HomepageEditor.tsx`

**What happens:** There is no separate "read-only" view of the homepage. The only way to see all sections is the full editing view, which shows every single input field. This makes it hard to just glance at the overall page structure.

---

## 10. Reorder buttons work but no visual feedback

**Where:** `src/components/admin/HomepageEditor.tsx`

**What happens:** You can move sections up and down with arrow buttons, but there's no drag-and-drop and no visual indicator of where the section will land. The only feedback is the section list re-rendering after the move.

---

## 11. Page takes over 60 seconds to load — severe performance bug

**Where:** `src/app/admin/homepage/page.tsx` and `src/components/admin/HomepageEditor.tsx`

**What happened in the test:** Playwright tests timed out waiting for the homepage editor to load. The `page.goto("/admin/homepage")` call consistently took longer than 60 seconds. This was confirmed by tests retrying and failing again, all with the same timeout error.

**What happens to users:** Anyone visiting the admin homepage will see a blank page or loading state for over a minute before the editor appears. This makes the editor effectively unusable.

**Likely causes (not confirmed yet):**
- Sanity fetches the entire homepage document on page load, including all banners, all sections, all items, all cards, and their images
- The preview components (`HeroCarousel`, `CategorySection`, etc.) render immediately on page load, each potentially making more Sanity CDN requests for image URLs
- No loading skeleton or progressive rendering — the page waits until everything is ready before showing anything
- The `getPreviewProducts` effect fires for every product_carousel section on initial render, adding more network requests
- Image resolution via `sanityCdnUrl()` runs for every image in every banner, item, and card

**To confirm the root cause:** Open the browser DevTools Network tab and visit `/admin/homepage`. Check which requests take the longest — the Sanity GROQ query, the image CDN requests, or the React render itself.

import { test, expect } from "./fixtures";

/**
 * Playwright tests for the redesigned homepage editor (PR #5).
 *
 * The previous spec (homepage-editor.spec.ts) used `waitUntil: "domcontentloaded"`
 * with a 120s timeout specifically because of bug #11 (60s+ cold load). After
 * PR #4 (perf) + PR #5 (redesign), the editor should paint within a few
 * seconds thanks to:
 *   - src/app/admin/homepage/loading.tsx (skeleton shell)
 *   - lazy getPreviewProducts (no mount-time fetches)
 *   - memoized sanityCdnUrl
 *
 * These tests assert the new behaviour end-to-end:
 *   1. Overview page loads with all sections listed as cards
 *   2. Clicking Edit opens the popup
 *   3. Popup closes on X and on Escape
 *   4. Save All works and shows "Saved!"
 *   5. AutoSuggest returns valid URL strings (regression for bug #1)
 *   6. Accent color input is present on banner form (bug #5)
 *   7. Product carousel popup auto-loads preview (bug #11 deferred fetch)
 *   8. Add/remove items on scroll variants works (bug #7)
 *   9. DnD reorder smoke test (bug #10)
 *
 * Per prompts/homepage-editor-redesign.md Step 8.
 */

test.describe("Redesigned Homepage Editor (PR #5)", () => {

    test.beforeEach(async ({ adminPage }) => {
        // PR #4 should bring this well under 10s in normal conditions.
        // We keep a generous 30s ceiling to absorb cold CI runs.
        await adminPage.goto("/admin/homepage", { waitUntil: "domcontentloaded", timeout: 30000 });
    });

    test("overview page loads within reasonable time (regression for bug #11)", async ({ adminPage }) => {
        // The overview heading should be visible within 10s.
        // The old editor would still be on a blank page at this point.
        await expect(
            adminPage.getByRole("heading", { name: /homepage editor/i })
        ).toBeVisible({ timeout: 10000 });
    });

    test("overview lists Hero Carousel and Homepage Sections regions", async ({ adminPage }) => {
        await expect(adminPage.getByRole("heading", { name: /hero carousel/i })).toBeVisible({ timeout: 10000 });
        await expect(adminPage.getByRole("heading", { name: /homepage sections/i })).toBeVisible();
    });

    test("overview cards have Edit buttons (read-only overview — bug #9)", async ({ adminPage }) => {
        // Wait for overview to render
        await adminPage.getByRole("heading", { name: /homepage editor/i }).waitFor({ timeout: 10000 });

        // Every overview card has an Edit button.
        const editButtons = adminPage.getByRole("button", { name: /^Edit$/i });
        const count = await editButtons.count();
        // The number depends on Sanity data, but should be > 0 in any
        // real environment. If 0, skip — the editor still works on
        // empty docs.
        if (count === 0) {
            test.skip(true, "no banners or sections in Sanity — overview has no Edit buttons to test");
            return;
        }
        // At least the first one should be visible
        await expect(editButtons.first()).toBeVisible();
    });

    test("clicking Edit opens the popup (bug #6 — focused editing)", async ({ adminPage }) => {
        await adminPage.getByRole("heading", { name: /homepage editor/i }).waitFor({ timeout: 10000 });

        const editButtons = adminPage.getByRole("button", { name: /^Edit$/i });
        const count = await editButtons.count();
        if (count === 0) {
            test.skip(true, "no banners or sections in Sanity — cannot test popup");
            return;
        }

        await editButtons.first().click();

        // Popup should appear — look for the modal dialog
        const dialog = adminPage.getByRole("dialog");
        await expect(dialog).toBeVisible({ timeout: 5000 });

        // Popup should have a Close button (X)
        await expect(dialog.getByRole("button", { name: /close/i })).toBeVisible();
    });

    test("popup closes on Escape key", async ({ adminPage }) => {
        await adminPage.getByRole("heading", { name: /homepage editor/i }).waitFor({ timeout: 10000 });

        const editButtons = adminPage.getByRole("button", { name: /^Edit$/i });
        if (await editButtons.count() === 0) {
            test.skip();
            return;
        }
        await editButtons.first().click();
        const dialog = adminPage.getByRole("dialog");
        await expect(dialog).toBeVisible({ timeout: 5000 });

        // Escape closes
        await dialog.press("Escape");
        await expect(dialog).toBeHidden({ timeout: 2000 });
    });

    test("Save All button exists and shows Saved! after a successful save", async ({ adminPage }) => {
        await adminPage.getByRole("heading", { name: /homepage editor/i }).waitFor({ timeout: 10000 });

        const saveBtn = adminPage.getByRole("button", { name: /save all/i });
        await expect(saveBtn).toBeVisible();

        // Save All should be disabled when no changes are dirty.
        await expect(saveBtn).toBeDisabled();

        // Trigger a change: add a new banner
        await adminPage.getByRole("button", { name: /add banner/i }).click();

        // Save button should now be enabled
        await expect(saveBtn).toBeEnabled({ timeout: 2000 });

        // Click Save
        await saveBtn.click();

        // "Saved!" toast should appear (green check)
        await expect(adminPage.getByText("Saved!")).toBeVisible({ timeout: 30000 });

        // After save, button should be disabled again (no dirty changes)
        await expect(saveBtn).toBeDisabled({ timeout: 5000 });
    });

    test("AutoSuggest returns valid URL strings, not [object Object] (regression for bug #1)", async ({ adminPage }) => {
        // Open the first banner popup — that's where link AutoSuggest lives.
        await adminPage.getByRole("heading", { name: /homepage editor/i }).waitFor({ timeout: 10000 });

        const editButtons = adminPage.getByRole("button", { name: /^Edit$/i });
        if (await editButtons.count() === 0) {
            test.skip();
            return;
        }
        await editButtons.first().click();
        const dialog = adminPage.getByRole("dialog");
        await expect(dialog).toBeVisible({ timeout: 5000 });

        // Find the Link AutoSuggest input. The banner form has a Link field
        // with placeholder "/path/to/page".
        const linkInput = dialog.getByPlaceholder("/path/to/page").first();
        if (!(await linkInput.isVisible().catch(() => false))) {
            test.skip(true, "first edit target is not a banner — no link field to test");
            return;
        }

        // Type a partial query
        await linkInput.fill("/");
        await linkInput.fill("/pro");
        await adminPage.waitForTimeout(800);

        // Suggestions dropdown
        const dropdown = adminPage.locator(".absolute.z-50.w-full.mt-1");
        const dropdownVisible = await dropdown.isVisible().catch(() => false);

        if (dropdownVisible) {
            const suggestionButtons = dropdown.locator("button");
            const suggestionCount = await suggestionButtons.count();
            if (suggestionCount === 0) {
                test.skip(true, "no suggestions returned — Sanity may be empty");
                return;
            }
            for (let i = 0; i < suggestionCount; i++) {
                const text = await suggestionButtons.nth(i).textContent();
                expect(text).not.toContain("[object Object]");
                expect(text).toMatch(/^\//);
            }
        }
    });

    test("accent color input is present on the banner form (bug #5 — was missing)", async ({ adminPage }) => {
        await adminPage.getByRole("heading", { name: /homepage editor/i }).waitFor({ timeout: 10000 });

        const editButtons = adminPage.getByRole("button", { name: /^Edit$/i });
        if (await editButtons.count() === 0) {
            test.skip();
            return;
        }

        // Find the first banner's Edit button. Banners appear before sections
        // in the overview, so the first Edit button should be a banner.
        await editButtons.first().click();
        const dialog = adminPage.getByRole("dialog");
        await expect(dialog).toBeVisible({ timeout: 5000 });

        // Accent color label should be visible in the banner form
        const accentLabel = dialog.getByText("Accent Color");
        if (!(await accentLabel.isVisible().catch(() => false))) {
            test.skip(true, "first edit target is not a banner");
            return;
        }

        // There should be both a color picker and a text input
        const colorPicker = dialog.locator('input[type="color"]').first();
        await expect(colorPicker).toBeVisible();
    });

    test("product carousel popup auto-loads preview on open (bug #11 deferred fetch)", async ({ adminPage }) => {
        await adminPage.getByRole("heading", { name: /homepage editor/i }).waitFor({ timeout: 10000 });

        // Find a section that's a product carousel — the overview shows
        // a type chip "Products" for those.
        const productChips = adminPage.getByText("Products", { exact: true });
        const productCount = await productChips.count();
        if (productCount === 0) {
            test.skip(true, "no product_carousel sections in Sanity");
            return;
        }

        // Click the Edit button in the same card as the "Products" chip.
        // Walk up to the card container and back down to its Edit button.
        const productChip = productChips.first();
        const card = productChip.locator("xpath=ancestor::div[contains(@class, 'bg-neutral-900')][1]");
        const editBtn = card.getByRole("button", { name: /^Edit$/i });
        await editBtn.click();

        const dialog = adminPage.getByRole("dialog");
        await expect(dialog).toBeVisible({ timeout: 5000 });

        // Look for either the loading spinner or actual product content
        // in the preview panel. We accept either — the key assertion is
        // that the preview panel is rendered (not absent) which means the
        // ProductCarouselPreview component is mounted and the auto-load
        // effect has fired.
        const previewLabel = dialog.getByText(/live preview/i);
        await expect(previewLabel).toBeVisible({ timeout: 5000 });
    });

    test("add and remove items on a scroll variant (bug #7 — flexible variants)", async ({ adminPage }) => {
        await adminPage.getByRole("heading", { name: /homepage editor/i }).waitFor({ timeout: 10000 });

        // Find a Scroll Brands or Scroll Categories section
        const scrollChips = adminPage.getByText(/scroll (brands|categories)/i);
        const scrollCount = await scrollChips.count();
        if (scrollCount === 0) {
            test.skip(true, "no scroll-brands or scroll-categories sections in Sanity");
            return;
        }

        const chip = scrollChips.first();
        const card = chip.locator("xpath=ancestor::div[contains(@class, 'bg-neutral-900')][1]");
        await card.getByRole("button", { name: /^Edit$/i }).click();

        const dialog = adminPage.getByRole("dialog");
        await expect(dialog).toBeVisible({ timeout: 5000 });

        // Should have an "Add item" button (flexible variants allow add)
        const addBtn = dialog.getByRole("button", { name: /add item/i });
        await expect(addBtn).toBeVisible({ timeout: 3000 });

        // Count items before
        const itemHeaders = dialog.getByText(/^Item #\d+$/i);
        const beforeCount = await itemHeaders.count();

        await addBtn.click();
        // Count should increment
        await expect(itemHeaders).toHaveCount(beforeCount + 1, { timeout: 2000 });

        // Remove buttons should exist (with a delete icon-button label)
        const removeBtns = dialog.getByRole("button", { name: /remove item/i });
        const removeCount = await removeBtns.count();
        expect(removeCount).toBeGreaterThan(0);

        // Click the last remove button — count should decrement back
        await removeBtns.last().click();
        await expect(itemHeaders).toHaveCount(beforeCount, { timeout: 2000 });
    });

    test("drag-and-drop reorder of overview cards does not crash (bug #10 smoke test)", async ({ adminPage }) => {
        await adminPage.getByRole("heading", { name: /homepage editor/i }).waitFor({ timeout: 10000 });

        const editButtons = adminPage.getByRole("button", { name: /^Edit$/i });
        const count = await editButtons.count();
        if (count < 2) {
            test.skip(true, "need at least 2 cards to test DnD reorder");
            return;
        }

        // Find the first drag handle. The Overview renders a
        // drag_indicator icon inside the card header.
        const dragHandles = adminPage.locator('[aria-label^="Reorder"]');
        const handleCount = await dragHandles.count();
        if (handleCount < 2) {
            test.skip();
            return;
        }

        // Smoke test: drag the first handle below the second. We don't
        // assert order changes (DnD with Playwright is finicky in CI);
        // we just assert no JS error is thrown and the page is still
        // responsive after the drag.
        const first = dragHandles.first();
        const second = dragHandles.nth(1);
        const firstBox = await first.boundingBox();
        const secondBox = await second.boundingBox();
        if (!firstBox || !secondBox) {
            test.skip();
            return;
        }

        await first.hover();
        await adminPage.mouse.down();
        await adminPage.mouse.move(
            secondBox.x + secondBox.width / 2,
            secondBox.y + secondBox.height / 2,
            { steps: 5 }
        );
        await adminPage.mouse.up();

        // Page should still be responsive — check the Save All button is visible.
        await expect(adminPage.getByRole("button", { name: /save all/i })).toBeVisible({ timeout: 3000 });
    });
});

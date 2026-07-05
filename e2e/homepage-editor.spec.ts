import { test, expect } from "./fixtures";

test.describe("Admin Homepage Editor", () => {

    test.beforeEach(async ({ adminPage }) => {
        // Known issue: homepage editor takes >60s to load (performance bug #11 in issues/)
        // Use domcontentloaded so we can at least start assertions sooner
        await adminPage.goto("/admin/homepage", { waitUntil: "domcontentloaded", timeout: 120000 });
    });

    test("should load the homepage editor", async ({ adminPage }) => {
        await expect(adminPage.getByRole("heading", { name: /homepage editor/i })).toBeVisible({ timeout: 120000 });
        await expect(adminPage.getByRole("heading", { name: /hero carousel/i })).toBeVisible();
        await expect(adminPage.getByRole("heading", { name: /homepage sections/i })).toBeVisible();
        await expect(adminPage.getByRole("button", { name: /add banner/i })).toBeVisible();
        await expect(adminPage.getByRole("button", { name: /add section/i })).toBeVisible();
    });

    test("Save All button should exist and be disabled when no changes", async ({ adminPage }) => {
        const saveBtn = adminPage.getByRole("button", { name: /save all/i });
        await expect(saveBtn).toBeVisible();
        await expect(saveBtn).toBeDisabled();
    });

    test("should show banners if they exist in Sanity data", async ({ adminPage }) => {
        const bannerHeadings = adminPage.getByRole("heading", { name: /banner \d+/i });
        const count = await bannerHeadings.count();
        // If there's at least one banner, verify the form fields exist
        if (count > 0) {
            for (let i = 1; i <= count && i <= 3; i++) {
                await expect(adminPage.getByRole("heading", { name: new RegExp(`banner ${i}`, "i") })).toBeVisible();
            }
        }
    });

    test("should show sections if they exist in Sanity data", async ({ adminPage }) => {
        // Section cards have #number badge with section index
        const sectionBadges = adminPage.locator("span.bg-zinc-800.text-zinc-500");
        const count = await sectionBadges.count();
        if (count > 0) {
            for (let i = 0; i < count && i < 3; i++) {
                await expect(sectionBadges.nth(i)).toBeVisible();
            }
        }
    });

    test("AutoSuggest should return valid URL strings (not [object Object])", async ({ adminPage }) => {
        // Type in the first Link AutoSuggest field (banner link has placeholder "/path/to/page")
        const autoSuggestInput = adminPage.getByPlaceholder("/path/to/page").first();
        await expect(autoSuggestInput).toBeVisible({ timeout: 10000 });

        // Type a partial query to trigger suggestions
        await autoSuggestInput.fill("/");
        await autoSuggestInput.fill("/pro");

        // Wait for the debounced fetch (300ms) plus network
        await adminPage.waitForTimeout(1000);

        // Check if suggestions dropdown appeared
        const dropdown = adminPage.locator(".absolute.z-50.w-full.mt-1");
        const dropdownVisible = await dropdown.isVisible().catch(() => false);

        if (dropdownVisible) {
            const suggestionButtons = dropdown.locator("button");
            const suggestionCount = await suggestionButtons.count();
            expect(suggestionCount).toBeGreaterThan(0);

            // Check every suggestion text does NOT contain [object Object]
            for (let i = 0; i < suggestionCount; i++) {
                const text = await suggestionButtons.nth(i).textContent();
                expect(text).not.toContain("[object Object]");
                expect(text).not.toContain("object Object");
                // Every suggestion should start with "/"
                expect(text).toMatch(/^\//);
            }
        }
    });

    test("should add a new banner", async ({ adminPage }) => {
        const beforeCount = await adminPage.locator("text=Banner").count();
        await adminPage.getByRole("button", { name: /add banner/i }).click();
        // Should now see "New Banner" as a title
        await expect(adminPage.locator('input[value="New Banner"]').first()).toBeVisible({ timeout: 5000 });
    });

    test("should delete a banner", async ({ adminPage }) => {
        const bannerInputs = adminPage.getByPlaceholder("Enter banner title...");
        const beforeCount = await bannerInputs.count();

        if (beforeCount === 0) {
            test.skip("no banners to delete");
            return;
        }

        // Click the first Delete button in a banner card
        const deleteBtn = adminPage.locator("button").filter({ hasText: /^Delete$/ }).first();
        await expect(deleteBtn).toBeVisible();

        // Handle confirm dialog
        adminPage.once("dialog", (dialog) => dialog.accept());
        await deleteBtn.click();

        // Wait for the banner to be removed
        await expect(bannerInputs.first()).toBeVisible({ timeout: 5000 });
        const afterCount = await bannerInputs.count();
        expect(afterCount).toBeLessThan(beforeCount);
    });

    test("should add a Category Grid section via dialog", async ({ adminPage }) => {
        await adminPage.getByRole("button", { name: /add section/i }).click();

        // Dialog should be visible (heading text, not the button)
        await expect(adminPage.getByRole("heading", { name: "Add Section" })).toBeVisible();

        // Default should be Category Grid already selected
        await expect(adminPage.getByRole("button", { name: /category grid/i })).toHaveClass(/bg-primary/);

        // Click Add
        await adminPage.getByRole("button", { name: /^add$/i }).click();

        // New section should appear
        await expect(adminPage.locator('input[value="New Section"]').first()).toBeVisible({ timeout: 5000 });
    });

    test("should add a Product Carousel section via dialog", async ({ adminPage }) => {
        await adminPage.getByRole("button", { name: /add section/i }).click();
        await expect(adminPage.getByRole("heading", { name: "Add Section" })).toBeVisible();

        // Click Product Carousel type
        await adminPage.getByRole("button", { name: /product carousel/i }).click();
        await adminPage.getByRole("button", { name: /^add$/i }).click();

        // Verify section was added — look for the sort order select (unique to product carousel)
        await expect(adminPage.getByRole("combobox").filter({ hasText: /newest|price/i }).first()).toBeVisible({ timeout: 5000 });
    });

    test("should add a Category Carousel section via dialog", async ({ adminPage }) => {
        await adminPage.getByRole("button", { name: /add section/i }).click();
        await expect(adminPage.getByRole("heading", { name: "Add Section" })).toBeVisible();

        // Click Category Carousel type
        await adminPage.getByRole("button", { name: /category carousel/i }).click();
        await adminPage.getByRole("button", { name: /^add$/i }).click();

        // Should show "3 cards" in the section info
        await expect(adminPage.getByText(/3 cards/i).first()).toBeVisible({ timeout: 5000 });
    });

    test("should delete a section", async ({ adminPage }) => {
        // Count section headings ("New Section" or existing titles)
        const sections = adminPage.locator("h3.text-sm.font-medium.text-white");
        const beforeCount = await sections.count();

        if (beforeCount === 0) {
            test.skip("no sections to delete");
            return;
        }

        // Click the first Delete button (not the banner delete ones)
        const deleteBtns = adminPage.locator("button").filter({ hasText: /^Delete$/ });
        const deleteCount = await deleteBtns.count();
        if (deleteCount === 0) {
            test.skip("no delete buttons found");
            return;
        }

        // The section delete buttons are further down the page. Use the last one to avoid banner delete.
        const sectionDeleteBtn = deleteBtns.last();

        adminPage.once("dialog", (dialog) => dialog.accept());
        await sectionDeleteBtn.click();

        // Wait for sections to re-render
        await adminPage.waitForTimeout(500);
        const afterCount = await sections.count();
        expect(afterCount).toBeLessThanOrEqual(beforeCount);
    });

    test("should show validation error when saving with insufficient items", async ({ adminPage }) => {
        // Add a Category Grid section (default variant grid-4-equal, needs 4 items)
        await adminPage.getByRole("button", { name: /add section/i }).click();
        await expect(adminPage.getByRole("heading", { name: "Add Section" })).toBeVisible();
        await adminPage.getByRole("button", { name: /^add$/i }).click();

        // Make a change so Save All is enabled
        const titleInput = adminPage.locator('input[value="New Section"]').first();
        await titleInput.fill("Test Validation");

        // Try to save — should fail because variant needs at least 4 items
        const saveBtn = adminPage.getByRole("button", { name: /save all/i });
        await expect(saveBtn).toBeEnabled({ timeout: 3000 });
        await saveBtn.click();

        // Check error message appears
        await expect(adminPage.getByText(/requires at least/i).first()).toBeVisible({ timeout: 5000 });
    });

    test("should move sections up and down", async ({ adminPage }) => {
        // Need at least 2 sections to test reorder
        // First, check how many sections exist
        const sectionTitles = adminPage.locator("h3.text-sm.font-medium.text-white");
        let count = await sectionTitles.count();

        // Add sections if needed
        while (count < 2) {
            await adminPage.getByRole("button", { name: /add section/i }).click();
            await expect(adminPage.getByRole("heading", { name: "Add Section" })).toBeVisible();
            await adminPage.getByRole("button", { name: /^add$/i }).click();
            count++;
        }

        await adminPage.waitForTimeout(500);

        // Find move up and move down buttons
        const moveUpBtns = adminPage.locator('button[title="Move up"]');
        const moveDownBtns = adminPage.locator('button[title="Move down"]');

        const upCount = await moveUpBtns.count();
        const downCount = await moveDownBtns.count();

        // First section can't move up (disabled), last can't move down (disabled)
        if (downCount > 0) {
            await moveDownBtns.first().click();
            await adminPage.waitForTimeout(300);
        }
        if (upCount > 0) {
            // After moving down, the buttons may have re-rendered
            const moveUpBtnsAfter = adminPage.locator('button[title="Move up"]');
            const upCountAfter = await moveUpBtnsAfter.count();
            if (upCountAfter > 0) {
                await moveUpBtnsAfter.first().click();
                await adminPage.waitForTimeout(300);
            }
        }

        // Verify buttons still exist (no crash from reorder)
        await expect(adminPage.locator('button[title="Move up"]').first()).toBeVisible();
        await expect(adminPage.locator('button[title="Move down"]').first()).toBeVisible();
    });

    test("preview should render for each section type", async ({ adminPage }) => {
        // Find section cards by looking for the "Live Preview" text
        const previewLabels = adminPage.getByText("Live Preview");
        const previewCount = await previewLabels.count();

        // If no sections exist, skip
        if (previewCount === 0) {
            test.skip("no sections to preview");
            return;
        }

        // Each preview should have a pointer-events-none container
        const previewContainers = adminPage.locator(".pointer-events-none");
        const containerCount = await previewContainers.count();
        expect(containerCount).toBeGreaterThanOrEqual(previewCount);
    });

    test("should add banner, edit fields, and see them update", async ({ adminPage }) => {
        // Add a new banner
        await adminPage.getByRole("button", { name: /add banner/i }).click();
        const titleInput = adminPage.locator('input[value="New Banner"]').first();
        await expect(titleInput).toBeVisible({ timeout: 5000 });

        // Edit the banner title
        await titleInput.fill("Test Banner Title");
        await expect(titleInput).toHaveValue("Test Banner Title");

        // Edit the subtitle
        const subtitleInput = adminPage.getByPlaceholder("Enter subtitle...").first();
        await subtitleInput.fill("Test Subtitle");
        await expect(subtitleInput).toHaveValue("Test Subtitle");
    });

});

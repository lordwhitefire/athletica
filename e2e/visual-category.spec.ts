import { test, expect } from "@playwright/test";
import { navigateToCategory } from "./constants";

test.describe("Visual — Category page", () => {
    test("category page should match visual baseline", async ({ page }) => {
        await navigateToCategory(page);
        await page.waitForLoadState("networkidle");
        await expect(page).toHaveScreenshot("category-page.png", { maxDiffPixelRatio: 0.05 });
    });
});

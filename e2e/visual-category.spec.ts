import { test, expect } from "@playwright/test";

test.describe("Visual — Category page", () => {
    test("category page should match visual baseline", async ({ page }) => {
        await page.goto("/football-boots");
        await page.waitForLoadState("networkidle");
        await expect(page).toHaveScreenshot("category-page.png", { maxDiffPixelRatio: 0.05 });
    });
});

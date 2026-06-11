import { test, expect } from "@playwright/test";

test.describe("Visual — Homepage", () => {
    test("homepage should match visual baseline", async ({ page }) => {
        await page.goto("/");
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(1000);
        await expect(page).toHaveScreenshot("homepage.png", { maxDiffPixelRatio: 0.05 });
    });
});

import { test, expect } from "@playwright/test";
import { navigateToCategory } from "./constants";

test.describe("Visual — Product detail page", () => {
    test("product detail page should match visual baseline", async ({ page }) => {
        await navigateToCategory(page);
        await page.locator("[data-testid='cart-icon']").hover();
        await page.waitForTimeout(200);
        await page.locator("[data-testid='product-card']").first().click();
        await page.waitForLoadState("networkidle");
        await page.waitForTimeout(2000);
        await expect(page).toHaveScreenshot("product-detail.png", { maxDiffPixelRatio: 0.05, timeout: 15000 });
    });
});

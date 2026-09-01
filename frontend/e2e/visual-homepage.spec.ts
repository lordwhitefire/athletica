import { test, expect } from "@playwright/test";

async function freezeCarousels(page: import("@playwright/test").Page) {
    await page.evaluate(() => {
        document.querySelectorAll(
            '[class*="carousel"], [class*="slider"], [class*="swiper"]'
        ).forEach(el => {
            (el as HTMLElement).style.animation = 'none';
            (el as HTMLElement).style.transition = 'none';
        });
    });
}

test.describe("Visual — Homepage", () => {
    test("homepage should match visual baseline", async ({ page }) => {
        await page.goto("/");
        await expect(page.getByTestId("product-card").first()).toBeVisible({ timeout: 15000 });
        await freezeCarousels(page);
        await page.waitForTimeout(1000);
        await expect(page).toHaveScreenshot("homepage.png", { maxDiffPixelRatio: 0.05, animations: "disabled" });
    });
});

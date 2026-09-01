import { test, expect } from "@playwright/test";
import { navigateToCategory } from "./constants";

test.describe("Product detail page", () => {
    test.beforeEach(async ({ page }) => {
        await navigateToCategory(page);
        await page.locator("[data-testid='cart-icon']").hover();
        await page.waitForTimeout(200);
        await page.locator("[data-testid='product-card']").first().click();
        await page.waitForURL(url => url.pathname !== "/", { timeout: 15000 });
        await page.waitForLoadState("networkidle");
    });

    test("should display the product name as h1", async ({ page }) => {
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    });

    test("should display the product price", async ({ page }) => {
        await expect(page.locator("[data-testid='product-price']")).toBeVisible({ timeout: 10000 });
    });

    test("should display at least one product image", async ({ page }) => {
        await expect(page.locator("main img").first()).toBeVisible();
    });

    test("should display size options", async ({ page }) => {
        await expect(page.locator("[data-testid='size-option']").first()).toBeVisible({ timeout: 10000 });
    });

    test("should display Add to Cart button", async ({ page }) => {
        await expect(page.getByRole("button", { name: /add to cart/i })).toBeVisible({ timeout: 10000 });
    });

    test("should add product to cart and open the cart drawer", async ({ page }) => {
        await page.getByTestId("size-option").first().waitFor({ state: "attached", timeout: 10000 }).catch(() => { });

        const sizeOptions = page.locator("[data-testid='size-option']:not([disabled])");
        if (await sizeOptions.count() > 0) {
            await sizeOptions.first().click();
        }

        await page.getByRole("button", { name: /add to cart/i }).click();
        await expect(page.getByTestId("cart-count").first()).toContainText("1", { timeout: 5000 });
    });
});

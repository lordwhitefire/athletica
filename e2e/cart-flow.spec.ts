import { test, expect } from "@playwright/test";

test.describe("Cart flow", () => {
    async function addFirstProductToCart(page: import("@playwright/test").Page) {
        // Navigate directly to the category page to avoid the mega-menu overlay
        await page.goto("/football-boots");
        await page.waitForLoadState("networkidle");

        // Click the first product card and wait for navigation to the product detail page
        await page.locator("[data-testid='product-card']").first().click();
        await page.waitForURL(url => url.pathname !== "/football-boots", { timeout: 15000 });
        await page.waitForLoadState("networkidle");

        // Wait for React to hydrate so click handlers are attached to size buttons
        await page.getByTestId("size-option").first().waitFor({ state: "attached", timeout: 10000 }).catch(() => { });

        const sizeOptions = page.locator("[data-testid='size-option']:not([disabled])");
        if (await sizeOptions.count() > 0) {
            await sizeOptions.first().click();
        }
        await page.getByRole("button", { name: /add to cart/i }).click({ timeout: 15000 });
        await page.waitForTimeout(500);
    }

    test("should show 1 item in cart count after adding a product", async ({ page }) => {
        await addFirstProductToCart(page);
        await expect(page.getByTestId("cart-count").first()).toContainText("1", { timeout: 5000 });
    });

    test("should open the mini cart drawer when cart icon is clicked", async ({ page }) => {
        await addFirstProductToCart(page);
        await page.locator("[data-testid='cart-icon']").first().click();
        await expect(page.locator("[data-testid='mini-cart']")).toBeVisible({ timeout: 3000 });
    });

    test("should display the added product in the mini cart", async ({ page }) => {
        await addFirstProductToCart(page);
        await page.locator("[data-testid='cart-icon']").first().click();
        await expect(page.locator("[data-testid='mini-cart']")).toBeVisible();
        await expect(page.locator("[data-testid='cart-item']").first()).toBeVisible();
    });

    test("should remove a product from the cart when Remove is clicked", async ({ page }) => {
        await addFirstProductToCart(page);
        await page.locator("[data-testid='cart-icon']").first().click();
        await page.getByRole("button", { name: /remove/i }).first().click();
        await expect(page.getByText(/your cart is empty/i)).toBeVisible({ timeout: 3000 });
    });

    test("should match visual baseline when cart drawer is open with an item", async ({ page }) => {
        await addFirstProductToCart(page);
        await page.locator("[data-testid='cart-icon']").first().click();
        await expect(page.locator("[data-testid='mini-cart']")).toBeVisible({ timeout: 5000 });
        await page.waitForTimeout(2000);
        await expect(page).toHaveScreenshot("cart-drawer-open.png", { maxDiffPixelRatio: 0.05 });
    });
});

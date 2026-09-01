import { test, expect } from "@playwright/test";
import { navigateToCategory } from "./constants";

test.describe("Category page — product filtering", () => {
    async function gotoCategory(page: import("@playwright/test").Page) {
        await navigateToCategory(page);
        await expect(page.locator("[data-testid='product-card']").first()).toBeVisible({ timeout: 10000 });
    }

    test("should load the category page", async ({ page }) => {
        await navigateToCategory(page);
        await expect(page.locator("[data-testid='product-card']").first()).toBeVisible({ timeout: 10000 });
    });

    test("should display a brand filter with brand options", async ({ page }) => {
        await navigateToCategory(page);
        await expect(page.locator("h3").filter({ hasText: /brand/i }).first()).toBeVisible({ timeout: 10000 });
        await expect(page.getByLabel(/adidas/i).first()).toBeVisible();
    });

    test("should filter products when a brand filter is selected", async ({ page }) => {
        await navigateToCategory(page);
        await page.getByPlaceholder("Search elite performance gear...").click();
        await page.locator("label").filter({ hasText: /adidas/i }).first().click();

        const productCards = page.locator("[data-testid='product-card']");
        await expect(productCards.first()).toBeVisible({ timeout: 10000 });

        await expect(page).toHaveURL(/brand=/);
    });

    test("should show no products when filtering produces an empty result", async ({ page }) => {
        await navigateToCategory(page);
        await page.goto(page.url() + "?brand=NonExistentBrand");
        await expect(page.getByText(/no products found/i)).toBeVisible({ timeout: 10000 });
    });

    test("should navigate to a product detail page from a product card click", async ({ page }) => {
        await navigateToCategory(page);
        await page.locator("[data-testid='cart-icon']").hover();
        await page.waitForTimeout(200);
        await page.locator("[data-testid='product-card']").first().click();
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    });
});

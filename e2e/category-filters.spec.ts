import { test, expect } from "@playwright/test";

test.describe("Category page — product filtering", () => {
    test("should load the Football Boots category page", async ({ page }) => {
        await page.goto("/football-boots");
        await expect(page).toHaveTitle(/football boots/i);
        await expect(page.locator("[data-testid='product-card']").first()).toBeVisible({ timeout: 10000 });
    });

    test("should display a brand filter with brand options", async ({ page }) => {
        await page.goto("/football-boots");
        await expect(page.locator("h3").filter({ hasText: /brand/i }).first()).toBeVisible({ timeout: 10000 });
        await expect(page.getByLabel(/adidas/i).first()).toBeVisible();
    });

    test("should filter products when a brand filter is selected", async ({ page }) => {
        await page.goto("/football-boots");
        await page.getByLabel(/adidas/i).first().click();

        const productCards = page.locator("[data-testid='product-card']");
        await expect(productCards.first()).toBeVisible({ timeout: 10000 });

        await expect(page).toHaveURL(/brand/);
    });

    test("should show no products when filtering produces an empty result", async ({ page }) => {
        await page.goto("/football-boots?brand=NonExistentBrand");
        await expect(page.getByText(/no products found/i)).toBeVisible({ timeout: 10000 });
    });

    test("should navigate to a product detail page from a product card click", async ({ page }) => {
        await page.goto("/football-boots");
        await page.locator("[data-testid='product-card']").first().click();
        await expect(page).not.toHaveURL("/football-boots");
        await expect(page.getByRole("heading", { level: 1 })).toBeVisible();
    });
});

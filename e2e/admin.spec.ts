import { test, expect } from "./fixtures";

test.describe("Admin area — authenticated", () => {
    test("should load the admin dashboard after login", async ({ adminPage }) => {
        await adminPage.goto("/admin");
        await expect(adminPage.getByRole("heading", { name: /dashboard/i })).toBeVisible({ timeout: 10000 });
    });

    test("should display the products list in admin", async ({ adminPage }) => {
        await adminPage.goto("/admin/products");
        await expect(adminPage.getByTestId("admin-products-page")).toBeVisible({ timeout: 20000 });
        await expect(adminPage.getByTestId("admin-products-table")).toBeVisible({ timeout: 10000 });
    });

    test("should navigate to the new product form from admin products", async ({ adminPage }) => {
        await adminPage.goto("/admin/products");
        await expect(adminPage.getByTestId("admin-products-page")).toBeVisible({ timeout: 20000 });
        await adminPage.goto("/admin/products/new");
        await expect(adminPage.getByTestId("product-form-page")).toBeVisible({ timeout: 10000 });
    });

    test("should show validation errors in the product form when mandatory fields are empty", async ({ adminPage }) => {
        await adminPage.goto("/admin/products/new");
        // Fill model input first — ModelInput requires a valid classification → type path
        const modelInput = adminPage.locator("text=Model").locator("..").locator("input");
        await modelInput.fill("Football Boots");
        // Press Enter to confirm first suggestion
        await modelInput.press("Enter");
        await adminPage.waitForTimeout(500);
        // Now button should be enabled (modelValid = true)
        await adminPage.getByRole("button", { name: /create product/i }).click({ timeout: 5000 });
        await expect(adminPage.getByText(/required/i).first()).toBeVisible({ timeout: 8000 });
    });

    test("should redirect unauthenticated users away from admin", async ({ page }) => {
        await page.goto("/admin");
        await expect(page).toHaveURL(/admin\/login/);
    });
});

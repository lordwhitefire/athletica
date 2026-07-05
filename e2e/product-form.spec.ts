import { test, expect } from "./fixtures";

test.describe("Admin Product Form", () => {

    test.beforeEach(async ({ adminPage }) => {
        await adminPage.goto("/admin/products/new");
        await expect(adminPage.getByTestId("product-form-page")).toBeVisible({ timeout: 15000 });
    });

    test("should load all form sections", async ({ adminPage }) => {
        await expect(adminPage.getByRole("heading", { name: /new product/i })).toBeVisible();
        await expect(adminPage.getByRole("heading", { name: "Images" })).toBeVisible();
        await expect(adminPage.getByRole("heading", { name: "Basic Info" })).toBeVisible();
        await expect(adminPage.getByRole("heading", { name: "Pricing" })).toBeVisible();
        await expect(adminPage.getByRole("heading", { name: "Description" })).toBeVisible();
        await expect(adminPage.getByRole("heading", { name: "Key Benefits" })).toBeVisible();
        await expect(adminPage.getByRole("heading", { name: "Technical Details" })).toBeVisible();
        await expect(adminPage.getByRole("button", { name: /create product/i })).toBeVisible();
    });

    test("Create Product button should be disabled initially", async ({ adminPage }) => {
        await expect(adminPage.getByRole("button", { name: /create product/i })).toBeDisabled();
    });

    test("should fill basic info fields", async ({ adminPage }) => {
        const idInput = adminPage.locator('input[name="id"]');
        await idInput.fill("test-001");
        await expect(idInput).toHaveValue("test-001");

        const slugInput = adminPage.locator('input[name="url_slug"]');
        await slugInput.fill("test-product");
        await expect(slugInput).toHaveValue("test-product");
    });

    test("should have image upload and media library buttons", async ({ adminPage }) => {
        const uploadBtns = adminPage.locator("text=Upload");
        expect(await uploadBtns.count()).toBeGreaterThanOrEqual(1);

        const mediaBtns = adminPage.locator("text=Media Library");
        expect(await mediaBtns.count()).toBeGreaterThanOrEqual(1);
    });

    test("should have Add Image button for gallery", async ({ adminPage }) => {
        await expect(adminPage.getByText("Add Image")).toBeVisible();
    });

    test("should have cancel button", async ({ adminPage }) => {
        await expect(adminPage.getByRole("button", { name: /cancel/i })).toBeVisible();
    });

    test("currency select defaults to EUR", async ({ adminPage }) => {
        await expect(adminPage.locator('select[name="currency"]')).toHaveValue("EUR");
    });

    test("gender select defaults to Unisex", async ({ adminPage }) => {
        await expect(adminPage.locator('select[name="gender"]')).toHaveValue("Unisex");
    });

    test("should have model input with placeholder", async ({ adminPage }) => {
        await expect(adminPage.getByPlaceholder("Type model segment...")).toBeVisible();
    });

    test("should show model validation hint after filling model", async ({ adminPage }) => {
        const modelInput = adminPage.getByPlaceholder("Type model segment...");
        await modelInput.fill("Football Boots");
        const submitBtn = adminPage.getByRole("button", { name: /create product/i });
        await expect(submitBtn).toBeDisabled();
    });

});

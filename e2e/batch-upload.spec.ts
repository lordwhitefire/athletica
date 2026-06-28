import { test, expect } from "./fixtures";
import { createTestZip } from "./fixtures/batch-upload";

test.describe("Batch upload", () => {
    test("should display the batch upload page", async ({ adminPage }) => {
        await adminPage.goto("/admin/products/batch-upload");
        await expect(adminPage.locator("h1")).toContainText("Batch Upload");
    });

    test("should show error when uploading a non-ZIP file", async ({ adminPage }) => {
        await adminPage.goto("/admin/products/batch-upload");

        const fileInput = adminPage.locator('input[type="file"]');
        await fileInput.setInputFiles({
            name: "test.txt",
            mimeType: "text/plain",
            buffer: Buffer.from("not a zip"),
        });

        await adminPage.getByRole("button", { name: /Upload & Preview/ }).click();
        await expect(adminPage.locator("text=Only .zip files are accepted")).toBeVisible({ timeout: 10000 });
    });

    test("should parse a valid ZIP and show preview table", async ({ adminPage }) => {
        await adminPage.goto("/admin/products/batch-upload");

        const zipBuffer = createTestZip({ rowCount: 1 });
        const fileInput = adminPage.locator('input[type="file"]');
        await fileInput.setInputFiles({
            name: "products.zip",
            mimeType: "application/zip",
            buffer: zipBuffer,
        });

        await adminPage.getByRole("button", { name: /Upload & Preview/ }).click();

        await expect(adminPage.locator("text=Preview")).toBeVisible({ timeout: 30000 });
        await expect(adminPage.locator("text=Valid: 1")).toBeVisible({ timeout: 10000 });
    });

    test("should show validation errors for bad CSV data", async ({ adminPage }) => {
        await adminPage.goto("/admin/products/batch-upload");

        const badCsv = `model,brand,price_current,price_currency
,BadBrand,abc,INVALID`;

        const zipBuffer = createTestZip({ csvContent: badCsv, includeImages: false });
        const fileInput = adminPage.locator('input[type="file"]');
        await fileInput.setInputFiles({
            name: "bad-products.zip",
            mimeType: "application/zip",
            buffer: zipBuffer,
        });

        await adminPage.getByRole("button", { name: /Upload & Preview/ }).click();

        await expect(adminPage.locator("text=Preview")).toBeVisible({ timeout: 30000 });
        await expect(adminPage.locator("text=Errors: 1")).toBeVisible({ timeout: 10000 });
    });

    test("should show a CSV template download link", async ({ adminPage }) => {
        await adminPage.goto("/admin/products/batch-upload");
        const downloadLink = adminPage.locator('a[download]');
        await expect(downloadLink).toBeVisible();
    });
});

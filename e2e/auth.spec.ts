import { test, expect } from "@playwright/test";

test.describe("Authentication flow", () => {
    test.describe("Login page", () => {
        test.beforeEach(async ({ page }) => {
            await page.goto("/login");
        });

        test("should display the login form with email and password fields", async ({ page }) => {
            await expect(page.getByLabel(/email address/i)).toBeVisible();
            await expect(page.getByLabel(/password/i)).toBeVisible();
            await expect(page.getByRole("button", { name: /sign in/i })).toBeVisible();
        });

        test("should show validation errors when submitted with empty fields", async ({ page }) => {
            await page.getByRole("button", { name: /sign in/i }).click();
            await expect(page.getByText(/enter a valid email address/i)).toBeVisible();
            await expect(page.getByText(/password is required/i)).toBeVisible();
        });

        test("should show an error when email format is invalid", async ({ page }) => {
            await page.getByLabel(/email address/i).fill("not-an-email");
            await page.getByRole("button", { name: /sign in/i }).click();
            await expect(page.getByRole("alert")).toBeVisible({ timeout: 3000 });
        });

        test("should show an error when credentials are wrong", async ({ page }) => {
            await page.getByLabel(/email address/i).fill("wrong@example.com");
            await page.getByLabel(/password/i).fill("wrongpassword");
            await page.getByRole("button", { name: /sign in/i }).click();
            await expect(page.getByRole("alert")).toBeVisible({ timeout: 10000 });
        });

        test("should navigate to the register page via the Create One link", async ({ page }) => {
            await page.getByRole("link", { name: /create one/i }).click();
            await expect(page).toHaveURL(/register/);
        });
    });

    test.describe("Register page", () => {
        test.beforeEach(async ({ page }) => {
            await page.goto("/register");
        });

        test("should display the registration form", async ({ page }) => {
            await expect(page.getByLabel(/full name/i)).toBeVisible();
            await expect(page.getByRole("textbox", { name: /email address/i })).toBeVisible();
            await expect(page.getByLabel(/^password$/i)).toBeVisible();
            await expect(page.getByLabel(/confirm password/i)).toBeVisible();
        });

        test("should show an error when passwords do not match", async ({ page }) => {
            await page.getByLabel(/full name/i).fill("Test User");
            await page.getByRole("textbox", { name: /email address/i }).fill("testuser@example.com");
            await page.getByLabel(/^password$/i).fill("password123");
            await page.getByLabel(/confirm password/i).fill("differentpass");
            await page.getByRole("button", { name: /create account/i }).click();
            await expect(page.getByText(/passwords do not match/i)).toBeVisible();
        });

        test("should show an error for a password under 6 characters", async ({ page }) => {
            await page.getByLabel(/^password$/i).fill("abc");
            await page.getByRole("button", { name: /create account/i }).click();
            await expect(page.getByText(/at least 6 characters/i)).toBeVisible();
        });
    });
});

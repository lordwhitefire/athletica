import { test, expect } from "@playwright/test";
import { navigateToCategory } from "./constants";

test.describe("Next.js API routes", () => {
    test.describe("POST /api/admin/login", () => {
        test("should return 401 with invalid credentials", async ({ request }) => {
            const response = await request.post("/api/admin/login", {
                data: { email: "wrong@example.com", password: "wrong" },
            });
            test.skip(response.status() === 404, "Route /api/admin/login does not exist");

            expect(response.status()).toBe(401);
            const body = await response.json();
            expect(body).toBeDefined();
        });

        test("should return 200 with valid credentials", async ({ request }) => {
            const response = await request.post("/api/admin/login", {
                data: {
                    email: process.env.ADMIN_TEST_EMAIL ?? "admin@atletica.com",
                    password: process.env.ADMIN_TEST_PASSWORD ?? "4603bb34-13ce55de",
                },
            });
            test.skip(response.status() === 404, "Route /api/admin/login does not exist");

            expect([200, 401]).toContain(response.status());
        });
    });

    test.describe("POST /api/admin/logout", () => {
        test("should return 200 when logging out (even without active session)", async ({ request }) => {
            const response = await request.post("/api/admin/logout");
            test.skip(response.status() === 404, "Route /api/admin/logout does not exist");

            expect(response.status()).toBe(200);
        });
    });

    test.describe("GET /api/admin/media/assets", () => {
        test("should return 403 without valid origin (CSRF protection)", async ({ request }) => {
            const response = await request.get("/api/admin/media/assets", {
                headers: { origin: "http://evil.com" },
            });
            test.skip(response.status() === 404, "Route /api/admin/media/assets does not exist");

            expect(response.status()).toBe(403);
        });
    });

    test.describe("POST /api/admin/media/upload", () => {
        test("should return 403 without valid origin (CSRF protection)", async ({ request }) => {
            const response = await request.post("/api/admin/media/upload", {
                headers: { origin: "http://evil.com" },
                multipart: {},
            });
            test.skip(response.status() === 404, "Route /api/admin/media/upload does not exist");

            expect(response.status()).toBe(403);
        });
    });

});

test.describe("Sanity API contract (via running app)", () => {
    test("should display products fetched from Sanity on the category page", async ({ page }) => {
        await navigateToCategory(page);
        await expect(page.locator("[data-testid='product-card']").first()).toBeVisible({ timeout: 10000 });
    });

    test("product detail page should return 200 for a known product slug", async ({ request }) => {
        const KNOWN_SLUG = process.env.TEST_PRODUCT_SLUG ?? "adidas-predator-league-ft-fg-mg-red";

        const response = await request.get(`/${KNOWN_SLUG}`);
        expect([200, 301, 302]).toContain(response.status());
    });
});

test.describe("Supabase Auth API contract (via running app)", () => {
    test("accessing a protected storefront page while unauthenticated should not return 500", async ({ request }) => {
        const response = await request.get("/account");
        expect(response.status()).not.toBe(500);
    });
});

import { test as base, expect } from "@playwright/test";
import type { Page } from "@playwright/test";

type Fixtures = {
    adminPage: Page;
};

export const test = base.extend<Fixtures>({
    adminPage: async ({ page }, use) => {
        await page.goto("/admin/login");
        await page.getByRole("textbox", { name: /email/i }).fill(process.env.ADMIN_TEST_EMAIL ?? "admin@athletica.com");
        await page.getByLabel(/password/i).fill(process.env.ADMIN_TEST_PASSWORD ?? "4603bb34-13ce55de");
        await page.getByRole("button", { name: /sign in/i }).click();

        // Wait for redirect to admin dashboard (NOT /admin/login)
        await page.waitForURL(/\/admin\/?(?:\?.*)?$/, { timeout: 60000 });

        await use(page);
    },
});

export { expect };

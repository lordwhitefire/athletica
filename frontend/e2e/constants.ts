import type { Page } from "@playwright/test";

export const NAV_IDS = {
    CATEGORY_MAIN: "1-285",
};

export const PRODUCT_SLUGS = {
    PREDATOR_LEAGUE_RED: "adidas-predator-league-ft-fg-mg-red",
};

export async function navigateToCategory(page: Page) {
    await page.goto("/");
    await page.waitForLoadState("load");

    const navItem = page.locator(`[data-testid="nav-item-${NAV_IDS.CATEGORY_MAIN}"]`);

    await navItem.waitFor({ state: "attached", timeout: 15000 });

    if (await navItem.isVisible()) {
        await navItem.click();
        await page.waitForURL(/\/en\//);
    } else {
        const href = await navItem.getAttribute("href");
        await page.goto(href!);
    }

    await page.waitForLoadState("load");
}

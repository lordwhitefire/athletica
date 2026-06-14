import { test } from "@playwright/test";
import fs from "fs";
import path from "path";

const BREAKPOINTS = [375, 640, 768, 1024, 1280, 1536];
const SCREENSHOT_DIR = path.resolve(process.cwd(), "screenshots");

function shotPath(pageName: string, filename: string) {
    const dir = path.join(SCREENSHOT_DIR, pageName);
    fs.mkdirSync(dir, { recursive: true });
    return path.join(dir, filename);
}

async function freezeCarousels(page: import("@playwright/test").Page) {
    await page.evaluate(() => {
        document.querySelectorAll(
            '[class*="carousel"], [class*="slider"], [class*="swiper"]'
        ).forEach(el => {
            (el as HTMLElement).style.animation = 'none';
            (el as HTMLElement).style.transition = 'none';
        });
    });
}

const ADMIN_EMAIL = process.env.ADMIN_TEST_EMAIL ?? "admin@athletica.com";
const ADMIN_PASSWORD = process.env.ADMIN_TEST_PASSWORD ?? "4603bb34-13ce55de";

const SS_OPTS = { fullPage: true, timeout: 15000 };

test.describe("Visual review screenshots", () => {
    test.describe.configure({ timeout: 180_000 });

    for (const width of BREAKPOINTS) {
        test(`Breakpoint ${width}px`, async ({ page }) => {
            const bp = width;
            const isMobile = bp < 1280;
            await page.setViewportSize({ width: bp, height: 900 });

            // ═══════════════════════════════════════════════════════════
            // EMPTY CART — before any items are added
            // ═══════════════════════════════════════════════════════════
            await page.goto("/cart");
            await page.waitForLoadState("networkidle");
            await page.waitForTimeout(300);
            await page.screenshot({ path: shotPath("cart", `${bp}-empty.png`), ...SS_OPTS });

            // ═══════════════════════════════════════════════════════════
            // HOMEPAGE
            // ═══════════════════════════════════════════════════════════
            await page.goto("/");
            await page.waitForLoadState("networkidle");
            await page.waitForTimeout(500);
            await freezeCarousels(page);
            await page.screenshot({ path: shotPath("homepage", `${bp}-loaded.png`), ...SS_OPTS });

            // Mobile menu open
            if (isMobile) {
                const menuBtn = page.locator('button[aria-label="Open menu"]');
                if (await menuBtn.isVisible()) {
                    await menuBtn.click();
                    await page.waitForTimeout(500);
                    await page.screenshot({ path: shotPath("homepage", `${bp}-menu-open.png`), ...SS_OPTS });
                    // Close via close button
                    const closeBtn = page.locator('button:has-text("✕")').first();
                    if (await closeBtn.isVisible({ timeout: 2000 }).catch(() => false)) {
                        await closeBtn.click();
                        await page.waitForTimeout(500);
                    } else {
                        await page.reload();
                        await page.waitForLoadState("networkidle");
                    }
                }
            }

            // Desktop nav hover
            if (!isMobile) {
                const navLinks = page.locator("nav a[aria-expanded]");
                const count = await navLinks.count();
                if (count > 0) {
                    await navLinks.first().hover();
                    await page.waitForTimeout(600);
                    await page.screenshot({ path: shotPath("homepage", `${bp}-nav-hover.png`), ...SS_OPTS });
                    // Move mouse away to close mega menu
                    await page.mouse.move(0, 0);
                    await page.waitForTimeout(400);
                }
            }

            // Hero carousel — advance to next slide
            const slideDots = page.locator('[aria-label^="Go to slide"]');
            const dotCount = await slideDots.count();
            if (dotCount > 1) {
                await slideDots.nth(dotCount - 1).click({ force: true });
                await page.waitForTimeout(1000);
                await page.screenshot({ path: shotPath("homepage", `${bp}-hero-after-slide.png`), ...SS_OPTS });
            }

            // ═══════════════════════════════════════════════════════════
            // CATEGORY PAGE
            // ═══════════════════════════════════════════════════════════
            await page.goto("/football-boots");
            await page.waitForLoadState("networkidle");
            await page.waitForTimeout(500);
            await page.screenshot({ path: shotPath("category", `${bp}-loaded.png`), ...SS_OPTS });

            // Product card hover
            const cards = page.locator('[data-testid="product-card"]');
            if (await cards.count() > 0) {
                await cards.first().hover();
                await page.waitForTimeout(500);
                await page.screenshot({ path: shotPath("category", `${bp}-card-hover.png`), ...SS_OPTS });
                await page.mouse.move(0, 0);
                await page.waitForTimeout(300);
            }

            // Mobile filter open
            if (isMobile) {
                const filterToggle = page.locator('button:has-text("Filters")').first();
                if (await filterToggle.isVisible()) {
                    await filterToggle.click();
                    await page.waitForTimeout(500);
                    await page.screenshot({ path: shotPath("category", `${bp}-filters-open.png`), ...SS_OPTS });
                    // Close via backdrop
                    const filterBackdrop = page.locator(".fixed.inset-0.bg-black\\/50.z-40");
                    if (await filterBackdrop.isVisible({ timeout: 2000 }).catch(() => false)) {
                        await filterBackdrop.click({ force: true });
                        await page.waitForTimeout(400);
                    }
                }
            }

            // Brand filter applied
            const brandCheckbox = page.getByLabel(/adidas/i).first();
            if (await brandCheckbox.isVisible({ timeout: 3000 }).catch(() => false)) {
                await brandCheckbox.click();
                await page.waitForTimeout(600);
                await page.screenshot({ path: shotPath("category", `${bp}-filter-applied.png`), ...SS_OPTS });
            }

            // Discount badge on category page
            if (await cards.count() > 0) {
                await page.waitForLoadState("networkidle");
                await page.waitForTimeout(500);
                const memberPrice = page.locator('[data-testid="product-card"] div:has(span:text("member"))');
                if (await memberPrice.count() > 0) {
                    const discountedCard = memberPrice.first().locator("..");
                    await discountedCard.scrollIntoViewIfNeeded();
                    await page.waitForTimeout(300);
                    await page.screenshot({ path: shotPath("category", `${bp}-discount-badge.png`), ...SS_OPTS });
                }
            }

            // Empty results
            await page.goto("/football-boots?brand=NonExistentBrand");
            await page.waitForLoadState("networkidle");
            await page.waitForTimeout(400);
            await page.screenshot({ path: shotPath("category", `${bp}-empty-results.png`), ...SS_OPTS });

            // ═══════════════════════════════════════════════════════════
            // PRODUCT DETAIL PAGE
            // Navigate directly to avoid slow card-click navigation loop
            // ═══════════════════════════════════════════════════════════
            await page.goto("/adidas-predator-league-ft-fg-mg-red");
            await page.waitForLoadState("networkidle");
            await page.waitForTimeout(500);
            await page.screenshot({ path: shotPath("product", `${bp}-loaded.png`), ...SS_OPTS });

            const discountEl = page.locator("span:has-text('% OFF')");
            if (await discountEl.isVisible({ timeout: 2000 }).catch(() => false)) {
                await page.screenshot({ path: shotPath("product", `${bp}-discount-member.png`), ...SS_OPTS });
            }

            const sizeOption = page.locator('[data-testid="size-option"]:not([disabled])').first();
            if (await sizeOption.isVisible({ timeout: 5000 }).catch(() => false)) {
                await sizeOption.click();
                await page.waitForTimeout(300);
                await page.screenshot({ path: shotPath("product", `${bp}-size-selected.png`), ...SS_OPTS });
            }

            const addBtn = page.getByRole("button", { name: /add to cart/i });
            if (await addBtn.isVisible({ timeout: 5000 }).catch(() => false)) {
                await addBtn.click();
                await page.waitForTimeout(100);
                await page.screenshot({ path: shotPath("product", `${bp}-submit-disabled.png`), ...SS_OPTS });
                await page.waitForTimeout(700);

                const toast = page.locator('[role="status"][aria-live="polite"]');
                if (await toast.isVisible({ timeout: 2000 }).catch(() => false)) {
                    await page.screenshot({ path: shotPath("product", `${bp}-toast.png`), ...SS_OPTS });
                }

                const cartIcon = page.locator('[data-testid="cart-icon"]').first();
                if (await cartIcon.isVisible()) {
                    await cartIcon.click({ force: true });
                    await page.waitForTimeout(1500);
                    await page.screenshot({ path: shotPath("product", `${bp}-cart-backdrop.png`), ...SS_OPTS });
                    const cartClose = page.locator('[data-testid="mini-cart"] button:has(span:text("close"))').first();
                    if (await cartClose.isVisible({ timeout: 2000 }).catch(() => false)) {
                        await cartClose.click({ force: true });
                        await page.waitForTimeout(400);
                    } else {
                        await page.keyboard.press("Escape");
                        await page.waitForTimeout(400);
                    }
                }
            }

            // ═══════════════════════════════════════════════════════════
            // CART — with items (from the add-to-cart above)
            // ═══════════════════════════════════════════════════════════
            await page.goto("/cart");
            await page.waitForLoadState("networkidle");
            await page.waitForTimeout(500);
            await page.screenshot({ path: shotPath("cart", `${bp}-with-items.png`), ...SS_OPTS });

            // ═══════════════════════════════════════════════════════════
            // AUTH — LOGIN
            // ═══════════════════════════════════════════════════════════
            await page.goto("/login");
            await page.waitForLoadState("networkidle");
            await page.waitForTimeout(300);
            await page.screenshot({ path: shotPath("auth", `${bp}-login.png`), ...SS_OPTS });

            // Login form errors (empty submit)
            await page.getByRole("button", { name: /sign in/i }).click();
            await page.waitForTimeout(600);
            await page.screenshot({ path: shotPath("auth", `${bp}-login-errors.png`), ...SS_OPTS });

            // Password reveal toggle
            const pwField = page.locator("#password");
            if (await pwField.isVisible()) {
                await pwField.fill("visible-password");
                const revealToggle = page.locator("button:has(span:text('visibility'))").first();
                if (await revealToggle.isVisible({ timeout: 2000 }).catch(() => false)) {
                    await revealToggle.click();
                    await page.waitForTimeout(300);
                    await page.screenshot({ path: shotPath("auth", `${bp}-password-reveal.png`), ...SS_OPTS });
                }
            }

            // ═══════════════════════════════════════════════════════════
            // AUTH — REGISTER
            // ═══════════════════════════════════════════════════════════
            await page.goto("/register");
            await page.waitForLoadState("networkidle");
            await page.waitForTimeout(300);
            await page.screenshot({ path: shotPath("auth", `${bp}-register.png`), ...SS_OPTS });

            // Register form errors (empty submit)
            await page.getByRole("button", { name: /create account/i }).click();
            await page.waitForTimeout(600);
            await page.screenshot({ path: shotPath("auth", `${bp}-register-errors.png`), ...SS_OPTS });

            // ═══════════════════════════════════════════════════════════
            // SEARCH
            // ═══════════════════════════════════════════════════════════
            await page.goto("/search");
            await page.waitForLoadState("networkidle");
            await page.waitForTimeout(300);
            await page.screenshot({ path: shotPath("search", `${bp}-loaded.png`), ...SS_OPTS });

            // Search with results
            await page.goto("/search?q=nike");
            await page.waitForLoadState("networkidle");
            await page.waitForTimeout(600);
            await page.screenshot({ path: shotPath("search", `${bp}-with-results.png`), ...SS_OPTS });

            // ═══════════════════════════════════════════════════════════
            // ACCOUNT — requires login
            // ═══════════════════════════════════════════════════════════
            await page.goto("/login");
            await page.waitForLoadState("networkidle");
            const emailInput = page.locator('input[type="email"]');
            if (await emailInput.isVisible()) {
                await emailInput.fill(ADMIN_EMAIL);
                await page.locator("#password").fill(ADMIN_PASSWORD);
                await page.getByRole("button", { name: /sign in/i }).click();

                await page.waitForURL(/\/(account)?$/, { timeout: 20000 });
                await page.waitForLoadState("networkidle");
                await page.waitForTimeout(500);

                await page.goto("/account");
                await page.waitForLoadState("networkidle");
                await page.waitForTimeout(500);
                await page.screenshot({ path: shotPath("account", `${bp}-profile.png`), ...SS_OPTS });
            }

            // ═══════════════════════════════════════════════════════════
            // 404 NOT FOUND
            // ═══════════════════════════════════════════════════════════
            await page.goto("/this-page-does-not-exist");
            await page.waitForLoadState("networkidle");
            await page.waitForTimeout(300);
            await page.screenshot({ path: shotPath("not-found", `${bp}-loaded.png`), ...SS_OPTS });
        });
    }
});

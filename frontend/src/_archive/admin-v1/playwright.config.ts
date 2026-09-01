import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
    testDir: "./e2e",
    fullyParallel: false,
    forbidOnly: !!process.env.CI,
    retries: 1,
    workers: process.env.CI ? 1 : undefined,
    timeout: 60000,
    reporter: [["html", { outputFolder: "playwright-report" }], ["list"]],

    use: {
        baseURL: "http://localhost:3100",
        trace: "on-first-retry",
        screenshot: "only-on-failure",
        video: "retain-on-failure",
        locale: "en-GB",
        timezoneId: "Europe/London",
    },

    projects: [
        {
            name: "chromium",
            use: { ...devices["Desktop Chrome"] },
        },
    ],

    webServer: {
        command: "npm run dev -- -p 3100",
        url: "http://localhost:3100",
        reuseExistingServer: !process.env.CI,
        timeout: 120 * 1000,
    },
});

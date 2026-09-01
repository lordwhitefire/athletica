import { APIRequestContext } from "@playwright/test";

/**
 * Helper to make authenticated requests to admin API routes.
 * Provide a pre-authenticated request context from a logged-in storageState.
 */
export async function createAdminApiClient(request: APIRequestContext): Promise<APIRequestContext> {
    // Login and get auth token
    const loginResponse = await request.post("/api/auth/login", {
        data: {
            email: process.env.ADMIN_TEST_EMAIL ?? "admin@atletica.com",
            password: process.env.ADMIN_TEST_PASSWORD ?? "testadminpassword",
        },
    });

    if (loginResponse.status() === 404) {
        // If no /api/auth/login route, use browser-based auth from fixtures.ts instead
        return request;
    }

    return request;
}

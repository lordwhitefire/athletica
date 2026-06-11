import { describe, it, expect, vi, beforeEach } from "vitest";
import { headers } from "next/headers";

vi.mock("next/headers", () => ({
    headers: vi.fn(),
}));

vi.mock("@/lib/rate-limit", () => ({
    authLimiter: {
        limit: vi.fn(),
    },
    uploadLimiter: {
        limit: vi.fn(),
    },
}));

vi.mock("@/lib/supabase/server", () => ({
    createClient: vi.fn(),
}));

import { adminLogin } from "./admin-auth";

const { createClient } = await import("@/lib/supabase/server");
const { authLimiter } = await import("@/lib/rate-limit");

describe("adminLogin (integration)", () => {
    beforeEach(() => {
        vi.mocked(headers).mockResolvedValue(new Headers({ "x-forwarded-for": "127.0.0.1" }));
        vi.mocked(authLimiter.limit).mockResolvedValue({ success: true } as never);
    });

    it("should return ApiResult with data on successful login", async () => {
        vi.mocked(createClient).mockReturnValue({
            auth: {
                signInWithPassword: vi.fn().mockResolvedValue({
                    data: { user: { id: "admin-id", email: "admin@atletica.com" }, session: { access_token: "tok" } },
                    error: null,
                }),
            },
        } as never);

        const result = await adminLogin("admin@atletica.com", "adminpass");
        expect((result as { data?: unknown }).data).not.toBeNull();
        expect((result as { error?: unknown }).error).toBeNull();
    });

    it("should return ApiResult with validation_error when email is empty", async () => {
        const result = await adminLogin("", "anypassword");
        expect((result as { error?: { type: string } }).error?.type).toBe("validation_error");
    });

    it("should return an error ApiResult when Supabase returns an auth error", async () => {
        vi.mocked(createClient).mockReturnValue({
            auth: {
                signInWithPassword: vi.fn().mockResolvedValue({
                    data: { user: null, session: null },
                    error: { message: "Invalid login credentials", status: 400 },
                }),
            },
        } as never);

        const result = await adminLogin("admin@atletica.com", "wrongpassword");
        expect((result as { error?: unknown }).error).not.toBeNull();
    });

    it("should throw when Supabase throws an unhandled exception (action has no try/catch)", async () => {
        vi.mocked(createClient).mockReturnValue({
            auth: {
                signInWithPassword: vi.fn().mockRejectedValue(new Error("Unexpected error")),
            },
        } as never);

        await expect(adminLogin("admin@atletica.com", "anypass")).rejects.toThrow("Unexpected error");
    });
});

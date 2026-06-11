import { describe, it, expect } from "vitest";
import { loginSchema, registerSchema } from "./auth";

describe("loginSchema", () => {
    it("should pass with valid email and password", () => {
        const result = loginSchema.safeParse({ email: "user@example.com", password: "secret123" });
        expect(result.success).toBe(true);
    });

    it("should fail when email is not a valid email format", () => {
        const result = loginSchema.safeParse({ email: "not-an-email", password: "secret123" });
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0].path).toContain("email");
        }
    });

    it("should fail when email is empty", () => {
        const result = loginSchema.safeParse({ email: "", password: "secret123" });
        expect(result.success).toBe(false);
    });

    it("should fail when password is empty", () => {
        const result = loginSchema.safeParse({ email: "user@example.com", password: "" });
        expect(result.success).toBe(false);
        if (!result.success) {
            expect(result.error.issues[0].path).toContain("password");
        }
    });

    it("should fail when both fields are missing", () => {
        const result = loginSchema.safeParse({});
        expect(result.success).toBe(false);
    });
});

describe("registerSchema", () => {
    const valid = {
        name: "John Doe",
        email: "john@example.com",
        password: "securePass1",
        confirmPassword: "securePass1",
    };

    it("should pass with all valid fields", () => {
        const result = registerSchema.safeParse(valid);
        expect(result.success).toBe(true);
    });

    it("should fail when name is empty", () => {
        const result = registerSchema.safeParse({ ...valid, name: "" });
        expect(result.success).toBe(false);
    });

    it("should fail when password is under 6 characters", () => {
        const result = registerSchema.safeParse({ ...valid, password: "abc", confirmPassword: "abc" });
        expect(result.success).toBe(false);
        if (!result.success) {
            const paths = result.error.issues.map((i) => i.path[0]);
            expect(paths).toContain("password");
        }
    });

    it("should fail when passwords do not match", () => {
        const result = registerSchema.safeParse({ ...valid, confirmPassword: "differentPass" });
        expect(result.success).toBe(false);
        if (!result.success) {
            const paths = result.error.issues.map((i) => i.path[0]);
            expect(paths).toContain("confirmPassword");
        }
    });

    it("should fail when email is invalid", () => {
        const result = registerSchema.safeParse({ ...valid, email: "bad-email" });
        expect(result.success).toBe(false);
    });
});

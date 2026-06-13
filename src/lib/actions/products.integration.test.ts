import { describe, it, expect, vi, beforeEach } from "vitest";
import { adminClient } from "@/lib/admin-sanity";

import { createProduct, deleteProduct } from "./products";

function makeValidFormData(overrides: Record<string, string> = {}): FormData {
    const fd = new FormData();
    fd.append("url_slug", "nike-mercurial-v16");
    fd.append("model", "Mercurial Vapor 16");
    fd.append("name", "Nike Mercurial Vapor 16 Pro FG");
    fd.append("category", "Boots");
    fd.append("brand_ref", "brand-reference-id");
    fd.append("gender", "Men");
    fd.append("color", "Black/Volt");
    fd.append("price_current", "150.00");
    fd.append("price_original", "180.00");
    fd.append("discount_percent", "17");
    fd.append("member_price", "140.00");
    fd.append("currency", "GBP");
    fd.append("id", "prod-mercurial-v16-men-black");

    for (const [key, value] of Object.entries(overrides)) {
        fd.set(key, value);
    }

    return fd;
}

describe("createProduct (integration)", () => {
    beforeEach(() => {
        vi.mocked(adminClient.createOrReplace).mockReset();
    });

    describe("when form data is invalid", () => {
        it("should return ApiResult with error.type=validation_error when slug is missing", async () => {
            const fd = makeValidFormData({ url_slug: "" });
            const result = await createProduct(fd);

            expect((result as { error?: { type: string } }).error?.type).toBe("validation_error");
        });

        it("should return ApiResult with error.type=validation_error when model is missing", async () => {
            const fd = makeValidFormData({ model: "" });
            const result = await createProduct(fd);

            expect((result as { error?: { type: string } }).error?.type).toBe("validation_error");
        });

        it("should return field errors when validation fails", async () => {
            const fd = makeValidFormData({ url_slug: "", model: "" });
            const result = await createProduct(fd);

            const fields = (result as { error?: { fields: { field: string; message: string }[] } }).error?.fields as { field: string; message: string }[];
            expect(Array.isArray(fields)).toBe(true);
            expect(fields.length).toBeGreaterThan(0);
        });

        it("should NOT call the Sanity client when validation fails", async () => {
            const fd = makeValidFormData({ url_slug: "" });
            await createProduct(fd);

            expect(vi.mocked(adminClient.createOrReplace)).not.toHaveBeenCalled();
        });
    });

    describe("when form data is valid", () => {
        beforeEach(() => {
            vi.mocked(adminClient.createOrReplace).mockResolvedValue({ _id: "prod-mercurial-v16-men-black" } as never);
        });

        it("should return ApiResult with data.id when creation succeeds", async () => {
            const fd = makeValidFormData();
            const result = await createProduct(fd);

            expect((result as { data?: { id: string } }).data?.id).toBe("prod-mercurial-v16-men-black");
        });

        it("should return data (not error) on success", async () => {
            const fd = makeValidFormData();
            const result = await createProduct(fd);

            expect((result as { error?: unknown }).error).toBeNull();
        });
    });

    describe("when Sanity throws a network error", () => {
        it("should return ApiResult with an error (not throw)", async () => {
            vi.mocked(adminClient.createOrReplace).mockRejectedValue(new Error("Network error"));

            const fd = makeValidFormData();
            const result = await createProduct(fd);

            expect((result as { error?: unknown }).error).not.toBeNull();
        });

        it("should set error.code to the action-specific failure code", async () => {
            vi.mocked(adminClient.createOrReplace).mockRejectedValue(new Error("Sanity internal error: token expired"));

            const fd = makeValidFormData();
            const result = await createProduct(fd);

            const code = (result as { error?: { code: string } }).error?.code as string;
            expect(code).toBe("product_create_failed");
        });
    });
});

describe("deleteProduct (integration)", () => {
    beforeEach(() => {
        vi.mocked(adminClient.delete).mockReset();
    });

    it("should return ApiResult with data.deleted=true on success", async () => {
        vi.mocked(adminClient.delete).mockResolvedValue({ results: [] } as never);

        const result = await deleteProduct("prod-123");
        expect((result as { data?: { deleted: boolean } }).data?.deleted).toBe(true);
    });

    it("should return an error ApiResult when Sanity throws", async () => {
        vi.mocked(adminClient.delete).mockRejectedValue(new Error("Not found"));

        const result = await deleteProduct("nonexistent-id");
        expect((result as { error?: unknown }).error).not.toBeNull();
    });
});

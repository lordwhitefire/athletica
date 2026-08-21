import { describe, it, expect, vi, beforeEach } from "vitest";

import { createProduct, deleteProduct } from "./products";
import { adminSupabase } from "@/lib/supabase/admin";

vi.mock("@/lib/supabase/admin", () => {
    let productsError: Error | null = null;
    let deleteError: Error | null = null;
    const chain = (overrides: Record<string, unknown> = {}) => {
        const query: Record<string, unknown> = {};
        const resolveWith = (data: unknown, error: unknown = null) => Promise.resolve({ data, error });
        query.select = vi.fn(() => query);
        query.insert = vi.fn(() => query);
        query.upsert = vi.fn(() => ({ error: productsError }));
        query.update = vi.fn(() => query);
        query.delete = vi.fn(() => query);
        query.eq = vi.fn(() => Promise.resolve({ error: deleteError, data: null }));
        query.in = vi.fn(() => Promise.resolve({ error: null, data: null }));
        query.or = vi.fn(() => query);
        query.ilike = vi.fn(() => query);
        query.like = vi.fn(() => query);
        query.order = vi.fn(() => query);
        query.limit = vi.fn(() => query);
        query.single = vi.fn(() => Promise.resolve({ data: null, error: null }));
        query.then = (resolve: (v: unknown) => unknown) => resolve(resolveWith(overrides.data ?? []));
        return query;
    };
    const adminSupabase = {
        from: vi.fn((table: string) => {
            if (table === "products") {
                const q = chain();
                q.upsert = vi.fn(() => ({ error: productsError }));
                q.delete = vi.fn(() => queryWithDelete());
                return q;
            }
            return chain();
        }),
        __setProductsError: (err: Error | null) => {
            productsError = err;
        },
        __setDeleteError: (err: Error | null) => {
            deleteError = err;
        },
    };
    function queryWithDelete() {
        return {
            eq: vi.fn(() => Promise.resolve({ error: deleteError, data: null })),
        };
    }
    return { adminSupabase };
});

vi.mock("@/lib/products/product-service", () => ({
    resolveModelPath: vi.fn().mockResolvedValue(null),
    getProducts: vi.fn(),
    getFacets: vi.fn(),
    resolveBrandFilter: vi.fn(),
    resolveCategoryFilter: vi.fn(),
    getCachedCatalogStats: vi.fn(),
    getCachedCategoryCounts: vi.fn(),
}));

vi.mock("@/lib/validate", () => ({
    validateOrFail: vi.fn((schema: unknown, raw: Record<string, string>) => {
        const invalid: { field: string; message: string }[] = [];
        if (!raw.url_slug) invalid.push({ field: "url_slug", message: "URL slug is required." });
        if (!raw.model) invalid.push({ field: "model", message: "Model is required." });
        if (invalid.length > 0) {
            return {
                error: {
                    data: null,
                    error: {
                        type: "validation_error",
                        code: "validation_failed",
                        message: "Some fields are invalid.",
                        fields: invalid,
                    },
                },
            };
        }
        return { data: raw };
    }),
}));

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
        vi.clearAllMocks();
        (adminSupabase as unknown as { __setProductsError: (err: Error | null) => void }).__setProductsError(null);
        (adminSupabase as unknown as { __setDeleteError: (err: Error | null) => void }).__setDeleteError(null);
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

        it("should NOT touch the database when validation fails", async () => {
            const fd = makeValidFormData({ url_slug: "" });
            await createProduct(fd);

            expect(vi.mocked(adminSupabase.from)).not.toHaveBeenCalled();
        });
    });

    describe("when form data is valid", () => {
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

    describe("when the products table write fails", () => {
        it("should return ApiResult with an error (not throw)", async () => {
            (adminSupabase as unknown as { __setProductsError: (err: Error | null) => void }).__setProductsError(new Error("DB error"));

            const fd = makeValidFormData();
            const result = await createProduct(fd);

            expect((result as { error?: unknown }).error).not.toBeNull();
        });

        it("should set error.code to the action-specific failure code", async () => {
            (adminSupabase as unknown as { __setProductsError: (err: Error | null) => void }).__setProductsError(new Error("DB error"));

            const fd = makeValidFormData();
            const result = await createProduct(fd);

            const code = (result as { error?: { code: string } }).error?.code as string;
            expect(code).toBe("product_create_failed");
        });
    });
});

describe("deleteProduct (integration)", () => {
    beforeEach(() => {
        vi.clearAllMocks();
        (adminSupabase as unknown as { __setDeleteError: (err: Error | null) => void }).__setDeleteError(null);
    });

    it("should return ApiResult with data.deleted=true on success", async () => {
        const result = await deleteProduct("prod-123");
        expect((result as { data?: { deleted: boolean } }).data?.deleted).toBe(true);
    });

    it("should return an error ApiResult when the database throws", async () => {
        (adminSupabase as unknown as { __setDeleteError: (err: Error | null) => void }).__setDeleteError(new Error("Not found"));

        const result = await deleteProduct("nonexistent-id");
        expect((result as { error?: unknown }).error).not.toBeNull();
    });
});
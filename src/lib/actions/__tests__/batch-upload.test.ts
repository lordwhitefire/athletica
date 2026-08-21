import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateId, slugify } from "@/lib/rebuild-nav-urls";
import type { BatchProcessedRow } from "@/lib/schemas/batch-upload";

function chainableQuery(overrides: Record<string, unknown> = {}) {
    let captureInsert: (rows: unknown) => void = () => {};
    const build = (data: unknown = null, count: number | null = null, error: unknown = null) => {
        return Promise.resolve({ data, count, error });
    };
    const table = (name: string) => {
        const state: { data: unknown[]; error: unknown } = { data: [], error: null };
        const query: Record<string, unknown> = {};
        const terminal = () => Promise.resolve({ data: state.data, error: state.error, count: state.data.length });
        query.select = vi.fn(() => query);
        query.insert = vi.fn((rows) => {
            state.data = Array.isArray(rows) ? rows : [rows];
            captureInsert(rows);
            const select = vi.fn(() => ({
                single: vi.fn(() => build(Array.isArray(rows) ? rows[0] : rows)),
            }));
            return { select, error: null };
        });
        query.eq = vi.fn(() => query);
        query.or = vi.fn(() => query);
        query.ilike = vi.fn(() => query);
        query.like = vi.fn(() => query);
        query.limit = vi.fn((n: number) => {
            return {
                then: (resolve: (v: unknown) => unknown) => resolve(build(state.data.slice(0, n))),
            };
        });
        query.order = vi.fn(() => query);
        query.in = vi.fn(() => query);
        query.not = vi.fn(() => query);
        query.gte = vi.fn(() => query);
        query.range = vi.fn(() => query);
        query.filter = vi.fn(() => query);
        query.then = (resolve: (v: unknown) => unknown) => resolve(terminal());
        return query;
    };
    const client: Record<string, unknown> = {};
    client.from = vi.fn((name: string) => {
        const t = table(name);
        if (name === "brands" && overrides.brands) {
            t.then = (resolve: (v: unknown) => unknown) =>
                resolve(Promise.resolve({ data: overrides.brands as unknown[], error: null }));
        }
        if (name === "categories" && overrides.categories) {
            t.then = (resolve: (v: unknown) => unknown) =>
                resolve(Promise.resolve({ data: overrides.categories as unknown[], error: null }));
        }
        return t;
    });
    client.__captureInsert = (fn: (rows: unknown) => void) => {
        captureInsert = fn;
    };
    return client;
}

vi.mock("@/lib/supabase/admin", () => {
    const client = chainableQuery({
        brands: [],
        categories: [],
    });
    return { adminSupabase: client };
});

vi.mock("@/lib/products/product-service", () => ({
    resolveModelPath: vi.fn().mockResolvedValue(null),
}));

vi.mock("@/lib/api-types", () => ({
    ok: (data: unknown) => ({ data, error: null }),
    fail: (type: string, code: string, message: string) => ({ data: null, error: { type, code, message } }),
    fromCaughtError: (err: unknown, code: string) => ({ data: null, error: { type: "api_error", code, message: (err as Error).message } }),
}));

import { adminSupabase } from "@/lib/supabase/admin";
import { batchCreateProducts } from "../batch-upload";

const validRow: BatchProcessedRow = {
    model: "Football Boots/FG/Nike Mercurial",
    brand: "Nike",
    price_current: 179.99,
    price_currency: "EUR",
    category: "Football Boots",
    traction: "FG",
    name: "Mercurial Vapor 16",
    gender: "Unisex",
    color: "White",
    price_original: 229.99,
    price_discount_percent: 22,
    price_member_price: 129.99,
    description_subtitle: "Ultimate Speed",
    description_tagline: "Race past defenders",
    description_intro: "Built for explosive speed.",
    description_collection: "Speed Collection",
    description_key_benefits: ["Speed", "Agility"],
    technical_range: "Elite",
    technical_sole_type: "FG",
    technical_upper_material: "Flyknit",
    technical_adjustment: "Lace-Up",
    sizes: [{ size: "UK 7", stock: 10, available: true }],
    main_image: null,
    thumbnail: null,
    image_gallery: [],
};

describe("batchCreateProducts", () => {
    beforeEach(() => {
        vi.clearAllMocks();
    });

    it("should succeed with zero creations for empty array", async () => {
        const result = await batchCreateProducts([]);
        expect(result.error).toBeNull();
        expect(result.data!.created).toBe(0);
        expect(result.data!.failed).toBe(0);
    });

    it("should return validation error for invalid rows", async () => {
        const result = await batchCreateProducts([{ ...validRow, model: "" }]);
        expect(result.error).not.toBeNull();
    });

    it("should create products successfully", async () => {
        const result = await batchCreateProducts([validRow]);

        expect(result.error).toBeNull();
        expect(result.data!.created).toBe(1);
        expect(result.data!.failed).toBe(0);
        expect(result.data!.results[0].success).toBe(true);
    });

    it("should report failed products", async () => {
        (adminSupabase as unknown as { __captureInsert: (fn: (rows: unknown) => void) => void }).__captureInsert((rows) => {
            throw new Error("Insert failed");
        });

        const result = await batchCreateProducts([validRow]);

        expect(result.data!.created).toBe(0);
        expect(result.data!.failed).toBe(1);
        expect(result.data!.results[0].success).toBe(false);
    });

    it("should include sizes in the created row", async () => {
        let savedRow: Record<string, unknown> = {};
        (adminSupabase as unknown as { __captureInsert: (fn: (rows: unknown) => void) => void }).__captureInsert((rows) => {
            savedRow = (Array.isArray(rows) ? rows[0] : rows) as Record<string, unknown>;
        });

        await batchCreateProducts([validRow]);

        expect(savedRow.sizes).toEqual(["UK 7"]);
        expect((savedRow.attributes as { sizes_detail: unknown[] }).sizes_detail).toHaveLength(1);
    });

    it("should generate slugs from model", () => {
        expect(slugify("Football Boots/FG/Nike Mercurial")).toBe("football-bootsfgnike-mercurial");
    });

    it("should generate 6-character IDs", () => {
        const id = generateId();
        expect(id).toHaveLength(6);
    });
});
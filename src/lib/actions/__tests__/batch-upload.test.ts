import { describe, it, expect, vi, beforeEach } from "vitest";
import { generateId, slugify } from "@/lib/rebuild-nav-urls";
import type { BatchProcessedRow } from "@/lib/schemas/batch-upload";

vi.mock("@/lib/admin-sanity", () => ({
    adminClient: {
        fetch: vi.fn(),
        createOrReplace: vi.fn(),
    },
}));

vi.mock("@/lib/api-types", () => ({
    ok: (data: unknown) => ({ data, error: null }),
    fail: (type: string, code: string, message: string) => ({ data: null, error: { type, code, message } }),
    fromCaughtError: (err: unknown, code: string) => ({ data: null, error: { type: "api_error", code, message: (err as Error).message } }),
}));

import { adminClient } from "@/lib/admin-sanity";
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
        vi.mocked(adminClient.fetch).mockResolvedValue({ _id: "brand-nike" } as never);
        vi.mocked(adminClient.createOrReplace).mockResolvedValue({} as never);

        const result = await batchCreateProducts([validRow]);

        expect(result.error).toBeNull();
        expect(result.data!.created).toBe(1);
        expect(result.data!.failed).toBe(0);
        expect(result.data!.results[0].success).toBe(true);
    });

    it("should report failed products", async () => {
        vi.mocked(adminClient.fetch).mockResolvedValue({ _id: "brand-nike" } as never);
        vi.mocked(adminClient.createOrReplace).mockRejectedValue(new Error("Sanity error"));

        const result = await batchCreateProducts([validRow]);

        expect(result.data!.created).toBe(0);
        expect(result.data!.failed).toBe(1);
        expect(result.data!.results[0].success).toBe(false);
        expect(result.data!.results[0].error).toBe("Sanity error");
    });

    it("should include sizes in the created document", async () => {
        vi.mocked(adminClient.fetch).mockResolvedValue({ _id: "brand-nike" } as never);

        let savedDoc: Record<string, unknown> = {};
        vi.mocked(adminClient.createOrReplace).mockImplementation((doc: unknown) => {
            savedDoc = doc as Record<string, unknown>;
            return Promise.resolve({} as never);
        });

        await batchCreateProducts([validRow]);

        const sizes = savedDoc.sizes as Array<Record<string, unknown>>;
        expect(sizes).toHaveLength(1);
        expect(sizes[0].size).toBe("UK 7");
        expect(sizes[0].stock).toBe(10);
    });

    it("should handle brand not found by storing name as string", async () => {
        vi.mocked(adminClient.fetch).mockResolvedValue(null as never);

        let savedDoc: Record<string, unknown> = {};
        vi.mocked(adminClient.createOrReplace).mockImplementation((doc: unknown) => {
            savedDoc = doc as Record<string, unknown>;
            return Promise.resolve({} as never);
        });

        await batchCreateProducts([validRow]);

        expect(savedDoc.brand).toBe("Nike");
    });

    it("should use brand ref when brand is found", async () => {
        vi.mocked(adminClient.fetch).mockResolvedValue({ _id: "brand-nike-123" } as never);

        let savedDoc: Record<string, unknown> = {};
        vi.mocked(adminClient.createOrReplace).mockImplementation((doc: unknown) => {
            savedDoc = doc as Record<string, unknown>;
            return Promise.resolve({} as never);
        });

        await batchCreateProducts([validRow]);

        expect(savedDoc.brand).toEqual({ _type: "reference", _ref: "brand-nike-123" });
    });

    it("should generate slugs from model", () => {
        expect(slugify("Football Boots/FG/Nike Mercurial")).toBe("football-bootsfgnike-mercurial");
    });

    it("should generate 6-character IDs", () => {
        const id = generateId();
        expect(id).toHaveLength(6);
    });
});

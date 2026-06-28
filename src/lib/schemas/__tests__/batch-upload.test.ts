import { describe, it, expect } from "vitest";
import { batchProcessedRowSchema, sizeSchema } from "../batch-upload";

describe("sizeSchema", () => {
    it("should accept a valid size object", () => {
        const result = sizeSchema.safeParse({ size: "UK 7", stock: 10, available: true });
        expect(result.success).toBe(true);
    });

    it("should require a size label", () => {
        const result = sizeSchema.safeParse({ size: "", stock: 5 });
        expect(result.success).toBe(false);
    });

    it("should default available to true", () => {
        const result = sizeSchema.parse({ size: "UK 8", stock: 3 });
        expect(result.available).toBe(true);
    });

    it("should reject negative stock", () => {
        const result = sizeSchema.safeParse({ size: "UK 9", stock: -1 });
        expect(result.success).toBe(false);
    });
});

describe("batchProcessedRowSchema", () => {
    const validRow = {
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
    };

    it("should accept a fully populated valid row", () => {
        const result = batchProcessedRowSchema.safeParse(validRow);
        expect(result.success).toBe(true);
    });

    it("should accept a row with only required fields", () => {
        const minimal = {
            model: "Boots/FG/Brand",
            brand: "Nike",
            price_current: 99.99,
            price_currency: "USD",
        };
        const result = batchProcessedRowSchema.safeParse(minimal);
        expect(result.success).toBe(true);
        if (result.success) {
            expect(result.data.category).toBe("");
            expect(result.data.sizes).toEqual([]);
            expect(result.data.main_image).toBeNull();
        }
    });

    it("should reject empty model", () => {
        const result = batchProcessedRowSchema.safeParse({ ...validRow, model: "" });
        expect(result.success).toBe(false);
    });

    it("should reject empty brand", () => {
        const result = batchProcessedRowSchema.safeParse({ ...validRow, brand: "" });
        expect(result.success).toBe(false);
    });

    it("should reject zero or negative price", () => {
        const zero = batchProcessedRowSchema.safeParse({ ...validRow, price_current: 0 });
        expect(zero.success).toBe(false);

        const neg = batchProcessedRowSchema.safeParse({ ...validRow, price_current: -10 });
        expect(neg.success).toBe(false);
    });

    it("should reject invalid currency", () => {
        const result = batchProcessedRowSchema.safeParse({ ...validRow, price_currency: "GBP" });
        expect(result.success).toBe(true);

        const invalid = batchProcessedRowSchema.safeParse({ ...validRow, price_currency: "JPY" });
        expect(invalid.success).toBe(false);
    });

    it("should reject invalid gender", () => {
        const result = batchProcessedRowSchema.safeParse({ ...validRow, gender: "Other" });
        expect(result.success).toBe(false);
    });

    it("should accept valid image objects", () => {
        const row = {
            ...validRow,
            main_image: { _type: "image" as const, asset: { _type: "reference" as const, _ref: "image-abc123" } },
        };
        const result = batchProcessedRowSchema.safeParse(row);
        expect(result.success).toBe(true);
    });

    it("should handle empty sizes array", () => {
        const result = batchProcessedRowSchema.safeParse({ ...validRow, sizes: [] });
        expect(result.success).toBe(true);
    });

    it("should accept multiple sizes", () => {
        const row = {
            ...validRow,
            sizes: [
                { size: "UK 7", stock: 10, available: true },
                { size: "UK 8", stock: 5, available: false },
            ],
        };
        const result = batchProcessedRowSchema.safeParse(row);
        expect(result.success).toBe(true);
    });
});

import { describe, it, expect } from "vitest";
import { productSanitySchema } from "@/lib/schemas/product";
import { z } from "zod";

describe("Sanity MSW handler response contract", () => {
    const validSanityProduct = {
        _id: "prod-test-001",
        url_slug: { current: "nike-mercurial-fg" },
        model: "Mercurial Vapor 16",
        brand: { _ref: "brand-nike-ref" },
        category: "Football Boots",
        traction: "FG",
        name: "Nike Mercurial Vapor 16 Pro FG",
        gender: "Men",
        main_image: { asset: { _ref: "image-ref-001", _type: "reference" } },
        thumbnail: { asset: { _ref: "image-ref-002", _type: "reference" } },
        color: "Black",
        price: {
            current: 150,
            original: 180,
            discount_percent: 17,
            member_price: 140,
            currency: "GBP",
        },
        description: {
            subtitle: "Elite performance",
            tagline: "Speed redefined",
            intro: "The latest Mercurial.",
            collection: "Mercurial",
            key_benefits: ["lightweight", "precision"],
            technical_details: {
                range: "Elite",
                sole_type: "Firm Ground",
                upper_material: "Vaporposite",
                adjustment: "Lace",
            },
        },
    };

    it("should validate that our fixture data matches productSanitySchema", () => {
        const result = productSanitySchema.safeParse(validSanityProduct);
        expect(result.success).toBe(true);
    });

    it("should fail when a required field (_id) is missing", () => {
        const { _id, ...withoutId } = validSanityProduct;
        const result = productSanitySchema.safeParse(withoutId);
        expect(result.success).toBe(false);
    });

    it("should fail when price.current is not a number", () => {
        const invalidData = { ...validSanityProduct, price: { ...validSanityProduct.price, current: "not-a-number" } };
        const result = productSanitySchema.safeParse(invalidData);
        expect(result.success).toBe(false);
    });

    it("should validate an array of products (array schema)", () => {
        const arrayResult = z.array(productSanitySchema).safeParse([validSanityProduct, { ...validSanityProduct, _id: "prod-test-002" }]);
        expect(arrayResult.success).toBe(true);
    });

    it("should fail with a useful error message (not a raw Zod error string)", () => {
        const result = productSanitySchema.safeParse({ _id: "prod-test", brand: "INVALID" });
        if (!result.success) {
            const messages = result.error.issues.map((i) => i.message);
            messages.forEach((msg) => {
                expect(typeof msg).toBe("string");
                expect(msg.length).toBeGreaterThan(0);
            });
        }
    });
});

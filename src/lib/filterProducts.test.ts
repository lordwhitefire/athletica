import { describe, it, expect } from "vitest";
import { filterProducts } from "./filterProducts";
import type { Product, ActiveFilters } from "@/types/product";

function makeProduct(overrides: Partial<Product>): Product {
    return {
        id: overrides.id ?? "test-id",
        url_slug: overrides.url_slug ?? "test-slug",
        model: overrides.model ?? "TestModel",
        name: overrides.name ?? "Test Product",
        category: overrides.category ?? "Football Boots",
        brand: overrides.brand ?? "Nike",
        traction: overrides.traction ?? null,
        gender: overrides.gender ?? "Men",
        color: overrides.color ?? "Black",
        main_image: overrides.main_image ?? "",
        image_gallery: overrides.image_gallery ?? [],
        thumbnail: overrides.thumbnail ?? "",
        sizes: overrides.sizes ?? [
            { size: "UK 9", available: true, stock: 5 },
            { size: "UK 10", available: false, stock: 0 },
        ],
        price: overrides.price ?? {
            current: 100,
            original: 120,
            discount_percent: 17,
            member_price: 95,
            currency: "GBP",
        },
        description: overrides.description ?? {
            subtitle: "",
            tagline: "",
            intro: "",
            collection: "",
            key_benefits: [],
            technical_details: {
                range: "",
                sole_type: "",
                upper_material: "",
                adjustment: "",
            },
        },
    };
}

const nikeProduct = makeProduct({ id: "1", brand: "Nike", category: "Football Boots", traction: "FG", color: "Red", gender: "Men", price: { current: 80, original: 100, discount_percent: 20, member_price: 75, currency: "GBP" }, sizes: [{ size: "UK 9", available: true, stock: 5 }] });
const adidasProduct = makeProduct({ id: "2", brand: "Adidas", category: "Football Boots", traction: "AG", color: "Blue", gender: "Women", price: { current: 60, original: 80, discount_percent: 25, member_price: 55, currency: "GBP" }, sizes: [{ size: "UK 7", available: true, stock: 3 }] });
const pumaProduct = makeProduct({ id: "3", brand: "Puma", category: "Training Shoes", traction: "TF", color: "White", gender: "Kids", price: { current: 40, original: 50, discount_percent: 20, member_price: 38, currency: "GBP" }, sizes: [{ size: "UK 4", available: false, stock: 0 }] });

const allProducts = [nikeProduct, adidasProduct, pumaProduct];

describe("filterProducts", () => {
    describe("when no filters are applied", () => {
        it("should return all products unchanged", () => {
            const result = filterProducts(allProducts, {});
            expect(result).toHaveLength(3);
        });

        it("should return a new array, not mutate the input", () => {
            const result = filterProducts(allProducts, {});
            expect(result).not.toBe(allProducts);
        });
    });

    describe("brand filter", () => {
        it("should return only Nike products when brand=['Nike']", () => {
            const result = filterProducts(allProducts, { brand: ["Nike"] });
            expect(result).toHaveLength(1);
            expect(result[0].brand).toBe("Nike");
        });

        it("should be case-insensitive", () => {
            const result = filterProducts(allProducts, { brand: ["nike"] });
            expect(result).toHaveLength(1);
        });

        it("should return products matching any brand when multiple brands given", () => {
            const result = filterProducts(allProducts, { brand: ["Nike", "Adidas"] });
            expect(result).toHaveLength(2);
        });

        it("should return empty array when no products match the brand", () => {
            const result = filterProducts(allProducts, { brand: ["Mizuno"] });
            expect(result).toHaveLength(0);
        });

        it("should return all products when brand array is empty", () => {
            const result = filterProducts(allProducts, { brand: [] });
            expect(result).toHaveLength(3);
        });
    });

    describe("category filter", () => {
        it("should return only Football Boots when category=['Football Boots']", () => {
            const result = filterProducts(allProducts, { category: ["Football Boots"] });
            expect(result).toHaveLength(2);
            result.forEach((p) => expect(p.category).toBe("Football Boots"));
        });

        it("should return Training Shoes products only", () => {
            const result = filterProducts(allProducts, { category: ["Training Shoes"] });
            expect(result).toHaveLength(1);
            expect(result[0].brand).toBe("Puma");
        });

        it("should be case-insensitive", () => {
            const result = filterProducts(allProducts, { category: ["football boots"] });
            expect(result).toHaveLength(2);
        });
    });

    describe("traction filter", () => {
        it("should return only FG products", () => {
            const result = filterProducts(allProducts, { traction: ["FG"] });
            expect(result).toHaveLength(1);
            expect(result[0].traction).toBe("FG");
        });

        it("should return AG products", () => {
            const result = filterProducts(allProducts, { traction: ["AG"] });
            expect(result).toHaveLength(1);
            expect(result[0].brand).toBe("Adidas");
        });

        it("should exclude products with null traction", () => {
            const noTraction = makeProduct({ id: "99", traction: null });
            const result = filterProducts([noTraction, nikeProduct], { traction: ["FG"] });
            expect(result).toHaveLength(1);
            expect(result[0].traction).toBe("FG");
        });
    });

    describe("color filter", () => {
        it("should return only Red products", () => {
            const result = filterProducts(allProducts, { color: ["Red"] });
            expect(result).toHaveLength(1);
            expect(result[0].brand).toBe("Nike");
        });

        it("should be case-insensitive", () => {
            const result = filterProducts(allProducts, { color: ["red"] });
            expect(result).toHaveLength(1);
        });
    });

    describe("gender filter", () => {
        it("should return only Men products", () => {
            const result = filterProducts(allProducts, { gender: ["Men"] });
            expect(result).toHaveLength(1);
            expect(result[0].brand).toBe("Nike");
        });

        it("should return only Women products", () => {
            const result = filterProducts(allProducts, { gender: ["Women"] });
            expect(result).toHaveLength(1);
            expect(result[0].brand).toBe("Adidas");
        });
    });

    describe("size filter", () => {
        it("should return products with the given size available", () => {
            const result = filterProducts(allProducts, { size: ["UK 9"] });
            expect(result).toHaveLength(1);
            expect(result[0].brand).toBe("Nike");
        });

        it("should NOT return products where the size exists but is unavailable", () => {
            const result = filterProducts(allProducts, { size: ["UK 4"] });
            expect(result).toHaveLength(0);
        });
    });

    describe("price filter", () => {
        it("should return products at or above min_price", () => {
            const result = filterProducts(allProducts, { min_price: 70 });
            expect(result).toHaveLength(1);
            expect(result[0].brand).toBe("Nike");
        });

        it("should return products at or below max_price", () => {
            const result = filterProducts(allProducts, { max_price: 50 });
            expect(result).toHaveLength(1);
            expect(result[0].brand).toBe("Puma");
        });

        it("should apply both min and max price together", () => {
            const result = filterProducts(allProducts, { min_price: 50, max_price: 70 });
            expect(result).toHaveLength(1);
            expect(result[0].brand).toBe("Adidas");
        });

        it("should return empty array when price range excludes all products", () => {
            const result = filterProducts(allProducts, { min_price: 500 });
            expect(result).toHaveLength(0);
        });
    });

    describe("combined filters", () => {
        it("should apply brand AND traction together (intersection)", () => {
            const result = filterProducts(allProducts, { brand: ["Nike"], traction: ["FG"] });
            expect(result).toHaveLength(1);
            expect(result[0].brand).toBe("Nike");
        });

        it("should return empty when filters produce no intersection", () => {
            const result = filterProducts(allProducts, { brand: ["Nike"], traction: ["AG"] });
            expect(result).toHaveLength(0);
        });

        it("should apply category AND gender together", () => {
            const result = filterProducts(allProducts, { category: ["Football Boots"], gender: ["Women"] });
            expect(result).toHaveLength(1);
            expect(result[0].brand).toBe("Adidas");
        });
    });

    describe("sorting", () => {
        it("should sort by price_asc — cheapest product is first", () => {
            const result = filterProducts(allProducts, { sort: "price_asc" });
            expect(result[0].price.current).toBe(40);
            expect(result[2].price.current).toBe(80);
        });

        it("should sort by price_desc — most expensive product is first", () => {
            const result = filterProducts(allProducts, { sort: "price_desc" });
            expect(result[0].price.current).toBe(80);
            expect(result[2].price.current).toBe(40);
        });

        it("should sort by biggest_discount — highest discount_percent is first", () => {
            const result = filterProducts(allProducts, { sort: "biggest_discount" });
            expect(result[0].price.discount_percent).toBe(25);
        });

        it("should keep original order for newest sort", () => {
            const result = filterProducts(allProducts, { sort: "newest" });
            expect(result[0].id).toBe("1");
            expect(result[1].id).toBe("2");
            expect(result[2].id).toBe("3");
        });

        it("should apply sort after all filters", () => {
            const result = filterProducts(allProducts, { category: ["Football Boots"], sort: "price_asc" });
            expect(result).toHaveLength(2);
            expect(result[0].price.current).toBeLessThanOrEqual(result[1].price.current);
        });
    });

    describe("edge cases", () => {
        it("should return empty array when given empty products array", () => {
            const result = filterProducts([], { brand: ["Nike"] });
            expect(result).toHaveLength(0);
        });

        it("should not throw when filters object is empty", () => {
            expect(() => filterProducts(allProducts, {})).not.toThrow();
        });

        it("should not throw when products array is empty and filters has values", () => {
            expect(() => filterProducts([], { brand: ["Nike"], traction: ["FG"] })).not.toThrow();
        });
    });
});

import { describe, it, expect } from "vitest";
import { resolveRoute } from "./resolveRoute";
import type { Product } from "@/types/product";
import type { NavigationData, NavItem } from "@/types/navigation";

function makeProduct(slug: string, overrides: Partial<Product> = {}): Product {
    return {
        id: slug,
        url_slug: slug,
        model: "Model",
        name: "Product",
        category: "Football Boots",
        brand: "Nike",
        traction: "FG",
        gender: "Men",
        color: "Black",
        main_image: "",
        image_gallery: [],
        thumbnail: "",
        sizes: [],
        price: { current: 100, original: 120, discount_percent: 17, member_price: 95, currency: "GBP" },
        description: {
            subtitle: "",
            tagline: "",
            intro: "",
            collection: "",
            key_benefits: [],
            technical_details: { range: "", sole_type: "", upper_material: "", adjustment: "" },
        },
        ...overrides,
    };
}

function makeNavItem(id: string, overrides: Partial<NavItem>): NavItem {
    return {
        id,
        label: "Node",
        level: 1,
        href: null,
        ...overrides,
    };
}

function makeNavData(label: string, children: NavItem[]): NavigationData[] {
    return [{
        id: "nav-1",
        level: 1,
        slug: "nav",
        label,
        href: "/nav",
        children,
    }];
}

describe("resolveRoute", () => {
    describe("when slug matches a product url_slug", () => {
        it("should return type='product' with the matched product", () => {
            const products = [makeProduct("football/nike-mercurial-fg")];
            const result = resolveRoute(["football", "nike-mercurial-fg"], products, []);
            expect(result.type).toBe("product");
            if (result.type === "product") {
                expect(result.product.url_slug).toBe("football/nike-mercurial-fg");
            }
        });

        it("should strip leading slash from slug before matching", () => {
            const products = [makeProduct("football/nike")];
            const result = resolveRoute(["/football", "nike"], products, []);
            expect(result.type).toBe("product");
        });
    });

    describe("when slug matches a navigation href", () => {
        it("should return type='category' with derived filters", () => {
            const nav = makeNavData("Footwear", [
                makeNavItem("n1", { label: "Football Boots", href: "/football-boots", level: 1, children: [] }),
            ]);
            const result = resolveRoute(["football-boots"], [], nav);
            expect(result.type).toBe("category");
        });

        it("should set category filter from the L1 nav node label", () => {
            const nav = makeNavData("Footwear", [
                makeNavItem("n1", { label: "Football Boots", href: "/football-boots", level: 1, children: [] }),
            ]);
            const result = resolveRoute(["football-boots"], [], nav);
            if (result.type === "category") {
                expect(result.filters.category).toContain("Football Boots");
            }
        });

        it("should set brand filter from L2 nav node label", () => {
            const nav = makeNavData("Footwear", [
                makeNavItem("n1", {
                    id: "n1", label: "Football Boots", href: "/football-boots", level: 1,
                    children: [
                        makeNavItem("n2", { label: "Nike", href: "/football-boots/nike", level: 2, children: [] }),
                    ],
                }),
            ]);
            const result = resolveRoute(["football-boots", "nike"], [], nav);
            if (result.type === "category") {
                expect(result.filters.brand).toContain("Nike");
            }
        });

        it("should include the nav node label as pageTitle", () => {
            const nav = makeNavData("Footwear", [
                makeNavItem("n1", { label: "Football Boots", href: "/football-boots", level: 1, children: [] }),
            ]);
            const result = resolveRoute(["football-boots"], [], nav);
            if (result.type === "category") {
                expect(result.pageTitle).toBe("Football Boots");
            }
        });
    });

    describe("traction node detection", () => {
        it("should set traction filter when slug resolves to an FG node", () => {
            const nav = makeNavData("Footwear", [
                makeNavItem("n1", {
                    id: "n1", label: "Football Boots", href: "/football-boots", level: 1,
                    children: [
                        makeNavItem("n2", {
                            id: "n2", label: "Nike", href: "/football-boots/nike", level: 2,
                            children: [
                                makeNavItem("n3", { label: "FG", href: "/football-boots/nike/fg", level: 3, children: [] }),
                            ],
                        }),
                    ],
                }),
            ]);
            const result = resolveRoute(["football-boots", "nike", "fg"], [], nav);
            if (result.type === "category") {
                expect(result.filters.traction).toContain("FG");
            }
        });
    });

    describe("when slug does not match any product or navigation node", () => {
        it("should return type='not_found'", () => {
            const result = resolveRoute(["this-does-not-exist"], [], []);
            expect(result.type).toBe("not_found");
        });

        it("should prefer product match over navigation match if both exist", () => {
            const products = [makeProduct("football-boots")];
            const nav = makeNavData("Footwear", [
                makeNavItem("n1", { label: "Football Boots", href: "/football-boots", level: 1, children: [] }),
            ]);
            const result = resolveRoute(["football-boots"], products, nav);
            expect(result.type).toBe("product");
        });

        it("should not throw when given empty products and empty navigation", () => {
            expect(() => resolveRoute(["any", "slug"], [], [])).not.toThrow();
        });

        it("should not throw when given empty slug array", () => {
            expect(() => resolveRoute([], [], [])).not.toThrow();
        });
    });
});

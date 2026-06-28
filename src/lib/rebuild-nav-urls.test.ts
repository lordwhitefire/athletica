import { describe, it, expect } from "vitest";
import { slugify, generateId, rebuildNavUrls, hasCorrectUrls } from "./rebuild-nav-urls";
import type { NavItem } from "@/types/navigation";

describe("slugify", () => {
    it("should lowercase and replace spaces with hyphens", () => {
        expect(slugify("Hello World")).toBe("hello-world");
    });

    it("should strip non-alphanumeric chars except hyphens", () => {
        expect(slugify("Football Boots! @#$%")).toBe("football-boots-");
    });

    it("should handle multiple spaces", () => {
        expect(slugify("a   b")).toBe("a-b");
    });

    it("should return empty string for empty input", () => {
        expect(slugify("")).toBe("");
    });
});

describe("generateId", () => {
    it("should return a 6-character string", () => {
        const id = generateId();
        expect(id).toHaveLength(6);
    });

    it("should contain only alphanumeric chars", () => {
        const id = generateId();
        expect(id).toMatch(/^[a-z0-9]+$/);
    });

    it("should generate unique values", () => {
        const ids = new Set(Array.from({ length: 100 }, () => generateId()));
        expect(ids.size).toBe(100);
    });
});

describe("rebuildNavUrls", () => {
    it("should set href for a flat list of items", () => {
        const items: NavItem[] = [
            { id: "1", level: 1, label: "Boots", href: null },
            { id: "2", level: 1, label: "Accessories", href: null },
        ];

        const result = rebuildNavUrls(items);

        expect(result[0].href).toBe("/en/1");
        expect(result[1].href).toBe("/en/2");
    });

    it("should build hierarchical URLs for nested children", () => {
        const items: NavItem[] = [
            {
                id: "1", level: 1, label: "Boots", href: null,
                children: [
                    { id: "2", level: 2, label: "Adidas", href: null },
                ],
            },
        ];

        const result = rebuildNavUrls(items);

        expect(result[0].href).toBe("/en/1");
        expect(result[0].children![0].href).toBe("/en/1/2");
    });

    it("should handle deep nesting (L1 → L2 → L3 → L4)", () => {
        const items: NavItem[] = [
            {
                id: "1", level: 1, label: "Boots", href: null,
                children: [
                    {
                        id: "2", level: 2, label: "Adidas", href: null,
                        children: [
                            {
                                id: "3", level: 3, label: "Predator", href: null,
                                children: [
                                    { id: "4", level: 4, label: "Elite", href: null },
                                ],
                            },
                        ],
                    },
                ],
            },
        ];

        const result = rebuildNavUrls(items);
        expect(result[0].href).toBe("/en/1");
        expect(result[0].children![0].href).toBe("/en/1/2");
        expect(result[0].children![0].children![0].href).toBe("/en/1/2/3");
        expect(result[0].children![0].children![0].children![0].href).toBe("/en/1/2/3/4");
    });

    it("should preserve existing id and generate missing ones", () => {
        const items: NavItem[] = [
            { id: "existing-1", level: 1, label: "Boots", href: null },
            { level: 2, label: "Adidas", href: null } as NavItem,
        ];

        const result = rebuildNavUrls(items);

        expect(result[0].id).toBe("existing-1");
        expect(result[1].id).toBeDefined();
        expect(result[1].id).toHaveLength(6);
    });

    it("should use item.id for URL segments (not label slug)", () => {
        const items: NavItem[] = [
            { id: "custom-id", level: 1, label: "Boots", href: null },
        ];

        const result = rebuildNavUrls(items);

        expect(result[0].href).toBe("/en/custom-id");
    });

    it("should preserve other fields on items", () => {
        const items: NavItem[] = [
            {
                id: "1", level: 1, label: "Boots", href: null,
                description: "All football boots",
                disabled: false,
                customLinks: [{ label: "Sale", href: "/sale" }],
            },
        ];

        const result = rebuildNavUrls(items);

        expect(result[0].description).toBe("All football boots");
        expect(result[0].disabled).toBe(false);
        expect(result[0].customLinks).toHaveLength(1);
        expect(result[0].customLinks![0].label).toBe("Sale");
    });

    it("should handle empty items array", () => {
        const result = rebuildNavUrls([]);
        expect(result).toEqual([]);
    });

    it("should use id when label is empty", () => {
        const items: NavItem[] = [
            { id: "abc", level: 1, label: "", href: null },
        ];

        const result = rebuildNavUrls(items);
        expect(result[0].href).toBe("/en/abc");
    });

    it("should not mutate original items", () => {
        const items: NavItem[] = [
            { id: "1", level: 1, label: "Boots", href: null },
        ];
        const originalHref = items[0].href;

        rebuildNavUrls(items);

        expect(items[0].href).toBe(originalHref);
    });
});

describe("hasCorrectUrls", () => {
    it("should return true when all URLs match", () => {
        const items: NavItem[] = [
            { id: "abc", level: 1, label: "Boots", href: "/en/abc" },
        ];

        expect(hasCorrectUrls(items)).toBe(true);
    });

    it("should return false when a URL does not match", () => {
        const items: NavItem[] = [
            { id: "abc", level: 1, label: "Boots", href: "/en/wrong" },
        ];

        expect(hasCorrectUrls(items)).toBe(false);
    });

    it("should check nested children recursively", () => {
        const items: NavItem[] = [
            {
                id: "a", level: 1, label: "Boots", href: "/en/a",
                children: [
                    { id: "b", level: 2, label: "Adidas", href: "/en/a/b" },
                ],
            },
        ];

        expect(hasCorrectUrls(items)).toBe(true);

        const wrongItems: NavItem[] = [
            {
                id: "a", level: 1, label: "Boots", href: "/en/a",
                children: [
                    { id: "b", level: 2, label: "Adidas", href: "/en/a/wrong" },
                ],
            },
        ];

        expect(hasCorrectUrls(wrongItems)).toBe(false);
    });

    it("should return true for empty array", () => {
        expect(hasCorrectUrls([])).toBe(true);
    });
});

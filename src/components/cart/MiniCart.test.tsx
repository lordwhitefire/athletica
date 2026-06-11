import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { axe } from "jest-axe";
import { screen } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test-utils/renderWithProviders";
import MiniCart from "./MiniCart";
import type { CartItem } from "@/types/cart";

const mockRemoveFromCart = vi.fn();
const mockUpdateQuantity = vi.fn();
const mockClearCart = vi.fn();
const mockOnClose = vi.fn();

let mockItems: CartItem[] = [];

vi.mock("@/context/CartContext", () => ({
    CartProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useCart: () => ({
        cart: {
            items: mockItems,
            totalItems: mockItems.reduce((sum, i) => sum + i.quantity, 0),
            totalPrice: mockItems.reduce((sum, i) => sum + i.product.price.current * i.quantity, 0),
        },
        addToCart: vi.fn(),
        removeFromCart: mockRemoveFromCart,
        updateQuantity: mockUpdateQuantity,
        clearCart: mockClearCart,
        isInCart: vi.fn(),
    }),
}));

function makeCartItem(overrides: Partial<CartItem> = {}): CartItem {
    return {
        product: {
            id: "prod-1",
            url_slug: "nike-mercurial",
            model: "Mercurial",
            name: "Nike Mercurial Vapor 16 FG",
            category: "Football Boots",
            brand: "Nike",
            traction: "FG",
            gender: "Men",
            color: "Black",
            main_image: "",
            image_gallery: [],
            thumbnail: "",
            sizes: [],
            price: { current: 150, original: 180, discount_percent: 17, member_price: 140, currency: "GBP" },
            description: {
                subtitle: "",
                tagline: "",
                intro: "",
                collection: "",
                key_benefits: [],
                technical_details: { range: "", sole_type: "", upper_material: "", adjustment: "" },
            },
        },
        selectedSize: "UK 9",
        quantity: 1,
        addedAt: new Date().toISOString(),
        ...overrides,
    };
}

describe("MiniCart", () => {
    beforeEach(() => {
        mockItems = [];
        mockRemoveFromCart.mockReset();
        mockUpdateQuantity.mockReset();
        mockClearCart.mockReset();
    });

    describe("empty cart state", () => {
        it("should display an empty cart message when there are no items", async () => {
            const { container } = renderWithProviders(<MiniCart isOpen={true} onClose={mockOnClose} />);
            expect(screen.getByText(/your cart is empty/i)).toBeInTheDocument();
            await expect(axe(container)).resolves.toHaveNoViolations();
        });

        it("should display a Continue Shopping button when cart is empty", async () => {
            const { container } = renderWithProviders(<MiniCart isOpen={true} onClose={mockOnClose} />);
            expect(screen.getByRole("button", { name: /continue shopping/i })).toBeInTheDocument();
            await expect(axe(container)).resolves.toHaveNoViolations();
        });
    });

    describe("with items in the cart", () => {
        it("should display the product name of each cart item", async () => {
            mockItems = [
                makeCartItem({ product: { ...makeCartItem().product, id: "1", model: "Mercurial", name: "Nike Mercurial Vapor 16 FG" } }),
                makeCartItem({ product: { ...makeCartItem().product, id: "2", model: "Predator 24 AG", name: "Adidas Predator 24 AG" } }),
            ];
            const { container } = renderWithProviders(<MiniCart isOpen={true} onClose={mockOnClose} />);
            expect(screen.getByText("Mercurial")).toBeInTheDocument();
            expect(screen.getByText("Predator 24 AG")).toBeInTheDocument();
            await expect(axe(container)).resolves.toHaveNoViolations();
        });

        it("should display the quantity for each item", async () => {
            mockItems = [makeCartItem({ quantity: 3 })];
            const { container } = renderWithProviders(<MiniCart isOpen={true} onClose={mockOnClose} />);
            expect(screen.getByText("3")).toBeInTheDocument();
            await expect(axe(container)).resolves.toHaveNoViolations();
        });

        it("should display the price for each item", async () => {
            mockItems = [makeCartItem()];
            const { container } = renderWithProviders(<MiniCart isOpen={true} onClose={mockOnClose} />);
            expect(screen.getAllByText(/150\.00/).length).toBeGreaterThanOrEqual(1);
            await expect(axe(container)).resolves.toHaveNoViolations();
        });
    });

    describe("remove item", () => {
        it("should call removeFromCart() with the correct product id and size when remove is clicked", async () => {
            const item = makeCartItem();
            mockItems = [item];
            const { container } = renderWithProviders(<MiniCart isOpen={true} onClose={mockOnClose} />);
            const user = userEvent.setup();

            const removeButton = screen.getByText("Remove");
            await user.click(removeButton);

            expect(mockRemoveFromCart).toHaveBeenCalledWith("prod-1", "UK 9");
            await expect(axe(container)).resolves.toHaveNoViolations();
        });
    });

    describe("view cart link", () => {
        it("should render a link to the cart page when items exist", async () => {
            mockItems = [makeCartItem()];
            const { container } = renderWithProviders(<MiniCart isOpen={true} onClose={mockOnClose} />);
            const cartLink = screen.getByRole("link", { name: /view cart/i });
            expect(cartLink).toHaveAttribute("href", "/cart");
            await expect(axe(container)).resolves.toHaveNoViolations();
        });
    });
});

import React from "react";
import { describe, it, expect, vi } from "vitest";
import { axe } from "jest-axe";
import { screen } from "@testing-library/react";
import { renderWithProviders } from "@/test-utils/renderWithProviders";
import { ToastContainer } from "./ToastContainer";

const mockToasts = [
    { id: "t1", message: "Product added to cart", type: "success" as const },
];

vi.mock("@/store/toast", () => ({
    useToastStore: (selector: (state: any) => any) => selector({
        toasts: mockToasts,
        addToast: vi.fn(),
        removeToast: vi.fn(),
    }),
}));

describe("ToastContainer", () => {
    it("should render a toast message from context", async () => {
        const { container } = renderWithProviders(<ToastContainer />);
        expect(screen.getByText("Product added to cart")).toBeInTheDocument();
        await expect(axe(container)).resolves.toHaveNoViolations();
    });

    it("should have role='status' for accessibility", async () => {
        const { container } = renderWithProviders(<ToastContainer />);
        expect(screen.getByRole("status")).toBeInTheDocument();
        await expect(axe(container)).resolves.toHaveNoViolations();
    });

    it("should render a close button for each toast", async () => {
        const { container } = renderWithProviders(<ToastContainer />);
        expect(screen.getByRole("button")).toBeInTheDocument();
        await expect(axe(container)).resolves.toHaveNoViolations();
    });
});

import { describe, it, expect } from "vitest";
import { axe } from "jest-axe";
import { render, screen } from "@testing-library/react";
import { Input } from "./Input";

describe("Input component visual states", () => {
    const defaultRegistration = {
        name: "test",
        onChange: async () => {},
        onBlur: async () => {},
        ref: () => {},
    };

    it("should render with label and input", async () => {
        const { container } = render(<Input label="Email" registration={defaultRegistration} />);
        expect(screen.getByLabelText("Email")).toBeInTheDocument();
        expect(container.querySelector("input")).toHaveAttribute("aria-invalid", "false");
        await expect(axe(container)).resolves.toHaveNoViolations();
    });

    it("should render error state with error message", async () => {
        const { container } = render(<Input label="Email" error="Required" registration={defaultRegistration} />);
        expect(screen.getByText("Required")).toBeInTheDocument();
        expect(screen.getByRole("alert")).toHaveTextContent("Required");
        expect(container.querySelector("input")).toHaveAttribute("aria-invalid", "true");
        await expect(axe(container)).resolves.toHaveNoViolations();
    });

    it("should render disabled state", async () => {
        const { container } = render(<Input label="Email" registration={defaultRegistration} disabled />);
        const input = screen.getByLabelText("Email") as HTMLInputElement;
        expect(input.disabled).toBe(true);
        await expect(axe(container)).resolves.toHaveNoViolations();
    });

    it("should render with placeholder", async () => {
        const { container } = render(<Input label="Email" registration={defaultRegistration} placeholder="your@email.com" />);
        expect(screen.getByPlaceholderText("your@email.com")).toBeInTheDocument();
        await expect(axe(container)).resolves.toHaveNoViolations();
    });
});

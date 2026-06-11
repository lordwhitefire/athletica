import { describe, it, expect } from "vitest";
import { axe } from "jest-axe";
import { render, screen } from "@testing-library/react";
import { Textarea } from "./Textarea";

describe("Textarea component visual states", () => {
    const defaultRegistration = {
        name: "bio",
        onChange: () => {},
        onBlur: () => {},
        ref: () => {},
    };

    it("should render with label and textarea", async () => {
        const { container } = render(<Textarea label="Bio" registration={defaultRegistration} />);
        expect(screen.getByLabelText("Bio")).toBeInTheDocument();
        await expect(axe(container)).resolves.toHaveNoViolations();
    });

    it("should render error state", async () => {
        const { container } = render(<Textarea label="Bio" error="Too long" registration={defaultRegistration} />);
        expect(screen.getByText("Too long")).toBeInTheDocument();
        expect(screen.getByRole("alert")).toHaveTextContent("Too long");
        await expect(axe(container)).resolves.toHaveNoViolations();
    });

    it("should render disabled state", async () => {
        const { container } = render(<Textarea label="Bio" registration={defaultRegistration} disabled />);
        expect((screen.getByLabelText("Bio") as HTMLTextAreaElement).disabled).toBe(true);
        await expect(axe(container)).resolves.toHaveNoViolations();
    });
});

import { describe, it, expect } from "vitest";
import { axe } from "jest-axe";
import { render, screen } from "@testing-library/react";
import { Select } from "./Select";

describe("Select component visual states", () => {
    const defaultRegistration = {
        name: "gender",
        onChange: () => {},
        onBlur: () => {},
        ref: () => {},
    };

    it("should render with options", async () => {
        const { container } = render(
            <Select
                label="Gender"
                registration={defaultRegistration}
                options={[
                    { value: "", label: "Select..." },
                    { value: "male", label: "Male" },
                    { value: "female", label: "Female" },
                ]}
            />
        );
        expect(screen.getByLabelText("Gender")).toBeInTheDocument();
        expect(screen.getByRole("combobox")).toBeInTheDocument();
        await expect(axe(container)).resolves.toHaveNoViolations();
    });

    it("should render error state", async () => {
        const { container } = render(
            <Select
                label="Gender"
                error="Required"
                registration={defaultRegistration}
                options={[{ value: "", label: "Select..." }]}
            />
        );
        expect(screen.getByText("Required")).toBeInTheDocument();
        expect(screen.getByRole("combobox")).toHaveAttribute("aria-invalid", "true");
        await expect(axe(container)).resolves.toHaveNoViolations();
    });
});

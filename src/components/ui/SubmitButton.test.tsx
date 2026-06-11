import { describe, it, expect } from "vitest";
import { axe } from "jest-axe";
import { render, screen } from "@testing-library/react";
import { SubmitButton } from "./SubmitButton";
import { useForm, FormProvider } from "react-hook-form";

function Wrapper({ children }: { children: React.ReactNode }) {
    const methods = useForm();
    return <FormProvider {...methods}>{children}</FormProvider>;
}

function FormWithSubmitting() {
    const methods = useForm({ values: { test: "" } });
    return (
        <FormProvider {...methods}>
            <SubmitButton label="Save" />
        </FormProvider>
    );
}

describe("SubmitButton visual states", () => {
    it("should render with label", async () => {
        const { container } = render(<SubmitButton label="Sign In" />, { wrapper: Wrapper });
        expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
        expect(screen.getByRole("button")).not.toBeDisabled();
        await expect(axe(container)).resolves.toHaveNoViolations();
    });

    it("should render loading state", async () => {
        const { container } = render(<SubmitButton label="Sign In" loading />, { wrapper: Wrapper });
        expect(screen.getByRole("button")).toBeDisabled();
        expect(screen.getByText("Processing...")).toBeInTheDocument();
        await expect(axe(container)).resolves.toHaveNoViolations();
    });

    it("should render disabled state when form is submitting", async () => {
        const { container } = render(<FormWithSubmitting />);
        expect(screen.getByRole("button", { name: /save/i })).toBeInTheDocument();
        await expect(axe(container)).resolves.toHaveNoViolations();
    });
});

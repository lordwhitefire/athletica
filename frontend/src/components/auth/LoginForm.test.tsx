import React from "react";
import { describe, it, expect, vi, beforeEach } from "vitest";
import { axe } from "jest-axe";
import { screen, waitFor } from "@testing-library/react";
import userEvent from "@testing-library/user-event";
import { renderWithProviders } from "@/test-utils/renderWithProviders";
import LoginForm from "./LoginForm";

const mockLogin = vi.fn();

vi.mock("@/context/AuthContext", () => ({
    AuthProvider: ({ children }: { children: React.ReactNode }) => <>{children}</>,
    useAuth: () => ({
        auth: { user: null, isLoggedIn: false },
        isAdmin: false,
        login: mockLogin,
        register: vi.fn(),
        logout: vi.fn(),
    }),
}));

describe("LoginForm", () => {
    beforeEach(() => {
        mockLogin.mockReset();
    });

    describe("rendering", () => {
        it("should render the email input", async () => {
            const { container } = renderWithProviders(<LoginForm />);
            expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
            await expect(axe(container)).resolves.toHaveNoViolations();
        });

        it("should render the password input", () => {
            const { container } = renderWithProviders(<LoginForm />);
            expect(screen.getByPlaceholderText("Password")).toBeInTheDocument();
        });

        it("should render the Sign In submit button", async () => {
            const { container } = renderWithProviders(<LoginForm />);
            expect(screen.getByRole("button", { name: /sign in/i })).toBeInTheDocument();
            await expect(axe(container)).resolves.toHaveNoViolations();
        });

        it("should render a link to the register page", async () => {
            const { container } = renderWithProviders(<LoginForm />);
            expect(screen.getByRole("link", { name: /create one/i })).toBeInTheDocument();
            await expect(axe(container)).resolves.toHaveNoViolations();
        });

        it("should render the Forgot Password link", async () => {
            const { container } = renderWithProviders(<LoginForm />);
            expect(screen.getByRole("link", { name: /forgot password/i })).toBeInTheDocument();
            await expect(axe(container)).resolves.toHaveNoViolations();
        });
    });

    describe("validation — submitting empty form", () => {
        it("should show an email validation error when submitted with empty email", async () => {
            const { container } = renderWithProviders(<LoginForm />);
            const user = userEvent.setup();

            await user.click(screen.getByRole("button", { name: /sign in/i }));

            await waitFor(() => {
                expect(screen.getByText(/enter a valid email address/i)).toBeInTheDocument();
            });
            await expect(axe(container)).resolves.toHaveNoViolations();
        });

        it("should show a password validation error when submitted with empty password", async () => {
            const { container } = renderWithProviders(<LoginForm />);
            const user = userEvent.setup();

            await user.click(screen.getByRole("button", { name: /sign in/i }));

            await waitFor(() => {
                expect(screen.getByText(/password is required/i)).toBeInTheDocument();
            });
            await expect(axe(container)).resolves.toHaveNoViolations();
        });

        it("should NOT call login() when the form is submitted with invalid data", async () => {
            const { container } = renderWithProviders(<LoginForm />);
            const user = userEvent.setup();

            await user.click(screen.getByRole("button", { name: /sign in/i }));

            await waitFor(() => {
                expect(mockLogin).not.toHaveBeenCalled();
            });
            await expect(axe(container)).resolves.toHaveNoViolations();
        });
    });

    describe("successful submission", () => {
        it("should call login() with the submitted email and password", async () => {
            mockLogin.mockResolvedValue({ data: { userId: "1", role: "customer" }, error: null });
            const { container } = renderWithProviders(<LoginForm />);
            const user = userEvent.setup();

            await user.type(screen.getByLabelText(/email address/i), "user@example.com");
            await user.type(screen.getByPlaceholderText("Password"), "securepass");
            await user.click(screen.getByRole("button", { name: /sign in/i }));

            await waitFor(() => {
                expect(mockLogin).toHaveBeenCalledWith("user@example.com", "securepass");
            });
            await expect(axe(container)).resolves.toHaveNoViolations();
        });
    });

    describe("server error handling", () => {
        it("should show a root error message when login() returns a generic error", async () => {
            mockLogin.mockResolvedValue({
                data: null,
                error: { type: "auth_error", code: "invalid_credentials", message: "The email or password you entered is incorrect." },
            });
            const { container } = renderWithProviders(<LoginForm />);
            const user = userEvent.setup();

            await user.type(screen.getByLabelText(/email address/i), "user@example.com");
            await user.type(screen.getByPlaceholderText("Password"), "wrongpass");
            await user.click(screen.getByRole("button", { name: /sign in/i }));

            await waitFor(() => {
                expect(screen.getByText(/the email or password you entered is incorrect/i)).toBeInTheDocument();
            });
            await expect(axe(container)).resolves.toHaveNoViolations();
        });

        it("should show field-level error when login() returns fields error", async () => {
            mockLogin.mockResolvedValue({
                data: null,
                error: { type: "validation_error", code: "validation_failed", message: "Some fields are invalid.", fields: [{ field: "email", message: "No account found with this email." }] },
            });
            const { container } = renderWithProviders(<LoginForm />);
            const user = userEvent.setup();

            await user.type(screen.getByLabelText(/email address/i), "unknown@example.com");
            await user.type(screen.getByPlaceholderText("Password"), "anypass");
            await user.click(screen.getByRole("button", { name: /sign in/i }));

            await waitFor(() => {
                expect(screen.getByText(/no account found with this email/i)).toBeInTheDocument();
            });
            await expect(axe(container)).resolves.toHaveNoViolations();
        });
    });

    describe("password visibility toggle", () => {
        it("should render the password input as type=password by default", () => {
            const { container } = renderWithProviders(<LoginForm />);
            const passwordInput = screen.getByPlaceholderText("Password");
            expect(passwordInput).toHaveAttribute("type", "password");
        });

        it("should toggle password to type=text when the visibility button is clicked", async () => {
            const { container } = renderWithProviders(<LoginForm />);
            const user = userEvent.setup();

            const toggleButton = screen.getByRole("button", { name: /visibility/i });
            await user.click(toggleButton);

            expect(screen.getByPlaceholderText("Password")).toHaveAttribute("type", "text");
        });
    });
});

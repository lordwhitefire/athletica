"use client";

import {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
} from "react";
import { AuthContextType, AuthState, User, LoginResult } from "@/types/auth";
import { createClient } from "@/lib/supabase/client";
import type { Session } from "@supabase/supabase-js";
import type { ApiResult } from "@/lib/api-types";
import { ok, fail, fromCaughtError } from "@/lib/api-types";
import { logger } from "@/lib/logger";

const initialAuthState: AuthState = {
    user: null,
    isLoggedIn: false,
};

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [auth, setAuth] = useState<AuthState>(initialAuthState);
    const supabase = createClient();

    useEffect(() => {
        supabase.auth.getSession().then(({ data: { session } }) => {
            if (session?.user) {
                setAuthFromSession(session);
            }
        });

        const {
            data: { subscription },
        } = supabase.auth.onAuthStateChange((_event, session) => {
            if (session?.user) {
                setAuthFromSession(session);
            } else {
                logger.clearUser();
                setAuth(initialAuthState);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    async function setAuthFromSession(session: Session) {
        const { id, email, user_metadata, created_at } = session.user;

        const { data: profile } = await supabase
            .from("profiles")
            .select("name, role")
            .eq("id", id)
            .single();

        const user: User = {
            userId: id,
            name:
                profile?.name ||
                (user_metadata?.name as string) ||
                email?.split("@")[0] ||
                "User",
            email: email || "",
            createdAt: created_at || new Date().toISOString(),
            role: profile?.role || "customer",
        };

        setAuth({ user, isLoggedIn: true });
        logger.setUser({ id: user.userId, email: user.email });
    }

    async function register(
        name: string,
        email: string,
        password: string
    ): Promise<ApiResult<{ needsEmailConfirmation?: boolean }>> {
        const { data, error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { name } },
        });

        if (error) {
            if (error.message.includes("User already registered")) {
                return fail("auth_error", "email_already_exists", "An account with this email already exists.");
            }
            if (error.message.includes("Password should be at least 6 characters")) {
                return fail("validation_error", "password_too_short", "Password must be at least 6 characters.");
            }
            if (error.message.includes("Unable to validate email")) {
                return fail("validation_error", "invalid_email", "The email address you entered is not valid.");
            }
            return fail("auth_error", "registration_failed", "Registration failed. Please try again.");
        }

        const needsEmailConfirmation = !data.session;

        return ok({ needsEmailConfirmation });
    }

    async function login(
        email: string,
        password: string,
        _name?: string
    ): Promise<ApiResult<LoginResult>> {
        const { data, error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            if (error.message.includes("Invalid login credentials")) {
                return fail("auth_error", "invalid_credentials", "The email or password you entered is incorrect.");
            }
            if (error.message.includes("Email not confirmed")) {
                return fail("auth_error", "email_not_confirmed", "Please confirm your email address before logging in.");
            }
            return fail("auth_error", "login_failed", "Login failed. Please try again.");
        }

        const userId = data.user?.id ?? "";

        let role: "customer" | "admin" = "customer";
        try {
            const { data: profile } = await supabase
                .from("profiles")
                .select("role")
                .eq("id", userId)
                .single();
            if (profile?.role === "admin") role = "admin";
        } catch {
            // Default to customer if profile fetch fails
        }

        return ok({ userId, role });
    }

    async function logout(): Promise<ApiResult<{ success: true }>> {
        try {
            await supabase.auth.signOut();
            logger.clearUser();
            setAuth(initialAuthState);
            return ok({ success: true });
        } catch (err) {
            return fromCaughtError(err, "logout_failed");
        }
    }

    return (
        <AuthContext.Provider
            value={{
                auth,
                isAdmin: auth.user?.role === "admin",
                login,
                register,
                logout,
            }}
        >
            {children}
        </AuthContext.Provider>
    );
}

export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used inside an AuthProvider");
    }
    return context;
}

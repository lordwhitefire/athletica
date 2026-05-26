"use client";

import {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
} from "react";
import { AuthContextType, AuthState, User } from "@/types/auth";
import { createClient } from "@/lib/supabase/client";
import type { Session } from "@supabase/supabase-js";

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
                setAuth(initialAuthState);
            }
        });

        return () => subscription.unsubscribe();
    }, []);

    async function setAuthFromSession(session: Session) {
        const { id, email, user_metadata, created_at } = session.user;

        const { data: profile } = await supabase
            .from("profiles")
            .select("name")
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
        };

        setAuth({ user, isLoggedIn: true });
    }

    async function register(
        name: string,
        email: string,
        password: string
    ): Promise<{ success: boolean; error?: string }> {
        const { error } = await supabase.auth.signUp({
            email,
            password,
            options: { data: { name } },
        });

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true };
    }

    async function login(
        email: string,
        password: string,
        _name?: string
    ): Promise<{ success: boolean; error?: string }> {
        const { error } = await supabase.auth.signInWithPassword({
            email,
            password,
        });

        if (error) {
            return { success: false, error: error.message };
        }

        return { success: true };
    }

    async function logout() {
        await supabase.auth.signOut();
        setAuth(initialAuthState);
    }

    return (
        <AuthContext.Provider
            value={{
                auth,
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

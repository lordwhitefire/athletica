"use client";

import {
    createContext,
    useContext,
    useState,
    useEffect,
    ReactNode,
} from "react";
import { AuthContextType, AuthState, User } from "@/types/auth";

const AUTH_COOKIE_KEY = "athletica_user";
const COOKIE_EXPIRES_DAYS = 365;

// ── Cookie helpers ────────────────────────────────────────
function setCookie(name: string, value: string, days: number) {
    const expires = new Date();
    expires.setTime(expires.getTime() + days * 24 * 60 * 60 * 1000);
    document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires.toUTCString()};path=/;SameSite=Lax`;
}

function getCookie(name: string): string | null {
    const nameEQ = `${name}=`;
    const cookies = document.cookie.split(";");
    for (let c of cookies) {
        c = c.trim();
        if (c.indexOf(nameEQ) === 0) {
            return decodeURIComponent(c.substring(nameEQ.length));
        }
    }
    return null;
}

function deleteCookie(name: string) {
    document.cookie = `${name}=;expires=Thu, 01 Jan 1970 00:00:00 UTC;path=/;`;
}

// ── Generate a unique user ID ─────────────────────────────
// Uses crypto.randomUUID if available, falls back to manual generation
function generateUserId(): string {
    if (typeof crypto !== "undefined" && crypto.randomUUID) {
        return crypto.randomUUID();
    }
    // Fallback for older browsers
    return "uid_" + Math.random().toString(36).slice(2, 11) + Date.now();
}

// ── Hash password ─────────────────────────────────────────
// NOTE: This is a simple hash for cookie storage only
// When backend is ready, replace this with proper bcrypt on the server
async function hashPassword(password: string): Promise<string> {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest("SHA-256", data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map((b) => b.toString(16).padStart(2, "0")).join("");
}

// ── Initial auth state ────────────────────────────────────
const initialAuthState: AuthState = {
    user: null,
    isLoggedIn: false,
};

// ── Load auth from cookie ─────────────────────────────────
function loadAuthFromCookie(): AuthState {
    try {
        const raw = getCookie(AUTH_COOKIE_KEY);
        if (!raw) return initialAuthState;
        const user: User = JSON.parse(raw);
        return {
            user,
            isLoggedIn: true,
        };
    } catch {
        return initialAuthState;
    }
}

// ── Save user to cookie ───────────────────────────────────
function saveUserToCookie(user: User) {
    // NOTE: We do NOT store the password in the cookie
    // Only store safe user info
    const safeUser = {
        userId: user.userId,
        name: user.name,
        email: user.email,
        createdAt: user.createdAt,
    };
    setCookie(AUTH_COOKIE_KEY, JSON.stringify(safeUser), COOKIE_EXPIRES_DAYS);
}

// ── Context ───────────────────────────────────────────────
const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
    const [auth, setAuth] = useState<AuthState>(initialAuthState);

    // Load auth from cookie on mount
    useEffect(() => {
        const savedAuth = loadAuthFromCookie();
        setAuth(savedAuth);
    }, []);

    // Register a new user
    async function register(name: string, email: string, password: string): Promise<{ success: boolean; error?: string }> {
        try {
            // NOTE: No duplicate email check yet — add this when backend is ready
            const hashedPassword = await hashPassword(password);

            const newUser: User = {
                userId: generateUserId(),
                name,
                email,
                createdAt: new Date().toISOString(),
            };

            // Store hashed password separately — never in the main user cookie
            // When backend is ready, send hashedPassword to API instead
            setCookie(
                `athletica_pwd_${newUser.userId}`,
                hashedPassword,
                COOKIE_EXPIRES_DAYS
            );

            saveUserToCookie(newUser);
            setAuth({
                user: newUser,
                isLoggedIn: true,
            });
            return { success: true };
        } catch (e: any) {
            return { success: false, error: e.message || "Failed to register" };
        }
    }

    // Login an existing user
    async function login(email: string, password: string, name: string = "User"): Promise<{ success: boolean; error?: string }> {
        try {
            // NOTE: This is frontend-only auth for now
            // When backend is ready, replace this entire function with an API call
            // that validates credentials server-side

            const hashedPassword = await hashPassword(password);

            // For now just create/update the session
            // Real validation happens when backend is connected
            const user: User = {
                userId: generateUserId(),
                name,
                email,
                createdAt: new Date().toISOString(),
            };

            saveUserToCookie(user);
            setAuth({
                user,
                isLoggedIn: true,
            });
            return { success: true };
        } catch (e: any) {
            return { success: false, error: e.message || "Failed to login" };
        }
    }

    // Logout
    function logout() {
        deleteCookie(AUTH_COOKIE_KEY);
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

// Custom hook for using auth context
export function useAuth(): AuthContextType {
    const context = useContext(AuthContext);
    if (!context) {
        throw new Error("useAuth must be used inside an AuthProvider");
    }
    return context;
}
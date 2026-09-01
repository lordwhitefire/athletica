import type { ApiResult } from "@/lib/api-types";

export interface User {
    userId: string;
    name: string;
    email: string;
    createdAt: string;
    role: "customer" | "admin";
}

export interface AuthState {
    user: User | null;
    isLoggedIn: boolean;
}

export interface LoginResult {
    userId: string;
    role: "customer" | "admin";
}

export interface RegisterResult {
    needsEmailConfirmation?: boolean;
}

export interface AuthContextType {
    auth: AuthState;
    isAdmin: boolean;
    login: (email: string, password: string, name?: string) => Promise<ApiResult<LoginResult>>;
    register: (name: string, email: string, password: string) => Promise<ApiResult<RegisterResult>>;
    logout: () => Promise<ApiResult<{ success: true }>>;
}

export interface User {
    userId: string;
    name: string;
    email: string;
    createdAt: string;
}

export interface AuthState {
    user: User | null;
    isLoggedIn: boolean;
}

export interface AuthResponse {
    success: boolean;
    error?: string;
}

export interface AuthContextType {
    auth: AuthState;
    login: (email: string, password: string, name?: string) => Promise<AuthResponse>;
    register: (name: string, email: string, password: string) => Promise<AuthResponse>;
    logout: () => void;
}
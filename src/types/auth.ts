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

export interface AuthContextType {
    auth: AuthState;
    login: (name: string, email: string, password: string) => void;
    register: (name: string, email: string, password: string) => void;
    logout: () => void;
}
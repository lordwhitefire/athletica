import { http, HttpResponse } from "msw";

const SUPABASE_URL = "https://mtudltsfcxvjjhmaztrp.supabase.co";

export const supabaseHandlers = [
    http.post(`${SUPABASE_URL}/auth/v1/token`, () => {
        return HttpResponse.json({
            access_token: "mock-access-token",
            refresh_token: "mock-refresh-token",
            user: { id: "user-123", email: "user@example.com" },
        });
    }),

    http.post(`${SUPABASE_URL}/auth/v1/signup`, () => {
        return HttpResponse.json({ id: "user-123", email: "user@example.com" });
    }),

    http.post(`${SUPABASE_URL}/auth/v1/logout`, () => {
        return HttpResponse.json({});
    }),
];

export function supabaseSignInReturnsError(message = "Invalid login credentials") {
    return http.post(`${SUPABASE_URL}/auth/v1/token`, () => {
        return HttpResponse.json(
            { error: "invalid_grant", error_description: message },
            { status: 400 }
        );
    });
}

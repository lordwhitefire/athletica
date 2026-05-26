import { NextResponse } from "next/server";
import { createToken, verifyPassword, COOKIE_NAME } from "@/lib/admin-auth";
import { adminClient } from "@/lib/admin-sanity";

export async function POST(request: Request) {
    try {
        const { email, password } = await request.json();

        if (!email || !password) {
            return NextResponse.json({ error: "Email and password required" }, { status: 400 });
        }

        const admin = await adminClient.fetch(`*[_type == "admin" && email == $email][0]`, { email });

        if (!admin || !admin.passwordHash) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }

        const valid = await verifyPassword(password, admin.passwordHash);

        if (!valid) {
            return NextResponse.json({ error: "Invalid credentials" }, { status: 401 });
        }

        const token = await createToken(email);

        const response = NextResponse.json({ success: true });
        response.cookies.set(COOKIE_NAME, token, {
            httpOnly: true,
            secure: process.env.NODE_ENV === "production",
            sameSite: "lax",
            path: "/",
            maxAge: 60 * 60 * 24,
        });

        return response;
    } catch (error) {
        console.error("Admin login error:", error);
        return NextResponse.json({ error: "Internal error" }, { status: 500 });
    }
}

import { SignJWT, jwtVerify } from "jose";
import bcrypt from "bcryptjs";

const JWT_SECRET = new TextEncoder().encode(process.env.ADMIN_JWT_SECRET || "fallback-dev-secret-change-in-prod");
const COOKIE_NAME = "admin_token";

export async function hashPassword(password: string): Promise<string> {
    return bcrypt.hash(password, 12);
}

export async function verifyPassword(password: string, hash: string): Promise<boolean> {
    return bcrypt.compare(password, hash);
}

export async function createToken(email: string): Promise<string> {
    return new SignJWT({ email, role: "admin" })
        .setProtectedHeader({ alg: "HS256" })
        .setIssuedAt()
        .setExpirationTime("24h")
        .sign(JWT_SECRET);
}

export async function verifyToken(token: string): Promise<{ email: string; role: string } | null> {
    try {
        const { payload } = await jwtVerify(token, JWT_SECRET);
        return payload as { email: string; role: string };
    } catch {
        return null;
    }
}

export { COOKIE_NAME };

import { NextRequest } from "next/server";

const ALLOWED_ORIGINS = [
    "http://localhost:3000",
    "https://athletica-blond.vercel.app",
];

export function isValidOrigin(req: NextRequest): boolean {
    const origin = req.headers.get("origin");
    const referer = req.headers.get("referer");

    if (!origin && !referer) return true;

    const source = origin ?? referer ?? "";
    return ALLOWED_ORIGINS.some((allowed) => source.startsWith(allowed));
}

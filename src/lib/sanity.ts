import * as fs from "fs";
import * as path from "path";
import { sanityCdnUrl } from "@/lib/sanity-client";
import type { ApiResult } from "@/lib/api-types";
import { ok, fail } from "@/lib/api-types";

export { client, urlFor } from "@/lib/sanity-client";

const PROJECT_ID = "cuiis46d";
const DATASET = "production";

export async function getSiteLogoUrl(): Promise<ApiResult<string | null>> {
    try {
        const jsonPath = path.join(process.cwd(), "data", "site-settings.json");
        const raw = JSON.parse(await fs.promises.readFile(jsonPath, "utf-8"));
        const logo = raw?.site_logo;
        if (!logo) return ok(null);
        if (typeof logo === "string") return ok(logo);
        const ref = logo?.asset?._ref;
        if (!ref) return ok(null);
        const url = sanityCdnUrl(ref as string);
        return ok(url);
    } catch {
        return fail("api_error", "logo_fetch_failed", "Failed to fetch site logo.");
    }
}

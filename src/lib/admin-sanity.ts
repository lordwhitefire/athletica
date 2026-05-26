import { createClient } from "@sanity/client";

export const adminClient = createClient({
    projectId: "cuiis46d",
    dataset: "production",
    token: process.env.SANITY_WRITE_TOKEN,
    apiVersion: "2025-01-01",
    useCdn: false,
});

"use server";

import { revalidatePath } from "next/cache";
import { adminClient } from "@/lib/admin-sanity";
import type { ApiResult } from "@/lib/api-types";
import { ok, fromCaughtError } from "@/lib/api-types";
import { validateOrFail } from "@/lib/validate";
import { amazonLinksSchema } from "@/lib/schemas/amazon-links";

export async function getAmazonLinksDoc(): Promise<ApiResult<Record<string, unknown>>> {
    try {
        const doc = await adminClient.fetch(`*[_type == "amazonLinks"][0]`);
        return ok(doc as Record<string, unknown>);
    } catch (err) {
        return fromCaughtError(err, "amazon_links_doc_fetch_failed");
    }
}

export async function saveAmazonLinks(links: { productId: string; url: string }[]): Promise<ApiResult<{ saved: true }>> {
    try {
        const parsed = validateOrFail(amazonLinksSchema, links);
        if ("error" in parsed) return parsed.error;
        const linksArray = links
            .filter((l) => l.url?.trim())
            .map((l, i) => ({ _key: `link-${i}`, productId: l.productId, url: l.url }));
        const docResult = await getAmazonLinksDoc();
        if (docResult.error) return docResult;
        const doc = docResult.data;
        if (!doc) {
            await adminClient.create({ _type: "amazonLinks", _id: "amazonLinks", links: linksArray });
        } else {
            await adminClient.patch(doc._id as string).set({ links: linksArray }).commit();
        }
        revalidatePath("/admin/amazon-links");
        return ok({ saved: true });
    } catch (err) {
        return fromCaughtError(err, "amazon_links_save_failed");
    }
}

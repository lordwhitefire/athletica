"use server";

import { revalidatePath } from "next/cache";
import { adminClient } from "@/lib/admin-sanity";

export async function getAllProductsAdmin(search?: string) {
    let query = `*[_type == "product"]`;
    if (search) {
        query = `*[_type == "product" && model match $search]`;
    }
    query += ` | order(model asc) { _id, id, model, brand, category, price, url_slug, color }`;
    const params = search ? { search: `${search}*` } : {};
    return adminClient.fetch(query, params);
}

export async function getProductByIdAdmin(id: string) {
    return adminClient.fetch(`*[_id == $id][0]`, { id });
}

export async function createProduct(formData: FormData) {
    const raw = Object.fromEntries(formData.entries());

    const doc = {
        _type: "product",
        _id: raw.id as string,
        id: raw.id as string,
        url_slug: { _type: "slug", current: raw.url_slug as string },
        model: raw.model as string,
        brand: raw.brand as string,
        category: raw.category as string,
        traction: (raw.traction as string) || null,
        model_line: (raw.model_line as string) || null,
        gender: (raw.gender as string) || "Unisex",
        age_group: (raw.age_group as string) || "Adult",
        color: (raw.color as string) || "",
        price: {
            current: parseFloat(raw.price_current as string) || 0,
            original: parseFloat(raw.price_original as string) || 0,
            discount_percent: parseFloat(raw.discount_percent as string) || 0,
            member_price: parseFloat(raw.member_price as string) || 0,
            currency: (raw.currency as string) || "EUR",
        },
        sizes: [],
        description: {
            subtitle: (raw.desc_subtitle as string) || "",
            tagline: (raw.desc_tagline as string) || "",
            intro: (raw.desc_intro as string) || "",
            collection: (raw.desc_collection as string) || "",
            key_benefits: [],
            technical_details: {
                range: (raw.tech_range as string) || "",
                sole_type: (raw.tech_sole as string) || "",
                upper_material: (raw.tech_upper as string) || "",
                adjustment: (raw.tech_adjustment as string) || "",
            },
        },
    };

    await adminClient.createOrReplace(doc);
    revalidatePath("/admin/products");
}

export async function updateProduct(id: string, formData: FormData) {
    const raw = Object.fromEntries(formData.entries());

    const patch = {
        model: raw.model as string,
        brand: raw.brand as string,
        category: raw.category as string,
        traction: (raw.traction as string) || null,
        model_line: (raw.model_line as string) || null,
        gender: (raw.gender as string) || "Unisex",
        age_group: (raw.age_group as string) || "Adult",
        color: (raw.color as string) || "",
        price: {
            current: parseFloat(raw.price_current as string) || 0,
            original: parseFloat(raw.price_original as string) || 0,
            discount_percent: parseFloat(raw.discount_percent as string) || 0,
            member_price: parseFloat(raw.member_price as string) || 0,
            currency: (raw.currency as string) || "EUR",
        },
    };

    await adminClient.patch(id).set(patch).commit();
    revalidatePath("/admin/products");
}

export async function deleteProduct(id: string) {
    await adminClient.delete(id);
    revalidatePath("/admin/products");
}

import type { SanityImageSource } from "@sanity/image-url";
import { client, urlFor } from "@/lib/sanity";
import type { Product } from "@/types/product";
import type { ApiResult } from "@/lib/api-types";
import { ok, fromCaughtError } from "@/lib/api-types";
import { z } from "zod";
import { productSanitySchema } from "@/lib/schemas/product";

const productsQuery = `*[_type == "product"]{
  id,
  "url_slug": url_slug.current,
  model,
  "brand": coalesce(brand->name, brand),
  category,
  traction,
  name,
  gender,
  main_image,
  image_gallery,
  thumbnail,
  color,
  color_variants[]{
    color,
    product_id,
    thumbnail
  },
  price,
  sizes,
  description
}`;

function resolveImages(product: Record<string, unknown>): Record<string, unknown> {
    const resolved = { ...product };

    if (resolved.main_image) {
        resolved.main_image = urlFor(resolved.main_image as SanityImageSource).url();
    }

    if (resolved.thumbnail) {
        resolved.thumbnail = urlFor(resolved.thumbnail as SanityImageSource).url();
    }

    if (Array.isArray(resolved.image_gallery)) {
        resolved.image_gallery = (resolved.image_gallery as unknown[]).map((img) =>
            img ? urlFor(img as SanityImageSource).url() : null
        ).filter(Boolean);
    }

    if (Array.isArray(resolved.color_variants)) {
        resolved.color_variants = (resolved.color_variants as Record<string, unknown>[]).map((cv) => {
            if (cv.thumbnail) {
                return { ...cv, thumbnail: urlFor(cv.thumbnail as SanityImageSource).url() };
            }
            return cv;
        });
    }

    return resolved;
}

export async function getAllProductsSanity(): Promise<ApiResult<Product[]>> {
    try {
        const products = await client.fetch(productsQuery);
        const parsed = z.array(productSanitySchema).safeParse(products);
        if (!parsed.success) {
            console.warn("Sanity product shape mismatch:", parsed.error.issues);
            const resolved = products.map((p: Record<string, unknown>) => resolveImages(p)) as unknown as Product[];
            return ok(resolved);
        }
        const resolved = parsed.data.map((p: Record<string, unknown>) => resolveImages(p)) as unknown as Product[];
        return ok(resolved);
    } catch (err) {
        return fromCaughtError(err, "products_fetch_failed");
    }
}



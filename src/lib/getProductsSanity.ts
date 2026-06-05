import type { SanityImageSource } from "@sanity/image-url";
import { client, urlFor } from "@/lib/sanity";
import type { Product } from "@/types/product";

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

const productBySlugQuery = `*[_type == "product" && url_slug.current == $slug][0]{
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

export async function getAllProductsSanity(): Promise<Product[]> {
    const products = await client.fetch(productsQuery);
    return products.map((p: Record<string, unknown>) => resolveImages(p)) as unknown as Product[];
}

export async function getProductBySlugSanity(slug: string): Promise<Product | undefined> {
    const product = await client.fetch(productBySlugQuery, { slug });
    if (!product) return undefined;
    return resolveImages(product) as unknown as Product;
}

export async function getProductByIdSanity(id: string): Promise<Product | undefined> {
    const products = await getAllProductsSanity();
    return products.find((p) => p.id === id);
}

export async function getProductsByNameSanity(name: string, excludeId?: string): Promise<Product[]> {
    const products = await getAllProductsSanity();
    return products.filter((p) => p.name === name && p.id !== excludeId);
}

export async function getProductsByBrandSanity(brand: string, excludeName?: string, excludeId?: string): Promise<Product[]> {
    const products = await getAllProductsSanity();
    return products.filter(
        (p) => p.brand === brand && p.name !== excludeName && p.id !== excludeId
    );
}

export async function getProductsByTractionSanity(traction: string, excludeId?: string): Promise<Product[]> {
    const products = await getAllProductsSanity();
    return products.filter((p) => p.traction === traction && p.id !== excludeId);
}

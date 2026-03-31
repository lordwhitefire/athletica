export interface ColorVariant {
    color: string;
    product_id: string;
    thumbnail: string;
}

export interface Price {
    current: number;
    original: number;
    discount_percent: number;
    member_price: number;
    currency: string;
}

export interface Size {
    size: string;
    available: boolean;
    stock: number;
}

export interface TechnicalDetails {
    range: string;
    sole_type: string;
    upper_material: string;
    adjustment: string;
}

export interface Description {
    subtitle: string;
    tagline: string;
    intro: string;
    collection: string;
    key_benefits: string[];
    technical_details: TechnicalDetails;
}

export interface Product {
    id: string;
    url_slug: string;
    model: string;
    brand: string;
    brand_logo: string | null;
    category: string;
    traction: string | null;
    model_line: string | null;
    gender: string;
    age_group: string;
    main_image: string;
    image_gallery: string[];
    thumbnail: string;
    color: string;
    color_variants: ColorVariant[];
    price: Price;
    sizes: Size[];
    description: Description;
}

export interface FilterOptions {
    brands: string[];
    model_lines: string[];
    tractions: string[];
    colors: string[];
    categories: string[];
    genders: string[];
    min_price: number;
    max_price: number;
    sizes: string[];
}

export interface ActiveFilters {
    brand?: string[];
    model_line?: string[];
    traction?: string[];
    color?: string[];
    category?: string[];
    gender?: string[];
    min_price?: number;
    max_price?: number;
    size?: string[];
    sort?: "newest" | "price_asc" | "price_desc" | "biggest_discount";
}
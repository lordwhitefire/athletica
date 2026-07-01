import { cache } from "react";

// Simple in-memory fallback data to ensure the site works
const fallbackHomepageData = {
  hero_carousel: {
    banners: [
      {
        _key: "banner-1",
        label: "Welcome to Athletica",
        href: "/",
        bg: "",
        textColor: "text-white",
        accent: "",
        image: "https://images.unsplash.com/photo-1551739440-423c9021af8e?w=800&h=400&fit=crop&crop=center",
        subtitle: "Your ultimate football store",
      },
      {
        _key: "banner-2", 
        label: "Premium Football Gear",
        href: "/football-boots",
        bg: "",
        textColor: "text-white",
        accent: "",
        image: "https://images.unsplash.com/photo-1542291026-7eec264c27ff?w=800&h=400&fit=crop&crop=center",
        subtitle: "Shop the best selection",
      },
    ],
    auto_switch_ms: 4000,
  },
  sections: [
    {
      _key: "section-1",
      variant: "grid-4-equal",
      title: "Shop by Category",
      subtitle: "Discover our premium collection",
      bg: "bg-surface",
      items: [
        {
          _key: "item-1",
          label: "Football Boots",
          href: "/football-boots",
          bg: "bg-surface-container",
          textColor: "text-on-surface",
          accent: "",
          image: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=400&fit=crop&crop=center",
        },
        {
          _key: "item-2",
          label: "Goalkeeper Gloves",
          href: "/goalkeeper-gloves",
          bg: "bg-surface-container",
          textColor: "text-on-surface",
          accent: "",
          image: "https://images.unsplash.com/photo-1571019613454-1cb2f99b2d8b?w=400&h=400&fit=crop&crop=center",
        },
        {
          _key: "item-3",
          label: "Training Wear",
          href: "/training-wear",
          bg: "bg-surface-container",
          textColor: "text-on-surface",
          accent: "",
          image: "https://images.unsplash.com/photo-1583394838336-acd977736f90?w=400&h=400&fit=crop&crop=center",
        },
        {
          _key: "item-4",
          label: "Accessories",
          href: "/accessories",
          bg: "bg-surface-container",
          textColor: "text-on-surface",
          accent: "",
          image: "https://images.unsplash.com/photo-1558979158-65a1eaa08691?w=400&h=400&fit=crop&crop=center",
        },
      ],
    },
    {
      _key: "section-2",
      variant: "asymmetric-3-2",
      title: "Featured Products",
      subtitle: "Curated selection for you",
      bg: "bg-neutral-900",
      items: [
        {
          _key: "feat-1",
          label: "Adidas Predator",
          href: "/adidas-predator-football-boots",
          bg: "bg-black",
          textColor: "text-white",
          accent: "",
          image: "https://images.unsplash.com/photo-1551698618-1dfe5d97d256?w=400&h=600&fit=crop&crop=center",
        },
        {
          _key: "feat-2",
          label: "Nike Phantom",
          href: "/nike-phantom-football-boots",
          bg: "bg-zinc-900",
          textColor: "text-white",
          accent: "",
          image: "https://images.unsplash.com/photo-1551698623-1ee9470d9597?w=400&h=600&fit=crop&crop=center",
        },
      ],
    },
  ],
};

// Helper function to resolve CDN URLs
function resolveCdnUrl(url: string): string {
  if (!url) return null;
  return url;
}

function resolveHomepageImages(config: Record<string, unknown>): Record<string, unknown> {
  const resolved = { ...config };

  if (resolved.hero_carousel) {
    const hero = { ...(resolved.hero_carousel as Record<string, unknown>) };
    if (Array.isArray(hero.banners)) {
      hero.banners = (hero.banners as Record<string, unknown>[]).map((banner) => {
        const b = { ...banner };
        b.image = resolveCdnUrl(b.image as string);
        return b;
      });
    }
    resolved.hero_carousel = hero;
  }

  if (Array.isArray(resolved.sections)) {
    resolved.sections = (resolved.sections as Record<string, unknown>[]).map((section) => {
      const s = { ...section };
      if (s.type === "category_carousel" && !s.variant) {
        s.variant = "default";
      }
      if (s.type === "product_carousel" && !s.variant) {
        s.variant = "default";
      }
      if (s.type === "category_grid" && Array.isArray(s.items)) {
        s.items = (s.items as Record<string, unknown>[]).map((item) => {
          const it = { ...item };
          it.image = resolveCdnUrl(it.image as string);
          return it;
        });
      }
      if (s.type === "category_carousel" && Array.isArray(s.cards)) {
        s.cards = (s.cards as Record<string, unknown>[]).map((card) => {
          const c = { ...card };
          c.image = resolveCdnUrl(c.image as string);
          return c;
        });
      }
      return s;
    });
  }

  return resolved;
}

const getCachedHomepage = cache(async (): Promise<any> => {
  try {
    // Try to read from transformed JSON file first
    const jsonPath = path.join(process.cwd(), "..", "data", "homepage-frontend.json");
    
    try {
      console.log("📁 Reading frontend JSON from:", jsonPath);
      const fs = require("fs").promises;
      const jsonData = await fs.readFile(jsonPath, "utf-8");
      const data = JSON.parse(jsonData);
      
      // The data is already transformed, just resolve CDN URLs
      const resolved = resolveHomepageImages(data);
      
      console.log("✅ Successfully loaded frontend JSON with", data.sections?.length || 0, "sections");
      return resolved;
    } catch (transformError) {
      console.log("⚠️ Frontend JSON not found, trying Sanity JSON...");
      
      // Fallback to original Sanity JSON if transformed file doesn't exist
      const fallbackPath = path.join(process.cwd(), "..", "data", "homepage.json");
      console.log("📁 Reading fallback Sanity JSON from:", fallbackPath);
      
      const fs = require("fs").promises;
      const fallbackData = JSON.parse(await fs.readFile(fallbackPath, "utf-8"));
      
      // Transform the data on the fly
      const transformed = {
        hero_carousel: {
          banners: (fallbackData.hero_carousel || {}).banners?.map((banner) => ({
            _key: banner._key,
            id: banner.id || banner._key || "",
            title: banner.title || "",
            subtitle: banner.subtitle || "",
            button_text: banner.button_text || "",
            link: banner.link || "/",
            gradient: banner.gradient || "",
            accent_color: banner.accent_color || "",
            image: banner.image || "",
          })) || [],
          auto_switch_ms: 4000,
        },
        sections: (fallbackData.sections || []).map((section) => ({
          _key: section._key,
          variant: section.variant || section.type || "grid-4-equal",
          title: section.title || "",
          subtitle: section.subtitle || "",
          bg: section.bg || "bg-surface",
          items: (section.items || []).map((item) => ({
            _key: item._key,
            label: item.title || item.label || "",
            link: item.link || "/",
            bg: item.bg || "bg-surface",
            textColor: item.textColor || "text-on-surface",
            accent: item.accent || "",
            image: item.image || item.image_asset || "",
          })),
        })),
      };
      
      const resolved = resolveHomepageImages(transformed);
      console.log("✅ Successfully loaded fallback JSON with", transformed.sections?.length || 0, "sections");
      return resolved;
    }
  } catch (err) {
    console.error("❌ Error reading JSON files, using fallback data:", err.message);
    console.log("🔄 Using fallback homepage data");
    return fallbackHomepageData;
  }
});

export async function getHomepageConfig(): Promise<any> {
  return getCachedHomepage();
}

export async function getHomepageSections(): Promise<any[]> {
  const config = await getCachedHomepage();
  return config.sections || [];
}

export async function getProductsForCarousel(section: any): Promise<any[]> {
  // For now, return empty array since products are not in JSON
  // In a real implementation, you'd have products.json or fetch from API
  return [];
}
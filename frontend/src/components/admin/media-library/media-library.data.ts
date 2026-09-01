import type { MediaAsset } from "./media-library.types";

export const STORAGE_KEY = "athletica.media.interaction.v1";

export const TYPE_OPTIONS = ["All Types", "JPG", "PNG", "WEBP"];
export const USAGE_OPTIONS = ["All Usage", "Used", "Unused"];
export const FOLDER_OPTIONS = ["All Folders", "Products", "Homepage", "Blog", "Unsorted"];
export const SORT_OPTIONS = [
  "Newest First",
  "Oldest First",
  "Name A–Z",
  "Name Z–A",
  "Largest First",
  "Smallest First",
];
export const PER_PAGE_OPTIONS = ["20", "40", "60", "100"];
export const SIZE_FILTER_OPTIONS = [
  { value: "0", label: "Any size" },
  { value: "1", label: "1 MB+" },
  { value: "2", label: "2 MB+" },
  { value: "5", label: "5 MB+" },
];
export const DATE_FILTER_OPTIONS = [
  { value: "all", label: "Any time" },
  { value: "today", label: "Today" },
  { value: "7", label: "Last 7 days" },
  { value: "30", label: "Last 30 days" },
];

export const USED_PRODUCT_NAMES = [
  "Nike Mercurial Vapor 15 Elite FG",
  "Nike Mercurial Vapor 15 Pro FG",
  "Nike Mercurial Vapor 15 Academy FG",
  "Nike Mercurial Vapor 15 Club FG",
  "Nike Mercurial Vapor 15 Elite AG",
  "Nike Mercurial Vapor 15 Pro AG",
  "Nike Mercurial Vapor 15 Academy AG",
  "Nike Mercurial Vapor 15 Elite MG",
  "Nike Mercurial Vapor 15 Pro MG",
  "Nike Mercurial Vapor 15 Academy MG",
  "Nike Mercurial Vapor 15 Club MG",
  "Nike Mercurial Vapor 15 Club TF",
];

export const STORAGE_USED_GB = 24.6;
export const STORAGE_TOTAL_GB = 100;

export const STATS = {
  total: "4,892",
  used: "3,672",
  usedPct: "75.1%",
  unused: "1,220",
  unusedPct: "24.9%",
  totalSize: "24.6 GB",
  recent: "186",
};

const BASE_ASSETS: [string, string, string, string, boolean][] = [
  ["nike-mercurial-vapor-15.jpg", "JPG  2400×2400", "https://images.unsplash.com/photo-1542291026-7eec264c27ff?auto=format&fit=crop&w=800&q=85", "Used in 12 products", true],
  ["adidas-predator-accuracy.jpg", "JPG  2400×2400", "https://images.unsplash.com/photo-1551107696-a4b0c5a0d9a2?auto=format&fit=crop&w=800&q=85", "Used in 8 products", true],
  ["puma-future-ultimate.jpg", "JPG  2400×2400", "https://images.unsplash.com/photo-1517466787929-bc90951d0974?auto=format&fit=crop&w=800&q=85", "Used in 6 products", true],
  ["athlete-speed-black.webp", "WEBP  2400×1333", "https://images.unsplash.com/photo-1552674605-db6ffd4facb5?auto=format&fit=crop&w=900&q=85", "Used in homepage", true],
  ["hero-banner-athlete.jpg", "JPG  2000×1333", "https://images.unsplash.com/photo-1538805060514-97d9cc17730c?auto=format&fit=crop&w=900&q=85", "Used in homepage", true],
  ["adidas-match-ball.jpg", "JPG  2400×2400", "https://images.unsplash.com/photo-1579952363873-27f3bade9f55?auto=format&fit=crop&w=800&q=85", "Used in 4 products", true],
  ["strength-training.jpg", "JPG  2000×1333", "https://images.unsplash.com/photo-1583454110551-21f2fa2afe61?auto=format&fit=crop&w=900&q=85", "Used in blog", true],
  ["stadium-night.jpg", "JPG  2400×1350", "https://images.unsplash.com/photo-1508098682722-e99c43a406b2?auto=format&fit=crop&w=900&q=85", "Used in 3 products", true],
  ["nike-backpack-black.png", "PNG  2400×2000", "https://images.unsplash.com/photo-1553062407-98eeb64c6a62?auto=format&fit=crop&w=800&q=85", "Used in 2 products", true],
  ["mercurial-sole.jpg", "PNG  2000×2000", "https://images.unsplash.com/photo-1511886929837-354d827aae26?auto=format&fit=crop&w=800&q=85", "Unused", false],
  ["warmup-session.jpg", "JPG  2000×1333", "https://images.unsplash.com/photo-1517836357463-d25dfeac3438?auto=format&fit=crop&w=900&q=85", "Unused", false],
  ["athletica-shaker.png", "PNG  2000×2000", "https://images.unsplash.com/photo-1602143407151-7111542de6e8?auto=format&fit=crop&w=800&q=85", "Unused", false],
  ["athletica-jersey.png", "PNG  2000×2000", "https://images.unsplash.com/photo-1526232761682-d26e03ac148e?auto=format&fit=crop&w=800&q=85", "Unused", false],
  ["training-cones.jpg", "JPG  2400×2400", "https://images.unsplash.com/photo-1431324155629-1a6deb1dec8d?auto=format&fit=crop&w=800&q=85", "Unused", false],
  ["gym-equipment.jpg", "JPG  2000×1333", "https://images.unsplash.com/photo-1534438327276-14e5300c3a48?auto=format&fit=crop&w=900&q=85", "Unused", false],
];

const DIMS = [
  "2400×2400",
  "2000×2000",
  "2400×1333",
  "1600×1200",
  "2000×1333",
  "1200×800",
  "3000×2000",
  "1800×1200",
];

const SIZES = [2.45, 1.4, 5.1, 8.2, 3.6, 6.7, 0.9, 4.4];

const USAGE_PATTERNS = [
  "Used in 12 products",
  "Used in 8 products",
  "Used in homepage",
  "Used in 6 products",
  "Used in blog",
  "Used in 4 products",
  "Unused",
  "Used in 3 products",
  "Used in 2 products",
  "Used in 5 products",
  "Used in homepage",
  "Unused",
];

function addedAtOf(k: number): string {
  const daysAgo = (k * 13) % 45;
  return new Date(Date.now() - daysAgo * 86400000).toISOString();
}

export function buildDefaultAssets(): MediaAsset[] {
  const assets: MediaAsset[] = [];

  for (let k = 0; k < 120; k++) {
    const [filename, meta, url, usageText, used] = BASE_ASSETS[k % 15];
    const variant = Math.floor(k / 15);

    if (variant === 0) {
      assets.push({
        id: `asset-${k}`,
        filename,
        type: (filename.split(".").pop() || "JPG").toUpperCase(),
        dims: meta.split("  ")[1] || "2400×2400",
        url,
        usageText,
        used,
        sizeMb: SIZES[k % SIZES.length],
        addedAt: addedAtOf(k),
      });
      continue;
    }

    const type = ["JPG", "PNG", "WEBP"][k % 3];
    const stem = filename.replace(/\.[^.]+$/, "");
    const text = USAGE_PATTERNS[(k * 5 + 2) % USAGE_PATTERNS.length];

    assets.push({
      id: `asset-${k}`,
      filename: `${stem}-${variant}.${type.toLowerCase()}`,
      type,
      dims: DIMS[k % DIMS.length],
      url,
      usageText: text,
      used: text !== "Unused",
      sizeMb: SIZES[k % SIZES.length],
      addedAt: addedAtOf(k),
    });
  }

  return assets;
}

export function formatBytes(bytes: number): string {
  if (!bytes) return "0 KB";
  const units = ["B", "KB", "MB", "GB"];
  const i = Math.floor(Math.log(bytes) / Math.log(1024));
  return `${(bytes / Math.pow(1024, i)).toFixed(i ? 2 : 0)} ${units[i]}`;
}

export function slugifyProduct(name: string): string {
  return `/products/${name.toLowerCase().replaceAll(" ", "-")}`;
}
import type { Brand } from "./brand-management.types";

const NAMED_BRANDS: Brand[] = [
  {
    id: "nike",
    name: "Nike",
    tagline: "Just Do It.",
    logo: "nike",
    products: 2842,
    amazonClicks: 86421,
    ctr: 9.12,
    status: "active",
    addedAt: "2025-05-12",
    slug: "nike",
  },
  {
    id: "adidas",
    name: "Adidas",
    tagline: "Impossible is Nothing.",
    logo: "adidas",
    products: 2156,
    amazonClicks: 68342,
    ctr: 8.28,
    status: "active",
    addedAt: "2025-05-10",
    slug: "adidas",
  },
  {
    id: "puma",
    name: "Puma",
    tagline: "Forever Faster.",
    logo: "puma",
    products: 1287,
    amazonClicks: 32145,
    ctr: 7.46,
    status: "active",
    addedAt: "2025-05-11",
    slug: "puma",
  },
  {
    id: "mizuno",
    name: "Mizuno",
    tagline: "Reach Beyond.",
    logo: "mizuno",
    products: 846,
    amazonClicks: 18642,
    ctr: 7.02,
    status: "active",
    addedAt: "2025-05-09",
    slug: "mizuno",
  },
  {
    id: "new-balance",
    name: "New Balance",
    tagline: "Fearlessly Independent.",
    logo: "new-balance",
    products: 732,
    amazonClicks: 16842,
    ctr: 6.89,
    status: "active",
    addedAt: "2025-05-07",
    slug: "new-balance",
  },
  {
    id: "under-armour",
    name: "Under Armour",
    tagline: "The Only Way Is Through.",
    logo: "under-armour",
    products: 689,
    amazonClicks: 15321,
    ctr: 6.74,
    status: "active",
    addedAt: "2025-05-08",
    slug: "under-armour",
  },
  {
    id: "umbro",
    name: "Umbro",
    tagline: "Our Game, Our Way.",
    logo: "umbro",
    products: 512,
    amazonClicks: 9845,
    ctr: 6.21,
    status: "inactive",
    addedAt: "2025-04-30",
    slug: "umbro",
  },
  {
    id: "asics",
    name: "ASICS",
    tagline: "Sound Mind, Sound Body.",
    logo: "asics",
    products: 468,
    amazonClicks: 8612,
    ctr: 6.04,
    status: "active",
    addedAt: "2025-05-06",
    slug: "asics",
  },
  {
    id: "reebok",
    name: "Reebok",
    tagline: "Be More Human.",
    logo: "reebok",
    products: 421,
    amazonClicks: 7812,
    ctr: 5.91,
    status: "active",
    addedAt: "2025-05-18",
    slug: "reebok",
  },
  {
    id: "diadora",
    name: "Diadora",
    tagline: "Make It Real.",
    logo: "diadora",
    products: 396,
    amazonClicks: 6942,
    ctr: 5.74,
    status: "active",
    addedAt: "2025-05-17",
    slug: "diadora",
  },
  {
    id: "joma",
    name: "Joma",
    tagline: "The Sport Makers.",
    logo: "joma",
    products: 352,
    amazonClicks: 6210,
    ctr: 5.51,
    status: "active",
    addedAt: "2025-05-16",
    slug: "joma",
  },
];

const GENERATED_NAMES = [
  "Lotto", "Kappa", "Hummel", "Jako", "Macron", "Errea", "Uhlsport", "Mitre",
  "Sondico", "Kelme", "Legea", "Patrick", "Givova", "Acerbis", "Admiral", "Bukta",
  "Penalty", "Castore", "Fila", "Ellesse", "K-Swiss", "Brooks", "Saucony", "Hoka",
  "Salomon", "Merrell", "Keen", "Teva", "Chaco", "Vans", "Converse", "Champion",
  "Russell Athletic", "Gildan", "Wilson", "Spalding", "Baden", "Molten", "Mikasa",
  "Gilbert", "Kipsta", "Dunlop", "Head", "Babolat", "Prince", "Yonex", "Stiga",
  "Donic", "Kangol", "Stance", "Thorlos", "Feetures", "Bombas", "Lululemon",
  "Gymshark", "Alo Yoga", "Vuori", "Ten Thousand", "Rhone", "Outdoor Voices",
  "Beyond Yoga", "Titleist", "Callaway", "TaylorMade", "Ping", "Cobra", "Srixon",
  "Cleveland", "Selkirk", "Tachikara", "Kap7", "Cornilleau", "Le Coq Sportif",
  "Karrimor", "Kettler", "Craft", "CEP", "Compressport", "Injinji", "Swiftwick",
  "2XU", "Roka", "Zone3", "Aquasphere", "TYR", "Arena", "Speedo", "Finis",
  "Zoggs", "Orca", "HUUB", "Santini", "Castelli", "Assos", "Rapha", "Pearl Izumi",
  "Sugoi", "Louis Garneau", "Giro", "Bell", "POC", "Smith", "Oakley",
  "Rudy Project", "Bolle", "Uvex", "Julbo", "Anon", "Dakine", "Osprey",
  "Gregory", "Deuter", "Vaude", "Haglofs", "Klattermusen", "Norrona", "Fjallraven",
];

const GENERATED_TAGLINES = [
  "Built for Performance.",
  "Game On.",
  "Born to Move.",
  "Elevate Your Game.",
  "No Limits.",
  "Play Hard.",
  "Train Different.",
  "Own the Field.",
  "Rise Up.",
  "Forward Motion.",
  "Make It Happen.",
  "Unstoppable.",
  "Every Rep Counts.",
  "Chase Greatness.",
  "Stronger Every Day.",
];

const TARGET_TOTAL_BRANDS = 128;
const TARGET_TOTAL_PRODUCTS = 12450;
const TARGET_TOTAL_CLICKS = 326842;
const TARGET_WEIGHTED_CTR = 8.74;

function mulberry32(seed: number) {
  let a = seed;
  return function next() {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

function formatDate(year: number, month: number, day: number): string {
  const mm = String(month).padStart(2, "0");
  const dd = String(day).padStart(2, "0");
  return `${year}-${mm}-${dd}`;
}

function addDays(iso: string, delta: number): string {
  const [y, m, d] = iso.split("-").map(Number);
  const date = new Date(y, m - 1, d + delta);
  return formatDate(date.getFullYear(), date.getMonth() + 1, date.getDate());
}

export function buildInitialBrands(): Brand[] {
  const namedProducts = NAMED_BRANDS.reduce((sum, b) => sum + b.products, 0);
  const namedClicks = NAMED_BRANDS.reduce((sum, b) => sum + b.amazonClicks, 0);
  const namedWeighted = NAMED_BRANDS.reduce((sum, b) => sum + b.ctr * b.amazonClicks, 0);

  const generatedCount = TARGET_TOTAL_BRANDS - NAMED_BRANDS.length;
  const generatedProducts = TARGET_TOTAL_PRODUCTS - namedProducts;
  const generatedClicks = TARGET_TOTAL_CLICKS - namedClicks;
  const generatedWeighted = TARGET_WEIGHTED_CTR * TARGET_TOTAL_CLICKS - namedWeighted;

  const rng = mulberry32(20250512);
  const activeCount = 105;
  const generated: Brand[] = [];
  let productsSum = 0;
  let clicksSum = 0;
  let weightedSum = 0;

  for (let i = 0; i < generatedCount; i += 1) {
    const isFixup = i === generatedCount - 1;
    const name = GENERATED_NAMES[i] ?? `Athletica Brand ${i + 1}`;
    const id = name
      .toLowerCase()
      .replace(/[^a-z0-9]+/g, "-")
      .replace(/^-|-$/g, "");

    if (isFixup) {
      const products = generatedProducts - productsSum;
      const clicks = generatedClicks - clicksSum;
      const ctr = Math.min(30, Math.max(0.5, (generatedWeighted - weightedSum) / clicks));
      generated.push({
        id,
        name,
        tagline: GENERATED_TAGLINES[i % GENERATED_TAGLINES.length],
        logo: id,
        products,
        amazonClicks: clicks,
        ctr: Math.round(ctr * 100) / 100,
        status: i < activeCount ? "active" : "inactive",
        addedAt: addDays("2025-05-15", -i),
        slug: id,
      });
      continue;
    }

    const products = 9 + Math.floor(rng() * 7);
    const clicks = 30 + Math.floor(rng() * 721);
    const ctr = Math.round((13.6 + (rng() - 0.5) * 2.4) * 100) / 100;
    productsSum += products;
    clicksSum += clicks;
    weightedSum += ctr * clicks;
    generated.push({
      id,
      name,
      tagline: GENERATED_TAGLINES[i % GENERATED_TAGLINES.length],
      logo: id,
      products,
      amazonClicks: clicks,
      ctr,
      status: i < activeCount ? "active" : "inactive",
      addedAt: addDays("2025-05-15", -i),
      slug: id,
    });
  }

  return [...NAMED_BRANDS, ...generated];
}

export const INITIAL_BRANDS: Brand[] = buildInitialBrands();

export function formatBrandDate(iso: string): string {
  const [y, m, d] = iso.split("-").map(Number);
  const months = ["Jan", "Feb", "Mar", "Apr", "May", "Jun", "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"];
  return `${months[(m ?? 1) - 1]} ${d}, ${y}`;
}

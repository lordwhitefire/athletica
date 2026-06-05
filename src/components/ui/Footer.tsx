import Link from "next/link";
import { client } from "@/lib/sanity";

interface SocialLink { label: string; url: string; icon: string }
interface FooterLink { label: string; href: string }
interface LinkColumn { title: string; links: FooterLink[] }
interface FooterData {
  brand_name?: string;
  brand_description?: string;
  social_links?: SocialLink[];
  link_columns?: LinkColumn[];
  copyright?: string;
  bottom_tags?: string[];
}

async function getFooterData(): Promise<FooterData> {
  try {
    const doc = await client.fetch(`*[_type == "siteSettings"][0]{footer}`);
    return doc?.footer || {};
  } catch {
    return {};
  }
}

export default async function Footer({ siteLogoUrl }: { siteLogoUrl?: string | null }) {
  const year = new Date().getFullYear();
  const {
    brand_name = "Athletica",
    brand_description = "Premium equipment for the professional athlete. Engineered for peak performance and unparalleled style.",
    social_links = [
      { label: "Website", url: "#", icon: "public" },
      { label: "Email", url: "#", icon: "mail" },
    ],
    link_columns = [
      { title: "Store", links: [{ label: "Football Boots", href: "/football-boots" }] },
    ],
    copyright = "Athletica Performance. Engineered for Excellence.",
    bottom_tags = ["Fast Global Shipping", "Secure Payments", "Elite Service"],
  } = await getFooterData();

  return (
    <footer className="bg-zinc-900 w-full pt-16 pb-8">

      {/* Main grid */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-12 px-8 max-w-screen-2xl mx-auto font-body text-sm tracking-wide">

        {/* Brand column */}
        <div className="md:col-span-1">
          <Link href="/">
            {siteLogoUrl ? (
              <img src={siteLogoUrl} alt={brand_name} className="w-32 h-auto mb-4" />
            ) : (
              <div className="text-3xl font-black text-white italic font-headline mb-4">
                {brand_name}
              </div>
            )}
          </Link>
          <p className="text-zinc-400 mb-6 leading-relaxed">
            {brand_description}
          </p>
          <div className="flex gap-4">
            {social_links.filter((s) => s.url && s.url !== "#").length > 0
              ? social_links.filter((s) => s.url && s.url !== "#").map((s) => (
                  <a
                    key={s.label}
                    href={s.url}
                    aria-label={s.label}
                    className="text-zinc-400 hover:text-white transition-colors"
                  >
                    <span className="material-symbols-outlined">{s.icon}</span>
                  </a>
                ))
              : social_links.map((s) => (
                  <a
                    key={s.label}
                    href={s.url}
                    aria-label={s.label}
                    className="text-zinc-400 hover:text-white transition-colors"
                  >
                    <span className="material-symbols-outlined">{s.icon}</span>
                  </a>
                ))}
          </div>
        </div>

        {/* Link columns */}
        {link_columns.slice(0, 3).map((col) => (
          <div key={col.title}>
            <h4 className="text-white font-bold uppercase tracking-widest text-xs mb-6">
              {col.title}
            </h4>
            <ul className="space-y-4">
              {col.links.map((link) => (
                <li key={link.href || link.label}>
                  <Link
                    href={link.href}
                    className="text-zinc-400 hover:text-white transition-colors"
                  >
                    {link.label}
                  </Link>
                </li>
              ))}
            </ul>
          </div>
        ))}
      </div>

      {/* Bottom bar */}
      <div className="max-w-screen-2xl mx-auto px-8 pt-16 border-t border-zinc-800 mt-12 flex flex-col md:flex-row justify-between items-center gap-4 text-zinc-500 text-[10px] uppercase font-bold tracking-[0.2em]">
        <div>© {year} {copyright}</div>
        <div className="flex flex-wrap justify-center gap-3 md:gap-6 max-w-full">
          {bottom_tags.map((tag) => (
            <span key={tag} className="truncate max-w-[200px]">{tag}</span>
          ))}
        </div>
      </div>
    </footer>
  );
}

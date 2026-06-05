"use client";

import { useRouter } from "next/navigation";
import { useState } from "react";
import ImageSelector from "@/components/admin/ImageSelector";
import AutoSuggest from "@/components/admin/AutoSuggest";
import { suggestRoutes, suggestMaterialIcons } from "@/lib/actions/suggestions";
import { saveSiteSettings } from "@/lib/actions/siteSettings";

function assetRef(img: unknown): string | null {
  if (!img || typeof img !== "object") return null;
  const asset = (img as Record<string, unknown>).asset;
  if (!asset || typeof asset !== "object") return null;
  const ref = (asset as Record<string, unknown>)._ref;
  return typeof ref === "string" ? ref : null;
}

const DEFAULT_BRAND_NAME = "Athletica";
const DEFAULT_BRAND_DESC = "Premium equipment for the professional athlete. Engineered for peak performance and unparalleled style.";
const DEFAULT_SOCIALS = [
  { label: "Website", url: "#", icon: "public" },
  { label: "Email", url: "#", icon: "mail" },
];
const DEFAULT_LINK_COLUMNS = [
  {
    title: "Store",
    links: [
      { label: "Football Boots", href: "/football-boots" },
      { label: "Goalkeeper Gloves", href: "/goalkeeper-gloves" },
      { label: "Other Products", href: "/other-products" },
    ],
  },
  {
    title: "Account",
    links: [
      { label: "My Account", href: "/account" },
      { label: "Order Status", href: "/orders" },
      { label: "Returns", href: "/returns" },
    ],
  },
  {
    title: "Support",
    links: [
      { label: "Privacy Policy", href: "/privacy-policy" },
      { label: "Terms of Service", href: "/terms" },
      { label: "Cookie Settings", href: "/cookies" },
    ],
  },
];
const DEFAULT_COPYRIGHT = "Athletica Performance. Engineered for Excellence.";
const DEFAULT_TAGS = ["Fast Global Shipping", "Secure Payments", "Elite Service"];

interface SocialLink { label: string; url: string; icon: string }
interface FooterLink { label: string; href: string }
interface LinkColumn { title: string; links: FooterLink[] }

function footerVal(doc: Record<string, unknown> | null, path: string, defaultValue: string): string {
  if (!doc?.footer) return defaultValue;
  const f = doc.footer as Record<string, unknown>;
  const v = f[path];
  return (typeof v === "string" ? v : defaultValue);
}

function footerArr<T>(doc: Record<string, unknown> | null, path: string, defaultArr: T[]): T[] {
  if (!doc?.footer) return defaultArr;
  const f = doc.footer as Record<string, unknown>;
  const v = f[path];
  return Array.isArray(v) ? (v as T[]) : defaultArr;
}

export default function SiteSettingsForm({ doc }: { doc: Record<string, unknown> | null }) {
  const router = useRouter();
  const [saving, setSaving] = useState(false);
  const [siteLogoAsset, setSiteLogoAsset] = useState<string | null>(assetRef(doc?.site_logo));
  const [brandName, setBrandName] = useState(footerVal(doc, "brand_name", DEFAULT_BRAND_NAME));
  const [brandDesc, setBrandDesc] = useState(footerVal(doc, "brand_description", DEFAULT_BRAND_DESC));
  const [socialLinks, setSocialLinks] = useState<SocialLink[]>(footerArr<SocialLink>(doc, "social_links", DEFAULT_SOCIALS));
  const [linkColumns, setLinkColumns] = useState<LinkColumn[]>(footerArr<LinkColumn>(doc, "link_columns", DEFAULT_LINK_COLUMNS));
  const [copyright, setCopyright] = useState(footerVal(doc, "copyright", DEFAULT_COPYRIGHT));
  const [bottomTags, setBottomTags] = useState<string[]>(footerArr<string>(doc, "bottom_tags", DEFAULT_TAGS));

  function handleSocialChange(i: number, field: keyof SocialLink, value: string) {
    setSocialLinks((prev) => prev.map((item, idx) => idx === i ? { ...item, [field]: value } : item));
  }
  function addSocial() { setSocialLinks((prev) => [...prev, { label: "", url: "", icon: "" }]); }
  function removeSocial(i: number) { setSocialLinks((prev) => prev.filter((_, idx) => idx !== i)); }

  function handleColumnTitle(i: number, value: string) {
    setLinkColumns((prev) => prev.map((col, idx) => idx === i ? { ...col, title: value } : col));
  }
  function handleColumnLink(colI: number, linkI: number, field: keyof FooterLink, value: string) {
    setLinkColumns((prev) => prev.map((col, ci) =>
      ci === colI
        ? { ...col, links: col.links.map((link, li) => li === linkI ? { ...link, [field]: value } : link) }
        : col
    ));
  }
  function addColumn() { setLinkColumns((prev) => [...prev, { title: "", links: [] }]); }
  function removeColumn(i: number) { setLinkColumns((prev) => prev.filter((_, idx) => idx !== i)); }
  function addColumnLink(colI: number) {
    setLinkColumns((prev) => prev.map((col, ci) =>
      ci === colI && col.links.length < 4
        ? { ...col, links: [...col.links, { label: "", href: "" }] }
        : col
    ));
  }
  function removeColumnLink(colI: number, linkI: number) {
    setLinkColumns((prev) => prev.map((col, ci) =>
      ci === colI
        ? { ...col, links: col.links.filter((_, li) => li !== linkI) }
        : col
    ));
  }

  function addTag() { setBottomTags((prev) => [...prev, ""]); }
  function changeTag(i: number, value: string) {
    setBottomTags((prev) => prev.map((t, idx) => idx === i ? value : t));
  }
  function removeTag(i: number) { setBottomTags((prev) => prev.filter((_, idx) => idx !== i)); }

  async function handleSubmit(e: React.FormEvent<HTMLFormElement>) {
    e.preventDefault();
    setSaving(true);
    const data = new FormData();
    data.set("site_logo_asset", siteLogoAsset || "");
    data.set("brand_name", brandName);
    data.set("brand_description", brandDesc);
    data.set("social_links", JSON.stringify(socialLinks));
    data.set("link_columns", JSON.stringify(linkColumns));
    data.set("copyright", copyright);
    data.set("bottom_tags", JSON.stringify(bottomTags));

    try {
      await saveSiteSettings(data);
      router.refresh();
      alert("Saved!");
    } catch (err) {
      console.error(err);
      alert("Failed to save");
    } finally {
      setSaving(false);
    }
  }

  return (
    <form onSubmit={handleSubmit} className="max-w-2xl space-y-8">
      <h1 className="text-2xl font-black uppercase tracking-tight">Site Settings</h1>

      <Section title="Site Logo">
        <ImageSelector name="site_logo_sel" label="Site Logo" value={siteLogoAsset} onChange={setSiteLogoAsset} />
      </Section>

      <Section title="Footer — Brand Identity">
        <CharField label="Brand Name" value={brandName} onChange={setBrandName} max={30} />
        <CharField label="Brand Description" value={brandDesc} onChange={setBrandDesc} max={200} textarea />
      </Section>

      <Section title="Footer — Social Links">
        <p className="text-xs text-zinc-500 mb-3">Each link shows as an icon in the footer.</p>
        {socialLinks.map((link, i) => (
          <div key={i} className="flex flex-wrap items-end gap-2 mb-2">
            <input placeholder="Label" value={link.label} onChange={(e) => handleSocialChange(i, "label", e.target.value)}
              className="min-w-0 flex-1 basis-[120px] px-2.5 py-1.5 bg-neutral-800 border border-neutral-700 text-white rounded text-xs" />
            <input placeholder="URL" value={link.url} onChange={(e) => handleSocialChange(i, "url", e.target.value)}
              className="min-w-0 flex-1 basis-[120px] px-2.5 py-1.5 bg-neutral-800 border border-neutral-700 text-white rounded text-xs" />
            <div className="w-24 min-w-0 flex-none">
              <AutoSuggest value={link.icon} onChange={(v) => handleSocialChange(i, "icon", v)}
                fetchSuggestions={suggestMaterialIcons} label="Icon" hideLabel />
            </div>
            <button type="button" onClick={() => removeSocial(i)} className="text-red-500 hover:text-red-400 p-1 text-xs">×</button>
          </div>
        ))}
        <button type="button" onClick={addSocial} className="text-xs text-red-500 hover:text-red-400 font-medium flex items-center gap-1">
          <span className="material-symbols-outlined text-[14px]">add</span> Add Social Link
        </button>
      </Section>

      <Section title="Footer — Link Columns">
        <p className="text-xs text-zinc-500 mb-3">Each column appears in the footer. Max 4 links per column.</p>
        {linkColumns.map((col, ci) => (
          <div key={ci} className="bg-neutral-800 border border-neutral-700 rounded p-4 mb-3 space-y-3">
            <div className="flex items-center justify-between">
              <input placeholder="Column Title" value={col.title} onChange={(e) => handleColumnTitle(ci, e.target.value)}
                className="flex-1 px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 text-white rounded text-xs font-bold uppercase tracking-wider" />
              <button type="button" onClick={() => removeColumn(ci)} className="text-red-500 hover:text-red-400 text-xs ml-2">Remove Column</button>
            </div>
            <p className="text-[10px] text-zinc-600 uppercase tracking-wider">Links ({col.links.length}/4)</p>
            {col.links.map((link, li) => (
              <div key={li} className="flex flex-wrap items-end gap-2">
                <input placeholder="Label" value={link.label} onChange={(e) => handleColumnLink(ci, li, "label", e.target.value)}
                  className="min-w-0 flex-1 basis-[140px] px-2.5 py-1.5 bg-neutral-900 border border-neutral-700 text-white rounded text-xs" />
                <div className="min-w-0 flex-[2] basis-[140px]">
                  <AutoSuggest value={link.href} onChange={(v) => handleColumnLink(ci, li, "href", v)}
                    fetchSuggestions={suggestRoutes} label="URL" hideLabel />
                </div>
                <button type="button" onClick={() => removeColumnLink(ci, li)} className="text-red-500 hover:text-red-400 p-1 text-xs">×</button>
              </div>
            ))}
            {col.links.length < 4 && (
              <button type="button" onClick={() => addColumnLink(ci)} className="text-xs text-red-500 hover:text-red-400 font-medium flex items-center gap-1">
                <span className="material-symbols-outlined text-[14px]">add</span> Add Link
              </button>
            )}
          </div>
        ))}
        <button type="button" onClick={addColumn} className="text-sm text-red-500 hover:text-red-400 font-medium flex items-center gap-1">
          <span className="material-symbols-outlined text-[16px]">add</span> Add Column
        </button>
      </Section>

      <Section title="Footer — Bottom Bar">
        <CharField label="Copyright Text" value={copyright} onChange={setCopyright} max={100} />
        <div>
          <div className="flex items-center justify-between mb-1">
            <label className="block text-zinc-400 text-xs font-medium uppercase tracking-wider">Bottom Tags</label>
            <span className="text-[10px] font-mono text-zinc-600">{bottomTags.length}/6</span>
          </div>
          {bottomTags.map((tag, i) => (
            <div key={i} className="flex items-end gap-2 mb-2">
              <input value={tag} onChange={(e) => changeTag(i, e.target.value)}
                className="flex-1 px-2.5 py-1.5 bg-neutral-800 border border-neutral-700 text-white rounded text-xs" />
              <button type="button" onClick={() => removeTag(i)} className="text-red-500 hover:text-red-400 p-1 text-xs">×</button>
            </div>
          ))}
          <button type="button" onClick={addTag} className="text-xs text-red-500 hover:text-red-400 font-medium flex items-center gap-1">
            <span className="material-symbols-outlined text-[14px]">add</span> Add Tag
          </button>
        </div>
      </Section>

      <div className="flex gap-3">
        <button type="submit" disabled={saving} className="bg-red-600 hover:bg-red-700 disabled:opacity-50 text-white font-bold px-6 py-2.5 rounded transition-colors">
          {saving ? "Saving..." : "Save Settings"}
        </button>
      </div>
    </form>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div className="bg-neutral-900 border border-neutral-800 rounded p-6">
      <h2 className="text-sm font-bold uppercase tracking-wider text-zinc-400 mb-4 pb-3 border-b border-neutral-800">{title}</h2>
      {children}
    </div>
  );
}

function CharField({ label, value, onChange, max, textarea }: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  max: number;
  textarea?: boolean;
}) {
  const charsLeft = max - value.length;
  const isOver = charsLeft < 0;
  return (
    <div>
      <div className="flex items-center justify-between mb-1">
        <label className="block text-zinc-400 text-xs font-medium uppercase tracking-wider">{label}</label>
        <span className={`text-[10px] font-mono ${isOver ? "text-red-500" : "text-zinc-600"}`}>
          {charsLeft}
        </span>
      </div>
      {textarea ? (
        <textarea value={value} onChange={(e) => onChange(e.target.value)} rows={3}
          className={`w-full px-3 py-2 bg-neutral-800 border text-white rounded text-sm focus:outline-none focus:border-red-600 transition-colors ${isOver ? "border-red-600" : "border-neutral-700"}`} />
      ) : (
        <input type="text" value={value} onChange={(e) => onChange(e.target.value)}
          className={`w-full px-3 py-2 bg-neutral-800 border text-white rounded text-sm focus:outline-none focus:border-red-600 transition-colors ${isOver ? "border-red-600" : "border-neutral-700"}`} />
      )}
    </div>
  );
}

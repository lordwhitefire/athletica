"use client";

import AutoSuggest from "../AutoSuggest";
import ImageSelector from "../ImageSelector";
import InfoTooltip from "@/components/ui/InfoTooltip";
import { suggestRoutes } from "@/lib/actions/suggestions";
import { sanityCdnUrl } from "@/lib/sanity-client";
import HeroCarousel from "@/components/homepage/HeroCarousel";
import type { BannerState } from "./types";

interface BannerFormProps {
    banner: BannerState;
    allBanners: BannerState[];
    onUpdate: (field: keyof BannerState, value: string | null) => void;
}

/**
 * Popup form contents for a single hero banner. Same fields as the old
 * inline editor — title, subtitle, button text, link, gradient, accent
 * color, banner image — plus a FULL-SIZE live preview of the entire
 * HeroCarousel (so the editor sees the banner in context, not in
 * isolation, and not scaled down to 60%). Bug #8 from the issues doc.
 *
 * Note: the `accent_color` field is NOT new — it was already in the data
 * model and was being saved and passed to the preview. What's new is
 * that there's now an input for it (the old editor had one already for
 * banners, but the bug doc called out that it was missing for grid
 * items; see CategoryGridForm.tsx for that fix). Bug #5.
 */
export default function BannerForm({ banner, allBanners, onUpdate }: BannerFormProps) {
    return (
        <div className="space-y-5">
            <Field label="Title" tooltip="The main headline text for the banner">
                <input
                    type="text"
                    value={banner.title}
                    onChange={(e) => onUpdate("title", e.target.value)}
                    className={inputCls}
                    placeholder="Enter banner title..."
                />
            </Field>

            <Field label="Subtitle" tooltip="Secondary text that appears below the title">
                <input
                    type="text"
                    value={banner.subtitle}
                    onChange={(e) => onUpdate("subtitle", e.target.value)}
                    className={inputCls}
                    placeholder="Enter subtitle..."
                />
            </Field>

            <Field label="Button Text" tooltip="Text on the call-to-action button">
                <input
                    type="text"
                    value={banner.button_text}
                    onChange={(e) => onUpdate("button_text", e.target.value)}
                    className={inputCls}
                    placeholder="Shop Now"
                />
            </Field>

            <Field label="Link" tooltip="Page to navigate to when button is clicked">
                <AutoSuggest
                    label="Link"
                    value={banner.link}
                    onChange={(value) => onUpdate("link", value)}
                    fetchSuggestions={suggestRoutes}
                    placeholder="/path/to/page"
                />
            </Field>

            <Field label="Gradient" tooltip="Background gradient for the banner (Tailwind classes)">
                <input
                    type="text"
                    value={banner.gradient}
                    onChange={(e) => onUpdate("gradient", e.target.value)}
                    className={inputCls}
                    placeholder="from-gray-900 via-gray-800 to-red-900"
                />
            </Field>

            <Field label="Accent Color" tooltip="Highlight color for accents and buttons">
                <div className="flex items-center gap-2">
                    <input
                        type="color"
                        value={banner.accent_color || "#d1fd40"}
                        onChange={(e) => onUpdate("accent_color", e.target.value)}
                        className="h-10 w-12 bg-neutral-800 border border-neutral-700 rounded cursor-pointer"
                        aria-label="Accent color picker"
                    />
                    <input
                        type="text"
                        value={banner.accent_color}
                        onChange={(e) => onUpdate("accent_color", e.target.value)}
                        className={`${inputCls} flex-1`}
                        placeholder="#d1fd40"
                    />
                </div>
            </Field>

            <Field label="Banner Image" tooltip="Large background image for the banner">
                <ImageSelector
                    name={`banner-image-${banner.index}`}
                    value={banner.image || ""}
                    onChange={(value) => onUpdate("image", value)}
                    label="Banner Image"
                />
                {banner.image && (
                    <div className="mt-3">
                        {/* eslint-disable-next-line @next/next/no-img-element */}
                        <img
                            src={sanityCdnUrl(banner.image)}
                            alt={banner.title}
                            className="w-full h-24 rounded object-cover"
                        />
                    </div>
                )}
            </Field>

            {/* The preview slot — rendered by EditPopup's `preview` prop.
                We export a separate Preview component so the parent can
                pass it in, since the preview shows the WHOLE carousel
                (all banners), not just this one. */}
        </div>
    );
}

/**
 * Full-size HeroCarousel preview for the popup's right panel. Pass the
 * full banner list — the carousel shows whichever banner is currently
 * active, but editing this banner's fields updates the carousel state
 * in real time.
 */
export function BannerPreview({ banners }: { banners: BannerState[] }) {
    if (banners.length === 0) {
        return (
            <div className="text-xs text-zinc-500 p-6 text-center">
                Add at least one banner to see a preview.
            </div>
        );
    }
    return (
        <div className="rounded overflow-hidden">
            <HeroCarousel
                banners={banners.map(b => ({
                    id: b._key,
                    title: b.title,
                    subtitle: b.subtitle,
                    button_text: b.button_text,
                    link: b.link,
                    gradient: b.gradient,
                    accent_color: b.accent_color,
                    image: b.image ? sanityCdnUrl(b.image) : null,
                }))}
                autoSwitchMs={10000}
            />
        </div>
    );
}

const inputCls = "w-full px-3 py-2 bg-neutral-800 border border-neutral-700 text-white rounded text-sm focus:outline-none focus:border-primary transition-colors";

function Field({
    label,
    tooltip,
    children,
}: {
    label: string;
    tooltip: string;
    children: React.ReactNode;
}) {
    return (
        <div>
            <label className="flex items-center gap-2 mb-1">
                <span className="text-xs text-zinc-500">{label}</span>
                <InfoTooltip text={tooltip} />
            </label>
            {children}
        </div>
    );
}

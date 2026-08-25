import { getSiteSettingsDoc } from "@/lib/actions/siteSettings";
import { getMainCategoryHref, getMainCategoryLabel } from "@/lib/content/content-service";
import SettingsClient from "./SettingsClient";

export const dynamic = "force-dynamic";

export default async function AdminSettingsRoute() {
    // Site-settings capability merged in from the retired /admin/site-settings
    // page (WP5 archive-after-parity): the same editor now lives inside the
    // dashboard-v2 shell under /admin/settings.
    const [siteSettings, mainCategoryHref, mainCategoryLabel] = await Promise.all([
        getSiteSettingsDoc(),
        getMainCategoryHref(),
        getMainCategoryLabel(),
    ]);

    return (
        <SettingsClient
            siteSettings={{
                doc: siteSettings.data,
                mainCategoryHref,
                mainCategoryLabel,
                loadError: siteSettings.error?.message ?? null,
            }}
        />
    );
}

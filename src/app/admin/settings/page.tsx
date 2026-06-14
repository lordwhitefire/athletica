import { getSiteSettingsDoc, saveSiteSettings } from "@/lib/actions/siteSettings";
import { getMainCategoryHref, getMainCategoryLabel } from "@/lib/getNavigation";
import SiteSettingsForm from "./SiteSettingsForm";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const result = await getSiteSettingsDoc();
  const mainCategoryHref = await getMainCategoryHref();
  const mainCategoryLabel = await getMainCategoryLabel();
  return <SiteSettingsForm doc={result.data} mainCategoryHref={mainCategoryHref} mainCategoryLabel={mainCategoryLabel} />;
}

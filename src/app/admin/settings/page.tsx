import { getSiteSettingsDoc, saveSiteSettings } from "@/lib/actions/siteSettings";
import SiteSettingsForm from "./SiteSettingsForm";

export const dynamic = "force-dynamic";

export default async function AdminSettingsPage() {
  const result = await getSiteSettingsDoc();
  return <SiteSettingsForm doc={result.data} />;
}

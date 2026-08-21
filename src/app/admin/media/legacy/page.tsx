import { getMediaAssets } from "@/lib/actions/media";
import MediaBrowser from "@/components/admin/MediaBrowser";

export default async function AdminMediaLegacyPage() {
    const result = await getMediaAssets();
    return <MediaBrowser assets={(result.data ?? []) as Record<string, unknown>[]} />;
}
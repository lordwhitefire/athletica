import { getMediaAssets } from "@/lib/actions/media";
import MediaBrowser from "@/components/admin/MediaBrowser";

export default async function AdminMediaPage() {
    const assets = await getMediaAssets();
    return <MediaBrowser assets={assets} />;
}

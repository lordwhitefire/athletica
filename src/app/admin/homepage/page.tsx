import { getHomepageDoc } from "@/lib/actions/homepage";
import HomepageEditor from "@/components/admin/HomepageEditor";

export default async function AdminHomepagePage() {
    const doc = await getHomepageDoc();
    return <HomepageEditor doc={doc} />;
}

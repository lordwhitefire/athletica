import { getHomepageDoc } from "@/lib/actions/homepage";
import HomepageEditor from "@/components/admin/HomepageEditor";

export default async function AdminHomepagePage() {
    const result = await getHomepageDoc();

    if (result.error) {
        throw new Error(result.error.message);
    }

    return <HomepageEditor doc={result.data} />;
}

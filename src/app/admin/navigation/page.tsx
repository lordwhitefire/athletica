import { getNavigationDoc } from "@/lib/actions/navigation";
import NavigationEditor from "@/components/admin/NavigationEditor";

export default async function AdminNavigationPage() {
    const result = await getNavigationDoc();
    return <NavigationEditor doc={result.data} />;
}

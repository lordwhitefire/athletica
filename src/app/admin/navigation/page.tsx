import { getNavigationDoc } from "@/lib/actions/navigation";
import NavigationEditor from "@/components/admin/NavigationEditor";

export default async function AdminNavigationPage() {
    const doc = await getNavigationDoc();
    return <NavigationEditor doc={doc} />;
}

import { getNavigationDoc } from "@/lib/actions/navigation";
import { InteractionProvider } from "@/components/admin/dashboard-v2/interaction-store";
import SpecSidebar from "@/components/admin/dashboard-v2/SpecSidebar";
import MobileTopbar from "@/components/admin/dashboard-v2/MobileTopbar";
import NavigationEditor from "@/components/admin/NavigationEditor";

export default async function AdminNavigationPage() {
    const result = await getNavigationDoc();
    return (
        <InteractionProvider>
            <SpecSidebar />
            <MobileTopbar />
            <div className="min-h-screen ml-0 max-[1100px]:min-[761px]:ml-16 min-[1101px]:ml-64 max-[760px]:pt-14 p-4 md:p-8">
                <NavigationEditor doc={result.data} />
            </div>
        </InteractionProvider>
    );
}

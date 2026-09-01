"use client";

import { use } from "react";
import { InteractionProvider } from "@/components/admin/dashboard-v2/interaction-store";
import SpecSidebar from "@/components/admin/dashboard-v2/SpecSidebar";
import MobileTopbar from "@/components/admin/dashboard-v2/MobileTopbar";
import ProductFullEditor from "@/components/admin/dashboard-v2/ProductFullEditor";

export default function EditProductPage({ params }: { params: Promise<{ id: string }> }) {
    const { id } = use(params);
    return (
        <InteractionProvider>
            <SpecSidebar />
            <MobileTopbar />
            <div className="min-h-screen ml-0 max-[1100px]:min-[761px]:ml-16 min-[1101px]:ml-64 max-[760px]:pt-14">
                <ProductFullEditor mode="edit" productId={id} />
            </div>
        </InteractionProvider>
    );
}

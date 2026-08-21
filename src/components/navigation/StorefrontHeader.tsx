"use client";

import { usePathname } from "next/navigation";
import Header from "@/components/navigation/Header";
import type { NavigationData } from "@/types/navigation";

export default function StorefrontHeader({
    navigation,
    siteLogoUrl,
}: {
    navigation: NavigationData[];
    siteLogoUrl?: string | null;
}) {
    const pathname = usePathname();

    if (pathname.startsWith("/admin")) return null;

    return <Header navigation={navigation} siteLogoUrl={siteLogoUrl ?? null} />;
}
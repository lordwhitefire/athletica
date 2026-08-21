"use client";

import { ReactNode } from "react";
import { usePathname } from "next/navigation";

export default function HideOnAdmin({ children }: { children: ReactNode }) {
    const pathname = usePathname();

    if (pathname.startsWith("/admin")) return null;

    return <>{children}</>;
}
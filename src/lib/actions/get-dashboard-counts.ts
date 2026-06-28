"use server";

import { getDashboardCounts as fetchCounts } from "@/lib/getDashboardCounts";

export async function getDashboardCounts() {
    return fetchCounts();
}

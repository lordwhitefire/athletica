export const dynamic = "force-dynamic";

import AdminGuard from "./AdminGuard";
import { after } from "next/server";
import { cookies } from "next/headers";
import { adminDbSnapshotHeartbeat } from "@/lib/backup/snapshot";

export default async function AdminLayout({ children }: { children: React.ReactNode }) {
    // WP-R2-C: automatic rolling DB snapshots. Request data (cookies) is read
    // HERE during render — Next.js forbids touching it inside after() — then
    // handed to the heartbeat. The snapshot work itself runs AFTER the
    // response is sent and can never block or fail the render (all errors are
    // swallowed and logged server-side with a [db-snapshot] prefix).
    const cookieStore = await cookies();

    after(async () => {
        await adminDbSnapshotHeartbeat(cookieStore);
    });

    return <AdminGuard>{children}</AdminGuard>;
}

import { requireAdmin } from '@/lib/auth/admin';
import { AdminHeader } from '@/components/admin/AdminHeader';
import { MediaLibrary } from '@/components/admin/MediaLibrary';
import '@/components/admin/admin-workspace.css';

export const dynamic = 'force-dynamic';

export default async function AdminMediaPage() {
  const admin = await requireAdmin();
  if (admin.response) return admin.response;

  return (
    <>
      <AdminHeader />
      <main className="admin-analytics-page">
        <MediaLibrary />
      </main>
    </>
  );
}

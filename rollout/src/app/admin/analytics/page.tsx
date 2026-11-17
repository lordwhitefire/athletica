// FM-14: /admin/analytics dashboard — live (SSE), honest empty states, no fake zeros.
import { requireAdmin } from '@/lib/auth/admin';
import { AnalyticsDashboard } from '@/components/admin/AnalyticsDashboard';
import { AdminHeader } from '@/components/admin/AdminHeader';
import '@/components/admin/admin-workspace.css';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const admin = await requireAdmin();
  if (admin.response) return admin.response;
  return (
    <>
      <AdminHeader />
      <main className="admin-analytics-page">
        <header className="admin-analytics-heading">
          <div>
            <p className="admin-analytics-eyebrow">PERFORMANCE OVERVIEW</p>
            <h1 className="admin-analytics-title">Analytics</h1>
            <p className="admin-analytics-subtitle">Understand product discovery, retailer handoffs and affiliate performance.</p>
          </div>
        </header>
        <AnalyticsDashboard streamUrl="/api/admin/analytics/stream" />
      </main>
    </>
  );
}

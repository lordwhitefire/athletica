// FM-14: /admin/analytics dashboard — live (SSE), honest empty states, no fake zeros.
import { requireAdmin } from '@/lib/auth/admin';
import { AnalyticsDashboard } from '@/components/admin/AnalyticsDashboard';

export const dynamic = 'force-dynamic';

export default async function Page() {
  const admin = await requireAdmin();
  if (admin.response) return admin.response;
  return (
    <section className="mx-auto max-w-[1440px] px-4 py-8">
      <h1 className="mb-6 text-2xl font-bold text-white">Analytics</h1>
      <AnalyticsDashboard streamUrl="/api/admin/analytics/stream" />
    </section>
  );
}

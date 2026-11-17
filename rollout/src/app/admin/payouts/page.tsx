import { requireAdmin } from '@/lib/auth/admin';
import AffiliateWorkspace from '@/components/affiliate/AffiliateWorkspace';
export default async function Page() {
  const admin = await requireAdmin();
  if (admin.response) return admin.response;
  return <AffiliateWorkspace view="admin-payouts" />;
}

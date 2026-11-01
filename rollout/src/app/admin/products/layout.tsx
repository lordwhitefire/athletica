import { requireAdmin } from '@/lib/auth/admin';
import { notFound } from 'next/navigation';

export default async function AdminProductsLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const admin = await requireAdmin();
  if (admin.response) {
    notFound();
  }

  return <div className="admin-products-layout">{children}</div>;
}

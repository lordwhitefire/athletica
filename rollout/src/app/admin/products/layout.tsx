import Link from 'next/link';
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

  return (
    <div className="admin-products-layout">
      <header className="admin-header">
        <Link href="/admin/products" className="admin-brand">
          Athletica Admin
        </Link>
        <form action="/api/admin/auth/signout" method="POST" className="admin-signout">
          <button type="submit" className="admin-btn admin-btn--secondary">
            Sign out
          </button>
        </form>
      </header>
      <main className="admin-main">{children}</main>
    </div>
  );
}

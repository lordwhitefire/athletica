import Link from 'next/link';

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <div className="admin-layout">
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

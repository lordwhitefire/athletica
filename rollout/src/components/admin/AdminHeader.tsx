import Link from 'next/link';
import './admin-workspace.css';

export function AdminHeader() {
  return (
    <header className="admin-workspace-header">
      <Link href="/admin/products" className="admin-workspace-brand">
        <span className="admin-workspace-brand__mark">A</span>
        <span><strong>ATHLETICA</strong><small>OPERATIONS</small></span>
      </Link>
      <nav className="admin-workspace-nav" aria-label="Admin navigation">
        <Link href="/admin/products">Products</Link>
        <Link href="/admin/media">Media</Link>
        <Link href="/admin/analytics">Analytics</Link>
      </nav>
      <form action="/api/admin/auth/signout" method="POST">
        <button className="admin-workspace-signout" type="submit">Sign out</button>
      </form>
    </header>
  );
}

// FM-06: Footer — meta content + legal links (FM-24 wires the legal pages).
import Link from 'next/link';
export function Footer() {
  return (
    <footer className="mx-auto max-w-[1440px] px-4 py-12 text-sm text-neutral-400">
      <div className="flex flex-col gap-2 md:flex-row md:justify-between">
        <span>Athletica — football affiliate marketplace</span>
        <nav className="flex gap-4">
          <Link href="/privacy">Privacy</Link>
          <Link href="/terms">Terms</Link>
          <Link href="/cookie-notice">Cookies</Link>
          <Link href="/affiliate-agreement">Affiliate Agreement</Link>
        </nav>
      </div>
      <p className="mt-4 text-xs">As an Amazon Associate I earn from qualifying purchases.</p>
    </footer>
  );
}

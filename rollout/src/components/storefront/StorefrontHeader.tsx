import Link from 'next/link';
import './storefront.css';

export function StorefrontHeader() {
  return (
    <header className="storefront-header">
      <div className="storefront-header__inner">
        <Link href="/" className="storefront-wordmark" aria-label="Athletica home">
          ATHLETICA<span>.</span>
        </Link>
        <nav className="storefront-nav" aria-label="Main navigation">
          <Link href="/shop" className="storefront-nav__link">Shop</Link>
          <Link href="/affiliate-agreement" className="storefront-nav__link">Affiliate terms</Link>
        </nav>
        <Link href="/shop" className="storefront-header__action">
          Explore gear <span aria-hidden="true">↗</span>
        </Link>
      </div>
    </header>
  );
}

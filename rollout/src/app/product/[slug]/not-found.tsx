import './rollout1-pixel-match.css';

export default function NotFound() {
  return (
    <main className="pixel-product-page">
      <header className="pixel-product-header">
        <div className="pixel-product-header__inner">
          <div className="pixel-logo">ATHLETICA</div>
        </div>
      </header>
      <article className="pixel-product-shell" style={{ padding: '100px 0', textAlign: 'center' }}>
        <h1 style={{ fontSize: '48px', letterSpacing: '-0.055em' }}>PRODUCT NOT FOUND</h1>
        <p style={{ color: '#a5a5a5', marginTop: '16px' }}>
          This product is no longer available.
        </p>
      </article>
    </main>
  );
}

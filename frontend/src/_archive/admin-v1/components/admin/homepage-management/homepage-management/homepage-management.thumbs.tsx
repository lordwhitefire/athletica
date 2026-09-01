"use client";

const SHOE_ACCENTS = ["#e7e7e7", "#d6d6d6", "#b7f000", "#ededed", "#f7f7f7", "#cfcfcf"];

export function ShoeThumb({ tone = 0 }: { tone?: number }) {
  const a = SHOE_ACCENTS[tone % SHOE_ACCENTS.length];
  return (
    <svg viewBox="0 0 120 60" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="120" height="60" fill="#f0f0ef" />
      <g transform={`translate(${8 + (tone % 3) * 4},${9 + (tone % 2) * 3}) rotate(${-4 + (tone % 3)})`}>
        <path d="M7 30c8-2 17-8 25-17l12 7 17 3c8 1 13 7 19 10l12 6c4 2 4 6-2 7H18C7 46 2 41 7 30Z" fill={a} stroke="#969696" strokeWidth="1" />
        <path d="M36 14c8 4 16 7 25 9" stroke="#555" strokeWidth="1.3" fill="none" />
        <path d="M51 22 43 30M58 23l-7 8M65 25l-6 8" stroke="#777" strokeWidth="1" />
        <path d="M18 43h68" stroke="#555" strokeWidth="1.3" />
        <path d="M28 46l-2 5M43 46l-1 5M60 46v5M76 46l1 5" stroke="#777" strokeWidth="1.2" />
      </g>
    </svg>
  );
}

export function HeroArt({ id = "hp-hero" }: { id?: string }) {
  return (
    <svg viewBox="0 0 620 320" preserveAspectRatio="xMidYMid slice" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id={`${id}-bg`} x1="0" x2="1" y1="0" y2="1">
          <stop stopColor="#101610" />
          <stop offset=".55" stopColor="#1b260f" />
          <stop offset="1" stopColor="#050505" />
        </linearGradient>
        <radialGradient id={`${id}-glow`}>
          <stop stopColor="#b7f000" stopOpacity=".35" />
          <stop offset="1" stopColor="#b7f000" stopOpacity="0" />
        </radialGradient>
      </defs>
      <rect width="620" height="320" fill={`url(#${id}-bg)`} />
      <circle cx="520" cy="80" r="180" fill={`url(#${id}-glow)`} />
      <path d="M0 252C130 225 260 244 390 226S520 202 620 217V320H0Z" fill="#101a0c" />
      <path d="M0 281C140 248 265 276 410 246s160-15 210-8" fill="none" stroke="#51652a" strokeWidth="2" opacity=".5" />
      <g transform="translate(372 62)">
        <ellipse cx="98" cy="194" rx="78" ry="16" fill="#000" opacity=".5" />
        <circle cx="110" cy="35" r="21" fill="#b68d6b" />
        <path d="M89 31c1-18 35-26 44-2l-5 12-11-12-26 7Z" fill="#171717" />
        <path d="M94 56 126 55l18 64-31 12-31-69Z" fill="#111" />
        <path d="m89 66-24 65 27 11 32-61M125 65l34 50-23 17-38-45" fill="#151515" />
        <path d="m73 132-22 43 19 7 35-39M138 129l37 37-17 13-41-37" fill="#121212" />
        <path d="M50 176 25 196l31 6 17-22M158 166l26 17-22 12-21-16" fill="#ddd" />
      </g>
      <g fontFamily="Arial,sans-serif">
        <text x="35" y="76" fill="#b7f000" fontSize="18" fontWeight="800" letterSpacing="2">ATHLETICA</text>
        <text x="35" y="140" fill="#fff" fontSize="48" fontWeight="900">ELEVATE</text>
        <text x="35" y="184" fill="#b7f000" fontSize="48" fontWeight="900">YOUR GAME</text>
        <rect x="35" y="211" width="91" height="29" rx="2" fill="#b7f000" />
        <text x="49" y="230" fill="#070707" fontSize="11" fontWeight="800">SHOP NOW</text>
      </g>
    </svg>
  );
}

export function MobileHeroArt() {
  return (
    <svg viewBox="0 0 40 50" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <g transform="scale(.0645 .15625)">
        <HeroArt id="hp-hero-mobile" />
      </g>
    </svg>
  );
}

export function PromoThumb() {
  return (
    <svg viewBox="0 0 120 60" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <defs>
        <linearGradient id="hp-promo" x1="0" x2="1">
          <stop stopColor="#0a1208" />
          <stop offset="1" stopColor="#1d310a" />
        </linearGradient>
      </defs>
      <rect width="120" height="60" fill="url(#hp-promo)" />
      <path d="M0 48C40 31 73 42 120 24" fill="none" stroke="#526c27" strokeWidth="2" />
      <circle cx="82" cy="17" r="8" fill="#9c745a" />
      <path d="M76 24 91 24l8 20-16 4-12-22Z" fill="#111" />
      <path d="m80 42-12 12 10 2 16-10M96 42l12 8-9 5-15-8" fill="#eee" />
    </svg>
  );
}

export function InstagramThumb() {
  return (
    <svg viewBox="0 0 120 60" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="120" height="60" fill="#101010" />
      <rect x="4" y="4" width="34" height="24" fill="#402b47" />
      <rect x="43" y="4" width="34" height="24" fill="#27364d" />
      <rect x="82" y="4" width="34" height="24" fill="#4a3b20" />
      <rect x="4" y="32" width="34" height="24" fill="#17352b" />
      <rect x="43" y="32" width="34" height="24" fill="#44301c" />
      <rect x="82" y="32" width="34" height="24" fill="#282e4b" />
      <circle cx="21" cy="16" r="6" fill="#c58f76" />
      <circle cx="60" cy="16" r="6" fill="#d0a187" />
      <circle cx="99" cy="16" r="6" fill="#ba8d71" />
    </svg>
  );
}

export function WhyThumb() {
  return (
    <svg viewBox="0 0 120 60" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="120" height="60" fill="#0a0a0a" />
      <text x="12" y="27" fill="#b7f000" fontSize="8" fontWeight="800">WHY ATHLETICA</text>
      <text x="12" y="40" fill="#fff" fontSize="5">ENGINEERED FOR PERFORMANCE</text>
    </svg>
  );
}

export function SaleThumb() {
  return (
    <svg viewBox="0 0 120 60" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="120" height="60" fill="#090909" />
      <text x="13" y="27" fill="#b7f000" fontSize="9" fontWeight="900">END OF SEASON</text>
      <text x="13" y="39" fill="#fff" fontSize="7">SALE</text>
    </svg>
  );
}

export function SectionThumb({ index }: { index: number }) {
  if (index === 0 || index === 3 || index === 6) return <PromoThumb />;
  if (index === 9) return <WhyThumb />;
  if (index === 10) return <InstagramThumb />;
  if (index === 11) return <SaleThumb />;
  return <ShoeThumb tone={index} />;
}

export function ImageChoiceThumb({ index }: { index: number }) {
  const labels = ["HERO", "PERFORMANCE", "BOOT", "NEW", "TRAINING", "SEASON"];
  return (
    <svg viewBox="0 0 120 70" xmlns="http://www.w3.org/2000/svg" aria-hidden="true">
      <rect width="120" height="70" fill={index % 2 ? "#111" : "#171b10"} />
      <circle cx={70 + index * 3} cy="27" r="10" fill="#9b765f" />
      <path d="M62 38 79 37 91 60H52Z" fill="#151515" />
      <path d="M0 60C30 48 55 58 120 40V70H0Z" fill="#263214" />
      <text x="7" y="15" fill="#b7f000" fontSize="6" fontWeight="900">
        {labels[index % labels.length]}
      </text>
    </svg>
  );
}

export function Sparkline({ values }: { values: number[] }) {
  if (!values || values.length < 2) {
    return <span className="spark-empty">—</span>;
  }

  const max = Math.max(...values);
  const min = Math.min(...values);
  const pts = values
    .map((v, i) => {
      const x = 2 + i * (70 / (values.length - 1));
      const y = 23 - ((v - min) / (max - min || 1)) * 19;
      return `${x},${y}`;
    })
    .join(" ");

  return (
    <svg className="spark" viewBox="0 0 74 27" preserveAspectRatio="none" aria-hidden="true">
      <polyline points={pts} fill="none" stroke="#b7f000" strokeWidth="1.35" />
    </svg>
  );
}

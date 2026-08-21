import type { ReactNode } from "react";

const NAMED_LOGOS: Record<string, ReactNode> = {
  nike: (
    <svg viewBox="0 0 48 48" fill="none">
      <path d="M7 27c11 1 17-4 28-12l6-4c-6 11-15 22-28 22-3 0-5-2-6-6Z" fill="#111" />
      <path d="M7 27c8 2 17-1 26-9" stroke="#fff" strokeWidth="2" opacity=".15" />
    </svg>
  ),
  adidas: (
    <svg viewBox="0 0 48 48">
      <path d="M7 16h13v7H7zM28 16h13v7H28zM7 28h13v7H7zM28 28h13v7H28z" fill="#111" />
      <path d="M20 20h8v8h-8z" fill="#777" />
    </svg>
  ),
  puma: (
    <svg viewBox="0 0 48 48">
      <path d="M7 31c11-1 21-7 34-18-6 12-13 21-25 21-4 0-7-1-9-3Z" fill="#111" />
      <path d="M12 30c6 0 13-3 22-10" stroke="#777" strokeWidth="1.5" />
    </svg>
  ),
  mizuno: (
    <svg viewBox="0 0 48 48">
      <path d="M7 27h34l-8 4H7z" fill="#0b4ea2" />
      <path d="m15 27 6-14 3 10 5-8 2 12z" fill="#0b4ea2" />
    </svg>
  ),
  "new-balance": (
    <svg viewBox="0 0 48 48">
      <path d="M8 18h32v5H8zM12 25h24v5H12z" fill="#e52d2d" />
      <path d="M8 18h32" stroke="#e52d2d" strokeWidth="3" />
    </svg>
  ),
  "under-armour": (
    <svg viewBox="0 0 48 48">
      <path d="M8 15h32l-9 18-8-8-7 8z" fill="#111" />
      <path d="M13 19h22" stroke="#777" strokeWidth="2" />
    </svg>
  ),
  umbro: (
    <svg viewBox="0 0 48 48">
      <path d="M9 15h30l-4 18H13z" fill="none" stroke="#111" strokeWidth="3" />
      <path d="M14 20h20" stroke="#111" strokeWidth="2" />
    </svg>
  ),
  asics: (
    <svg viewBox="0 0 48 48">
      <path d="M9 13c7 0 10 4 15 4 4 0 7-3 15-3-7 3-9 8-15 8-5 0-7-5-15-9Z" fill="#1f4d96" />
    </svg>
  ),
  reebok: (
    <svg viewBox="0 0 48 48">
      <path d="M7 22h34v7H7zM13 17h22v4H13z" fill="#111" />
    </svg>
  ),
  diadora: (
    <svg viewBox="0 0 48 48">
      <path d="M8 16h32v4H8zM13 22h22v5H13zM18 29h12v4H18z" fill="#111" />
    </svg>
  ),
  joma: (
    <svg viewBox="0 0 48 48">
      <path d="M8 17c7 0 12 5 19 5 5 0 9-2 13-5-4 7-10 12-18 12-6 0-10-4-14-12Z" fill="#1d4e98" />
    </svg>
  ),
};

const MONOGRAM_COLORS = ["#0b4ea2", "#1d4e98", "#e52d2d", "#2b9cff", "#9b7ae8", "#f4b22f", "#ff9d6c", "#111111"];

function monogramKey(name: string): string {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length > 1) {
    return words
      .slice(0, 2)
      .map((w) => w[0] ?? "")
      .join("")
      .toUpperCase();
  }
  return (words[0] ?? name).slice(0, 2).toUpperCase();
}

function monogramColor(name: string): string {
  let sum = 0;
  for (let i = 0; i < name.length; i += 1) sum += name.charCodeAt(i);
  return MONOGRAM_COLORS[sum % MONOGRAM_COLORS.length];
}

export function BrandLogo({
  brand,
  className,
}: {
  brand: { logo: string; name: string };
  className?: string;
}) {
  if (brand.logo.startsWith("/") || brand.logo.startsWith("http")) {
    return <img src={brand.logo} alt="" className={className} />;
  }

  const named = NAMED_LOGOS[brand.logo];
  if (named) {
    return <svg viewBox="0 0 48 48" className={className}>{named}</svg>;
  }

  return (
    <svg viewBox="0 0 48 48" className={className}>
      <rect width="48" height="48" rx="7" fill={monogramColor(brand.name)} />
      <text
        x="24"
        y="30"
        textAnchor="middle"
        fontSize="17"
        fontWeight="800"
        fill="#ffffff"
        fontFamily="Inter, ui-sans-serif, system-ui, sans-serif"
      >
        {monogramKey(brand.name)}
      </text>
    </svg>
  );
}

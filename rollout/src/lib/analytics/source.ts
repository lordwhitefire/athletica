import type { AnalyticsSource } from '@/lib/database.types';

export function normalizeSource(
  value: string | null | undefined
): AnalyticsSource | null {
  if (value === null || value === undefined) return null;

  const normalized = value.trim().toLowerCase();

  if (normalized === 'instagram') return 'instagram';
  if (normalized === 'whatsapp') return 'whatsapp';

  return null;
}

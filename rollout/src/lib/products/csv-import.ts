// FM-12: Two-phase CSV import — MAPPING (parse + validate in memory) → PROCESSING (persist).
// Per-row status. No DB writes during MAPPING. No delete mid-processing.

import Papa from 'papaparse';
import { createServiceClient } from '@/lib/supabase/server';

export type RowStatus = 'pending' | 'valid' | 'invalid' | 'completed' | 'failed';
export type ImportPhase = 'mapping' | 'completed_mapping' | 'processing' | 'completed' | 'failed';

interface ImportRow {
  rowIndex: number;
  raw: Record<string, string>;
  status: RowStatus;
  error?: string;
  productId?: string;
}

interface ImportState {
  phase: ImportPhase;
  rows: ImportRow[];
  startedAt: string;
}

// In-memory import registry (a real impl would persist to a table; this is the engine shape).
const imports = new Map<string, ImportState>();

/** Phase 1 — MAPPING: parse + validate rows in memory. No DB writes. */
export async function startMapping(csvText: string): Promise<{ importId: string; rows: ImportRow[]; counts: Record<RowStatus, number> }> {
  const importId = crypto.randomUUID();
  const parsed = Papa.parse<Record<string, string>>(csvText, { header: true, skipEmptyLines: true });
  const rows: ImportRow[] = (parsed.data ?? []).map((raw, i) => {
    const errors = validateRow(raw);
    return errors.length === 0
      ? { rowIndex: i + 2, raw, status: 'valid' }  // +2: header + 1-indexed
      : { rowIndex: i + 2, raw, status: 'invalid', error: errors.join('; ') };
  });
  imports.set(importId, { phase: 'mapping', rows, startedAt: new Date().toISOString() });
  return { importId, rows, counts: groupedCounts(rows) };
}

/** Phase 2 — PROCESSING: persist only the valid rows. */
export async function startProcessing(importId: string): Promise<{ completed: number; failed: number }> {
  const state = imports.get(importId);
  if (!state || state.phase !== 'mapping') throw new Error('Import not in mapping phase');
  state.phase = 'processing';
  const sb = createServiceClient();
  let completed = 0, failed = 0;
  for (const row of state.rows) {
    if (row.status !== 'valid') continue;
    try {
      const { data, error } = await sb.from('products').insert({
        id: row.raw.id || crypto.randomUUID(),
        slug: row.raw.slug,
        name: row.raw.name,
        status: 'draft',
        asin: row.raw.asin || null,
        gender: row.raw.gender || null,
        color: row.raw.color || null,
        tags: row.raw.tags ? row.raw.tags.split('|') : [],
        main_image: row.raw.main_image || null,
      }).select('id').single();
      if (error) { row.status = 'failed'; row.error = error.message; failed++; }
      else { row.status = 'completed'; row.productId = (data as { id: string }).id; completed++; }
    } catch (e) {
      row.status = 'failed'; row.error = (e as Error).message; failed++;
    }
  }
  state.phase = 'completed';
  return { completed, failed };
}

export function getImportState(importId: string): ImportState | null {
  return imports.get(importId) ?? null;
}

export function canBeDeleted(importId: string): boolean {
  const s = imports.get(importId);
  if (!s) return false;
  return ['mapping', 'completed', 'failed'].includes(s.phase);
}

function validateRow(row: Record<string, string>): string[] {
  const errors: string[] = [];
  if (!row.name) errors.push('name is required');
  if (!row.slug) errors.push('slug is required');
  return errors;
}

function groupedCounts(rows: ImportRow[]): Record<RowStatus, number> {
  const counts: Record<RowStatus, number> = { pending: 0, valid: 0, invalid: 0, completed: 0, failed: 0 };
  for (const r of rows) counts[r.status]++;
  return counts;
}

import Papa from 'papaparse';
import ExcelJS from 'exceljs';
import type { ProductRow, BenefitIcon } from '@/lib/database.types';

// CSV/Excel autofill for the Add Product modal.
// Autofills ONE form — never creates/updates rows directly (not batch upload).

function cellToString(value: unknown): string {
  if (value === null || value === undefined) return '';
  if (typeof value === 'string') return value;
  if (typeof value === 'number') return Number.isFinite(value) ? String(value) : '';
  if (typeof value === 'boolean') return value ? 'true' : 'false';
  if (value instanceof Date) return value.toISOString();
  if (typeof value === 'object') {
    const obj = value as Record<string, unknown>;
    if (Array.isArray(obj.richText)) {
      return (obj.richText as { text?: string }[]).map((t) => t.text ?? '').join('');
    }
    if ('result' in obj) return cellToString(obj.result);
    if (typeof obj.text === 'string') return obj.text;
    if (typeof obj.hyperlink === 'string') return obj.hyperlink;
    if (typeof obj.error === 'string') return '';
  }
  return '';
}

async function xlsxToFirstRow(buffer: Buffer): Promise<Record<string, string>> {
  const workbook = new ExcelJS.Workbook();
  await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);
  const sheet = workbook.worksheets[0];
  if (!sheet || sheet.rowCount < 1) {
    throw new Error('The file could not be read as a spreadsheet.');
  }

  const headerRow = sheet.getRow(1);
  const headers: string[] = [];
  headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
    headers[colNumber] = String(cellToString(cell.value)).trim();
  });

  for (let r = 2; r <= sheet.rowCount; r++) {
    const excelRow = sheet.getRow(r);
    const record: Record<string, string> = {};
    let hasValue = false;
    for (let c = 1; c < headers.length; c++) {
      const key = headers[c];
      if (!key) continue;
      const raw = cellToString(excelRow.getCell(c).value);
      if (raw !== '') hasValue = true;
      record[key] = raw.trim();
    }
    if (hasValue) return record;
  }

  throw new Error('The file has headers but no data rows.');
}

export async function parseAutofillFile(file: File): Promise<Record<string, string>> {
  const lower = file.name.toLowerCase();

  if (lower.endsWith('.csv')) {
    const text = await file.text();
    const parsed = Papa.parse<Record<string, string>>(text, { header: true, skipEmptyLines: true });
    if (parsed.data.length === 0) {
      throw new Error('File is empty or has no data rows.');
    }
    return parsed.data[0];
  }

  if (lower.endsWith('.xlsx')) {
    const buffer = Buffer.from(await file.arrayBuffer());
    return xlsxToFirstRow(buffer);
  }

  throw new Error('Only .csv or .xlsx files are accepted.');
}

function normalizeKey(key: string): string {
  return key.toLowerCase().replace(/[^a-z0-9]/g, '');
}

function splitList(value: string | undefined): string[] {
  if (!value) return [];
  return value
    .split('|')
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
}

function coerceNumber(value: string | undefined): number | undefined {
  if (value === undefined || value.trim() === '') return undefined;
  const n = Number.parseFloat(value.replace(/[^0-9.-]/g, ''));
  return Number.isNaN(n) ? undefined : n;
}

const FIELDS: Record<string, (row: Record<string, string>, value: string) => Partial<ProductRow>> = {
  name: (_r, v) => ({ name: v }),
  slug: (_r, v) => ({ slug: v }),
  status: (_r, v) => (v === 'published' || v === 'unpublished' ? { status: v } : {}),
  gender: (_r, v) => ({ gender: v }),
  color: (_r, v) => ({ color: v }),
  asin: (_r, v) => ({ asin: v }),
  sku: (_r, v) => ({ sku: v }),
  collection: (_r, v) => ({ collection: v }),
  descriptiontagline: (_r, v) => ({ tagline: v }),
  descriptionsubtitle: (_r, v) => ({ subtitle: v }),
  descriptionintro: (_r, v) => ({ intro: v }),
  descriptionkeybenefits: (_r, v) => ({
    key_benefits: splitList(v).map((b) => ({ title: b, text: '', icon: 'boot' as BenefitIcon })),
  }),
  technicaladjustment: (_r, v) => ({ adjustment: v }),
  technicalrange: (_r, v) => ({ range: v }),
  technicalsoletype: (_r, v) => ({ sole_type: v }),
  technicaluppermaterial: (_r, v) => ({ upper_material: v }),
  price: (_r, v) => {
    const price = coerceNumber(v);
    return price === undefined || price <= 0 ? {} : { price };
  },
  mainimage: (_r, v) => ({ main_image: v || undefined }),
  imagegallery: (_r, v) => ({ images: splitList(v) }),
  tags: (_r, v) => ({ tags: splitList(v) }),
  boxcontents: (_r, v) => ({ box_contents: splitList(v) }),
  sizes: (_r, v) => ({ sizes: splitList(v) }),
  sizesdetail: (_r, v) => ({ sizes_detail: v }),
  seotitle: (_r, v) => ({ meta: { seo_title: v } }),
  seodescription: (_r, v) => ({ meta: { seo_description: v } }),
  keywords: (_r, v) => ({ meta: { keywords: v } }),
};

export function mapAutofillRow(row: Record<string, string>): Partial<ProductRow> {
  const mapped: Partial<ProductRow> = {};
  const meta: Record<string, string> = {};

  for (const [header, value] of Object.entries(row)) {
    if (value === '' || value === undefined) continue;
    const setter = FIELDS[normalizeKey(header)];
    if (!setter) continue;
    const partial = setter(row, value);
    const metaKeys = ['seo_title', 'seo_description', 'keywords'];
    for (const [k, v] of Object.entries(partial)) {
      const existing = mapped[k as keyof ProductRow] as unknown;
      if (k === 'meta' && typeof v === 'object' && v !== null) {
        Object.assign(meta, v as Record<string, string>);
      } else {
        // First header wins for scalar fields; ignore duplicates
        if (existing === undefined) {
          (mapped as Record<string, unknown>)[k] = v;
        }
      }
    }
  }

  if (Object.keys(meta).length > 0) {
    mapped.meta = meta;
  }

  return mapped;
}
import { NextRequest, NextResponse } from "next/server";
import AdmZip from "adm-zip";
import Papa from "papaparse";
import ExcelJS from "exceljs";
import { adminClient } from "@/lib/admin-sanity";
import { logger } from "@/lib/logger";
import { slugify, generateId } from "@/lib/rebuild-nav-urls";
import { batchProcessedRowSchema, type BatchUploadParseResult, type BatchUploadPreviewRow, type BatchProcessedRow, type SizeItem } from "@/lib/schemas/batch-upload";

const ALLOWED_IMAGE_TYPES = ["image/jpeg", "image/png", "image/webp", "image/avif"];
const ALLOWED_EXTENSIONS = [".jpg", ".jpeg", ".png", ".webp", ".avif"];
const MAX_ZIP_SIZE = 50 * 1024 * 1024;

interface CsvRow {
    model?: string;
    brand?: string;
    price_current?: string;
    price_currency?: string;
    category?: string;
    traction?: string;
    name?: string;
    gender?: string;
    color?: string;
    price_original?: string;
    price_discount_percent?: string;
    price_member_price?: string;
    description_subtitle?: string;
    description_tagline?: string;
    description_intro?: string;
    description_collection?: string;
    description_key_benefits?: string;
    technical_range?: string;
    technical_sole_type?: string;
    technical_upper_material?: string;
    technical_adjustment?: string;
    main_image?: string;
    thumbnail?: string;
    image_gallery?: string;
    sizes?: string;
}

function isImageFile(name: string): boolean {
    const lower = name.toLowerCase();
    return ALLOWED_EXTENSIONS.some((ext) => lower.endsWith(ext));
}

function cellToString(value: unknown): string {
    if (value === null || value === undefined) return "";
    if (typeof value === "string") return value;
    if (typeof value === "number") return Number.isFinite(value) ? String(value) : "";
    if (typeof value === "boolean") return value ? "true" : "false";
    if (value instanceof Date) return value.toISOString();
    if (typeof value === "object") {
        const obj = value as Record<string, unknown>;
        if (Array.isArray(obj.richText)) {
            return (obj.richText as { text?: string }[]).map((t) => t.text ?? "").join("");
        }
        if ("result" in obj) return cellToString(obj.result);
        if (typeof obj.text === "string") return obj.text;
        if (typeof obj.hyperlink === "string") return obj.hyperlink;
        if (typeof obj.error === "string") return "";
    }
    return "";
}

// XLSX: first worksheet only; row 1 maps to the same column names as CSV.
async function xlsxToRows(buffer: Buffer): Promise<CsvRow[]> {
    const workbook = new ExcelJS.Workbook();
    await workbook.xlsx.load(buffer as unknown as ExcelJS.Buffer);
    const sheet = workbook.worksheets[0];
    if (!sheet || sheet.rowCount < 1) return [];
    const headerRow = sheet.getRow(1);
    const headers: string[] = [];
    headerRow.eachCell({ includeEmpty: true }, (cell, colNumber) => {
        headers[colNumber] = String(cellToString(cell.value)).trim();
    });
    const rows: CsvRow[] = [];
    for (let r = 2; r <= sheet.rowCount; r++) {
        const excelRow = sheet.getRow(r);
        const record: Record<string, string> = {};
        let hasValue = false;
        for (let c = 1; c < headers.length; c++) {
            const key = headers[c];
            if (!key) continue;
            const raw = cellToString(excelRow.getCell(c).value);
            if (raw !== "") hasValue = true;
            record[key] = raw.trim();
        }
        if (hasValue) rows.push(record as CsvRow);
    }
    return rows;
}

function parseJsonArray(raw: string | undefined | null): string[] {
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        return Array.isArray(parsed) ? parsed.filter((s): s is string => typeof s === "string") : [];
    } catch {
        return [];
    }
}

function parseJsonSizes(raw: string | undefined | null): SizeItem[] {
    if (!raw) return [];
    try {
        const parsed = JSON.parse(raw);
        if (!Array.isArray(parsed)) return [];
        return parsed.map((s: unknown) => {
            if (typeof s !== "object" || s === null) return null;
            const item = s as Record<string, unknown>;
            return {
                size: String(item.size ?? ""),
                available: item.available !== false,
                stock: typeof item.stock === "number" ? Math.max(0, Math.floor(item.stock)) : 0,
            };
        }).filter((s): s is SizeItem => s !== null && s.size.length > 0);
    } catch {
        return [];
    }
}

function coerceNumber(val: string | undefined | null): number {
    if (!val) return 0;
    const n = parseFloat(val.replace(/[^0-9.-]/g, ""));
    return isNaN(n) ? 0 : n;
}

/**
 * Check Sanity for an existing image asset with matching originalFilename.
 * If found, reuse it. Otherwise, upload a new one.
 * per investigation: lines 143-166 uploaded without dedup — now checks Sanity first
 */
async function uploadOrReuseImage(filename: string, imgBuffer: Buffer): Promise<string> {
    const mimeType = filename.toLowerCase().endsWith(".png")
        ? "image/png"
        : filename.toLowerCase().endsWith(".webp")
          ? "image/webp"
          : filename.toLowerCase().endsWith(".avif")
            ? "image/avif"
            : "image/jpeg";
    // per investigation: query Sanity for existing asset with matching originalFilename
    const existing = await adminClient.fetch<{ _id: string } | null>(
        `*[_type == "sanity.imageAsset" && originalFilename == $filename][0]{_id}`,
        { filename },
    );
    if (existing) return existing._id;
    const asset = await adminClient.assets.upload("image", imgBuffer, { filename, contentType: mimeType });
    return asset._id;
}

export async function POST(req: NextRequest) {
    try {
        const formData = await req.formData();
        const file = formData.get("file") as File | null;
        if (!file) {
            return NextResponse.json({ data: null, error: { type: "validation_error", code: "no_file", message: "No file provided." } }, { status: 400 });
        }
        const fileName = file.name.toLowerCase();
        const isZip = fileName.endsWith(".zip");
        const isCsv = fileName.endsWith(".csv");
        const isXlsx = fileName.endsWith(".xlsx");
        if (!isZip && !isCsv && !isXlsx) {
            return NextResponse.json({ data: null, error: { type: "validation_error", code: "invalid_format", message: "Only .zip, .csv, or .xlsx files are accepted." } }, { status: 400 });
        }
        if (file.size > MAX_ZIP_SIZE) {
            return NextResponse.json({ data: null, error: { type: "validation_error", code: "file_too_large", message: "File must be under 50MB." } }, { status: 400 });
        }
        const buffer = Buffer.from(await file.arrayBuffer());

        let parsed: Papa.ParseResult<CsvRow>;
        let imageEntries: ReturnType<AdmZip["getEntries"]> = [];

        if (isZip) {
            const zip = new AdmZip(buffer);
            const entries = zip.getEntries();
            if (entries.length === 0) {
                return NextResponse.json({ data: null, error: { type: "validation_error", code: "empty_zip", message: "ZIP file is empty." } }, { status: 400 });
            }
            const csvEntry = entries.find(
                (e) => !e.isDirectory && e.entryName.toLowerCase().endsWith(".csv")
            );
            if (!csvEntry) {
                return NextResponse.json({ data: null, error: { type: "validation_error", code: "no_csv", message: "No CSV file found in the ZIP archive." } }, { status: 400 });
            }
            parsed = Papa.parse<CsvRow>(csvEntry.getData().toString("utf-8"), { header: true, skipEmptyLines: true });
            imageEntries = entries.filter((e) => !e.isDirectory && isImageFile(e.entryName));
        } else if (isCsv) {
            parsed = Papa.parse<CsvRow>(buffer.toString("utf-8"), { header: true, skipEmptyLines: true });
        } else {
            let xlsxRows: CsvRow[];
            try {
                xlsxRows = await xlsxToRows(buffer);
            } catch {
                logger.error("XLSX parse failed for batch upload");
                return NextResponse.json({ data: null, error: { type: "validation_error", code: "invalid_format", message: "The XLSX file could not be read. Make sure it is a valid Excel workbook." } }, { status: 400 });
            }
            parsed = { data: xlsxRows } as unknown as Papa.ParseResult<CsvRow>;
        }

        if (parsed.data.length === 0) {
            return NextResponse.json({ data: null, error: { type: "validation_error", code: "empty_csv", message: "File is empty or has no data rows." } }, { status: 400 });
        }
        const imageNameToRef = new Map<string, string>();
        const imageUploadResults: { filename: string; status: "uploaded" | "failed"; sanityRef?: string }[] = [];

        // per investigation: lines 143-166 uploaded every image without checking Sanity — now deduplicates
        for (const imgEntry of imageEntries) {
            const filename = imgEntry.entryName.split("/").pop() || imgEntry.entryName;
            try {
                const assetId = await uploadOrReuseImage(filename, imgEntry.getData());
                imageNameToRef.set(filename, assetId);
                imageUploadResults.push({ filename, status: "uploaded", sanityRef: assetId });
            } catch (err) {
                logger.error(err, `Failed to upload image: ${filename}`);
                imageUploadResults.push({ filename, status: "failed" });
            }
        }

        const imagesUploaded = imageUploadResults.filter((r) => r.status === "uploaded").length;
        const imagesFailed = imageUploadResults.filter((r) => r.status === "failed").length;

        function resolveImage(filename: string | undefined | null): { _type: "image"; asset: { _type: "reference"; _ref: string } } | null {
            if (!filename) return null;
            const ref = imageNameToRef.get(filename.trim());
            return ref ? { _type: "image", asset: { _type: "reference", _ref: ref } } : null;
        }

        const previewRows: BatchUploadPreviewRow[] = [];
        const productData: BatchProcessedRow[] = [];
        let validCount = 0;
        let errorCount = 0;
        for (let i = 0; i < parsed.data.length; i++) {
            const row = parsed.data[i];
            const rowErrors: string[] = [];
            if (!row.model) rowErrors.push("Model is required.");
            if (!row.brand) rowErrors.push("Brand is required.");
            if (!row.price_current) rowErrors.push("Price current is required.");
            if (!row.price_currency) rowErrors.push("Currency is required.");
            const currentPrice = coerceNumber(row.price_current);
            if (row.price_current && currentPrice <= 0) rowErrors.push("Price must be a positive number.");
            const validCurrency = ["EUR", "USD", "GBP"].includes((row.price_currency || "").toUpperCase());
            if (row.price_currency && !validCurrency) rowErrors.push("Currency must be EUR, USD, or GBP.");

            const imageStatuses: { filename: string; status: "uploaded" | "failed"; sanityRef?: string }[] = [];
            if (row.main_image) {
                const found = imageUploadResults.find((r) => r.filename === row.main_image!.trim());
                if (found) {
                    imageStatuses.push(found);
                } else {
                    imageStatuses.push({ filename: row.main_image.trim(), status: "failed" });
                }
            }
            if (row.thumbnail) {
                const found = imageUploadResults.find((r) => r.filename === row.thumbnail!.trim());
                if (found) {
                    imageStatuses.push(found);
                } else {
                    imageStatuses.push({ filename: row.thumbnail.trim(), status: "failed" });
                }
            }
            if (row.image_gallery) {
                const galleryFiles = parseJsonArray(row.image_gallery);
                for (const gf of galleryFiles) {
                    const found = imageUploadResults.find((r) => r.filename === gf.trim());
                    if (found) {
                        imageStatuses.push(found);
                    } else {
                        imageStatuses.push({ filename: gf.trim(), status: "failed" });
                    }
                }
            }

            const imageGalleryRefs = parseJsonArray(row.image_gallery || "")
                .map((f, idx) => {
                    const ref = imageNameToRef.get(f.trim());
                    if (!ref) return null;
                    return { _type: "image" as const, asset: { _type: "reference" as const, _ref: ref }, _key: `gallery-${idx}` };
                })
                .filter((x): x is NonNullable<typeof x> => x !== null);

            const rowData: BatchProcessedRow = {
                model: row.model || "",
                brand: row.brand || "",
                price_current: currentPrice,
                price_currency: (row.price_currency || "EUR").toUpperCase() as "EUR" | "USD" | "GBP",
                category: row.category || "",
                traction: row.traction || "",
                name: row.name || "",
                gender: (row.gender || "Unisex") as "Unisex" | "Male" | "Female",
                color: row.color || "",
                price_original: coerceNumber(row.price_original),
                price_discount_percent: coerceNumber(row.price_discount_percent),
                price_member_price: coerceNumber(row.price_member_price),
                description_subtitle: row.description_subtitle || "",
                description_tagline: row.description_tagline || "",
                description_intro: row.description_intro || "",
                description_collection: row.description_collection || "",
                description_key_benefits: parseJsonArray(row.description_key_benefits),
                technical_range: row.technical_range || "",
                technical_sole_type: row.technical_sole_type || "",
                technical_upper_material: row.technical_upper_material || "",
                technical_adjustment: row.technical_adjustment || "",
                main_image: resolveImage(row.main_image) || null,
                thumbnail: resolveImage(row.thumbnail) || null,
                image_gallery: imageGalleryRefs,
                sizes: parseJsonSizes(row.sizes),
            };

            const zodResult = batchProcessedRowSchema.safeParse(rowData);
            if (!zodResult.success) {
                const zodErrors = zodResult.error.issues.map((iss) => `${iss.path.join(".")}: ${iss.message}`);
                rowErrors.push(...zodErrors);
            }

            const isValid = rowErrors.length === 0;
            if (isValid) {
                validCount++;
                productData.push(rowData);
            } else {
                errorCount++;
            }

            previewRows.push({
                index: i,
                model: row.model || "",
                brand: row.brand || "",
                priceCurrent: currentPrice,
                currency: (row.price_currency || "EUR").toUpperCase(),
                valid: isValid,
                errors: rowErrors,
                imageStatus: imageStatuses,
            });
        }

        const result: BatchUploadParseResult = {
            totalRows: parsed.data.length,
            validRows: validCount,
            errorRows: errorCount,
            rows: previewRows,
            productData,
            imageSummary: {
                total: imageEntries.length,
                uploaded: imagesUploaded,
                failed: imagesFailed,
            },
        };

        return NextResponse.json({ data: result, error: null }, { status: 200 });
    } catch (err) {
        logger.error(err, "Batch upload parse failed");
        return NextResponse.json({ data: null, error: { type: "api_error", code: "parse_failed", message: "Failed to process the file. Please check the file and try again." } }, { status: 500 });
    }
}

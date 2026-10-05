import type { WardrobeData } from "@/features/wardrobe/domain/validation";
import {
  buildEnvelope,
  parseStoredValue,
} from "@/features/wardrobe/store/persistence";

/** Reject imports larger than this before attempting to parse them. */
export const MAX_BACKUP_BYTES = 5 * 1024 * 1024;

export type BackupCounts = {
  categories: number;
  subcategories: number;
  items: number;
  outfits: number;
  plans: number;
};

export type BackupPreview =
  | { ok: true; data: WardrobeData; counts: BackupCounts }
  | { ok: false; reason: string };

export const countRecords = (data: WardrobeData): BackupCounts => ({
  categories: data.categories.length,
  subcategories: data.subcategories.length,
  items: data.items.length,
  outfits: data.outfits.length,
  plans: data.plans.length,
});

/** Serialize the current wardrobe as a portable, versioned backup file. */
export function createBackup(data: WardrobeData): string {
  return JSON.stringify(
    { app: "wardrobe", ...buildEnvelope(data) },
    null,
    2,
  );
}

/**
 * Validate a backup without touching storage. Accepts current exports and the
 * legacy pre-versioned shape. Oversized input is rejected before parsing.
 * Invalid payloads return a reason instead of throwing so the caller can leave
 * existing data unchanged.
 */
export function previewBackup(text: string): BackupPreview {
  if (text.length > MAX_BACKUP_BYTES || new TextEncoder().encode(text).byteLength > MAX_BACKUP_BYTES) {
    return {
      ok: false,
      reason: "Backup file is too large to import safely.",
    };
  }
  const parsed = parseStoredValue(text);
  if (parsed.status === "ok") {
    return { ok: true, data: parsed.data, counts: countRecords(parsed.data) };
  }
  return { ok: false, reason: parsed.reason };
}

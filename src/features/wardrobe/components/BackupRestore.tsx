"use client";

import { useRef, useState } from "react";
import Button from "@/shared/components/common/Button";
import { useWardrobe } from "@/features/wardrobe/hooks/useWardrobe";
import { MAX_BACKUP_BYTES, type BackupPreview } from "@/features/wardrobe/store/backup";
import { downloadTextFile } from "@/shared/lib/download";

const formatCounts = (preview: Extract<BackupPreview, { ok: true }>) =>
  `${preview.counts.items} items, ${preview.counts.outfits} outfits, ` +
  `${preview.counts.plans} plans, ${preview.counts.categories} categories, ` +
  `${preview.counts.subcategories} subcategories`;

export default function BackupRestore() {
  const { exportBackup, previewRestore, restoreBackup } = useWardrobe();
  const inputRef = useRef<HTMLInputElement>(null);
  const [preview, setPreview] = useState<BackupPreview | null>(null);
  const [importError, setImportError] = useState<string>();
  const [status, setStatus] = useState<string>();
  const [busy, setBusy] = useState(false);

  const handleExport = () => {
    setImportError(undefined);
    setStatus(undefined);
    const date = new Date().toISOString().slice(0, 10);
    try {
      downloadTextFile(`wardrobe-backup-${date}.json`, exportBackup());
    } catch (error) {
      setImportError(error instanceof Error ? error.message : "Unable to export backup.");
    }
  };

  const handleFile = async (file: File | undefined) => {
    setStatus(undefined);
    setPreview(null);
    setImportError(undefined);
    if (!file) return;
    if (file.size > MAX_BACKUP_BYTES) {
      setImportError("Import failed: backup file is too large to import safely. Your data is unchanged.");
      return;
    }
    let text: string;
    try {
      text = await file.text();
    } catch {
      setImportError("Could not read the selected file. Your data is unchanged.");
      return;
    }
    const result = previewRestore(text);
    if (!result.ok) {
      setImportError(`Import failed: ${result.reason} Your data is unchanged.`);
      return;
    }
    setPreview(result);
  };

  const handleConfirm = async () => {
    if (!preview || !preview.ok) return;
    setBusy(true);
    setImportError(undefined);
    try {
      await restoreBackup(preview.data);
      setStatus("Wardrobe replaced from backup.");
      setPreview(null);
    } catch (error) {
      setImportError(
        error instanceof Error ? error.message : "Restore failed. Your data is unchanged.",
      );
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="flex flex-col gap-4">
      <div className="flex flex-wrap gap-3">
        <Button type="button" variant="secondary" onClick={handleExport}>
          Export backup
        </Button>
        <Button
          type="button"
          variant="secondary"
          onClick={() => inputRef.current?.click()}
        >
          Import backup
        </Button>
        <input
          ref={inputRef}
          type="file"
          accept="application/json,.json"
          className="hidden"
          onChange={(event) => {
            void handleFile(event.target.files?.[0]);
            event.target.value = "";
          }}
        />
      </div>

      <p className="text-xs text-muted">
        Export downloads a JSON copy of every record. Import validates the file
        and replaces the whole wardrobe only after you confirm.
      </p>

      {importError && (
        <p role="alert" className="text-sm text-danger">
          {importError}
        </p>
      )}
      {status && <p className="text-sm text-emerald-700">{status}</p>}

      {preview && preview.ok && (
        <div className="flex flex-col gap-3 rounded-xl border border-border bg-surface/70 p-4">
          <div className="text-sm font-semibold text-ink">Restore preview</div>
          <p className="text-xs text-muted">
            This will replace the current wardrobe with {formatCounts(preview)}.
            Current data is not merged.
          </p>
          <div className="flex justify-end gap-3">
            <Button
              type="button"
              variant="secondary"
              onClick={() => setPreview(null)}
              disabled={busy}
            >
              Cancel
            </Button>
            <Button type="button" onClick={handleConfirm} disabled={busy}>
              Replace wardrobe
            </Button>
          </div>
        </div>
      )}
    </div>
  );
}

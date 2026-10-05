"use client";

import { useState } from "react";
import Button from "@/shared/components/common/Button";
import BackupRestore from "@/features/wardrobe/components/BackupRestore";
import { useWardrobe } from "@/features/wardrobe/hooks/useWardrobe";
import { confirmAction } from "@/shared/lib/confirm";
import { downloadTextFile } from "@/shared/lib/download";

export default function StorageRecovery() {
  const { storageStatus, recovery, resetStorage, reloadFromDisk } = useWardrobe();
  const [status, setStatus] = useState<string>();
  const [resetError, setResetError] = useState<string>();

  const handleDownloadRaw = () => {
    if (!recovery) return;
    downloadTextFile("wardrobe-original-data.json", recovery.raw);
  };

  const handleReset = async () => {
    const confirmed = confirmAction(
      "Start with an empty wardrobe? The unreadable saved data will be removed. Download it first if you want to keep it.",
    );
    if (!confirmed) return;
    setResetError(undefined);
    try {
      await resetStorage();
      setStatus("Started with an empty wardrobe.");
    } catch (error) {
      setResetError(
        error instanceof Error ? error.message : "Could not reset the wardrobe.",
      );
    }
  };

  if (storageStatus === "unavailable") {
    return (
      <div className="flex flex-col gap-4 rounded-[var(--radius-card)] border border-danger/40 bg-danger/10 p-5">
        <div className="text-sm font-semibold text-danger">
          Local storage is unavailable
        </div>
        <p className="text-sm text-danger">
          {recovery?.reason ??
            "This browser blocked access to local storage, so your wardrobe cannot be loaded or saved."}
        </p>
        <p className="text-xs text-danger">
          Enable site data or leave private browsing, then try again. Until then
          changes are disabled to avoid false save confirmations.
        </p>
        <div>
          <Button type="button" variant="secondary" onClick={() => void reloadFromDisk()}>
            Try again
          </Button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-5 rounded-[var(--radius-card)] border border-danger/40 bg-danger/10 p-5">
      <div>
        <div className="text-sm font-semibold text-danger">
          Saved wardrobe needs recovery
        </div>
        <p className="mt-1 text-sm text-danger">
          {recovery?.reason ??
            "The saved data could not be read. It has been left untouched."}
        </p>
        <p className="mt-2 text-xs text-danger">
          Your original data has not been overwritten. Download it, restore a
          valid backup, or start fresh. Nothing changes until you choose.
        </p>
      </div>

      {recovery && (
        <div>
          <Button type="button" variant="secondary" onClick={handleDownloadRaw}>
            Download original data
          </Button>
        </div>
      )}

      <div className="rounded-xl border border-border bg-white/80 p-4">
        <div className="mb-3 text-sm font-semibold text-ink">
          Restore from a backup
        </div>
        <BackupRestore />
      </div>

      <div className="flex flex-col gap-2">
        <Button type="button" variant="ghost" onClick={handleReset}>
          Start with an empty wardrobe
        </Button>
        {status && <p className="text-sm text-emerald-700">{status}</p>}
        {resetError && (
          <p role="alert" className="text-sm text-danger">
            {resetError}
          </p>
        )}
      </div>
    </div>
  );
}

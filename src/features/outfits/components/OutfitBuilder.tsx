"use client";

import { useMemo, useState } from "react";
import { Check, Sparkles } from "lucide-react";
import Button from "@/shared/components/common/Button";
import Modal from "@/shared/components/common/Modal";
import OutfitVisual from "@/features/outfits/components/OutfitVisual";
import ItemVisual from "@/features/wardrobe/components/ItemVisual";
import type { Outfit, WardrobeItem } from "@/shared/types";

type OutfitBuilderProps = {
  open: boolean;
  items: WardrobeItem[];
  initial?: Outfit;
  onClose: () => void;
  onSave: (payload: {
    name?: string;
    itemIds: string[];
    isFavorite: boolean;
  }) => void | Promise<void>;
};

export default function OutfitBuilder({
  open,
  items,
  initial,
  onClose,
  onSave,
}: OutfitBuilderProps) {
  const [name, setName] = useState(initial?.name ?? "");
  const [selectedIds, setSelectedIds] = useState<string[]>(
    initial?.itemIds ?? [],
  );
  const [isFavorite, setIsFavorite] = useState(initial?.isFavorite ?? false);
  const [error, setError] = useState<string | undefined>();

  const selectionPreview = useMemo(
    () => items.filter((item) => selectedIds.includes(item.id)),
    [items, selectedIds],
  );

  const toggleSelection = (id: string) => {
    setSelectedIds((prev) =>
      prev.includes(id) ? prev.filter((itemId) => itemId !== id) : [...prev, id],
    );
  };

  const handleSave = async () => {
    if (selectedIds.length === 0) {
      setError("Select at least one item to build an outfit.");
      return;
    }
    setError(undefined);
    try {
      await onSave({
        name: name.trim() || undefined,
        itemIds: selectedIds,
        isFavorite,
      });
      onClose();
    } catch (error) {
      setError(error instanceof Error ? error.message : "Unable to save outfit.");
    }
  };

  return (
    <Modal
      open={open}
      title={initial ? "Edit outfit" : "Create outfit"}
      onClose={onClose}
    >
      <div className="flex flex-col gap-4">
        <div className="flex flex-col gap-2 rounded-xl border border-border bg-surface/70 p-4">
          <div className="text-sm font-semibold text-ink">Outfit preview</div>
          <OutfitVisual items={selectionPreview} />
        </div>

        <label className="flex flex-col gap-1 text-sm text-muted" htmlFor="outfit-name">
          <span className="font-medium text-ink">Outfit name (optional)</span>
          <input
            id="outfit-name"
            className="rounded-xl border border-border bg-white/90 px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
            placeholder="Weekend casual"
            value={name}
            onChange={(event) => setName(event.target.value)}
          />
        </label>

        <div className="flex items-center justify-between rounded-xl border border-border bg-white/80 px-4 py-3 text-sm">
          <span className="font-medium text-ink">Mark as favorite</span>
          <button
            className={`inline-flex items-center gap-2 rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
              isFavorite
                ? "bg-accent-soft text-accent"
                : "border border-border text-muted"
            }`}
            onClick={() => setIsFavorite((prev) => !prev)}
            type="button"
          >
            <Sparkles size={14} />
            {isFavorite ? "Favorite" : "Not favorite"}
          </button>
        </div>

        <div className="flex flex-col gap-2">
          <div
            id="outfit-items-label"
            className="text-xs font-semibold uppercase tracking-widest text-muted"
          >
            Select items
          </div>
          <div
            role="group"
            aria-labelledby="outfit-items-label"
            aria-describedby={error ? "outfit-selection-error" : undefined}
            className="grid max-h-[280px] gap-2 overflow-y-auto pr-2"
          >
            {items.map((item) => {
              const selected = selectedIds.includes(item.id);
              return (
                <button
                  key={item.id}
                  type="button"
                  aria-pressed={selected}
                  className={`flex items-center justify-between rounded-xl border px-3 py-2 text-sm transition ${
                    selected
                      ? "border-accent bg-accent-soft text-accent"
                      : "border-border bg-white/90 text-ink hover:border-accent/40"
                  }`}
                  onClick={() => toggleSelection(item.id)}
                >
                  <div className="flex items-center gap-3">
                    <ItemVisual
                      label={item.name}
                      visualKey={item.visualKey}
                      color={item.color}
                      size="sm"
                    />
                    <span>{item.name}</span>
                  </div>
                  {selected && <Check size={16} />}
                </button>
              );
            })}
          </div>
          {error && (
            <span id="outfit-selection-error" role="alert" className="text-xs text-danger">
              {error}
            </span>
          )}
        </div>

        <div className="flex justify-end gap-3">
          <Button variant="secondary" type="button" onClick={onClose}>
            Cancel
          </Button>
          <Button type="button" onClick={handleSave}>
            {initial ? "Save outfit" : "Create outfit"}
          </Button>
        </div>
      </div>
    </Modal>
  );
}

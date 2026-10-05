"use client";

import { Pencil, Star, Trash2 } from "lucide-react";
import OutfitVisual from "@/features/outfits/components/OutfitVisual";
import { confirmAction } from "@/shared/lib/confirm";
import type { Outfit, WardrobeItem } from "@/shared/types";

type OutfitCardProps = {
  outfit: Outfit;
  items: WardrobeItem[];
  onEdit: (outfit: Outfit) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void | Promise<void>;
};

export default function OutfitCard({
  outfit,
  items,
  onEdit,
  onDelete,
  onToggleFavorite,
}: OutfitCardProps) {
  const selectedItems = items.filter((item) => outfit.itemIds.includes(item.id));

  return (
    <div className="flex flex-col gap-4 rounded-[var(--radius-card)] border border-border bg-white/90 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div>
          <h3 className="text-base font-semibold text-ink">
            {outfit.name || "Untitled outfit"}
          </h3>
          <p className="text-xs uppercase tracking-wide text-muted">
            {selectedItems.length} pieces
          </p>
        </div>
        <button
          className={`rounded-full border border-border p-2 transition ${
            outfit.isFavorite ? "text-accent" : "text-muted hover:text-accent"
          }`}
          onClick={() => {
            void onToggleFavorite(outfit.id);
          }}
          type="button"
          aria-label="Toggle favorite"
          aria-pressed={outfit.isFavorite}
        >
          <Star
            size={16}
            strokeWidth={1.8}
            fill={outfit.isFavorite ? "currentColor" : "none"}
          />
        </button>
      </div>

      <OutfitVisual items={selectedItems} />

      <div className="mt-auto flex items-center gap-2 text-xs text-muted">
        <button
          className="inline-flex items-center gap-1 rounded-full border border-border/60 px-2 py-1 transition hover:border-accent/60 hover:text-accent"
          onClick={() => onEdit(outfit)}
          type="button"
        >
          <Pencil size={14} />
          Edit
        </button>
        <button
          className="inline-flex items-center gap-1 rounded-full border border-border/60 px-2 py-1 transition hover:border-danger/60 hover:text-danger"
          onClick={() => {
            if (confirmAction("Delete this outfit? This cannot be undone.")) {
              onDelete(outfit.id);
            }
          }}
          type="button"
        >
          <Trash2 size={14} />
          Delete
        </button>
      </div>
    </div>
  );
}

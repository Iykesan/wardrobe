"use client";

import { Pencil, Star, Trash2 } from "lucide-react";
import ItemVisual from "@/features/wardrobe/components/ItemVisual";
import { confirmAction } from "@/shared/lib/confirm";
import type { Category, Subcategory, WardrobeItem } from "@/shared/types";

type ItemCardProps = {
  item: WardrobeItem;
  category?: Category;
  subcategory?: Subcategory;
  onEdit: (item: WardrobeItem) => void;
  onDelete: (id: string) => void;
  onToggleFavorite: (id: string) => void | Promise<void>;
};

export default function ItemCard({
  item,
  category,
  subcategory,
  onEdit,
  onDelete,
  onToggleFavorite,
}: ItemCardProps) {
  const tags = [item.color, item.fit, item.season].filter(Boolean);

  return (
    <div className="flex flex-col gap-4 rounded-[var(--radius-card)] border border-border bg-white/90 p-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md">
      <div className="flex items-start justify-between gap-4">
        <div className="flex items-start gap-3">
          <ItemVisual
            label={item.name}
            visualKey={item.visualKey}
            color={item.color}
            size="sm"
          />
          <div>
            <h3 className="text-base font-semibold text-ink">{item.name}</h3>
            <p className="text-xs uppercase tracking-wide text-muted">
              {category?.name ?? "Uncategorized"} /{" "}
              {subcategory?.name ?? "General"}
            </p>
          </div>
        </div>
        <button
          className={`rounded-full border border-border p-2 transition ${
            item.isFavorite ? "text-accent" : "text-muted hover:text-accent"
          }`}
          onClick={() => {
            void onToggleFavorite(item.id);
          }}
          type="button"
          aria-label="Toggle favorite"
          aria-pressed={item.isFavorite}
        >
          <Star
            size={16}
            strokeWidth={1.8}
            fill={item.isFavorite ? "currentColor" : "none"}
          />
        </button>
      </div>

      {tags.length > 0 && (
        <div className="flex flex-wrap gap-2 text-xs text-muted">
          {tags.map((tag) => (
            <span
              key={tag}
              className="rounded-full border border-border/60 bg-surface px-2 py-1"
            >
              {tag}
            </span>
          ))}
        </div>
      )}

      {item.notes && (
        <p className="text-sm text-muted line-clamp-2">{item.notes}</p>
      )}

      <div className="mt-auto flex items-center gap-2 text-xs text-muted">
        <button
          className="inline-flex items-center gap-1 rounded-full border border-border/60 px-2 py-1 transition hover:border-accent/60 hover:text-accent"
          onClick={() => onEdit(item)}
          type="button"
        >
          <Pencil size={14} />
          Edit
        </button>
        <button
          className="inline-flex items-center gap-1 rounded-full border border-border/60 px-2 py-1 transition hover:border-danger/60 hover:text-danger"
          onClick={() => {
            if (confirmAction("Delete this item? This cannot be undone.")) {
              onDelete(item.id);
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

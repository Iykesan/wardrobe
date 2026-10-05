"use client";

import { useState } from "react";
import { Layers } from "lucide-react";
import OutfitBuilder from "@/features/outfits/components/OutfitBuilder";
import OutfitCard from "@/features/outfits/components/OutfitCard";
import { useOutfits } from "@/features/outfits/hooks/useOutfits";
import StorageRecovery from "@/features/wardrobe/components/StorageRecovery";
import { useWardrobe } from "@/features/wardrobe/hooks/useWardrobe";
import { useWardrobeInit } from "@/features/wardrobe/hooks/useWardrobeInit";
import Button from "@/shared/components/common/Button";
import InlineNotice from "@/shared/components/common/InlineNotice";
import { useFeedback } from "@/shared/hooks/useFeedback";
import type { Outfit } from "@/shared/types";

export default function OutfitsPage() {
  useWardrobeInit();
  const { outfits, addOutfit, updateOutfit, removeOutfit, toggleOutfitFavorite } =
    useOutfits();
  const {
    items,
    isHydrated,
    isLoading,
    error,
    setError,
    storageStatus,
    conflict,
    reloadFromDisk,
  } = useWardrobe();
  const [builderOpen, setBuilderOpen] = useState(false);
  const [editingOutfit, setEditingOutfit] = useState<Outfit | undefined>();
  const { feedback, show, clear } = useFeedback();

  const openCreate = () => {
    setEditingOutfit(undefined);
    setBuilderOpen(true);
  };

  const openEdit = (outfit: Outfit) => {
    setEditingOutfit(outfit);
    setBuilderOpen(true);
  };

  const handleRemoveOutfit = async (id: string) => {
    try {
      await removeOutfit(id);
      show({ type: "success", message: "Outfit deleted." });
    } catch (removeError) {
      show({
        type: "error",
        message:
          removeError instanceof Error
            ? removeError.message
            : "Unable to delete outfit.",
      });
    }
  };

  const handleToggleFavorite = async (id: string) => {
    try {
      await toggleOutfitFavorite(id);
      show({ type: "success", message: "Favorite updated." });
    } catch (favoriteError) {
      show({
        type: "error",
        message:
          favoriteError instanceof Error
            ? favoriteError.message
            : "Unable to update favorite.",
      });
    }
  };

  if (!isHydrated) {
    return <InlineNotice>Loading outfits...</InlineNotice>;
  }

  if (storageStatus === "recovery-required" || storageStatus === "unavailable") {
    return (
      <div className="flex flex-col gap-8">
        <StorageRecovery />
      </div>
    );
  }

  return (
    <div className="flex flex-col gap-8">
      {(isLoading || error || feedback || conflict) && (
        <div className="flex flex-col gap-3">
          {isLoading && <InlineNotice>Loading outfits...</InlineNotice>}
          {conflict && (
            <InlineNotice variant="error">
              <div className="flex flex-wrap items-center justify-between gap-3">
                <span>{conflict.message}</span>
                <Button
                  size="sm"
                  variant="secondary"
                  onClick={() => void reloadFromDisk()}
                >
                  Reload
                </Button>
              </div>
            </InlineNotice>
          )}
          {error && (
            <InlineNotice variant="error" onDismiss={() => setError(undefined)}>
              {error}
            </InlineNotice>
          )}
          {feedback && (
            <InlineNotice variant={feedback.type} onDismiss={clear}>
              {feedback.message}
            </InlineNotice>
          )}
        </div>
      )}
      <header className="flex flex-wrap items-center justify-between gap-4">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent-soft text-accent">
            <Layers size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-ink">Outfits</h1>
            <p className="text-sm text-muted">{outfits.length} saved outfits</p>
          </div>
        </div>
        <Button onClick={openCreate}>Create outfit</Button>
      </header>

      {outfits.length === 0 ? (
        <div className="rounded-[var(--radius-card)] border border-dashed border-border bg-surface/60 px-6 py-10 text-center">
          <div className="text-sm font-semibold text-ink">No outfits yet</div>
          <p className="text-sm text-muted">
            Build your first outfit from the items in your wardrobe.
          </p>
          <Button size="sm" onClick={openCreate}>
            Build an outfit
          </Button>
        </div>
      ) : (
        <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
          {outfits.map((outfit) => (
            <OutfitCard
              key={outfit.id}
              outfit={outfit}
              items={items}
              onEdit={openEdit}
              onDelete={handleRemoveOutfit}
              onToggleFavorite={handleToggleFavorite}
            />
          ))}
        </div>
      )}

      <OutfitBuilder
        key={`${editingOutfit?.id ?? "new"}-${builderOpen ? "open" : "closed"}`}
        open={builderOpen}
        items={items}
        initial={editingOutfit}
        onClose={() => setBuilderOpen(false)}
        onSave={async (payload) => {
          if (editingOutfit) {
            await updateOutfit({
              ...editingOutfit,
              ...payload,
            });
            show({ type: "success", message: "Outfit updated." });
          } else {
            await addOutfit(payload);
            show({ type: "success", message: "Outfit created." });
          }
        }}
      />
    </div>
  );
}

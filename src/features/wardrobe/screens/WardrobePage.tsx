"use client";

import { useEffect, useMemo, useState } from "react";
import { Search, Shirt } from "lucide-react";
import { useRouter } from "next/navigation";
import CategoryFilter from "@/features/wardrobe/components/CategoryFilter";
import ItemCard from "@/features/wardrobe/components/ItemCard";
import ItemForm from "@/features/wardrobe/components/ItemForm";
import StorageRecovery from "@/features/wardrobe/components/StorageRecovery";
import { useWardrobe } from "@/features/wardrobe/hooks/useWardrobe";
import { useWardrobeInit } from "@/features/wardrobe/hooks/useWardrobeInit";
import { useWardrobeStore } from "@/features/wardrobe/store/wardrobeStore";
import Button from "@/shared/components/common/Button";
import InlineNotice from "@/shared/components/common/InlineNotice";
import { useFeedback } from "@/shared/hooks/useFeedback";
import { normalizeText, sortByOrder } from "@/shared/lib/utils";
import type { WardrobeItem } from "@/shared/types";

export default function WardrobePage() {
  const router = useRouter();
  useWardrobeInit();
  const isHydrated = useWardrobeStore((state) => state.isHydrated);
  const {
    categories,
    subcategories,
    items,
    setupComplete,
    addItem,
    updateItem,
    removeItem,
    toggleItemFavorite,
    isLoading,
    error,
    setError,
    storageStatus,
    conflict,
    reloadFromDisk,
  } = useWardrobe();
  const { feedback, show, clear } = useFeedback();

  const [activeCategoryId, setActiveCategoryId] = useState<string | undefined>();
  const [activeSubcategoryId, setActiveSubcategoryId] = useState<
    string | undefined
  >();
  const [searchQuery, setSearchQuery] = useState("");
  const [isFormOpen, setIsFormOpen] = useState(false);
  const [editingItem, setEditingItem] = useState<WardrobeItem | undefined>();

  const sortedCategories = useMemo(() => sortByOrder(categories), [categories]);
  const sortedSubcategories = useMemo(
    () => sortByOrder(subcategories),
    [subcategories],
  );

  const safeCategoryId = useMemo(() => {
    if (!activeCategoryId) return undefined;
    return categories.some((item) => item.id === activeCategoryId)
      ? activeCategoryId
      : undefined;
  }, [activeCategoryId, categories]);

  const safeSubcategoryId = useMemo(() => {
    if (!activeSubcategoryId) return undefined;
    const subcategory = subcategories.find(
      (item) => item.id === activeSubcategoryId,
    );
    if (!subcategory) return undefined;
    if (safeCategoryId && subcategory.categoryId !== safeCategoryId) {
      return undefined;
    }
    return activeSubcategoryId;
  }, [activeSubcategoryId, safeCategoryId, subcategories]);

  const canRoute = storageStatus === "ready" || storageStatus === "empty";

  useEffect(() => {
    if (isHydrated && canRoute && !setupComplete) {
      router.replace("/setup");
    }
  }, [isHydrated, canRoute, setupComplete, router]);

  const filteredItems = useMemo(() => {
    const query = normalizeText(searchQuery);
    return items
      .filter((item) =>
        safeCategoryId ? item.categoryId === safeCategoryId : true,
      )
      .filter((item) =>
        safeSubcategoryId ? item.subcategoryId === safeSubcategoryId : true,
      )
      .filter((item) => {
        if (!query) return true;
        return (
          normalizeText(item.name).includes(query) ||
          normalizeText(item.color ?? "").includes(query) ||
          normalizeText(item.notes ?? "").includes(query)
        );
      });
  }, [items, safeCategoryId, safeSubcategoryId, searchQuery]);

  const openCreate = () => {
    setEditingItem(undefined);
    setIsFormOpen(true);
  };

  const openEdit = (item: WardrobeItem) => {
    setEditingItem(item);
    setIsFormOpen(true);
  };

  const handleRemoveItem = async (id: string) => {
    try {
      await removeItem(id);
      show({ type: "success", message: "Item deleted." });
    } catch (removeError) {
      show({
        type: "error",
        message:
          removeError instanceof Error
            ? removeError.message
            : "Unable to delete item.",
      });
    }
  };

  const handleToggleFavorite = async (id: string) => {
    try {
      await toggleItemFavorite(id);
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

  const handleSaveItem = async (
    values: Omit<WardrobeItem, "id" | "createdAt" | "isFavorite">,
  ) => {
    if (editingItem) {
      await updateItem({
        ...editingItem,
        ...values,
      });
      show({ type: "success", message: "Item updated." });
    } else {
      await addItem(values);
      show({ type: "success", message: "Item added." });
    }
  };

  const showEmptyWardrobe = items.length === 0 && filteredItems.length === 0;
  const showNoResults = items.length > 0 && filteredItems.length === 0;

  const clearFilters = () => {
    setActiveCategoryId(undefined);
    setActiveSubcategoryId(undefined);
    setSearchQuery("");
  };

  if (!isHydrated) {
    return <InlineNotice>Loading wardrobe...</InlineNotice>;
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
          {isLoading && <InlineNotice>Loading wardrobe...</InlineNotice>}
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
        <div>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent-soft text-accent">
              <Shirt size={20} />
            </div>
            <div>
              <h1 className="text-2xl font-semibold text-ink">My Wardrobe</h1>
              <p className="text-sm text-muted">
                {items.length} items | {categories.length} categories
              </p>
            </div>
          </div>
        </div>
        <Button onClick={openCreate}>Add item</Button>
      </header>

      <div className="grid gap-6 lg:grid-cols-[260px_1fr]">
        <div className="rounded-[var(--radius-card)] border border-border bg-white/80 p-4">
          <CategoryFilter
            categories={sortedCategories}
            subcategories={sortedSubcategories}
            activeCategoryId={safeCategoryId}
            activeSubcategoryId={safeSubcategoryId}
            onCategorySelect={(id) => {
              setActiveCategoryId(id);
              setActiveSubcategoryId(undefined);
            }}
            onSubcategorySelect={setActiveSubcategoryId}
          />
        </div>

        <div className="flex flex-col gap-4">
          <div className="flex flex-wrap items-center justify-between gap-3 rounded-[var(--radius-card)] border border-border bg-white/80 px-4 py-3">
            <div className="flex items-center gap-2 text-sm text-muted">
              <Search size={16} />
              <input
                className="min-w-[220px] bg-transparent text-sm text-ink focus:outline-none"
                placeholder="Search items, colors, notes"
                value={searchQuery}
                onChange={(event) => setSearchQuery(event.target.value)}
              />
            </div>
            <div className="text-xs text-muted">{filteredItems.length} results</div>
          </div>

          {showEmptyWardrobe ? (
            <div className="flex flex-col items-center gap-2 rounded-[var(--radius-card)] border border-dashed border-border bg-surface/60 px-6 py-10 text-center">
              <div className="text-sm font-semibold text-ink">No items yet</div>
              <p className="text-sm text-muted">
                Add your first piece to start building outfits.
              </p>
              <Button size="sm" onClick={openCreate}>
                Add an item
              </Button>
            </div>
          ) : showNoResults ? (
            <div className="flex flex-col items-center gap-2 rounded-[var(--radius-card)] border border-dashed border-border bg-surface/60 px-6 py-10 text-center">
              <div className="text-sm font-semibold text-ink">
                No matches for this filter
              </div>
              <p className="text-sm text-muted">
                Try clearing filters or adjusting your search.
              </p>
              <Button size="sm" variant="secondary" onClick={clearFilters}>
                Clear filters
              </Button>
            </div>
          ) : (
            <div className="grid gap-4 md:grid-cols-2 xl:grid-cols-3">
              {filteredItems.map((item) => (
                <ItemCard
                  key={item.id}
                  item={item}
                  category={categories.find(
                    (category) => category.id === item.categoryId,
                  )}
                  subcategory={subcategories.find(
                    (subcategory) => subcategory.id === item.subcategoryId,
                  )}
                  onEdit={openEdit}
                  onDelete={handleRemoveItem}
                  onToggleFavorite={handleToggleFavorite}
                />
              ))}
            </div>
          )}
        </div>
      </div>

      {isFormOpen && (
        <ItemForm
          key={editingItem?.id ?? "new"}
          open={isFormOpen}
          categories={categories}
          subcategories={subcategories}
          initial={editingItem}
          onClose={() => setIsFormOpen(false)}
          onSave={handleSaveItem}
        />
      )}
    </div>
  );
}

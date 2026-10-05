"use client";

import { useMemo, useState } from "react";
import Button from "@/shared/components/common/Button";
import InputField from "@/shared/components/common/InputField";
import { confirmAction } from "@/shared/lib/confirm";
import { normalizeText, sortByOrder } from "@/shared/lib/utils";
import type { Category, Subcategory } from "@/shared/types";

type CategoryManagerProps = {
  categories: Category[];
  subcategories: Subcategory[];
  error?: string;
  onClearError: () => void;
  onAddCategory: (name: string) => void | Promise<void>;
  onUpdateCategory: (id: string, name: string) => void | Promise<void>;
  onRemoveCategory: (id: string) => void | Promise<void>;
  onAddSubcategory: (categoryId: string, name: string) => void | Promise<void>;
  onUpdateSubcategory: (id: string, name: string) => void | Promise<void>;
  onRemoveSubcategory: (id: string) => void | Promise<void>;
};

export default function CategoryManager({
  categories,
  subcategories,
  error,
  onClearError,
  onAddCategory,
  onUpdateCategory,
  onRemoveCategory,
  onAddSubcategory,
  onUpdateSubcategory,
  onRemoveSubcategory,
}: CategoryManagerProps) {
  const [actionError, setActionError] = useState<string>();
  const run = async (operation: () => void | Promise<void>, success?: () => void) => {
    setActionError(undefined);
    try { await operation(); success?.(); }
    catch (error) { setActionError(error instanceof Error ? error.message : "Unable to save changes."); }
  };
  const [newCategoryName, setNewCategoryName] = useState("");
  const [categoryEdits, setCategoryEdits] = useState<Record<string, string>>({});
  const [subcategoryEdits, setSubcategoryEdits] = useState<Record<string, string>>(
    {},
  );
  const [newSubcategoryName, setNewSubcategoryName] = useState<
    Record<string, string>
  >({});

  const sortedCategories = useMemo(() => sortByOrder(categories), [categories]);
  const sortedSubcategories = useMemo(
    () => sortByOrder(subcategories),
    [subcategories],
  );

  const handleCategorySave = async (category: Category) => {
    const draft = categoryEdits[category.id] ?? category.name;
    if (normalizeText(draft) === normalizeText(category.name)) return;
    await run(() => onUpdateCategory(category.id, draft), () =>
      setCategoryEdits((prev) => ({ ...prev, [category.id]: draft.trim() })));
  };

  const handleSubcategorySave = async (subcategory: Subcategory) => {
    const draft = subcategoryEdits[subcategory.id] ?? subcategory.name;
    if (normalizeText(draft) === normalizeText(subcategory.name)) return;
    await run(() => onUpdateSubcategory(subcategory.id, draft), () =>
      setSubcategoryEdits((prev) => ({ ...prev, [subcategory.id]: draft.trim() })));
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="rounded-[var(--radius-card)] border border-border bg-white/80 p-5">
        <div className="text-sm font-semibold text-ink">Add a category</div>
        <p className="mb-3 text-xs text-muted">
          Create a new category and then add subcategories below.
        </p>
        <div className="flex flex-wrap gap-2">
          <InputField
            label="Category name"
            placeholder="Athleisure, Formalwear"
            value={newCategoryName}
            onChange={(event) => setNewCategoryName(event.target.value)}
          />
          <div className="flex items-end">
            <Button
              type="button"
              variant="secondary"
              onClick={async () => {
                await run(() => onAddCategory(newCategoryName), () => setNewCategoryName(""));
              }}
            >
              Add
            </Button>
          </div>
        </div>
      </div>

      {actionError && <p role="alert" className="text-sm text-danger">{actionError}</p>}
      {error && (
        <div className="rounded-[var(--radius-card)] border border-danger/40 bg-danger/10 px-4 py-3 text-xs text-danger">
          <div className="flex items-start justify-between gap-4">
            <span>{error}</span>
            <button
              className="text-xs font-semibold uppercase tracking-wide text-danger/80 hover:text-danger"
              onClick={onClearError}
              type="button"
            >
              Dismiss
            </button>
          </div>
        </div>
      )}

      {sortedCategories.length === 0 ? (
        <div className="rounded-[var(--radius-card)] border border-dashed border-border bg-surface/60 px-6 py-10 text-center text-sm text-muted">
          Add a category to start organizing your wardrobe.
        </div>
      ) : (
        <div className="grid gap-4">
          {sortedCategories.map((category) => {
            const categoryDraft = categoryEdits[category.id] ?? category.name;
            const categoryChanged =
              normalizeText(categoryDraft) !== normalizeText(category.name);
            const categorySubcategories = sortedSubcategories.filter(
              (subcategory) => subcategory.categoryId === category.id,
            );
            return (
              <div
                key={category.id}
                className="flex flex-col gap-4 rounded-[var(--radius-card)] border border-border bg-white/80 p-5"
              >
                <div className="flex flex-wrap items-end gap-3">
                  <label
                    className="flex flex-1 flex-col gap-1 text-sm text-muted"
                    htmlFor={`category-${category.id}`}
                  >
                    <span className="font-medium text-ink">Category</span>
                    <input
                      id={`category-${category.id}`}
                      className="rounded-xl border border-border bg-white/90 px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                      value={categoryDraft}
                      onChange={(event) =>
                        setCategoryEdits((prev) => ({
                          ...prev,
                          [category.id]: event.target.value,
                        }))
                      }
                    />
                  </label>
                  <div className="flex items-end gap-2">
                    <Button
                      type="button"
                      variant="secondary"
                      size="sm"
                      disabled={!categoryChanged}
                      onClick={() => handleCategorySave(category)}
                    >
                      Save
                    </Button>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        if (
                          confirmAction(
                            "Delete this category? Items in it will be removed and outfits/plans updated.",
                          )
                        ) {
                          void run(() => onRemoveCategory(category.id));
                        }
                      }}
                    >
                      Delete
                    </Button>
                  </div>
                </div>

                <div className="flex flex-col gap-3 rounded-xl border border-border/60 bg-surface/60 p-4">
                  <div className="text-xs font-semibold uppercase tracking-widest text-muted">
                    Subcategories
                  </div>
                  {categorySubcategories.length === 0 ? (
                    <div className="text-xs text-muted">
                      Add a subcategory to keep this organized.
                    </div>
                  ) : (
                    categorySubcategories.map((subcategory) => {
                      const subDraft =
                        subcategoryEdits[subcategory.id] ?? subcategory.name;
                      const subChanged =
                        normalizeText(subDraft) !==
                        normalizeText(subcategory.name);
                      return (
                        <div
                          key={subcategory.id}
                          className="flex flex-wrap items-end gap-3"
                        >
                          <label
                            className="flex flex-1 flex-col gap-1 text-sm text-muted"
                            htmlFor={`subcategory-${subcategory.id}`}
                          >
                            <span className="font-medium text-ink">
                              Subcategory
                            </span>
                            <input
                              id={`subcategory-${subcategory.id}`}
                              className="rounded-xl border border-border bg-white/90 px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                              value={subDraft}
                              onChange={(event) =>
                                setSubcategoryEdits((prev) => ({
                                  ...prev,
                                  [subcategory.id]: event.target.value,
                                }))
                              }
                            />
                          </label>
                          <div className="flex items-end gap-2">
                            <Button
                              type="button"
                              variant="secondary"
                              size="sm"
                              disabled={!subChanged}
                              onClick={() => handleSubcategorySave(subcategory)}
                            >
                              Save
                            </Button>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => {
                                if (
                                  confirmAction(
                                    "Delete this subcategory? Items will move to the default subcategory.",
                                  )
                                ) {
                                  void run(() => onRemoveSubcategory(subcategory.id));
                                }
                              }}
                            >
                              Delete
                            </Button>
                          </div>
                        </div>
                      );
                    })
                  )}

                  <div className="flex flex-wrap items-end gap-3 pt-2">
                    <label
                      className="flex flex-1 flex-col gap-1 text-sm text-muted"
                      htmlFor={`new-subcategory-${category.id}`}
                    >
                      <span className="font-medium text-ink">New subcategory</span>
                      <input
                        id={`new-subcategory-${category.id}`}
                        className="rounded-xl border border-border bg-white/90 px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                        placeholder="T-Shirts, Hoodies"
                        value={newSubcategoryName[category.id] ?? ""}
                        onChange={(event) =>
                          setNewSubcategoryName((prev) => ({
                            ...prev,
                            [category.id]: event.target.value,
                          }))
                        }
                      />
                    </label>
                    <div className="flex items-end">
                      <Button
                        type="button"
                        size="sm"
                        variant="secondary"
                        onClick={async () => {
                          const draft = newSubcategoryName[category.id] ?? "";
                          await run(() => onAddSubcategory(category.id, draft), () =>
                            setNewSubcategoryName((prev) => ({ ...prev, [category.id]: "" })));
                        }}
                      >
                        Add
                      </Button>
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

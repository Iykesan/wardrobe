"use client";

import { useMemo, useState } from "react";
import { Sparkles } from "lucide-react";
import { useRouter } from "next/navigation";
import CategoryManager from "@/features/setup/components/CategoryManager";
import { defaultCategorySeeds } from "@/features/setup/seeds";
import { useWardrobe } from "@/features/wardrobe/hooks/useWardrobe";
import Button from "@/shared/components/common/Button";
import { createId } from "@/shared/lib/utils";
import type { Category, Subcategory } from "@/shared/types";

type DraftCategory = {
  id: string;
  name: string;
  enabled: boolean;
  subcategories: string;
};

const buildDrafts = () =>
  defaultCategorySeeds.map((seed) => ({
    id: createId(),
    name: seed.name,
    enabled: true,
    subcategories: seed.subcategories.join(", "),
  }));

export default function SetupPage() {
  const router = useRouter();
  const {
    categories,
    subcategories,
    completeSetup,
    seedDefaults,
    setupComplete,
    addCategory,
    updateCategory,
    removeCategory,
    addSubcategory,
    updateSubcategory,
    removeSubcategory,
    error: storeError,
    setError,
  } = useWardrobe();
  const [drafts, setDrafts] = useState<DraftCategory[]>(buildDrafts);
  const [customCategory, setCustomCategory] = useState("");
  const [setupError, setSetupError] = useState<string | undefined>();

  const enabledDrafts = useMemo(
    () => drafts.filter((draft) => draft.enabled),
    [drafts],
  );

  const toggleCategory = (id: string) => {
    setDrafts((prev) =>
      prev.map((draft) =>
        draft.id === id ? { ...draft, enabled: !draft.enabled } : draft,
      ),
    );
  };

  const updateSubcategories = (id: string, value: string) => {
    setDrafts((prev) =>
      prev.map((draft) =>
        draft.id === id ? { ...draft, subcategories: value } : draft,
      ),
    );
  };

  const addCustomCategory = () => {
    const trimmed = customCategory.trim();
    if (!trimmed) return;
    setDrafts((prev) => [
      ...prev,
      { id: createId(), name: trimmed, enabled: true, subcategories: "" },
    ]);
    setCustomCategory("");
  };

  const handleComplete = async () => {
    if (enabledDrafts.length === 0) {
      setSetupError("Select at least one category to continue.");
      return;
    }
    setSetupError(undefined);
    const categories: Category[] = [];
    const subcategories: Subcategory[] = [];
    enabledDrafts.forEach((draft, index) => {
      const categoryId = createId();
      categories.push({
        id: categoryId,
        name: draft.name.trim(),
        order: index + 1,
      });
      const parsedSubs = draft.subcategories
        .split(",")
        .map((value) => value.trim())
        .filter(Boolean);
      const finalSubs = parsedSubs.length > 0 ? parsedSubs : [draft.name.trim()];
      finalSubs.forEach((name, subIndex) => {
        subcategories.push({
          id: createId(),
          categoryId,
          name,
          order: subIndex + 1,
        });
      });
    });
    try {
      await completeSetup(categories, subcategories);
      router.push("/wardrobe");
    } catch (error) {
      setSetupError(error instanceof Error ? error.message : "Unable to complete setup.");
    }
  };

  return (
    <div className="mx-auto flex w-full max-w-4xl flex-col gap-8">
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-2xl bg-accent-soft text-accent">
            <Sparkles size={20} />
          </div>
          <div>
            <h1 className="text-2xl font-semibold text-ink">Setup your wardrobe</h1>
            <p className="text-sm text-muted">
              Pick the categories that fit your closet. You can edit later.
            </p>
          </div>
        </div>
      </header>

      {setupComplete ? (
        <div className="flex flex-col gap-6">
          <div className="rounded-[var(--radius-card)] border border-border bg-white/80 p-4 text-sm text-muted">
            Setup is complete. Manage categories and subcategories below, or head
            back to your wardrobe.
          </div>
          <CategoryManager
            categories={categories}
            subcategories={subcategories}
            error={storeError}
            onClearError={() => setError(undefined)}
            onAddCategory={addCategory}
            onUpdateCategory={updateCategory}
            onRemoveCategory={removeCategory}
            onAddSubcategory={addSubcategory}
            onUpdateSubcategory={updateSubcategory}
            onRemoveSubcategory={removeSubcategory}
          />
        </div>
      ) : (
        <div className="grid gap-6 lg:grid-cols-[1.1fr_0.9fr]">
          <div className="rounded-[var(--radius-card)] border border-border bg-white/80 p-5">
            <div className="text-sm font-semibold text-ink">Core categories</div>
            <p className="mb-4 text-xs text-muted">
              Toggle what you own and tweak subcategories for faster entry later.
            </p>
            <div className="grid gap-3">
              {drafts.map((draft) => (
                <div
                  key={draft.id}
                  className="flex flex-col gap-3 rounded-xl border border-border bg-surface/70 p-4"
                >
                  <div className="flex items-center justify-between gap-4">
                    <div className="text-sm font-semibold text-ink">
                      {draft.name}
                    </div>
                    <button
                      className={`rounded-full px-3 py-1 text-xs font-semibold uppercase tracking-wide ${
                        draft.enabled
                          ? "bg-accent-soft text-accent"
                          : "border border-border text-muted"
                      }`}
                      onClick={() => toggleCategory(draft.id)}
                      type="button"
                    >
                      {draft.enabled ? "Enabled" : "Disabled"}
                    </button>
                  </div>
                  <label className="flex flex-col gap-1 text-xs text-muted">
                    Subcategories (comma separated)
                    <input
                      className="rounded-xl border border-border bg-white/90 px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                      value={draft.subcategories}
                      onChange={(event) =>
                        updateSubcategories(draft.id, event.target.value)
                      }
                      placeholder="T-Shirts, Sweaters, Hoodies"
                      disabled={!draft.enabled}
                    />
                  </label>
                </div>
              ))}
            </div>
          </div>

          <div className="flex flex-col gap-6">
            <div className="rounded-[var(--radius-card)] border border-border bg-white/80 p-5">
              <div className="text-sm font-semibold text-ink">Add a category</div>
              <p className="mb-3 text-xs text-muted">
                Make this space your own. Add a category anytime.
              </p>
              <div className="flex gap-2">
                <input
                  className="flex-1 rounded-xl border border-border bg-white/90 px-3 py-2 text-sm text-ink focus:border-accent focus:outline-none focus:ring-2 focus:ring-accent/20"
                  placeholder="Athleisure, Formalwear"
                  value={customCategory}
                  onChange={(event) => setCustomCategory(event.target.value)}
                />
                <Button
                  type="button"
                  variant="secondary"
                  onClick={addCustomCategory}
                >
                  Add
                </Button>
              </div>
            </div>

            <div className="rounded-[var(--radius-card)] border border-border bg-white/80 p-5">
              <div className="text-sm font-semibold text-ink">Quick start</div>
              <p className="mb-3 text-xs text-muted">
                Use the recommended defaults with one click.
              </p>
              <Button
                type="button"
                variant="secondary"
                onClick={async () => {
                  try {
                    await seedDefaults();
                    router.push("/wardrobe");
                  } catch (error) {
                    setSetupError(error instanceof Error ? error.message : "Unable to complete setup.");
                  }
                }}
              >
                Use defaults
              </Button>
            </div>

            {setupError && (
              <div className="rounded-[var(--radius-card)] border border-danger/40 bg-danger/10 px-4 py-3 text-xs text-danger">
                {setupError}
              </div>
            )}

            <div className="rounded-[var(--radius-card)] border border-border bg-white/80 p-5">
              <div className="mb-2 text-sm font-semibold text-ink">
                Ready to continue?
              </div>
              <p className="mb-4 text-xs text-muted">
                You can always rename or add categories later.
              </p>
              <Button type="button" onClick={handleComplete}>
                Finish setup
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

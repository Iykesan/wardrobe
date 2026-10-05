"use client";

import { create } from "zustand";
import { persist } from "zustand/middleware";
import { validateWardrobeData } from "@/features/wardrobe/domain/validation";
import { MAX_ITEMS } from "@/shared/config/constants";
import { defaultCategorySeeds } from "@/features/setup/seeds";
import { createId, normalizeText, sortByOrder } from "@/shared/lib/utils";
import type {
  Category,
  Subcategory,
  WardrobeItem,
  Outfit,
  PlanEntry,
} from "@/shared/types";

type WardrobeState = {
  isHydrated: boolean;
  isLoading: boolean;
  error?: string;
  categories: Category[];
  subcategories: Subcategory[];
  items: WardrobeItem[];
  outfits: Outfit[];
  plans: PlanEntry[];
  setupComplete: boolean;
  setHydrated: () => void;
  setError: (message?: string) => void;
  completeSetup: (
    categories: Category[],
    subcategories: Subcategory[],
  ) => Promise<void>;
  seedDefaults: () => Promise<void>;
  addCategory: (name: string) => Promise<void>;
  updateCategory: (id: string, name: string) => Promise<void>;
  removeCategory: (id: string) => Promise<void>;
  addSubcategory: (categoryId: string, name: string) => Promise<void>;
  updateSubcategory: (id: string, name: string) => Promise<void>;
  removeSubcategory: (id: string) => Promise<void>;
  addItem: (
    payload: Omit<WardrobeItem, "id" | "createdAt" | "isFavorite">,
  ) => Promise<WardrobeItem>;
  updateItem: (payload: WardrobeItem) => Promise<void>;
  removeItem: (id: string) => Promise<void>;
  toggleItemFavorite: (id: string) => void;
  addOutfit: (payload: Omit<Outfit, "id" | "createdAt">) => Promise<void>;
  updateOutfit: (payload: Outfit) => Promise<void>;
  removeOutfit: (id: string) => Promise<void>;
  toggleOutfitFavorite: (id: string) => void;
  addPlan: (payload: Omit<PlanEntry, "id" | "createdAt">) => Promise<void>;
  updatePlan: (payload: PlanEntry) => Promise<void>;
  removePlan: (id: string) => Promise<void>;
};

const toISO = () => new Date().toISOString();

const findDefaultSubcategory = (
  subcategories: Subcategory[],
  categoryId: string,
) => {
  const filtered = subcategories
    .filter((subcategory) => subcategory.categoryId === categoryId)
    .sort((a, b) => a.order - b.order);
  return filtered[0];
};

export const useWardrobeStore = create<WardrobeState>()(
  persist(
    (publish, get) => {
      const set: typeof publish = (partial) => {
        const current = get();
        const patch = typeof partial === "function" ? partial(current) : partial;
        const changesData = ["categories", "subcategories", "items", "outfits", "plans", "setupComplete"].some((key) => key in patch);
        if (!changesData) { publish(patch); return; }
        const next = validateWardrobeData({ ...current, ...patch });
        if (next.items.length > MAX_ITEMS && next.items.length > current.items.length) {
          throw new Error(`Your wardrobe is limited to ${MAX_ITEMS} items.`);
        }
        publish({ ...next, error: undefined });
      };
      return ({
      isHydrated: false,
      isLoading: false,
      categories: [],
      subcategories: [],
      items: [],
      outfits: [],
      plans: [],
      setupComplete: false,
      setHydrated: () => set({ isHydrated: true }),
      setError: (message) => set({ error: message }),
      completeSetup: async (categories, subcategories) => {
        set({
          categories: sortByOrder(categories),
          subcategories: sortByOrder(subcategories),
          setupComplete: true,
        });
      },
      seedDefaults: async () => {
        const seedCategories: Category[] = [];
        const seedSubcategories: Subcategory[] = [];
        defaultCategorySeeds.forEach((seed, index) => {
          const categoryId = createId();
          seedCategories.push({
            id: categoryId,
            name: seed.name,
            order: index + 1,
          });
          const subcats = seed.subcategories.length
            ? seed.subcategories
            : [seed.name];
          subcats.forEach((subcat, subIndex) => {
            seedSubcategories.push({
              id: createId(),
              categoryId,
              name: subcat,
              order: subIndex + 1,
            });
          });
        });
        await get().completeSetup(seedCategories, seedSubcategories);
      },
      addCategory: async (name) => {
        const trimmed = name.trim();
        if (!trimmed) throw new Error("Category name cannot be empty.");
        if (
          get().categories.some(
            (category) =>
              normalizeText(category.name) === normalizeText(trimmed),
          )
        ) {
          throw new Error("That category already exists.");
        }
        const category: Category = {
          id: createId(),
          name: trimmed,
          order: get().categories.length + 1,
        };
        const subcategory: Subcategory = {
          id: createId(),
          categoryId: category.id,
          name: trimmed,
          order: 1,
        };
        set((state) => ({
          categories: [...state.categories, category],
          subcategories: [...state.subcategories, subcategory],
        }));
      },
      updateCategory: async (id, name) => {
        const trimmed = name.trim();
        if (!trimmed) throw new Error("Category name cannot be empty.");
        set((state) => ({
          categories: state.categories.map((category) =>
            category.id === id ? { ...category, name: trimmed } : category,
          ),
          subcategories: state.subcategories.map((subcategory) =>
            subcategory.categoryId === id &&
            normalizeText(subcategory.name) ===
              normalizeText(
                state.categories.find((category) => category.id === id)?.name ??
                  "",
              )
              ? { ...subcategory, name: trimmed }
              : subcategory,
          ),
        }));
      },
      removeCategory: async (id) => {
        const itemsToRemove = get().items.filter(
          (item) => item.categoryId === id,
        );
        const itemIdsToRemove = itemsToRemove.map((item) => item.id);
        const updatedOutfits = get()
          .outfits.map((outfit) => ({
            ...outfit,
            itemIds: outfit.itemIds.filter(
              (itemId) => !itemIdsToRemove.includes(itemId),
            ),
          }))
          .filter((outfit) => outfit.itemIds.length > 0);
        const removedOutfitIds = get()
          .outfits.filter(
            (outfit) =>
              outfit.itemIds.length > 0 &&
              outfit.itemIds.every((itemId) => itemIdsToRemove.includes(itemId)),
          )
          .map((outfit) => outfit.id);
        set((state) => ({
          categories: state.categories.filter((category) => category.id !== id),
          subcategories: state.subcategories.filter(
            (subcategory) => subcategory.categoryId !== id,
          ),
          items: state.items.filter((item) => item.categoryId !== id),
          outfits: updatedOutfits,
          plans: state.plans.filter(
            (plan) => !removedOutfitIds.includes(plan.outfitId),
          ),
        }));
      },
      addSubcategory: async (categoryId, name) => {
        const trimmed = name.trim();
        if (!trimmed) throw new Error("Subcategory name cannot be empty.");
        if (
          get().subcategories.some(
            (subcategory) =>
              subcategory.categoryId === categoryId &&
              normalizeText(subcategory.name) === normalizeText(trimmed),
          )
        ) {
          throw new Error("That subcategory already exists.");
        }
        const order =
          get().subcategories.filter(
            (subcategory) => subcategory.categoryId === categoryId,
          ).length + 1;
        const subcategory: Subcategory = {
          id: createId(),
          categoryId,
          name: trimmed,
          order,
        };
        set((state) => ({
          subcategories: [...state.subcategories, subcategory],
        }));
      },
      updateSubcategory: async (id, name) => {
        const trimmed = name.trim();
        if (!trimmed) throw new Error("Subcategory name cannot be empty.");
        set((state) => ({
          subcategories: state.subcategories.map((subcategory) =>
            subcategory.id === id ? { ...subcategory, name: trimmed } : subcategory,
          ),
        }));
      },
      removeSubcategory: async (id) => {
        const subcategory = get().subcategories.find((item) => item.id === id);
        if (!subcategory) return;
        const remaining = get().subcategories.filter((item) => item.id !== id);
        let defaultSubcategory = findDefaultSubcategory(
          remaining,
          subcategory.categoryId,
        );
        let updatedSubcategories = remaining;
        if (!defaultSubcategory) {
          const categoryName =
            get().categories.find((category) => category.id === subcategory.categoryId)
              ?.name ?? "General";
          defaultSubcategory = {
            id: createId(),
            categoryId: subcategory.categoryId,
            name: categoryName,
            order: 1,
          };
          updatedSubcategories = [...remaining, defaultSubcategory];
        }
        set((state) => ({
          subcategories: updatedSubcategories,
          items: state.items.map((item) =>
            item.subcategoryId === id
              ? { ...item, subcategoryId: defaultSubcategory!.id }
              : item,
          ),
        }));
      },
      addItem: async (payload) => {
        const item: WardrobeItem = {
          id: createId(),
          createdAt: toISO(),
          isFavorite: false,
          ...payload,
        };
        set((state) => ({ items: [item, ...state.items] }));
        return item;
      },
      updateItem: async (payload) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === payload.id ? { ...payload } : item,
          ),
        }));
      },
      removeItem: async (id) => {
        const updatedOutfits = get()
          .outfits.map((outfit) => ({
            ...outfit,
            itemIds: outfit.itemIds.filter((itemId) => itemId !== id),
          }))
          .filter((outfit) => outfit.itemIds.length > 0);
        const removedOutfitIds = get()
          .outfits.filter(
            (outfit) => outfit.itemIds.includes(id) && outfit.itemIds.length === 1,
          )
          .map((outfit) => outfit.id);
        set((state) => ({
          items: state.items.filter((item) => item.id !== id),
          outfits: updatedOutfits,
          plans: state.plans.filter(
            (plan) => !removedOutfitIds.includes(plan.outfitId),
          ),
        }));
      },
      toggleItemFavorite: (id) => {
        set((state) => ({
          items: state.items.map((item) =>
            item.id === id ? { ...item, isFavorite: !item.isFavorite } : item,
          ),
        }));
      },
      addOutfit: async (payload) => {
        const outfit: Outfit = {
          id: createId(),
          createdAt: toISO(),
          isFavorite: payload.isFavorite ?? false,
          name: payload.name?.trim() || undefined,
          itemIds: payload.itemIds,
        };
        set((state) => ({ outfits: [outfit, ...state.outfits] }));
      },
      updateOutfit: async (payload) => {
        set((state) => ({
          outfits: state.outfits.map((outfit) =>
            outfit.id === payload.id ? { ...payload } : outfit,
          ),
        }));
      },
      removeOutfit: async (id) => {
        set((state) => ({
          outfits: state.outfits.filter((outfit) => outfit.id !== id),
          plans: state.plans.filter((plan) => plan.outfitId !== id),
        }));
      },
      toggleOutfitFavorite: (id) => {
        set((state) => ({
          outfits: state.outfits.map((outfit) =>
            outfit.id === id ? { ...outfit, isFavorite: !outfit.isFavorite } : outfit,
          ),
        }));
      },
      addPlan: async (payload) => {
        const existing = get().plans.find(
          (plan) => plan.plannedDate === payload.plannedDate,
        );
        if (existing) {
          const updated: PlanEntry = {
            ...existing,
            outfitId: payload.outfitId,
            description: payload.description,
          };
          set((state) => ({
            plans: state.plans.map((plan) =>
              plan.id === existing.id ? updated : plan,
            ),
          }));
          return;
        }
        const plan: PlanEntry = {
          id: createId(),
          createdAt: toISO(),
          ...payload,
        };
        set((state) => ({ plans: [...state.plans, plan] }));
      },
      updatePlan: async (payload) => {
        set((state) => ({
          plans: state.plans.map((plan) =>
            plan.id === payload.id ? { ...payload } : plan,
          ),
        }));
      },
      removePlan: async (id) => {
        set((state) => ({
          plans: state.plans.filter((plan) => plan.id !== id),
        }));
      },
    });
    },
    {
      name: "wardrope-store",
      partialize: (state) => ({
        categories: state.categories,
        subcategories: state.subcategories,
        items: state.items,
        outfits: state.outfits,
        plans: state.plans,
        setupComplete: state.setupComplete,
      }),
      onRehydrateStorage: () => (state) => {
        state?.setHydrated();
      },
    },
  ),
);

"use client";

import { create } from "zustand";
import { validateWardrobeData, type WardrobeData } from "@/features/wardrobe/domain/validation";
import { MAX_ITEMS } from "@/shared/config/constants";
import { defaultCategorySeeds } from "@/features/setup/seeds";
import { createId, normalizeText, sortByOrder } from "@/shared/lib/utils";
import {
  clearWardrobe,
  loadWardrobe,
  persistWardrobe,
  StorageConflictError,
  StorageWriteError,
  type StorageLoadResult,
} from "@/features/wardrobe/store/persistence";
import { createBackup, previewBackup, type BackupPreview } from "@/features/wardrobe/store/backup";
import type {
  Category,
  Subcategory,
  WardrobeItem,
  Outfit,
  PlanEntry,
} from "@/shared/types";

export type StorageStatus =
  | "initializing"
  | "ready"
  | "empty"
  | "recovery-required"
  | "unavailable";

export type RecoveryInfo = {
  kind: "invalid" | "future";
  reason: string;
  raw: string;
};

export type ConflictInfo = {
  message: string;
};

type WardrobeDataFields = {
  categories: Category[];
  subcategories: Subcategory[];
  items: WardrobeItem[];
  outfits: Outfit[];
  plans: PlanEntry[];
  setupComplete: boolean;
};

export type WardrobeState = WardrobeDataFields & {
  isHydrated: boolean;
  isLoading: boolean;
  error?: string;
  storageStatus: StorageStatus;
  recovery?: RecoveryInfo;
  conflict?: ConflictInfo;
  /**
   * Exact raw bytes this tab loaded from storage. Writes and clears only
   * proceed while the on-disk bytes still match this value.
   */
  loadedRaw: string | null;
  initialize: (options?: { force?: boolean }) => Promise<void>;
  reloadFromDisk: () => Promise<void>;
  setError: (message?: string) => void;
  exportBackup: () => string;
  previewRestore: (text: string) => BackupPreview;
  restoreBackup: (data: WardrobeData) => Promise<void>;
  resetStorage: () => Promise<void>;
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
  toggleItemFavorite: (id: string) => Promise<void>;
  addOutfit: (payload: Omit<Outfit, "id" | "createdAt">) => Promise<void>;
  updateOutfit: (payload: Outfit) => Promise<void>;
  removeOutfit: (id: string) => Promise<void>;
  toggleOutfitFavorite: (id: string) => Promise<void>;
  addPlan: (payload: Omit<PlanEntry, "id" | "createdAt">) => Promise<void>;
  updatePlan: (payload: PlanEntry) => Promise<void>;
  removePlan: (id: string) => Promise<void>;
};

const EMPTY_DATA: WardrobeDataFields = {
  categories: [],
  subcategories: [],
  items: [],
  outfits: [],
  plans: [],
  setupComplete: false,
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

const currentData = (state: WardrobeState): WardrobeData => ({
  categories: state.categories,
  subcategories: state.subcategories,
  items: state.items,
  outfits: state.outfits,
  plans: state.plans,
  setupComplete: state.setupComplete,
});

const CONFLICT_MESSAGE =
  "This wardrobe was changed in another tab. Reload to continue. Your change was not saved.";
const STORAGE_BLOCKED_MESSAGE =
  "Saving is disabled until the stored wardrobe is available or recovered.";

// Guard against double initialization from React Strict Mode and repeated mounts.
let initPromise: Promise<void> | null = null;

export const useWardrobeStore = create<WardrobeState>()((set, get) => {
  // Serialize mutations and reloads within this tab so each write compares
  // against the bytes left by the previous operation. Cross-tab safety is
  // handled by the Web Lock inside the persistence layer.
  let mutationQueue: Promise<unknown> = Promise.resolve();
  const runExclusive = <T,>(operation: () => Promise<T>): Promise<T> => {
    const result = mutationQueue.then(operation, operation);
    mutationQueue = result.then(
      () => undefined,
      () => undefined,
    );
    return result;
  };

  const applyLoadResult = (result: StorageLoadResult) => {
    if (result.status === "empty") {
      set({
        ...EMPTY_DATA,
        loadedRaw: null,
        storageStatus: "empty",
        recovery: undefined,
        conflict: undefined,
        isHydrated: true,
        isLoading: false,
        error: undefined,
      });
      return;
    }
    if (result.status === "ok") {
      set({
        ...result.data,
        loadedRaw: result.raw,
        storageStatus: "ready",
        recovery: undefined,
        conflict: undefined,
        isHydrated: true,
        isLoading: false,
        error: undefined,
      });
      return;
    }
    if (result.status === "invalid" || result.status === "future") {
      set({
        ...EMPTY_DATA,
        loadedRaw: result.raw,
        storageStatus: "recovery-required",
        recovery: { kind: result.status, reason: result.reason, raw: result.raw },
        conflict: undefined,
        isHydrated: true,
        isLoading: false,
        error: result.reason,
      });
      return;
    }
    set({
      ...EMPTY_DATA,
      loadedRaw: null,
      storageStatus: "unavailable",
      recovery: undefined,
      conflict: undefined,
      isHydrated: true,
      isLoading: false,
      error: result.reason,
    });
  };

  const handlePersistError = (error: unknown): never => {
    if (error instanceof StorageConflictError) {
      set({ conflict: { message: CONFLICT_MESSAGE }, error: CONFLICT_MESSAGE });
      throw new Error(CONFLICT_MESSAGE);
    }
    const message =
      error instanceof StorageWriteError
        ? error.quota
          ? "Storage is full. Your change was not saved. Export a backup and remove some data, then try again."
          : `Could not save changes: ${error.message}`
        : "Could not save changes. Your previous data is unchanged.";
    set({ error: message });
    throw new Error(message);
  };

  const persistValidated = async (validated: WardrobeData) => {
    const state = get();
    if (state.conflict) throw new Error(CONFLICT_MESSAGE);
    try {
      const raw = await persistWardrobe(validated, state.loadedRaw);
      set({
        ...validated,
        loadedRaw: raw,
        storageStatus: "ready",
        recovery: undefined,
        conflict: undefined,
        error: undefined,
      });
    } catch (error) {
      handlePersistError(error);
    }
  };

  const commitData = (
    producer: WardrobeData | ((state: WardrobeState) => WardrobeData),
  ) =>
    runExclusive(async () => {
      const state = get();
      if (state.conflict) throw new Error(CONFLICT_MESSAGE);
      if (
        state.storageStatus === "initializing" ||
        state.storageStatus === "recovery-required" ||
        state.storageStatus === "unavailable"
      ) {
        throw new Error(STORAGE_BLOCKED_MESSAGE);
      }
      const next = typeof producer === "function" ? producer(state) : producer;
      if (next.items.length > MAX_ITEMS && next.items.length > state.items.length) {
        throw new Error(`Your wardrobe is limited to ${MAX_ITEMS} items.`);
      }
      const validated = validateWardrobeData(next);
      await persistValidated(validated);
    });

  return {
    ...EMPTY_DATA,
    isHydrated: false,
    isLoading: false,
    storageStatus: "initializing",
    loadedRaw: null,

    initialize: async (options) => {
      const force = options?.force ?? false;
      if (get().isHydrated && !force) return;
      if (initPromise) return initPromise;
      initPromise = runExclusive(async () => {
        set({ isLoading: true, error: undefined, conflict: undefined });
        applyLoadResult(loadWardrobe());
      }).finally(() => {
        initPromise = null;
      });
      return initPromise;
    },

    reloadFromDisk: async () => {
      set({ conflict: undefined });
      await get().initialize({ force: true });
    },

    setError: (message) => set({ error: message }),

    exportBackup: () => {
      if (!["ready", "empty"].includes(get().storageStatus)) {
        throw new Error("Use Download original data to preserve unreadable storage before recovery.");
      }
      return createBackup(currentData(get()));
    },

    previewRestore: (text) => previewBackup(text),

    restoreBackup: async (data) => {
      const validated = validateWardrobeData(data);
      await runExclusive(async () => {
        if (["initializing", "unavailable"].includes(get().storageStatus)) throw new Error(STORAGE_BLOCKED_MESSAGE);
        await persistValidated(validated);
      });
    },

    resetStorage: async () => {
      await runExclusive(async () => {
        if (["initializing", "unavailable"].includes(get().storageStatus)) throw new Error(STORAGE_BLOCKED_MESSAGE);
        try {
          await clearWardrobe(get().loadedRaw);
        } catch (error) {
          handlePersistError(error);
        }
        set({
          ...EMPTY_DATA,
          loadedRaw: null,
          storageStatus: "empty",
          recovery: undefined,
          conflict: undefined,
          error: undefined,
        });
      });
    },

    completeSetup: async (categories, subcategories) => {
      await commitData((state) => ({
        ...currentData(state),
        categories: sortByOrder(categories),
        subcategories: sortByOrder(subcategories),
        setupComplete: true,
      }));
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
      await commitData((state) => {
        if (
          state.categories.some(
            (category) => normalizeText(category.name) === normalizeText(trimmed),
          )
        ) {
          throw new Error("That category already exists.");
        }
        const category: Category = {
          id: createId(),
          name: trimmed,
          order: state.categories.length + 1,
        };
        const subcategory: Subcategory = {
          id: createId(),
          categoryId: category.id,
          name: trimmed,
          order: 1,
        };
        return {
          ...currentData(state),
          categories: [...state.categories, category],
          subcategories: [...state.subcategories, subcategory],
        };
      });
    },

    updateCategory: async (id, name) => {
      const trimmed = name.trim();
      if (!trimmed) throw new Error("Category name cannot be empty.");
      await commitData((state) => {
        const previousName =
          state.categories.find((category) => category.id === id)?.name ?? "";
        return {
          ...currentData(state),
          categories: state.categories.map((category) =>
            category.id === id ? { ...category, name: trimmed } : category,
          ),
          subcategories: state.subcategories.map((subcategory) =>
            subcategory.categoryId === id &&
            normalizeText(subcategory.name) === normalizeText(previousName)
              ? { ...subcategory, name: trimmed }
              : subcategory,
          ),
        };
      });
    },

    removeCategory: async (id) => {
      await commitData((state) => {
        const itemIdsToRemove = state.items
          .filter((item) => item.categoryId === id)
          .map((item) => item.id);
        const updatedOutfits = state.outfits
          .map((outfit) => ({
            ...outfit,
            itemIds: outfit.itemIds.filter(
              (itemId) => !itemIdsToRemove.includes(itemId),
            ),
          }))
          .filter((outfit) => outfit.itemIds.length > 0);
        const removedOutfitIds = state.outfits
          .filter(
            (outfit) =>
              outfit.itemIds.length > 0 &&
              outfit.itemIds.every((itemId) => itemIdsToRemove.includes(itemId)),
          )
          .map((outfit) => outfit.id);
        return {
          ...currentData(state),
          categories: state.categories.filter((category) => category.id !== id),
          subcategories: state.subcategories.filter(
            (subcategory) => subcategory.categoryId !== id,
          ),
          items: state.items.filter((item) => item.categoryId !== id),
          outfits: updatedOutfits,
          plans: state.plans.filter(
            (plan) => !removedOutfitIds.includes(plan.outfitId),
          ),
        };
      });
    },

    addSubcategory: async (categoryId, name) => {
      const trimmed = name.trim();
      if (!trimmed) throw new Error("Subcategory name cannot be empty.");
      await commitData((state) => {
        if (
          state.subcategories.some(
            (subcategory) =>
              subcategory.categoryId === categoryId &&
              normalizeText(subcategory.name) === normalizeText(trimmed),
          )
        ) {
          throw new Error("That subcategory already exists.");
        }
        const order =
          state.subcategories.filter(
            (subcategory) => subcategory.categoryId === categoryId,
          ).length + 1;
        const subcategory: Subcategory = {
          id: createId(),
          categoryId,
          name: trimmed,
          order,
        };
        return {
          ...currentData(state),
          subcategories: [...state.subcategories, subcategory],
        };
      });
    },

    updateSubcategory: async (id, name) => {
      const trimmed = name.trim();
      if (!trimmed) throw new Error("Subcategory name cannot be empty.");
      await commitData((state) => ({
        ...currentData(state),
        subcategories: state.subcategories.map((subcategory) =>
          subcategory.id === id ? { ...subcategory, name: trimmed } : subcategory,
        ),
      }));
    },

    removeSubcategory: async (id) => {
      await commitData((state) => {
        const subcategory = state.subcategories.find((item) => item.id === id);
        if (!subcategory) return currentData(state);
        const remaining = state.subcategories.filter((item) => item.id !== id);
        let defaultSubcategory = findDefaultSubcategory(
          remaining,
          subcategory.categoryId,
        );
        let updatedSubcategories = remaining;
        if (!defaultSubcategory) {
          const categoryName =
            state.categories.find(
              (category) => category.id === subcategory.categoryId,
            )?.name ?? "General";
          defaultSubcategory = {
            id: createId(),
            categoryId: subcategory.categoryId,
            name: categoryName,
            order: 1,
          };
          updatedSubcategories = [...remaining, defaultSubcategory];
        }
        return {
          ...currentData(state),
          subcategories: updatedSubcategories,
          items: state.items.map((item) =>
            item.subcategoryId === id
              ? { ...item, subcategoryId: defaultSubcategory!.id }
              : item,
          ),
        };
      });
    },

    addItem: async (payload) => {
      const item: WardrobeItem = {
        id: createId(),
        createdAt: toISO(),
        isFavorite: false,
        ...payload,
      };
      await commitData((state) => ({
        ...currentData(state),
        items: [item, ...state.items],
      }));
      return item;
    },

    updateItem: async (payload) => {
      await commitData((state) => ({
        ...currentData(state),
        items: state.items.map((item) =>
          item.id === payload.id ? { ...payload } : item,
        ),
      }));
    },

    removeItem: async (id) => {
      await commitData((state) => {
        const updatedOutfits = state.outfits
          .map((outfit) => ({
            ...outfit,
            itemIds: outfit.itemIds.filter((itemId) => itemId !== id),
          }))
          .filter((outfit) => outfit.itemIds.length > 0);
        const removedOutfitIds = state.outfits
          .filter(
            (outfit) =>
              outfit.itemIds.includes(id) && outfit.itemIds.length === 1,
          )
          .map((outfit) => outfit.id);
        return {
          ...currentData(state),
          items: state.items.filter((item) => item.id !== id),
          outfits: updatedOutfits,
          plans: state.plans.filter(
            (plan) => !removedOutfitIds.includes(plan.outfitId),
          ),
        };
      });
    },

    toggleItemFavorite: async (id) => {
      await commitData((state) => ({
        ...currentData(state),
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
      await commitData((state) => ({
        ...currentData(state),
        outfits: [outfit, ...state.outfits],
      }));
    },

    updateOutfit: async (payload) => {
      await commitData((state) => ({
        ...currentData(state),
        outfits: state.outfits.map((outfit) =>
          outfit.id === payload.id ? { ...payload } : outfit,
        ),
      }));
    },

    removeOutfit: async (id) => {
      await commitData((state) => ({
        ...currentData(state),
        outfits: state.outfits.filter((outfit) => outfit.id !== id),
        plans: state.plans.filter((plan) => plan.outfitId !== id),
      }));
    },

    toggleOutfitFavorite: async (id) => {
      await commitData((state) => ({
        ...currentData(state),
        outfits: state.outfits.map((outfit) =>
          outfit.id === id ? { ...outfit, isFavorite: !outfit.isFavorite } : outfit,
        ),
      }));
    },

    addPlan: async (payload) => {
      await commitData((state) => {
        const existing = state.plans.find(
          (plan) => plan.plannedDate === payload.plannedDate,
        );
        if (existing) {
          const updated: PlanEntry = {
            ...existing,
            outfitId: payload.outfitId,
            description: payload.description,
          };
          return {
            ...currentData(state),
            plans: state.plans.map((plan) =>
              plan.id === existing.id ? updated : plan,
            ),
          };
        }
        const plan: PlanEntry = {
          id: createId(),
          createdAt: toISO(),
          ...payload,
        };
        return {
          ...currentData(state),
          plans: [...state.plans, plan],
        };
      });
    },

    updatePlan: async (payload) => {
      await commitData((state) => ({
        ...currentData(state),
        plans: state.plans.map((plan) =>
          plan.id === payload.id ? { ...payload } : plan,
        ),
      }));
    },

    removePlan: async (id) => {
      await commitData((state) => ({
        ...currentData(state),
        plans: state.plans.filter((plan) => plan.id !== id),
      }));
    },
  };
});

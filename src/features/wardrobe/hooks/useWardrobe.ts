import { useShallow } from "zustand/react/shallow";
import { useWardrobeStore } from "@/features/wardrobe/store/wardrobeStore";

export const useWardrobe = () =>
  useWardrobeStore(
    useShallow((state) => ({
      categories: state.categories,
      subcategories: state.subcategories,
      items: state.items,
      outfits: state.outfits,
      setupComplete: state.setupComplete,
      isHydrated: state.isHydrated,
      isLoading: state.isLoading,
      error: state.error,
      storageStatus: state.storageStatus,
      recovery: state.recovery,
      conflict: state.conflict,
      setError: state.setError,
      initialize: state.initialize,
      reloadFromDisk: state.reloadFromDisk,
      exportBackup: state.exportBackup,
      previewRestore: state.previewRestore,
      restoreBackup: state.restoreBackup,
      resetStorage: state.resetStorage,
      addItem: state.addItem,
      updateItem: state.updateItem,
      removeItem: state.removeItem,
      toggleItemFavorite: state.toggleItemFavorite,
      addCategory: state.addCategory,
      updateCategory: state.updateCategory,
      removeCategory: state.removeCategory,
      addSubcategory: state.addSubcategory,
      updateSubcategory: state.updateSubcategory,
      removeSubcategory: state.removeSubcategory,
      seedDefaults: state.seedDefaults,
      completeSetup: state.completeSetup,
    })),
  );

import { useEffect } from "react";
import { useWardrobeStore } from "@/features/wardrobe/store/wardrobeStore";

/**
 * Kick off local persistence hydration once a screen mounts. Safe to call from
 * multiple screens; the store ignores repeated initialization.
 */
export const useWardrobeInit = () => {
  const initialize = useWardrobeStore((state) => state.initialize);
  useEffect(() => {
    void initialize();
  }, [initialize]);
};

import type * as THREE from "three";

export type GarmentFamily = "tshirt" | "trousers";
export type GarmentFidelity = "generic-template" | "customized-template" | "item-specific";

export type GarmentManifest = {
  id: string;
  family: GarmentFamily;
  version: number;
  label: string;
  assetType: "procedural" | "gltf";
  source: string;
  license: string;
  avatarModel: string;
  supportedViews: readonly ["front", "side", "back"];
  fidelity: GarmentFidelity;
  loadingBudgetMs: number;
};

export type GarmentInstance = {
  manifest: GarmentManifest;
  object: THREE.Object3D;
  dispose: () => void;
};

export const TSHIRT_MANIFEST: GarmentManifest = {
  id: "wardrope.tshirt",
  family: "tshirt",
  version: 1,
  label: "White T-shirt",
  assetType: "procedural",
  source: "src/features/preview/garments/tshirt.ts",
  license: "Original project geometry",
  avatarModel: "wardrope-fashion-mannequin-v1",
  supportedViews: ["front", "side", "back"],
  fidelity: "generic-template",
  loadingBudgetMs: 3000,
};

export const TROUSERS_MANIFEST: GarmentManifest = {
  id: "wardrope.trousers",
  family: "trousers",
  version: 1,
  label: "Basic trousers",
  assetType: "procedural",
  source: "src/features/preview/garments/trousers.ts",
  license: "Original project geometry",
  avatarModel: "wardrope-fashion-mannequin-v1",
  supportedViews: ["front", "side", "back"],
  fidelity: "generic-template",
  loadingBudgetMs: 3000,
};

export const GARMENT_MANIFESTS: Readonly<Record<string, GarmentManifest>> = {
  [TSHIRT_MANIFEST.id]: TSHIRT_MANIFEST,
  [TROUSERS_MANIFEST.id]: TROUSERS_MANIFEST,
};

export function getGarmentManifest(id: string) {
  return GARMENT_MANIFESTS[id];
}

export function isManifestCompatible(manifest: GarmentManifest, avatarModel: string) {
  return manifest.avatarModel === avatarModel && manifest.supportedViews.length === 3;
}

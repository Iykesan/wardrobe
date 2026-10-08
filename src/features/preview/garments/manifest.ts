import type * as THREE from "three";

export type GarmentFamily = "tshirt" | "oversized-tshirt" | "hoodie" | "trousers" | "jeans" | "wide-leg-pants" | "shorts" | "sneakers";
export type GarmentFidelity = "generic-template" | "customized-template" | "item-specific";
export type AssetAvailability = "ready" | "unavailable";

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
  availability?: AssetAvailability;
  assetId?: string;
  assetVersion?: string;
  layer: "base-top" | "bottom" | "footwear" | "outerwear";
};

export type GarmentInstance = {
  manifest: GarmentManifest;
  object: THREE.Object3D;
  dispose: () => void;
};

const VIEWS: readonly ["front", "side", "back"] = ["front", "side", "back"];
const UNAVAILABLE_SOURCE = "docs/ASSET_AUDIT.md";

export const TSHIRT_MANIFEST: GarmentManifest = {
  id: "wardrope.tshirt", family: "tshirt", version: 1, label: "Regular T-shirt",
  assetType: "procedural", source: "src/features/preview/garments/tshirt.ts", license: "Original project geometry",
  avatarModel: "wardrope-fashion-mannequin-v1", supportedViews: VIEWS, fidelity: "generic-template", loadingBudgetMs: 3000,
  availability: "ready", assetId: "wardrope-authored-tshirt", assetVersion: "1.0.0", layer: "base-top",
};

export const TROUSERS_MANIFEST: GarmentManifest = {
  id: "wardrope.trousers", family: "trousers", version: 1, label: "Basic trousers",
  assetType: "procedural", source: "src/features/preview/garments/trousers.ts", license: "Original project geometry",
  avatarModel: "wardrope-fashion-mannequin-v1", supportedViews: VIEWS, fidelity: "generic-template", loadingBudgetMs: 3000,
  availability: "ready", assetId: "wardrope-authored-trousers", assetVersion: "1.0.0", layer: "bottom",
};

/** Planned library entries remain outside the runtime manifest until a source,
 * license, binary, and front/side/back review are recorded. */
export const PLANNED_ASSET_CATALOG: readonly GarmentManifest[] = [
  { id: "wardrope.jeans", family: "jeans", version: 1, label: "Straight-leg jeans", assetType: "gltf", source: UNAVAILABLE_SOURCE, license: "Not approved", avatarModel: "wardrope-fashion-mannequin-v1", supportedViews: VIEWS, fidelity: "generic-template", loadingBudgetMs: 3000, availability: "unavailable", layer: "bottom" },
  { id: "wardrope.sneakers", family: "sneakers", version: 1, label: "Low-top sneakers", assetType: "gltf", source: UNAVAILABLE_SOURCE, license: "Not approved", avatarModel: "wardrope-fashion-mannequin-v1", supportedViews: VIEWS, fidelity: "generic-template", loadingBudgetMs: 3000, availability: "unavailable", layer: "footwear" },
  { id: "wardrope.oversized-tshirt", family: "oversized-tshirt", version: 1, label: "Oversized T-shirt", assetType: "gltf", source: UNAVAILABLE_SOURCE, license: "Not approved", avatarModel: "wardrope-fashion-mannequin-v1", supportedViews: VIEWS, fidelity: "generic-template", loadingBudgetMs: 3000, availability: "unavailable", layer: "base-top" },
  { id: "wardrope.hoodie", family: "hoodie", version: 1, label: "Hoodie", assetType: "gltf", source: UNAVAILABLE_SOURCE, license: "Not approved", avatarModel: "wardrope-fashion-mannequin-v1", supportedViews: VIEWS, fidelity: "generic-template", loadingBudgetMs: 3000, availability: "unavailable", layer: "outerwear" },
  { id: "wardrope.wide-leg-pants", family: "wide-leg-pants", version: 1, label: "Wide-leg pants", assetType: "gltf", source: UNAVAILABLE_SOURCE, license: "Not approved", avatarModel: "wardrope-fashion-mannequin-v1", supportedViews: VIEWS, fidelity: "generic-template", loadingBudgetMs: 3000, availability: "unavailable", layer: "bottom" },
  { id: "wardrope.shorts", family: "shorts", version: 1, label: "Shorts", assetType: "gltf", source: UNAVAILABLE_SOURCE, license: "Not approved", avatarModel: "wardrope-fashion-mannequin-v1", supportedViews: VIEWS, fidelity: "generic-template", loadingBudgetMs: 3000, availability: "unavailable", layer: "bottom" },
];

export const GARMENT_MANIFESTS: Readonly<Record<string, GarmentManifest>> = {
  [TSHIRT_MANIFEST.id]: TSHIRT_MANIFEST,
  [TROUSERS_MANIFEST.id]: TROUSERS_MANIFEST,
};

export const GARMENT_CATALOG: readonly GarmentManifest[] = [TSHIRT_MANIFEST, TROUSERS_MANIFEST, ...PLANNED_ASSET_CATALOG];

export function getGarmentManifest(id: string) { return GARMENT_MANIFESTS[id]; }
export function getPlannedGarmentManifest(id: string) { return PLANNED_ASSET_CATALOG.find((manifest) => manifest.id === id); }
export function isManifestCompatible(manifest: GarmentManifest, avatarModel: string) {
  return manifest.avatarModel === avatarModel && manifest.supportedViews.length === 3 && manifest.availability !== "unavailable";
}

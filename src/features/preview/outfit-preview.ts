import { GARMENT_CATALOG, GARMENT_MANIFESTS } from "./garments/manifest";

/**
 * Pure resolution of an outfit preview from existing wardrobe records.
 *
 * This module resolves an outfit and its items by the identifiers already
 * stored in the wardrobe. It never copies, rewrites, or mutates the source
 * records and it does not touch the DOM, meshes, or persistence. Rendering
 * consumers can decide what to do with the resolved slots and the reported
 * issues.
 */

export type GarmentSlot = "top" | "bottom" | "shoes";

/** Canonical slot order used for deterministic output. */
export const GARMENT_SLOT_ORDER: readonly GarmentSlot[] = ["top", "bottom", "shoes"];

/**
 * Planned template-to-slot mapping.
 *
 * These template IDs are planned garment families, not a statement that a
 * manifest exists. Support is decided separately by the caller's manifest
 * support list, so a planned template can resolve to a slot while remaining
 * unsupported until its manifest ships.
 */
export const TEMPLATE_SLOTS: Readonly<Record<string, GarmentSlot>> = {
  "wardrope.tshirt": "top",
  "wardrope.oversized-tshirt": "top",
  "wardrope.long-sleeve": "top",
  "wardrope.hoodie": "top",
  "wardrope.trousers": "bottom",
  "wardrope.jeans": "bottom",
  "wardrope.wide-leg-pants": "bottom",
  "wardrope.shorts": "bottom",
  "wardrope.sneakers": "shoes",
};

/** Templates that currently ship a manifest, used when the caller omits a list. */
export const DEFAULT_SUPPORTED_TEMPLATES: readonly string[] = Object.keys(GARMENT_MANIFESTS);

export const CATALOG_TEMPLATE_IDS: readonly string[] = GARMENT_CATALOG.map((manifest) => manifest.id);

/**
 * Structural view of a wardrobe item. Real `WardrobeItem` records satisfy this
 * shape; `templateId` is widened to `string` so planned-but-unshipped
 * templates can be inspected without changing the shared type.
 */
export type OutfitPreviewItem = {
  id: string;
  name?: string;
  representation?: {
    templateId: string;
    fidelity?: string;
    color?: string;
  };
};

/** Structural view of an outfit record. Real `Outfit` records satisfy this shape. */
export type OutfitPreviewOutfit = {
  id: string;
  name?: string;
  itemIds: readonly string[];
};

export type OutfitPreviewRequest = {
  outfitId: string;
  outfits: readonly OutfitPreviewOutfit[];
  items: readonly OutfitPreviewItem[];
  /**
   * Manifest support list. Defaults to the templates that currently ship a
   * manifest. Pass the caller's manifest set so planned templates are reported
   * as unsupported instead of resolving silently.
   */
  supportedTemplates?: readonly string[];
};

export type OutfitPreviewIssue =
  | { code: "outfit-not-found"; outfitId: string }
  | { code: "item-not-found"; itemId: string }
  | { code: "no-mapping"; itemId: string; templateId?: string }
  | { code: "unsupported-template"; itemId: string; templateId: string; slot: GarmentSlot }
  | { code: "slot-conflict"; slot: GarmentSlot; itemIds: string[]; chosenItemId: string };

export type ResolvedOutfitGarment = {
  slot: GarmentSlot;
  templateId: string;
  itemId: string;
  color?: string;
  /** The original source item, by reference. */
  item: OutfitPreviewItem;
};

export type OutfitPreviewResult = {
  outfitId: string;
  /** True when the outfit itself was found and could be resolved. */
  resolved: boolean;
  /** The original source outfit, by reference, or null when it is missing. */
  outfit: OutfitPreviewOutfit | null;
  /** At most one garment per slot, in `GARMENT_SLOT_ORDER`. */
  garments: ResolvedOutfitGarment[];
  bySlot: Partial<Record<GarmentSlot, ResolvedOutfitGarment>>;
  issues: OutfitPreviewIssue[];
  supportedTemplates: readonly string[];
};

/**
 * Resolve a preview for one outfit by existing IDs.
 *
 * - Only items referenced by the outfit are considered.
 * - Missing outfits and items are reported, never invented.
 * - Items without a representation, or with a template absent from the slot
 *   table, are reported as `no-mapping`.
 * - Mapped templates outside the caller's support list are reported as
 *   `unsupported-template`.
 * - When several supported items target the same slot, the first in the
 *   outfit's `itemIds` order is chosen and the rest are reported through a
 *   `slot-conflict` issue. They are not silently dropped.
 * - Source records are returned by reference and never mutated.
 */
export function resolveOutfitPreview(request: OutfitPreviewRequest): OutfitPreviewResult {
  const supportedTemplates = request.supportedTemplates ?? DEFAULT_SUPPORTED_TEMPLATES;
  const supported = new Set(supportedTemplates);
  const issues: OutfitPreviewIssue[] = [];
  const outfit = request.outfits.find((entry) => entry.id === request.outfitId) ?? null;

  if (!outfit) {
    issues.push({ code: "outfit-not-found", outfitId: request.outfitId });
    return {
      outfitId: request.outfitId,
      resolved: false,
      outfit: null,
      garments: [],
      bySlot: {},
      issues,
      supportedTemplates,
    };
  }

  const itemsById = new Map<string, OutfitPreviewItem>();
  for (const item of request.items) {
    if (!itemsById.has(item.id)) itemsById.set(item.id, item);
  }

  const candidates = new Map<GarmentSlot, OutfitPreviewItem[]>();
  for (const itemId of outfit.itemIds) {
    const item = itemsById.get(itemId);
    if (!item) {
      issues.push({ code: "item-not-found", itemId });
      continue;
    }
    const templateId = item.representation?.templateId;
    const slot = templateId && Object.hasOwn(TEMPLATE_SLOTS, templateId)
      ? TEMPLATE_SLOTS[templateId]
      : undefined;
    if (!templateId || !slot) {
      issues.push({ code: "no-mapping", itemId, templateId });
      continue;
    }
    if (!supported.has(templateId)) {
      issues.push({ code: "unsupported-template", itemId, templateId, slot });
      continue;
    }
    const list = candidates.get(slot);
    if (list) list.push(item);
    else candidates.set(slot, [item]);
  }

  const garments: ResolvedOutfitGarment[] = [];
  const bySlot: Partial<Record<GarmentSlot, ResolvedOutfitGarment>> = {};
  for (const slot of GARMENT_SLOT_ORDER) {
    const list = candidates.get(slot);
    if (!list || list.length === 0) continue;
    const chosen = list[0];
    if (list.length > 1) {
      issues.push({
        code: "slot-conflict",
        slot,
        itemIds: list.map((entry) => entry.id),
        chosenItemId: chosen.id,
      });
    }
    const garment: ResolvedOutfitGarment = {
      slot,
      templateId: chosen.representation!.templateId,
      itemId: chosen.id,
      color: chosen.representation?.color,
      item: chosen,
    };
    garments.push(garment);
    bySlot[slot] = garment;
  }

  return {
    outfitId: request.outfitId,
    resolved: true,
    outfit,
    garments,
    bySlot,
    issues,
    supportedTemplates,
  };
}

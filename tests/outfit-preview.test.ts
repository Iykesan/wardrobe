import test from "node:test";
import assert from "node:assert/strict";
import {
  DEFAULT_SUPPORTED_TEMPLATES,
  GARMENT_SLOT_ORDER,
  TEMPLATE_SLOTS,
  resolveOutfitPreview,
  type OutfitPreviewItem,
  type OutfitPreviewOutfit,
} from "../src/features/preview/outfit-preview";
import type { WardrobeItem } from "../src/shared/types/wardrobe";
import type { Outfit } from "../src/shared/types/outfit";

const ALL_PLANNED = Object.keys(TEMPLATE_SLOTS);

function item(id: string, templateId?: string, color?: string): OutfitPreviewItem {
  return {
    id,
    name: id,
    representation: templateId ? { templateId, fidelity: "generic-template", color } : undefined,
  };
}

function outfit(id: string, itemIds: string[]): OutfitPreviewOutfit {
  return { id, name: id, itemIds };
}

test("existing wardrobe records satisfy the structural resolver inputs", () => {
  // Compile-time compatibility check: real shared types are accepted as-is.
  const realItem: WardrobeItem = {
    id: "i1",
    name: "Shirt",
    categoryId: "c1",
    subcategoryId: "s1",
    isFavorite: false,
    createdAt: "2030-01-01T00:00:00.000Z",
    representation: { templateId: "wardrope.tshirt", fidelity: "generic-template", color: "#fff" },
  };
  const realOutfit: Outfit = {
    id: "o1",
    itemIds: ["i1"],
    isFavorite: false,
    createdAt: "2030-01-01T00:00:00.000Z",
  };
  const items: OutfitPreviewItem[] = [realItem];
  const outfits: OutfitPreviewOutfit[] = [realOutfit];
  const result = resolveOutfitPreview({ outfitId: "o1", outfits, items });
  assert.equal(result.bySlot.top?.itemId, "i1");
});

test("the planned slot table covers the planned IDs with the expected slots", () => {
  assert.deepEqual(GARMENT_SLOT_ORDER, ["top", "bottom", "shoes"]);
  assert.deepEqual(TEMPLATE_SLOTS, {
    "wardrope.tshirt": "top",
    "wardrope.oversized-tshirt": "top",
    "wardrope.long-sleeve": "top",
    "wardrope.hoodie": "top",
    "wardrope.trousers": "bottom",
    "wardrope.shorts": "bottom",
    "wardrope.sneakers": "shoes",
  });
  assert.deepEqual(DEFAULT_SUPPORTED_TEMPLATES, ["wardrope.tshirt"]);
});

test("resolves an outfit by existing IDs and preserves source records by reference", () => {
  const top = item("top-1", "wardrope.tshirt", "#112233");
  const bottom = item("bottom-1", "wardrope.trousers");
  const shoes = item("shoes-1", "wardrope.sneakers");
  const sourceOutfit = outfit("outfit-1", ["top-1", "bottom-1", "shoes-1"]);
  const result = resolveOutfitPreview({
    outfitId: "outfit-1",
    outfits: [sourceOutfit],
    items: [top, bottom, shoes],
    supportedTemplates: ALL_PLANNED,
  });

  assert.equal(result.resolved, true);
  assert.equal(result.outfit, sourceOutfit);
  assert.deepEqual(result.garments.map((g) => g.slot), ["top", "bottom", "shoes"]);
  assert.deepEqual(result.garments.map((g) => g.itemId), ["top-1", "bottom-1", "shoes-1"]);
  assert.equal(result.bySlot.top?.templateId, "wardrope.tshirt");
  assert.equal(result.bySlot.top?.color, "#112233");
  assert.equal(result.bySlot.top?.item, top);
  assert.equal(result.bySlot.bottom?.item, bottom);
  assert.equal(result.bySlot.shoes?.item, shoes);
  assert.deepEqual(result.issues, []);
});

test("reports a deleted outfit and resolves nothing", () => {
  const result = resolveOutfitPreview({
    outfitId: "deleted-outfit",
    outfits: [outfit("other", ["top-1"])],
    items: [item("top-1", "wardrope.tshirt")],
  });

  assert.equal(result.resolved, false);
  assert.equal(result.outfit, null);
  assert.deepEqual(result.garments, []);
  assert.deepEqual(result.bySlot, {});
  assert.deepEqual(result.issues, [{ code: "outfit-not-found", outfitId: "deleted-outfit" }]);
});

test("reports deleted items while resolving the remaining items", () => {
  const top = item("top-1", "wardrope.tshirt");
  const result = resolveOutfitPreview({
    outfitId: "outfit-1",
    outfits: [outfit("outfit-1", ["top-1", "deleted-item", "also-deleted"])],
    items: [top],
  });

  assert.equal(result.resolved, true);
  assert.deepEqual(result.garments.map((g) => g.itemId), ["top-1"]);
  assert.deepEqual(result.issues, [
    { code: "item-not-found", itemId: "deleted-item" },
    { code: "item-not-found", itemId: "also-deleted" },
  ]);
});

test("reports planned templates that the default manifest support list lacks", () => {
  const result = resolveOutfitPreview({
    outfitId: "outfit-1",
    outfits: [outfit("outfit-1", ["top-1", "bottom-1"])],
    items: [item("top-1", "wardrope.tshirt"), item("bottom-1", "wardrope.trousers")],
  });

  assert.deepEqual(result.garments.map((g) => g.itemId), ["top-1"]);
  assert.deepEqual(result.issues, [
    { code: "unsupported-template", itemId: "bottom-1", templateId: "wardrope.trousers", slot: "bottom" },
  ]);
});

test("the caller support list lets planned templates differ from supported ones", () => {
  const result = resolveOutfitPreview({
    outfitId: "outfit-1",
    outfits: [outfit("outfit-1", ["top-1", "bottom-1"])],
    items: [item("top-1", "wardrope.tshirt"), item("bottom-1", "wardrope.trousers")],
    supportedTemplates: ["wardrope.trousers"],
  });

  assert.deepEqual(result.supportedTemplates, ["wardrope.trousers"]);
  assert.deepEqual(result.garments.map((g) => g.itemId), ["bottom-1"]);
  assert.deepEqual(result.issues, [
    { code: "unsupported-template", itemId: "top-1", templateId: "wardrope.tshirt", slot: "top" },
  ]);
});

test("reports a slot conflict and keeps the first item instead of dropping the rest", () => {
  const first = item("top-1", "wardrope.tshirt");
  const second = item("top-2", "wardrope.oversized-tshirt");
  const request = {
    outfitId: "outfit-1",
    outfits: [outfit("outfit-1", ["top-1", "top-2"])],
    items: [first, second],
    supportedTemplates: ALL_PLANNED,
  };
  const result = resolveOutfitPreview(request);

  assert.equal(result.garments.length, 1);
  assert.equal(result.bySlot.top?.itemId, "top-1");
  assert.deepEqual(result.issues, [
    { code: "slot-conflict", slot: "top", itemIds: ["top-1", "top-2"], chosenItemId: "top-1" },
  ]);

  // The same input resolves identically on a later call.
  assert.deepEqual(resolveOutfitPreview(request), result);
});

test("reports items without a representation or with an unknown template as no mapping", () => {
  const result = resolveOutfitPreview({
    outfitId: "outfit-1",
    outfits: [outfit("outfit-1", ["plain-1", "unknown-1", "top-1"])],
    items: [item("plain-1"), item("unknown-1", "wardrope.cape"), item("top-1", "wardrope.tshirt")],
  });

  assert.deepEqual(result.garments.map((g) => g.itemId), ["top-1"]);
  assert.deepEqual(result.issues, [
    { code: "no-mapping", itemId: "plain-1", templateId: undefined },
    { code: "no-mapping", itemId: "unknown-1", templateId: "wardrope.cape" },
  ]);
});

test("an empty selection resolves with no garments and no issues", () => {
  const result = resolveOutfitPreview({
    outfitId: "outfit-1",
    outfits: [outfit("outfit-1", [])],
    items: [item("top-1", "wardrope.tshirt")],
  });

  assert.equal(result.resolved, true);
  assert.deepEqual(result.garments, []);
  assert.deepEqual(result.bySlot, {});
  assert.deepEqual(result.issues, []);
});

test("does not mutate the input records", () => {
  const items = [
    item("top-1", "wardrope.tshirt", "#abc"),
    item("bottom-1", "wardrope.trousers"),
    item("plain-1"),
  ];
  const outfits = [outfit("outfit-1", ["top-1", "bottom-1", "plain-1"])];
  const itemsBefore = structuredClone(items);
  const outfitsBefore = structuredClone(outfits);

  resolveOutfitPreview({ outfitId: "outfit-1", outfits, items, supportedTemplates: ALL_PLANNED });

  assert.deepEqual(items, itemsBefore);
  assert.deepEqual(outfits, outfitsBefore);
});

test("resolves deterministically across 500 items and reports the full conflict list", () => {
  const items: OutfitPreviewItem[] = Array.from({ length: 500 }, (_, index) =>
    item(`top-${index}`, index % 2 === 0 ? "wardrope.tshirt" : "wardrope.oversized-tshirt"),
  );
  const itemIds = items.map((entry) => entry.id);
  const outfits = [outfit("outfit-1", itemIds)];
  const itemsBefore = structuredClone(items);

  const first = resolveOutfitPreview({ outfitId: "outfit-1", outfits, items, supportedTemplates: ALL_PLANNED });
  const second = resolveOutfitPreview({ outfitId: "outfit-1", outfits, items, supportedTemplates: ALL_PLANNED });

  assert.equal(first.garments.length, 1);
  assert.equal(first.bySlot.top?.itemId, "top-0");
  assert.equal(first.issues.length, 1);
  const conflict = first.issues[0];
  assert.equal(conflict.code, "slot-conflict");
  assert.deepEqual(conflict, { code: "slot-conflict", slot: "top", itemIds, chosenItemId: "top-0" });
  assert.deepEqual(second, first);
  assert.deepEqual(items, itemsBefore);
});

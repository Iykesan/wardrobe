import assert from "node:assert/strict";
import { before, beforeEach, test } from "node:test";

// Install storage before importing the persisted store, as a browser would.
const storage = new Map<string, string>();
Object.defineProperty(globalThis, "localStorage", {
  value: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => storage.set(key, value),
    removeItem: (key: string) => storage.delete(key),
  },
  configurable: true,
});
let store: typeof import("../src/features/wardrobe/store/wardrobeStore").useWardrobeStore;

// Node has no Web Locks; writes require it, so install a deterministic fake.
let lockTail: Promise<unknown> = Promise.resolve();
function installFakeLock() {
  const locks = {
    request: (
      name: string,
      _options: unknown,
      callback: (lock: unknown) => unknown,
    ) => {
      const run = lockTail.then(() => callback({ name, mode: "exclusive" }));
      lockTail = run.then(
        () => undefined,
        () => undefined,
      );
      return run;
    },
  };
  Object.defineProperty(globalThis.navigator, "locks", {
    value: locks,
    configurable: true,
  });
}

before(async () => {
  installFakeLock();
  ({ useWardrobeStore: store } = await import(
    "../src/features/wardrobe/store/wardrobeStore"
  ));
});

async function resetStore() {
  storage.clear();
  store.setState({
    categories: [], subcategories: [], items: [], outfits: [], plans: [],
    setupComplete: false, error: undefined, isHydrated: false, isLoading: false,
    storageStatus: "initializing", recovery: undefined, conflict: undefined,
    loadedRaw: null,
  });
  await store.getState().initialize({ force: true });
}

beforeEach(resetStore);

async function addItem(name = "Owned shirt") {
  const state = store.getState();
  return state.addItem({
    name, categoryId: state.categories[0].id,
    subcategoryId: state.subcategories[0].id,
  });
}

test("invalid relationships and dates leave persisted data unchanged", async () => {
  await store.getState().seedDefaults();
  const item = await addItem();
  await store.getState().addOutfit({ itemIds: [item.id], isFavorite: false });
  const before = storage.get("wardrope-store");
  await assert.rejects(store.getState().addItem({ name: "Bad", categoryId: "missing", subcategoryId: item.subcategoryId }));
  await assert.rejects(store.getState().addOutfit({ itemIds: [item.id, item.id], isFavorite: false }));
  await assert.rejects(store.getState().addOutfit({ itemIds: ["missing"], isFavorite: false }));
  await assert.rejects(store.getState().addPlan({ outfitId: "missing", plannedDate: "2035-06-15" }));
  await assert.rejects(store.getState().addPlan({ outfitId: store.getState().outfits[0].id, plannedDate: "2035-02-29" }));
  assert.equal(storage.get("wardrope-store"), before);
});

test("renaming categories and subcategories cannot create duplicate names", async () => {
  await store.getState().seedDefaults();
  const state = store.getState();
  const before = storage.get("wardrope-store");
  await assert.rejects(state.updateCategory(state.categories[1].id, ` ${state.categories[0].name.toUpperCase()} `));
  const siblings = state.subcategories.filter((entry) => entry.categoryId === state.categories[0].id);
  await assert.rejects(state.updateSubcategory(siblings[1].id, siblings[0].name));
  await assert.rejects(state.addCategory("  "));
  assert.equal(storage.get("wardrope-store"), before);
});

test("a 501st item is rejected without removing existing clothing", async () => {
  await store.getState().seedDefaults();
  const item = await addItem();
  store.setState({ items: Array.from({ length: 500 }, (_, index) => ({ ...item, id: `item-${index}` })) });
  const before = storage.get("wardrope-store");
  await assert.rejects(addItem(), /500/);
  assert.equal(store.getState().items.length, 500);
  assert.equal(storage.get("wardrope-store"), before);
});

test("default setup creates categories but never clothing or outfits", async () => {
  await store.getState().seedDefaults();
  assert.equal(store.getState().setupComplete, true);
  assert.ok(store.getState().categories.length > 0);
  assert.equal(store.getState().items.length, 0);
  assert.equal(store.getState().outfits.length, 0);
});

test("manual items and favorites survive hydration using the existing storage key", async () => {
  await store.getState().seedDefaults();
  const item = await addItem();
  await store.getState().updateItem({ ...item, name: "Renamed shirt" });
  await store.getState().toggleItemFavorite(item.id);
  const saved = storage.get("wardrope-store");
  assert.ok(saved);
  store.setState({ items: [], isHydrated: false, loadedRaw: null });
  await store.getState().initialize({ force: true });
  assert.equal(store.getState().items[0].name, "Renamed shirt");
  assert.equal(store.getState().items[0].isFavorite, true);
});

test("deleting a category clears plans for outfits with multiple removed pieces", async () => {
  await store.getState().seedDefaults();
  const first = await addItem("First shirt");
  const second = await addItem("Second shirt");
  await store.getState().addOutfit({ itemIds: [first.id, second.id], isFavorite: false });
  await store.getState().addPlan({ outfitId: store.getState().outfits[0].id, plannedDate: "2030-01-02" });
  await store.getState().removeCategory(first.categoryId);
  assert.equal(store.getState().items.length, 0);
  assert.equal(store.getState().outfits.length, 0);
  assert.equal(store.getState().plans.length, 0);
});

test("item deletion keeps remaining outfit pieces and removes empty outfits and plans", async () => {
  await store.getState().seedDefaults();
  const first = await addItem("First");
  const second = await addItem("Second");
  await store.getState().addOutfit({ itemIds: [first.id, second.id], isFavorite: false });
  const outfit = store.getState().outfits[0];
  await store.getState().addPlan({ outfitId: outfit.id, plannedDate: "2030-01-02" });
  await store.getState().removeItem(first.id);
  assert.deepEqual(store.getState().outfits[0].itemIds, [second.id]);
  assert.equal(store.getState().plans.length, 1);
  await store.getState().removeItem(second.id);
  assert.equal(store.getState().outfits.length, 0);
  assert.equal(store.getState().plans.length, 0);
});

test("removing the last subcategory reassigns its items to a replacement", async () => {
  await store.getState().addCategory("Custom");
  const item = await addItem();
  await store.getState().removeSubcategory(item.subcategoryId);
  const state = store.getState();
  assert.equal(state.subcategories.length, 1);
  assert.notEqual(state.subcategories[0].id, item.subcategoryId);
  assert.equal(state.items[0].subcategoryId, state.subcategories[0].id);
});

test("outfit favorites persist and planning replaces a day's assignment", async () => {
  await store.getState().seedDefaults();
  const item = await addItem();
  await store.getState().addOutfit({ itemIds: [item.id], isFavorite: false });
  const outfit = store.getState().outfits[0];
  await store.getState().toggleOutfitFavorite(outfit.id);
  const persisted = JSON.parse(storage.get("wardrope-store")!);
  assert.equal(persisted.state.outfits[0].isFavorite, true);
  await store.getState().addPlan({ outfitId: outfit.id, plannedDate: "2030-01-02" });
  await store.getState().addPlan({ outfitId: outfit.id, plannedDate: "2030-01-02", description: "Updated" });
  assert.equal(store.getState().plans.length, 1);
  assert.equal(store.getState().plans[0].description, "Updated");
  await store.getState().removeOutfit(outfit.id);
  assert.equal(store.getState().plans.length, 0);
  assert.equal(store.getState().items.length, 1);
});

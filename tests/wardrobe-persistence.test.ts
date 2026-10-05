import assert from "node:assert/strict";
import { before, beforeEach, test } from "node:test";

const storage = new Map<string, string>();
let failWrites = false;

Object.defineProperty(globalThis, "localStorage", {
  value: {
    getItem: (key: string) => storage.get(key) ?? null,
    setItem: (key: string, value: string) => {
      if (failWrites) {
        const error = new Error("quota exceeded while writing");
        error.name = "QuotaExceededError";
        throw error;
      }
      storage.set(key, value);
    },
    removeItem: (key: string) => storage.delete(key),
  },
  configurable: true,
});

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

function removeFakeLock() {
  Object.defineProperty(globalThis.navigator, "locks", {
    value: undefined,
    configurable: true,
  });
}

let store: typeof import("../src/features/wardrobe/store/wardrobeStore").useWardrobeStore;
let persistence: typeof import("../src/features/wardrobe/store/persistence");
let backup: typeof import("../src/features/wardrobe/store/backup");

before(async () => {
  installFakeLock();
  ({ useWardrobeStore: store } = await import(
    "../src/features/wardrobe/store/wardrobeStore"
  ));
  persistence = await import("../src/features/wardrobe/store/persistence");
  backup = await import("../src/features/wardrobe/store/backup");
});

const createdAt = "2030-01-01T00:00:00.000Z";

const legacyState = () => ({
  categories: [{ id: "cat-1", name: "Tops", order: 1 }],
  subcategories: [{ id: "sub-1", categoryId: "cat-1", name: "T-Shirts", order: 1 }],
  items: [
    {
      id: "item-1",
      name: "Blue shirt",
      categoryId: "cat-1",
      subcategoryId: "sub-1",
      color: "Blue",
      notes: "Office",
      isFavorite: true,
      createdAt,
    },
  ],
  outfits: [
    {
      id: "outfit-1",
      name: "Daily",
      itemIds: ["item-1"],
      isFavorite: true,
      createdAt,
    },
  ],
  plans: [
    {
      id: "plan-1",
      outfitId: "outfit-1",
      plannedDate: "2035-06-15",
      description: "Meeting",
      createdAt,
    },
  ],
  setupComplete: true,
});

const replacementState = () => ({
  categories: [{ id: "cat-x", name: "Shoes", order: 1 }],
  subcategories: [{ id: "sub-x", categoryId: "cat-x", name: "Sneakers", order: 1 }],
  items: [],
  outfits: [],
  plans: [],
  setupComplete: true,
});

async function resetStore() {
  failWrites = false;
  installFakeLock();
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

async function loadWith(raw: string) {
  storage.set("wardrope-store", raw);
  await store.getState().initialize({ force: true });
}

test("legacy version 0 payload migrates and preserves records and optional fields", () => {
  const raw = JSON.stringify({ state: legacyState(), version: 0 });
  const parsed = persistence.parseStoredValue(raw);
  assert.equal(parsed.status, "ok");
  if (parsed.status !== "ok") return;
  assert.equal(parsed.migrated, true);
  assert.equal(parsed.data.categories[0].id, "cat-1");
  assert.equal(parsed.data.items[0].subcategoryId, "sub-1");
  assert.equal(parsed.data.items[0].color, "Blue");
  assert.equal(parsed.data.items[0].isFavorite, true);
  assert.equal(parsed.data.plans[0].outfitId, "outfit-1");
});

test("migration is repeatable and yields identical validated data", () => {
  const raw = JSON.stringify({ state: legacyState(), version: 0 });
  const first = persistence.parseStoredValue(raw);
  const second = persistence.parseStoredValue(raw);
  assert.equal(first.status, "ok");
  assert.equal(second.status, "ok");
  if (first.status !== "ok" || second.status !== "ok") return;
  assert.deepEqual(first.data, second.data);
});

test("legacy payload without setupComplete derives it from categories", () => {
  const withoutFlag: Record<string, unknown> = { ...legacyState() };
  delete withoutFlag.setupComplete;
  const parsed = persistence.parseStoredValue(
    JSON.stringify({ state: withoutFlag, version: 0 }),
  );
  assert.equal(parsed.status, "ok");
  if (parsed.status !== "ok") return;
  assert.equal(parsed.data.setupComplete, true);
});

test("malformed, mistyped, duplicate and unreferenced payloads are rejected", () => {
  assert.equal(persistence.parseStoredValue("{not json").status, "invalid");
  assert.equal(persistence.parseStoredValue("42").status, "invalid");
  assert.equal(
    persistence.parseStoredValue(
      JSON.stringify({ state: { ...legacyState(), items: "nope" }, version: 0 }),
    ).status,
    "invalid",
  );
  const duplicate = legacyState();
  duplicate.items = [{ ...duplicate.items[0] }, { ...duplicate.items[0] }];
  assert.equal(
    persistence.parseStoredValue(JSON.stringify({ state: duplicate, version: 0 })).status,
    "invalid",
  );
  const missingRef = legacyState();
  missingRef.plans[0].outfitId = "missing-outfit";
  assert.equal(
    persistence.parseStoredValue(JSON.stringify({ state: missingRef, version: 0 })).status,
    "invalid",
  );
});

test("malformed version markers are rejected instead of treated as legacy", () => {
  for (const version of ["1", -1, 1.5, null, true, {}]) {
    const parsed = persistence.parseStoredValue(
      JSON.stringify({ state: legacyState(), version }),
    );
    assert.equal(parsed.status, "invalid", `version ${JSON.stringify(version)}`);
  }
  // An absent version still means legacy.
  assert.equal(
    persistence.parseStoredValue(JSON.stringify({ state: legacyState() })).status,
    "ok",
  );
});

test("a future version is reported without being read as data", () => {
  const parsed = persistence.parseStoredValue(
    JSON.stringify({ state: legacyState(), version: 99 }),
  );
  assert.equal(parsed.status, "future");
});

test("an empty string is malformed stored data, not an empty wardrobe", async () => {
  await loadWith("");
  assert.equal(store.getState().storageStatus, "recovery-required");
  assert.equal(store.getState().recovery?.raw, "");
  assert.equal(storage.get("wardrope-store"), "");
  await assert.rejects(store.getState().seedDefaults());
  assert.equal(storage.get("wardrope-store"), "");
});

test("backup export round-trips through validated preview with counts", () => {
  const text = backup.createBackup(legacyState());
  const preview = backup.previewBackup(text);
  assert.equal(preview.ok, true);
  if (!preview.ok) return;
  assert.deepEqual(preview.counts, {
    categories: 1,
    subcategories: 1,
    items: 1,
    outfits: 1,
    plans: 1,
  });
  assert.equal(preview.data.items[0].name, "Blue shirt");
});

test("preview rejects malformed and oversized backups without parsing", () => {
  assert.equal(backup.previewBackup("{oops").ok, false);
  const oversized = backup.previewBackup("x".repeat(backup.MAX_BACKUP_BYTES + 1));
  assert.equal(oversized.ok, false);
  if (oversized.ok) return;
  assert.match(oversized.reason, /too large/i);
});

test("store keeps malformed bytes and blocks mutations until recovery", async () => {
  const malformed = "{broken json";
  await loadWith(malformed);
  assert.equal(store.getState().storageStatus, "recovery-required");
  assert.equal(store.getState().recovery?.raw, malformed);
  assert.equal(store.getState().recovery?.kind, "invalid");
  await assert.rejects(store.getState().seedDefaults());
  assert.equal(storage.get("wardrope-store"), malformed);
});

test("store keeps future-version bytes and blocks mutations", async () => {
  const future = JSON.stringify({ state: legacyState(), version: 42 });
  await loadWith(future);
  assert.equal(store.getState().storageStatus, "recovery-required");
  assert.equal(store.getState().recovery?.kind, "future");
  await assert.rejects(store.getState().addCategory("Anything"));
  assert.equal(storage.get("wardrope-store"), future);
});

test("a quota failure rejects the write and leaves prior bytes unchanged", async () => {
  await loadWith(JSON.stringify({ state: legacyState(), version: 0 }));
  assert.equal(store.getState().storageStatus, "ready");
  const before = storage.get("wardrope-store");
  failWrites = true;
  await assert.rejects(store.getState().addCategory("Formal"), /Storage is full/);
  failWrites = false;
  assert.equal(storage.get("wardrope-store"), before);
  assert.equal(store.getState().categories.length, 1);
});

test("writes are blocked with an actionable error when Web Locks is unavailable", async () => {
  await loadWith(JSON.stringify({ state: legacyState(), version: 0 }));
  const before = storage.get("wardrope-store");
  removeFakeLock();
  try {
    await assert.rejects(
      store.getState().addCategory("Formal"),
      /Web Locks/,
    );
    assert.equal(storage.get("wardrope-store"), before);
    assert.equal(store.getState().categories.length, 1);
  } finally {
    installFakeLock();
  }
});

test("a stale tab is blocked instead of overwriting another tab's data", async () => {
  await loadWith(JSON.stringify({ state: legacyState(), version: 0 }));
  const before = storage.get("wardrope-store");
  // Simulate another tab persisting a different graph after this tab loaded.
  const otherState = { ...legacyState(), setupComplete: true };
  otherState.categories = [
    ...otherState.categories,
    { id: "cat-2", name: "Bottoms", order: 2 },
  ];
  otherState.subcategories = [
    ...otherState.subcategories,
    { id: "sub-2", categoryId: "cat-2", name: "Jeans", order: 1 },
  ];
  storage.set("wardrope-store", JSON.stringify(persistence.buildEnvelope(otherState)));
  const otherBytes = storage.get("wardrope-store");

  await assert.rejects(store.getState().addCategory("Formal"), /another tab/);
  assert.equal(store.getState().conflict !== undefined, true);
  assert.equal(storage.get("wardrope-store"), otherBytes);
  assert.notEqual(otherBytes, before);
});

test("conflicts compare exact bytes, not just equivalent data", async () => {
  const legacyRaw = JSON.stringify({ state: legacyState(), version: 0 });
  await loadWith(legacyRaw);
  const parsed = persistence.parseStoredValue(legacyRaw);
  assert.equal(parsed.status, "ok");
  if (parsed.status !== "ok") return;
  // Same data, different bytes (different savedAt): must still be a conflict.
  storage.set(
    "wardrope-store",
    JSON.stringify({ version: 1, savedAt: "1999-01-01T00:00:00.000Z", state: parsed.data }),
  );
  const rewrapped = storage.get("wardrope-store");
  await assert.rejects(store.getState().addCategory("Formal"), /another tab/);
  assert.equal(storage.get("wardrope-store"), rewrapped);
});

test("a write is refused rather than overwriting unreadable bytes", async () => {
  await loadWith(JSON.stringify({ state: legacyState(), version: 0 }));
  storage.set("wardrope-store", "{unreadable");
  await assert.rejects(store.getState().addCategory("Formal"));
  assert.equal(storage.get("wardrope-store"), "{unreadable");
});

test("mutations are blocked while storage is still initializing", async () => {
  await loadWith(JSON.stringify({ state: legacyState(), version: 0 }));
  const before = storage.get("wardrope-store");
  store.setState({ storageStatus: "initializing" });
  await assert.rejects(store.getState().addCategory("Formal"), /disabled/);
  assert.equal(storage.get("wardrope-store"), before);
});

test("rapid same-tab mutations serialize without a false conflict", async () => {
  await loadWith(JSON.stringify({ state: legacyState(), version: 0 }));
  await Promise.all([
    store.getState().toggleItemFavorite("item-1"),
    store.getState().addCategory("Bottoms"),
  ]);
  assert.equal(store.getState().conflict, undefined);
  assert.equal(store.getState().categories.length, 2);
  assert.equal(store.getState().items[0].isFavorite, false);
});

test("restore replaces the whole wardrobe and reset clears storage", async () => {
  await loadWith(JSON.stringify({ state: legacyState(), version: 0 }));
  await store.getState().restoreBackup(replacementState());
  assert.equal(store.getState().categories[0].name, "Shoes");
  assert.equal(store.getState().items.length, 0);
  await store.getState().resetStorage();
  assert.equal(storage.has("wardrope-store"), false);
  assert.equal(store.getState().storageStatus, "empty");
});

test("restore refuses to overwrite bytes that changed since recovery load", async () => {
  const malformed = "{broken json";
  await loadWith(malformed);
  assert.equal(store.getState().storageStatus, "recovery-required");
  storage.set("wardrope-store", "{changed after load");
  await assert.rejects(store.getState().restoreBackup(replacementState()), /another tab/);
  assert.equal(storage.get("wardrope-store"), "{changed after load");
});

test("reset refuses to clear bytes that changed since load", async () => {
  await loadWith(JSON.stringify({ state: legacyState(), version: 0 }));
  storage.set("wardrope-store", "{changed after load");
  await assert.rejects(store.getState().resetStorage(), /another tab/);
  assert.equal(storage.get("wardrope-store"), "{changed after load");
});

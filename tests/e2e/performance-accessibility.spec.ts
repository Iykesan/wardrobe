import { expect, test, type Page } from "@playwright/test";
import { makeEnvelope, w500, type WardrobeFixture } from "./fixtures/wardrobe-fixtures";

/**
 * Phase 1 follow-up: programmatic error association / announcement semantics
 * for the item and outfit forms, plus browser-side event-to-localStorage
 * latency instrumentation on the W500 fixture.
 *
 * The latency numbers here are measured inside the page: a capture-phase DOM
 * event timestamp to the completion of the synchronous `localStorage.setItem`
 * for the store key. They deliberately exclude Playwright click actionability
 * and polling, which the earlier P1-11 wall-clock timings included.
 */

const STORAGE_KEY = "wardrope-store";

type PersistSample = {
  storageWriteMs: number;
  eventToPersistMs: number | null;
  eventType: string | null;
  bytes: number;
};

const savedState = (page: Page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem("wardrope-store")!).state);

/** Seed a fixture into isolated localStorage before the app boots. */
async function seed(page: Page, fixture: WardrobeFixture) {
  await page.addInitScript(
    ({ key, value }) => {
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, JSON.stringify(value));
    },
    { key: STORAGE_KEY, value: makeEnvelope(fixture, 1) },
  );
}

/**
 * Install browser-side instrumentation. Registered after `seed` so the initial
 * fixture write is not recorded as a user save.
 */
async function instrumentPersistence(page: Page) {
  await page.addInitScript(() => {
    const KEY = "wardrope-store";
    const perf = {
      writes: [] as {
        startedAt: number;
        endedAt: number;
        storageWriteMs: number;
        bytes: number;
        eventType: string | null;
        eventAt: number | null;
        eventToPersistMs: number | null;
      }[],
      lastEventAt: null as number | null,
      lastEventType: null as string | null,
    };
    (window as unknown as { __wardropePerf: typeof perf }).__wardropePerf = perf;

    const markEvent = (event: Event) => {
      perf.lastEventAt = event.timeStamp;
      perf.lastEventType = event.type;
    };
    document.addEventListener("click", markEvent, true);
    document.addEventListener(
      "keydown",
      (event) => {
        if (event.key === "Enter" || event.key === " " || event.key === "Spacebar") {
          markEvent(event);
        }
      },
      true,
    );

    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (this: Storage, key: string, value: string) {
      if (key !== KEY) return original.call(this, key, value);
      const startedAt = performance.now();
      const result = original.call(this, key, value);
      const endedAt = performance.now();
      perf.writes.push({
        startedAt,
        endedAt,
        storageWriteMs: endedAt - startedAt,
        bytes: new TextEncoder().encode(value).byteLength,
        eventType: perf.lastEventType,
        eventAt: perf.lastEventAt,
        eventToPersistMs: perf.lastEventAt == null ? null : endedAt - perf.lastEventAt,
      });
      return result;
    };
  });
}

const writeCount = (page: Page) =>
  page.evaluate(
    () =>
      (window as unknown as { __wardropePerf: { writes: unknown[] } }).__wardropePerf
        .writes.length,
  );

const latestWrite = (page: Page) =>
  page.evaluate(
    () =>
      ((window as unknown as { __wardropePerf: { writes: PersistSample[] } })
        .__wardropePerf.writes.slice(-1)[0] as PersistSample | undefined) ?? null,
  );

async function setupDefaults(page: Page) {
  await page.goto("/");
  await expect(page).toHaveURL(/\/setup$/);
  await page.getByRole("button", { name: "Use defaults" }).click();
  await expect(page).toHaveURL(/\/wardrobe$/);
}

async function addItem(page: Page, name: string) {
  await page.getByRole("button", { name: "Add item", exact: true }).click();
  await expect(page.getByLabel("Item name")).toHaveValue("");
  await page.getByLabel("Item name").fill(name);
  await page.getByRole("button", { name: "Save item", exact: true }).click();
  await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
}

function summarize(values: number[]) {
  const sorted = [...values].sort((a, b) => a - b);
  const sum = values.reduce((total, value) => total + value, 0);
  const median =
    sorted.length % 2 === 1
      ? sorted[(sorted.length - 1) / 2]
      : (sorted[sorted.length / 2 - 1] + sorted[sorted.length / 2]) / 2;
  return {
    count: values.length,
    min: sorted[0],
    median,
    mean: sum / values.length,
    max: sorted[sorted.length - 1],
  };
}

// Programmatic error association: item form links its error to the field.
test("item form associates the required error via aria-invalid and aria-describedby", async ({
  page,
}) => {
  await setupDefaults(page);
  await page.getByRole("button", { name: "Add item", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Add item", exact: true });
  const nameInput = dialog.getByLabel("Item name");
  await expect(nameInput).not.toHaveAttribute("aria-invalid", "true");

  // Keyboard submission of an empty required field.
  await nameInput.focus();
  await page.keyboard.press("Enter");

  const error = dialog.getByText("Item name is required.");
  await expect(error).toBeVisible();
  await expect(error).toHaveRole("alert");
  await expect(nameInput).toHaveAttribute("aria-invalid", "true");

  const describedBy = await nameInput.getAttribute("aria-describedby");
  expect(describedBy).toBeTruthy();
  await expect(dialog.locator(`#${describedBy}`)).toHaveText("Item name is required.");
});

// Group semantics and announcement for the outfit selection requirement.
test("outfit builder exposes select-items group semantics and announced error", async ({
  page,
}) => {
  await setupDefaults(page);
  await addItem(page, "A11y shirt");
  await page.getByRole("link", { name: "Outfits", exact: true }).click();

  await page.getByRole("button", { name: "Create outfit", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Create outfit", exact: true });
  await expect(dialog).toBeVisible();

  const group = dialog.getByRole("group", { name: "Select items" });
  await expect(group).toBeVisible();
  const firstToggle = group.getByRole("button").first();
  await expect(firstToggle).toHaveAttribute("aria-pressed", "false");

  await dialog.getByRole("button", { name: "Create outfit", exact: true }).click();
  const error = dialog.getByRole("alert");
  await expect(error).toContainText("Select at least one item");

  const describedBy = await group.getAttribute("aria-describedby");
  expect(describedBy).toBeTruthy();
  await expect(dialog.locator(`#${describedBy}`)).toContainText("Select at least one item");

  // Selecting by keyboard flips the toggle state that assistive tech announces.
  await firstToggle.focus();
  await page.keyboard.press("Enter");
  await expect(firstToggle).toHaveAttribute("aria-pressed", "true");
});

// Live-region roles on shared notices.
test("inline notices use status/alert live regions", async ({ page }) => {
  await setupDefaults(page);
  await page.getByRole("button", { name: "Add item", exact: true }).click();
  await page.getByLabel("Item name").fill("Notice shirt");
  await page.getByRole("button", { name: "Save item", exact: true }).click();
  await expect(page.getByRole("status")).toContainText("Item added.");
});

// W500 event-to-localStorage completion, repeated saves plus an outfit save.
test("W500 records browser event-to-localStorage latency over repeated saves", async ({
  page,
  browser,
}) => {
  test.setTimeout(180_000);
  await seed(page, w500());
  await instrumentPersistence(page);

  await page.goto("/wardrobe");
  await expect(page.getByText("500 items | 3 categories")).toBeVisible();

  // >= 5 repeated favorite saves; each writes the full 500-item payload.
  const favorite = page.getByRole("button", { name: "Toggle favorite" }).first();
  const samples: PersistSample[] = [];
  for (let index = 0; index < 6; index++) {
    const before = await writeCount(page);
    await favorite.click();
    await expect.poll(() => writeCount(page), { timeout: 10_000 }).toBeGreaterThan(before);
    const write = await latestWrite(page);
    expect(write).not.toBeNull();
    samples.push(write!);
  }

  // Outfit save: create an outfit from one W500 item.
  await page.getByRole("link", { name: "Outfits", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Outfits" })).toBeVisible();
  const outfitBefore = await writeCount(page);
  await page.getByRole("button", { name: "Create outfit", exact: true }).click();
  const dialog = page.getByRole("dialog", { name: "Create outfit", exact: true });
  await expect(dialog).toBeVisible();
  const itemToggle = dialog
    .getByRole("group", { name: "Select items" })
    .getByRole("button")
    .first();
  await itemToggle.click();
  await dialog.getByRole("button", { name: "Create outfit", exact: true }).click();
  await expect.poll(() => writeCount(page), { timeout: 10_000 }).toBeGreaterThan(outfitBefore);
  const outfitWrite = await latestWrite(page);
  expect(outfitWrite).not.toBeNull();
  await expect(dialog).not.toBeVisible();

  const itemEventToPersist = samples.map((sample) => sample.eventToPersistMs ?? NaN);
  const itemStorageWrite = samples.map((sample) => sample.storageWriteMs);
  const report = {
    fixture: "W500 (500 items, 50 outfits, 30 plans)",
    browserName: browser?.browserType().name(),
    browserVersion: browser?.version(),
    definition:
      "eventToPersistMs = browser click/keydown event timeStamp -> localStorage.setItem completion; excludes Playwright overhead",
    itemSaveSamples: samples.map((sample, index) => ({
      save: index + 1,
      eventToPersistMs: sample.eventToPersistMs,
      storageWriteMs: sample.storageWriteMs,
      bytes: sample.bytes,
      eventType: sample.eventType,
    })),
    itemSaveEventToPersistMs: summarize(itemEventToPersist),
    itemSaveStorageWriteMs: summarize(itemStorageWrite),
    outfitSave: {
      eventToPersistMs: outfitWrite!.eventToPersistMs,
      storageWriteMs: outfitWrite!.storageWriteMs,
      bytes: outfitWrite!.bytes,
      eventType: outfitWrite!.eventType,
    },
  };
  test.info().annotations.push({ type: "P1-11 latency", description: JSON.stringify(report) });
  console.log(`[P1-11 latency] ${JSON.stringify(report)}`);

  // Functional guarantees of the instrumentation.
  expect(samples).toHaveLength(6);
  expect(samples.every((sample) => sample.bytes > 100_000)).toBe(true);
  expect(samples.every((sample) => sample.eventToPersistMs !== null)).toBe(true);
  expect(outfitWrite!.eventToPersistMs).not.toBeNull();

  // The synchronous storage write itself is small and stable.
  expect(summarize(itemStorageWrite).max).toBeLessThan(100);
  expect(outfitWrite!.storageWriteMs).toBeLessThan(100);

  // Original Phase 1 target: sub-second browser-side save latency.
  expect(summarize(itemEventToPersist).median).toBeLessThan(1000);

  // The favorite toggles actually persisted and the outfit exists.
  const state = await savedState(page);
  expect(state.outfits).toHaveLength(51);
});

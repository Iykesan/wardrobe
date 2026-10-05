import { expect, test, type Page } from "@playwright/test";
import { makeEnvelope, w1, w500, type WardrobeFixture } from "./fixtures/wardrobe-fixtures";

const STORAGE_KEY = "wardrope-store";

const savedState = (page: Page) =>
  page.evaluate(() => JSON.parse(localStorage.getItem("wardrope-store")!).state);

const savedRaw = (page: Page) =>
  page.evaluate(() => localStorage.getItem("wardrope-store"));

/**
 * Seed a fixture into isolated localStorage before the app boots. Only seeds
 * when storage is empty so later reloads keep mutations made by the test.
 */
async function seed(page: Page, fixture: WardrobeFixture, version = 1) {
  await page.addInitScript(
    ({ key, value }) => {
      if (localStorage.getItem(key)) return;
      localStorage.setItem(key, JSON.stringify(value));
    },
    { key: STORAGE_KEY, value: makeEnvelope(fixture, version) },
  );
}

/** Page-level form alerts live on a <p>; exclude Next.js route announcer. */
const formAlert = (page: Page) => page.locator('p[role="alert"]');

/** W0: empty storage -> first-run setup -> defaults. */
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

// P1-02: category cascade deletion preserves unrelated records.
test("P1-02 deleting a category cascades but leaves unrelated records intact", async ({ page }) => {
  page.on("dialog", (dialog) => dialog.accept());
  await seed(page, w1());
  await page.goto("/setup");
  await expect(page.getByText("Setup is complete")).toBeVisible();

  const categoryRow = page.locator("#category-c-tops").locator("xpath=../..");
  await categoryRow.getByRole("button", { name: "Delete", exact: true }).click();

  await expect.poll(async () => (await savedState(page)).categories.length).toBe(1);
  const state = await savedState(page);
  expect(state.categories.map((entry: { id: string }) => entry.id)).toEqual(["c-bottoms"]);
  expect(state.subcategories.map((entry: { id: string }) => entry.id)).toEqual(["s-jeans"]);
  expect(state.items.map((entry: { id: string }) => entry.id)).toEqual(["i-jeans-c"]);
  expect(state.outfits.map((entry: { id: string }) => entry.id).sort()).toEqual([
    "o-jeans",
    "o-mixed",
  ]);
  expect(
    state.outfits.find((entry: { id: string }) => entry.id === "o-mixed").itemIds,
  ).toEqual(["i-jeans-c"]);
  expect(state.plans.map((entry: { id: string }) => entry.id)).toEqual(["p-mixed"]);

  await page.reload();
  await expect(page.getByText("Setup is complete")).toBeVisible();
  const reloaded = await savedState(page);
  expect(reloaded.items.map((entry: { id: string }) => entry.id)).toEqual(["i-jeans-c"]);
  expect(reloaded.plans.map((entry: { id: string }) => entry.id)).toEqual(["p-mixed"]);
});

// P1-04: duplicate setup drafts are rejected and retained for correction.
test("P1-04 duplicate setup draft is rejected and kept for correction", async ({ page }) => {
  await page.goto("/");
  await expect(page).toHaveURL(/\/setup$/);

  await page.getByPlaceholder("Athleisure, Formalwear").fill("Tops");
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await expect(page.getByText("Tops", { exact: true })).toHaveCount(2);

  await page.getByRole("button", { name: "Finish setup" }).click();
  await expect(page.getByText("That category already exists.")).toBeVisible();
  await expect(page).toHaveURL(/\/setup$/);
  // The offending draft is retained so it can be disabled or corrected.
  await expect(page.getByText("Tops", { exact: true })).toHaveCount(2);
  expect(await savedRaw(page)).toBeNull();

  // Disabling the duplicate lets setup complete.
  await page.getByRole("button", { name: "Enabled", exact: true }).last().click();
  await page.getByRole("button", { name: "Finish setup" }).click();
  await expect(page).toHaveURL(/\/wardrobe$/);
});

// P1-04: whitespace/duplicate renames are rejected; drafts and disk preserved.
test("P1-04 empty and duplicate renames are rejected with the draft retained", async ({ page }) => {
  await setupDefaults(page);
  await page.getByRole("link", { name: "Setup", exact: true }).click();
  await expect(page.getByText("Setup is complete")).toBeVisible();

  const rawBefore = await savedRaw(page);
  const categoryInputs = page.locator('input[id^="category-"]:not([id="category-name"])');
  const subcategoryInputs = page.locator('input[id^="subcategory-"]');

  const secondCategoryRow = categoryInputs.nth(1).locator("xpath=../..");
  const secondSubcategoryRow = subcategoryInputs.nth(1).locator("xpath=../..");

  // Whitespace-only rename.
  await categoryInputs.nth(1).fill("   ");
  await secondCategoryRow.getByRole("button", { name: "Save", exact: true }).click();
  await expect(formAlert(page)).toContainText("Category name cannot be empty");
  await expect(categoryInputs.nth(1)).toHaveValue("   ");
  expect(await savedRaw(page)).toBe(rawBefore);

  // Case/whitespace duplicate of an existing category name.
  await categoryInputs.nth(1).fill(" tops ");
  await secondCategoryRow.getByRole("button", { name: "Save", exact: true }).click();
  await expect(formAlert(page)).toContainText("That category already exists");
  await expect(categoryInputs.nth(1)).toHaveValue(" tops ");
  expect(await savedRaw(page)).toBe(rawBefore);

  // Restoring the original name is a safe no-op (Save disabled).
  await categoryInputs.nth(1).fill("Bottoms");
  await expect(
    secondCategoryRow.getByRole("button", { name: "Save", exact: true }),
  ).toBeDisabled();

  // Duplicate subcategory within the same category.
  await subcategoryInputs.nth(1).fill(" t-shirts ");
  await secondSubcategoryRow.getByRole("button", { name: "Save", exact: true }).click();
  await expect(formAlert(page)).toContainText("That subcategory already exists");
  await expect(subcategoryInputs.nth(1)).toHaveValue(" t-shirts ");
  expect(await savedRaw(page)).toBe(rawBefore);

  // Adding a duplicate category from the manager.
  await page.getByLabel("Category name").fill("tops");
  await page
    .locator("#category-name")
    .locator("xpath=../..")
    .getByRole("button", { name: "Add", exact: true })
    .click();
  await expect(formAlert(page)).toContainText("That category already exists");
  expect(await savedRaw(page)).toBe(rawBefore);
});

// P1-12: item form is completable by keyboard and reports errors accessibly.
test("P1-12 item form submits by keyboard, reports errors and returns focus", async ({ page }) => {
  await setupDefaults(page);
  const opener = page.getByRole("button", { name: "Add item", exact: true });
  await opener.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Add item", exact: true });
  await expect(dialog).toBeVisible();
  await expect(page.getByLabel("Item name")).toBeFocused();

  // Shift+Tab from the first control stays inside the dialog.
  await page.keyboard.press("Shift+Tab");
  expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);

  // Submitting an empty required field surfaces an accessible error.
  await page.getByLabel("Item name").focus();
  await page.keyboard.press("Enter");
  await expect(dialog.getByText("Item name is required.")).toBeVisible();

  // Type a name and Tab to the submit control.
  await page.getByLabel("Item name").focus();
  await page.keyboard.type("Keyboard shirt");
  const submit = dialog.getByRole("button", { name: "Save item", exact: true });
  for (let index = 0; index < 12; index++) {
    if (await submit.evaluate((element) => element === document.activeElement)) break;
    await page.keyboard.press("Tab");
  }
  await expect(submit).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole("heading", { name: "Keyboard shirt" })).toBeVisible();

  // Escape closes and returns focus to the opener.
  await opener.focus();
  await page.keyboard.press("Enter");
  await expect(dialog).toBeVisible();
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(opener).toBeFocused();
});

// P1-12: outfit form is completable by keyboard and reports errors accessibly.
test("P1-12 outfit form submits by keyboard and reports missing selection", async ({ page }) => {
  await setupDefaults(page);
  await addItem(page, "Keyboard shirt");
  await page.getByRole("link", { name: "Outfits", exact: true }).click();

  const opener = page.getByRole("button", { name: "Create outfit", exact: true });
  await opener.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Create outfit", exact: true });
  await expect(dialog).toBeVisible();

  await page.keyboard.type("Keyboard outfit");
  const submit = dialog.getByRole("button", { name: "Create outfit", exact: true });
  for (let index = 0; index < 12; index++) {
    if (await submit.evaluate((element) => element === document.activeElement)) break;
    await page.keyboard.press("Tab");
  }
  await expect(submit).toBeFocused();
  await page.keyboard.press("Enter");
  await expect(dialog.getByRole("alert")).toContainText("Select at least one item");

  // Shift+Tab twice reaches the item toggle, then Tab back to submit.
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Shift+Tab");
  await page.keyboard.press("Enter");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Tab");
  await page.keyboard.press("Enter");
  await expect(dialog).not.toBeVisible();
  await expect(page.getByRole("heading", { name: "Keyboard outfit" })).toBeVisible();
  expect((await savedState(page)).outfits[0].itemIds).toHaveLength(1);
});

// P1-08: failed writes never show a false save and leave state and disk intact.
test("P1-08 failed edit, delete, favorite and restore writes preserve state and disk", async ({ page }) => {
  page.on("dialog", (dialog) => dialog.accept());
  await setupDefaults(page);
  await addItem(page, "Keep me");
  const rawBefore = await savedRaw(page);

  await page.addInitScript(() => {
    const original = Storage.prototype.setItem;
    Storage.prototype.setItem = function (key: string, value: string) {
      if (key === "wardrope-store") {
        throw new DOMException("The quota has been exceeded.", "QuotaExceededError");
      }
      return original.call(this, key, value);
    };
  });
  await page.reload();
  await expect(page.getByRole("heading", { name: "Keep me" })).toBeVisible();

  // Failed edit: dialog stays open with an error and no false confirmation.
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await page.getByLabel("Item name").fill("Renamed");
  await page.getByRole("button", { name: "Save changes" }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText("Storage is full");
  await page.keyboard.press("Escape");
  await expect(page.getByRole("heading", { name: "Keep me" })).toBeVisible();
  expect((await savedState(page)).items[0].name).toBe("Keep me");
  expect(await savedRaw(page)).toBe(rawBefore);

  // Failed favorite toggle.
  await page.getByRole("button", { name: "Toggle favorite" }).click();
  await expect(page.getByText("Storage is full", { exact: false }).first()).toBeVisible();
  expect((await savedState(page)).items[0].isFavorite).toBe(false);
  expect(await savedRaw(page)).toBe(rawBefore);

  // Failed delete.
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page.getByText("Storage is full", { exact: false }).first()).toBeVisible();
  await expect(page.getByRole("heading", { name: "Keep me" })).toBeVisible();
  expect((await savedState(page)).items).toHaveLength(1);
  expect(await savedRaw(page)).toBe(rawBefore);

  // Failed restore write: preview shown, replace fails, data untouched.
  await page.getByRole("link", { name: "Setup", exact: true }).click();
  const modified = JSON.parse(JSON.stringify(await savedState(page)));
  modified.items[0].name = "Restored name";
  const backup = JSON.stringify({
    app: "wardrobe",
    version: 1,
    savedAt: new Date().toISOString(),
    state: modified,
  });
  await page.locator('input[type="file"]').setInputFiles({
    name: "wardrobe-backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(backup),
  });
  await expect(page.getByText("Restore preview")).toBeVisible();
  await page.getByRole("button", { name: "Replace wardrobe" }).click();
  await expect(formAlert(page)).toContainText("Storage is full");
  expect((await savedState(page)).items[0].name).toBe("Keep me");
  expect(await savedRaw(page)).toBe(rawBefore);
});

// P1-10: a stale same-record edit is blocked instead of overwriting the other tab.
test("P1-10 stale same-record edits across two tabs are blocked and preserve the winner", async ({
  page,
  context,
}) => {
  const pageA = page;
  await setupDefaults(pageA);
  await addItem(pageA, "Original shirt");

  const pageB = await context.newPage();
  await pageB.goto("/wardrobe");
  await expect(pageB.getByRole("heading", { name: "Original shirt" })).toBeVisible();

  await pageA.getByRole("button", { name: "Edit", exact: true }).click();
  await pageA.getByLabel("Item name").fill("A renamed");
  await pageA.getByRole("button", { name: "Save changes" }).click();
  await expect(pageA.getByRole("dialog")).not.toBeVisible();
  await expect.poll(async () => (await savedState(pageA)).items[0].name).toBe("A renamed");

  await pageB.getByRole("button", { name: "Edit", exact: true }).click();
  await pageB.getByLabel("Item name").fill("B renamed");
  await pageB.getByRole("button", { name: "Save changes" }).click();
  await expect(pageB.getByRole("dialog").getByRole("alert")).toContainText("another tab");
  await pageB.keyboard.press("Escape");

  // The first writer's value survives on disk; no silent loss.
  expect((await savedState(pageB)).items[0].name).toBe("A renamed");

  await pageA.reload();
  await pageB.reload();
  await expect(pageA.getByRole("heading", { name: "A renamed" })).toBeVisible();
  await expect(pageB.getByRole("heading", { name: "A renamed" })).toBeVisible();
  await pageB.close();
});

// P1-09: invalid imports and cancelled valid imports leave data untouched.
test("P1-09 invalid import and cancelled valid import preserve data", async ({ page }) => {
  await setupDefaults(page);
  await addItem(page, "Preserve me");
  const rawBefore = await savedRaw(page);
  await page.getByRole("link", { name: "Setup", exact: true }).click();
  const fileInput = page.locator('input[type="file"]');

  // Malformed JSON.
  await fileInput.setInputFiles({
    name: "malformed.json",
    mimeType: "application/json",
    buffer: Buffer.from("{not valid json"),
  });
  await expect(formAlert(page)).toContainText("Import failed");
  await expect(formAlert(page)).toContainText("Your data is unchanged");
  await expect(page.getByText("Restore preview")).toHaveCount(0);
  expect(await savedRaw(page)).toBe(rawBefore);

  // Wrong shape.
  await fileInput.setInputFiles({
    name: "wrong-shape.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify({ hello: "world" })),
  });
  await expect(formAlert(page)).toContainText("Import failed");
  expect(await savedRaw(page)).toBe(rawBefore);

  // Valid backup, then cancel.
  const backup = JSON.stringify({
    app: "wardrobe",
    version: 1,
    savedAt: new Date().toISOString(),
    state: await savedState(page),
  });
  await fileInput.setInputFiles({
    name: "valid.json",
    mimeType: "application/json",
    buffer: Buffer.from(backup),
  });
  await expect(page.getByText("Restore preview")).toBeVisible();
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByText("Restore preview")).toHaveCount(0);
  expect(await savedRaw(page)).toBe(rawBefore);
});

// P1-11: W500 load/search/save/reload timings plus the 501st-item limit.
test("P1-11 W500 records load/search/save/reload timings and rejects item 501", async ({
  page,
  browser,
}) => {
  await seed(page, w500());

  const coldStart = Date.now();
  await page.goto("/wardrobe");
  await expect(page.getByText("500 items | 3 categories")).toBeVisible();
  const coldLoadMs = Date.now() - coldStart;

  const search = page.getByPlaceholder("Search items, colors, notes");
  const searchStart = Date.now();
  await search.fill("item 499");
  await expect(page.getByText("1 results")).toBeVisible();
  const searchMs = Date.now() - searchStart;

  await search.fill("");
  await expect(page.getByText("500 results")).toBeVisible();

  const favorite = page.getByRole("button", { name: "Toggle favorite" }).first();
  const saveStart = Date.now();
  await favorite.click();
  await expect
    .poll(async () => (await savedState(page)).items.some((item: { isFavorite: boolean }) => item.isFavorite))
    .toBe(true);
  const saveMs = Date.now() - saveStart;

  const reloadStart = Date.now();
  await page.reload();
  await expect(page.getByText("500 items | 3 categories")).toBeVisible();
  const reloadMs = Date.now() - reloadStart;

  const payloadBytes = new TextEncoder().encode((await savedRaw(page)) ?? "").byteLength;
  const device = await page.evaluate(() => ({
    userAgent: navigator.userAgent,
    platform: navigator.platform,
    viewport: `${window.innerWidth}x${window.innerHeight}`,
    devicePixelRatio: window.devicePixelRatio,
    hardwareConcurrency: navigator.hardwareConcurrency,
    timezone: Intl.DateTimeFormat().resolvedOptions().timeZone,
  }));
  const timings = {
    fixture: "W500 (500 items, 50 outfits, 30 plans)",
    browserName: browser?.browserType().name(),
    browserVersion: browser?.version(),
    coldLoadMs,
    searchMs,
    saveMs,
    reloadMs,
    payloadBytes,
    note: "Timings are wall-clock upper bounds including Playwright polling (~50-100ms).",
  };
  test.info().annotations.push({ type: "P1-11 device", description: JSON.stringify(device) });
  test.info().annotations.push({ type: "P1-11 timings", description: JSON.stringify(timings) });
  console.log(`[P1-11] W500 timings: ${JSON.stringify(timings)}`);
  console.log(`[P1-11] device: ${JSON.stringify(device)}`);

  // A 501st item is rejected without removing the existing 500.
  await page.getByRole("button", { name: "Add item", exact: true }).click();
  await page.getByLabel("Item name").fill("One too many");
  await page.getByRole("button", { name: "Save item", exact: true }).click();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText("limited to 500");
  await page.keyboard.press("Escape");
  expect((await savedState(page)).items).toHaveLength(500);
});

import { expect, test, type Page } from "@playwright/test";
import { readFile } from "node:fs/promises";

async function setup(page: Page) {
  await page.goto("/");
  await expect(page).toHaveURL(/\/setup$/);
  await page.getByRole("button", { name: "Use defaults" }).click();
  await expect(page).toHaveURL(/\/wardrobe$/);
  await expect(page.getByText("No items yet", { exact: true })).toBeVisible();
}

async function addItem(page: Page, name: string) {
  await page.getByRole("button", { name: "Add item", exact: true }).click();
  await page.getByLabel("Item name").fill(name);
  await page.getByRole("button", { name: "Save item", exact: true }).click();
  await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
}

const savedState = (page: Page) => page.evaluate(() =>
  JSON.parse(localStorage.getItem("wardrope-store")!).state,
);

test("backup export restores into an empty wardrobe and cancellation keeps data", async ({ page }) => {
  await setup(page);
  await addItem(page, "Round trip shirt");

  await page.getByRole("link", { name: "Setup", exact: true }).click();
  const [download] = await Promise.all([
    page.waitForEvent("download"),
    page.getByRole("button", { name: "Export backup" }).click(),
  ]);
  const downloadPath = await download.path();
  expect(downloadPath).not.toBeNull();
  const backupText = await readFile(downloadPath!, "utf8");

  // Simulate W0 by clearing storage and reloading into setup.
  await page.evaluate(() => localStorage.clear());
  await page.reload();
  await expect(page.getByText("Restore a backup")).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("wardrope-store"))).toBeNull();

  const fileInput = page.locator('input[type="file"]');
  await fileInput.setInputFiles({
    name: "wardrobe-backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(backupText),
  });
  await expect(page.getByText("Restore preview")).toBeVisible();
  await expect(page.getByText(/1 items, 0 outfits, 0 plans/)).toBeVisible();
  await page.getByRole("button", { name: "Replace wardrobe" }).click();
  await expect(page.getByText("Backup and restore")).toBeVisible();

  await page.getByRole("link", { name: "Wardrobe", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Round trip shirt" })).toBeVisible();

  // Importing again and cancelling must leave the current wardrobe untouched.
  await page.getByRole("link", { name: "Setup", exact: true }).click();
  const beforeCancel = await savedState(page);
  await page.locator('input[type="file"]').setInputFiles({
    name: "wardrobe-backup.json",
    mimeType: "application/json",
    buffer: Buffer.from(backupText),
  });
  await expect(page.getByText("Restore preview")).toBeVisible();
  await page.getByRole("button", { name: "Cancel" }).click();
  await expect(page.getByText("Restore preview")).not.toBeVisible();
  expect((await savedState(page)).items.length).toBe(beforeCancel.items.length);
});

test("malformed saved data is preserved and recovery is offered", async ({ page }) => {
  await setup(page);
  await addItem(page, "Keep me");
  const malformed = "{broken json";
  await page.evaluate((value) => localStorage.setItem("wardrope-store", value), malformed);
  await page.reload();

  await expect(page.getByText("Saved wardrobe needs recovery")).toBeVisible();
  await expect(page.getByRole("button", { name: "Download original data" })).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("wardrope-store"))).toBe(malformed);
  await expect(page.getByRole("button", { name: "Add item", exact: true })).toHaveCount(0);
});

test("a newer unsupported version is preserved rather than replaced", async ({ page }) => {
  await setup(page);
  await addItem(page, "Keep me");
  const future = JSON.stringify({ version: 99, state: { items: [] } });
  await page.evaluate((value) => localStorage.setItem("wardrope-store", value), future);
  await page.reload();

  await expect(page.getByText("Saved wardrobe needs recovery")).toBeVisible();
  expect(await page.evaluate(() => localStorage.getItem("wardrope-store"))).toBe(future);
});

test("quota exhaustion shows an error without a false save or data loss", async ({ page }) => {
  await setup(page);
  await addItem(page, "Keep me");

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

  await page.getByRole("button", { name: "Add item", exact: true }).click();
  await page.getByLabel("Item name").fill("Not saved");
  await page.getByRole("button", { name: "Save item", exact: true }).click();
  await expect(page.getByRole("dialog")).toBeVisible();
  await expect(page.getByRole("dialog").getByRole("alert")).toContainText("Storage is full");

  const state = await savedState(page);
  expect(state.items).toHaveLength(1);
  expect(state.items[0].name).toBe("Keep me");
});

test("blocked reads are reported as unavailable, not as an empty wardrobe", async ({ page }) => {
  await page.addInitScript(() => {
    const original = Storage.prototype.getItem;
    Storage.prototype.getItem = function (key: string) {
      if (key === "wardrope-store") {
        throw new DOMException("Access denied.", "SecurityError");
      }
      return original.call(this, key);
    };
  });
  await page.goto("/wardrobe");

  await expect(page.getByText("Local storage is unavailable")).toBeVisible();
  await expect(page.getByText("No items yet", { exact: true })).toHaveCount(0);
});

test("a stale tab is blocked instead of overwriting another tab", async ({ context }) => {
  const pageA = await context.newPage();
  await setup(pageA);
  await addItem(pageA, "From tab A");
  await expect.poll(async () => (await savedState(pageA)).items.length).toBe(1);

  const pageB = await context.newPage();
  await pageB.goto("/wardrobe");
  await expect(pageB.getByRole("heading", { name: "From tab A" })).toBeVisible();

  await addItem(pageA, "Also tab A");
  await expect.poll(async () => (await savedState(pageA)).items.length).toBe(2);

  await pageB.getByRole("button", { name: "Add item", exact: true }).click();
  await pageB.getByLabel("Item name").fill("From stale tab B");
  await pageB.getByRole("button", { name: "Save item", exact: true }).click();
  await expect(pageB.getByRole("dialog").getByRole("alert")).toContainText("another tab");

  const afterConflict = await savedState(pageB);
  expect(afterConflict.items.map((item: { name: string }) => item.name).sort()).toEqual([
    "Also tab A",
    "From tab A",
  ]);

  await pageB.keyboard.press("Escape");
  await pageB.reload();
  await expect(pageB.getByRole("heading", { name: "From tab A" })).toBeVisible();
  await expect(pageB.getByRole("heading", { name: "Also tab A" })).toBeVisible();
});

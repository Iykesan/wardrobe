import { expect, test, type Page } from "@playwright/test";

async function setup(page: Page) {
  await page.goto("/");
  await expect(page).toHaveURL(/\/setup$/);
  await page.getByRole("button", { name: "Use defaults" }).click();
  await expect(page).toHaveURL(/\/wardrobe$/);
  await expect(page.getByText("No items yet", { exact: true })).toBeVisible();
}

async function addItem(page: Page, name: string) {
  await page.getByRole("button", { name: "Add item", exact: true }).click();
  await expect(page.getByLabel("Item name")).toHaveValue("");
  await page.getByLabel("Item name").fill(name);
  await page.getByRole("button", { name: "Save item", exact: true }).click();
  await expect(page.getByRole("heading", { name, exact: true })).toBeVisible();
}

const savedState = (page: Page) => page.evaluate(() =>
  JSON.parse(localStorage.getItem("wardrope-store")!).state,
);

test("manual clothing can be edited, filtered, favorited and reloaded", async ({ page }) => {
  await setup(page);
  await addItem(page, "Owned shirt");
  expect((await savedState(page)).items[0].color).toBeUndefined();
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await page.getByLabel("Item name").fill("Blue work shirt");
  await page.getByRole("button", { name: "Add details" }).click();
  await page.getByLabel("Color", { exact: true }).fill("Blue");
  await page.getByLabel("Notes", { exact: true }).fill("Office");
  await page.getByRole("button", { name: "Save changes" }).click();
  await page.getByRole("button", { name: "Toggle favorite" }).click();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Blue work shirt" })).toBeVisible();
  expect((await savedState(page)).items[0].isFavorite).toBe(true);
  await page.getByRole("button", { name: "Bottoms", exact: true }).click();
  await expect(page.getByText("No matches for this filter")).toBeVisible();
  await page.getByRole("button", { name: "Tops", exact: true }).click();
  await page.getByRole("button", { name: "T-Shirts", exact: true }).click();
  await expect(page.getByRole("heading", { name: "Blue work shirt" })).toBeVisible();
  const search = page.getByPlaceholder("Search items, colors, notes");
  for (const query of ["work", "blue", "office"]) {
    await search.fill(query);
    await expect(page.getByRole("heading", { name: "Blue work shirt" })).toBeVisible();
  }
  await search.fill("nonexistent");
  await expect(page.getByText("No matches for this filter")).toBeVisible();
});

test("outfits use owned items and plans are replaced, removed and cleaned up", async ({ page }) => {
  page.on("dialog", (dialog) => dialog.accept());
  await setup(page);
  await addItem(page, "Owned shirt");
  await addItem(page, "Owned jacket");
  await page.getByRole("link", { name: "Outfits", exact: true }).click();
  await page.getByRole("button", { name: "Create outfit", exact: true }).click();
  await page.getByLabel("Outfit name (optional)").fill("Work outfit");
  await page.getByRole("button", { name: "Owned shirt", exact: true }).click();
  await page.getByRole("button", { name: "Owned jacket", exact: true }).click();
  await page.getByRole("button", { name: "Create outfit", exact: true }).last().click();
  await expect(page.getByRole("heading", { name: "Work outfit" })).toBeVisible();
  await page.getByRole("button", { name: "Edit", exact: true }).click();
  await page.getByLabel("Outfit name (optional)").fill("Office outfit");
  await page.getByRole("button", { name: "Save outfit", exact: true }).click();
  await page.getByRole("button", { name: "Toggle favorite" }).click();
  await page.reload();
  await expect(page.getByRole("heading", { name: "Office outfit" })).toBeVisible();
  expect((await savedState(page)).items).toHaveLength(2);
  expect((await savedState(page)).outfits[0].isFavorite).toBe(true);
  await page.getByRole("link", { name: "Plan", exact: true }).click();
  await page.getByLabel("Date", { exact: true }).fill("2035-06-15");
  await page.getByRole("combobox", { name: "Outfit", exact: true }).selectOption({ label: "Office outfit" });
  await page.getByRole("button", { name: "Schedule outfit" }).click();
  await page.getByLabel("Notes (optional)").fill("Meeting");
  await page.getByRole("button", { name: "Update plan" }).click();
  expect((await savedState(page)).plans).toHaveLength(1);
  expect((await savedState(page)).plans[0].description).toBe("Meeting");
  await page.getByRole("button", { name: "Remove", exact: true }).click();
  expect((await savedState(page)).plans).toHaveLength(0);
  await page.getByRole("combobox", { name: "Outfit", exact: true }).selectOption({ label: "Office outfit" });
  await page.getByRole("button", { name: "Schedule outfit" }).click();
  await page.getByRole("link", { name: "Wardrobe", exact: true }).click();
  await page.getByRole("button", { name: "Delete", exact: true }).first().click();
  expect((await savedState(page)).outfits[0].itemIds).toHaveLength(1);
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  expect((await savedState(page)).outfits).toHaveLength(0);
  expect((await savedState(page)).plans).toHaveLength(0);
});

test("item dialog supports keyboard focus, containment and Escape", async ({ page }) => {
  await setup(page);
  const opener = page.getByRole("button", { name: "Add item", exact: true });
  await opener.focus();
  await page.keyboard.press("Enter");
  const dialog = page.getByRole("dialog", { name: "Add item", exact: true });
  await expect(dialog).toBeVisible();
  await expect(page.getByLabel("Item name")).toBeFocused();
  for (let index = 0; index < 10; index++) {
    await page.keyboard.press("Tab");
    expect(await dialog.evaluate((element) => element.contains(document.activeElement))).toBe(true);
  }
  await page.keyboard.press("Escape");
  await expect(dialog).not.toBeVisible();
  await expect(opener).toBeFocused();
});

test("retired remote APIs return not found", async ({ request }) => {
  expect((await request.get("/api/bootstrap")).status()).toBe(404);
  for (const resource of ["categories", "subcategories", "items", "outfits", "plans"]) {
    expect((await request.post(`/api/${resource}`, { data: {} })).status()).toBe(404);
  }
});

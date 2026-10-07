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
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.getByRole("button", { name: "Toggle favorite" }).click();
  await expect
    .poll(async () => (await savedState(page)).items[0].isFavorite)
    .toBe(true);
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

test("wardrobe items can opt into a T-shirt representation without duplicating inventory", async ({ page }) => {
  await setup(page);
  await page.getByRole("button", { name: "Add item", exact: true }).click();
  await page.getByLabel("Item name").fill("Preview shirt");
  await page.getByRole("button", { name: "Add", exact: true }).click();
  await expect(page.getByLabel("3D template")).toHaveValue("wardrope.tshirt");
  await page.getByLabel("Preview color").fill("Cloud white");
  await page.getByRole("button", { name: "Save item", exact: true }).click();
  await expect.poll(async () => (await savedState(page)).items.length).toBe(1);
  const state = await savedState(page);
  expect(state.items).toHaveLength(1);
  expect(state.items[0].representation).toEqual({
    templateId: "wardrope.tshirt",
    fidelity: "customized-template",
    color: "Cloud white",
  });
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
  await expect(page.getByRole("dialog")).not.toBeVisible();
  await page.getByRole("button", { name: "Toggle favorite" }).click();
  await expect
    .poll(async () => (await savedState(page)).outfits[0].isFavorite)
    .toBe(true);
  await page.reload();
  await expect(page.getByRole("heading", { name: "Office outfit" })).toBeVisible();
  expect((await savedState(page)).items).toHaveLength(2);
  expect((await savedState(page)).outfits[0].isFavorite).toBe(true);
  await page.getByRole("link", { name: "Plan", exact: true }).click();
  await page.getByLabel("Date", { exact: true }).fill("2035-06-15");
  await page.getByRole("combobox", { name: "Outfit", exact: true }).selectOption({ label: "Office outfit" });
  await page.getByRole("button", { name: "Schedule outfit" }).click();
  await expect
    .poll(async () => (await savedState(page)).plans.length)
    .toBe(1);
  await page.getByLabel("Notes (optional)").fill("Meeting");
  await page.getByRole("button", { name: "Update plan" }).click();
  await expect
    .poll(async () => (await savedState(page)).plans[0]?.description)
    .toBe("Meeting");
  await page.getByRole("button", { name: "Remove", exact: true }).click();
  await expect
    .poll(async () => (await savedState(page)).plans.length)
    .toBe(0);
  await page.getByRole("combobox", { name: "Outfit", exact: true }).selectOption({ label: "Office outfit" });
  await page.getByRole("button", { name: "Schedule outfit" }).click();
  await expect
    .poll(async () => (await savedState(page)).plans.length)
    .toBe(1);
  await page.getByRole("link", { name: "Wardrobe", exact: true }).click();
  await page.getByRole("button", { name: "Delete", exact: true }).first().click();
  await expect
    .poll(async () => (await savedState(page)).outfits[0]?.itemIds.length)
    .toBe(1);
  await page.getByRole("button", { name: "Delete", exact: true }).click();
  await expect(page.getByText("No items yet", { exact: true })).toBeVisible();
  await expect
    .poll(async () => (await savedState(page)).outfits.length)
    .toBe(0);
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

test("preview mannequin renders front, side and back with a static T-shirt", async ({ page }, testInfo) => {
  await setup(page);
  const before = await savedState(page);
  await page.getByRole("link", { name: "Preview", exact: true }).click();
  const canvas = page.getByRole("img", { name: "Neutral fashion mannequin wearing a white T-shirt" });
  await expect(canvas).toHaveAttribute("data-rendered", "true");
  await expect(page.getByRole("button", { name: "Hide T-shirt", exact: true })).toBeVisible();
  for (const view of ["front", "side", "back"]) {
    await page.getByRole("button", { name: view, exact: true }).click();
    await expect(canvas).toHaveAttribute("data-view", view);
    await canvas.screenshot({ path: testInfo.outputPath(`${view}.png`) });
  }
  await page.getByRole("button", { name: "Hide T-shirt", exact: true }).click();
  await expect(page.getByRole("button", { name: "Show T-shirt", exact: true })).toBeVisible();
  await page.getByRole("button", { name: "Show T-shirt", exact: true }).click();
  expect(await savedState(page)).toEqual(before);
});
test("preview camera supports orbit, bounded zoom and reset", async ({ page }) => {
  await page.goto("/preview");
  const canvas = page.getByRole("img", { name: "Neutral fashion mannequin wearing a white T-shirt" });
  await expect(canvas).toHaveAttribute("data-rendered", "true");
  await canvas.hover({ position: { x: 300, y: 300 } });
  await page.mouse.down();
  await page.mouse.move(420, 300);
  await page.mouse.up();
  await page.mouse.wheel(0, -500);
  await page.getByRole("button", { name: "Reset camera", exact: true }).click();
  await expect(canvas).toHaveAttribute("data-view", "front");
});
test("preview mannequin records navigation-to-render and view response", async ({ page }) => {
  const start = Date.now();
  await page.goto("/preview");
  const canvas = page.getByRole("img", { name: "Neutral fashion mannequin wearing a white T-shirt" });
  await expect(canvas).toHaveAttribute("data-rendered", "true");
  const renderMs = Date.now() - start;
  const interactionStart = Date.now();
  await page.getByRole("button", { name: "side", exact: true }).click();
  await expect(canvas).toHaveAttribute("data-view", "side");
  const interactionMs = Date.now() - interactionStart;
  console.log({ renderMs, interactionMs, note: "Includes browser automation overhead; not FPS." });
  expect(renderMs).toBeLessThan(3000);
  expect(interactionMs).toBeLessThan(1000);
});
test("retired remote APIs return not found", async ({ request }) => {
  expect((await request.get("/api/bootstrap")).status()).toBe(404);
  for (const resource of ["categories", "subcategories", "items", "outfits", "plans"]) {
    expect((await request.post(`/api/${resource}`, { data: {} })).status()).toBe(404);
  }
});

import { test, expect } from "@playwright/test";

for (const timezoneId of ["UTC", "America/Los_Angeles", "Asia/Tokyo"]) {
  test.describe(timezoneId, () => {
    test.use({ timezoneId });
    test("planner restores saved fields, validates dates and preserves drafts across midnight", async ({ page }) => {
      // Choose an instant corresponding to local 23:59 in each tested zone.
      const instant = timezoneId === "UTC" ? "2035-06-15T23:59:00Z"
        : timezoneId === "America/Los_Angeles" ? "2035-06-16T06:59:00Z" : "2035-06-15T14:59:00Z";
      await page.clock.install({ time: new Date(instant) });
      await page.addInitScript(() => {
        if (localStorage.getItem("wardrope-store")) return;
        localStorage.setItem("wardrope-store", JSON.stringify({ version: 0, state: {
          setupComplete: true,
          categories: [{ id: "c", name: "Tops", order: 1 }],
          subcategories: [{ id: "s", categoryId: "c", name: "Shirts", order: 1 }],
          items: [{ id: "i", categoryId: "c", subcategoryId: "s", name: "Shirt", isFavorite: false, createdAt: "2035-01-01T00:00:00.000Z" }],
          outfits: [{ id: "o", name: "Office", itemIds: ["i"], isFavorite: false, createdAt: "2035-01-01T00:00:00.000Z" }],
          plans: [{ id: "p", outfitId: "o", plannedDate: "2035-06-15", description: "Saved notes", createdAt: "2035-01-01T00:00:00.000Z" }],
        } }));
      });
      await page.goto("/plan");
      await expect(page.getByRole("combobox", { name: "Outfit", exact: true })).toHaveValue("o");
      await expect(page.getByLabel("Notes (optional)")).toHaveValue("Saved notes");
      await expect(page.getByText("Fri, Jun 15", { exact: true })).toHaveCount(2);
      await page.getByLabel("Notes (optional)").fill("Unsaved draft");
      await page.clock.fastForward(120_000);
      await expect(page.getByText("Fri, Jun 15", { exact: true })).toHaveCount(0);
      await expect(page.getByLabel("Notes (optional)")).toHaveValue("Unsaved draft");
      await page.getByLabel("Date", { exact: true }).fill("");
      await page.getByRole("combobox", { name: "Outfit", exact: true }).selectOption("o");
      await expect(page.getByRole("button", { name: "Schedule outfit" })).toBeDisabled();
      await page.reload();
      await page.getByLabel("Date", { exact: true }).fill("2035-06-15");
      await expect(page.getByLabel("Notes (optional)")).toHaveValue("Saved notes");
    });
  });
}

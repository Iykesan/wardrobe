import { expect, test, type Locator, type Page } from "@playwright/test";

const CANVAS_NAME = "Neutral fashion mannequin wearing a white T-shirt";

async function openPreview(page: Page): Promise<Locator> {
  await page.goto("/preview");
  const canvas = page.getByRole("img", { name: CANVAS_NAME });
  await expect(canvas).toHaveAttribute("data-rendered", "true");
  return canvas;
}

// Read the state the renderer derives from the real THREE camera, not the UI label.
async function cameraState(canvas: Locator) {
  return {
    azimuth: parseFloat((await canvas.getAttribute("data-camera-azimuth")) ?? "NaN"),
    elevation: parseFloat((await canvas.getAttribute("data-camera-elevation")) ?? "NaN"),
    zoom: parseFloat((await canvas.getAttribute("data-camera-zoom")) ?? "NaN"),
  };
}

// The canvas is taller than the default viewport, so scroll it into view before
// using absolute mouse coordinates.
async function canvasCenter(page: Page, canvas: Locator) {
  await canvas.scrollIntoViewIfNeeded();
  const box = await canvas.boundingBox();
  if (!box) throw new Error("Canvas is not visible");
  return { x: box.x + box.width / 2, y: box.y + box.height / 2 };
}

async function orbit(page: Page, canvas: Locator, dx: number) {
  const { x, y } = await canvasCenter(page, canvas);
  await page.mouse.move(x, y);
  await page.mouse.down();
  await page.mouse.move(x + dx, y, { steps: 6 });
  await page.mouse.up();
}

test("horizontal drag orbits the real camera while the preset orientation stays fixed", async ({ page }) => {
  const canvas = await openPreview(page);
  const before = await cameraState(canvas);
  expect(before.azimuth).toBeCloseTo(0, 2);
  await expect(canvas).toHaveAttribute("data-view", "front");

  await orbit(page, canvas, 180);

  const after = await cameraState(canvas);
  expect(Math.abs(after.azimuth - before.azimuth)).toBeGreaterThan(0.5);
  // The drag must not rotate the model, so the preset view is still "front".
  await expect(canvas).toHaveAttribute("data-view", "front");
});

test("presets restore a canonical orientation after a drag", async ({ page }) => {
  const canvas = await openPreview(page);

  await orbit(page, canvas, 200);
  expect(Math.abs((await cameraState(canvas)).azimuth)).toBeGreaterThan(0.5);

  await page.getByRole("button", { name: "side", exact: true }).click();
  await expect(canvas).toHaveAttribute("data-view", "side");
  expect((await cameraState(canvas)).azimuth).toBeCloseTo(0, 2);

  await orbit(page, canvas, -220);
  expect(Math.abs((await cameraState(canvas)).azimuth)).toBeGreaterThan(0.5);

  await page.getByRole("button", { name: "front", exact: true }).click();
  await expect(canvas).toHaveAttribute("data-view", "front");
  expect((await cameraState(canvas)).azimuth).toBeCloseTo(0, 2);
});

test("reset camera restores the view even when front is already selected", async ({ page }) => {
  const canvas = await openPreview(page);
  await expect(canvas).toHaveAttribute("data-view", "front");

  await orbit(page, canvas, 220);
  const { x, y } = await canvasCenter(page, canvas);
  await page.mouse.move(x, y);
  await page.mouse.wheel(0, -600);
  expect(Math.abs((await cameraState(canvas)).azimuth)).toBeGreaterThan(0.5);
  expect((await cameraState(canvas)).zoom).toBeGreaterThan(1);

  await page.getByRole("button", { name: "Reset camera", exact: true }).click();

  await expect(canvas).toHaveAttribute("data-view", "front");
  const reset = await cameraState(canvas);
  expect(reset.azimuth).toBeCloseTo(0, 2);
  expect(reset.zoom).toBeCloseTo(1, 2);
  expect(reset.elevation).toBeCloseTo(4.45, 2);
});

test("re-selecting the active front preset also clears the orbit offset", async ({ page }) => {
  const canvas = await openPreview(page);
  await expect(canvas).toHaveAttribute("data-view", "front");

  await orbit(page, canvas, 200);
  expect(Math.abs((await cameraState(canvas)).azimuth)).toBeGreaterThan(0.5);

  await page.getByRole("button", { name: "front", exact: true }).click();
  await expect(canvas).toHaveAttribute("data-view", "front");
  expect((await cameraState(canvas)).azimuth).toBeCloseTo(0, 2);
});

test("wheel zoom stays within the supported clamp range", async ({ page }) => {
  const canvas = await openPreview(page);
  const { x, y } = await canvasCenter(page, canvas);
  await page.mouse.move(x, y);

  await page.mouse.wheel(0, -2000);
  expect((await cameraState(canvas)).zoom).toBeCloseTo(1.5, 3);

  await page.mouse.wheel(0, 4000);
  expect((await cameraState(canvas)).zoom).toBeCloseTo(0.75, 3);
});

test("keyboard alternatives orbit, zoom and reset the camera", async ({ page }) => {
  const canvas = await openPreview(page);
  await canvas.focus();

  const start = await cameraState(canvas);
  await canvas.press("ArrowRight");
  expect((await cameraState(canvas)).azimuth).toBeGreaterThan(start.azimuth + 0.2);

  for (let i = 0; i < 10; i++) await canvas.press("+");
  expect((await cameraState(canvas)).zoom).toBeCloseTo(1.5, 3);

  for (let i = 0; i < 10; i++) await canvas.press("-");
  expect((await cameraState(canvas)).zoom).toBeCloseTo(0.75, 3);

  await canvas.press("Home");
  const reset = await cameraState(canvas);
  expect(reset.azimuth).toBeCloseTo(0, 2);
  expect(reset.zoom).toBeCloseTo(1, 2);
  await expect(canvas).toHaveAttribute("data-view", "front");
});

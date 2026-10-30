import { test, expect } from "@playwright/test";
import path from "node:path";

const shotDir = path.resolve("docs/screenshots");

const RANGES = { little: [10, 40], big: [60, 250], adult: [800, 2800] };

const NEW_PICTURES = [
  ["friendly-whale", "little"],
  ["starfish-pool", "little"],
  ["coral-palace", "big"],
  ["dolphin-leap", "big"],
  ["seahorse-garden", "big"],
  ["reef-glow", "adult"],
  ["pearl-window", "adult"],
  ["steam-friend", "little"],
  ["bridge-crossing", "little"],
  ["colorful-cars", "little"],
  ["station-stop", "little"],
  ["tunnel-hello", "little"],
  ["moon-caboose", "little"],
  ["moon-hare", "adult"],
  ["clock-garden", "adult"],
  ["peacock-gate", "adult"],
  ["glass-butterfly", "adult"],
  ["amber-compass", "adult"],
  ["fern-rose", "adult"],
];

async function openPicture(page, id) {
  await page.goto("./#/play/" + id);
  await page.waitForFunction(
    (pictureId) => window.__WCCA && window.__WCCA.board && window.__WCCA.board.picture && window.__WCCA.board.picture.id === pictureId && window.__WCCA.board.cssW > 100 && window.__WCCA.board.frameTimes.length > 0,
    id
  );
}

async function pointFor(page) {
  return page.evaluate(() => {
    const board = window.__WCCA.board;
    const region = board.regions.find((r) => r.c === board.selected && !board.filled[r.i]);
    if (!region) return null;
    const sx = region.x * board.zoom + board.panX;
    const sy = region.y * board.zoom + board.panY;
    const hit = board.hitTest(sx, sy);
    const rect = board.canvas.getBoundingClientRect();
    return { x: rect.left + sx, y: rect.top + sy, index: region.i, hit };
  });
}

async function unlock(page, code) {
  await page.goto("./#/shop");
  await page.locator("input[name=code]").fill(code);
  await page.getByRole("button", { name: "Unlock" }).click();
}

test("new packs stay locked under Full Unlock, then render and color", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "tablet-chromium", "new-pack walkthrough runs once");

  await page.goto("./");
  await expect(page.getByRole("heading", { name: "Ocean Wonders" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "All Aboard" })).toBeVisible();
  await expect(page.getByRole("heading", { name: "Lantern Gallery" })).toBeVisible();
  await expect(page.locator("a.pic-card.locked", { hasText: "Steam Friend" })).toBeVisible();
  await expect(page.locator("a.pic-card.locked", { hasText: "Friendly Whale" })).toBeVisible();
  await expect(page.locator("a.pic-card.locked", { hasText: "Moon Hare" })).toBeVisible();
  await expect(page.locator("a.pic-card", { hasText: "Sunny Dragon" })).not.toHaveClass(/locked/);

  const catalog = await page.evaluate(() => {
    const packs = window.__WCCA.app.catalog.packs;
    return {
      pictures: packs.reduce((sum, pack) => sum + pack.pictures.length, 0),
      ids: packs.flatMap((pack) => pack.pictures.map((picture) => picture.id)),
    };
  });
  expect(catalog.pictures).toBe(54);
  for (const [id] of NEW_PICTURES) expect(catalog.ids).toContain(id);

  await unlock(page, "WCCA-FULL-TEST-DEMO-4K7Q");
  await expect(page.getByText("Full Unlock is unlocked on this device.")).toBeVisible();
  await page.goto("./");
  await expect(page.locator("a.pic-card.locked", { hasText: "Steam Friend" })).toBeVisible();
  await expect(page.locator("a.pic-card.locked", { hasText: "Friendly Whale" })).toBeVisible();
  await expect(page.locator("a.pic-card", { hasText: "Baby Phoenix" })).not.toHaveClass(/locked/);

  await unlock(page, "WCCA-PASS-TEST-DEMO-6L1V");
  await expect(page.getByText("All Future Packs is unlocked on this device.")).toBeVisible();
  await page.goto("./");
  await expect(page.locator("a.pic-card.locked", { hasText: "Steam Friend" })).toHaveCount(0);
  await expect(page.locator("a.pic-card", { hasText: "Colorful Cars" })).toBeVisible();
  await page.screenshot({ path: path.join(shotDir, "new-packs-home.png"), fullPage: true });

  for (const [id, tier] of NEW_PICTURES) {
    await openPicture(page, id);
    const stats = await page.evaluate(() => {
      const board = window.__WCCA.board;
      const fonts = board.regions.map((region) => board.fontPxFor(region)).sort((a, b) => a - b);
      return {
        id: board.picture.id,
        tier: board.picture.tier,
        regions: board.regions.length,
        medianFont: fonts[fonts.length >> 1],
        labeled: board.regions.filter((region) => Number.isFinite(region.x) && Number.isFinite(region.y)).length,
      };
    });
    const [lo, hi] = RANGES[tier];
    expect(stats.id).toBe(id);
    expect(stats.tier).toBe(tier);
    expect(stats.regions).toBeGreaterThanOrEqual(lo);
    expect(stats.regions).toBeLessThanOrEqual(hi);
    expect(stats.labeled).toBe(stats.regions);
    if (tier === "little") expect(stats.medianFont).toBeGreaterThanOrEqual(10);

    const before = await page.evaluate(() => window.__WCCA.board.filledCount());
    const pen = await pointFor(page);
    expect(pen.hit).toBe(pen.index);
    const canvas = page.locator("#board");
    await canvas.dispatchEvent("pointerdown", {
      pointerType: "pen",
      pointerId: 7,
      clientX: pen.x,
      clientY: pen.y,
      pressure: 0.4,
      width: 2,
      height: 2,
      buttons: 1,
      isPrimary: true,
    });
    await canvas.dispatchEvent("pointerup", {
      pointerType: "pen",
      pointerId: 7,
      clientX: pen.x,
      clientY: pen.y,
      pressure: 0.4,
      width: 2,
      height: 2,
      buttons: 0,
    });
    expect(await page.evaluate(() => window.__WCCA.board.filledCount())).toBe(before + 1);
  }

  await openPicture(page, "steam-friend");
  await page.screenshot({ path: path.join(shotDir, "new-steam-friend.png") });
  await openPicture(page, "bridge-crossing");
  await page.screenshot({ path: path.join(shotDir, "new-bridge-crossing.png") });
  await openPicture(page, "colorful-cars");
  await page.screenshot({ path: path.join(shotDir, "new-colorful-cars.png") });

  await openPicture(page, "reef-glow");
  await page.evaluate(() => {
    const board = window.__WCCA.board;
    const small = board.regions.find((region) => !board.filled[region.i] && region.bb.x1 - region.bb.x0 < 90 && region.bb.y1 - region.bb.y0 < 90);
    board.selected = small.c;
    board.rebuildHighlight();
  });
  const find = page.getByRole("button", { name: "Find next" });
  await find.click();
  const placed = await page.evaluate(() => {
    const board = window.__WCCA.board;
    const region = board.regions[window.__WCCA.lastNext];
    const cx = ((region.bb.x0 + region.bb.x1) / 2) * board.zoom + board.panX;
    const cy = ((region.bb.y0 + region.bb.y1) / 2) * board.zoom + board.panY;
    return {
      color: region.c,
      selected: board.selected,
      filled: board.filled[region.i],
      distance: Math.hypot(cx - board.cssW / 2, cy - board.cssH / 2),
    };
  });
  expect(placed.color).toBe(placed.selected);
  expect(placed.filled).toBe(0);
  expect(placed.distance).toBeLessThan(280);
  await page.screenshot({ path: path.join(shotDir, "new-reef-find-next.png") });

  await openPicture(page, "amber-compass");
  await find.click();
  const compass = await page.evaluate(() => {
    const board = window.__WCCA.board;
    const region = board.regions[window.__WCCA.lastNext];
    const cx = ((region.bb.x0 + region.bb.x1) / 2) * board.zoom + board.panX;
    const cy = ((region.bb.y0 + region.bb.y1) / 2) * board.zoom + board.panY;
    return {
      color: region.c,
      selected: board.selected,
      filled: board.filled[region.i],
      zoomed: board.zoom > board.fitZoom,
      distance: Math.hypot(cx - board.cssW / 2, cy - board.cssH / 2),
    };
  });
  expect(compass.color).toBe(compass.selected);
  expect(compass.filled).toBe(0);
  expect(compass.zoomed).toBe(true);
  expect(compass.distance).toBeLessThan(120);
  await page.getByRole("button", { name: "Magnifier" }).click();
  await expect(page.getByRole("button", { name: "Magnifier" })).toHaveAttribute("aria-pressed", "true");
  const box = await page.locator("#board").boundingBox();
  await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2);
  await expect(page.locator("#loupe")).toBeVisible();
  const alpha = await page.locator("#loupe").evaluate((canvas) => {
    const pixel = canvas.getContext("2d").getImageData(canvas.width / 2, canvas.height / 2, 1, 1).data;
    return pixel[3];
  });
  expect(alpha).toBeGreaterThan(10);
  await page.screenshot({ path: path.join(shotDir, "new-amber-magnifier.png") });

  await openPicture(page, "friendly-whale");
  await expect(page.getByRole("button", { name: "Magnifier" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Find next" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Next" })).toBeVisible();
});

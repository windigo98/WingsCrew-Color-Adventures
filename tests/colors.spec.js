import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import {
  littlePalette,
  luminance,
  normalizeHex,
  paletteFor,
  richPalette,
  shadeRow,
} from "../js/colors.js";

const shotDir = path.resolve("docs/screenshots");
const artDir = "/opt/cursor/artifacts";

test("palette offers many colors, a smaller set for little kids, and real shades", () => {
  expect(normalizeHex("#e23b4a")).toBe("#E23B4A");
  expect(normalizeHex("#fff")).toBe("#FFFFFF");
  expect(normalizeHex("  #00ffaa ")).toBe("#00FFAA");
  expect(normalizeHex("red")).toBe(null);
  expect(normalizeHex("#12")).toBe(null);
  expect(normalizeHex("#gg0000")).toBe(null);

  const little = littlePalette();
  const rich = richPalette();
  expect(little).toHaveLength(12);
  expect(paletteFor("little")).toEqual(little);
  expect(paletteFor("big")).toEqual(rich);
  expect(paletteFor("adult")).toEqual(rich);
  expect(rich.length).toBeGreaterThan(little.length);
  expect(rich.length).toBeGreaterThanOrEqual(48);
  for (const paint of [...little, ...rich]) {
    expect(paint.hex).toMatch(/^#[0-9A-F]{6}$/);
    expect(paint.name.length).toBeGreaterThan(0);
  }
  expect(new Set(little.map((paint) => paint.hex)).size).toBe(little.length);
  expect(new Set(rich.map((paint) => paint.hex)).size).toBe(rich.length);

  const shades = shadeRow("#E23B4A");
  expect(shades).toHaveLength(5);
  expect(shades[2].hex).toBe("#E23B4A");
  expect(luminance(shades[0].hex)).toBeGreaterThan(luminance(shades[2].hex));
  expect(luminance(shades[4].hex)).toBeLessThan(luminance(shades[2].hex));
  expect(shadeRow("nope")).toEqual([]);
});

async function openPicture(page, id) {
  await page.goto("./#/play/" + id);
  await page.waitForFunction(
    (pictureId) =>
      window.__WCCA &&
      window.__WCCA.board &&
      window.__WCCA.board.picture &&
      window.__WCCA.board.picture.id === pictureId &&
      window.__WCCA.board.cssW > 100 &&
      window.__WCCA.board.frameTimes.length > 0,
    id
  );
}

async function pointForColor(page, colorIndex, empty) {
  return page.evaluate(({ colorIndex, empty }) => {
    const board = window.__WCCA.board;
    const region = board.regions.find((item) => item.c === colorIndex && (!empty || !board.filled[item.i]));
    if (!region) return null;
    const sx = region.x * board.zoom + board.panX;
    const sy = region.y * board.zoom + board.panY;
    const rect = board.canvas.getBoundingClientRect();
    return { x: rect.left + sx, y: rect.top + sy, index: region.i, hit: board.hitTest(sx, sy) };
  }, { colorIndex, empty });
}

async function penAt(page, point) {
  const canvas = page.locator("#board");
  await canvas.dispatchEvent("pointerdown", {
    pointerType: "pen",
    pointerId: 4,
    clientX: point.x,
    clientY: point.y,
    pressure: 0.5,
    width: 2,
    height: 2,
    buttons: 1,
    isPrimary: true,
  });
  await canvas.dispatchEvent("pointerup", {
    pointerType: "pen",
    pointerId: 4,
    clientX: point.x,
    clientY: point.y,
    pressure: 0.5,
    width: 2,
    height: 2,
    buttons: 0,
  });
}

async function colorOf(page, index) {
  return page.evaluate((index) => window.__WCCA.board.colorHex(index), index);
}

function rgbOf(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

async function sample(page, regionIndex) {
  return page.evaluate((regionIndex) => {
    const board = window.__WCCA.board;
    const region = board.regions[regionIndex];
    const scale = board._cacheScale();
    const x = Math.max(0, Math.min(board.cache.width - 1, Math.round(region.x * scale)));
    const y = Math.max(0, Math.min(board.cache.height - 1, Math.round(region.y * scale)));
    const px = board.cctx.getImageData(x, y, 1, 1).data;
    return {
      color: board.colorHex(region.c),
      style: board.styleOf(region),
      rgb: [px[0], px[1], px[2]],
      filled: board.filled[regionIndex],
    };
  }, regionIndex);
}

function expectRgb(sampleResult, hex) {
  expect(sampleResult.color).toBe(hex);
  expect(sampleResult.style.toUpperCase()).toBe(hex);
  const want = rgbOf(hex);
  sampleResult.rgb.forEach((channel, i) => expect(Math.abs(channel - want[i])).toBeLessThanOrEqual(2));
}

async function shot(page, name) {
  fs.mkdirSync(artDir, { recursive: true });
  fs.mkdirSync(shotDir, { recursive: true });
  const art = path.join(artDir, name);
  await page.screenshot({ path: art });
  fs.copyFileSync(art, path.join(shotDir, name));
}

test("each number keeps a chosen color, including after a reload", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "tablet-chromium", "color flow runs on the iPad-sized tablet");

  const view = page.viewportSize();
  expect(view).toEqual({ width: 1024, height: 1366 });
  const sw = await page.request.get("./sw.js");
  const swText = await sw.text();
  expect(swText).toContain('const CACHE = "wcca-v8"');
  expect(swText).toContain("./js/colors.js");

  await openPicture(page, "sunny-dragon");
  await expect(page.locator(".play-title")).toContainText("Little Kids");
  await expect(page.locator("#play-hint")).toContainText("Tap a number and pick its color");
  const preset = normalizeHex(await page.evaluate(() => window.__WCCA.board.picture.palette[0].hex));
  expect(await colorOf(page, 0)).toBe(preset);

  await page.locator('.swatch[data-color="0"]').click();
  const sheet = page.locator("#color-sheet");
  await expect(sheet).toBeVisible();
  await expect(sheet.locator("h2")).toHaveText("Number 1");
  await expect(sheet.locator(".pick")).toHaveCount(12);
  await expect(sheet.locator(".shade")).toHaveCount(5);
  await expect(sheet.getByRole("button", { name: /^Suggested/ })).toBeVisible();
  await expect(sheet.locator("#mix-color")).toHaveCount(0);
  await expect(sheet.getByText("On this page")).toHaveCount(0);
  const pickBox = await sheet.locator(".pick").first().boundingBox();
  expect(Math.min(pickBox.width, pickBox.height)).toBeGreaterThanOrEqual(60);
  const shadeBox = await sheet.locator(".shade").first().boundingBox();
  expect(shadeBox.height).toBeGreaterThanOrEqual(60);

  const other = await pointForColor(page, 1, true);
  expect(other.hit).toBe(other.index);
  await penAt(page, other);
  expect(await page.evaluate(() => window.__WCCA.board.filledCount())).toBe(0);

  await sheet.locator('.pick[data-name="Red"]').click();
  const light = await sheet.locator(".shade").first().getAttribute("data-pick");
  expect(light).not.toBe("#E23B4A");
  await sheet.locator(".shade").first().click();
  expect(await colorOf(page, 0)).toBe(light);

  const spot = await pointForColor(page, 0, true);
  expect(spot.hit).toBe(spot.index);
  await penAt(page, spot);
  await expect.poll(() => page.evaluate(() => window.__WCCA.board.filledCount())).toBe(1);
  expectRgb(await sample(page, spot.index), light);

  await sheet.locator('.pick[data-name="Blue"]').click();
  expect(await colorOf(page, 0)).toBe("#3A78D6");
  expectRgb(await sample(page, spot.index), "#3A78D6");
  expect(await page.evaluate(() => window.__WCCA.board.filledCount())).toBe(1);

  await page.getByRole("button", { name: "Undo" }).click();
  expect(await colorOf(page, 0)).toBe(light);
  expectRgb(await sample(page, spot.index), light);
  await page.getByRole("button", { name: "Redo" }).click();
  expect(await colorOf(page, 0)).toBe("#3A78D6");

  await page.evaluate(() => {
    const board = window.__WCCA.board;
    for (const region of board.regions) if (region.c === 0) board.filled[region.i] = 1;
    board._paintCache();
    board.rebuildHighlight();
    board.fit();
    board.gesturing = false;
    board.draw();
  });
  await shot(page, "ipad-little-kids.png");
  await page.evaluate((index) => {
    const board = window.__WCCA.board;
    board.filled.fill(0);
    board.filled[index] = 1;
    board._paintCache();
    board.rebuildHighlight();
    board.draw();
  }, spot.index);
  await page.getByRole("button", { name: "Undo" }).click();
  await page.getByRole("button", { name: "Redo" }).click();

  await expect.poll(async () => page.evaluate(() => new Promise((resolve, reject) => {
    const open = indexedDB.open("wingscrew-color-adventures");
    open.onerror = () => reject(open.error);
    open.onsuccess = () => {
      const req = open.result.transaction("progress").objectStore("progress").get("sunny-dragon");
      req.onsuccess = () => {
        const row = req.result;
        resolve(row ? { color: row.colors?.[0] || "", filled: (row.filled || []).length } : null);
      };
      req.onerror = () => reject(req.error);
    };
  }))).toEqual({ color: "#3A78D6", filled: 1 });

  await page.reload();
  await page.waitForFunction(() => window.__WCCA && window.__WCCA.board && window.__WCCA.board.picture && window.__WCCA.board.picture.id === "sunny-dragon" && window.__WCCA.board.filledCount() > 0);
  expect(await colorOf(page, 0)).toBe("#3A78D6");
  expect(await page.evaluate((index) => window.__WCCA.board.filled[index], spot.index)).toBe(1);
  await expect(page.locator("#color-sheet")).toBeHidden();

  await page.getByRole("button", { name: "Highlight" }).click();
  await expect(page.getByRole("button", { name: "Highlight" })).toHaveAttribute("aria-pressed", "false");
  await page.getByRole("button", { name: "Highlight" }).click();
  await expect(page.getByRole("button", { name: "Highlight" })).toHaveAttribute("aria-pressed", "true");
  const zoomBefore = await page.evaluate(() => window.__WCCA.board.zoom);
  await page.getByRole("button", { name: "Zoom in" }).click();
  await expect.poll(() => page.evaluate(() => window.__WCCA.board.zoom)).toBeGreaterThan(zoomBefore);
  const openColor = await page.evaluate(() => {
    const board = window.__WCCA.board;
    return board.regions.find((region) => !board.filled[region.i]).c;
  });
  await page.locator(`.swatch[data-color="${openColor}"]`).click();
  await page.getByRole("button", { name: "Next", exact: true }).click();
  const next = await page.evaluate(() => {
    const board = window.__WCCA.board;
    const region = board.regions[window.__WCCA.lastNext];
    return region ? { color: region.c, selected: board.selected, filled: board.filled[region.i] } : null;
  });
  expect(next.filled).toBe(0);
  expect(next.color).toBe(next.selected);

  await openPicture(page, "garden-mandala");
  await expect(page.locator(".play-title")).toContainText("Adults");
  await page.locator('.swatch[data-color="2"]').click();
  await expect(sheet).toBeVisible();
  await expect(sheet.locator("h2")).toHaveText("Number 3");
  expect(await sheet.locator(".pick").count()).toBeGreaterThan(12);
  await expect(sheet.locator(".shade")).toHaveCount(5);
  await expect(sheet.getByText("On this page")).toBeVisible();
  const adultPick = await sheet.locator(".pick").first().boundingBox();
  expect(Math.min(adultPick.width, adultPick.height)).toBeGreaterThanOrEqual(44);
  await shot(page, "ipad-palette-open.png");
  await sheet.locator("#mix-color").scrollIntoViewIfNeeded();
  await expect(sheet.locator("#mix-color")).toBeVisible();

  const suggested = normalizeHex(await page.evaluate(() => window.__WCCA.board.picture.palette[2].hex));
  await sheet.getByRole("button", { name: /^Suggested/ }).click();
  expect(await colorOf(page, 2)).toBe(suggested);
  await sheet.locator('.pick[data-name="Red"]').click();
  expect(await colorOf(page, 2)).toBe("#E23B4A");
  await sheet.locator("#mix-color").evaluate((el) => {
    el.value = "#ff00aa";
    el.dispatchEvent(new Event("change", { bubbles: true }));
  });
  expect(await colorOf(page, 2)).toBe("#FF00AA");
  const adultSpot = await pointForColor(page, 2, true);
  expect(adultSpot.hit).toBe(adultSpot.index);
  await penAt(page, adultSpot);
  await expect.poll(() => page.evaluate(() => window.__WCCA.board.filledCount())).toBe(1);
  expectRgb(await sample(page, adultSpot.index), "#FF00AA");
  await sheet.locator("#mix-color").evaluate((el) => {
    el.value = "#1122ee";
    el.dispatchEvent(new Event("change", { bubbles: true }));
  });
  expect(await colorOf(page, 2)).toBe("#1122EE");
  expectRgb(await sample(page, adultSpot.index), "#1122EE");

  await sheet.getByRole("button", { name: "Done" }).click();
  await expect(sheet).toBeHidden();
  await page.getByRole("button", { name: "Highlight" }).click();
  await page.evaluate(() => {
    const board = window.__WCCA.board;
    const picks = ["#E23B4A", "#3A78D6", "#FFE14A", "#2F9E6B", "#7B5EA7", "#FF00AA", "#F08A2A", "#1B2430"];
    picks.forEach((hex, index) => {
      if (index < board.colors.length) board.colors[index] = hex;
    });
    const groups = new Map();
    for (const region of board.regions) {
      const list = groups.get(region.c) || [];
      list.push(region);
      groups.set(region.c, list);
    }
    for (const list of groups.values()) {
      const take = Math.max(1, Math.round(list.length * 0.42));
      for (let i = 0; i < take; i++) board.filled[list[i].i] = 1;
    }
    board.highlight = false;
    board._paintCache();
    board.rebuildHighlight();
    board.fit();
    board.gesturing = false;
    board.draw();
    const stats = board.colorStats();
    const count = document.getElementById("play-count");
    if (count) count.textContent = String(board.filledCount());
    document.querySelectorAll(".swatch").forEach((btn) => {
      const index = +btn.dataset.color;
      const meta = btn.querySelector(".swatch-meta");
      const done = stats.done[index];
      const total = stats.total[index];
      if (meta) meta.textContent = `${done}/${total}${total > 0 && done === total ? " ✓" : ""}`;
      const chip = btn.querySelector(".chip");
      if (chip) chip.style.backgroundColor = board.colorHex(index);
    });
  });
  const colored = await page.evaluate(() => {
    const board = window.__WCCA.board;
    const custom = board.colors.filter((hex, index) => hex !== (board.picture.palette[index].hex || "").toUpperCase()).length;
    return { filled: board.filledCount(), total: board.regions.length, custom };
  });
  expect(colored.filled).toBeGreaterThan(20);
  expect(colored.filled).toBeLessThan(colored.total);
  expect(colored.custom).toBeGreaterThan(3);
  await shot(page, "ipad-adult-custom-colors.png");

  await page.getByRole("button", { name: "Highlight" }).click();
  await expect(page.getByRole("button", { name: "Highlight" })).toHaveAttribute("aria-pressed", "true");
  const adultZoom = await page.evaluate(() => window.__WCCA.board.zoom);
  await page.getByRole("button", { name: "Zoom in" }).click();
  await expect.poll(() => page.evaluate(() => window.__WCCA.board.zoom)).toBeGreaterThan(adultZoom);
  await page.getByRole("button", { name: "Find next" }).click();
  const found = await page.evaluate(() => {
    const board = window.__WCCA.board;
    const region = board.regions[window.__WCCA.lastNext];
    return region ? { color: region.c, selected: board.selected, filled: board.filled[region.i] } : null;
  });
  expect(found.color).toBe(found.selected);
  expect(found.filled).toBe(0);
});

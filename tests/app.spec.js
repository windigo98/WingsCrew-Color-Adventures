import { test, expect } from "@playwright/test";
import fs from "node:fs";
import path from "node:path";
import { PNG } from "pngjs";

const shotDir = path.resolve("docs/screenshots");

function writeBlocks() {
  const file = path.resolve("tests/fixtures/blocks.png");
  fs.mkdirSync(path.dirname(file), { recursive: true });
  if (fs.existsSync(file)) return file;
  const png = new PNG({ width: 160, height: 120 });
  const blocks = [
    [0, 80, 0, 60, "#e25b1a"],
    [80, 160, 0, 60, "#1b2430"],
    [0, 80, 60, 120, "#f0a03a"],
    [80, 160, 60, 120, "#2f6f4e"],
    [40, 120, 30, 90, "#7a2344"],
  ];
  function hex(h) {
    return [parseInt(h.slice(1, 3), 16), parseInt(h.slice(3, 5), 16), parseInt(h.slice(5, 7), 16)];
  }
  for (let y = 0; y < 120; y++) {
    for (let x = 0; x < 160; x++) {
      let color = [244, 239, 228];
      for (const [x0, x1, y0, y1, h] of blocks) {
        if (x >= x0 && x < x1 && y >= y0 && y < y1) color = hex(h);
      }
      const i = (y * 160 + x) * 4;
      png.data[i] = color[0];
      png.data[i + 1] = color[1];
      png.data[i + 2] = color[2];
      png.data[i + 3] = 255;
    }
  }
  fs.writeFileSync(file, PNG.sync.write(png));
  return file;
}

async function openPicture(page, id) {
  await page.goto("./#/play/" + id);
  await page.waitForFunction(() => window.__WCCA && window.__WCCA.board && window.__WCCA.board.cssW > 100);
  await page.waitForFunction(() => window.__WCCA.board.frameTimes.length > 0);
}

async function pointFor(page, which) {
  return page.evaluate((kind) => {
    const board = window.__WCCA.board;
    const region = board.regions.find((r) => {
      if (kind === "selected-empty") return r.c === board.selected && !board.filled[r.i];
      return r.c === board.selected;
    });
    if (!region) return null;
    const sx = region.x * board.zoom + board.panX;
    const sy = region.y * board.zoom + board.panY;
    const hit = board.hitTest(sx, sy);
    const rect = board.canvas.getBoundingClientRect();
    return { x: rect.left + sx, y: rect.top + sy, index: region.i, hit };
  }, which);
}

test.beforeAll(() => {
  fs.mkdirSync(shotDir, { recursive: true });
  writeBlocks();
});

test("home, coloring, zoom, pan, undo, pen, and palm rejection", async ({ page }, testInfo) => {
  await page.goto("./");
  await expect(page.locator("h1")).toHaveText("Color Adventures");
  await expect(page.getByText("Sunny Dragon")).toBeVisible();
  await expect(page.locator("footer")).toContainText("© 2026 WingsCrew");
  if (testInfo.project.name === "tablet-chromium") {
    await page.screenshot({ path: path.join(shotDir, "tablet-home.png"), fullPage: true });
  }
  if (testInfo.project.name === "phone-chromium") {
    await page.screenshot({ path: path.join(shotDir, "phone-home.png"), fullPage: false });
  }

  await openPicture(page, "sunny-dragon");
  await expect(page.locator(".play-title strong")).toHaveText("Sunny Dragon");
  const before = await page.evaluate(() => window.__WCCA.board.filledCount());
  expect(before).toBe(0);

  const canvas = page.locator("#board");
  const palm = await pointFor(page, "selected");
  expect(palm.hit).toBe(palm.index);
  await canvas.dispatchEvent("pointerdown", {
    pointerType: "touch",
    pointerId: 11,
    clientX: palm.x,
    clientY: palm.y,
    width: 80,
    height: 70,
    buttons: 1,
    isPrimary: true,
  });
  await canvas.dispatchEvent("pointerup", {
    pointerType: "touch",
    pointerId: 11,
    clientX: palm.x,
    clientY: palm.y,
    width: 80,
    height: 70,
    buttons: 0,
  });
  expect(await page.evaluate(() => window.__WCCA.board.filledCount())).toBe(0);

  const pen = await pointFor(page, "selected-empty");
  expect(pen.hit).toBe(pen.index);
  await canvas.dispatchEvent("pointerdown", {
    pointerType: "pen",
    pointerId: 3,
    clientX: pen.x,
    clientY: pen.y,
    pressure: 0.55,
    width: 2,
    height: 2,
    buttons: 1,
    isPrimary: true,
  });
  await canvas.dispatchEvent("pointerup", {
    pointerType: "pen",
    pointerId: 3,
    clientX: pen.x,
    clientY: pen.y,
    pressure: 0.55,
    width: 2,
    height: 2,
    buttons: 0,
  });
  await expect.poll(() => page.evaluate(() => window.__WCCA.board.filledCount())).toBe(1);

  const zoomBefore = await page.evaluate(() => window.__WCCA.board.zoom);
  await page.getByRole("button", { name: "Zoom in" }).click();
  await expect.poll(() => page.evaluate(() => window.__WCCA.board.zoom)).toBeGreaterThan(zoomBefore);
  const maxRatio = await page.evaluate(() => window.__WCCA.board.zoom / window.__WCCA.board.fitZoom);
  expect(maxRatio).toBeLessThanOrEqual(8.01);

  const panBefore = await page.evaluate(() => window.__WCCA.board.panX);
  const box = await canvas.boundingBox();
  await page.mouse.move(box.x + 80, box.y + 80);
  await page.mouse.down();
  await page.mouse.move(box.x + 160, box.y + 110, { steps: 6 });
  await page.mouse.up();
  const panAfter = await page.evaluate(() => window.__WCCA.board.panX);
  expect(Math.abs(panAfter - panBefore)).toBeGreaterThan(20);
  expect(await page.evaluate(() => window.__WCCA.board.filledCount())).toBe(1);

  await page.getByRole("button", { name: "Undo" }).click();
  await expect.poll(() => page.evaluate(() => window.__WCCA.board.filledCount())).toBe(0);
  await page.getByRole("button", { name: "Redo" }).click();
  await expect.poll(() => page.evaluate(() => window.__WCCA.board.filledCount())).toBe(1);

  await page.evaluate(() => {
    const board = window.__WCCA.board;
    board.gesturing = false;
    board.zoomAt(board.cssW / 2, board.cssH / 2, 3);
    board.draw();
  });
  const numbers = await page.evaluate(() => {
    const board = window.__WCCA.board;
    return board.regions.filter((r) => !board.filled[r.i] && Math.sqrt(r.area) * board.zoom * 0.2 >= 10).length;
  });
  expect(numbers).toBeGreaterThan(0);

  if (testInfo.project.name === "tablet-chromium") {
    await page.screenshot({ path: path.join(shotDir, "tablet-play.png") });
  }
  if (testInfo.project.name === "phone-chromium") {
    await page.screenshot({ path: path.join(shotDir, "phone-play.png") });
    const paletteBox = await page.locator(".palette").boundingBox();
    const view = page.viewportSize();
    expect(paletteBox.y + paletteBox.height).toBeLessThanOrEqual(view.height + 1);
  }
  if (testInfo.project.name === "tablet-chromium") {
    await page.evaluate(() => {
      document.getElementById("complete").hidden = false;
    });
    await expect(page.getByText("Beautiful work.")).toBeVisible();
    await page.getByRole("button", { name: "Save PNG" }).click();
    await expect(page.locator("#gate-title")).toBeVisible();
    const question = await page.locator(".modal p").nth(1).textContent();
    const match = question.match(/(\d+) \+ (\d+)/);
    await page.locator("#gate-answer").fill(String(Number(match[1]) + Number(match[2])));
    const downloadPromise = page.waitForEvent("download");
    await page.locator("#gate-form button[type=submit]").click();
    const download = await downloadPromise;
    expect(download.suggestedFilename()).toContain("sunny-dragon");
  }
});

test("test-mode purchase, photo page, offline reload, and adult performance", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "tablet-chromium", "full walkthrough runs on tablet Chromium");

  await page.goto("./#/shop");
  await expect(page.getByText("TEST MODE: no real charge")).toBeVisible();
  await page.screenshot({ path: path.join(shotDir, "tablet-shop.png"), fullPage: true });
  await page.getByRole("button", { name: "Buy" }).first().click();
  await expect(page.locator("h1")).toHaveText("Five small steps. Pay once.");
  await expect(page.getByText("payhip.com")).toBeVisible();
  await expect(page.getByText("no subscription")).toBeVisible();
  await page.getByRole("button", { name: "Continue" }).click();
  await expect(page.getByText("TEST MODE: no real charge")).toBeVisible();
  await expect(page.locator("h1")).toHaveText("Order summary");
  await page.getByRole("button", { name: /Pay \$/ }).click();
  const code = (await page.locator("#test-code").textContent()).trim();
  expect(code.startsWith("WCCA-")).toBeTruthy();
  await page.screenshot({ path: path.join(shotDir, "tablet-checkout.png") });
  await page.getByRole("button", { name: "Enter this code" }).click();
  await expect(page.getByText("Unlocked").first()).toBeVisible();

  await page.goto("./#/photo");
  await page.locator("#k-range").evaluate((el) => {
    el.value = "8";
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await page.locator("#d-range").evaluate((el) => {
    el.value = "0";
    el.dispatchEvent(new Event("input", { bubbles: true }));
  });
  await page.locator("#photo-file").setInputFiles(path.resolve("tests/fixtures/blocks.png"));
  await page.getByRole("button", { name: "Make a page" }).click();
  await expect(page.locator("#photo-summary")).toContainText("regions", { timeout: 90000 });
  const summary = await page.locator("#photo-summary").textContent();
  expect(summary).toMatch(/\d+ regions/);
  await page.screenshot({ path: path.join(shotDir, "tablet-photo.png") });

  await openPicture(page, "dragon-queen");
  const perf = await page.evaluate(async () => {
    const board = window.__WCCA.board;
    const loadMs = window.__WCCA.loadMs;
    board.frameTimes = [];
    const panTimes = [];
    board.gesturing = true;
    for (let i = 0; i < 24; i++) {
      board.panX -= 6;
      board.clampPan();
      const t0 = performance.now();
      board.draw();
      panTimes.push(performance.now() - t0);
    }
    const zoomTimes = [];
    for (let i = 0; i < 10; i++) {
      board.zoomAt(board.cssW / 2, board.cssH / 2, 1.18);
      board.gesturing = true;
      const t0 = performance.now();
      board.draw();
      zoomTimes.push(performance.now() - t0);
    }
    const region = board.regions.find((r) => r.c === board.selected);
    const tFill = performance.now();
    board.fill(region.i);
    const fillMs = performance.now() - tFill;
    board.gesturing = false;
    board.zoom = board.fitZoom * 6;
    board.clampPan();
    const visible = board.visibleRegions().length;
    const vectorTimes = [];
    for (let i = 0; i < 8; i++) {
      const t0 = performance.now();
      board.draw();
      vectorTimes.push(performance.now() - t0);
    }
    const cacheTimes = [];
    for (let i = 0; i < 4; i++) {
      const t0 = performance.now();
      board._paintCache();
      cacheTimes.push(performance.now() - t0);
    }
    for (const r of board.regions) board.filled[r.i] = 1;
    board._paintCache();
    board.highlight = false;
    board.rebuildHighlight();
    const target = [...board.regions].sort((a, b) => a.area - b.area)[80];
    board.fit();
    board.zoomToRegion(target);
    board.gesturing = false;
    board.draw();
    const avg = (xs) => xs.reduce((a, b) => a + b, 0) / xs.length;
    return {
      regions: board.regions.length,
      loadMs: Math.round(loadMs),
      panMs: Math.round(avg(panTimes) * 10) / 10,
      zoomMs: Math.round(avg(zoomTimes) * 10) / 10,
      vectorMs: Math.round(avg(vectorTimes) * 10) / 10,
      visibleAt6x: visible,
      cacheMs: Math.round((cacheTimes.reduce((a, b) => a + b, 0) / cacheTimes.length) * 10) / 10,
      fillMs: Math.round((board.lastFillMs || fillMs) * 10) / 10,
      zoomRatio: Math.round((board.zoom / board.fitZoom) * 10) / 10,
    };
  });
  expect(perf.regions).toBeGreaterThan(2000);
  expect(perf.panMs).toBeLessThan(50);
  expect(perf.fillMs).toBeLessThan(80);
  fs.writeFileSync(path.join(shotDir, "adult-perf.json"), JSON.stringify(perf, null, 2));
  await page.screenshot({ path: path.join(shotDir, "tablet-adult-zoom.png") });

  await page.evaluate(() => navigator.serviceWorker.ready);
  await page.reload();
  await page.waitForFunction(() => navigator.serviceWorker.controller);
  await page.context().setOffline(true);
  await page.reload();
  await expect(page.locator(".play-title strong")).toHaveText("Dragon Queen", { timeout: 15000 });
  await page.evaluate(() => {
    location.hash = "#/";
  });
  await expect(page.locator("h1")).toHaveText("Color Adventures");
  await page.reload();
  await expect(page.locator("h1")).toHaveText("Color Adventures");
  await page.context().setOffline(false);
});

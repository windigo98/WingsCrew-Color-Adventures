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
  await expect(page.locator("h1")).toHaveText("WingsCrew Color Adventures");
  await expect(page.getByText("Sunny Dragon")).toBeVisible();
  await expect(page.locator("footer")).toContainText("© 2026 WingsCrew");
  await page.waitForFunction(() => {
    const img = document.querySelector("header.top img");
    return img && img.complete && img.naturalWidth > 0;
  });
  if (testInfo.project.name === "tablet-chromium") {
    await page.locator("header.top").screenshot({ path: path.join(shotDir, "header.png") });
    await page.screenshot({ path: path.join(shotDir, "tablet-home.png"), fullPage: true });
    await page.evaluate(() => {
      const overlay = document.createElement("div");
      overlay.id = "icon-shot";
      overlay.innerHTML = `<div class="tile"><img src="icons/apple-touch-icon.png" alt="" width="120" height="120"><div>WingsCrew</div></div>`;
      overlay.style.cssText = "position:fixed;inset:0;z-index:40;background:linear-gradient(180deg,#7eb6e0,#c5dff3);display:flex;align-items:center;justify-content:center;";
      const tile = overlay.querySelector(".tile");
      tile.style.cssText = "text-align:center;color:#fff;font:500 13px/1.2 -apple-system,BlinkMacSystemFont,sans-serif;text-shadow:0 1px 2px rgba(0,0,0,.35);";
      const img = overlay.querySelector("img");
      img.style.cssText = "width:120px;height:120px;border-radius:26px;box-shadow:0 10px 24px rgba(0,0,0,.28);display:block;";
      document.body.appendChild(overlay);
    });
    await page.waitForFunction(() => {
      const img = document.querySelector("#icon-shot img");
      return img && img.complete && img.naturalWidth > 0;
    });
    await page.locator("#icon-shot").screenshot({ path: path.join(shotDir, "home-screen-icon.png") });
    await page.evaluate(() => document.getElementById("icon-shot")?.remove());
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
    board.patterns = true;
    const patternStart = performance.now();
    board._rebuildPatterns();
    const patternRebuildMs = performance.now() - patternStart;
    board.gesturing = true;
    board.fit();
    board.draw();
    const patternPan = [];
    for (let i = 0; i < 12; i++) {
      board.panX -= 4;
      board.clampPan();
      const t0 = performance.now();
      board.draw();
      patternPan.push(performance.now() - t0);
    }
    board.patterns = false;
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
      patternRebuildMs: Math.round(patternRebuildMs),
      patternPanMs: Math.round(avg(patternPan) * 10) / 10,
    };
  });
  expect(perf.regions).toBeGreaterThan(2000);
  expect(perf.panMs).toBeLessThan(50);
  expect(perf.fillMs).toBeLessThan(80);
  expect(perf.patternPanMs).toBeLessThan(50);
  expect(perf.patternRebuildMs).toBeLessThan(2500);
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
  await expect(page.locator("h1")).toHaveText("WingsCrew Color Adventures");
  await page.reload();
  await expect(page.locator("h1")).toHaveText("WingsCrew Color Adventures");
  await page.context().setOffline(false);
});

test("little kids shelf asks a grown-up before outside links and buying", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "tablet-chromium", "gate check runs once");
  await page.goto("./");
  await page.getByRole("tab", { name: "Little Kids" }).click();
  await page.getByRole("link", { name: "Tip on Cash App" }).click();
  await expect(page.locator("#gate-title")).toBeVisible();
  await page.getByRole("button", { name: "Not now" }).click();
  await expect(page.locator("#gate-title")).toHaveCount(0);
  await expect(page.locator("h1")).toHaveText("WingsCrew Color Adventures");

  await page.getByRole("link", { name: "Feedback" }).click();
  await expect(page.locator("#gate-title")).toBeVisible();
  await page.getByRole("button", { name: "Not now" }).click();

  await page.locator("#nav-shop").click();
  await page.getByRole("button", { name: "Buy" }).first().click();
  await expect(page.locator("#gate-title")).toBeVisible();
  await expect(page.locator("h1")).toHaveText("Try free. Pay once.");
  await page.getByRole("button", { name: "Not now" }).click();

  await page.getByRole("button", { name: "Buy" }).first().click();
  const question = await page.locator(".modal p").nth(1).textContent();
  const match = question.match(/(\d+) \+ (\d+)/);
  await page.locator("#gate-answer").fill(String(Number(match[1]) + Number(match[2])));
  await page.locator("#gate-form button[type=submit]").click();
  await expect(page.locator("h1")).toHaveText("Five small steps. Pay once.");

  await page.evaluate(() => {
    location.hash = "#/play/sunny-dragon";
  });
  await page.waitForFunction(() => window.__WCCA && window.__WCCA.board && window.__WCCA.board.cssW > 100);
  await page.evaluate(() => {
    document.getElementById("complete").hidden = false;
  });
  await page.getByRole("button", { name: "Save PNG" }).click();
  await expect(page.locator("#gate-title")).toBeVisible();
  const saveQuestion = await page.locator(".modal p").nth(1).textContent();
  const saveMatch = saveQuestion.match(/(\d+) \+ (\d+)/);
  await page.locator("#gate-answer").fill(String(Number(saveMatch[1]) + Number(saveMatch[2])));
  const downloadPromise = page.waitForEvent("download");
  await page.locator("#gate-form button[type=submit]").click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toContain("sunny-dragon");
  await expect(page.locator("#gate-title")).toHaveCount(0);
});

test("studio links name WingsCrew, open the studio site, and ask a grown-up in kid modes", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "tablet-chromium", "studio link check runs once");

  await page.route("https://wingscrew.com/**", (route) =>
    route.fulfill({
      status: 200,
      contentType: "text/html",
      body: "<!doctype html><title>WingsCrew</title><p>WingsCrew studio</p>",
    })
  );

  const sw = await page.request.get("./sw.js");
  const swText = await sw.text();
  expect(swText).toContain('const CACHE = "wcca-v4"');
  expect(swText).toContain("./icons/logo.png");

  await page.goto("./");
  await expect(page.locator("h1")).toHaveText("WingsCrew Color Adventures");
  await expect(page.locator("footer p").first()).toHaveText("© 2026 WingsCrew. All rights reserved.");

  const credit = page.getByRole("link", { name: "by WingsCrew" });
  const more = page.getByRole("link", { name: "More from WingsCrew" });
  const footerStudio = page.locator("footer").getByRole("link", { name: "WingsCrew", exact: true });
  for (const link of [credit, more, footerStudio]) {
    await expect(link).toBeVisible();
    await expect(link).toHaveAttribute("href", "https://wingscrew.com/");
    await expect(link).toHaveAttribute("target", "_blank");
    await expect(link).toHaveAttribute("rel", "noopener noreferrer");
  }
  await expect(credit.locator("img")).toHaveAttribute("src", /logo\.png/);

  const unlinkedOn = async (label) => {
    const bad = await page.evaluate(() => {
      const walker = document.createTreeWalker(document.body, NodeFilter.SHOW_TEXT);
      const found = [];
      while (walker.nextNode()) {
        const node = walker.currentNode;
        if (!node.nodeValue.includes("WingsCrew")) continue;
        const parent = node.parentElement;
        if (parent && parent.closest("a[href='https://wingscrew.com/']")) continue;
        found.push((parent ? parent.tagName : "?") + ": " + node.nodeValue.trim().slice(0, 90));
      }
      return found;
    });
    expect(bad, label).toEqual([]);
  };
  await unlinkedOn("home");

  await page.getByRole("tab", { name: "Adults" }).click();
  await expect(page.locator("#gate-title")).toHaveCount(0);
  const adultPopup = page.waitForEvent("popup");
  await more.click();
  const adultPage = await adultPopup;
  await expect(adultPage).toHaveURL(/wingscrew\.com/);
  await expect(page.locator("#gate-title")).toHaveCount(0);
  await adultPage.close();

  await page.evaluate(() => window.scrollTo(0, 0));
  const adultTiers = await page.locator(".tier-switch").boundingBox();
  await page.screenshot({
    path: path.join(shotDir, "adults-studio-credit.png"),
    clip: { x: 0, y: 0, width: 1024, height: Math.ceil(adultTiers.y + adultTiers.height + 20) },
  });

  await page.getByRole("tab", { name: "Little Kids" }).click();
  let popped = false;
  const onPopup = () => {
    popped = true;
  };
  page.on("popup", onPopup);
  await credit.click();
  await expect(page.locator("#gate-title")).toBeVisible();
  await page.getByRole("button", { name: "Not now" }).click();
  await expect(page.locator("#gate-title")).toHaveCount(0);
  await expect(page.locator("h1")).toHaveText("WingsCrew Color Adventures");
  expect(popped).toBe(false);

  await footerStudio.click();
  await expect(page.locator("#gate-title")).toBeVisible();
  const question = await page.locator(".modal p").nth(1).textContent();
  const match = question.match(/(\d+) \+ (\d+)/);
  await page.locator("#gate-answer").fill(String(Number(match[1]) + Number(match[2])));
  const kidPopup = page.waitForEvent("popup");
  await page.locator("#gate-form button[type=submit]").click();
  const kidPage = await kidPopup;
  await expect(kidPage).toHaveURL(/wingscrew\.com/);
  await kidPage.close();
  await expect(page.locator("#gate-title")).toHaveCount(0);
  page.off("popup", onPopup);

  await page.evaluate(() => window.scrollTo(0, 0));
  const littleTiers = await page.locator(".tier-switch").boundingBox();
  await page.screenshot({
    path: path.join(shotDir, "little-kids-studio-credit.png"),
    clip: { x: 0, y: 0, width: 1024, height: Math.ceil(littleTiers.y + littleTiers.height + 20) },
  });

  await page.getByRole("tab", { name: "Big Kids" }).click();
  await more.click();
  await expect(page.locator("#gate-title")).toBeVisible();
  await page.getByRole("button", { name: "Not now" }).click();
  await expect(page.locator("#gate-title")).toHaveCount(0);

  await page.locator("#nav-shop").click();
  await page.locator("input[name=code]").fill("not-a-code");
  await page.getByRole("button", { name: "Unlock" }).click();
  const codeLink = page.locator("#code-error a");
  await expect(codeLink).toHaveAttribute("href", "https://wingscrew.com/");
  await expect(codeLink).toHaveAttribute("rel", "noopener noreferrer");
  await codeLink.click();
  await expect(page.locator("#gate-title")).toBeVisible();
  await page.getByRole("button", { name: "Not now" }).click();

  await page.goto("./#/settings");
  await expect(page.getByRole("link", { name: "More from WingsCrew" })).toBeVisible();
  await unlinkedOn("settings");
  await page.goto("./#/how");
  await unlinkedOn("how buying works");

  await page.setViewportSize({ width: 1180, height: 820 });
  await page.goto("./");
  await expect(credit).toBeVisible();
  await expect(more).toBeVisible();
  const wideHeader = page.locator("header.top");
  expect(await wideHeader.evaluate((el) => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1);
  expect((await credit.boundingBox()).height).toBeGreaterThanOrEqual(44);
  expect((await more.boundingBox()).height).toBeGreaterThanOrEqual(44);

  await page.setViewportSize({ width: 390, height: 844 });
  await expect(credit).toBeVisible();
  await expect(more).toBeVisible();
  const narrowHeader = page.locator("header.top");
  expect(await narrowHeader.evaluate((el) => el.scrollWidth - el.clientWidth)).toBeLessThanOrEqual(1);
  expect((await credit.boundingBox()).height).toBeGreaterThanOrEqual(44);
  expect((await more.boundingBox()).height).toBeGreaterThanOrEqual(44);
  expect((await footerStudio.boundingBox()).height).toBeGreaterThanOrEqual(44);
});

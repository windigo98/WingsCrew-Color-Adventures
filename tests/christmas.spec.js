import { test, expect } from "@playwright/test";
import path from "node:path";

const shotDir = "/opt/cursor/artifacts/christmas-after";

const CHRISTMAS = [
  ["santa-present", "Santa's Present", 34],
  ["reindeer-bell", "Reindeer Bell", 27],
  ["smiling-snowman", "Smiling Snowman", 34],
  ["christmas-tree", "Christmas Tree", 34],
  ["gingerbread-cottage", "Gingerbread Cottage", 34],
  ["penguin-present", "Penguin Present", 34],
];

const SHELF = [
  "Starter",
  "Christmas",
  "Ocean Wonders",
  "All Aboard",
  "Fantastical Creatures",
  "Mandalas & Patterns",
  "Lantern Gallery",
  "Halloween",
];

async function unlockAll(page) {
  await page.goto("./#/shop");
  await page.locator("input[name=code]").fill("WCCA-PASS-TEST-DEMO-6L1V");
  await page.getByRole("button", { name: "Unlock" }).click();
  await expect(page.getByText("All Future Packs is unlocked on this device.")).toBeVisible();
}

async function openPicture(page, id) {
  await page.goto("./#/play/" + id);
  await page.waitForFunction(
    (pictureId) =>
      window.__WCCA &&
      window.__WCCA.board &&
      window.__WCCA.board.picture &&
      window.__WCCA.board.picture.id === pictureId &&
      window.__WCCA.board.cssW > 100,
    id
  );
}

test("christmas line art is little-kid coloring and the shelf leads with it", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "tablet-chromium", "christmas walkthrough runs once");

  await page.goto("./");
  await expect(page.locator("footer p").first()).toHaveText("© 2026 WingsCrew. All rights reserved.");
  const sw = await page.request.get("./sw.js");
  expect(await sw.text()).toContain('const CACHE = "wcca-v6"');

  await unlockAll(page);
  await page.goto("./");
  await expect(page.locator("section.shelf h2")).toHaveText(SHELF);
  await expect(page.locator("a.pic-card", { hasText: "Santa's Present" })).toBeVisible();
  await expect(page.locator("a.pic-card", { hasText: "Jolly Tree" })).toHaveCount(0);
  await page.screenshot({ path: path.join(shotDir, "shelf.png"), fullPage: true });

  for (const [id, title, regions] of CHRISTMAS) {
    await openPicture(page, id);
    const stats = await page.evaluate(() => {
      const board = window.__WCCA.board;
      const fonts = board.regions.map((region) => board.fontPxFor(region)).sort((a, b) => a - b);
      return {
        id: board.picture.id,
        title: board.picture.title,
        tier: board.picture.tier,
        regions: board.regions.length,
        ink: Boolean(board.inkPath),
        medianFont: fonts[fonts.length >> 1],
      };
    });
    expect(stats.id).toBe(id);
    expect(stats.title).toBe(title);
    expect(stats.tier).toBe("little");
    expect(stats.regions).toBe(regions);
    expect(stats.regions).toBeGreaterThanOrEqual(15);
    expect(stats.regions).toBeLessThanOrEqual(35);
    expect(stats.ink).toBe(true);
    expect(stats.medianFont).toBeGreaterThanOrEqual(10);
    await page.screenshot({ path: path.join(shotDir, id + "-numbered.png") });

    const canvas = page.locator("#board");
    const pen = await page.evaluate(() => {
      const board = window.__WCCA.board;
      const region = board.regions.find((r) => r.c === board.selected && !board.filled[r.i]);
      const sx = region.x * board.zoom + board.panX;
      const sy = region.y * board.zoom + board.panY;
      const rect = board.canvas.getBoundingClientRect();
      return { x: rect.left + sx, y: rect.top + sy, index: region.i, hit: board.hitTest(sx, sy) };
    });
    expect(pen.hit).toBe(pen.index);
    await canvas.dispatchEvent("pointerdown", {
      pointerType: "pen",
      pointerId: 7,
      clientX: pen.x,
      clientY: pen.y,
      pressure: 0.4,
      buttons: 1,
      isPrimary: true,
    });
    await canvas.dispatchEvent("pointerup", {
      pointerType: "pen",
      pointerId: 7,
      clientX: pen.x,
      clientY: pen.y,
      pressure: 0.4,
      buttons: 0,
    });
    expect(await page.evaluate(() => window.__WCCA.board.filledCount())).toBe(1);

    await page.evaluate(() => {
      const board = window.__WCCA.board;
      for (let i = 0; i < board.regions.length; i++) board.filled[i] = 1;
      board._paintCache();
      board._paintLines();
      board.draw();
    });
    await page.screenshot({ path: path.join(shotDir, id + "-filled.png") });
  }
});

test("replaced christmas pages clear stale coloring instead of crashing", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "tablet-chromium", "progress reset runs once");

  await page.goto("./");
  await page.evaluate(async () => {
    const open = indexedDB.open("wingscrew-color-adventures", 1);
    const db = await new Promise((resolve, reject) => {
      open.onsuccess = () => resolve(open.result);
      open.onerror = () => reject(open.error);
    });
    const tx = db.transaction("progress", "readwrite");
    const store = tx.objectStore("progress");
    store.put({ id: "jolly-tree", title: "Jolly Tree", filled: [0, 1, 2], total: 14, updatedAt: Date.now() });
    store.put({
      id: "smiling-snowman",
      title: "Smiling Snowman",
      tier: "little",
      pack: "christmas",
      filled: [0, 1, 2, 99],
      total: 13,
      updatedAt: Date.now(),
    });
    await new Promise((resolve, reject) => {
      tx.oncomplete = resolve;
      tx.onerror = () => reject(tx.error);
    });
  });

  await page.reload();
  await expect(page.locator("h1")).toHaveText("WingsCrew Color Adventures");
  await expect(page.getByRole("link", { name: /Jolly Tree/ })).toHaveCount(0);

  await page.goto("./#/play/jolly-tree");
  await expect(page.getByRole("heading", { name: "Something snagged." })).toBeVisible();
  await expect(page.getByText("That page was replaced. Its saved coloring was cleared.")).toBeVisible();

  await unlockAll(page);
  await page.goto("./#/play/smiling-snowman");
  await page.waitForFunction(
    () => window.__WCCA && window.__WCCA.board && window.__WCCA.board.picture && window.__WCCA.board.picture.id === "smiling-snowman"
  );
  expect(await page.evaluate(() => window.__WCCA.board.filledCount())).toBe(0);
});

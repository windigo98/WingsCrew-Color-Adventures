import { test, expect } from "@playwright/test";
import path from "node:path";

const shotDir = "/opt/cursor/artifacts/quill";

const QUILL = [
  ["dragon-phoenix", "Dragon and Phoenix", 894, true],
  ["forest-hollow", "Forest Hollow", 948, false],
  ["turtle-tide", "Turtle Tide", 840, true],
  ["butterfly-garden", "Butterfly Garden", 866, true],
  ["floating-castle", "Floating Castle", 1094, false],
  ["winter-cabin", "Winter Cabin", 1008, false],
  ["sun-and-moon", "Sun and Moon", 335, false],
  ["feathered-wings", "Feathered Wings", 437, false],
];

async function unlock(page, code) {
  await page.goto("./#/shop");
  await page.locator("input[name=code]").fill(code);
  await page.getByRole("button", { name: "Unlock" }).click();
}

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

test("quill scrolls stay paid, then color with the hand-inked lines", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "tablet-chromium", "quill walkthrough runs once");

  await page.goto("./");
  await expect(page.locator("footer p").first()).toHaveText("© 2026 WingsCrew. All rights reserved.");
  await expect(page.getByRole("heading", { name: "Quill Scrolls" })).toBeVisible();
  await expect(page.locator("a.pic-card.locked", { hasText: "Dragon and Phoenix" })).toBeVisible();
  await expect(page.locator("a.pic-card", { hasText: "Sunny Dragon" })).not.toHaveClass(/locked/);

  await unlock(page, "WCCA-FULL-TEST-DEMO-4K7Q");
  await expect(page.getByText("Full Unlock is unlocked on this device.")).toBeVisible();
  await page.goto("./");
  await expect(page.locator("a.pic-card.locked", { hasText: "Dragon and Phoenix" })).toBeVisible();
  await expect(page.locator("a.pic-card", { hasText: "Baby Phoenix" })).not.toHaveClass(/locked/);

  await unlock(page, "WCCA-QUIL-TEST-DEMO-8Q2S");
  await expect(page.getByText("Quill Scrolls is unlocked on this device.")).toBeVisible();

  for (const [id, title, regions] of QUILL) {
    await openPicture(page, id);
    const stats = await page.evaluate(() => {
      const board = window.__WCCA.board;
      return {
        id: board.picture.id,
        title: board.picture.title,
        tier: board.picture.tier,
        regions: board.regions.length,
        ink: Boolean(board.inkPath),
        colors: board.picture.palette.length,
        wide: board.worldW,
        tall: board.worldH,
      };
    });
    expect(stats.id).toBe(id);
    expect(stats.title).toBe(title);
    expect(stats.tier).toBe("adult");
    expect(stats.regions).toBe(regions);
    expect(stats.ink).toBe(true);
    expect(stats.colors).toBeGreaterThanOrEqual(8);
    expect(stats.tall).toBeGreaterThan(stats.wide);

    const pen = await page.evaluate(() => {
      const board = window.__WCCA.board;
      const region = board.regions.find((r) => r.c === board.selected && !board.filled[r.i]);
      const sx = region.x * board.zoom + board.panX;
      const sy = region.y * board.zoom + board.panY;
      const rect = board.canvas.getBoundingClientRect();
      return { x: rect.left + sx, y: rect.top + sy, index: region.i, hit: board.hitTest(sx, sy) };
    });
    expect(pen.hit).toBe(pen.index);
    const canvas = page.locator("#board");
    await canvas.dispatchEvent("pointerdown", {
      pointerType: "pen",
      pointerId: 7,
      clientX: pen.x,
      clientY: pen.y,
      pressure: 0.5,
      buttons: 1,
      isPrimary: true,
    });
    await canvas.dispatchEvent("pointerup", {
      pointerType: "pen",
      pointerId: 7,
      clientX: pen.x,
      clientY: pen.y,
      pressure: 0.5,
      buttons: 0,
    });
    expect(await page.evaluate(() => window.__WCCA.board.filledCount())).toBe(1);
  }

  for (const [id] of QUILL.filter((row) => row[3])) {
    await openPicture(page, id);
    await page.evaluate(() => {
      const board = window.__WCCA.board;
      board.zoom = board.fitZoom * 2.4;
      board.panX = board.cssW / 2 - (board.worldW * 0.42) * board.zoom;
      board.panY = board.cssH / 2 - (board.worldH * 0.4) * board.zoom;
      board.clampPan();
      board.draw();
    });
    await page.screenshot({ path: path.join(shotDir, id + "-numbered.png") });
    await page.evaluate(() => {
      const board = window.__WCCA.board;
      board.fit();
      let painted = 0;
      const goal = Math.round(board.regions.length * 0.42);
      for (const region of board.regions) {
        if (painted >= goal) break;
        if (region.c % 4 === 0) continue;
        board.filled[region.i] = 1;
        painted++;
      }
      board._paintCache();
      board._paintLines();
      board.draw();
    });
    await page.screenshot({ path: path.join(shotDir, id + "-partial.png") });
  }
});

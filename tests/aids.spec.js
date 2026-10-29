import { test, expect } from "@playwright/test";
import {
  LOUPE_PAN_SLOP,
  effectiveReduceMotion,
  isIosDevice,
  isRunningStandalone,
  isSafariBrowser,
  loupeOffset,
  nextRegion,
  numberStyle,
  patternId,
  requestPersistentStorage,
  shouldShowIosHomeHint,
} from "../js/aids.js";

const regions = [
  { i: 0, c: 1 },
  { i: 1, c: 2 },
  { i: 2, c: 1 },
  { i: 3, c: 1 },
];

test("storage hint and persistent-storage helper", async () => {
  const ipad = { userAgent: "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 Version/17.0 Mobile/15E148 Safari/604.1", platform: "iPad", maxTouchPoints: 5 };
  expect(isIosDevice(ipad)).toBe(true);
  expect(isSafariBrowser(ipad.userAgent)).toBe(true);
  expect(isIosDevice({ userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/17.0 Safari/605.1.15", platform: "MacIntel", maxTouchPoints: 5 })).toBe(true);
  expect(isIosDevice({ userAgent: "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 Version/17.0 Safari/605.1.15", platform: "MacIntel", maxTouchPoints: 0 })).toBe(false);
  const chromeIpad = "Mozilla/5.0 (iPad; CPU OS 17_0 like Mac OS X) AppleWebKit/605.1.15 CriOS/120.0.0.0 Mobile/15E148 Safari/604.1";
  expect(isSafariBrowser(chromeIpad)).toBe(false);
  expect(isRunningStandalone({ standalone: true }, false)).toBe(true);
  expect(isRunningStandalone({}, true)).toBe(true);
  expect(shouldShowIosHomeHint({ ios: true, safari: true, standalone: false, dismissed: false })).toBe(true);
  expect(shouldShowIosHomeHint({ ios: true, safari: true, standalone: true, dismissed: false })).toBe(false);
  expect(shouldShowIosHomeHint({ ios: true, safari: false, standalone: false, dismissed: false })).toBe(false);
  expect(shouldShowIosHomeHint({ ios: true, safari: true, standalone: false, dismissed: true })).toBe(false);
  expect(shouldShowIosHomeHint({ ios: false, safari: true, standalone: false, dismissed: false })).toBe(false);

  let calls = 0;
  await expect(requestPersistentStorage(undefined)).resolves.toBe(false);
  await expect(requestPersistentStorage({})).resolves.toBe(false);
  await expect(requestPersistentStorage({
    persist: () => {
      calls += 1;
      return Promise.resolve(true);
    },
  })).resolves.toBe(true);
  expect(calls).toBe(1);
  await expect(requestPersistentStorage({ persist: () => Promise.reject(new Error("nope")) })).resolves.toBe(false);
});

test("find next stays on the selected number", () => {
  const filled = [0, 0, 0, 0];
  const first = nextRegion(regions, filled, 1, -1, true);
  expect(first.region.i).toBe(0);
  expect(first.cursor).toBe(0);
  const second = nextRegion(regions, filled, 1, first.cursor, true);
  expect(second.region.i).toBe(2);
  const third = nextRegion(regions, filled, 1, second.cursor, true);
  expect(third.region.i).toBe(3);
  const wrap = nextRegion(regions, filled, 1, third.cursor, true);
  expect(wrap.region.i).toBe(0);

  filled[0] = 1;
  filled[2] = 1;
  filled[3] = 1;
  expect(nextRegion(regions, filled, 1, -1, true).region).toBe(null);
  const fallback = nextRegion(regions, filled, 1, -1, false);
  expect(fallback.region.i).toBe(1);
  expect(LOUPE_PAN_SLOP).toBeGreaterThan(9);
});

test("easier-to-see choices", () => {
  expect(patternId(0)).toBe(0);
  expect(patternId(12)).toBe(0);
  expect(patternId(-1)).toBe(11);
  expect(effectiveReduceMotion("auto", true)).toBe(true);
  expect(effectiveReduceMotion("auto", false)).toBe(false);
  expect(effectiveReduceMotion("on", false)).toBe(true);
  expect(effectiveReduceMotion("off", true)).toBe(false);
  const normal = numberStyle(1, false);
  const big = numberStyle(1, true);
  expect(normal).toEqual({ scale: 1, cap: 44, minPx: 10 });
  expect(big.scale).toBeGreaterThan(normal.scale);
  expect(big.cap).toBeGreaterThan(normal.cap);
  expect(big.minPx).toBeLessThan(normal.minPx);
  expect(numberStyle(0, false).scale).toBe(1);
  const above = loupeOffset(200, 40, 800, 600, 140, 18);
  expect(above.top).toBeGreaterThan(40);
  const below = loupeOffset(20, 400, 800, 600, 140, 18);
  expect(below.left).toBeGreaterThanOrEqual(8);
  expect(below.top).toBeLessThan(400);
});

test("home hint, backup gate, magnifier, and easier seeing", async ({ page }, testInfo) => {
  test.skip(testInfo.project.name !== "tablet-chromium", "feature walkthrough runs once");

  await page.addInitScript(() => {
    window.__WCCA_FORCE_IOS_HINT = true;
    window.__persistCalls = 0;
    const persist = () => {
      window.__persistCalls += 1;
      return Promise.resolve(true);
    };
    const install = () => {
      try {
        if (navigator.storage) navigator.storage.persist = persist;
        else Object.defineProperty(navigator, "storage", { configurable: true, value: { persist } });
      } catch (err) {
        window.__persistError = String(err);
      }
    };
    install();
  });
  await page.emulateMedia({ reducedMotion: "reduce" });
  await page.goto("./");
  await expect.poll(() => page.evaluate(() => window.__persistCalls || 0)).toBeGreaterThan(0);
  await expect(page.getByRole("heading", { name: "Add WingsCrew Colors to your Home Screen" })).toBeVisible();
  await expect(page.locator("footer")).toContainText("© 2026 WingsCrew. All rights reserved.");
  await page.getByRole("button", { name: "Not now" }).click();
  await expect(page.locator("#ios-home-hint")).toHaveCount(0);
  await page.reload();
  await expect(page.locator("#ios-home-hint")).toHaveCount(0);

  const kept = await page.evaluate(async () => {
    let calls = 0;
    const ok = await window.__WCCA.requestPersistentStorage({
      persist: () => {
        calls += 1;
        return Promise.resolve(true);
      },
    });
    return { calls, ok };
  });
  expect(kept).toEqual({ calls: 1, ok: true });

  await page.getByRole("link", { name: "Settings" }).click();
  await expect(page.locator("html")).toHaveClass(/reduce-motion/);
  const motion = page.getByRole("checkbox", { name: "Reduce motion" });
  await expect(motion).toBeChecked();
  await motion.uncheck();
  await expect(page.locator("html")).not.toHaveClass(/reduce-motion/);
  await page.getByRole("checkbox", { name: "Color names on the paint pots" }).check();
  await page.getByRole("checkbox", { name: "Patterns on colors" }).check();
  await page.getByRole("checkbox", { name: "Big numbers" }).check();

  await page.evaluate(() => {
    location.hash = "#/play/sunny-dragon";
  });
  await page.waitForFunction(() => window.__WCCA && window.__WCCA.board && window.__WCCA.board.frameTimes.length > 0);
  await expect(page.getByRole("button", { name: "Magnifier" })).toHaveCount(0);
  await expect(page.getByRole("button", { name: "Find next" })).toHaveCount(0);
  await expect(page.locator(".swatch", { hasText: "Sky" })).toBeVisible();
  await expect(page.locator(".swatch .chip.pat").first()).toBeVisible();
  const sizes = await page.evaluate(() => {
    const board = window.__WCCA.board;
    const region = board.regions[0];
    const big = board.fontPxFor(region);
    board.bigNumbers = false;
    const small = board.fontPxFor(region);
    board.bigNumbers = true;
    const open = board.regions.find((item) => !board.filled[item.i]) || region;
    const patch = () => {
      const cache = board.cache;
      const x = Math.max(0, Math.round((open.x / 1000) * cache.width) - 12);
      const y = Math.max(0, Math.round((open.y / 1000) * cache.height) - 12);
      return cache.getContext("2d").getImageData(x, y, 24, 24).data;
    };
    board.patterns = false;
    board._paintCache();
    const plain = patch();
    board.patterns = true;
    board._paintCache();
    const marked = patch();
    let ink = 0;
    for (let i = 0; i < plain.length; i += 4) {
      if (plain[i] !== marked[i] || plain[i + 1] !== marked[i + 1] || plain[i + 2] !== marked[i + 2]) ink += 1;
    }
    return { big, small, patterns: board.patterns, ink };
  });
  expect(sizes.big).toBeGreaterThan(sizes.small);
  expect(sizes.patterns).toBe(true);
  expect(sizes.ink).toBeGreaterThan(0);

  await page.evaluate(() => {
    location.hash = "#/play/garden-mandala";
  });
  await page.waitForFunction(() => window.__WCCA.board && window.__WCCA.board.picture && window.__WCCA.board.picture.id === "garden-mandala" && window.__WCCA.board.frameTimes.length > 0);
  const find = page.getByRole("button", { name: "Find next" });
  await find.click();
  const placed = await page.evaluate(() => {
    const board = window.__WCCA.board;
    const region = board.regions[window.__WCCA.lastNext];
    const cx = ((region.bb.x0 + region.bb.x1) / 2) * board.zoom + board.panX;
    const cy = ((region.bb.y0 + region.bb.y1) / 2) * board.zoom + board.panY;
    return {
      i: region.i,
      color: region.c,
      selected: board.selected,
      filled: board.filled[region.i],
      distance: Math.hypot(cx - board.cssW / 2, cy - board.cssH / 2),
    };
  });
  expect(placed.color).toBe(placed.selected);
  expect(placed.filled).toBe(0);
  expect(placed.distance).toBeLessThan(120);
  await find.click();
  const nextId = await page.evaluate(() => window.__WCCA.lastNext);
  expect(nextId).not.toBe(placed.i);

  await page.evaluate(() => {
    const board = window.__WCCA.board;
    for (const region of board.regions) if (region.c === board.selected) board.filled[region.i] = 1;
  });
  await find.click();
  await expect(page.locator("#play-hint")).toContainText("That color is all filled");
  expect(await page.evaluate(() => window.__WCCA.lastNext)).toBe(-1);

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
  await page.getByRole("button", { name: "Magnifier" }).click();
  await expect(page.locator("#loupe")).toBeHidden();

  await page.evaluate(() => {
    location.hash = "#/";
  });
  await page.getByRole("link", { name: "Settings" }).click();
  const adultDownload = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export backup" }).click();
  await expect(page.locator("#gate-title")).toHaveCount(0);
  expect((await adultDownload).suggestedFilename()).toContain("wingscrew-backup");

  await page.getByRole("link", { name: "Home" }).click();
  await page.getByRole("tab", { name: "Little Kids" }).click();
  await page.getByRole("link", { name: "Settings" }).click();
  let downloaded = false;
  page.on("download", () => {
    downloaded = true;
  });
  await page.getByRole("button", { name: "Export backup" }).click();
  await expect(page.locator("#gate-title")).toBeVisible();
  await page.getByRole("button", { name: "Not now" }).click();
  expect(downloaded).toBe(false);

  const downloadPromise = page.waitForEvent("download");
  await page.getByRole("button", { name: "Export backup" }).click();
  const question = await page.locator(".modal p").nth(1).textContent();
  const match = question.match(/(\d+) \+ (\d+)/);
  await page.locator("#gate-answer").fill(String(Number(match[1]) + Number(match[2])));
  await page.locator("#gate-form button[type=submit]").click();
  const download = await downloadPromise;
  expect(download.suggestedFilename()).toContain("wingscrew-backup");

  const backup = {
    app: "wingscrew-color-adventures",
    version: 1,
    progress: [{ id: "sunny-dragon", title: "Sunny Dragon", filled: [0], total: 24 }],
    photos: [],
    codes: [],
    settings: { sound: false },
  };
  await page.locator("#restore-file").setInputFiles({
    name: "wingscrew-backup-test.wingscrew.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(backup)),
  });
  await expect(page.locator("#gate-title")).toBeVisible();
  await page.getByRole("button", { name: "Not now" }).click();
  await expect(page.locator("#restore-msg")).toHaveText("");

  await page.locator("#restore-file").setInputFiles({
    name: "wingscrew-backup-test.wingscrew.json",
    mimeType: "application/json",
    buffer: Buffer.from(JSON.stringify(backup)),
  });
  const restoreQuestion = await page.locator(".modal p").nth(1).textContent();
  const restoreMatch = restoreQuestion.match(/(\d+) \+ (\d+)/);
  await page.locator("#gate-answer").fill(String(Number(restoreMatch[1]) + Number(restoreMatch[2])));
  await page.locator("#gate-form button[type=submit]").click();
  await expect(page.locator("#restore-msg")).toContainText("Restored 1 page");
});

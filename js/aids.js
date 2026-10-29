/** Small helpers for storage safety, Find next, and easier-to-see settings. No network. */

export const PATTERN_COUNT = 12;
export const LOUPE_PAN_SLOP = 22;

export function isIosDevice(nav) {
  if (!nav) return false;
  const ua = String(nav.userAgent || "");
  if (/iPad|iPhone|iPod/.test(ua)) return true;
  return nav.platform === "MacIntel" && (nav.maxTouchPoints || 0) > 1;
}

export function isSafariBrowser(userAgent) {
  const ua = String(userAgent || "");
  if (!/Safari/i.test(ua)) return false;
  if (/CriOS|FxiOS|EdgiOS|OPiOS|Chrome|Chromium|Android|OPR|Edg\//i.test(ua)) return false;
  return true;
}

export function isRunningStandalone(nav, displayModeStandalone) {
  if (nav && nav.standalone === true) return true;
  return !!displayModeStandalone;
}

/** iOS Safari drops storage for sites that were never added to the Home Screen. */
export function shouldShowIosHomeHint({ ios, safari, standalone, dismissed }) {
  return !!(ios && safari && !standalone && !dismissed);
}

export function requestPersistentStorage(storage) {
  if (!storage || typeof storage.persist !== "function") return Promise.resolve(false);
  try {
    return Promise.resolve(storage.persist())
      .then((ok) => ok === true)
      .catch(() => false);
  } catch {
    return Promise.resolve(false);
  }
}

/**
 * Next open region. Adults pass onlySelected so Find next stays on the chosen number.
 * Kids Next falls back to any open region when that number is finished.
 */
export function nextRegion(regions, filled, selected, cursor, onlySelected) {
  const preferred = [];
  const rest = [];
  for (let n = 0; n < regions.length; n++) {
    const region = regions[n];
    const index = region.i ?? n;
    if (filled[index]) continue;
    if (region.c === selected) preferred.push(region);
    else rest.push(region);
  }
  const pool = preferred.length ? preferred : onlySelected ? [] : rest;
  if (!pool.length) return { region: null, cursor: -1 };
  const next = cursor >= 0 ? (cursor + 1) % pool.length : 0;
  return { region: pool[next], cursor: next };
}

export function patternId(colorIndex) {
  const n = Number(colorIndex) || 0;
  return ((n % PATTERN_COUNT) + PATTERN_COUNT) % PATTERN_COUNT;
}

export function effectiveReduceMotion(setting, systemPrefers) {
  if (setting === "on" || setting === true) return true;
  if (setting === "off" || setting === false) return false;
  return !!systemPrefers;
}

export function numberStyle(numberScale, bigNumbers) {
  const parsed = Number(numberScale);
  const base = Number.isFinite(parsed) && parsed > 0 ? parsed : 1;
  const big = !!bigNumbers;
  return {
    scale: base * (big ? 1.7 : 1),
    cap: big ? 72 : 44,
    minPx: big ? 8 : 10 * base,
  };
}

/** Place the loupe so it sits off the finger and stays inside the stage. */
export function loupeOffset(x, y, width, height, size = 132, gap = 20) {
  const margin = 8;
  let left = x - size / 2;
  let top = y - size - gap;
  if (top < margin) top = y + gap;
  const maxLeft = Math.max(margin, width - size - margin);
  const maxTop = Math.max(margin, height - size - margin);
  left = Math.min(maxLeft, Math.max(margin, left));
  top = Math.min(maxTop, Math.max(margin, top));
  return { left, top };
}

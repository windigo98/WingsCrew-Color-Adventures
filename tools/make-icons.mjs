/**
 * Build the maskable home-screen icon from the official WingsCrew feather.
 *
 * icons/logo.png, icon-192.png, icon-512.png, apple-touch-icon.png, and the
 * favicons are the official files from windigo98/WingsCrew assets/brand/.
 * This script does not redraw them. It only writes icons/icon-maskable.png:
 * the same dark ground as icon-512.png, with the feather scaled so every
 * opaque pixel sits inside the maskable safe circle (diameter 80% of the icon).
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const icons = path.join(root, "icons");
const SIZE = 512;
// Safe circle radius is 40% of the icon. Stay a little inside so the tips
// are not shaved by a circular or squircle mask.
const SAFE_RADIUS = SIZE * 0.36;

const logo = PNG.sync.read(fs.readFileSync(path.join(icons, "logo.png")));
const anyIcon = PNG.sync.read(fs.readFileSync(path.join(icons, "icon-512.png")));
const bg = [anyIcon.data[0], anyIcon.data[1], anyIcon.data[2]];

let minX = logo.width;
let minY = logo.height;
let maxX = -1;
let maxY = -1;
for (let y = 0; y < logo.height; y++) {
  for (let x = 0; x < logo.width; x++) {
    const a = logo.data[(y * logo.width + x) * 4 + 3];
    if (a < 12) continue;
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
}
if (maxX < 0) throw new Error("icons/logo.png has no opaque pixels.");

const cx = (minX + maxX) / 2;
const cy = (minY + maxY) / 2;
let maxDist = 0;
for (let y = minY; y <= maxY; y++) {
  for (let x = minX; x <= maxX; x++) {
    const a = logo.data[(y * logo.width + x) * 4 + 3];
    if (a < 12) continue;
    const d = Math.hypot(x - cx, y - cy);
    if (d > maxDist) maxDist = d;
  }
}
const scale = SAFE_RADIUS / maxDist;

function sample(x, y) {
  if (x < 0 || y < 0 || x > logo.width - 1 || y > logo.height - 1) return [0, 0, 0, 0];
  const x0 = Math.floor(x);
  const y0 = Math.floor(y);
  const x1 = Math.min(logo.width - 1, x0 + 1);
  const y1 = Math.min(logo.height - 1, y0 + 1);
  const tx = x - x0;
  const ty = y - y0;
  const at = (px, py) => {
    const i = (py * logo.width + px) * 4;
    return [logo.data[i], logo.data[i + 1], logo.data[i + 2], logo.data[i + 3]];
  };
  const a = at(x0, y0);
  const b = at(x1, y0);
  const c = at(x0, y1);
  const d = at(x1, y1);
  const out = [0, 0, 0, 0];
  for (let i = 0; i < 4; i++) {
    const top = a[i] * (1 - tx) + b[i] * tx;
    const bot = c[i] * (1 - tx) + d[i] * tx;
    out[i] = top * (1 - ty) + bot * ty;
  }
  return out;
}

const out = new PNG({ width: SIZE, height: SIZE });
const mid = (SIZE - 1) / 2;
for (let y = 0; y < SIZE; y++) {
  for (let x = 0; x < SIZE; x++) {
    const sx = cx + (x - mid) / scale;
    const sy = cy + (y - mid) / scale;
    const [r, g, b, a] = sample(sx, sy);
    const alpha = a / 255;
    const i = (y * SIZE + x) * 4;
    out.data[i] = Math.round(r * alpha + bg[0] * (1 - alpha));
    out.data[i + 1] = Math.round(g * alpha + bg[1] * (1 - alpha));
    out.data[i + 2] = Math.round(b * alpha + bg[2] * (1 - alpha));
    out.data[i + 3] = 255;
  }
}

let painted = 0;
let farthest = 0;
for (let y = 0; y < SIZE; y++) {
  for (let x = 0; x < SIZE; x++) {
    const i = (y * SIZE + x) * 4;
    const diff = Math.abs(out.data[i] - bg[0]) + Math.abs(out.data[i + 1] - bg[1]) + Math.abs(out.data[i + 2] - bg[2]);
    if (diff < 24) continue;
    painted++;
    const d = Math.hypot(x - mid, y - mid);
    if (d > farthest) farthest = d;
  }
}
const safe = SIZE * 0.4;
if (farthest > safe) {
  throw new Error(`Maskable feather reaches ${farthest.toFixed(1)}px from center; safe radius is ${safe}.`);
}
if (!painted) throw new Error("Maskable icon is empty.");

const file = path.join(icons, "icon-maskable.png");
fs.writeFileSync(file, PNG.sync.write(out));
console.log(
  `wrote icon-maskable.png ${SIZE}px, feather radius ${farthest.toFixed(1)} / safe ${safe} (${painted} ink pixels)`
);

/**
 * Quill Scrolls: eight hand-inked adults pages.
 * Regions come from the approved grayscale drawings. Suggested colors are
 * placed by where each region sits on the page.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";
import { vectorizeLabels } from "../../js/vectorize.js";
import { pointInLoops, polylabel } from "../../js/geom.js";
import { distancePoles } from "../lib/segment.mjs";
import { traceAdult, colorAt, polesOf } from "../lib/adult-lineart.mjs";
import { coverage } from "../lib/coverage.mjs";

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), "lineart/quill");
const swatch = (hex, name) => ({ hex, name });

function page(def) {
  return { pack: "quill", tier: "adult", rev: 1, close: 1, ...def };
}

const frame = (marginColor, colors, fallback, margin = 0.042, band = 0.118) => ({
  margin,
  band,
  marginColor,
  colors,
  fallback,
});

export const QUILL = [
  page({
    id: "dragon-phoenix",
    title: "Dragon and Phoenix",
    file: "dragon-phoenix.png",
    thresh: 160,
    minRadius: 4,
    palette: [
      swatch("#F6EBD7", "Parchment"),
      swatch("#FFF9F0", "Cloud"),
      swatch("#2F7A68", "Scale"),
      swatch("#1E5C52", "Deep scale"),
      swatch("#E2B657", "Gold"),
      swatch("#C9843A", "Horn"),
      swatch("#E25B3A", "Fire"),
      swatch("#F2A35A", "Ember"),
      swatch("#F3B7A8", "Blush"),
      swatch("#F7E2C4", "Wing"),
      swatch("#F6D35E", "Eye"),
      swatch("#C6A15B", "Frame gold"),
      swatch("#F4E6C8", "Frame cream"),
      swatch("#8C5A32", "Frame wood"),
      swatch("#FBF6EE", "Margin"),
    ],
    frame: frame(14, [11, 12, 13], 0),
    zones: [
      { cx: 0.28, cy: 0.32, rx: 0.14, ry: 0.12, colors: [9, 1] },
      { cx: 0.72, cy: 0.68, rx: 0.16, ry: 0.18, colors: [8, 9, 7] },
      { cx: 0.36, cy: 0.4, rx: 0.035, ry: 0.028, colors: [10] },
      { cx: 0.7, cy: 0.3, rx: 0.03, ry: 0.025, colors: [10] },
      { cx: 0.4, cy: 0.58, rx: 0.1, ry: 0.08, colors: [9, 1] },
      { cx: 0.34, cy: 0.62, rx: 0.22, ry: 0.28, colors: [2, 3, 4] },
      { cx: 0.46, cy: 0.7, rx: 0.12, ry: 0.1, colors: [5, 2] },
      { cx: 0.68, cy: 0.36, rx: 0.16, ry: 0.18, colors: [6, 7, 8] },
      { cx: 0.74, cy: 0.24, rx: 0.14, ry: 0.12, colors: [8, 9, 7] },
      { cx: 0.52, cy: 0.46, rx: 0.07, ry: 0.05, colors: [6, 4] },
    ],
  }),
  page({
    id: "forest-hollow",
    title: "Forest Hollow",
    file: "forest.png",
    thresh: 150,
    minRadius: 4,
    palette: [
      swatch("#D7EBF8", "Sky"),
      swatch("#3E8F4A", "Leaf"),
      swatch("#1E6A42", "Pine"),
      swatch("#A3C56E", "Moss"),
      swatch("#8A5A3A", "Trunk"),
      swatch("#F3E6C4", "Owl"),
      swatch("#C9843A", "Tawny"),
      swatch("#D2652E", "Fox"),
      swatch("#FFF6EE", "Chest"),
      swatch("#C44536", "Cap"),
      swatch("#F6E7D4", "Spot"),
      swatch("#C4A574", "Earth"),
      swatch("#E989B0", "Blossom"),
      swatch("#A97848", "Frame"),
      swatch("#F4E6C8", "Frame cream"),
      swatch("#F7FBFF", "Margin"),
    ],
    frame: frame(15, [13, 14, 4], 0),
    zones: [
      { cx: 0.4, cy: 0.3, rx: 0.1, ry: 0.09, colors: [5, 6] },
      { cx: 0.36, cy: 0.28, rx: 0.025, ry: 0.02, colors: [10] },
      { cx: 0.5, cy: 0.64, rx: 0.12, ry: 0.1, colors: [7, 8] },
      { cx: 0.32, cy: 0.74, rx: 0.06, ry: 0.05, colors: [9, 10] },
      { cx: 0.62, cy: 0.76, rx: 0.06, ry: 0.05, colors: [9, 10] },
      { cx: 0.16, cy: 0.48, rx: 0.1, ry: 0.28, colors: [4, 5] },
      { cx: 0.84, cy: 0.42, rx: 0.1, ry: 0.24, colors: [4, 5] },
      { cx: 0.28, cy: 0.42, rx: 0.07, ry: 0.18, colors: [4] },
      { cx: 0.55, cy: 0.24, rx: 0.1, ry: 0.06, colors: [12, 1] },
      { cx: 0.5, cy: 0.46, rx: 0.26, ry: 0.2, colors: [1, 2, 3] },
      { cx: 0.5, cy: 0.84, rx: 0.36, ry: 0.1, colors: [11, 3] },
    ],
  }),
  page({
    id: "turtle-tide",
    title: "Turtle Tide",
    file: "ocean.png",
    thresh: 200,
    minRadius: 2,
    spark: { max: 18, from: 0, to: 2 },
    palette: [
      swatch("#8FD0E8", "Water"),
      swatch("#2E86AB", "Deep"),
      swatch("#E7F7FB", "Foam"),
      swatch("#3E9B74", "Turtle"),
      swatch("#E2B657", "Shell"),
      swatch("#C48A3A", "Shell shade"),
      swatch("#F6E2C4", "Belly"),
      swatch("#E7B6E2", "Jelly"),
      swatch("#F7C4D8", "Bell"),
      swatch("#F08A2A", "Fish"),
      swatch("#4C8DDB", "Blue fish"),
      swatch("#E25B6A", "Coral"),
      swatch("#E7C15A", "Coral gold"),
      swatch("#2F8F5A", "Kelp"),
      swatch("#E8D2A8", "Sand"),
      swatch("#2F6F8F", "Frame"),
      swatch("#F4EBD4", "Frame cream"),
      swatch("#F3FBFE", "Margin"),
    ],
    frame: frame(17, [15, 16, 1], 0),
    zones: [
      { cx: 0.5, cy: 0.32, rx: 0.1, ry: 0.08, colors: [7, 8, 2] },
      { cx: 0.5, cy: 0.2, rx: 0.14, ry: 0.1, colors: [7, 8, 2] },
      { cx: 0.74, cy: 0.28, rx: 0.08, ry: 0.07, colors: [8, 7] },
      { cx: 0.22, cy: 0.4, rx: 0.07, ry: 0.05, colors: [10, 9] },
      { cx: 0.78, cy: 0.5, rx: 0.07, ry: 0.05, colors: [9, 10] },
      { cx: 0.36, cy: 0.48, rx: 0.1, ry: 0.08, colors: [3, 6] },
      { cx: 0.56, cy: 0.52, rx: 0.12, ry: 0.09, colors: [4, 5] },
      { cx: 0.48, cy: 0.56, rx: 0.2, ry: 0.14, colors: [3, 6, 4] },
      { cx: 0.5, cy: 0.9, rx: 0.4, ry: 0.06, colors: [14] },
      { cx: 0.5, cy: 0.8, rx: 0.38, ry: 0.12, colors: [11, 12, 13] },
    ],
  }),
  page({
    id: "butterfly-garden",
    title: "Butterfly Garden",
    file: "butterflies.png",
    thresh: 170,
    minRadius: 2,
    palette: [
      swatch("#EAF1FF", "Sky"),
      swatch("#7A6BB8", "Violet"),
      swatch("#4C8DDB", "Blue"),
      swatch("#F4A4C4", "Blush"),
      swatch("#F2C14E", "Gold"),
      swatch("#FFF6E8", "Cream"),
      swatch("#3E9B5A", "Leaf"),
      swatch("#2C6B42", "Deep leaf"),
      swatch("#D4537E", "Rose"),
      swatch("#F2A3C2", "Peony"),
      swatch("#F6D77A", "Butter"),
      swatch("#FFFBF8", "Petal"),
      swatch("#C46B8A", "Frame"),
      swatch("#E2B657", "Frame gold"),
      swatch("#FFF8FB", "Margin"),
    ],
    frame: frame(14, [12, 13, 5], 0),
    zones: [
      { cx: 0.22, cy: 0.52, rx: 0.08, ry: 0.08, colors: [11, 8] },
      { cx: 0.8, cy: 0.5, rx: 0.08, ry: 0.07, colors: [11, 9] },
      { cx: 0.32, cy: 0.28, rx: 0.15, ry: 0.11, colors: [1, 2, 3, 4] },
      { cx: 0.68, cy: 0.3, rx: 0.15, ry: 0.11, colors: [2, 4, 3, 1] },
      { cx: 0.28, cy: 0.7, rx: 0.1, ry: 0.08, colors: [8, 11] },
      { cx: 0.55, cy: 0.68, rx: 0.12, ry: 0.1, colors: [9, 10, 11] },
      { cx: 0.72, cy: 0.66, rx: 0.1, ry: 0.08, colors: [10, 11, 8] },
      { cx: 0.5, cy: 0.78, rx: 0.3, ry: 0.14, colors: [8, 9, 6] },
      { cx: 0.5, cy: 0.58, rx: 0.26, ry: 0.14, colors: [6, 7] },
    ],
  }),
  page({
    id: "floating-castle",
    title: "Floating Castle",
    file: "castle.png",
    thresh: 150,
    minRadius: 3,
    palette: [
      swatch("#C5DFF5", "Sky"),
      swatch("#F7FBFF", "Cloud"),
      swatch("#E7D8C4", "Stone"),
      swatch("#C4B09A", "Shade"),
      swatch("#C45B4A", "Roof"),
      swatch("#4C6EAD", "Slate"),
      swatch("#E2B657", "Gold"),
      swatch("#6EAE5B", "Grass"),
      swatch("#A9896A", "Rock"),
      swatch("#D7F0F8", "Waterfall"),
      swatch("#2F8F4E", "Tree"),
      swatch("#F6D36A", "Window"),
      swatch("#8D6A45", "Frame"),
      swatch("#F6EBD8", "Frame cream"),
      swatch("#F4F8FC", "Margin"),
    ],
    frame: frame(14, [12, 13, 6], 0),
    zones: [
      { cx: 0.26, cy: 0.24, rx: 0.12, ry: 0.07, colors: [1] },
      { cx: 0.74, cy: 0.22, rx: 0.1, ry: 0.06, colors: [1] },
      { cx: 0.4, cy: 0.58, rx: 0.05, ry: 0.12, colors: [9] },
      { cx: 0.38, cy: 0.78, rx: 0.04, ry: 0.1, colors: [9] },
      { cx: 0.5, cy: 0.4, rx: 0.04, ry: 0.035, colors: [11] },
      { cx: 0.42, cy: 0.36, rx: 0.03, ry: 0.04, colors: [4] },
      { cx: 0.58, cy: 0.34, rx: 0.03, ry: 0.05, colors: [5] },
      { cx: 0.5, cy: 0.42, rx: 0.2, ry: 0.2, colors: [2, 3, 6] },
      { cx: 0.42, cy: 0.64, rx: 0.05, ry: 0.08, colors: [9] },
      { cx: 0.28, cy: 0.76, rx: 0.1, ry: 0.08, colors: [8, 7] },
      { cx: 0.72, cy: 0.78, rx: 0.1, ry: 0.08, colors: [7, 10] },
      { cx: 0.5, cy: 0.74, rx: 0.24, ry: 0.12, colors: [7, 8, 10] },
    ],
  }),
  page({
    id: "winter-cabin",
    title: "Winter Cabin",
    file: "winter.png",
    thresh: 160,
    minRadius: 3,
    palette: [
      swatch("#D7E7F6", "Sky"),
      swatch("#F8FBFF", "Snow"),
      swatch("#C5D5E6", "Shadow"),
      swatch("#A56B3A", "Wood"),
      swatch("#FFFBF8", "Roof"),
      swatch("#2F6B45", "Pine"),
      swatch("#E4EEF4", "Pine snow"),
      swatch("#C44536", "Berry"),
      swatch("#F6C14E", "Glow"),
      swatch("#E0C49A", "Path"),
      swatch("#9BB0C4", "Mountain"),
      swatch("#EEF3F7", "Smoke"),
      swatch("#7E93A8", "Frame"),
      swatch("#F4EFE6", "Frame cream"),
      swatch("#F7FAFC", "Margin"),
    ],
    frame: frame(14, [12, 13, 2], 0),
    zones: [
      { cx: 0.55, cy: 0.26, rx: 0.28, ry: 0.08, colors: [10, 2] },
      { cx: 0.52, cy: 0.36, rx: 0.04, ry: 0.06, colors: [11] },
      { cx: 0.52, cy: 0.44, rx: 0.14, ry: 0.05, colors: [4, 1] },
      { cx: 0.52, cy: 0.5, rx: 0.035, ry: 0.04, colors: [8] },
      { cx: 0.52, cy: 0.52, rx: 0.14, ry: 0.12, colors: [3, 4] },
      { cx: 0.52, cy: 0.48, rx: 0.04, ry: 0.035, colors: [7, 5] },
      { cx: 0.28, cy: 0.5, rx: 0.09, ry: 0.1, colors: [2, 1, 3] },
      { cx: 0.22, cy: 0.5, rx: 0.09, ry: 0.16, colors: [5, 6] },
      { cx: 0.78, cy: 0.58, rx: 0.08, ry: 0.12, colors: [5, 6] },
      { cx: 0.5, cy: 0.74, rx: 0.1, ry: 0.08, colors: [9] },
      { cx: 0.5, cy: 0.84, rx: 0.38, ry: 0.1, colors: [1, 2] },
    ],
  }),
  page({
    id: "sun-and-moon",
    title: "Sun and Moon",
    file: "celestial.png",
    thresh: 180,
    minRadius: 2,
    spark: { max: 26, from: 0, to: 2 },
    minCount: 250,
    shortfall:
      "The open night sky is one region the ink does not divide. Cutting it into cells would draw lines that are not in the picture.",
    palette: [
      swatch("#243156", "Night"),
      swatch("#161C33", "Deep night"),
      swatch("#F6E7B0", "Star"),
      swatch("#F2C14E", "Sun"),
      swatch("#F8D7A4", "Face"),
      swatch("#F08A2A", "Ray"),
      swatch("#F6E7C4", "Moon"),
      swatch("#C9D4E4", "Moon shade"),
      swatch("#C6B2E2", "Saturn"),
      swatch("#7EB6D9", "Band"),
      swatch("#E7A0B4", "Rose planet"),
      swatch("#8E7CC3", "Swirl"),
      swatch("#C6A15B", "Frame gold"),
      swatch("#3A4468", "Frame night"),
      swatch("#1A2038", "Margin"),
    ],
    frame: frame(14, [12, 13, 2], 0, 0.04, 0.12),
    zones: [
      { cx: 0.32, cy: 0.28, rx: 0.075, ry: 0.06, colors: [4, 3] },
      { cx: 0.32, cy: 0.28, rx: 0.2, ry: 0.16, colors: [5, 3, 4] },
      { cx: 0.68, cy: 0.68, rx: 0.12, ry: 0.14, colors: [6, 7] },
      { cx: 0.26, cy: 0.52, rx: 0.1, ry: 0.07, colors: [8, 9] },
      { cx: 0.74, cy: 0.3, rx: 0.08, ry: 0.06, colors: [9, 8] },
      { cx: 0.7, cy: 0.46, rx: 0.06, ry: 0.05, colors: [10, 9] },
      { cx: 0.28, cy: 0.76, rx: 0.08, ry: 0.07, colors: [10, 7] },
      { cx: 0.55, cy: 0.5, rx: 0.1, ry: 0.18, colors: [11, 8] },
    ],
  }),
  page({
    id: "feathered-wings",
    title: "Feathered Wings",
    file: "wings.png",
    thresh: 180,
    minRadius: 2,
    minCount: 250,
    shortfall:
      "Each feather is already its own region. The open field inside the frame is one region; dividing it would add lines the drawing does not have.",
    palette: [
      swatch("#F7F1E6", "Sky"),
      swatch("#F6E2C4", "Cream"),
      swatch("#E2B657", "Gold"),
      swatch("#F0C2B0", "Blush"),
      swatch("#C9843A", "Warm"),
      swatch("#8C6239", "Shadow"),
      swatch("#FFFBF8", "White"),
      swatch("#6E5344", "Quill"),
      swatch("#C6A15B", "Frame gold"),
      swatch("#F4E6C8", "Frame cream"),
      swatch("#8C5A32", "Frame wood"),
      swatch("#FBF7F1", "Margin"),
    ],
    frame: frame(11, [8, 9, 10], 0),
    zones: [
      { cx: 0.34, cy: 0.32, rx: 0.08, ry: 0.08, colors: [5, 7] },
      { cx: 0.66, cy: 0.32, rx: 0.08, ry: 0.08, colors: [7, 4] },
      { cx: 0.24, cy: 0.26, rx: 0.1, ry: 0.1, colors: [6, 1] },
      { cx: 0.76, cy: 0.26, rx: 0.1, ry: 0.1, colors: [2, 6] },
      { cx: 0.28, cy: 0.55, rx: 0.18, ry: 0.28, colors: [1, 2, 3, 6] },
      { cx: 0.72, cy: 0.55, rx: 0.18, ry: 0.28, colors: [2, 1, 4, 6] },
    ],
  }),
];

function sampleInside(loops, labels, regionId, w, h, viewW, viewH) {
  const sx = viewW / w;
  const sy = viewH / h;
  let best = null;
  let bestD = -1;
  for (let y = 0; y < h; y += 2) {
    for (let x = 0; x < w; x += 2) {
      if (labels[y * w + x] !== regionId) continue;
      const px = (x + 0.5) * sx;
      const py = (y + 0.5) * sy;
      if (!pointInLoops(px, py, loops)) continue;
      const d = Math.min(x, y, w - 1 - x, h - 1 - y);
      if (d > bestD) {
        bestD = d;
        best = { x: Math.round(px * 10) / 10, y: Math.round(py * 10) / 10 };
      }
    }
  }
  return best;
}

export function loadQuillPng(entry) {
  return PNG.sync.read(fs.readFileSync(path.join(dir, entry.file)));
}

export function paintQuill(entry, traced) {
  const poles = polesOf(traced.labels, traced.count, traced.w, traced.h);
  const colors = new Array(traced.count);
  for (let id = 0; id < traced.count; id++) {
    const nx = (poles.px[id] + 0.5) / traced.w;
    const ny = (poles.py[id] + 0.5) / traced.h;
    let c = colorAt(nx, ny, entry.zones, entry.frame);
    if (entry.spark && poles.radius[id] > 0 && poles.radius[id] <= entry.spark.max && c === entry.spark.from) {
      c = entry.spark.to;
    }
    colors[id] = c;
  }
  return colors;
}

export function vectorizeQuill(entry, traced, colors) {
  const viewH = 1000;
  const viewW = Math.round((viewH * traced.w * 10) / traced.h) / 10;
  const view = { w: viewW, h: viewH };
  const attempts = [0.95, 0.6, 0.35];
  let vec = null;
  let used = attempts[0];
  for (const eps of attempts) {
    vec = vectorizeLabels(traced.labels, traced.w, traced.h, view, eps);
    used = eps;
    if (vec.size === traced.count) break;
  }
  const poles = distancePoles(traced.labels, traced.w, traced.h, view);
  const regions = [];
  for (let id = 0; id < traced.count; id++) {
    const geom = vec.get(id);
    if (!geom) continue;
    let pt = poles.get(id);
    if (!pt || !pointInLoops(pt.x, pt.y, geom.loops)) {
      const fallback = polylabel(geom.loops);
      pt = { x: fallback.x, y: fallback.y };
      if (!pointInLoops(pt.x, pt.y, geom.loops)) {
        pt = sampleInside(geom.loops, traced.labels, id, traced.w, traced.h, viewW, viewH);
      }
    }
    if (!pt) continue;
    regions.push({ c: colors[id], d: geom.path, x: pt.x, y: pt.y, loops: geom.loops });
  }
  const inkLabels = new Int32Array(traced.w * traced.h);
  inkLabels.fill(-1);
  for (let i = 0; i < traced.ink.length; i++) if (traced.ink[i]) inkLabels[i] = 0;
  const inkVec = vectorizeLabels(inkLabels, traced.w, traced.h, view, Math.min(used, 1.15));
  const inkGeom = inkVec.get(0);
  const usedColors = [];
  const remap = new Map();
  for (const region of regions) {
    if (!remap.has(region.c)) {
      remap.set(region.c, usedColors.length);
      usedColors.push(entry.palette[region.c]);
    }
    region.c = remap.get(region.c);
  }
  const picture = {
    id: entry.id,
    title: entry.title,
    tier: entry.tier,
    rev: entry.rev,
    viewBox: [0, 0, viewW, viewH],
    palette: usedColors,
    ink: inkGeom ? inkGeom.path : "",
    regions: regions.map((region) => ({ c: region.c, d: region.d, x: region.x, y: region.y, loops: region.loops })),
  };
  if (regions.length < 800 && entry.shortfall) picture.note = entry.shortfall;
  const cov = coverage(picture.regions, 70, viewW, viewH);
  return { picture, eps: used, vecCount: vec.size, coverage: cov, inkPoints: inkGeom ? inkGeom.path.length : 0 };
}

export function buildQuill(entry, opt = {}) {
  const png = loadQuillPng(entry);
  const traced = traceAdult(png, entry);
  const colors = paintQuill(entry, traced);
  if (opt.traceOnly) return { traced, colors, picture: null };
  const drawn = vectorizeQuill(entry, traced, colors);
  return { traced, colors, ...drawn };
}

function previewPng(traced, colors, palette, file) {
  const scale = 0.42;
  const ow = Math.round(traced.w * scale);
  const oh = Math.round(traced.h * scale);
  const png = new PNG({ width: ow, height: oh });
  for (let y = 0; y < oh; y++) {
    const sy = Math.min(traced.h - 1, (y / scale) | 0);
    for (let x = 0; x < ow; x++) {
      const sx = Math.min(traced.w - 1, (x / scale) | 0);
      const p = sy * traced.w + sx;
      const o = (y * ow + x) * 4;
      let hex = "#fffdf8";
      if (traced.ink[p]) hex = "#1b2430";
      else {
        const c = colors[traced.labels[p]];
        if (Number.isInteger(c)) hex = palette[c].hex;
      }
      png.data[o] = parseInt(hex.slice(1, 3), 16);
      png.data[o + 1] = parseInt(hex.slice(3, 5), 16);
      png.data[o + 2] = parseInt(hex.slice(5, 7), 16);
      png.data[o + 3] = 255;
    }
  }
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, PNG.sync.write(png));
}

const isMain = process.argv[1] && process.argv[1].endsWith("quill-lineart.mjs");
if (isMain) {
  const only = process.argv[2] && process.argv[2] !== "preview" ? process.argv[2] : null;
  const preview = process.argv.includes("preview") || !process.argv.includes("full");
  for (const entry of QUILL) {
    if (only && entry.id !== only && entry.file !== only) continue;
    const t0 = Date.now();
    process.stdout.write(`${entry.id}… `);
    const built = buildQuill(entry, { traceOnly: preview && !process.argv.includes("full") });
    if (built.picture) {
      const cov = built.coverage;
      console.log(
        `${built.picture.regions.length} regions (traced ${built.traced.count}, vec ${built.vecCount}) eps ${built.eps} miss ${cov.miss}/${cov.total} multi ${cov.multi} ink ${Math.round(built.inkPoints / 1024)}KB ${Date.now() - t0}ms`
      );
    } else {
      console.log(`${built.traced.count} regions ${Date.now() - t0}ms`);
      previewPng(built.traced, built.colors, entry.palette, `/tmp/quill-${entry.id}.png`);
    }
  }
}

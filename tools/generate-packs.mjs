import fs from "fs";
import path from "path";
import { PNG } from "pngjs";
import { PICTURES } from "./art/scenes.mjs";
import { mandalaEntries, buildMandala } from "./art/mandalas.mjs";
import { vectorizePainted, toJSON } from "./lib/picture.mjs";
import { coverage } from "./lib/coverage.mjs";
import { obfuscate } from "./lib/crypt.mjs";
import { pointInLoops } from "../js/geom.js";

const root = path.resolve(path.dirname(new URL(import.meta.url).pathname), "..");
const keys = JSON.parse(fs.readFileSync(path.join(root, "config/pack-keys.json"), "utf8"));
const only = process.argv[2];

const PACKS = [
  {
    id: "starter",
    title: "Starter",
    free: true,
    productId: null,
    tagline: "Six adventures to try, on the house.",
    blurb: "A friendly dragon, a castle, a fox, a forest, a koi, and a garden mandala.",
  },
  {
    id: "creatures",
    title: "Fantastical Creatures",
    free: false,
    productId: "creatures",
    tagline: "Beasts, birds, and beings from the storybook sky.",
    blurb: "Phoenixes, a unicorn, a sea serpent, a griffin, an owl, and intricate adult pages.",
  },
  {
    id: "mandalas",
    title: "Mandalas & Patterns",
    free: false,
    productId: "mandalas",
    tagline: "Slow, intricate patterns for a quiet hour.",
    blurb: "Lotus, star, sunburst, rose window, and other full-page patterns.",
  },
  {
    id: "christmas",
    title: "Christmas",
    free: false,
    productId: "christmas",
    tagline: "Snow, sleighs, and candle-warm colors.",
    blurb: "Trees, snow friends, reindeer, wreaths, and a sleigh, plus an ornament mandala.",
  },
  {
    id: "halloween",
    title: "Halloween",
    free: false,
    productId: "halloween",
    tagline: "Friendly frights and autumn evenings.",
    blurb: "Pumpkins, ghosts, a black cat, a haunted house, bats, and a skull mandala.",
  },
  {
    id: "ocean",
    title: "Ocean Wonders",
    free: false,
    productId: "ocean",
    tagline: "An undersea kingdom of whales, coral, and pearls.",
    blurb: "A whale, a tide pool, a coral palace, dolphins, a seahorse, and intricate reef pages.",
  },
  {
    id: "aboard",
    title: "All Aboard",
    free: false,
    productId: "aboard",
    tagline: "Friendly steam trains with big, easy shapes.",
    blurb: "A steam engine, a bridge, a train with cars, a station, a tunnel, and a moon caboose.",
  },
  {
    id: "lantern",
    title: "Lantern Gallery",
    free: false,
    productId: "lantern",
    tagline: "Intricate pages for a long, quiet color.",
    blurb: "A moon hare, a clock garden, a peacock gate, a glass butterfly, and two gold patterns.",
  },
];

const RANGES = {
  little: [10, 40],
  big: [60, 250],
  adult: [800, 2800],
};

function writePNG(file, size, paint) {
  const png = new PNG({ width: size, height: size });
  paint(png.data, size);
  fs.mkdirSync(path.dirname(file), { recursive: true });
  fs.writeFileSync(file, PNG.sync.write(png));
}

function hexToRgb(hex) {
  return [parseInt(hex.slice(1, 3), 16), parseInt(hex.slice(3, 5), 16), parseInt(hex.slice(5, 7), 16)];
}

function previewFromLabels(picture, file) {
  const { labels, colorOf, palette, labelSize } = picture;
  const size = 360;
  writePNG(file, size, (data) => {
    for (let y = 0; y < size; y++) {
      const sy = Math.min(labelSize - 1, ((y * labelSize) / size) | 0);
      for (let x = 0; x < size; x++) {
        const sx = Math.min(labelSize - 1, ((x * labelSize) / size) | 0);
        const region = labels[sy * labelSize + sx];
        const pal = palette[colorOf[region]];
        const [r, g, b] = hexToRgb(pal.hex);
        const i = (y * size + x) * 4;
        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
        data[i + 3] = 255;
      }
    }
  });
}

function previewFromRegions(picture, file) {
  const size = 280;
  const cell = 50;
  const grid = new Map();
  const boxes = picture.regions.map((r, idx) => {
    let x0 = Infinity;
    let y0 = Infinity;
    let x1 = -Infinity;
    let y1 = -Infinity;
    for (const loop of r.loops) {
      for (const [x, y] of loop) {
        if (x < x0) x0 = x;
        if (y < y0) y0 = y;
        if (x > x1) x1 = x;
        if (y > y1) y1 = y;
      }
    }
    const gx0 = Math.max(0, Math.floor(x0 / cell));
    const gy0 = Math.max(0, Math.floor(y0 / cell));
    const gx1 = Math.min(19, Math.floor(x1 / cell));
    const gy1 = Math.min(19, Math.floor(y1 / cell));
    for (let gy = gy0; gy <= gy1; gy++) {
      for (let gx = gx0; gx <= gx1; gx++) {
        const k = gx + gy * 20;
        let bucket = grid.get(k);
        if (!bucket) grid.set(k, (bucket = []));
        bucket.push(idx);
      }
    }
    return { x0, y0, x1, y1 };
  });
  writePNG(file, size, (data) => {
    for (let y = 0; y < size; y++) {
      const wy = ((y + 0.5) * 1000) / size;
      const gy = Math.min(19, Math.floor(wy / cell));
      for (let x = 0; x < size; x++) {
        const wx = ((x + 0.5) * 1000) / size;
        const gx = Math.min(19, Math.floor(wx / cell));
        const bucket = grid.get(gx + gy * 20) || [];
        let color = "#f6f1e7";
        for (const idx of bucket) {
          const b = boxes[idx];
          if (wx < b.x0 || wx > b.x1 || wy < b.y0 || wy > b.y1) continue;
          if (pointInLoops(wx, wy, picture.regions[idx].loops)) {
            color = picture.palette[picture.regions[idx].c].hex;
            break;
          }
        }
        const [r, g, b] = hexToRgb(color);
        const i = (y * size + x) * 4;
        data[i] = r;
        data[i + 1] = g;
        data[i + 2] = b;
        data[i + 3] = 255;
      }
    }
  });
}

function assertPicture(meta, picture, cov) {
  const [min, max] = RANGES[picture.tier];
  const lo = meta.minCount || min;
  const hi = meta.maxCount || max;
  const n = picture.regions.length;
  if (n < lo || n > hi) {
    throw new Error(`${picture.id} has ${n} regions, expected ${lo}-${hi}`);
  }
  if (picture.missingLabel) throw new Error(`${picture.id} is missing ${picture.missingLabel} label point(s)`);
  let badLabel = 0;
  for (const r of picture.regions) {
    if (r.c == null || r.c < 0 || r.c >= picture.palette.length) throw new Error(`${picture.id} bad color`);
    if (!r.d || r.d.length < 8) throw new Error(`${picture.id} empty path`);
    if (!pointInLoops(r.x, r.y, r.loops)) badLabel++;
  }
  if (badLabel) throw new Error(`${picture.id} has ${badLabel} labels outside their region`);
  const missPct = cov.miss / cov.total;
  const multiPct = cov.multi / cov.total;
  if (missPct > 0.004 || multiPct > 0.004) {
    throw new Error(`${picture.id} coverage miss ${(missPct * 100).toFixed(2)}% multi ${(multiPct * 100).toFixed(2)}%`);
  }
}

const pictures = [];
const filter = only && only !== "all" ? only : null;

for (const entry of PICTURES) {
  if (filter && entry.id !== filter && entry.pack !== filter) continue;
  const t0 = Date.now();
  process.stdout.write(`paint ${entry.id}… `);
  const picture = vectorizePainted(entry);
  const cov = coverage(picture.regions, picture.tier === "little" ? 160 : 140);
  assertPicture(entry, picture, cov);
  pictures.push({ entry, picture, cov, ms: Date.now() - t0 });
  console.log(`${picture.regions.length} regions, cov miss ${cov.miss}/${cov.total}, ${Date.now() - t0}ms`);
}

for (const entry of mandalaEntries()) {
  if (filter && entry.id !== filter && entry.pack !== filter) continue;
  const t0 = Date.now();
  process.stdout.write(`mandala ${entry.id}… `);
  const picture = buildMandala(entry);
  const cov = coverage(picture.regions, 120);
  assertPicture(entry, picture, cov);
  pictures.push({ entry, picture, cov, ms: Date.now() - t0 });
  console.log(`${picture.regions.length} regions, cov miss ${cov.miss}/${cov.total}, ${Date.now() - t0}ms`);
}

if (!filter) {
  const expected = PICTURES.length + mandalaEntries().length;
  if (pictures.length !== expected) throw new Error(`generated ${pictures.length}, expected ${expected}`);
}

const byPack = new Map(PACKS.map((p) => [p.id, []]));
for (const item of pictures) {
  const json = toJSON(item.picture);
  const dir = path.join(root, "packs", item.entry.pack);
  fs.mkdirSync(path.join(dir, "previews"), { recursive: true });
  const body = JSON.stringify(json);
  const encrypted = !PACKS.find((p) => p.id === item.entry.pack).free;
  const fileName = `${item.entry.id}.json`;
  if (encrypted) {
    const wrapped = JSON.stringify({
      enc: "WCCA1",
      product: item.entry.pack,
      data: obfuscate(body, keys[item.entry.pack]),
    });
    fs.writeFileSync(path.join(dir, fileName), wrapped);
  } else {
    fs.writeFileSync(path.join(dir, fileName), body);
  }
  const preview = path.join(dir, "previews", `${item.entry.id}.png`);
  if (item.picture.labels) previewFromLabels(item.picture, preview);
  else previewFromRegions(item.picture, preview);
  byPack.get(item.entry.pack).push({
    id: item.picture.id,
    title: item.picture.title,
    tier: item.picture.tier,
    regions: item.picture.regions.length,
    colors: item.picture.palette.length,
    file: `packs/${item.entry.pack}/${fileName}`,
    preview: `packs/${item.entry.pack}/previews/${item.entry.id}.png`,
    bytes: Buffer.byteLength(encrypted ? fs.readFileSync(path.join(dir, fileName)) : body),
  });
  console.log(`  wrote ${item.entry.pack}/${fileName} (${(Buffer.byteLength(body) / 1024).toFixed(0)} KB json)`);
}

if (!filter) {
  const catalog = {
    name: "WingsCrew Color Adventures",
    packs: PACKS.map((pack) => ({
      ...pack,
      pictures: byPack.get(pack.id),
    })),
  };
  fs.writeFileSync(path.join(root, "packs/catalog.json"), JSON.stringify(catalog, null, 2));
  const report = {
    generatedAt: new Date().toISOString(),
    pictures: pictures.map((item) => ({
      id: item.picture.id,
      pack: item.entry.pack,
      tier: item.picture.tier,
      regions: item.picture.regions.length,
      colors: item.picture.palette.length,
      coverage: item.cov,
      ms: item.ms,
    })),
  };
  fs.mkdirSync(path.join(root, "docs"), { recursive: true });
  fs.writeFileSync(path.join(root, "docs/pack-report.json"), JSON.stringify(report, null, 2));
  console.log("catalog written", pictures.length, "pictures");
}

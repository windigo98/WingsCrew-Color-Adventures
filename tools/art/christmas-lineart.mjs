/**
 * Christmas pack pages traced from the approved kawaii line art.
 * `paint[regionId]` is a palette index. Pupils stay in the ink overlay.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { PNG } from "pngjs";
import { buildLineArtPicture } from "../lib/lineart.mjs";

const dir = path.join(path.dirname(fileURLToPath(import.meta.url)), "lineart/christmas");
const swatch = (hex, name) => ({ hex, name });

function page(def) {
  return { pack: "christmas", tier: "little", rev: 1, ...def };
}

export const CHRISTMAS = [
  page({
    id: "santa-present",
    title: "Santa's Present",
    file: "santa.png",
    palette: [
      swatch("#E7F3FF", "Sky"),
      swatch("#D7263D", "Suit"),
      swatch("#FFFBF8", "White"),
      swatch("#F6C7A8", "Face"),
      swatch("#F2C14E", "Gold"),
      swatch("#2F9E6B", "Present"),
      swatch("#C5E4F7", "Snowflake"),
      swatch("#3A2A24", "Boot"),
      swatch("#2C2416", "Belt"),
    ],
    paint: [
      0, 1, 6, 4, 2, 2, 3, 2, 2, 2, 4, 4, 1, 5, 1, 1, 4, 5, 2, 2, 2, 5, 1, 8, 4, 8, 4, 1, 1, 1, 2, 7, 2, 7,
    ],
  }),
  page({
    id: "reindeer-bell",
    title: "Reindeer Bell",
    file: "reindeer.png",
    palette: [
      swatch("#E7F3FF", "Sky"),
      swatch("#C48A4A", "Antler"),
      swatch("#E7C59A", "Coat"),
      swatch("#F7A8B8", "Ear"),
      swatch("#F2C14E", "Gold"),
      swatch("#FFFBF8", "Eye"),
      swatch("#E25B6A", "Scarf"),
      swatch("#F8E2B0", "Stripe"),
      swatch("#3E9B5A", "Fringe"),
      swatch("#E0B56A", "Body"),
      swatch("#8D5A34", "Hoof"),
      swatch("#A56B8A", "Tail"),
      swatch("#C47A3A", "Nose"),
      swatch("#F4A4B8", "Cheek"),
    ],
    paint: [
      0, 1, 1, 4, 2, 3, 3, 5, 4, 5, 4, 12, 13, 13, 6, 7, 7, 8, 9, 4, 8, 11, 9, 10, 10, 10, 10,
    ],
  }),
  page({
    id: "smiling-snowman",
    title: "Smiling Snowman",
    file: "snowman.png",
    palette: [
      swatch("#E7F3FF", "Sky"),
      swatch("#FFFBF8", "Snow"),
      swatch("#F6D77A", "Pom"),
      swatch("#D7263D", "Red"),
      swatch("#3E9B5A", "Green"),
      swatch("#F2C14E", "Gold"),
      swatch("#4C8DDB", "Blue"),
      swatch("#F4A4C4", "Pink"),
      swatch("#F8E2B0", "Cream"),
      swatch("#F08A2A", "Carrot"),
      swatch("#C5E4F7", "Snowflake"),
      swatch("#2F8F4E", "Pine"),
    ],
    paint: [
      0, 2, 10, 3, 10, 4, 5, 6, 7, 8, 3, 4, 5, 6, 7, 1, 1, 1, 9, 6, 3, 3, 4, 5, 6, 7, 8, 3, 4, 5, 1, 6, 11, 7,
    ],
  }),
  page({
    id: "christmas-tree",
    title: "Christmas Tree",
    file: "tree.png",
    palette: [
      swatch("#E7F3FF", "Sky"),
      swatch("#F2C14E", "Gold"),
      swatch("#2F8F4E", "Pine"),
      swatch("#67B85A", "Bough"),
      swatch("#FFFBF8", "Eye"),
      swatch("#7EC8E3", "Blue"),
      swatch("#F4A4C4", "Pink"),
      swatch("#E23B4A", "Red"),
      swatch("#B48AD4", "Purple"),
      swatch("#C5E4F7", "Snowflake"),
      swatch("#8D5A34", "Trunk"),
      swatch("#3AA7A0", "Teal"),
    ],
    paint: [
      0, 1, 9, 2, 5, 4, 4, 6, 1, 3, 7, 1, 3, 8, 3, 2, 2, 7, 6, 2, 1, 10, 1, 7, 1, 1, 7, 5, 6, 3, 5, 7, 5, 11,
    ],
  }),
  page({
    id: "gingerbread-cottage",
    title: "Gingerbread Cottage",
    file: "gingerbread.png",
    palette: [
      swatch("#FBF6EE", "Sky"),
      swatch("#E0A15A", "Cookie"),
      swatch("#FFFBF8", "Icing"),
      swatch("#7B6BB8", "Grape"),
      swatch("#6EB5E0", "Blue candy"),
      swatch("#D08A5A", "Ginger"),
      swatch("#C46B45", "Door"),
      swatch("#E23B4A", "Stripe"),
      swatch("#7CB342", "Bush"),
      swatch("#3E8E41", "Shrub"),
      swatch("#D7EEF8", "Snow"),
      swatch("#E8C4A0", "Path"),
      swatch("#F4A4B8", "Trim"),
    ],
    paint: [
      0, 1, 2, 4, 3, 2, 5, 6, 2, 2, 4, 4, 7, 7, 6, 6, 6, 8, 9, 6, 8, 2, 9, 2, 10, 8, 9, 6, 10, 12, 11, 12, 8, 9,
    ],
  }),
  page({
    id: "penguin-present",
    title: "Penguin Present",
    file: "penguin.png",
    palette: [
      swatch("#E7F3FF", "Sky"),
      swatch("#F6D77A", "Pom"),
      swatch("#E23B4A", "Red"),
      swatch("#F2C14E", "Gold"),
      swatch("#3E9B5A", "Green"),
      swatch("#4C8DDB", "Blue"),
      swatch("#F4A4C4", "Pink"),
      swatch("#F08A2A", "Orange"),
      swatch("#F8E2B0", "Cream"),
      swatch("#5C4A78", "Hood"),
      swatch("#FFF8F2", "Face"),
      swatch("#314E70", "Body"),
      swatch("#FFE8C2", "Belly"),
      swatch("#FFF3D8", "Snow"),
      swatch("#3AA7A0", "Teal"),
      swatch("#7DCFC2", "Ribbon"),
    ],
    paint: [
      0, 1, 2, 3, 4, 5, 6, 7, 8, 3, 4, 14, 5, 6, 9, 10, 10, 10, 4, 15, 5, 11, 11, 11, 3, 4, 14, 5, 5, 11, 12, 13, 3, 3,
    ],
  }),
];

export function writeInkPreview(traced, paint, palette, file, size = 360) {
  const { w, h, labels, ink } = traced;
  const png = new PNG({ width: size, height: size });
  for (let y = 0; y < size; y++) {
    const sy = Math.min(h - 1, ((y * h) / size) | 0);
    for (let x = 0; x < size; x++) {
      const sx = Math.min(w - 1, ((x * w) / size) | 0);
      const p = sy * w + sx;
      const o = (y * size + x) * 4;
      let hex = "#fffdf8";
      if (ink[p]) hex = "#1b2430";
      else {
        const c = paint[labels[p]];
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

export function loadChristmasPng(entry) {
  return PNG.sync.read(fs.readFileSync(path.join(dir, entry.file)));
}

export function buildChristmas(entry) {
  const png = loadChristmasPng(entry);
  const built = buildLineArtPicture(png, entry);
  if (built.traced.count !== entry.paint.length) {
    throw new Error(`${entry.id} traced ${built.traced.count} regions, paint map has ${entry.paint.length}`);
  }
  if (built.drawn.regions.length !== built.traced.count) {
    throw new Error(`${entry.id} vectorized ${built.drawn.regions.length} of ${built.traced.count}`);
  }
  const picture = {
    id: built.picture.id,
    title: built.picture.title,
    tier: built.picture.tier,
    rev: entry.rev,
    viewBox: built.picture.viewBox,
    palette: built.picture.palette,
    ink: built.picture.ink,
    regions: built.picture.regions.map((region) => ({
      c: region.c,
      d: region.d,
      x: region.x,
      y: region.y,
      loops: region.loops,
    })),
  };
  return { picture, traced: built.traced, paint: entry.paint };
}

/**
 * Load every shipped picture, decrypt paid packs, and confirm:
 * each region has a palette color, a path, and a label point inside the region,
 * and a sample grid shows no meaningful gaps or double-fills.
 *
 *   node tools/check-packs.mjs
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { coverage } from "./lib/coverage.mjs";
import { pointInLoops } from "../js/geom.js";
import { deobfuscate } from "./lib/crypt.mjs";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const catalog = JSON.parse(fs.readFileSync(path.join(root, "packs/catalog.json"), "utf8"));
const keys = JSON.parse(fs.readFileSync(path.join(root, "config/pack-keys.json"), "utf8"));
const RANGES = { little: [10, 40], big: [60, 250], adult: [800, 2800] };

function parseLoops(d) {
  const loops = [];
  for (const part of String(d || "").split("M")) {
    if (!part) continue;
    const nums = part.match(/-?\d*\.?\d+/g);
    if (!nums || nums.length < 6) continue;
    const loop = [];
    for (let i = 0; i + 1 < nums.length; i += 2) loop.push([+nums[i], +nums[i + 1]]);
    if (loop.length >= 3) loops.push(loop);
  }
  return loops;
}

const rows = [];
let failed = 0;

for (const pack of catalog.packs) {
  for (const entry of pack.pictures) {
    const raw = JSON.parse(fs.readFileSync(path.join(root, entry.file), "utf8"));
    const picture = raw.enc ? JSON.parse(deobfuscate(raw.data, keys[raw.product])) : raw;
    const problems = [];
    if (picture.id !== entry.id) problems.push("id mismatch");
    const [lo, hi] = RANGES[picture.tier] || [1, 100000];
    if (picture.regions.length < lo || picture.regions.length > hi) {
      problems.push(`region count ${picture.regions.length} outside ${lo}-${hi}`);
    }
    const prepared = picture.regions.map((region, i) => {
      if (!Number.isInteger(region.c) || region.c < 0 || region.c >= picture.palette.length) {
        problems.push(`region ${i} bad color`);
      }
      const loops = parseLoops(region.d);
      if (!loops.length) problems.push(`region ${i} empty path`);
      else if (!pointInLoops(region.x, region.y, loops)) problems.push(`region ${i} label outside`);
      return { loops };
    });
    const cov = coverage(prepared, 80);
    const missPct = cov.miss / cov.total;
    const multiPct = cov.multi / cov.total;
    if (missPct > 0.004) problems.push(`gaps ${(missPct * 100).toFixed(2)}%`);
    if (multiPct > 0.004) problems.push(`overlaps ${(multiPct * 100).toFixed(2)}%`);
    if (problems.length) failed++;
    rows.push({
      id: picture.id,
      pack: pack.id,
      tier: picture.tier,
      regions: picture.regions.length,
      colors: picture.palette.length,
      miss: cov.miss,
      multi: cov.multi,
      samples: cov.total,
      ok: problems.length === 0,
      problems,
    });
    const flag = problems.length ? "FAIL" : "ok  ";
    console.log(`${flag} ${pack.id}/${picture.id} ${picture.tier} ${picture.regions.length} regions miss ${cov.miss}/${cov.total} multi ${cov.multi}`);
    if (problems.length) console.log("     " + problems.slice(0, 6).join("; "));
  }
}

const report = {
  checkedAt: new Date().toISOString(),
  pictures: rows.length,
  failed,
  threshold: "miss and overlap each under 0.4% of samples; every label inside its region",
  rows,
};
fs.mkdirSync(path.join(root, "docs"), { recursive: true });
fs.writeFileSync(path.join(root, "docs/check-report.json"), JSON.stringify(report, null, 2));
console.log(`\n${rows.length} pictures, ${failed} failed. Wrote docs/check-report.json`);
if (failed) process.exit(1);

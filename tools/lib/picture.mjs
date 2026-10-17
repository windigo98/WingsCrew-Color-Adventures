import { vectorizeLabels } from "../../js/vectorize.js";
import { pointInLoops, polylabel, ringArea } from "../../js/geom.js";
import { buildRegions, distancePoles } from "./segment.mjs";
import { createPainter } from "./paint.mjs";

export const TIER = {
  little: { res: 340, eps: 1.15, minArea: 36, maxRegions: 40, allowSplit: false, target: 28, minPiece: 80 },
  big: { res: 460, eps: 0.9, minArea: 12, maxRegions: 250, allowSplit: true, target: 170, minPiece: 34 },
  adult: { res: 520, eps: 0.78, minArea: 6, maxRegions: 2550, allowSplit: true, target: 1500, minPiece: 24 },
};

function sampleInside(loops, labels, regionId, w, h) {
  const sx = 1000 / w;
  const sy = 1000 / h;
  let best = null;
  let bestD = -1;
  const step = labels.length > 300000 ? 3 : 2;
  for (let y = 0; y < h; y += step) {
    for (let x = 0; x < w; x += step) {
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

export function vectorizePainted(entry) {
  const tier = TIER[entry.tier];
  const res = entry.res || tier.res;
  const painter = createPainter(res, res);
  const S = (v) => (v / 1000) * res;
  entry.draw(painter, S, entry.tier);
  const built = buildRegions(painter.data, res, res, {
    minArea: entry.minArea ?? tier.minArea,
    maxRegions: entry.maxRegions ?? tier.maxRegions,
    allowSplit: tier.allowSplit,
    target: entry.target ?? tier.target,
    minPiece: entry.minPiece ?? tier.minPiece,
  });
  return finishRegions(entry, built, res, entry.eps ?? tier.eps);
}

function finishRegions(entry, built, res, eps) {
  const used = [];
  const remap = new Map();
  for (const c of built.colorOf) {
    if (!remap.has(c)) {
      remap.set(c, used.length);
      used.push(entry.palette[c]);
    }
  }
  const attempts = [eps, Math.max(0.35, eps * 0.55), 0.2];
  let last = null;
  for (const e of attempts) {
    const vec = vectorizeLabels(built.labels, res, res, 1000, e);
    const poles = distancePoles(built.labels, res, res, 1000);
    const regions = [];
    let missingLabel = 0;
    for (let id = 0; id < built.count; id++) {
      const geom = vec.get(id);
      if (!geom) {
        missingLabel++;
        continue;
      }
      let pt = poles.get(id);
      if (!pt || !pointInLoops(pt.x, pt.y, geom.loops)) {
        const fallback = polylabel(geom.loops);
        pt = { x: fallback.x, y: fallback.y };
        if (!pointInLoops(pt.x, pt.y, geom.loops)) {
          pt = sampleInside(geom.loops, built.labels, id, res, res);
        }
      }
      if (!pt) {
        missingLabel++;
        continue;
      }
      regions.push({
        c: remap.get(built.colorOf[id]),
        d: geom.path,
        x: pt.x,
        y: pt.y,
        loops: geom.loops,
        a: Math.round(Math.abs(ringArea(geom.loops))),
      });
    }
    last = { regions, missingLabel, eps: e, vecCount: vec.size };
    if (missingLabel === 0 && regions.length === built.count) break;
  }
  return {
    id: entry.id,
    title: entry.title,
    tier: entry.tier,
    palette: used,
    regions: last.regions,
    builtCount: built.count,
    components: built.components,
    missingLabel: last.missingLabel,
    eps: last.eps,
    res,
    labels: built.labels,
    colorOf: built.colorOf.map((c) => remap.get(c)),
    labelSize: res,
  };
}

export function toJSON(picture) {
  return {
    id: picture.id,
    title: picture.title,
    tier: picture.tier,
    viewBox: [0, 0, 1000, 1000],
    palette: picture.palette,
    regions: picture.regions.map((r) => ({ c: r.c, d: r.d, x: r.x, y: r.y })),
  };
}

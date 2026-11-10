/**
 * Turn a black-and-white coloring-page PNG into watertight color-by-number
 * regions, keeping the drawing's own ink as an overlay.
 *
 * Gray JPEG/edge pixels are thresholded to pure black or white. Flood fill
 * treats the page edge as a wall, and strokes that run off the page are
 * extended to that edge so they actually close. Tiny pockets (snowflake
 * arms, beads, dots, knit ribs) merge into the neighbour they share the
 * most border with, or into the ink if they are pinholes in a stroke.
 */
import { vectorizeLabels, loopsToPath } from "../../js/vectorize.js";
import { pointInLoops, polylabel, ringArea } from "../../js/geom.js";
import { distancePoles } from "./segment.mjs";

const DEFAULTS = {
  thresh: 200,
  seal: 5,
  close: 3,
  pinhole: 48,
  minArea: 3200,
  minRadius: 14,
  maxRegions: 34,
  minRegions: 16,
  eps: 1.05,
};

function luminance(r, g, b) {
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

export function rasterInk(png, thresh) {
  const w = png.width;
  const h = png.height;
  const ink = new Uint8Array(w * h);
  const data = png.data;
  for (let p = 0, i = 0; p < w * h; p++, i += 4) {
    const a = data[i + 3];
    if (a < 128 || luminance(data[i], data[i + 1], data[i + 2]) < thresh) ink[p] = 1;
  }
  return ink;
}

/**
 * Extend strokes that run off the page. Only a narrow bridge is drawn, from
 * the closest ink of each cluster, so a closed shape that merely sits near
 * the edge does not turn into a black bar.
 */
/** Bridge 1–2px gaps in the ink so nearly closed eyes and outlines actually close. */
export function closeInk(ink, w, h, radius) {
  if (!radius) return;
  const dil = new Uint8Array(ink.length);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let on = ink[y * w + x];
      if (!on) {
        for (let dy = -radius; dy <= radius && !on; dy++) {
          for (let dx = -radius; dx <= radius; dx++) {
            const nx = x + dx;
            const ny = y + dy;
            if (nx < 0 || ny < 0 || nx >= w || ny >= h) continue;
            if (ink[ny * w + nx]) {
              on = 1;
              break;
            }
          }
        }
      }
      dil[y * w + x] = on;
    }
  }
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let on = 1;
      for (let dy = -radius; dy <= radius && on; dy++) {
        for (let dx = -radius; dx <= radius; dx++) {
          const nx = x + dx;
          const ny = y + dy;
          if (nx < 0 || ny < 0 || nx >= w || ny >= h || !dil[ny * w + nx]) {
            on = 0;
            break;
          }
        }
      }
      ink[y * w + x] = on;
    }
  }
}

export function sealToEdge(ink, w, h, seal) {
  if (!seal) return;
  const src = ink.slice();
  const near = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      if (!src[y * w + x]) continue;
      const left = x;
      const right = w - 1 - x;
      const top = y;
      const bottom = h - 1 - y;
      const d = Math.min(left, right, top, bottom);
      if (d === 0 || d > seal) continue;
      const edge = d === right ? "r" : d === top ? "t" : d === bottom ? "b" : "l";
      near.push({ x, y, d, edge });
    }
  }
  near.sort((a, b) => a.d - b.d);
  const used = [];
  for (const b of near) {
    if (used.some((u) => u.edge === b.edge && Math.abs(u.x - b.x) + Math.abs(u.y - b.y) < 36)) continue;
    used.push(b);
    const paint = (px, py) => {
      if (px >= 0 && py >= 0 && px < w && py < h) ink[py * w + px] = 1;
    };
    if (b.edge === "l" || b.edge === "r") {
      const x0 = b.edge === "l" ? 0 : b.x;
      const x1 = b.edge === "l" ? b.x : w - 1;
      for (let x = x0; x <= x1; x++) {
        paint(x, b.y);
        paint(x, b.y - 1);
      }
    } else {
      const y0 = b.edge === "t" ? 0 : b.y;
      const y1 = b.edge === "t" ? b.y : h - 1;
      for (let y = y0; y <= y1; y++) {
        paint(b.x, y);
        paint(b.x - 1, y);
      }
    }
  }
}

function floodPaper(ink, w, h) {
  const n = w * h;
  const labels = new Int32Array(n);
  labels.fill(-1);
  const qx = new Int32Array(n);
  const qy = new Int32Array(n);
  const areas = [];
  let count = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const start = y * w + x;
      if (ink[start] || labels[start] !== -1) continue;
      let qs = 0;
      let qe = 0;
      qx[qe] = x;
      qy[qe] = y;
      qe++;
      labels[start] = count;
      let area = 0;
      while (qs < qe) {
        const cx = qx[qs];
        const cy = qy[qs];
        qs++;
        area++;
        if (cx > 0) {
          const ni = cy * w + cx - 1;
          if (labels[ni] === -1 && !ink[ni]) {
            labels[ni] = count;
            qx[qe] = cx - 1;
            qy[qe] = cy;
            qe++;
          }
        }
        if (cx + 1 < w) {
          const ni = cy * w + cx + 1;
          if (labels[ni] === -1 && !ink[ni]) {
            labels[ni] = count;
            qx[qe] = cx + 1;
            qy[qe] = cy;
            qe++;
          }
        }
        if (cy > 0) {
          const ni = (cy - 1) * w + cx;
          if (labels[ni] === -1 && !ink[ni]) {
            labels[ni] = count;
            qx[qe] = cx;
            qy[qe] = cy - 1;
            qe++;
          }
        }
        if (cy + 1 < h) {
          const ni = (cy + 1) * w + cx;
          if (labels[ni] === -1 && !ink[ni]) {
            labels[ni] = count;
            qx[qe] = cx;
            qy[qe] = cy + 1;
            qe++;
          }
        }
      }
      areas.push(area);
      count++;
    }
  }
  return { labels, areas, count };
}

function absorbPinholes(labels, ink, areas, w, h, pinhole) {
  if (!pinhole) return { labels, areas, count: areas.length };
  const drop = new Uint8Array(areas.length);
  for (let i = 0; i < areas.length; i++) if (areas[i] < pinhole) drop[i] = 1;
  let removed = 0;
  for (let i = 0; i < labels.length; i++) {
    const id = labels[i];
    if (id >= 0 && drop[id]) {
      labels[i] = -1;
      ink[i] = 1;
      removed++;
    }
  }
  if (!removed) return { labels, areas, count: areas.length };
  const map = new Int32Array(areas.length);
  map.fill(-1);
  const nextAreas = [];
  for (let i = 0; i < areas.length; i++) {
    if (drop[i]) continue;
    map[i] = nextAreas.length;
    nextAreas.push(areas[i]);
  }
  for (let i = 0; i < labels.length; i++) {
    if (labels[i] >= 0) labels[i] = map[labels[i]];
  }
  return { labels, areas: nextAreas, count: nextAreas.length };
}

function componentRadius(labels, count, w, h) {
  const n = w * h;
  const dist = new Uint16Array(n);
  const qx = new Int32Array(n);
  const qy = new Int32Array(n);
  let qh = 0;
  let qt = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const id = labels[i];
      if (id < 0) continue;
      let boundary = x === 0 || y === 0 || x === w - 1 || y === h - 1;
      if (!boundary) {
        if (labels[i - 1] !== id || labels[i + 1] !== id || labels[i - w] !== id || labels[i + w] !== id) boundary = true;
      }
      if (boundary) {
        dist[i] = 1;
        qx[qt] = x;
        qy[qt] = y;
        qt++;
      }
    }
  }
  while (qh < qt) {
    const x = qx[qh];
    const y = qy[qh];
    qh++;
    const i = y * w + x;
    const id = labels[i];
    const nd = dist[i] + 1;
    if (x > 0 && dist[i - 1] === 0 && labels[i - 1] === id) {
      dist[i - 1] = nd;
      qx[qt] = x - 1;
      qy[qt] = y;
      qt++;
    }
    if (x + 1 < w && dist[i + 1] === 0 && labels[i + 1] === id) {
      dist[i + 1] = nd;
      qx[qt] = x + 1;
      qy[qt] = y;
      qt++;
    }
    if (y > 0 && dist[i - w] === 0 && labels[i - w] === id) {
      dist[i - w] = nd;
      qx[qt] = x;
      qy[qt] = y - 1;
      qt++;
    }
    if (y + 1 < h && dist[i + w] === 0 && labels[i + w] === id) {
      dist[i + w] = nd;
      qx[qt] = x;
      qy[qt] = y + 1;
      qt++;
    }
  }
  const radius = new Int32Array(count);
  for (let i = 0; i < n; i++) {
    const id = labels[i];
    if (id >= 0 && dist[i] > radius[id]) radius[id] = dist[i];
  }
  return radius;
}

function borderEdges(labels, count, w, h) {
  const n = w * h;
  const work = new Int32Array(labels);
  const tally = new Map();
  const add = (a, b) => {
    if (a < 0 || b < 0 || a === b) return;
    if (a > b) {
      const t = a;
      a = b;
      b = t;
    }
    const k = a * count + b;
    tally.set(k, (tally.get(k) || 0) + 1);
  };
  for (let step = 0; step < 40; step++) {
    const next = new Int32Array(work);
    let changed = 0;
    for (let y = 0; y < h; y++) {
      const row = y * w;
      for (let x = 0; x < w; x++) {
        const i = row + x;
        if (work[i] !== -1) continue;
        let a = -1;
        let b = -1;
        let c = -1;
        const see = (v) => {
          if (v < 0) return;
          if (a < 0 || v === a) a = v;
          else if (b < 0 || v === b) b = v;
          else c = v;
        };
        if (x > 0) see(work[i - 1]);
        if (x + 1 < w) see(work[i + 1]);
        if (y > 0) see(work[i - w]);
        if (y + 1 < h) see(work[i + w]);
        if (a < 0) continue;
        if (b >= 0) {
          add(a, b);
          if (c >= 0) {
            add(a, c);
            add(b, c);
          }
        }
        next[i] = a;
        changed++;
      }
    }
    work.set(next);
    if (!changed) break;
  }
  const edges = [];
  for (const [k, len] of tally) {
    const a = (k / count) | 0;
    const b = k % count;
    edges.push({ a, b, len });
  }
  return edges;
}

function lockEyeWhites(ink, labels, areas, w, h) {
  const n = w * h;
  const dist = new Uint16Array(n);
  const qx = new Int32Array(n);
  const qy = new Int32Array(n);
  let qh = 0;
  let qt = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (ink[i]) continue;
      dist[i] = 1;
      qx[qt] = x;
      qy[qt] = y;
      qt++;
    }
  }
  while (qh < qt) {
    const x = qx[qh];
    const y = qy[qh];
    qh++;
    const nd = dist[y * w + x] + 1;
    const grow = (nx, ny) => {
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) return;
      const ni = ny * w + nx;
      if (!ink[ni] || dist[ni]) return;
      dist[ni] = nd;
      qx[qt] = nx;
      qy[qt] = ny;
      qt++;
    };
    grow(x - 1, y);
    grow(x + 1, y);
    grow(x, y - 1);
    grow(x, y + 1);
  }
  // Pupil interiors are the thick ink. Linework stays thin, so it never qualifies.
  const thick = new Uint8Array(n);
  for (let i = 0; i < n; i++) if (ink[i] && dist[i] >= 8) thick[i] = 1;
  const seen = new Uint8Array(n);
  qh = 0;
  qt = 0;
  const locked = new Uint8Array(areas.length);
  const candidates = [];
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const s = y * w + x;
      if (!thick[s] || seen[s]) continue;
      let qs = 0;
      let qe = 0;
      qx[qe] = x;
      qy[qe] = y;
      qe++;
      seen[s] = 1;
      let area = 0;
      let minx = x;
      let maxx = x;
      let miny = y;
      let maxy = y;
      while (qs < qe) {
        const cx = qx[qs];
        const cy = qy[qs];
        qs++;
        area++;
        if (cx < minx) minx = cx;
        if (cx > maxx) maxx = cx;
        if (cy < miny) miny = cy;
        if (cy > maxy) maxy = cy;
        const step = (nx, ny) => {
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) return;
          const ni = ny * w + nx;
          if (!thick[ni] || seen[ni]) return;
          seen[ni] = 1;
          qx[qe] = nx;
          qy[qe] = ny;
          qe++;
        };
        step(cx - 1, cy);
        step(cx + 1, cy);
        step(cx, cy - 1);
        step(cx, cy + 1);
      }
      const bw = maxx - minx + 1;
      const bh = maxy - miny + 1;
      const aspect = bw / bh;
      if (area < 900 || area > 3400 || bw < 40 || bh < 40 || aspect < 0.6 || aspect > 1.65) continue;
      const touch = new Map();
      const ringSeen = new Uint8Array(n);
      let rq = 0;
      let rw = 0;
      for (let yy = miny; yy <= maxy; yy++) {
        for (let xx = minx; xx <= maxx; xx++) {
          const i = yy * w + xx;
          if (!thick[i]) continue;
          ringSeen[i] = 1;
          qx[rw] = xx;
          qy[rw] = yy;
          rw++;
        }
      }
      const ringDist = new Uint16Array(n);
      while (rq < rw) {
        const cx = qx[rq];
        const cy = qy[rq];
        rq++;
        const base = ringDist[cy * w + cx];
        if (base > 28) continue;
        const step = (nx, ny) => {
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) return;
          const ni = ny * w + nx;
          if (ringSeen[ni]) return;
          if (!ink[ni]) {
            const id = labels[ni];
            if (id >= 0) touch.set(id, (touch.get(id) || 0) + 1);
            return;
          }
          ringSeen[ni] = 1;
          ringDist[ni] = base + 1;
          qx[rw] = nx;
          qy[rw] = ny;
          rw++;
        };
        step(cx - 1, cy);
        step(cx + 1, cy);
        step(cx, cy - 1);
        step(cx, cy + 1);
      }
      let best = -1;
      let bestScore = -1;
      for (const [id, len] of touch) {
        const a = areas[id];
        if (a < 400 || a > 2200) continue;
        const score = len * 1000 - a;
        if (score > bestScore) {
          bestScore = score;
          best = id;
        }
      }
      if (best >= 0) candidates.push({ id: best, area });
    }
  }
  candidates.sort((a, b) => b.area - a.area);
  const seenId = new Set();
  for (const c of candidates) {
    if (seenId.has(c.id)) continue;
    seenId.add(c.id);
    locked[c.id] = 1;
    if (seenId.size >= 2) break;
  }
  return locked;
}

function mergeComponents(count, areas, radius, edges, opt, locked) {
  const parent = new Int32Array(count);
  const area = Int32Array.from(areas);
  for (let i = 0; i < count; i++) parent[i] = i;
  const find = (x) => {
    let r = x;
    while (parent[r] !== r) r = parent[r];
    let i = x;
    while (parent[i] !== i) {
      const n = parent[i];
      parent[i] = r;
      i = n;
    }
    return r;
  };
  const live = () => {
    const s = [];
    for (let i = 0; i < count; i++) if (find(i) === i && area[i] > 0) s.push(i);
    return s;
  };
  function bestNeighbor(id) {
    const acc = new Map();
    for (const e of edges) {
      const a = find(e.a);
      const b = find(e.b);
      if (a === b) continue;
      if (a === id) acc.set(b, (acc.get(b) || 0) + e.len);
      else if (b === id) acc.set(a, (acc.get(a) || 0) + e.len);
    }
    let best = -1;
    let bestLen = -1;
    let bestArea = Infinity;
    for (const [n, len] of acc) {
      if (len > bestLen || (len === bestLen && area[n] < bestArea)) {
        bestLen = len;
        best = n;
        bestArea = area[n];
      }
    }
    return best;
  }
  function merge(src, dst) {
    src = find(src);
    dst = find(dst);
    if (src === dst) return;
    parent[src] = dst;
    area[dst] += area[src];
    area[src] = 0;
  }

  // Chubby closed shapes (eyes, cheeks, bells) stay even when their area is
  // under the general minimum. Skinny pockets still fold into a neighbour.
  const pinned = (id) => locked && locked[id];
  const round = (id) => radius[id] >= (opt.keepRadius ?? 15) && area[id] >= (opt.keepArea ?? 1000);
  const fails = (id) => !pinned(id) && !round(id) && (area[id] < opt.minArea || radius[id] < opt.minRadius);
  for (let guard = 0; guard < count; guard++) {
    let pick = -1;
    for (const id of live()) {
      if (!fails(id)) continue;
      if (pick < 0 || area[id] < area[pick]) pick = id;
    }
    if (pick < 0) break;
    const dst = bestNeighbor(pick);
    if (dst < 0) break;
    merge(pick, dst);
  }
  for (let guard = 0; guard < count; guard++) {
    const ids = live();
    if (ids.length <= opt.maxRegions) break;
    const candidates = ids.filter((id) => !pinned(id));
    if (!candidates.length) break;
    candidates.sort((a, b) => {
      const ar = round(a) ? 1 : 0;
      const br = round(b) ? 1 : 0;
      if (ar !== br) return ar - br;
      return area[a] - area[b];
    });
    const pick = candidates[0];
    const dst = bestNeighbor(pick);
    if (dst < 0) break;
    merge(pick, dst);
  }
  return { parent, find, area };
}

function remapLabels(labels, find, count, w, h) {
  const map = new Map();
  let next = 0;
  const out = new Int32Array(w * h);
  out.fill(-1);
  for (let i = 0; i < labels.length; i++) {
    const id = labels[i];
    if (id < 0) continue;
    const root = find(id);
    let nid = map.get(root);
    if (nid == null) {
      nid = next++;
      map.set(root, nid);
    }
    out[i] = nid;
  }
  return { labels: out, count: next };
}

function assignInk(labels, count, w, h) {
  const n = w * h;
  const qx = new Int32Array(n);
  const qy = new Int32Array(n);
  let qh = 0;
  let qt = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (labels[i] < 0) continue;
      let edge = false;
      if (x > 0 && labels[i - 1] < 0) edge = true;
      else if (x + 1 < w && labels[i + 1] < 0) edge = true;
      else if (y > 0 && labels[i - w] < 0) edge = true;
      else if (y + 1 < h && labels[i + w] < 0) edge = true;
      if (edge) {
        qx[qt] = x;
        qy[qt] = y;
        qt++;
      }
    }
  }
  while (qh < qt) {
    const x = qx[qh];
    const y = qy[qh];
    qh++;
    const id = labels[y * w + x];
    const grow = (nx, ny) => {
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) return;
      const ni = ny * w + nx;
      if (labels[ni] >= 0) return;
      labels[ni] = id;
      qx[qt] = nx;
      qy[qt] = ny;
      qt++;
    };
    grow(x - 1, y);
    grow(x + 1, y);
    grow(x, y - 1);
    grow(x, y + 1);
  }
  // Anything still unassigned (should not happen) joins the largest neighbour search.
  let fallback = 0;
  const area = new Int32Array(count);
  for (let i = 0; i < n; i++) if (labels[i] >= 0) area[labels[i]]++;
  for (let i = 1; i < count; i++) if (area[i] > area[fallback]) fallback = i;
  for (let i = 0; i < n; i++) if (labels[i] < 0) labels[i] = fallback;
}

function sampleInside(loops, labels, regionId, w, h) {
  const sx = 1000 / w;
  const sy = 1000 / h;
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

function regionColor(spec, regions, labels, w, h) {
  const hits = new Map();
  for (const hint of spec.hints || []) {
    const x = Math.max(0, Math.min(w - 1, hint.x | 0));
    const y = Math.max(0, Math.min(h - 1, hint.y | 0));
    const id = labels[y * w + x];
    if (id >= 0) hits.set(id, hint.c);
  }
  return regions.map((region) => (hits.has(region.id) ? hits.get(region.id) : spec.fallback ?? 0));
}

export function inspectPaper(png, opt = {}) {
  const cfg = { ...DEFAULTS, ...opt };
  const w = png.width;
  const h = png.height;
  const ink = rasterInk(png, cfg.thresh);
  closeInk(ink, w, h, cfg.close || 0);
  sealToEdge(ink, w, h, cfg.seal);
  const flooded = floodPaper(ink, w, h);
  const paper = absorbPinholes(flooded.labels, ink, flooded.areas, w, h, cfg.pinhole);
  const radius = componentRadius(paper.labels, paper.count, w, h);
  const sx = new Float64Array(paper.count);
  const sy = new Float64Array(paper.count);
  const n = new Int32Array(paper.count);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const id = paper.labels[y * w + x];
      if (id < 0) continue;
      sx[id] += x;
      sy[id] += y;
      n[id]++;
    }
  }
  const rows = [];
  for (let id = 0; id < paper.count; id++) {
    rows.push({
      id,
      area: paper.areas[id],
      radius: radius[id],
      x: Math.round(sx[id] / Math.max(1, n[id])),
      y: Math.round(sy[id] / Math.max(1, n[id])),
    });
  }
  rows.sort((a, b) => a.area - b.area);
  return rows;
}

export function tracePage(png, opt = {}) {
  const cfg = { ...DEFAULTS, ...opt };
  const w = png.width;
  const h = png.height;
  const ink = rasterInk(png, cfg.thresh);
  closeInk(ink, w, h, cfg.close || 0);
  sealToEdge(ink, w, h, cfg.seal);
  const flooded = floodPaper(ink, w, h);
  const paper = absorbPinholes(flooded.labels, ink, flooded.areas, w, h, cfg.pinhole);
  const rawCount = paper.count;
  const radius = componentRadius(paper.labels, paper.count, w, h);
  const edges = borderEdges(paper.labels, paper.count, w, h);
  const eyes = lockEyeWhites(ink, paper.labels, paper.areas, w, h);
  let merged = mergeComponents(paper.count, paper.areas, radius, edges, cfg, eyes);
  let remapped = remapLabels(paper.labels, merged.find, paper.count, w, h);

  // If a tight minimum ate too many regions, relax area/radius and merge again.
  if (remapped.count < cfg.minRegions) {
    const relaxed = {
      ...cfg,
      minArea: Math.max(400, Math.floor(cfg.minArea * 0.45)),
      minRadius: Math.max(6, Math.floor(cfg.minRadius * 0.55)),
    };
    merged = mergeComponents(paper.count, paper.areas, radius, edges, relaxed, eyes);
    remapped = remapLabels(paper.labels, merged.find, paper.count, w, h);
  }

  const labels = remapped.labels;
  assignInk(labels, remapped.count, w, h);
  const inkCopy = ink.slice();
  return {
    w,
    h,
    labels,
    ink: inkCopy,
    count: remapped.count,
    rawCount,
    cfg,
  };
}

export function vectorizePage(traced, eps) {
  const { labels, ink, w, h } = traced;
  const attempts = [eps, Math.max(0.45, eps * 0.6), 0.25];
  let vec = null;
  let used = eps;
  for (const e of attempts) {
    vec = vectorizeLabels(labels, w, h, 1000, e);
    used = e;
    if (vec.size === traced.count) break;
  }
  const poles = distancePoles(labels, w, h, 1000);
  const regions = [];
  for (let id = 0; id < traced.count; id++) {
    const geom = vec.get(id);
    if (!geom) continue;
    let pt = poles.get(id);
    if (!pt || !pointInLoops(pt.x, pt.y, geom.loops)) {
      const fallback = polylabel(geom.loops);
      pt = { x: fallback.x, y: fallback.y };
      if (!pointInLoops(pt.x, pt.y, geom.loops)) pt = sampleInside(geom.loops, labels, id, w, h);
    }
    if (!pt) continue;
    let area = 0;
    for (let i = 0; i < labels.length; i++) if (labels[i] === id) area++;
    regions.push({
      id,
      loops: geom.loops,
      d: geom.path,
      x: pt.x,
      y: pt.y,
      area,
      a: Math.round(Math.abs(ringArea(geom.loops))),
    });
  }

  const inkLabels = new Int32Array(w * h);
  inkLabels.fill(-1);
  for (let i = 0; i < ink.length; i++) if (ink[i]) inkLabels[i] = 0;
  const inkVec = vectorizeLabels(inkLabels, w, h, 1000, Math.min(eps, 0.85));
  const inkGeom = inkVec.get(0);
  const inkPath = inkGeom ? inkGeom.path : "";
  return { regions, eps: used, inkPath, vecCount: vec.size };
}

export function buildLineArtPicture(png, spec) {
  const traced = tracePage(png, spec);
  const drawn = vectorizePage(traced, spec.eps ?? DEFAULTS.eps);
  const colors = spec.paint
    ? drawn.regions.map((region) => {
        const c = spec.paint[region.id];
        if (!Number.isInteger(c) || c < 0 || c >= spec.palette.length) {
          throw new Error(`${spec.id} region ${region.id} has no palette color`);
        }
        return c;
      })
    : regionColor(spec, drawn.regions, traced.labels, traced.w, traced.h);
  const used = [];
  const remap = new Map();
  for (const c of colors) {
    if (!remap.has(c)) {
      remap.set(c, used.length);
      used.push(spec.palette[c]);
    }
  }
  const picture = {
    id: spec.id,
    title: spec.title,
    tier: spec.tier || "little",
    rev: spec.rev || 1,
    viewBox: [0, 0, 1000, 1000],
    palette: used,
    ink: drawn.inkPath,
    regions: drawn.regions.map((region, i) => ({
      c: remap.get(colors[i]),
      d: region.d,
      x: region.x,
      y: region.y,
      loops: region.loops,
    })),
  };
  return { picture, traced, drawn, colors };
}

/**
 * Adults-mode regions from a hand-inked grayscale page.
 *
 * Ink is thresholded and a 1px morphological close seals hairline gaps
 * without leaving strokes thicker. Open paper becomes regions. Pinholes and
 * unpaintable slivers fold into a neighbor, or into the ink when they are
 * trapped in a stroke. The original ink mask is kept as an overlay.
 */
import { rasterInk, closeInk } from "./lineart.mjs";

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
        const step = (nx, ny) => {
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) return;
          const ni = ny * w + nx;
          if (labels[ni] !== -1 || ink[ni]) return;
          labels[ni] = count;
          qx[qe] = nx;
          qy[qe] = ny;
          qe++;
        };
        step(cx - 1, cy);
        step(cx + 1, cy);
        step(cx, cy - 1);
        step(cx, cy + 1);
      }
      areas.push(area);
      count++;
    }
  }
  return { labels, areas, count };
}

function measure(labels, count, w, h) {
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
  const area = new Int32Array(count);
  for (let i = 0; i < n; i++) {
    const id = labels[i];
    if (id < 0) continue;
    area[id]++;
    if (dist[i] > radius[id]) radius[id] = dist[i];
  }
  return { radius, area };
}

function absorbPinholes(labels, ink, count, w, h) {
  const { radius, area } = measure(labels, count, w, h);
  const drop = new Uint8Array(count);
  // Specks trapped in a stroke become ink. Small closed shapes stay regions
  // and merge later only when they are too thin to tap.
  for (let i = 0; i < count; i++) {
    if (radius[i] <= 1 || area[i] < 8) drop[i] = 1;
  }
  for (let i = 0; i < labels.length; i++) {
    const id = labels[i];
    if (id >= 0 && drop[id]) {
      labels[i] = -1;
      ink[i] = 1;
    }
  }
  const map = new Int32Array(count);
  map.fill(-1);
  const nextRadius = [];
  const nextArea = [];
  let next = 0;
  for (let i = 0; i < count; i++) {
    if (drop[i]) continue;
    map[i] = next++;
    nextRadius.push(radius[i]);
    nextArea.push(area[i]);
  }
  for (let i = 0; i < labels.length; i++) {
    if (labels[i] >= 0) labels[i] = map[labels[i]];
  }
  return { labels, count: next, radius: Int32Array.from(nextRadius), area: Int32Array.from(nextArea) };
}

function neighborEdges(labels, count, w, h) {
  const n = w * h;
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
  for (let y = 0; y < h; y++) {
    const row = y * w;
    for (let x = 0; x < w; x++) {
      const id = labels[row + x];
      if (id < 0) continue;
      if (x + 1 < w) add(id, labels[row + x + 1]);
      if (y + 1 < h) add(id, labels[row + w + x]);
    }
  }
  const owner = new Int32Array(n);
  owner.fill(-1);
  const dist = new Uint8Array(n);
  const qx = new Int32Array(n);
  const qy = new Int32Array(n);
  let qt = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (labels[i] >= 0) continue;
      let a = -1;
      let b = -1;
      const see = (nx, ny) => {
        if (nx < 0 || ny < 0 || nx >= w || ny >= h) return;
        const id = labels[ny * w + nx];
        if (id < 0) return;
        if (a < 0) a = id;
        else if (id !== a) b = id;
      };
      see(x - 1, y);
      see(x + 1, y);
      see(x, y - 1);
      see(x, y + 1);
      if (a < 0) continue;
      owner[i] = a;
      dist[i] = 1;
      qx[qt] = x;
      qy[qt] = y;
      qt++;
      if (b >= 0) add(a, b);
    }
  }
  let qh = 0;
  const maxDist = 8;
  while (qh < qt) {
    const x = qx[qh];
    const y = qy[qh];
    qh++;
    const i = y * w + x;
    if (dist[i] >= maxDist) continue;
    const id = owner[i];
    const nd = dist[i] + 1;
    const step = (nx, ny) => {
      if (nx < 0 || ny < 0 || nx >= w || ny >= h) return;
      const ni = ny * w + nx;
      if (labels[ni] >= 0) return;
      if (owner[ni] < 0) {
        owner[ni] = id;
        dist[ni] = nd;
        qx[qt] = nx;
        qy[qt] = ny;
        qt++;
      } else if (owner[ni] !== id) add(id, owner[ni]);
    };
    step(x - 1, y);
    step(x + 1, y);
    step(x, y - 1);
    step(x, y + 1);
  }
  const edges = [];
  for (const [k, len] of tally) {
    const a = (k / count) | 0;
    const b = k % count;
    edges.push([a, b, len]);
  }
  return edges;
}

function mergeSmall(count, areaIn, radiusIn, edges, minRadius) {
  const parent = new Int32Array(count);
  const area = Int32Array.from(areaIn);
  const radius = Int32Array.from(radiusIn);
  const adj = Array.from({ length: count }, () => new Map());
  for (let i = 0; i < count; i++) parent[i] = i;
  for (const [a, b, len] of edges) {
    adj[a].set(b, (adj[a].get(b) || 0) + len);
    adj[b].set(a, (adj[b].get(a) || 0) + len);
  }
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
  const fails = (id) => {
    const r = radius[id];
    if (r < minRadius) return true;
    return r <= 2 && area[id] > r * r * 12;
  };
  function bestNeighbor(id) {
    let best = -1;
    let bestLen = -1;
    let bestArea = -1;
    for (const [n, len] of adj[id]) {
      const rn = find(n);
      if (rn === id) continue;
      const liveLen = len;
      if (liveLen > bestLen || (liveLen === bestLen && area[rn] > bestArea)) {
        bestLen = liveLen;
        best = rn;
        bestArea = area[rn];
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
    if (radius[src] > radius[dst]) radius[dst] = radius[src];
    area[src] = 0;
    for (const [n, len] of adj[src]) {
      const rn = find(n);
      if (rn === dst) continue;
      adj[dst].set(rn, (adj[dst].get(rn) || 0) + len);
      const back = adj[rn];
      const prev = back.get(src) || 0;
      back.delete(src);
      back.set(dst, (back.get(dst) || 0) + Math.max(len, prev));
    }
    adj[src] = new Map();
  }
  const pending = [];
  for (let i = 0; i < count; i++) if (fails(i)) pending.push(i);
  pending.sort((a, b) => area[a] - area[b]);
  for (const id0 of pending) {
    const id = find(id0);
    if (area[id] === 0 || !fails(id)) continue;
    const dst = bestNeighbor(id);
    if (dst < 0) continue;
    merge(id, dst);
  }
  let guard = 0;
  while (guard++ < count) {
    let live = 0;
    let pick = -1;
    for (let i = 0; i < count; i++) {
      if (find(i) !== i || area[i] === 0) continue;
      live++;
      if (!fails(i)) continue;
      if (pick < 0 || area[i] < area[pick]) pick = i;
    }
    if (live <= 2800 && pick < 0) break;
    if (pick < 0 && live > 2600) {
      for (let i = 0; i < count; i++) {
        if (find(i) !== i || area[i] === 0) continue;
        if (pick < 0 || area[i] < area[pick]) pick = i;
      }
    }
    if (pick < 0) break;
    const dst = bestNeighbor(pick);
    if (dst < 0) break;
    merge(pick, dst);
  }
  return { find, area };
}

function remap(labels, find, count) {
  const map = new Map();
  let next = 0;
  const out = new Int32Array(labels.length);
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

function assignInk(labels, w, h) {
  const n = w * h;
  const qx = new Int32Array(n);
  const qy = new Int32Array(n);
  let qh = 0;
  let qt = 0;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      if (labels[i] < 0) continue;
      let edge = x === 0 || y === 0 || x === w - 1 || y === h - 1;
      if (!edge) {
        if (labels[i - 1] < 0 || labels[i + 1] < 0 || labels[i - w] < 0 || labels[i + w] < 0) edge = true;
      }
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
  let fallback = 0;
  for (let i = 0; i < n; i++) {
    if (labels[i] >= 0) {
      fallback = labels[i];
      break;
    }
  }
  for (let i = 0; i < n; i++) if (labels[i] < 0) labels[i] = fallback;
}

export function traceAdult(png, opt = {}) {
  const thresh = opt.thresh ?? 160;
  const close = opt.close ?? 1;
  const minRadius = opt.minRadius ?? 3;
  const w = png.width;
  const h = png.height;
  const ink = rasterInk(png, thresh);
  closeInk(ink, w, h, close);
  const flooded = floodPaper(ink, w, h);
  const kept = absorbPinholes(flooded.labels, ink, flooded.count, w, h);
  const edges = neighborEdges(kept.labels, kept.count, w, h);
  const merged = mergeSmall(kept.count, kept.area, kept.radius, edges, minRadius);
  const remapped = remap(kept.labels, merged.find, kept.count);
  const inkCopy = ink.slice();
  assignInk(remapped.labels, w, h);
  return {
    w,
    h,
    labels: remapped.labels,
    ink: inkCopy,
    count: remapped.count,
    rawCount: flooded.count,
    minRadius,
  };
}

/** Palette index for a point inside a region. Frame band first, then the smallest zone. */
export function colorAt(nx, ny, zones, frame) {
  const edge = Math.min(nx, ny, 1 - nx, 1 - ny);
  if (frame) {
    if (edge < frame.margin) return frame.marginColor;
    if (edge < frame.band) {
      const band = Math.floor((nx * 5 + ny * 3) * frame.colors.length) % frame.colors.length;
      return frame.colors[band];
    }
  }
  let best = null;
  let bestArea = Infinity;
  for (const zone of zones) {
    const dx = (nx - zone.cx) / zone.rx;
    const dy = (ny - zone.cy) / zone.ry;
    if (dx * dx + dy * dy > 1) continue;
    const area = zone.rx * zone.ry;
    if (area < bestArea) {
      bestArea = area;
      best = zone;
    }
  }
  if (!best) return frame ? frame.fallback : 0;
  if (best.colors.length === 1) return best.colors[0];
  const band = Math.floor(nx * 8 + ny * 5);
  return best.colors[((band % best.colors.length) + best.colors.length) % best.colors.length];
}

export function polesOf(labels, count, w, h) {
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
  const bestD = new Int32Array(count);
  const px = new Int32Array(count);
  const py = new Int32Array(count);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const id = labels[i];
      if (id < 0 || dist[i] < bestD[id]) continue;
      bestD[id] = dist[i];
      px[id] = x;
      py[id] = y;
    }
  }
  return { px, py, radius: bestD };
}

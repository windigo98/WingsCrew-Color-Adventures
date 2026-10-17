/** Connected components, speck merge, and organic splits that keep fine details. */

function findFactory(parent) {
  return function find(a) {
    let r = a;
    while (parent[r] !== r) r = parent[r];
    let x = a;
    while (parent[x] !== x) {
      const n = parent[x];
      parent[x] = r;
      x = n;
    }
    return r;
  };
}

export function buildRegions(srcColors, w, h, opt) {
  const n = w * h;
  const comp = new Int32Array(n);
  comp.fill(-1);
  const compColor = [];
  const compArea = [];
  const qx = new Int32Array(n);
  const qy = new Int32Array(n);
  let compCount = 0;

  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const start = y * w + x;
      if (comp[start] !== -1) continue;
      const color = srcColors[start];
      let qs = 0;
      let qe = 0;
      qx[qe] = x;
      qy[qe] = y;
      qe++;
      comp[start] = compCount;
      let area = 0;
      while (qs < qe) {
        const cx = qx[qs];
        const cy = qy[qs];
        qs++;
        area++;
        if (cx > 0) {
          const ni = cy * w + cx - 1;
          if (comp[ni] === -1 && srcColors[ni] === color) {
            comp[ni] = compCount;
            qx[qe] = cx - 1;
            qy[qe] = cy;
            qe++;
          }
        }
        if (cx + 1 < w) {
          const ni = cy * w + cx + 1;
          if (comp[ni] === -1 && srcColors[ni] === color) {
            comp[ni] = compCount;
            qx[qe] = cx + 1;
            qy[qe] = cy;
            qe++;
          }
        }
        if (cy > 0) {
          const ni = (cy - 1) * w + cx;
          if (comp[ni] === -1 && srcColors[ni] === color) {
            comp[ni] = compCount;
            qx[qe] = cx;
            qy[qe] = cy - 1;
            qe++;
          }
        }
        if (cy + 1 < h) {
          const ni = (cy + 1) * w + cx;
          if (comp[ni] === -1 && srcColors[ni] === color) {
            comp[ni] = compCount;
            qx[qe] = cx;
            qy[qe] = cy + 1;
            qe++;
          }
        }
      }
      compColor.push(color);
      compArea.push(area);
      compCount++;
    }
  }

  const border = new Map();
  const addBorder = (a, b) => {
    if (a === b) return;
    const k = a < b ? a * compCount + b : b * compCount + a;
    border.set(k, (border.get(k) || 0) + 1);
  };
  for (let y = 0; y < h; y++) {
    const row = y * w;
    for (let x = 0; x < w; x++) {
      const a = comp[row + x];
      if (x + 1 < w) addBorder(a, comp[row + x + 1]);
      if (y + 1 < h) addBorder(a, comp[row + w + x]);
    }
  }

  const parent = new Int32Array(compCount);
  for (let i = 0; i < compCount; i++) parent[i] = i;
  const area = Int32Array.from(compArea);
  const color = Int32Array.from(compColor);
  const find = findFactory(parent);

  function buildAdj() {
    const adj = new Map();
    for (const [k, len] of border) {
      const a0 = k % compCount;
      const b0 = (k / compCount) | 0;
      // encoding: smaller * compCount + larger, so b0 is smaller, a0 is larger. See fix in addBorder comment.
      const a = find(b0);
      const b = find(a0);
      if (a === b) continue;
      const ka = a < b ? a : b;
      const kb = a < b ? b : a;
      const kk = ka + "," + kb;
      adj.set(kk, (adj.get(kk) || 0) + len);
    }
    return adj;
  }

  function neighList(id, adj) {
    const out = [];
    for (const [k, len] of adj) {
      const [sa, sb] = k.split(",");
      const a = +sa;
      const b = +sb;
      if (a === id) out.push({ id: b, len });
      else if (b === id) out.push({ id: a, len });
    }
    return out;
  }

  function merge(src, dst) {
    src = find(src);
    dst = find(dst);
    if (src === dst) return;
    parent[src] = dst;
    area[dst] += area[src];
    area[src] = 0;
  }

  function liveIds() {
    const s = [];
    for (let i = 0; i < compCount; i++) if (find(i) === i && area[i] > 0) s.push(i);
    return s;
  }

  // Merge specks into the neighbor they share the longest edge with.
  for (let guard = 0; guard < compCount; guard++) {
    let smallest = -1;
    for (const id of liveIds()) {
      if (area[id] < opt.minArea && (smallest < 0 || area[id] < area[smallest])) smallest = id;
    }
    if (smallest < 0) break;
    const adj = buildAdj();
    const neigh = neighList(smallest, adj);
    if (!neigh.length) break;
    neigh.sort((a, b) => b.len - a.len);
    merge(smallest, neigh[0].id);
  }

  if (!opt.allowSplit) {
    let guard = 0;
    while (liveIds().length > opt.maxRegions && guard++ < compCount) {
      const live = liveIds().sort((a, b) => area[a] - area[b]);
      const id = live[0];
      const adj = buildAdj();
      const neigh = neighList(id, adj);
      if (!neigh.length) break;
      neigh.sort((a, b) => {
        const as = color[a.id] === color[id] ? 1 : 0;
        const bs = color[b.id] === color[id] ? 1 : 0;
        if (as !== bs) return bs - as;
        return b.len - a.len;
      });
      merge(id, neigh[0].id);
    }
  }

  const labels = new Int32Array(n);
  const colorOf = [];

  if (!opt.allowSplit) {
    const map = new Map();
    let next = 0;
    for (const id of liveIds()) map.set(id, next++);
    for (let i = 0; i < n; i++) labels[i] = map.get(find(comp[i]));
    for (const id of liveIds()) colorOf.push(color[id]);
    return { labels, colorOf, count: colorOf.length, components: compCount };
  }

  const buckets = new Map();
  for (const id of liveIds()) buckets.set(id, []);
  for (let i = 0; i < n; i++) buckets.get(find(comp[i])).push(i);

  const reserved = [];
  const large = [];
  for (const id of liveIds()) {
    const pixels = buckets.get(id);
    if (pixels.length < opt.minPiece * 2) reserved.push({ id, pixels });
    else large.push({ id, pixels, pieces: 1 });
  }

  let budget = opt.target - reserved.length;
  if (budget < large.length) budget = large.length;
  const largeArea = large.reduce((s, L) => s + L.pixels.length, 0) || 1;
  let assigned = 0;
  for (let i = 0; i < large.length; i++) {
    const L = large[i];
    const cap = Math.max(1, Math.floor(L.pixels.length / opt.minPiece));
    let pieces;
    if (i === large.length - 1) pieces = budget - assigned;
    else pieces = Math.round((budget * L.pixels.length) / largeArea);
    if (pieces < 1) pieces = 1;
    if (pieces > cap) pieces = cap;
    L.pieces = pieces;
    assigned += pieces;
  }
  // If rounding left us short or long, fix the biggest piece.
  let total = reserved.length + large.reduce((s, L) => s + L.pieces, 0);
  if (large.length && total < opt.target) {
    const big = large.reduce((a, b) => (a.pixels.length > b.pixels.length ? a : b));
    const cap = Math.max(1, Math.floor(big.pixels.length / opt.minPiece));
    const extra = Math.min(cap - big.pieces, opt.target - total);
    if (extra > 0) big.pieces += extra;
  }
  total = reserved.length + large.reduce((s, L) => s + L.pieces, 0);
  if (large.length && total > opt.maxRegions) {
    let over = total - opt.maxRegions;
    const order = large.slice().sort((a, b) => b.pieces - a.pieces);
    for (const L of order) {
      if (over <= 0) break;
      const cut = Math.min(over, L.pieces - 1);
      L.pieces -= cut;
      over -= cut;
    }
  }

  let next = 0;
  function paintPixels(pixels, regionId) {
    for (const i of pixels) labels[i] = regionId;
  }

  for (const item of reserved) {
    paintPixels(item.pixels, next);
    colorOf.push(color[item.id]);
    next++;
  }

  for (const L of large) {
    const pieces = Math.max(1, L.pieces);
    const groups = splitPixels(L.pixels, pieces, w);
    for (const g of groups) {
      if (!g.length) continue;
      paintPixels(g, next);
      colorOf.push(color[L.id]);
      next++;
    }
  }

  return { labels, colorOf, count: next, components: compCount };
}

function splitPixels(pixels, pieces, w) {
  if (pieces <= 1 || pixels.length === 0) return [pixels];
  const poolStep = pixels.length > 20000 ? 4 : pixels.length > 8000 ? 2 : 1;
  const pool = [];
  for (let i = 0; i < pixels.length; i += poolStep) pool.push(pixels[i]);
  const k = Math.min(pieces, pool.length);
  const seeds = [pool[(pool.length / 2) | 0]];
  const dist = new Float64Array(pool.length);
  dist.fill(1e18);
  while (seeds.length < k) {
    const last = seeds[seeds.length - 1];
    const lx = last % w;
    const ly = (last / w) | 0;
    let bestI = 0;
    let bestD = -1;
    for (let i = 0; i < pool.length; i++) {
      const p = pool[i];
      const dx = (p % w) - lx;
      const dy = ((p / w) | 0) - ly;
      const d = dx * dx + dy * dy;
      if (d < dist[i]) dist[i] = d;
      if (dist[i] > bestD) {
        bestD = dist[i];
        bestI = i;
      }
    }
    if (bestD <= 0) break;
    seeds.push(pool[bestI]);
    dist[bestI] = 0;
  }

  const owner = new Int32Array(pixels.length);
  owner.fill(-1);
  const pixIndex = new Map();
  for (let i = 0; i < pixels.length; i++) pixIndex.set(pixels[i], i);

  const queue = new Int32Array(pixels.length);
  let qh = 0;
  let qt = 0;
  const groups = seeds.map(() => []);
  for (let s = 0; s < seeds.length; s++) {
    const pi = pixIndex.get(seeds[s]);
    if (pi == null) continue;
    owner[pi] = s;
    queue[qt++] = pixels[pi];
    groups[s].push(pixels[pi]);
  }
  while (qh < qt) {
    const p = queue[qh++];
    const x = p % w;
    const y = (p / w) | 0;
    const o = owner[pixIndex.get(p)];
    const neigh = [p - 1, p + 1, p - w, p + w];
    // guard horizontal wrap
    if (x === 0) neigh[0] = -1;
    if ((p + 1) % w === 0) neigh[1] = -1;
    for (const nb of neigh) {
      if (nb < 0) continue;
      const ni = pixIndex.get(nb);
      if (ni == null || owner[ni] !== -1) continue;
      owner[ni] = o;
      groups[o].push(nb);
      queue[qt++] = nb;
    }
  }
  // Any missed pixels (shouldn't happen) join the nearest seeded group.
  for (let i = 0; i < pixels.length; i++) {
    if (owner[i] === -1) groups[0].push(pixels[i]);
  }
  return groups.filter((g) => g.length);
}

/** Pole of inaccessibility on the raster, returned in viewBox space. */
export function distancePoles(labels, w, h, viewSize) {
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
    if (x > 0) {
      const ni = i - 1;
      if (dist[ni] === 0 && labels[ni] === id) {
        dist[ni] = nd;
        qx[qt] = x - 1;
        qy[qt] = y;
        qt++;
      }
    }
    if (x + 1 < w) {
      const ni = i + 1;
      if (dist[ni] === 0 && labels[ni] === id) {
        dist[ni] = nd;
        qx[qt] = x + 1;
        qy[qt] = y;
        qt++;
      }
    }
    if (y > 0) {
      const ni = i - w;
      if (dist[ni] === 0 && labels[ni] === id) {
        dist[ni] = nd;
        qx[qt] = x;
        qy[qt] = y - 1;
        qt++;
      }
    }
    if (y + 1 < h) {
      const ni = i + w;
      if (dist[ni] === 0 && labels[ni] === id) {
        dist[ni] = nd;
        qx[qt] = x;
        qy[qt] = y + 1;
        qt++;
      }
    }
  }

  const bestD = new Map();
  const bestP = new Map();
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const i = y * w + x;
      const id = labels[i];
      const d = dist[i];
      if (d > (bestD.get(id) || 0)) {
        bestD.set(id, d);
        bestP.set(id, [x, y]);
      }
    }
  }
  const sx = viewSize / w;
  const sy = viewSize / h;
  const out = new Map();
  for (const [id, p] of bestP) {
    out.set(id, {
      x: Math.round((p[0] + 0.5) * sx * 10) / 10,
      y: Math.round((p[1] + 0.5) * sy * 10) / 10,
    });
  }
  return out;
}

/**
 * Watertight raster-label → polygon conversion.
 * Contours walk the pixel-corner grid so neighboring regions share identical
 * vertices. Chains are simplified once (cached) so both sides stay gap-closed.
 */

function labelAt(labels, w, h, i, j) {
  if (i < 0 || j < 0 || i >= w || j >= h) return -1;
  return labels[j * w + i];
}

function turnRank(prev, cur, next) {
  const ax = cur[0] - prev[0];
  const ay = cur[1] - prev[1];
  const bx = next[0] - cur[0];
  const by = next[1] - cur[1];
  // Signed turn in y-down space. The cycle walker picks the smallest rank.
  return Math.atan2(ax * by - ay * bx, ax * bx + ay * by);
}

function vkey(p) {
  return p[0] + "," + p[1];
}

function rdp(points, eps) {
  if (points.length < 3) return points.slice();
  const eps2 = eps * eps;
  const keep = new Uint8Array(points.length);
  keep[0] = 1;
  keep[points.length - 1] = 1;
  const stack = [[0, points.length - 1]];
  while (stack.length) {
    const [a, b] = stack.pop();
    let maxD = -1;
    let idx = -1;
    const ax = points[a][0];
    const ay = points[a][1];
    const bx = points[b][0];
    const by = points[b][1];
    const abx = bx - ax;
    const aby = by - ay;
    const ab2 = abx * abx + aby * aby || 1;
    for (let i = a + 1; i < b; i++) {
      const px = points[i][0];
      const py = points[i][1];
      const t = ((px - ax) * abx + (py - ay) * aby) / ab2;
      const qx = ax + abx * t;
      const qy = ay + aby * t;
      const d = (px - qx) * (px - qx) + (py - qy) * (py - qy);
      if (d > maxD) {
        maxD = d;
        idx = i;
      }
    }
    if (idx >= 0 && maxD > eps2) {
      keep[idx] = 1;
      stack.push([a, idx], [idx, b]);
    }
  }
  const out = [];
  for (let i = 0; i < points.length; i++) if (keep[i]) out.push(points[i]);
  return out;
}

function samePt(a, b) {
  return a[0] === b[0] && a[1] === b[1];
}

/**
 * @param {Int32Array} labels region id per pixel, -1 outside
 * @returns {Map<number, number[][][]>} region id → list of loops (pixel-corner coords)
 */
export function traceRegions(labels, w, h) {
  /** region id → Map "x,y" → array of [nx, ny] */
  const outgoing = new Map();

  function addEdge(id, ax, ay, bx, by) {
    if (id < 0) return;
    let m = outgoing.get(id);
    if (!m) outgoing.set(id, (m = new Map()));
    const k = ax + "," + ay;
    let arr = m.get(k);
    if (!arr) m.set(k, (arr = []));
    arr.push([bx, by]);
  }

  for (let y = 0; y <= h; y++) {
    for (let x = 0; x < w; x++) {
      const above = labelAt(labels, w, h, x, y - 1);
      const below = labelAt(labels, w, h, x, y);
      if (above === below) continue;
      addEdge(above, x, y, x + 1, y);
      addEdge(below, x + 1, y, x, y);
    }
  }
  for (let x = 0; x <= w; x++) {
    for (let y = 0; y < h; y++) {
      const left = labelAt(labels, w, h, x - 1, y);
      const right = labelAt(labels, w, h, x, y);
      if (left === right) continue;
      addEdge(right, x, y, x, y + 1);
      addEdge(left, x, y + 1, x, y);
    }
  }

  const loops = new Map();
  for (const [id, starts] of outgoing) {
    const used = new Set();
    const list = [];
    for (const [sk, ends] of starts) {
      for (const end0 of ends) {
        const [sx, sy] = sk.split(",").map(Number);
        const startKey = sx + "," + sy + ">" + end0[0] + "," + end0[1];
        if (used.has(startKey)) continue;
        const pts = [[sx, sy]];
        let prev = [sx, sy];
        let cur = end0;
        used.add(startKey);
        let guard = 0;
        const limit = (w + 1) * (h + 1) * 2;
        while (guard++ < limit) {
          pts.push([cur[0], cur[1]]);
          if (cur[0] === sx && cur[1] === sy) break;
          const options = starts.get(cur[0] + "," + cur[1]);
          if (!options || !options.length) break;
          let best = null;
          let bestScore = Infinity;
          for (const nxt of options) {
            const ek = cur[0] + "," + cur[1] + ">" + nxt[0] + "," + nxt[1];
            if (used.has(ek)) continue;
            // Most clockwise continuation (smallest right-turn score, i.e. most negative? 
            // we try the minimum cross — left-most — and flip if tests fail).
            const score = turnRank(prev, cur, nxt);
            if (score < bestScore) {
              bestScore = score;
              best = nxt;
            }
          }
          if (!best) break;
          used.add(cur[0] + "," + cur[1] + ">" + best[0] + "," + best[1]);
          prev = cur;
          cur = best;
        }
        if (pts.length >= 4 && pts[0][0] === pts[pts.length - 1][0] && pts[0][1] === pts[pts.length - 1][1]) {
          pts.pop();
          if (pts.length >= 3) list.push(pts);
        }
      }
    }
    if (list.length) loops.set(id, list);
  }
  return loops;
}

function simplifyAll(loopsById, eps) {
  const degree = new Map();
  const seenE = new Set();
  for (const loops of loopsById.values()) {
    for (const loop of loops) {
      for (let i = 0; i < loop.length; i++) {
        const a = loop[i];
        const b = loop[(i + 1) % loop.length];
        const k1 = vkey(a);
        const k2 = vkey(b);
        const e = k1 < k2 ? k1 + "~" + k2 : k2 + "~" + k1;
        if (seenE.has(e)) continue;
        seenE.add(e);
        degree.set(k1, (degree.get(k1) || 0) + 1);
        degree.set(k2, (degree.get(k2) || 0) + 1);
      }
    }
  }

  const cache = new Map();
  function simplifyChain(chain) {
    const fwd = chain.map(vkey).join(";");
    const revPts = chain.slice().reverse();
    const rev = revPts.map(vkey).join(";");
    const forward = fwd <= rev;
    const canon = forward ? fwd : rev;
    if (!cache.has(canon)) {
      cache.set(canon, rdp(forward ? chain : revPts, eps));
    }
    const simp = cache.get(canon);
    return forward ? simp.map((p) => p.slice()) : simp.slice().reverse().map((p) => p.slice());
  }

  const out = new Map();
  for (const [id, loops] of loopsById) {
    const simplified = [];
    for (const loop of loops) {
      const isJ = loop.map((p) => (degree.get(vkey(p)) || 0) !== 2);
      if (!isJ.some(Boolean)) {
        let m = 0;
        for (let i = 1; i < loop.length; i++) {
          if (loop[i][1] < loop[m][1] || (loop[i][1] === loop[m][1] && loop[i][0] < loop[m][0])) m = i;
        }
        const rot = loop.slice(m).concat(loop.slice(0, m));
        rot.push(rot[0]);
        const simp = simplifyChain(rot);
        if (simp.length && samePt(simp[0], simp[simp.length - 1])) simp.pop();
        if (simp.length >= 3) simplified.push(simp);
        continue;
      }
      const js = [];
      for (let i = 0; i < isJ.length; i++) if (isJ[i]) js.push(i);
      const joined = [];
      for (let k = 0; k < js.length; k++) {
        const i0 = js[k];
        const i1 = js[(k + 1) % js.length];
        const chain = [];
        for (let i = i0; ; i = (i + 1) % loop.length) {
          chain.push(loop[i]);
          if (i === i1) break;
          if (chain.length > loop.length + 2) break;
        }
        const simp = simplifyChain(chain);
        for (const p of simp) {
          if (joined.length && samePt(joined[joined.length - 1], p)) continue;
          joined.push(p);
        }
      }
      if (joined.length && samePt(joined[0], joined[joined.length - 1])) joined.pop();
      if (joined.length >= 3) simplified.push(joined);
    }
    if (simplified.length) out.set(id, simplified);
  }
  return out;
}

function scaleLoops(loopsById, w, h, viewSize) {
  const sx = viewSize / w;
  const sy = viewSize / h;
  const snap = (v) => Math.round(v * 10) / 10;
  const out = new Map();
  for (const [id, loops] of loopsById) {
    const scaled = [];
    for (const loop of loops) {
      const pts = [];
      for (const [x, y] of loop) {
        const p = [snap(x * sx), snap(y * sy)];
        if (pts.length && samePt(pts[pts.length - 1], p)) continue;
        pts.push(p);
      }
      if (pts.length >= 2 && samePt(pts[0], pts[pts.length - 1])) pts.pop();
      if (pts.length >= 3) scaled.push(pts);
    }
    if (scaled.length) out.set(id, scaled);
  }
  return out;
}

export function loopsToPath(loops) {
  let d = "";
  for (const loop of loops) {
    d += `M${loop[0][0]} ${loop[0][1]}`;
    for (let i = 1; i < loop.length; i++) d += `L${loop[i][0]} ${loop[i][1]}`;
    d += "Z";
  }
  return d;
}

/**
 * Trace, simplify, and scale. eps is in source pixels.
 * Returns Map id → { loops, path } in viewBox space.
 */
export function vectorizeLabels(labels, w, h, viewSize = 1000, eps = 0.8) {
  const raw = traceRegions(labels, w, h);
  const simp = simplifyAll(raw, eps);
  for (const [id, loops] of raw) {
    if (!simp.has(id)) simp.set(id, loops);
  }
  const scaled = scaleLoops(simp, w, h, viewSize);
  if (eps > 0) {
    const rawScaled = scaleLoops(raw, w, h, viewSize);
    for (const [id, loops] of rawScaled) {
      if (!scaled.has(id)) scaled.set(id, loops);
    }
  }
  const result = new Map();
  for (const [id, loops] of scaled) {
    result.set(id, { loops, path: loopsToPath(loops) });
  }
  return result;
}

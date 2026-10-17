export function shoelace(ring) {
  let a = 0;
  for (let i = 0, n = ring.length; i < n; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[(i + 1) % n];
    a += x1 * y2 - x2 * y1;
  }
  return a / 2;
}

export function ringArea(rings) {
  if (!rings?.length) return 0;
  let a = Math.abs(shoelace(rings[0]));
  for (let i = 1; i < rings.length; i++) a -= Math.abs(shoelace(rings[i]));
  return Math.abs(a);
}

export function rayHits(x, y, ring) {
  let inside = false;
  for (let i = 0, n = ring.length; i < n; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[(i + 1) % n];
    if (y1 === y2) continue;
    const minY = y1 < y2 ? y1 : y2;
    const maxY = y1 < y2 ? y2 : y1;
    if (y < minY || y >= maxY) continue;
    const t = (y - y1) / (y2 - y1);
    const xInt = x1 + t * (x2 - x1);
    if (xInt > x) inside = !inside;
  }
  return inside;
}

export function pointInLoops(x, y, loops) {
  let inside = false;
  for (const ring of loops) {
    if (rayHits(x, y, ring)) inside = !inside;
  }
  return inside;
}

function distToSeg(px, py, ax, ay, bx, by) {
  const abx = bx - ax;
  const aby = by - ay;
  const ab2 = abx * abx + aby * aby || 1;
  let t = ((px - ax) * abx + (py - ay) * aby) / ab2;
  if (t < 0) t = 0;
  else if (t > 1) t = 1;
  const qx = ax + abx * t;
  const qy = ay + aby * t;
  return Math.hypot(px - qx, py - qy);
}

export function distToLoops(x, y, loops) {
  let d = Infinity;
  for (const ring of loops) {
    for (let i = 0, n = ring.length; i < n; i++) {
      const [x1, y1] = ring[i];
      const [x2, y2] = ring[(i + 1) % n];
      const dd = distToSeg(x, y, x1, y1, x2, y2);
      if (dd < d) d = dd;
    }
  }
  return d;
}

/** Pole of inaccessibility via a coarse grid refined a few times. */
export function polylabel(loops) {
  const ring = loops[0];
  let minX = Infinity;
  let minY = Infinity;
  let maxX = -Infinity;
  let maxY = -Infinity;
  for (const [x, y] of ring) {
    if (x < minX) minX = x;
    if (y < minY) minY = y;
    if (x > maxX) maxX = x;
    if (y > maxY) maxY = y;
  }
  let cx = 0;
  let cy = 0;
  for (const [x, y] of ring) {
    cx += x;
    cy += y;
  }
  cx /= ring.length;
  cy /= ring.length;

  let best = null;
  let bestD = -Infinity;
  function consider(x, y) {
    if (!pointInLoops(x, y, loops)) return;
    const d = distToLoops(x, y, loops);
    if (d > bestD) {
      bestD = d;
      best = [x, y];
    }
  }
  consider(cx, cy);
  const w = Math.max(1, maxX - minX);
  const h = Math.max(1, maxY - minY);
  let step = Math.max(w, h) / 7;
  for (let iter = 0; iter < 4; iter++) {
    const x0 = best ? best[0] - step * 2 : minX;
    const y0 = best ? best[1] - step * 2 : minY;
    const x1 = best ? best[0] + step * 2 : maxX;
    const y1 = best ? best[1] + step * 2 : maxY;
    const xa = iter === 0 ? minX : x0;
    const ya = iter === 0 ? minY : y0;
    const xb = iter === 0 ? maxX : x1;
    const yb = iter === 0 ? maxY : y1;
    for (let y = ya; y <= yb; y += step) {
      for (let x = xa; x <= xb; x += step) consider(x, y);
    }
    step = Math.max(step / 3, 0.4);
  }
  if (!best) best = [cx, cy];
  return { x: Math.round(best[0] * 10) / 10, y: Math.round(best[1] * 10) / 10, d: bestD };
}

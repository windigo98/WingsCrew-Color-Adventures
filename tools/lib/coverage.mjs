import { pointInLoops } from "../../js/geom.js";

/** Sample the viewBox. A cell counts as a gap only when the center misses. */
export function coverage(regions, res = 200, viewW = 1000, viewH = viewW) {
  const cellX = viewW / 20;
  const cellY = viewH / 20;
  const grid = new Map();
  const boxes = regions.map((r, idx) => {
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
    const gx0 = Math.max(0, Math.floor(x0 / cellX));
    const gy0 = Math.max(0, Math.floor(y0 / cellY));
    const gx1 = Math.min(19, Math.floor(x1 / cellX));
    const gy1 = Math.min(19, Math.floor(y1 / cellY));
    for (let gy = gy0; gy <= gy1; gy++) {
      for (let gx = gx0; gx <= gx1; gx++) {
        const k = gx + gy * 20;
        let bucket = grid.get(k);
        if (!bucket) grid.set(k, (bucket = []));
        bucket.push(idx);
      }
    }
    return { x0, y0, x1, y1, loops: r.loops };
  });

  let miss = 0;
  let multi = 0;
  const stepX = viewW / res;
  const stepY = viewH / res;
  for (let j = 0; j < res; j++) {
    const y = (j + 0.5) * stepY;
    const gy = Math.min(19, Math.floor(y / cellY));
    for (let i = 0; i < res; i++) {
      const x = (i + 0.5) * stepX;
      const gx = Math.min(19, Math.floor(x / cellX));
      const bucket = grid.get(gx + gy * 20) || [];
      let hits = 0;
      for (const idx of bucket) {
        const b = boxes[idx];
        if (x < b.x0 || x > b.x1 || y < b.y0 || y > b.y1) continue;
        if (pointInLoops(x, y, b.loops)) hits++;
        if (hits > 1) break;
      }
      if (hits === 0) miss++;
      else if (hits > 1) multi++;
    }
  }
  return { miss, multi, total: res * res, regions: regions.length };
}

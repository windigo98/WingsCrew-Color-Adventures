/** Flat-color software painter. Every pixel is a palette index. No antialiasing. */

export function createPainter(w, h) {
  const data = new Uint16Array(w * h);

  function set(x, y, c) {
    if (x < 0 || y < 0 || x >= w || y >= h) return;
    data[(y | 0) * w + (x | 0)] = c;
  }

  function fillRect(x0, y0, x1, y1, c) {
    const xa = Math.max(0, Math.floor(Math.min(x0, x1)));
    const xb = Math.min(w - 1, Math.ceil(Math.max(x0, x1)));
    const ya = Math.max(0, Math.floor(Math.min(y0, y1)));
    const yb = Math.min(h - 1, Math.ceil(Math.max(y0, y1)));
    for (let y = ya; y <= yb; y++) {
      const row = y * w;
      for (let x = xa; x <= xb; x++) data[row + x] = c;
    }
  }

  function fillCircle(cx, cy, r, c) {
    if (r <= 0) return;
    const r2 = r * r;
    const y0 = Math.max(0, Math.floor(cy - r));
    const y1 = Math.min(h - 1, Math.ceil(cy + r));
    const x0 = Math.max(0, Math.floor(cx - r));
    const x1 = Math.min(w - 1, Math.ceil(cx + r));
    for (let y = y0; y <= y1; y++) {
      const dy = y + 0.5 - cy;
      const row = y * w;
      for (let x = x0; x <= x1; x++) {
        const dx = x + 0.5 - cx;
        if (dx * dx + dy * dy <= r2) data[row + x] = c;
      }
    }
  }

  function fillEllipse(cx, cy, rx, ry, rot, c) {
    if (rx <= 0 || ry <= 0) return;
    const cos = Math.cos(rot || 0);
    const sin = Math.sin(rot || 0);
    const ext = Math.ceil(Math.max(rx, ry));
    const y0 = Math.max(0, Math.floor(cy - ext));
    const y1 = Math.min(h - 1, Math.ceil(cy + ext));
    const x0 = Math.max(0, Math.floor(cx - ext));
    const x1 = Math.min(w - 1, Math.ceil(cx + ext));
    const irx = 1 / (rx * rx);
    const iry = 1 / (ry * ry);
    for (let y = y0; y <= y1; y++) {
      const row = y * w;
      for (let x = x0; x <= x1; x++) {
        const dx = x + 0.5 - cx;
        const dy = y + 0.5 - cy;
        const lx = cos * dx + sin * dy;
        const ly = -sin * dx + cos * dy;
        if (lx * lx * irx + ly * ly * iry <= 1) data[row + x] = c;
      }
    }
  }

  function fillPolygon(pts, c) {
    if (!pts || pts.length < 3) return;
    let minY = Infinity;
    let maxY = -Infinity;
    for (const p of pts) {
      if (p[1] < minY) minY = p[1];
      if (p[1] > maxY) maxY = p[1];
    }
    const y0 = Math.max(0, Math.floor(minY));
    const y1 = Math.min(h - 1, Math.ceil(maxY));
    for (let y = y0; y <= y1; y++) {
      const scanY = y + 0.5;
      const xs = [];
      for (let i = 0, n = pts.length; i < n; i++) {
        const [x1, y1] = pts[i];
        const [x2, y2] = pts[(i + 1) % n];
        if (y1 === y2) continue;
        const ymin = y1 < y2 ? y1 : y2;
        const ymax = y1 < y2 ? y2 : y1;
        if (scanY < ymin || scanY >= ymax) continue;
        const t = (scanY - y1) / (y2 - y1);
        xs.push(x1 + t * (x2 - x1));
      }
      xs.sort((a, b) => a - b);
      const row = y * w;
      for (let i = 0; i + 1 < xs.length; i += 2) {
        const left = Math.max(0, Math.ceil(xs[i] - 0.5));
        const right = Math.min(w - 1, Math.floor(xs[i + 1] - 0.5));
        for (let x = left; x <= right; x++) data[row + x] = c;
      }
    }
  }

  function fillCapsule(x0, y0, x1, y1, r, c) {
    fillCircle(x0, y0, r, c);
    fillCircle(x1, y1, r, c);
    const dx = x1 - x0;
    const dy = y1 - y0;
    const len = Math.hypot(dx, dy) || 1;
    const px = (-dy / len) * r;
    const py = (dx / len) * r;
    fillPolygon(
      [
        [x0 + px, y0 + py],
        [x1 + px, y1 + py],
        [x1 - px, y1 - py],
        [x0 - px, y0 - py],
      ],
      c
    );
  }

  function strokePolyline(pts, width, c) {
    const r = width / 2;
    for (let i = 0; i < pts.length - 1; i++) {
      fillCapsule(pts[i][0], pts[i][1], pts[i + 1][0], pts[i + 1][1], r, c);
    }
  }

  function blob(cx, cy, r, c, seed = 1, squash = 1, n = 16) {
    const pts = [];
    let s = seed >>> 0 || 1;
    const rnd = () => {
      s = (Math.imul(s, 1664525) + 1013904223) >>> 0;
      return s / 4294967296;
    };
    for (let i = 0; i < n; i++) {
      const a = (i / n) * Math.PI * 2;
      const rr = r * (0.84 + rnd() * 0.28);
      pts.push([cx + Math.cos(a) * rr, cy + Math.sin(a) * rr * squash]);
    }
    fillPolygon(pts, c);
  }

  return { data, w, h, set, fillRect, fillCircle, fillEllipse, fillPolygon, fillCapsule, strokePolyline, blob };
}

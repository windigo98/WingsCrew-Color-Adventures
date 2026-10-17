/** Shared shapes for the original WingsCrew pages. Coordinates are 0–1000. */

export function kit(p, S) {
  const api = {
    p,
    S,
    bg(c) {
      p.fillRect(0, 0, p.w, p.h, c);
    },
    circ(x, y, r, c) {
      p.fillCircle(S(x), S(y), S(r), c);
    },
    ell(x, y, rx, ry, c, rot = 0) {
      p.fillEllipse(S(x), S(y), S(rx), S(ry), rot, c);
    },
    poly(pts, c) {
      p.fillPolygon(
        pts.map(([x, y]) => [S(x), S(y)]),
        c
      );
    },
    blob(x, y, r, c, seed = 1, squash = 1) {
      p.blob(S(x), S(y), S(r), c, seed, squash, 14);
    },
    cap(x0, y0, x1, y1, r, c) {
      p.fillCapsule(S(x0), S(y0), S(x1), S(y1), S(r), c);
    },
    line(pts, w, c) {
      p.strokePolyline(
        pts.map(([x, y]) => [S(x), S(y)]),
        S(w),
        c
      );
    },
    star(x, y, r, c, points = 5) {
      const pts = [];
      for (let i = 0; i < points * 2; i++) {
        const a = -Math.PI / 2 + (i / (points * 2)) * Math.PI * 2;
        const rad = i % 2 === 0 ? r : r * 0.42;
        pts.push([x + Math.cos(a) * rad, y + Math.sin(a) * rad]);
      }
      api.poly(pts, c);
    },
    flower(x, y, r, petal, center) {
      for (let i = 0; i < 6; i++) {
        const a = (i / 6) * Math.PI * 2;
        api.ell(x + Math.cos(a) * r * 0.7, y + Math.sin(a) * r * 0.7, r * 0.48, r * 0.28, petal, a);
      }
      api.circ(x, y, r * 0.38, center);
    },
    cloud(x, y, s, c) {
      api.circ(x, y, s, c);
      api.circ(x - s * 0.7, y + s * 0.15, s * 0.72, c);
      api.circ(x + s * 0.75, y + s * 0.1, s * 0.66, c);
      api.circ(x - s * 0.1, y - s * 0.45, s * 0.62, c);
    },
    tree(x, base, h, leaf, leaf2, trunk) {
      api.cap(x, base, x, base - h * 0.58, Math.max(6, h * 0.07), trunk);
      api.circ(x, base - h * 0.78, h * 0.3, leaf);
      api.circ(x - h * 0.22, base - h * 0.58, h * 0.22, leaf2);
      api.circ(x + h * 0.2, base - h * 0.52, h * 0.2, leaf);
    },
    pine(x, base, h, leaf, trunk) {
      api.cap(x, base, x, base - h * 0.2, h * 0.06, trunk);
      api.poly(
        [
          [x, base - h],
          [x - h * 0.42, base - h * 0.28],
          [x + h * 0.42, base - h * 0.28],
        ],
        leaf
      );
      api.poly(
        [
          [x, base - h * 0.62],
          [x - h * 0.34, base - h * 0.05],
          [x + h * 0.34, base - h * 0.05],
        ],
        leaf
      );
    },
    hill(x, y, rx, ry, c) {
      api.ell(x, y, rx, ry, c);
    },
    crescent(x, y, r, moon, sky) {
      api.circ(x, y, r, moon);
      api.circ(x + r * 0.42, y - r * 0.08, r * 0.78, sky);
    },
    window(x, y, w, h, c) {
      api.poly(
        [
          [x, y],
          [x + w, y],
          [x + w, y + h],
          [x, y + h],
        ],
        c
      );
    },
    tri(x, y, w, h, c) {
      api.poly(
        [
          [x, y],
          [x + w / 2, y - h],
          [x + w, y],
        ],
        c
      );
    },
  };
  return api;
}

export function swatch(hex, name) {
  return { hex, name };
}

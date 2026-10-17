import { polylabel, pointInLoops, ringArea } from "../../js/geom.js";

const R = (n) => Math.round(n * 10) / 10;

function squareRadius(theta) {
  const half = 500;
  return half / Math.max(Math.abs(Math.cos(theta)), Math.abs(Math.sin(theta)), 1e-6);
}

function dedupe(pts) {
  const out = [];
  for (const p of pts) {
    if (out.length && out[out.length - 1][0] === p[0] && out[out.length - 1][1] === p[1]) continue;
    out.push(p);
  }
  if (out.length > 2 && out[0][0] === out[out.length - 1][0] && out[0][1] === out[out.length - 1][1]) out.pop();
  return out;
}

function sector(cx, cy, inner, outer, a0, a1, samples) {
  const pts = [];
  const n = Math.max(1, samples);
  for (let s = 0; s <= n; s++) {
    const a = a0 + ((a1 - a0) * s) / n;
    const r = outer(a);
    pts.push([R(cx + Math.cos(a) * r), R(cy + Math.sin(a) * r)]);
  }
  const i0 = inner(a0);
  const i1 = inner(a1);
  if (i0 < 1 && i1 < 1) {
    pts.push([R(cx), R(cy)]);
  } else {
    for (let s = n; s >= 0; s--) {
      const a = a0 + ((a1 - a0) * s) / n;
      const r = inner(a);
      pts.push([R(cx + Math.cos(a) * r), R(cy + Math.sin(a) * r)]);
    }
  }
  return dedupe(pts);
}

function loopsToPath(loops) {
  let d = "";
  for (const loop of loops) {
    d += `M${loop[0][0]} ${loop[0][1]}`;
    for (let i = 1; i < loop.length; i++) d += `L${loop[i][0]} ${loop[i][1]}`;
    d += "Z";
  }
  return d;
}

/**
 * rows: { thickness, amp, freq, phase, step, paint(i, count, angle, ring) }
 * The outer edge is always strictly outside the inner edge.
 */
function expandEntry(entry) {
  if (!entry.aim) return entry;
  const fine = entry.fine;
  const paints = entry.palette.length;
  const rings = entry.rings.map((r) => ({ ...r }));
  const baseRadius = rings.reduce((s, r) => s + r.thickness + (r.amp || 0), 0) || 1;
  const scale = Math.min(1.7, 280 / baseRadius);
  if (scale > 1.05) {
    for (const r of rings) r.thickness *= scale;
  }
  const count = () => rings.reduce((s, r) => s + Math.floor(fine / r.step), 0) + Math.floor(fine / entry.frameStep);
  const radius = () => rings.reduce((s, r) => s + r.thickness + (r.amp || 0), 0);
  const max = entry.maxCount || entry.aim + 500;
  let guard = 0;
  while (count() + fine <= max && count() < entry.aim && radius() < 460 && guard++ < 20) {
    const phase = guard * 0.4;
    const freq = guard % 2 === 0 ? 8 : 12;
    const t = 14 + (guard % 3) * 4;
    const paint = (i, c) => {
      const on = petal(freq, 0.44)(i, c);
      const shift = (guard * 2) % paints;
      return on ? shift : (shift + 2) % paints;
    };
    rings.push(row(t, Math.min(7, t * 0.22), freq, phase, 1, paint));
  }
  return { ...entry, rings };
}

export function buildMandala(entry) {
  entry = expandEntry(entry);
  const fine = entry.fine;
  const cx = 500;
  const cy = 500;
  let inner = () => 0;
  const rings = [];
  for (const row of entry.rings) {
    const baseInner = inner;
    const thickness = row.thickness;
    const amp = row.amp || 0;
    const freq = row.freq || 0;
    const phase = row.phase || 0;
    const outer = (th) => baseInner(th) + thickness + (freq ? amp * (0.5 + 0.5 * Math.sin(freq * th + phase)) : 0);
    rings.push({ inner: baseInner, outer, step: row.step, paint: row.paint });
    inner = outer;
  }
  let maxInner = 0;
  for (let k = 0; k < 48; k++) maxInner = Math.max(maxInner, inner((k / 48) * Math.PI * 2));
  if (maxInner > 496) throw new Error(`${entry.id} inner radius ${maxInner.toFixed(1)} crosses the page edge`);
  rings.push({
    inner,
    outer: squareRadius,
    step: entry.frameStep,
    paint: entry.framePaint,
  });

  const regions = [];
  rings.forEach((ring, ri) => {
    const count = Math.floor(fine / ring.step);
    for (let i = 0; i < count; i++) {
      const a0 = (i * ring.step * Math.PI * 2) / fine - Math.PI / 2;
      const a1 = ((i + 1) * ring.step * Math.PI * 2) / fine - Math.PI / 2;
      const pts = sector(cx, cy, ring.inner, ring.outer, a0, a1, ring.step);
      if (pts.length < 3) continue;
      const mid = (a0 + a1) / 2;
      const c = ring.paint(i, count, mid, ri);
      const loops = [pts];
      let label = polylabel(loops);
      if (!pointInLoops(label.x, label.y, loops)) {
        let sx = 0;
        let sy = 0;
        for (const p of pts) {
          sx += p[0];
          sy += p[1];
        }
        label = { x: R(sx / pts.length), y: R(sy / pts.length) };
      }
      regions.push({
        c,
        d: loopsToPath(loops),
        x: label.x,
        y: label.y,
        loops,
        a: Math.round(Math.abs(ringArea(loops))),
      });
    }
  });

  const used = [];
  const remap = new Map();
  for (const r of regions) {
    if (!remap.has(r.c)) {
      remap.set(r.c, used.length);
      used.push(entry.palette[r.c]);
    }
  }
  for (const r of regions) r.c = remap.get(r.c);

  return {
    id: entry.id,
    title: entry.title,
    tier: entry.tier,
    palette: used,
    regions,
    builtCount: regions.length,
    components: regions.length,
    missingLabel: regions.some((r) => !pointInLoops(r.x, r.y, r.loops)) ? 1 : 0,
    eps: 0,
    mandala: true,
  };
}

function petal(sym, width = 0.42) {
  return (i, count) => {
    const pos = ((i + 0.5) / count) * sym;
    const frac = Math.abs((pos % 1) - 0.5) * 2;
    return frac < width;
  };
}

const C = {
  ink: ["#1B2430", "Ink"],
  night: ["#1C2340", "Night"],
  navy: ["#243E73", "Navy"],
  cobalt: ["#2F5DA8", "Cobalt"],
  sky: ["#8ECAE6", "Sky"],
  mist: ["#D7E7F2", "Mist"],
  cream: ["#FFF6E4", "Cream"],
  gold: ["#E6B325", "Gold"],
  amber: ["#F4A261", "Amber"],
  orange: ["#E86A17", "Orange"],
  rust: ["#C4451E", "Rust"],
  ruby: ["#C1292E", "Ruby"],
  rose: ["#E56B8A", "Rose"],
  blush: ["#F6C6D0", "Blush"],
  plum: ["#6C3B8A", "Plum"],
  lilac: ["#C9B6E4", "Lilac"],
  indigo: ["#3D348B", "Indigo"],
  teal: ["#1A9B8E", "Teal"],
  sea: ["#1F6F8B", "Sea"],
  foam: ["#D8F3F0", "Foam"],
  leaf: ["#2F9E5B", "Leaf"],
  pine: ["#1B6B45", "Pine"],
  moon: ["#F4EFE0", "Moon"],
};

function pal(...keys) {
  return keys.map((k) => ({ hex: C[k][0], name: C[k][1] }));
}

function row(thickness, amp, freq, phase, step, paint) {
  return { thickness, amp, freq, phase, step, paint };
}

/** Eight pattern pages plus the starter mandala. Counts are fixed by the ring math. */
export function mandalaEntries() {
  const lotusPetal = petal(8, 0.5);
  const star8 = petal(8, 0.28);
  const star12 = petal(12, 0.34);
  const star6 = petal(6, 0.4);
  const star10 = petal(10, 0.3);
  const star16 = petal(16, 0.36);

  const lotus = {
    id: "lotus-dawn",
    pack: "mandalas",
    title: "Lotus Dawn",
    tier: "adult",
    minCount: 1000,
    aim: 1600,
    maxCount: 2100,
    fine: 120,
    frameStep: 5,
    palette: pal("cream", "blush", "rose", "ruby", "gold", "amber", "leaf", "pine", "sky", "navy"),
    framePaint: (i) => (i % 2 === 0 ? 0 : 8),
    rings: [
      row(28, 0, 0, 0, 8, () => 4),
      row(18, 6, 8, 0, 4, (i, n) => (lotusPetal(i, n) ? 2 : 1)),
      row(16, 0, 0, 0, 3, (i) => (i % 2 ? 5 : 4)),
      row(22, 10, 8, 0, 2, (i, n) => (lotusPetal(i, n) ? 3 : 6)),
      row(14, 0, 0, 0, 2, (i) => (i % 3 === 0 ? 4 : 0)),
      row(26, 12, 8, 0.4, 1, (i, n) => (lotusPetal(i, n) ? 2 : 7)),
      row(12, 0, 0, 0, 1, (i) => (i % 2 ? 5 : 1)),
      row(24, 8, 16, 0, 1, (i, n) => (star16(i, n) ? 4 : 6)),
      row(18, 0, 0, 0, 1, (i, n) => (lotusPetal(i, n) ? 3 : 0)),
      row(20, 9, 8, 1, 1, (i, n) => (lotusPetal(i, n) ? 2 : 9)),
    ],
  };

  const star = {
    id: "star-gate",
    pack: "mandalas",
    title: "Star Gate",
    tier: "adult",
    minCount: 1000,
    aim: 1800,
    maxCount: 2300,
    fine: 144,
    frameStep: 6,
    palette: pal("night", "indigo", "gold", "cream", "cobalt", "amber", "lilac", "moon"),
    framePaint: (i) => (i % 2 ? 0 : 1),
    rings: [
      row(22, 0, 0, 0, 8, () => 2),
      row(16, 7, 8, 0, 4, (i, n) => (star8(i, n) ? 2 : 4)),
      row(14, 0, 0, 0, 3, (i) => (i % 2 ? 3 : 6)),
      row(20, 8, 8, 0.2, 2, (i, n) => (star8(i, n) ? 5 : 1)),
      row(12, 0, 0, 0, 2, (i) => (i % 4 === 0 ? 2 : 0)),
      row(18, 6, 16, 0, 1, (i, n) => (star16(i, n) ? 2 : 4)),
      row(16, 0, 0, 0, 1, (i, n) => (star8(i, n) ? 3 : 7)),
      row(22, 10, 8, 0.8, 1, (i, n) => (star8(i, n) ? 5 : 1)),
      row(14, 0, 0, 0, 1, (i) => (i % 2 ? 6 : 0)),
      row(18, 5, 12, 0, 1, (i, n) => (star12(i, n) ? 2 : 4)),
    ],
  };

  const sunburst = {
    id: "sunburst-gold",
    pack: "mandalas",
    title: "Sunburst",
    tier: "adult",
    minCount: 1000,
    aim: 1550,
    maxCount: 2000,
    fine: 120,
    frameStep: 4,
    palette: pal("cream", "gold", "amber", "orange", "rust", "sky", "navy", "moon"),
    framePaint: (i) => (i % 2 ? 5 : 0),
    rings: [
      row(26, 0, 0, 0, 6, () => 1),
      row(20, 8, 12, 0, 3, (i, n) => (star12(i, n) ? 2 : 0)),
      row(12, 0, 0, 0, 2, (i) => (i % 2 ? 3 : 1)),
      row(24, 11, 12, 0.3, 2, (i, n) => (star12(i, n) ? 4 : 5)),
      row(14, 0, 0, 0, 1, (i) => (i % 3 === 0 ? 2 : 7)),
      row(22, 7, 24, 0, 1, (i, n) => (petal(24, 0.4)(i, n) ? 1 : 3)),
      row(16, 0, 0, 0, 1, (i, n) => (star12(i, n) ? 2 : 6)),
      row(20, 8, 12, 1, 1, (i, n) => (star12(i, n) ? 4 : 0)),
      row(18, 0, 0, 0, 1, (i) => (i % 2 ? 5 : 1)),
    ],
  };

  const indigo = {
    id: "indigo-kaleido",
    pack: "mandalas",
    title: "Indigo Kaleido",
    tier: "adult",
    minCount: 1000,
    aim: 2200,
    maxCount: 2600,
    fine: 168,
    frameStep: 4,
    palette: pal("cream", "lilac", "plum", "indigo", "cobalt", "teal", "gold", "night"),
    framePaint: (i) => (i % 3 === 0 ? 7 : 0),
    rings: [
      row(20, 0, 0, 0, 6, () => 6),
      row(14, 5, 6, 0, 3, (i, n) => (star6(i, n) ? 2 : 1)),
      row(12, 0, 0, 0, 2, (i) => [3, 4, 5][i % 3]),
      row(18, 8, 6, 0.5, 2, (i, n) => (star6(i, n) ? 6 : 3)),
      row(12, 0, 0, 0, 1, (i) => (i % 2 ? 1 : 4)),
      row(16, 6, 12, 0, 1, (i, n) => (star12(i, n) ? 2 : 7)),
      row(14, 0, 0, 0, 1, (i, n) => (star6(i, n) ? 5 : 0)),
      row(18, 7, 6, 1, 1, (i, n) => (star6(i, n) ? 6 : 3)),
      row(12, 4, 18, 0, 1, (i, n) => (petal(18, 0.33)(i, n) ? 1 : 4)),
      row(16, 0, 0, 0, 1, (i) => (i % 4 === 0 ? 6 : 2)),
    ],
  };

  const rose = {
    id: "rose-window",
    pack: "mandalas",
    title: "Rose Window",
    tier: "adult",
    minCount: 1000,
    aim: 2400,
    maxCount: 2700,
    fine: 180,
    frameStep: 5,
    palette: pal("moon", "ruby", "gold", "cobalt", "cream", "teal", "plum", "navy", "amber"),
    framePaint: (i) => (i % 2 ? 7 : 4),
    rings: [
      row(18, 0, 0, 0, 6, () => 2),
      row(14, 6, 12, 0, 3, (i, n) => (star12(i, n) ? 1 : 3)),
      row(10, 0, 0, 0, 2, (i) => (i % 2 ? 2 : 4)),
      row(16, 7, 12, 0.2, 2, (i, n) => (star12(i, n) ? 5 : 7)),
      row(12, 0, 0, 0, 1, (i) => [1, 3, 6, 8][i % 4]),
      row(14, 5, 12, 0.6, 1, (i, n) => (star12(i, n) ? 2 : 0)),
      row(12, 0, 0, 0, 1, (i, n) => (star12(i, n) ? 1 : 4)),
      row(16, 8, 24, 0, 1, (i, n) => (petal(24, 0.38)(i, n) ? 8 : 3)),
      row(12, 0, 0, 0, 1, (i) => (i % 2 ? 6 : 7)),
      row(14, 4, 12, 1, 1, (i, n) => (star12(i, n) ? 1 : 2)),
    ],
  };

  const ocean = {
    id: "ocean-spiral",
    pack: "mandalas",
    title: "Ocean Spiral",
    tier: "adult",
    minCount: 1000,
    aim: 2000,
    maxCount: 2500,
    fine: 150,
    frameStep: 5,
    palette: pal("foam", "sky", "sea", "navy", "teal", "cream", "gold", "night"),
    framePaint: (i) => (i % 2 ? 3 : 2),
    rings: [
      row(22, 0, 0, 0, 5, () => 6),
      row(14, 5, 5, 0, 3, (i, n, a, ring) => ((i + ring) % 5 < 2 ? 4 : 1)),
      row(12, 0, 0, 0, 2, (i) => [2, 3, 0][i % 3]),
      row(16, 6, 10, 0.4, 2, (i, n) => (star10(i, n) ? 6 : 2)),
      row(12, 0, 0, 0, 1, (i, n, a, ring) => ((i + ring * 2) % 4 === 0 ? 5 : 3)),
      row(14, 4, 15, 0, 1, (i, n) => (petal(15, 0.35)(i, n) ? 4 : 1)),
      row(16, 0, 0, 0, 1, (i, n, a, ring) => ((i + ring) % 3 === 0 ? 6 : 2)),
      row(18, 7, 5, 0.9, 1, (i, n) => (star10(i, n) ? 5 : 7)),
      row(14, 0, 0, 0, 1, (i) => (i % 2 ? 0 : 4)),
    ],
  };

  const ember = {
    id: "ember-geometry",
    pack: "mandalas",
    title: "Ember Geometry",
    tier: "adult",
    minCount: 1000,
    aim: 2450,
    maxCount: 2700,
    fine: 192,
    frameStep: 4,
    palette: pal("night", "rust", "orange", "gold", "cream", "plum", "indigo", "amber"),
    framePaint: (i) => (i % 2 ? 0 : 6),
    rings: [
      row(16, 0, 0, 0, 8, () => 3),
      row(12, 5, 8, 0, 4, (i, n) => (star8(i, n) ? 2 : 5)),
      row(10, 0, 0, 0, 2, (i) => [1, 7, 4][i % 3]),
      row(14, 6, 8, 0.3, 2, (i, n) => (star8(i, n) ? 3 : 0)),
      row(10, 0, 0, 0, 1, (i) => (i % 2 ? 2 : 6)),
      row(12, 4, 16, 0, 1, (i, n) => (star16(i, n) ? 3 : 1)),
      row(12, 0, 0, 0, 1, (i, n) => (star8(i, n) ? 4 : 0)),
      row(14, 6, 8, 0.7, 1, (i, n) => (star8(i, n) ? 7 : 5)),
      row(12, 3, 24, 0, 1, (i, n) => (petal(24, 0.3)(i, n) ? 3 : 6)),
      row(14, 0, 0, 0, 1, (i) => (i % 3 === 0 ? 4 : 1)),
      row(12, 5, 12, 0.2, 1, (i, n) => (star12(i, n) ? 2 : 0)),
    ],
  };

  const moon = {
    id: "moon-petal",
    pack: "mandalas",
    title: "Moon Petal",
    tier: "big",
    minCount: 60,
    aim: 180,
    maxCount: 240,
    fine: 48,
    frameStep: 4,
    palette: pal("night", "moon", "gold", "lilac", "cream", "indigo", "sky"),
    framePaint: (i) => (i % 2 ? 0 : 5),
    rings: [
      row(40, 0, 0, 0, 6, () => 2),
      row(36, 10, 6, 0, 3, (i, n) => (star6(i, n) ? 1 : 3)),
      row(28, 0, 0, 0, 2, (i) => (i % 2 ? 4 : 6)),
      row(34, 12, 6, 0.4, 2, (i, n) => (star6(i, n) ? 2 : 5)),
      row(30, 0, 0, 0, 3, (i, n) => (star6(i, n) ? 1 : 0)),
    ],
  };

  const garden = {
    id: "garden-mandala",
    pack: "starter",
    title: "Garden Mandala",
    tier: "adult",
    minCount: 800,
    aim: 1150,
    maxCount: 1600,
    fine: 96,
    frameStep: 4,
    palette: pal("cream", "leaf", "pine", "gold", "rose", "sky", "navy", "blush"),
    framePaint: (i) => (i % 2 ? 5 : 0),
    rings: [
      row(30, 0, 0, 0, 8, () => 3),
      row(22, 8, 8, 0, 4, (i, n) => (lotusPetal(i, n) ? 4 : 7)),
      row(16, 0, 0, 0, 3, (i) => (i % 2 ? 1 : 2)),
      row(24, 10, 8, 0.2, 2, (i, n) => (lotusPetal(i, n) ? 3 : 5)),
      row(14, 0, 0, 0, 2, (i) => (i % 2 ? 6 : 0)),
      row(22, 8, 8, 0.8, 1, (i, n) => (lotusPetal(i, n) ? 4 : 1)),
      row(18, 0, 0, 0, 1, (i) => (i % 3 === 0 ? 3 : 2)),
      row(20, 6, 16, 0, 1, (i, n) => (star16(i, n) ? 3 : 6)),
    ],
  };

  const ornament = {
    id: "ornament-mandala",
    pack: "christmas",
    title: "Ornament Mandala",
    tier: "adult",
    minCount: 1000,
    aim: 1250,
    maxCount: 1700,
    fine: 120,
    frameStep: 5,
    palette: pal("cream", "ruby", "pine", "gold", "night", "sky", "blush"),
    framePaint: (i) => (i % 2 ? 4 : 0),
    rings: [
      row(26, 0, 0, 0, 8, () => 3),
      row(18, 7, 8, 0, 4, (i, n) => (lotusPetal(i, n) ? 1 : 0)),
      row(14, 0, 0, 0, 3, (i) => (i % 2 ? 2 : 5)),
      row(20, 8, 8, 0.3, 2, (i, n) => (lotusPetal(i, n) ? 3 : 1)),
      row(14, 0, 0, 0, 2, (i) => (i % 2 ? 6 : 4)),
      row(18, 6, 16, 0, 1, (i, n) => (star16(i, n) ? 3 : 2)),
    ],
  };

  const skullRing = {
    id: "skull-mandala",
    pack: "halloween",
    title: "Skull Mandala",
    tier: "adult",
    minCount: 1000,
    aim: 1350,
    maxCount: 1900,
    fine: 120,
    frameStep: 4,
    palette: pal("night", "moon", "orange", "plum", "gold", "indigo", "cream"),
    framePaint: (i) => (i % 2 ? 0 : 5),
    rings: [
      row(24, 0, 0, 0, 6, () => 4),
      row(16, 6, 6, 0, 3, (i, n) => (star6(i, n) ? 1 : 3)),
      row(14, 0, 0, 0, 2, (i) => (i % 2 ? 2 : 0)),
      row(18, 8, 6, 0.4, 2, (i, n) => (star6(i, n) ? 4 : 5)),
      row(12, 0, 0, 0, 1, (i) => (i % 3 === 0 ? 1 : 3)),
      row(16, 5, 12, 0, 1, (i, n) => (star12(i, n) ? 2 : 6)),
    ],
  };

  return [garden, lotus, star, sunburst, indigo, rose, ocean, ember, moon, ornament, skullRing];
}

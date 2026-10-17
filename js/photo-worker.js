import { vectorizeLabels } from "./vectorize.js";
import { polylabel, pointInLoops } from "./geom.js";

function post(msg) {
  self.postMessage(msg);
}

function downscale(src, sw, sh, maxSide) {
  const scale = Math.min(1, maxSide / Math.max(sw, sh));
  const w = Math.max(16, Math.round(sw * scale));
  const h = Math.max(16, Math.round(sh * scale));
  const dst = new Uint8ClampedArray(w * h * 4);
  for (let y = 0; y < h; y++) {
    const sy = Math.min(sh - 1, ((y + 0.5) * sh) / h - 0.5);
    const y0 = Math.max(0, Math.floor(sy));
    const y1 = Math.min(sh - 1, y0 + 1);
    const fy = sy - y0;
    for (let x = 0; x < w; x++) {
      const sx = Math.min(sw - 1, ((x + 0.5) * sw) / w - 0.5);
      const x0 = Math.max(0, Math.floor(sx));
      const x1 = Math.min(sw - 1, x0 + 1);
      const fx = sx - x0;
      const i = (y * w + x) * 4;
      for (let c = 0; c < 4; c++) {
        const p00 = src[(y0 * sw + x0) * 4 + c];
        const p10 = src[(y0 * sw + x1) * 4 + c];
        const p01 = src[(y1 * sw + x0) * 4 + c];
        const p11 = src[(y1 * sw + x1) * 4 + c];
        const top = p00 + (p10 - p00) * fx;
        const bot = p01 + (p11 - p01) * fx;
        dst[i + c] = top + (bot - top) * fy;
      }
    }
  }
  return { data: dst, w, h };
}

function blur(data, w, h) {
  const out = new Uint8ClampedArray(data.length);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      let r = 0;
      let g = 0;
      let b = 0;
      let n = 0;
      for (let dy = -1; dy <= 1; dy++) {
        for (let dx = -1; dx <= 1; dx++) {
          const xx = x + dx;
          const yy = y + dy;
          if (xx < 0 || yy < 0 || xx >= w || yy >= h) continue;
          const i = (yy * w + xx) * 4;
          r += data[i];
          g += data[i + 1];
          b += data[i + 2];
          n++;
        }
      }
      const o = (y * w + x) * 4;
      out[o] = r / n;
      out[o + 1] = g / n;
      out[o + 2] = b / n;
      out[o + 3] = 255;
    }
  }
  return out;
}

function srgbToLab(r, g, b) {
  let R = r / 255;
  let G = g / 255;
  let B = b / 255;
  R = R > 0.04045 ? ((R + 0.055) / 1.055) ** 2.4 : R / 12.92;
  G = G > 0.04045 ? ((G + 0.055) / 1.055) ** 2.4 : G / 12.92;
  B = B > 0.04045 ? ((B + 0.055) / 1.055) ** 2.4 : B / 12.92;
  let x = (R * 0.4124 + G * 0.3576 + B * 0.1805) / 0.95047;
  let y = R * 0.2126 + G * 0.7152 + B * 0.0722;
  let z = (R * 0.0193 + G * 0.1192 + B * 0.9505) / 1.08883;
  const f = (t) => (t > 0.008856 ? Math.cbrt(t) : 7.787 * t + 16 / 116);
  x = f(x);
  y = f(y);
  z = f(z);
  return [116 * y - 16, 500 * (x - y), 200 * (y - z)];
}

function kmeans(data, w, h, k) {
  const n = w * h;
  const labs = new Float32Array(n * 3);
  for (let i = 0; i < n; i++) {
    const lab = srgbToLab(data[i * 4], data[i * 4 + 1], data[i * 4 + 2]);
    labs[i * 3] = lab[0];
    labs[i * 3 + 1] = lab[1];
    labs[i * 3 + 2] = lab[2];
  }
  const centers = new Float32Array(k * 3);
  const step = Math.max(1, Math.floor(n / k));
  for (let c = 0; c < k; c++) {
    const i = Math.min(n - 1, c * step + ((step / 3) | 0));
    centers[c * 3] = labs[i * 3];
    centers[c * 3 + 1] = labs[i * 3 + 1];
    centers[c * 3 + 2] = labs[i * 3 + 2];
  }
  const assign = new Uint16Array(n);
  for (let iter = 0; iter < 8; iter++) {
    for (let i = 0; i < n; i++) {
      let best = 0;
      let bestD = Infinity;
      const L = labs[i * 3];
      const A = labs[i * 3 + 1];
      const B = labs[i * 3 + 2];
      for (let c = 0; c < k; c++) {
        const dL = L - centers[c * 3];
        const dA = A - centers[c * 3 + 1];
        const dB = B - centers[c * 3 + 2];
        const d = dL * dL + dA * dA + dB * dB;
        if (d < bestD) {
          bestD = d;
          best = c;
        }
      }
      assign[i] = best;
    }
    const sum = new Float64Array(k * 3);
    const count = new Uint32Array(k);
    for (let i = 0; i < n; i++) {
      const c = assign[i];
      sum[c * 3] += labs[i * 3];
      sum[c * 3 + 1] += labs[i * 3 + 1];
      sum[c * 3 + 2] += labs[i * 3 + 2];
      count[c]++;
    }
    for (let c = 0; c < k; c++) {
      if (!count[c]) continue;
      centers[c * 3] = sum[c * 3] / count[c];
      centers[c * 3 + 1] = sum[c * 3 + 1] / count[c];
      centers[c * 3 + 2] = sum[c * 3 + 2] / count[c];
    }
  }
  const rgb = [];
  const seen = new Map();
  const remap = new Uint16Array(k);
  let next = 0;
  for (let c = 0; c < k; c++) {
    let sr = 0;
    let sg = 0;
    let sb = 0;
    let nPix = 0;
    const stride = Math.max(1, Math.floor(n / 8000));
    for (let i = 0; i < n; i += stride) {
      if (assign[i] !== c) continue;
      sr += data[i * 4];
      sg += data[i * 4 + 1];
      sb += data[i * 4 + 2];
      nPix++;
    }
    const hex = nPix
      ? rgbHex((sr / nPix) | 0, (sg / nPix) | 0, (sb / nPix) | 0)
      : "#888888";
    if (!seen.has(hex)) {
      seen.set(hex, next);
      rgb.push(hex);
      remap[c] = next;
      next++;
    } else remap[c] = seen.get(hex);
  }
  const color = new Uint16Array(n);
  for (let i = 0; i < n; i++) color[i] = remap[assign[i]];
  return { color, palette: rgb.map((hex, i) => ({ hex, name: colorName(hex, i) })) };
}

function rgbHex(r, g, b) {
  const h = (v) => v.toString(16).padStart(2, "0");
  return "#" + h(r) + h(g) + h(b);
}

function colorName(hex, index) {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  const max = Math.max(r, g, b);
  const min = Math.min(r, g, b);
  if (max - min < 18) {
    if (max > 220) return "Cream";
    if (max < 50) return "Ink";
    return "Gray " + (index + 1);
  }
  const names = ["Rose", "Amber", "Gold", "Leaf", "Sea", "Sky", "Plum", "Berry"];
  const hue = Math.atan2(g - b, r - g);
  const bucket = Math.abs(Math.round(((hue + Math.PI) / (Math.PI * 2)) * names.length)) % names.length;
  return names[bucket] + " " + (index + 1);
}

function components(color, w, h) {
  const n = w * h;
  const comp = new Int32Array(n);
  comp.fill(-1);
  const areas = [];
  const colors = [];
  let count = 0;
  const qx = new Int32Array(n);
  const qy = new Int32Array(n);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const start = y * w + x;
      if (comp[start] !== -1) continue;
      const col = color[start];
      let qs = 0;
      let qe = 0;
      qx[qe] = x;
      qy[qe] = y;
      qe++;
      comp[start] = count;
      let area = 0;
      while (qs < qe) {
        const cx = qx[qs];
        const cy = qy[qs];
        qs++;
        area++;
        const tryN = (nx, ny) => {
          if (nx < 0 || ny < 0 || nx >= w || ny >= h) return;
          const ni = ny * w + nx;
          if (comp[ni] !== -1 || color[ni] !== col) return;
          comp[ni] = count;
          qx[qe] = nx;
          qy[qe] = ny;
          qe++;
        };
        tryN(cx - 1, cy);
        tryN(cx + 1, cy);
        tryN(cx, cy - 1);
        tryN(cx, cy + 1);
      }
      areas.push(area);
      colors.push(col);
      count++;
    }
  }
  return { comp, areas, colors, count };
}

function mergeSmall(comp, areas, colors, w, h, maxRegions, minArea) {
  const count0 = areas.length;
  const parent = new Int32Array(count0);
  for (let i = 0; i < count0; i++) parent[i] = i;
  const area = Int32Array.from(areas);
  const find = (a) => {
    let r = a;
    while (parent[r] !== r) r = parent[r];
    while (parent[a] !== a) {
      const n = parent[a];
      parent[a] = r;
      a = n;
    }
    return r;
  };
  const border = new Map();
  const add = (a, b) => {
    if (a === b) return;
    const k = a < b ? a * count0 + b : b * count0 + a;
    border.set(k, (border.get(k) || 0) + 1);
  };
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const a = comp[y * w + x];
      if (x + 1 < w) add(a, comp[y * w + x + 1]);
      if (y + 1 < h) add(a, comp[(y + 1) * w + x]);
    }
  }
  const neigh = (id) => {
    const acc = new Map();
    for (const [k, len] of border) {
      const larger = k % count0;
      const smaller = (k / count0) | 0;
      const a = find(smaller);
      const b = find(larger);
      if (a === b) continue;
      if (a === id) acc.set(b, (acc.get(b) || 0) + len);
      else if (b === id) acc.set(a, (acc.get(a) || 0) + len);
    }
    let best = -1;
    let bestLen = -1;
    for (const [oid, len] of acc) {
      if (len > bestLen) {
        bestLen = len;
        best = oid;
      }
    }
    return best;
  };
  const liveCount = () => {
    let n = 0;
    for (let i = 0; i < count0; i++) if (find(i) === i && area[i] > 0) n++;
    return n;
  };
  for (let guard = 0; guard < count0; guard++) {
    let smallest = -1;
    for (let i = 0; i < count0; i++) {
      if (find(i) !== i || area[i] <= 0) continue;
      const tooSmall = area[i] < minArea || liveCount() > maxRegions;
      if (!tooSmall) continue;
      if (smallest < 0 || area[i] < area[smallest]) smallest = i;
    }
    if (smallest < 0) break;
    if (liveCount() <= maxRegions && area[smallest] >= minArea) break;
    const dst = neigh(smallest);
    if (dst < 0) break;
    parent[smallest] = dst;
    area[dst] += area[smallest];
    area[smallest] = 0;
  }
  const map = new Map();
  const colorOf = [];
  let next = 0;
  const labels = new Int32Array(w * h);
  for (let i = 0; i < labels.length; i++) {
    const root = find(comp[i]);
    let id = map.get(root);
    if (id == null) {
      id = next++;
      map.set(root, id);
      colorOf.push(colors[root]);
    }
    labels[i] = id;
  }
  return { labels, colorOf };
}

self.onmessage = (event) => {
  try {
    const { buffer, width, height, colors, detail } = event.data;
    const src = new Uint8ClampedArray(buffer);
    post({ progress: 0.08, stage: "Preparing the photo…" });
    const maxSide = Math.round(260 + detail * 280);
    const scaled = downscale(src, width, height, maxSide);
    const soft = blur(scaled.data, scaled.w, scaled.h);
    post({ progress: 0.28, stage: "Choosing colors…" });
    const km = kmeans(soft, scaled.w, scaled.h, colors);
    post({ progress: 0.55, stage: "Finding regions…" });
    const cc = components(km.color, scaled.w, scaled.h);
    const maxRegions = Math.round(36 + detail * 1760);
    const minArea = Math.round(4 + (1 - detail) * 90);
    const merged = mergeSmall(cc.comp, cc.areas, cc.colors, scaled.w, scaled.h, Math.min(2200, maxRegions), minArea);
    post({ progress: 0.78, stage: "Drawing outlines…" });
    const vec = vectorizeLabels(merged.labels, scaled.w, scaled.h, 1000, detail > 0.7 ? 0.7 : 0.95);
    const regions = [];
    for (let id = 0; id < merged.colorOf.length; id++) {
      const geom = vec.get(id);
      if (!geom) continue;
      let label = polylabel(geom.loops);
      if (!pointInLoops(label.x, label.y, geom.loops)) {
        let sx = 0;
        let sy = 0;
        const ring = geom.loops[0];
        for (const p of ring) {
          sx += p[0];
          sy += p[1];
        }
        label = { x: sx / ring.length, y: sy / ring.length };
      }
      regions.push({ c: merged.colorOf[id], d: geom.path, x: Math.round(label.x * 10) / 10, y: Math.round(label.y * 10) / 10 });
    }
    const tier = detail < 0.34 ? "little" : detail < 0.67 ? "big" : "adult";
    post({
      progress: 1,
      stage: "Ready",
      picture: {
        id: "photo-" + Date.now(),
        title: "My Photo",
        tier,
        viewBox: [0, 0, 1000, 1000],
        palette: km.palette,
        regions,
      },
    });
  } catch (err) {
    post({ error: err && err.message ? err.message : "Could not build that photo." });
  }
};

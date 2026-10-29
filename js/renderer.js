import { numberStyle, patternId } from "./aids.js";

const PAPER = "#fbf7ef";
const INK = "#1b2430";
const MAT = "#efe6d6";

const patternTiles = new Map();

function patternTile(id) {
  if (patternTiles.has(id)) return patternTiles.get(id);
  const c = document.createElement("canvas");
  c.width = 16;
  c.height = 16;
  const g = c.getContext("2d");
  g.strokeStyle = "rgba(27,36,48,0.72)";
  g.fillStyle = "rgba(27,36,48,0.72)";
  g.lineWidth = 1.6;
  g.lineCap = "square";
  const line = (x0, y0, x1, y1) => {
    g.beginPath();
    g.moveTo(x0, y0);
    g.lineTo(x1, y1);
    g.stroke();
  };
  switch (id) {
    case 0:
      line(0, 4, 16, 4);
      line(0, 12, 16, 12);
      break;
    case 1:
      line(4, 0, 4, 16);
      line(12, 0, 12, 16);
      break;
    case 2:
      for (const [x, y] of [[4, 4], [12, 4], [4, 12], [12, 12]]) {
        g.beginPath();
        g.arc(x, y, 1.7, 0, Math.PI * 2);
        g.fill();
      }
      break;
    case 3:
      line(0, 16, 16, 0);
      line(-4, 8, 8, -4);
      line(8, 20, 20, 8);
      break;
    case 4:
      line(0, 0, 16, 16);
      line(-4, 8, 8, 20);
      line(8, -4, 20, 8);
      break;
    case 5:
      line(0, 0, 16, 16);
      line(0, 16, 16, 0);
      break;
    case 6:
      g.beginPath();
      g.arc(8, 8, 4.5, 0, Math.PI * 2);
      g.stroke();
      break;
    case 7:
      line(8, 1, 8, 15);
      line(1, 8, 15, 8);
      break;
    case 8:
      line(1, 5, 7, 5);
      line(9, 11, 15, 11);
      break;
    case 9:
      line(0, 8, 16, 8);
      line(8, 0, 8, 16);
      line(0, 0, 16, 0);
      break;
    case 10:
      line(0, 11, 8, 4);
      line(8, 4, 16, 11);
      break;
    default:
      g.fillRect(2, 2, 4, 4);
      g.fillRect(10, 10, 4, 4);
      break;
  }
  patternTiles.set(id, c);
  return c;
}

function parseLoops(d) {
  const loops = [];
  const parts = d.split("M");
  for (const part of parts) {
    if (!part) continue;
    const nums = part.match(/-?\d*\.?\d+/g);
    if (!nums || nums.length < 6) continue;
    const loop = [];
    for (let i = 0; i + 1 < nums.length; i += 2) loop.push([+nums[i], +nums[i + 1]]);
    if (loop.length >= 3) loops.push(loop);
  }
  return loops;
}

function ringArea(ring) {
  let s = 0;
  for (let i = 0; i < ring.length; i++) {
    const [x1, y1] = ring[i];
    const [x2, y2] = ring[(i + 1) % ring.length];
    s += x1 * y2 - x2 * y1;
  }
  return s / 2;
}

function loopsArea(loops) {
  if (!loops.length) return 1;
  let a = Math.abs(ringArea(loops[0]));
  for (let i = 1; i < loops.length; i++) a -= Math.abs(ringArea(loops[i]));
  return Math.max(1, Math.abs(a));
}

function shadeHex(hex, t) {
  if (!t) return hex;
  const n = parseInt(hex.slice(1), 16);
  const k = 1 - Math.min(1, t) * 0.55;
  const r = ((n >> 16) & 255) * k;
  const g = ((n >> 8) & 255) * k;
  const b = (n & 255) * k;
  return `rgb(${r | 0},${g | 0},${b | 0})`;
}

export class Board {
  constructor(canvas) {
    this.canvas = canvas;
    this.ctx = canvas.getContext("2d", { alpha: false });
    this.cache = document.createElement("canvas");
    this.cctx = this.cache.getContext("2d", { alpha: false });
    this.lines = document.createElement("canvas");
    this.lctx = this.lines.getContext("2d", { alpha: true });
    this.highlightLayer = document.createElement("canvas");
    this.hctx = this.highlightLayer.getContext("2d", { alpha: true });
    this.cacheSize = 1536;
    this.regions = [];
    this.picture = null;
    this.filled = new Uint8Array(0);
    this.shades = new Uint8Array(0);
    this.zoom = 1;
    this.panX = 0;
    this.panY = 0;
    this.fitZoom = 1;
    this.highlight = true;
    this.selected = 0;
    this.numberScale = 1;
    this.bigNumbers = false;
    this.patterns = false;
    this.thickLines = false;
    this._patternStyles = null;
    this._scratch = null;
    this.gesturing = false;
    this.frameTimes = [];
    this.lastFillMs = 0;
    this.cssW = 1;
    this.cssH = 1;
    this.dpr = 1;
    this._raf = 0;
    this.grid = new Map();
    this.cell = 48;
  }

  load(picture) {
    this.picture = picture;
    this.regions = picture.regions.map((raw, i) => {
      const loops = parseLoops(raw.d);
      let x0 = Infinity;
      let y0 = Infinity;
      let x1 = -Infinity;
      let y1 = -Infinity;
      for (const loop of loops) {
        for (const [x, y] of loop) {
          if (x < x0) x0 = x;
          if (y < y0) y0 = y;
          if (x > x1) x1 = x;
          if (y > y1) y1 = y;
        }
      }
      return {
        i,
        c: raw.c,
        x: raw.x,
        y: raw.y,
        path: new Path2D(raw.d),
        bb: { x0, y0, x1, y1 },
        area: loopsArea(loops),
      };
    });
    this.filled = new Uint8Array(this.regions.length);
    this.shades = new Uint8Array(this.regions.length);
    this._buildGrid();
    const counts = new Map();
    for (const r of this.regions) counts.set(r.c, (counts.get(r.c) || 0) + 1);
    let best = 0;
    let bestN = -1;
    for (const [c, n] of counts) {
      if (n > bestN) {
        bestN = n;
        best = c;
      }
    }
    this.selected = best;
    this._paintCache();
    this._paintLines();
    this.rebuildHighlight();
  }

  _buildGrid() {
    this.grid = new Map();
    const cell = this.cell;
    for (const r of this.regions) {
      const x0 = Math.floor(r.bb.x0 / cell);
      const x1 = Math.floor(r.bb.x1 / cell);
      const y0 = Math.floor(r.bb.y0 / cell);
      const y1 = Math.floor(r.bb.y1 / cell);
      for (let y = y0; y <= y1; y++) {
        for (let x = x0; x <= x1; x++) {
          const k = x + "," + y;
          let bucket = this.grid.get(k);
          if (!bucket) this.grid.set(k, (bucket = []));
          bucket.push(r);
        }
      }
    }
  }

  _worldTransform(ctx, scale) {
    ctx.setTransform(scale, 0, 0, scale, 0, 0);
  }

  styleOf(region) {
    const hex = this.picture.palette[region.c].hex;
    const shade = this.shades[region.i] / 255;
    return shade ? shadeHex(hex, shade) : hex;
  }

  _paintCache() {
    const S = this.cacheSize;
    this.cache.width = S;
    this.cache.height = S;
    const ctx = this.cctx;
    const scale = S / 1000;
    this._worldTransform(ctx, scale);
    ctx.fillStyle = PAPER;
    ctx.fillRect(0, 0, 1000, 1000);
    for (const r of this.regions) this._fillRegion(ctx, r);
  }

  _scratchCtx() {
    if (this._scratch) return this._scratch;
    const canvas = document.createElement("canvas");
    canvas.width = 1;
    canvas.height = 1;
    this._scratch = canvas.getContext("2d");
    return this._scratch;
  }

  _patternStyle(colorIndex) {
    if (!this._patternStyles) this._patternStyles = new Map();
    const id = patternId(colorIndex);
    if (!this._patternStyles.has(id)) {
      const ctx = this._scratchCtx();
      this._patternStyles.set(id, ctx.createPattern(patternTile(id), "repeat"));
    }
    return this._patternStyles.get(id);
  }

  _fillRegion(ctx, region) {
    if (this.filled[region.i]) {
      ctx.fillStyle = this.styleOf(region);
      ctx.fill(region.path, "evenodd");
      return;
    }
    ctx.fillStyle = PAPER;
    ctx.fill(region.path, "evenodd");
    if (!this.patterns) return;
    ctx.fillStyle = this._patternStyle(region.c);
    ctx.fill(region.path, "evenodd");
  }

  _rebuildPatterns() {
    this._patternStyles = new Map();
    this._paintCache();
  }

  _paintLines() {
    const S = this.cacheSize;
    this.lines.width = S;
    this.lines.height = S;
    const ctx = this.lctx;
    ctx.clearRect(0, 0, S, S);
    this._worldTransform(ctx, S / 1000);
    ctx.strokeStyle = INK;
    ctx.lineJoin = "round";
    ctx.lineCap = "round";
    ctx.lineWidth = this.thickLines ? 2.8 : 1.7;
    for (const r of this.regions) ctx.stroke(r.path);
  }

  paintRegion(index) {
    const r = this.regions[index];
    const scale = this.cacheSize / 1000;
    const ctx = this.cctx;
    this._worldTransform(ctx, scale);
    this._fillRegion(ctx, r);
    const lctx = this.lctx;
    this._worldTransform(lctx, scale);
    lctx.strokeStyle = INK;
    lctx.lineWidth = this.thickLines ? 2.8 : 1.7;
    lctx.stroke(r.path);
  }

  rebuildHighlight() {
    const S = this.cacheSize;
    this.highlightLayer.width = S;
    this.highlightLayer.height = S;
    const ctx = this.hctx;
    ctx.clearRect(0, 0, S, S);
    if (!this.highlight || this.selected == null) return;
    const color = this.picture.palette[this.selected]?.hex;
    if (!color) return;
    this._worldTransform(ctx, S / 1000);
    ctx.fillStyle = color;
    ctx.globalAlpha = 0.34;
    ctx.strokeStyle = color;
    ctx.globalAlpha = 1;
    ctx.lineWidth = this.thickLines ? 4 : 2.6;
    for (const r of this.regions) {
      if (r.c !== this.selected || this.filled[r.i]) continue;
      ctx.globalAlpha = 0.32;
      ctx.fill(r.path, "evenodd");
      ctx.globalAlpha = 0.95;
      ctx.stroke(r.path);
    }
    ctx.globalAlpha = 1;
  }

  layout() {
    const cssW = Math.max(1, this.canvas.clientWidth);
    const cssH = Math.max(1, this.canvas.clientHeight);
    const dpr = Math.min(2, window.devicePixelRatio || 1);
    const w = Math.round(cssW * dpr);
    const h = Math.round(cssH * dpr);
    if (this.canvas.width !== w || this.canvas.height !== h) {
      this.canvas.width = w;
      this.canvas.height = h;
    }
    this.cssW = cssW;
    this.cssH = cssH;
    this.dpr = dpr;
    const pad = 12;
    this.fitZoom = Math.max(0.05, Math.min((cssW - pad * 2) / 1000, (cssH - pad * 2) / 1000));
  }

  fit() {
    this.layout();
    this.zoom = this.fitZoom;
    this.panX = (this.cssW - 1000 * this.zoom) / 2;
    this.panY = (this.cssH - 1000 * this.zoom) / 2;
  }

  clampZoom() {
    const min = this.fitZoom * 0.8;
    const max = this.fitZoom * 8;
    if (this.zoom < min) this.zoom = min;
    if (this.zoom > max) this.zoom = max;
  }

  clampPan() {
    const w = 1000 * this.zoom;
    const h = 1000 * this.zoom;
    const m = 36;
    if (w + m * 2 <= this.cssW) this.panX = (this.cssW - w) / 2;
    else this.panX = Math.min(m, Math.max(this.cssW - w - m, this.panX));
    if (h + m * 2 <= this.cssH) this.panY = (this.cssH - h) / 2;
    else this.panY = Math.min(m, Math.max(this.cssH - h - m, this.panY));
  }

  screenToWorld(sx, sy) {
    return [(sx - this.panX) / this.zoom, (sy - this.panY) / this.zoom];
  }

  zoomAt(sx, sy, factor) {
    const [wx, wy] = this.screenToWorld(sx, sy);
    this.zoom *= factor;
    this.clampZoom();
    this.panX = sx - wx * this.zoom;
    this.panY = sy - wy * this.zoom;
    this.clampPan();
  }

  zoomToRegion(region) {
    const bw = Math.max(28, region.bb.x1 - region.bb.x0);
    const bh = Math.max(28, region.bb.y1 - region.bb.y0);
    const z = Math.min(this.fitZoom * 8, Math.min((this.cssW * 0.55) / bw, (this.cssH * 0.55) / bh));
    this.zoom = Math.max(this.fitZoom, z);
    const cx = (region.bb.x0 + region.bb.x1) / 2;
    const cy = (region.bb.y0 + region.bb.y1) / 2;
    this.panX = this.cssW / 2 - cx * this.zoom;
    this.panY = this.cssH / 2 - cy * this.zoom;
    this.clampPan();
    this.requestDraw();
  }

  visibleRegions() {
    const [x0, y0] = this.screenToWorld(0, 0);
    const [x1, y1] = this.screenToWorld(this.cssW, this.cssH);
    const cell = this.cell;
    const seen = new Set();
    const out = [];
    const gx0 = Math.floor(x0 / cell) - 1;
    const gx1 = Math.floor(x1 / cell) + 1;
    const gy0 = Math.floor(y0 / cell) - 1;
    const gy1 = Math.floor(y1 / cell) + 1;
    for (let y = gy0; y <= gy1; y++) {
      for (let x = gx0; x <= gx1; x++) {
        const bucket = this.grid.get(x + "," + y);
        if (!bucket) continue;
        for (const r of bucket) {
          if (seen.has(r.i)) continue;
          if (r.bb.x1 < x0 || r.bb.x0 > x1 || r.bb.y1 < y0 || r.bb.y0 > y1) continue;
          seen.add(r.i);
          out.push(r);
        }
      }
    }
    return out;
  }

  hitTest(sx, sy) {
    const [wx, wy] = this.screenToWorld(sx, sy);
    if (wx < -2 || wy < -2 || wx > 1002 || wy > 1002) return -1;
    const cell = this.cell;
    const bucket = this.grid.get(Math.floor(wx / cell) + "," + Math.floor(wy / cell)) || [];
    this.ctx.setTransform(1, 0, 0, 1, 0, 0);
    let best = -1;
    let bestArea = Infinity;
    for (const r of bucket) {
      if (wx < r.bb.x0 || wx > r.bb.x1 || wy < r.bb.y0 || wy > r.bb.y1) continue;
      if (this.ctx.isPointInPath(r.path, wx, wy, "evenodd") && r.area < bestArea) {
        best = r.i;
        bestArea = r.area;
      }
    }
    return best;
  }

  fill(index) {
    const t0 = performance.now();
    this.filled[index] = 1;
    this.paintRegion(index);
    if (this.regions[index].c === this.selected) this.rebuildHighlight();
    this.lastFillMs = performance.now() - t0;
    this.requestDraw();
  }

  unfill(index) {
    this.filled[index] = 0;
    this.paintRegion(index);
    this.rebuildHighlight();
    this.requestDraw();
  }

  setShade(index, amount) {
    this.shades[index] = Math.max(0, Math.min(255, amount | 0));
    if (!this.filled[index]) this.filled[index] = 1;
    this.paintRegion(index);
    this.requestDraw();
  }

  filledCount() {
    let n = 0;
    for (let i = 0; i < this.filled.length; i++) if (this.filled[i]) n++;
    return n;
  }

  isComplete() {
    return this.regions.length > 0 && this.filledCount() === this.regions.length;
  }

  colorStats() {
    const total = new Uint16Array(this.picture.palette.length);
    const done = new Uint16Array(this.picture.palette.length);
    for (const r of this.regions) {
      total[r.c]++;
      if (this.filled[r.i]) done[r.c]++;
    }
    return { total, done };
  }

  requestDraw() {
    if (this._raf) return;
    this._raf = requestAnimationFrame(() => {
      this._raf = 0;
      const t0 = performance.now();
      this.draw();
      const dt = performance.now() - t0;
      this.frameTimes.push(dt);
      if (this.frameTimes.length > 120) this.frameTimes.shift();
    });
  }

  _useVectors(visibleCount) {
    const picturePx = 1000 * this.zoom * this.dpr;
    const soft = picturePx > this.cacheSize * 1.05;
    if (!soft && visibleCount > 500) return false;
    if (this.gesturing && visibleCount > 380) return false;
    return true;
  }

  draw() {
    if (!this.picture) return;
    this.layout();
    const ctx = this.ctx;
    const dpr = this.dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
    ctx.fillStyle = MAT;
    ctx.fillRect(0, 0, this.cssW, this.cssH);
    const visible = this.visibleRegions();
    const vectors = this._useVectors(visible.length);
    if (vectors) {
      ctx.save();
      ctx.translate(this.panX, this.panY);
      ctx.scale(this.zoom, this.zoom);
      ctx.fillStyle = PAPER;
      ctx.fillRect(0, 0, 1000, 1000);
      for (const r of visible) this._fillRegion(ctx, r);
      ctx.strokeStyle = INK;
      ctx.lineJoin = "round";
      ctx.lineCap = "round";
      ctx.lineWidth = (this.thickLines ? 2.4 : 1.45) / this.zoom;
      for (const r of visible) ctx.stroke(r.path);
      if (this.highlight && this.selected != null) {
        const color = this.picture.palette[this.selected].hex;
        ctx.lineWidth = (this.thickLines ? 3.2 : 2.2) / this.zoom;
        for (const r of visible) {
          if (r.c !== this.selected || this.filled[r.i]) continue;
          ctx.fillStyle = color;
          ctx.globalAlpha = 0.3;
          ctx.fill(r.path, "evenodd");
          ctx.globalAlpha = 0.95;
          ctx.strokeStyle = color;
          ctx.stroke(r.path);
        }
        ctx.globalAlpha = 1;
      }
      ctx.restore();
    } else {
      ctx.drawImage(this.cache, this.panX, this.panY, 1000 * this.zoom, 1000 * this.zoom);
      ctx.drawImage(this.lines, this.panX, this.panY, 1000 * this.zoom, 1000 * this.zoom);
      if (this.highlight) ctx.drawImage(this.highlightLayer, this.panX, this.panY, 1000 * this.zoom, 1000 * this.zoom);
    }
    if (!this.gesturing) this._drawNumbers(ctx);
  }

  _drawNumbers(ctx) {
    ctx.save();
    ctx.setTransform(this.dpr, 0, 0, this.dpr, 0, 0);
    ctx.textAlign = "center";
    ctx.textBaseline = "middle";
    ctx.fillStyle = "rgba(27,36,48,0.86)";
    const style = numberStyle(this.numberScale, this.bigNumbers);
    for (const r of this.regions) {
      if (this.filled[r.i]) continue;
      const fontPx = this.fontPxFor(r);
      if (fontPx < style.minPx) continue;
      const sx = r.x * this.zoom + this.panX;
      const sy = r.y * this.zoom + this.panY;
      if (sx < -20 || sy < -20 || sx > this.cssW + 20 || sy > this.cssH + 20) continue;
      ctx.font = `700 ${fontPx.toFixed(1)}px "Avenir Next", "Segoe UI", sans-serif`;
      ctx.fillText(String(r.c + 1), sx, sy);
    }
    ctx.restore();
  }

  fontPxFor(region) {
    const style = numberStyle(this.numberScale, this.bigNumbers);
    return Math.min(style.cap, Math.sqrt(region.area) * this.zoom * 0.2 * style.scale);
  }

  exportCanvas(size = 1800, withNumbers = false) {
    const c = document.createElement("canvas");
    c.width = size;
    c.height = size;
    const ctx = c.getContext("2d");
    const s = size / 1000;
    ctx.setTransform(s, 0, 0, s, 0, 0);
    ctx.fillStyle = "#fffdf8";
    ctx.fillRect(0, 0, 1000, 1000);
    for (const r of this.regions) {
      ctx.fillStyle = this.filled[r.i] ? this.styleOf(r) : "#fffdf8";
      ctx.fill(r.path, "evenodd");
    }
    ctx.strokeStyle = INK;
    ctx.lineJoin = "round";
    ctx.lineWidth = this.thickLines ? 2.4 : 1.45;
    for (const r of this.regions) ctx.stroke(r.path);
    if (withNumbers) {
      ctx.fillStyle = INK;
      ctx.textAlign = "center";
      ctx.textBaseline = "middle";
      for (const r of this.regions) {
        if (this.filled[r.i]) continue;
        const font = Math.min(40, Math.sqrt(r.area) * 0.2);
        if (font < 8) continue;
        ctx.font = `700 ${font}px sans-serif`;
        ctx.fillText(String(r.c + 1), r.x, r.y);
      }
    }
    return c;
  }

  applyState(progress) {
    this.filled.fill(0);
    this.shades.fill(0);
    if (!progress) {
      this._paintCache();
      this.rebuildHighlight();
      return;
    }
    for (const i of progress.filled || []) if (i >= 0 && i < this.filled.length) this.filled[i] = 1;
    if (progress.shades) {
      for (const [k, v] of Object.entries(progress.shades)) {
        const i = +k;
        if (i >= 0 && i < this.shades.length) this.shades[i] = v;
      }
    }
    if (Number.isInteger(progress.selected)) this.selected = progress.selected;
    this._paintCache();
    this.rebuildHighlight();
  }

  snapshot() {
    const filled = [];
    const shades = {};
    for (let i = 0; i < this.filled.length; i++) if (this.filled[i]) filled.push(i);
    for (let i = 0; i < this.shades.length; i++) if (this.shades[i]) shades[i] = this.shades[i];
    return { filled, shades, selected: this.selected };
  }
}

import { vectorizeLabels } from "./trace.mjs";
import { pointInLoops, ringArea } from "./geom.mjs";

function rasterCoverage(regions, view = 1000, res = 180) {
  let miss = 0;
  let multi = 0;
  const step = view / res;
  for (let j = 0; j < res; j++) {
    for (let i = 0; i < res; i++) {
      const x = (i + 0.5) * step;
      const y = (j + 0.5) * step;
      let hits = 0;
      for (const reg of regions) {
        if (pointInLoops(x, y, reg.loops)) hits++;
      }
      if (hits === 0) miss++;
      else if (hits > 1) multi++;
    }
  }
  return { miss, multi, total: res * res };
}

function testSplit() {
  const w = 24;
  const h = 16;
  const labels = new Int32Array(w * h);
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) labels[y * w + x] = x < 10 ? 0 : 1;
  }
  const vec = vectorizeLabels(labels, w, h, 1000, 0.6);
  const regions = [...vec.values()];
  const cov = rasterCoverage(regions);
  console.log("split", "regions", regions.length, cov);
  if (regions.length !== 2) throw new Error("expected 2 regions");
  if (cov.miss > 2 || cov.multi > 2) throw new Error("coverage fail split");
}

function testHole() {
  const w = 30;
  const h = 30;
  const labels = new Int32Array(w * h);
  labels.fill(0);
  for (let y = 8; y < 22; y++) {
    for (let x = 8; x < 22; x++) labels[y * w + x] = 1;
  }
  for (let y = 12; y < 18; y++) {
    for (let x = 12; x < 18; x++) labels[y * w + x] = 0;
  }
  const vec = vectorizeLabels(labels, w, h, 1000, 0.5);
  console.log("hole region count", vec.size);
  const regions = [...vec.values()];
  const cov = rasterCoverage(regions, 1000, 120);
  console.log("hole", cov);
  const frame = vec.get(0);
  console.log("region0 loops", frame.loops.length, "region1 loops", vec.get(1).loops.length);
  if (cov.miss > 4 || cov.multi > 4) throw new Error("coverage fail hole");
}

function testCircle() {
  const w = 80;
  const h = 80;
  const labels = new Int32Array(w * h);
  labels.fill(0);
  const cx = 40;
  const cy = 40;
  const r = 26;
  for (let y = 0; y < h; y++) {
    for (let x = 0; x < w; x++) {
      const dx = x + 0.5 - cx;
      const dy = y + 0.5 - cy;
      if (dx * dx + dy * dy <= r * r) labels[y * w + x] = 1;
    }
  }
  const vec = vectorizeLabels(labels, w, h, 1000, 0.9);
  const regions = [...vec.values()];
  const cov = rasterCoverage(regions, 1000, 160);
  console.log("circle", "regions", regions.length, cov);
  const circle = vec.get(1);
  console.log("circle pts", circle.loops[0].length, "area", ringArea(circle.loops).toFixed(0));
  if (cov.miss > 6 || cov.multi > 8) throw new Error("coverage fail circle " + JSON.stringify(cov));
}

testSplit();
testHole();
testCircle();
console.log("trace tests ok");

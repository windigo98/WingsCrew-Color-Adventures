/**
 * Draw the WingsCrew feather mark and rasterize PWA icons.
 * The official bitmap was not in the repo, so this SVG follows the supplied logo:
 * cream ground, navy outline, orange and gold vanes, burgundy rachis,
 * cream "WingsCrew" on a navy band.
 */
import fs from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import { Resvg } from "@resvg/resvg-js";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const outDir = path.join(root, "icons");
fs.mkdirSync(outDir, { recursive: true });

const ORANGE = ["#e45416", "#f08a1e", "#d84315", "#f6b13a"];
const GOLD = ["#f0a030", "#e25b1a", "#f6c15a", "#c2410c"];

function barb(x, side, length, color) {
  const y = side * length;
  const tip = x + 16;
  return `<path d="M ${x.toFixed(1)} 0
    C ${(x + 8).toFixed(1)} ${(y * 0.18).toFixed(1)}, ${(tip - 8).toFixed(1)} ${(y * 0.7).toFixed(1)}, ${tip.toFixed(1)} ${(y * 0.96).toFixed(1)}
    C ${(tip - 26).toFixed(1)} ${(y * 0.74).toFixed(1)}, ${(x + 10).toFixed(1)} ${(y * 0.22).toFixed(1)}, ${(x + 18).toFixed(1)} 0 Z"
    fill="${color}" stroke="#172630" stroke-width="2.4" stroke-linejoin="round" stroke-linecap="round"/>`;
}

function feather() {
  const parts = [];
  for (let i = 0; i < 15; i++) {
    const t = i / 14;
    const x = -168 + i * 24;
    const length = 36 + Math.sin(t * Math.PI) ** 0.85 * 168;
    const colorA = ORANGE[i % ORANGE.length];
    const colorB = GOLD[(i + 1) % GOLD.length];
    parts.push(barb(x, 1, length, colorA));
    parts.push(barb(x, -1, length * 0.92, colorB));
  }
  return parts.join("\n");
}

function logoSvg({ pad = 0 } = {}) {
  const scale = pad ? 0.72 : 1;
  return `<?xml version="1.0" encoding="UTF-8"?>
<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 640 640">
  <rect width="640" height="640" fill="#f4efe4"/>
  <g transform="translate(330 338) rotate(-42) scale(${scale})">
    ${feather()}
    <path d="M -188 0 C -214 10, -246 8, -268 0 C -246 -8, -214 -10, -188 0 Z" fill="#172630"/>
    <path d="M -176 -3.2 L 214 0 L -176 3.2 Z" fill="#7a2344"/>
    <rect x="-78" y="-34" width="250" height="68" rx="16" fill="#172630"/>
    <text x="47" y="16" text-anchor="middle" fill="#f6f1e6" font-family="Liberation Serif" font-style="italic" font-weight="700" font-size="42">WingsCrew</text>
  </g>
</svg>`;
}

const svg = logoSvg();
fs.writeFileSync(path.join(outDir, "logo.svg"), svg);

const font = "/usr/share/fonts/truetype/liberation/LiberationSerif-BoldItalic.ttf";

function raster(source, width, file) {
  const resvg = new Resvg(source, {
    fitTo: { mode: "width", value: width },
    font: {
      fontFiles: fs.existsSync(font) ? [font] : [],
      defaultFontFamily: "Liberation Serif",
      loadSystemFonts: true,
    },
  });
  fs.writeFileSync(path.join(outDir, file), resvg.render().asPng());
  console.log("wrote", file, width);
}

raster(svg, 192, "icon-192.png");
raster(svg, 512, "icon-512.png");
raster(svg, 180, "apple-touch-icon.png");
raster(logoSvg({ pad: 1 }), 512, "icon-maskable.png");

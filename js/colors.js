/** Player color choices. Preset page colors stay the suggestion; these are the paints. */

const LITTLE_COLORS = [
  ["Red", "#E23B4A"],
  ["Orange", "#F08A2A"],
  ["Yellow", "#FFE14A"],
  ["Green", "#2F9E6B"],
  ["Teal", "#1AA6A6"],
  ["Blue", "#3A78D6"],
  ["Purple", "#7B5EA7"],
  ["Pink", "#F48FB1"],
  ["Gold", "#F2C14E"],
  ["Brown", "#8D5A34"],
  ["White", "#FFFFFF"],
  ["Black", "#1B2430"],
];

const RICH_HUES = [
  ["Red", "#E23B4A"],
  ["Orange", "#F08A2A"],
  ["Gold", "#F2C14E"],
  ["Yellow", "#FFE14A"],
  ["Lime", "#8BC34A"],
  ["Green", "#2F9E6B"],
  ["Teal", "#1AA6A6"],
  ["Sky", "#5EBFED"],
  ["Blue", "#3A78D6"],
  ["Navy", "#243E78"],
  ["Purple", "#7B5EA7"],
  ["Pink", "#F48FB1"],
  ["Rose", "#E25B8A"],
  ["Peach", "#F6C7A8"],
  ["Brown", "#8D5A34"],
];

const NEUTRALS = [
  ["White", "#FFFFFF"],
  ["Cream", "#FFF4DE"],
  ["Gray", "#B7B1A8"],
  ["Charcoal", "#4A453F"],
  ["Black", "#1B2430"],
];

export function normalizeHex(value) {
  if (typeof value !== "string") return null;
  let hex = value.trim();
  if (!hex.startsWith("#")) return null;
  hex = hex.slice(1);
  if (/^[0-9a-fA-F]{3}$/.test(hex)) hex = hex.split("").map((c) => c + c).join("");
  if (!/^[0-9a-fA-F]{6}$/.test(hex)) return null;
  return `#${hex.toUpperCase()}`;
}

function rgbHex(r, g, b) {
  const h = (n) => Math.max(0, Math.min(255, Math.round(n))).toString(16).padStart(2, "0").toUpperCase();
  return `#${h(r)}${h(g)}${h(b)}`;
}

function channels(hex) {
  const n = parseInt(hex.slice(1), 16);
  return [(n >> 16) & 255, (n >> 8) & 255, n & 255];
}

export function mixHex(from, to, t) {
  const a = channels(normalizeHex(from));
  const b = channels(normalizeHex(to));
  return rgbHex(
    a[0] + (b[0] - a[0]) * t,
    a[1] + (b[1] - a[1]) * t,
    a[2] + (b[2] - a[2]) * t
  );
}

export function luminance(hex) {
  const [r, g, b] = channels(normalizeHex(hex));
  return 0.2126 * r + 0.7152 * g + 0.0722 * b;
}

/** Five steps from a light tint through the color itself to a deep shade. */
export function shadeRow(hex) {
  const base = normalizeHex(hex);
  if (!base) return [];
  return [
    { hex: mixHex(base, "#FFFFFF", 0.68), name: "Lightest" },
    { hex: mixHex(base, "#FFFFFF", 0.36), name: "Light" },
    { hex: base, name: "Pure" },
    { hex: mixHex(base, "#1B2430", 0.32), name: "Dark" },
    { hex: mixHex(base, "#1B2430", 0.58), name: "Darkest" },
  ];
}

function dedupe(items) {
  const seen = new Set();
  const out = [];
  for (const item of items) {
    const hex = normalizeHex(item.hex);
    if (!hex || seen.has(hex)) continue;
    seen.add(hex);
    out.push({ hex, name: item.name });
  }
  return out;
}

export function littlePalette() {
  return LITTLE_COLORS.map(([name, hex]) => ({ hex: normalizeHex(hex), name }));
}

export function richPalette() {
  const items = [];
  for (const [name, hex] of RICH_HUES) {
    const shades = shadeRow(hex);
    const steps = [0, 1, 2, 3];
    for (const step of steps) {
      const shade = shades[step];
      items.push({
        hex: shade.hex,
        name: step === 2 ? name : `${shade.name} ${name}`,
      });
    }
  }
  for (const [name, hex] of NEUTRALS) items.push({ hex, name });
  return dedupe(items);
}

export function paletteFor(tier) {
  return tier === "little" ? littlePalette() : richPalette();
}

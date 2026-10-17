/**
 * Generate Payhip license codes and the hash list shipped in the app.
 * Plain codes are written to secrets/UNLOCK-CODES.txt, which is gitignored.
 * Upload that file's codes to Payhip as the product's license key list.
 * The TEST codes are public on purpose so the in-app simulated checkout works.
 */
import fs from "fs";
import path from "path";
import crypto from "crypto";
import { fileURLToPath } from "url";

const root = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const payments = JSON.parse(fs.readFileSync(path.join(root, "config/payments.json"), "utf8"));
const SALT = "WingsCrew-Color-Adventures-v1|";
const ALPHABET = "ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
const PER_PRODUCT = 24;

function group(rng) {
  let s = "";
  for (let i = 0; i < 4; i++) s += ALPHABET[rng() % ALPHABET.length];
  return s;
}

function mulberry32(seed) {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return (t ^ (t >>> 14)) >>> 0;
  };
}

const rng = mulberry32(20261017);
const hashes = {};
const prefixes = {};
const lines = [
  "WingsCrew Color Adventures — license codes",
  "Upload each product's codes to Payhip as that product's license keys.",
  "Do not commit this file. TEST codes are also embedded in config/payments.json for the simulated checkout.",
  "",
];

for (const product of payments.products) {
  prefixes[product.id] = product.prefix;
  const codes = [product.testCode];
  const seen = new Set(codes);
  while (codes.length < PER_PRODUCT + 1) {
    const code = `${product.prefix}-${group(rng)}-${group(rng)}-${group(rng)}`;
    if (!seen.has(code)) {
      seen.add(code);
      codes.push(code);
    }
  }
  hashes[product.id] = codes.map((code) => crypto.createHash("sha256").update(SALT + code).digest("hex"));
  lines.push(`# ${product.name} (${product.id}) $${product.price.toFixed(2)} prefix ${product.prefix}`);
  for (const code of codes) lines.push(code);
  lines.push("");
}

const dataDir = path.join(root, "data");
const secretDir = path.join(root, "secrets");
fs.mkdirSync(dataDir, { recursive: true });
fs.mkdirSync(secretDir, { recursive: true });
fs.writeFileSync(
  path.join(dataDir, "unlock-hashes.json"),
  JSON.stringify({ salt: SALT, prefixes, hashes, note: "Hashes only. This stops casual copying, not a determined person." }, null, 2)
);
fs.writeFileSync(path.join(secretDir, "UNLOCK-CODES.txt"), lines.join("\n"));
console.log(`Wrote ${payments.products.length} products to data/unlock-hashes.json and secrets/UNLOCK-CODES.txt`);

import { kvGet, kvSet } from "./db.js";

export const SALT = "WingsCrew-Color-Adventures-v1|";

export function normalizeCode(input) {
  return String(input || "")
    .toUpperCase()
    .replace(/[^A-Z0-9]+/g, "-")
    .replace(/-+/g, "-")
    .replace(/^-|-$/g, "");
}

export async function sha256Hex(text) {
  const data = new TextEncoder().encode(text);
  const buf = await crypto.subtle.digest("SHA-256", data);
  return [...new Uint8Array(buf)].map((b) => b.toString(16).padStart(2, "0")).join("");
}

let hashIndex = null;

export async function loadHashes() {
  if (hashIndex) return hashIndex;
  const res = await fetch(new URL("../data/unlock-hashes.json", import.meta.url));
  const data = await res.json();
  hashIndex = data;
  return data;
}

export async function lookupCode(raw) {
  const code = normalizeCode(raw);
  const table = await loadHashes();
  const product = Object.keys(table.prefixes).find((id) => code.startsWith(table.prefixes[id]));
  if (!product) return { ok: false, reason: "That code doesn't look like a WingsCrew code." };
  const hash = await sha256Hex(SALT + code);
  const list = table.hashes[product] || [];
  if (!list.includes(hash)) return { ok: false, reason: "That code isn't in this app's list." };
  return { ok: true, code, product };
}

export async function entitlements() {
  const fromDb = await kvGet("entitlements", null);
  if (Array.isArray(fromDb)) return new Set(fromDb);
  try {
    const local = JSON.parse(localStorage.getItem("wcca-entitlements") || "[]");
    return new Set(local);
  } catch {
    return new Set();
  }
}

export async function savedCodes() {
  return (await kvGet("codes", [])) || [];
}

export async function rememberUnlock(code, unlockedIds) {
  const ent = await entitlements();
  for (const id of unlockedIds) ent.add(id);
  const codes = new Set(await savedCodes());
  codes.add(code);
  const list = [...ent];
  const codeList = [...codes];
  await kvSet("entitlements", list);
  await kvSet("codes", codeList);
  localStorage.setItem("wcca-entitlements", JSON.stringify(list));
  return ent;
}

export function hasAccess(ent, pack) {
  if (!pack || pack.free) return true;
  if (ent.has("all-future")) return true;
  if (ent.has(pack.id)) return true;
  // Full Unlock stays the four launch packs. Later packs are their own purchase, or All Future Packs.
  if (ent.has("full-unlock") && pack.productId && pack.productId !== "all-future") {
    return ["creatures", "mandalas", "christmas", "halloween"].includes(pack.id);
  }
  return false;
}

export function canUsePhoto(ent) {
  return ent.has("photo") || ent.has("full-unlock") || ent.has("all-future");
}

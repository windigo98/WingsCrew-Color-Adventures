import { dumpAll, replaceAll, kvSet } from "./db.js";
import { lookupCode, rememberUnlock } from "./unlock.js";
import { app } from "./state.js";
import { inKidsMode, parentGate } from "./gate.js";

export async function exportBackup() {
  if (inKidsMode() && !(await parentGate())) return;
  const data = await dumpAll();
  const file = {
    app: "wingscrew-color-adventures",
    version: 1,
    exportedAt: new Date().toISOString(),
    progress: data.progress,
    photos: data.photos,
    codes: data.codes,
    settings: app.settings,
  };
  const blob = new Blob([JSON.stringify(file)], { type: "application/json" });
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = `wingscrew-backup-${new Date().toISOString().slice(0, 10)}.wingscrew.json`;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
  localStorage.setItem("wcca-last-backup", String(Date.now()));
}

export async function importBackup(file) {
  if (inKidsMode() && !(await parentGate())) return null;
  const text = await file.text();
  const data = JSON.parse(text);
  if (!data || data.app !== "wingscrew-color-adventures") throw new Error("That file isn't a WingsCrew backup.");
  const codes = Array.isArray(data.codes) ? data.codes : [];
  const payments = app.payments;
  const unlocked = new Set();
  const accepted = [];
  for (const code of codes) {
    const found = await lookupCode(code);
    if (!found.ok) continue;
    const product = payments.products.find((p) => p.id === found.product);
    if (!product) continue;
    accepted.push(found.code);
    for (const id of product.unlocks) unlocked.add(id);
  }
  await replaceAll({
    progress: data.progress || [],
    photos: data.photos || [],
    kv: { entitlements: [...unlocked], codes: accepted },
  });
  if (data.settings && typeof data.settings === "object") {
    Object.assign(app.settings, data.settings);
    localStorage.setItem("wcca-settings", JSON.stringify(app.settings));
  }
  localStorage.setItem("wcca-entitlements", JSON.stringify([...unlocked]));
  await kvSet("entitlements", [...unlocked]);
  app.ent = unlocked;
  return { pictures: (data.progress || []).length, codes: accepted.length };
}

const DB_NAME = "wingscrew-color-adventures";
const DB_VERSION = 1;

function openDB() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const db = req.result;
      if (!db.objectStoreNames.contains("progress")) db.createObjectStore("progress", { keyPath: "id" });
      if (!db.objectStoreNames.contains("photos")) db.createObjectStore("photos", { keyPath: "id" });
      if (!db.objectStoreNames.contains("kv")) db.createObjectStore("kv");
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

let dbPromise;
export function db() {
  if (!dbPromise) dbPromise = openDB();
  return dbPromise;
}

function txDone(tx) {
  return new Promise((resolve, reject) => {
    tx.oncomplete = () => resolve();
    tx.onerror = () => reject(tx.error);
    tx.onabort = () => reject(tx.error || new Error("aborted"));
  });
}

export async function kvGet(key, fallback = null) {
  const database = await db();
  return new Promise((resolve, reject) => {
    const req = database.transaction("kv").objectStore("kv").get(key);
    req.onsuccess = () => resolve(req.result === undefined ? fallback : req.result);
    req.onerror = () => reject(req.error);
  });
}

export async function kvSet(key, value) {
  const database = await db();
  const tx = database.transaction("kv", "readwrite");
  tx.objectStore("kv").put(value, key);
  await txDone(tx);
}

export async function saveProgress(record) {
  const database = await db();
  const tx = database.transaction("progress", "readwrite");
  tx.objectStore("progress").put(record);
  await txDone(tx);
}

export async function getProgress(id) {
  const database = await db();
  return new Promise((resolve, reject) => {
    const req = database.transaction("progress").objectStore("progress").get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

export async function allProgress() {
  const database = await db();
  return new Promise((resolve, reject) => {
    const req = database.transaction("progress").objectStore("progress").getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function savePhoto(record) {
  const database = await db();
  const tx = database.transaction("photos", "readwrite");
  tx.objectStore("photos").put(record);
  await txDone(tx);
}

export async function getPhoto(id) {
  const database = await db();
  return new Promise((resolve, reject) => {
    const req = database.transaction("photos").objectStore("photos").get(id);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

export async function allPhotos() {
  const database = await db();
  return new Promise((resolve, reject) => {
    const req = database.transaction("photos").objectStore("photos").getAll();
    req.onsuccess = () => resolve(req.result || []);
    req.onerror = () => reject(req.error);
  });
}

export async function replaceAll({ progress = [], photos = [], kv = {} }) {
  const database = await db();
  const tx = database.transaction(["progress", "photos", "kv"], "readwrite");
  const ps = tx.objectStore("progress");
  const hs = tx.objectStore("photos");
  ps.clear();
  hs.clear();
  for (const row of progress) ps.put(row);
  for (const row of photos) hs.put(row);
  const ks = tx.objectStore("kv");
  for (const [key, value] of Object.entries(kv)) ks.put(value, key);
  await txDone(tx);
}

export async function dumpAll() {
  const [progress, photos, entitlements, codes] = await Promise.all([
    allProgress(),
    allPhotos(),
    kvGet("entitlements", []),
    kvGet("codes", []),
  ]);
  return { progress, photos, entitlements, codes };
}

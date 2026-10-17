import { app, TIER_LABEL, asset } from "./state.js";
import { allProgress, getPhoto } from "./db.js";
import { entitlements, hasAccess, canUsePhoto } from "./unlock.js";
import { openPlay, closePlay } from "./play.js";
import { renderShop, renderHow, renderCheckout } from "./shop.js";
import { renderPhoto } from "./photo.js";
import { exportBackup, importBackup } from "./backup.js";

const screen = () => document.getElementById("screen");
let cleanup = null;

function loadSettings() {
  try {
    const saved = JSON.parse(localStorage.getItem("wcca-settings") || "{}");
    Object.assign(app.settings, saved);
  } catch {
    /* keep defaults */
  }
  app.settings.visits = (app.settings.visits || 0) + 1;
  localStorage.setItem("wcca-settings", JSON.stringify(app.settings));
}

function saveSettings() {
  localStorage.setItem("wcca-settings", JSON.stringify(app.settings));
}

async function boot() {
  loadSettings();
  const [catalogRes, payRes, ent] = await Promise.all([
    fetch(asset("packs/catalog.json")),
    fetch(asset("config/payments.json")),
    entitlements(),
  ]);
  app.catalog = await catalogRes.json();
  app.payments = await payRes.json();
  app.ent = ent;
  if (navigator.storage?.persist) navigator.storage.persist().catch(() => {});
  registerSW();
  installHooks();
  window.addEventListener("hashchange", route);
  route();
  window.__WCCA = Object.assign(window.__WCCA || {}, {
    app,
    asset,
    ready: true,
  });
}

function registerSW() {
  if (!("serviceWorker" in navigator)) return;
  navigator.serviceWorker.register(new URL("../sw.js", import.meta.url)).catch(() => {});
}

let deferredPrompt = null;
function installHooks() {
  window.addEventListener("beforeinstallprompt", (e) => {
    e.preventDefault();
    deferredPrompt = e;
    const btn = document.getElementById("install-btn");
    if (btn) btn.hidden = false;
  });
}

async function route() {
  if (cleanup) {
    cleanup();
    cleanup = null;
  }
  const root = screen();
  const hash = location.hash || "#/";
  const playing = hash.startsWith("#/play/");
  document.body.classList.toggle("playing", playing);
  document.getElementById("nav-back").hidden = hash === "#/" || hash === "#";
  try {
    if (hash.startsWith("#/play/")) await showPlay(decodeURIComponent(hash.slice(7)));
    else if (hash.startsWith("#/checkout/")) renderCheckout(root, hash.slice("#/checkout/".length));
    else if (hash === "#/shop") renderShop(root);
    else if (hash === "#/how") renderHow(root);
    else if (hash === "#/photo") renderPhoto(root);
    else if (hash === "#/settings") renderSettings(root);
    else await renderHome(root);
  } catch (err) {
    root.innerHTML = `<section class="screen"><h1>Something snagged.</h1><p>${escapeHtml(err.message || "Please go back home.")}</p><a href="#/">Home</a></section>`;
  }
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

async function showPlay(id) {
  const root = screen();
  root.innerHTML = `<section class="screen"><p>Opening the page…</p></section>`;
  let picture = null;
  let meta = null;
  if (id.startsWith("photo-")) {
    if (!canUsePhoto(app.ent)) {
      location.hash = "#/shop";
      return;
    }
    const row = await getPhoto(id);
    if (!row) throw new Error("That photo page isn't on this device.");
    picture = row.picture;
    meta = { id: row.id, title: picture.title, tier: picture.tier, pack: "photo" };
  } else {
    const found = findPicture(id);
    if (!found) throw new Error("That picture isn't in the library.");
    if (!hasAccess(app.ent, found.pack)) {
      location.hash = "#/shop";
      return;
    }
    const res = await fetch(asset(found.picture.file));
    const payload = await res.json();
    picture = payload.enc ? await decryptPack(payload) : payload;
    meta = { id: picture.id, title: picture.title, tier: picture.tier, pack: found.pack.id };
  }
  await openPlay(root, picture, meta);
  cleanup = () => closePlay(root);
}

function findPicture(id) {
  for (const pack of app.catalog.packs) {
    const picture = pack.pictures.find((p) => p.id === id);
    if (picture) return { pack, picture };
  }
  return null;
}

async function decryptPack(payload) {
  const res = await fetch(asset("config/pack-keys.json"));
  const keys = await res.json();
  const key = keys[payload.product];
  if (!key) throw new Error("Missing pack key.");
  const raw = Uint8Array.from(atob(payload.data), (c) => c.charCodeAt(0));
  const k = new TextEncoder().encode(key);
  const out = new Uint8Array(raw.length);
  for (let i = 0; i < raw.length; i++) out[i] = raw[i] ^ k[i % k.length] ^ ((i * 13 + 7) & 255);
  const text = new TextDecoder().decode(out);
  return JSON.parse(text);
}

async function renderHome(root) {
  const progress = await allProgress();
  const photos = canUsePhoto(app.ent) ? await (await import("./db.js")).allPhotos() : [];
  const continueItems = progress
    .filter((p) => p.filled && p.filled.length && p.filled.length < (p.total || Infinity))
    .sort((a, b) => b.updatedAt - a.updatedAt)
    .slice(0, 8);
  const filter = app.tierFilter;
  const lastBackup = Number(localStorage.getItem("wcca-last-backup") || 0);
  const showBackup = progress.length > 0 && Date.now() - lastBackup > 1000 * 60 * 60 * 24 * 7;
  const showInstall = !app.settings.installDismissed && app.settings.visits >= 2;
  root.innerHTML = `
    <section class="screen home">
      <div class="hero">
        <img class="hero-logo" src="${asset("icons/logo.svg")}" alt="WingsCrew">
        <div>
          <p class="eyebrow">WingsCrew studio</p>
          <h1>Color Adventures</h1>
          <p>Calm pages for little kids, big kids, and adults. No ads. Your photos never leave this device.</p>
        </div>
      </div>
      <div class="tier-switch" role="tablist">
        ${["all", "little", "big", "adult"]
          .map((tier) => `<button type="button" data-tier="${tier}" class="${filter === tier ? "on" : ""}" role="tab" aria-selected="${filter === tier}">${tier === "all" ? "All" : TIER_LABEL[tier]}</button>`)
          .join("")}
      </div>
      ${
        continueItems.length
          ? `<h2>Continue</h2><div class="card-row">${continueItems
              .map((p) => {
                const pct = p.total ? Math.round((p.filled.length / p.total) * 100) : 0;
                return `<a class="mini-card" href="#/play/${encodeURIComponent(p.id)}"><strong>${escapeHtml(p.title || p.id)}</strong><span>${pct}% filled</span></a>`;
              })
              .join("")}</div>`
          : ""
      }
      <a class="photo-cta" href="#/photo">+ From a photo</a>
      ${showInstall ? installCard() : ""}
      ${showBackup ? `<p class="banner">It's been a while since a backup. Safari can clear site data. <a href="#/settings">Save a backup file</a>.</p>` : ""}
      ${app.catalog.packs
        .map((pack) => {
          const pics = pack.pictures.filter((p) => filter === "all" || p.tier === filter);
          if (!pics.length) return "";
          const locked = !hasAccess(app.ent, pack);
          return `<section class="shelf">
            <div class="shelf-head"><h2>${escapeHtml(pack.title)}</h2><p>${escapeHtml(pack.tagline)}</p></div>
            <div class="card-grid">${pics.map((p) => pictureCard(p, locked)).join("")}</div>
          </section>`;
        })
        .join("")}
      ${
        photos.length
          ? `<h2>Your photos</h2><div class="card-row">${photos
              .map((p) => `<a class="mini-card" href="#/play/${encodeURIComponent(p.id)}"><strong>${escapeHtml(p.picture.title)}</strong><span>${p.picture.regions.length} regions</span></a>`)
              .join("")}</div>`
          : ""
      }
    </section>`;
  root.querySelectorAll("[data-tier]").forEach((btn) => {
    btn.addEventListener("click", () => {
      app.tierFilter = btn.dataset.tier;
      renderHome(root);
    });
  });
  const dismiss = root.querySelector("[data-dismiss-install]");
  if (dismiss) {
    dismiss.addEventListener("click", () => {
      app.settings.installDismissed = true;
      saveSettings();
      renderHome(root);
    });
  }
  const installBtn = root.querySelector("#install-btn");
  if (installBtn) {
    installBtn.hidden = !deferredPrompt;
    installBtn.addEventListener("click", async () => {
      if (!deferredPrompt) return;
      deferredPrompt.prompt();
      await deferredPrompt.userChoice;
      deferredPrompt = null;
    });
  }
}

function pictureCard(p, locked) {
  const href = locked ? "#/shop" : `#/play/${encodeURIComponent(p.id)}`;
  return `<a class="pic-card${locked ? " locked" : ""}" href="${href}">
    <img src="${asset(p.preview)}" alt="">
    <span class="tier-pill">${TIER_LABEL[p.tier]}</span>
    <strong>${escapeHtml(p.title)}</strong>
    <span>${p.regions} regions${locked ? " · locked" : ""}</span>
  </a>`;
}

function installCard() {
  const ios = /iPad|iPhone|iPod/.test(navigator.userAgent) || (navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1);
  return `<aside class="install-card">
    <h2>Keep it on your Home Screen</h2>
    <p>${ios ? "In Safari, tap Share, then Add to Home Screen. Installed pages keep their coloring more reliably." : "Install the app so it opens full screen and keeps your pages offline."}</p>
    <div class="row-actions">
      <button type="button" id="install-btn" hidden>Install</button>
      <button type="button" class="ghost" data-dismiss-install>Not now</button>
    </div>
  </aside>`;
}

function renderSettings(root) {
  const s = app.settings;
  root.innerHTML = `
    <section class="screen settings">
      <img class="hero-logo small" src="${asset("icons/logo.svg")}" alt="WingsCrew">
      <h1>Settings</h1>
      <label class="check"><input type="checkbox" data-set="penOnly" ${s.penOnly ? "checked" : ""}> Pen-only fill. Fingers only pan and zoom.</label>
      <label class="check"><input type="checkbox" data-set="shade" ${s.shade ? "checked" : ""}> Pen shading. Pressure darkens a filled region.</label>
      <label class="check"><input type="checkbox" data-set="sound" ${s.sound ? "checked" : ""}> Soft sounds</label>
      <label class="check"><input type="checkbox" data-set="thickLines" ${s.thickLines ? "checked" : ""}> Thicker outlines</label>
      <label>Number size
        <input data-set="numberScale" type="range" min="0.7" max="1.6" step="0.1" value="${s.numberScale}">
      </label>
      <h2>On this device</h2>
      <p>Coloring, unlocks, and photo pages are saved in this browser. Export a backup so a cleanup doesn't erase them.</p>
      <div class="row-actions">
        <button type="button" id="backup-btn">Export backup</button>
        <label class="button ghost">Import backup<input id="restore-file" type="file" accept="application/json,.json" hidden></label>
      </div>
      <p id="restore-msg"></p>
      <h2>Install</h2>
      <p>iPad or iPhone: Share, then Add to Home Screen. Android: use Install if Chrome offers it, or the browser menu.</p>
      <h2>About</h2>
      <p>WingsCrew Color Adventures is a calm color-by-number book from J D's WingsCrew studio. Photos are processed only on your device. There are no ads, no accounts, and no trackers.</p>
      <p>Unlock codes are checked offline. That only stops casual copying.</p>
      <p><a href="mailto:dovewingsbusiness@gmail.com">Feedback</a> · <a href="https://cash.app/$windigo98" rel="noopener">Tip on Cash App</a> · <a href="#/how">How buying works</a></p>
      <p class="fine">© 2026 WingsCrew. All rights reserved.</p>
    </section>`;
  root.querySelectorAll("[data-set]").forEach((input) => {
    input.addEventListener("change", () => {
      const key = input.dataset.set;
      app.settings[key] = input.type === "checkbox" ? input.checked : Number(input.value);
      saveSettings();
    });
  });
  root.querySelector("#backup-btn").addEventListener("click", () => exportBackup());
  root.querySelector("#restore-file").addEventListener("change", async (e) => {
    const file = e.target.files[0];
    const msg = root.querySelector("#restore-msg");
    if (!file) return;
    try {
      const result = await importBackup(file);
      msg.textContent = `Restored ${result.pictures} pages and ${result.codes} unlock code${result.codes === 1 ? "" : "s"}.`;
    } catch (err) {
      msg.textContent = err.message || "Could not read that file.";
    }
  });
}

document.getElementById("nav-back").addEventListener("click", () => {
  if (location.hash.startsWith("#/play/")) location.hash = "#/";
  else history.back();
});
document.getElementById("nav-shop").addEventListener("click", () => {
  location.hash = "#/shop";
});

boot().catch((err) => {
  screen().innerHTML = `<section class="screen"><h1>Couldn't open the book.</h1><p>${escapeHtml(err.message || "")}</p></section>`;
});

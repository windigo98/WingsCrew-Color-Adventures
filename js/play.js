import { app, TIER_LABEL, asset } from "./state.js";
import { Board } from "./renderer.js";
import { getProgress, saveProgress } from "./db.js";
import { normalizeHex, paletteFor, shadeRow } from "./colors.js";

export function progressFits(progress, picture) {
  if (!progress || !picture) return false;
  const count = picture.regions.length;
  if (picture.rev && progress.rev && progress.rev !== picture.rev) return false;
  if (Number.isInteger(progress.total) && progress.total !== count) return false;
  for (const index of progress.filled || []) {
    if (!Number.isInteger(index) || index < 0 || index >= count) return false;
  }
  return true;
}
import { parentGate, studioLink } from "./gate.js";
import { LOUPE_PAN_SLOP, loupeOffset, nextRegion, patternId } from "./aids.js";

let board = null;
let undoStack = [];
let redoStack = [];
let cursor = -1;
let saveTimer = 0;
let pictureMeta = null;
let alive = false;
let sheetIndex = null;
let shadeBase = null;

function tone(freq, dur = 0.08, gain = 0.035) {
  if (!app.settings.sound) return;
  const Ctx = window.AudioContext || window.webkitAudioContext;
  if (!Ctx) return;
  if (!tone.ctx) tone.ctx = new Ctx();
  const ctx = tone.ctx;
  const o = ctx.createOscillator();
  const g = ctx.createGain();
  o.type = "sine";
  o.frequency.value = freq;
  g.gain.value = gain;
  o.connect(g);
  g.connect(ctx.destination);
  o.start();
  g.gain.exponentialRampToValueAtTime(0.0001, ctx.currentTime + dur);
  o.stop(ctx.currentTime + dur);
}

function needsGate() {
  return pictureMeta && (pictureMeta.tier === "little" || pictureMeta.tier === "big");
}

export async function openPlay(root, picture, meta) {
  alive = true;
  pictureMeta = meta;
  undoStack = [];
  redoStack = [];
  cursor = -1;
  sheetIndex = null;
  shadeBase = null;
  root.innerHTML = `
    <section class="play" data-tier="${picture.tier}">
      <div class="playbar">
        <button type="button" data-act="back" aria-label="Back">Back</button>
        <div class="play-title">
          <strong>${escapeHtml(picture.title)}</strong>
          <span>${TIER_LABEL[picture.tier] || ""} · <span id="play-count">0</span>/${picture.regions.length}</span>
        </div>
        <div class="play-tools">
          <button type="button" data-act="undo" aria-label="Undo">Undo</button>
          <button type="button" data-act="redo" aria-label="Redo">Redo</button>
          <button type="button" data-act="zoomout" aria-label="Zoom out">−</button>
          <button type="button" data-act="zoomin" aria-label="Zoom in">+</button>
          <button type="button" data-act="fit">Fit</button>
          <button type="button" data-act="next">${picture.tier === "adult" ? "Find next" : "Next"}</button>
          <button type="button" data-act="highlight" aria-pressed="true">Highlight</button>
          ${picture.tier === "adult" ? `<button type="button" data-act="loupe" aria-pressed="${app.settings.loupe ? "true" : "false"}">Magnifier</button>` : ""}
        </div>
      </div>
      <p class="play-hint" id="play-hint">Tap a number and pick its color, then tap matching shapes. Pinch to zoom. Drag to move.</p>
      <div class="stage">
        <canvas id="board" aria-label="Coloring page"></canvas>
        <canvas id="loupe" class="loupe" width="280" height="280" hidden aria-hidden="true"></canvas>
        <div class="color-sheet" id="color-sheet" hidden role="dialog" aria-labelledby="color-sheet-title"></div>
      </div>
      <div class="palette" id="palette" role="listbox" aria-label="Colors"></div>
      <div class="complete" id="complete" hidden>
        <div class="complete-card">
          <p class="eyebrow">Finished</p>
          <h2>Beautiful work.</h2>
          <p>Every region of ${escapeHtml(picture.title)} is filled.</p>
          <div class="row-actions">
            <button type="button" data-act="save">Save PNG</button>
            <button type="button" data-act="print">Print</button>
            <button type="button" data-act="close-complete" class="ghost">Keep coloring</button>
          </div>
        </div>
      </div>
    </section>`;
  const canvas = root.querySelector("#board");
  board = new Board(canvas);
  app.board = board;
  board.numberScale = app.settings.numberScale;
  board.bigNumbers = !!app.settings.bigNumbers;
  board.patterns = !!app.settings.patterns;
  board.thickLines = app.settings.thickLines;
  board.highlight = true;
  const t0 = performance.now();
  board.load(picture);
  const progress = await getProgress(meta.id);
  if (!alive) return;
  if (progressFits(progress, picture)) board.applyState(progress);
  else {
    board.applyState(null);
    if (progress) {
      const snap = board.snapshot();
      await saveProgress({
        id: meta.id,
        title: meta.title,
        tier: meta.tier,
        pack: meta.pack || null,
        updatedAt: Date.now(),
        total: board.regions.length,
        rev: picture.rev || 1,
        ...snap,
      });
    }
  }
  board.fit();
  board.requestDraw();
  window.__WCCA = window.__WCCA || {};
  window.__WCCA.board = board;
  window.__WCCA.loadMs = performance.now() - t0;
  renderPalette();
  updateCount();
  bindPlay(root, picture, meta);
  const hint = root.querySelector("#play-hint");
  if (sessionStorage.getItem("wcca-hint")) hint.hidden = true;
  else hint.addEventListener("click", () => {
    hint.hidden = true;
    sessionStorage.setItem("wcca-hint", "1");
  });
}

function escapeHtml(s) {
  return String(s).replace(/[&<>"']/g, (c) => ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" }[c]));
}

function renderPalette() {
  const el = document.getElementById("palette");
  if (!el || !board) return;
  const { total, done } = board.colorStats();
  const showNames = !!app.settings.colorNames;
  const showPatterns = !!app.settings.patterns;
  el.innerHTML = board.picture.palette
    .map((color, i) => {
      const finished = total[i] > 0 && done[i] === total[i];
      const name = color.name ? escapeHtml(color.name) : "";
      const chosen = board.colorHex(i);
      const preset = normalizeHex(color.hex);
      const custom = preset && chosen !== preset;
      const label = `Number ${i + 1}${name ? ", " + name : ""}, ${done[i]} of ${total[i]}. Choose a color.`;
      return `<button type="button" class="swatch${i === board.selected ? " selected" : ""}${finished ? " done" : ""}${custom ? " custom" : ""}" data-color="${i}" role="option" aria-selected="${i === board.selected}" aria-expanded="${sheetIndex === i}" aria-haspopup="dialog" aria-label="${label}">
        <span class="chip${showPatterns ? ` pat pat-${patternId(i)}` : ""}" style="background-color:${chosen}"></span>
        <span class="num">${i + 1}</span>
        ${showNames && name ? `<span class="swatch-name">${name}</span>` : ""}
        <span class="swatch-meta">${done[i]}/${total[i]}${finished ? " ✓" : ""}</span>
      </button>`;
    })
    .join("");
}

function renderSheet() {
  const el = document.getElementById("color-sheet");
  if (!el || !board) return;
  if (sheetIndex == null) {
    el.hidden = true;
    el.innerHTML = "";
    return;
  }
  const index = sheetIndex;
  const preset = board.picture.palette[index];
  const presetHex = normalizeHex(preset?.hex) || board.colorHex(index);
  const current = board.colorHex(index);
  const base = shadeBase || current;
  const tier = pictureMeta?.tier || board.picture.tier;
  const little = tier === "little";
  const presetName = preset?.name ? escapeHtml(preset.name) : "";
  const paints = paletteFor(tier);
  const shades = shadeRow(base);
  const on = (hex) => normalizeHex(hex) === current ? " on" : "";
  const picks = paints
    .map((paint) => `<button type="button" class="pick${on(paint.hex)}" data-pick="${paint.hex}" data-base="1" data-name="${escapeHtml(paint.name)}" aria-label="${escapeHtml(paint.name)}" style="background-color:${paint.hex}"></button>`)
    .join("");
  const shadeButtons = shades
    .map((shade) => `<button type="button" class="shade${on(shade.hex)}" data-pick="${shade.hex}" aria-label="${escapeHtml(shade.name)} shade" style="background-color:${shade.hex}"></button>`)
    .join("");
  const pageColors = little
    ? ""
    : `<p class="shade-label">On this page</p>
      <div class="page-row">
        ${board.picture.palette.map((color, i) => {
          const hex = normalizeHex(color.hex);
          if (!hex) return "";
          const name = color.name ? `, ${escapeHtml(color.name)}` : "";
          return `<button type="button" class="mini-pick${on(hex)}" data-pick="${hex}" data-base="1" aria-label="Use number ${i + 1}${name}" style="background-color:${hex}"></button>`;
        }).join("")}
      </div>`;
  const mixer = little
    ? ""
    : `<label class="mix">Mix your own <input type="color" id="mix-color" value="${current.toLowerCase()}" aria-label="Mix your own color"></label>`;
  const sub = little
    ? "Tap a color for this number."
    : "Pick any color. Every shape with this number uses it.";
  const focusPick = document.activeElement?.closest?.("#color-sheet [data-pick]")?.dataset.pick || "";
  el.hidden = false;
  el.innerHTML = `
    <div class="color-sheet-head">
      <h2 id="color-sheet-title">Number ${index + 1}</h2>
      <button type="button" data-act="close-colors">Done</button>
    </div>
    <p class="sheet-sub">${sub}</p>
    <button type="button" class="suggest${on(presetHex)}" data-pick="${presetHex}" data-base="1" aria-label="Suggested color${presetName ? " " + presetName : ""}">
      <span class="chip" style="background-color:${presetHex}"></span>
      <span>Suggested${presetName ? " · " + presetName : ""}</span>
    </button>
    <div class="pick-grid">${picks}</div>
    <p class="shade-label">Shades</p>
    <div class="shade-row">${shadeButtons}</div>
    ${pageColors}
    ${mixer}`;
  if (focusPick) {
    const again = [...el.querySelectorAll("[data-pick]")].find((node) => node.dataset.pick === focusPick);
    again?.focus();
  }
}

function openSheet(index) {
  if (!board || !board.picture.palette[index]) return;
  board.selected = index;
  cursor = -1;
  sheetIndex = index;
  shadeBase = board.colorHex(index);
  board.rebuildHighlight();
  board.requestDraw();
  renderPalette();
  renderSheet();
  document.querySelector(`.swatch[data-color="${index}"]`)?.scrollIntoView({ inline: "center", block: "nearest" });
  document.querySelector("#color-sheet .suggest")?.focus();
}

function closeSheet() {
  const index = sheetIndex;
  sheetIndex = null;
  shadeBase = null;
  renderSheet();
  renderPalette();
  if (index != null) document.querySelector(`.swatch[data-color="${index}"]`)?.focus();
}

function applyPick(hex, resetBase) {
  if (sheetIndex == null || !board) return;
  const next = normalizeHex(hex);
  if (!next) return;
  if (resetBase) shadeBase = next;
  const prev = board.colorHex(sheetIndex);
  if (prev === next) {
    if (resetBase) renderSheet();
    return;
  }
  undoStack.push({ kind: "color", index: sheetIndex, hex: prev });
  if (undoStack.length > 400) undoStack.shift();
  redoStack.length = 0;
  board.setSlotColor(sheetIndex, next);
  tone(620, 0.05);
  afterFill(pictureMeta);
}

function updateCount() {
  const el = document.getElementById("play-count");
  if (el && board) el.textContent = String(board.filledCount());
}

function scheduleSave(meta) {
  clearTimeout(saveTimer);
  saveTimer = setTimeout(() => {
    if (!board) return;
    const snap = board.snapshot();
    saveProgress({
      id: meta.id,
      title: meta.title,
      tier: meta.tier,
      pack: meta.pack || null,
      updatedAt: Date.now(),
      total: board.regions.length,
      rev: meta.rev || board.picture?.rev || 1,
      ...snap,
    });
  }, 80);
}

function flashColor(index) {
  const btn = document.querySelector(`.swatch[data-color="${index}"]`);
  if (!btn) return;
  btn.classList.add("flash");
  btn.scrollIntoView({ inline: "center", block: "nearest" });
  setTimeout(() => btn.classList.remove("flash"), 450);
}

function afterFill(meta) {
  renderPalette();
  if (sheetIndex != null) renderSheet();
  updateCount();
  scheduleSave(meta);
  if (board.isComplete()) {
    tone(660, 0.12);
    setTimeout(() => tone(880, 0.16), 90);
    const overlay = document.getElementById("complete");
    if (overlay) overlay.hidden = false;
  }
}

function doFill(index, meta, shadeValue = 0) {
  const region = board.regions[index];
  if (!region) return;
  if (board.filled[index] && !shadeValue) {
    board.selected = region.c;
    if (sheetIndex != null && sheetIndex !== region.c) {
      sheetIndex = region.c;
      shadeBase = board.colorHex(region.c);
    }
    board.rebuildHighlight();
    board.requestDraw();
    renderPalette();
    if (sheetIndex != null) renderSheet();
    return;
  }
  if (region.c !== board.selected && !board.filled[index]) {
    flashColor(region.c);
    tone(180, 0.09, 0.02);
    return;
  }
  undoStack.push({ i: index, filled: board.filled[index], shade: board.shades[index] });
  if (undoStack.length > 400) undoStack.shift();
  redoStack.length = 0;
  if (shadeValue) {
    board.setShade(index, shadeValue);
    if (region.c === board.selected) board.rebuildHighlight();
  } else {
    board.fill(index);
  }
  tone(520, 0.05);
  afterFill(meta);
  window.__WCCA.lastFillMs = board.lastFillMs;
}

function undo(meta) {
  const step = undoStack.pop();
  if (!step) return;
  if (step.kind === "color") {
    const current = board.colorHex(step.index);
    redoStack.push({ kind: "color", index: step.index, hex: current });
    if (sheetIndex === step.index) shadeBase = step.hex;
    board.setSlotColor(step.index, step.hex);
    afterFill(meta);
    return;
  }
  redoStack.push({ i: step.i, filled: board.filled[step.i], shade: board.shades[step.i] });
  board.filled[step.i] = step.filled;
  board.shades[step.i] = step.shade;
  board.paintRegion(step.i);
  board.rebuildHighlight();
  board.requestDraw();
  const overlay = document.getElementById("complete");
  if (overlay && !board.isComplete()) overlay.hidden = true;
  afterFill(meta);
}

function redo(meta) {
  const step = redoStack.pop();
  if (!step) return;
  if (step.kind === "color") {
    const current = board.colorHex(step.index);
    undoStack.push({ kind: "color", index: step.index, hex: current });
    if (sheetIndex === step.index) shadeBase = step.hex;
    board.setSlotColor(step.index, step.hex);
    afterFill(meta);
    return;
  }
  undoStack.push({ i: step.i, filled: board.filled[step.i], shade: board.shades[step.i] });
  board.filled[step.i] = step.filled;
  board.shades[step.i] = step.shade;
  board.paintRegion(step.i);
  board.rebuildHighlight();
  board.requestDraw();
  afterFill(meta);
}

function nextUnfilled() {
  const onlySelected = pictureMeta?.tier === "adult";
  const found = nextRegion(board.regions, board.filled, board.selected, cursor, onlySelected);
  cursor = found.cursor;
  if (!found.region) {
    window.__WCCA = window.__WCCA || {};
    window.__WCCA.lastNext = -1;
    const hint = document.getElementById("play-hint");
    if (hint) {
      hint.hidden = false;
      hint.textContent = "That color is all filled. Pick another color.";
    }
    return;
  }
  board.gesturing = false;
  board.zoomToRegion(found.region);
  window.__WCCA = window.__WCCA || {};
  window.__WCCA.lastNext = found.region.i;
}

async function savePng() {
  if (needsGate() && !(await parentGate())) return;
  const canvas = board.exportCanvas(1800, false);
  const blob = await new Promise((resolve) => canvas.toBlob(resolve, "image/png"));
  const name = `wingscrew-${pictureMeta.id}.png`;
  if (navigator.share && navigator.canShare) {
    const file = new File([blob], name, { type: "image/png" });
    if (navigator.canShare({ files: [file] })) {
      try {
        await navigator.share({ files: [file], title: pictureMeta.title });
        return;
      } catch {
        /* fall through to download */
      }
    }
  }
  const a = document.createElement("a");
  a.href = URL.createObjectURL(blob);
  a.download = name;
  a.click();
  setTimeout(() => URL.revokeObjectURL(a.href), 4000);
}

async function printPage() {
  if (needsGate() && !(await parentGate())) return;
  const canvas = board.exportCanvas(1600, false);
  const url = canvas.toDataURL("image/png");
  const frame = document.createElement("div");
  frame.id = "print-root";
  frame.innerHTML = `<img alt="${escapeHtml(pictureMeta.title)}" src="${url}"><p class="print-caption">${escapeHtml(pictureMeta.title)} · © 2026 ${studioLink()}</p>`;
  document.body.appendChild(frame);
  document.body.classList.add("printing");
  window.print();
  setTimeout(() => {
    frame.remove();
    document.body.classList.remove("printing");
  }, 500);
}

function bindPlay(root, picture, meta) {
  const canvas = root.querySelector("#board");
  const loupe = root.querySelector("#loupe");
  const pointers = new Map();
  let mode = null;
  let moved = false;
  let start = null;
  let lastPen = 0;
  let penHover = false;
  let pinch = null;

  const localPoint = (e) => {
    const rect = canvas.getBoundingClientRect();
    return { x: e.clientX - rect.left, y: e.clientY - rect.top };
  };

  let loupeEvent = null;
  let loupeRaf = 0;
  const hideLoupe = () => {
    loupeEvent = null;
    if (loupe) loupe.hidden = true;
  };
  const paintLoupe = (point) => {
    if (!loupe || !board || !app.settings.loupe || picture.tier !== "adult") return;
    const stage = canvas.parentElement.getBoundingClientRect();
    const localX = point.clientX - stage.left;
    const localY = point.clientY - stage.top;
    if (localX < 0 || localY < 0 || localX > stage.width || localY > stage.height) {
      loupe.hidden = true;
      return;
    }
    const pos = loupeOffset(localX, localY, stage.width, stage.height, 140, 18);
    loupe.style.left = `${pos.left}px`;
    loupe.style.top = `${pos.top}px`;
    loupe.hidden = false;
    const ctx = loupe.getContext("2d");
    const size = loupe.width;
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    const sx = (point.clientX - rect.left) * scaleX;
    const sy = (point.clientY - rect.top) * scaleY;
    const src = 18 * scaleX;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.clearRect(0, 0, size, size);
    ctx.save();
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 6, 0, Math.PI * 2);
    ctx.clip();
    ctx.drawImage(canvas, sx - src, sy - src, src * 2, src * 2, 0, 0, size, size);
    ctx.restore();
    ctx.strokeStyle = "#1b2430";
    ctx.lineWidth = 8;
    ctx.beginPath();
    ctx.arc(size / 2, size / 2, size / 2 - 8, 0, Math.PI * 2);
    ctx.stroke();
    ctx.strokeStyle = "#e25b1a";
    ctx.lineWidth = 3;
    ctx.beginPath();
    ctx.moveTo(size / 2 - 16, size / 2);
    ctx.lineTo(size / 2 + 16, size / 2);
    ctx.moveTo(size / 2, size / 2 - 16);
    ctx.lineTo(size / 2, size / 2 + 16);
    ctx.stroke();
  };
  const queueLoupe = (e) => {
    if (!app.settings.loupe || picture.tier !== "adult") return;
    loupeEvent = { clientX: e.clientX, clientY: e.clientY };
    if (loupeRaf) return;
    loupeRaf = requestAnimationFrame(() => {
      loupeRaf = 0;
      if (loupeEvent) paintLoupe(loupeEvent);
    });
  };

  const onClick = (e) => {
    const pick = e.target.closest("[data-pick]");
    if (pick) {
      applyPick(pick.dataset.pick, pick.dataset.base === "1");
      return;
    }
    const colorBtn = e.target.closest("[data-color]");
    if (colorBtn) {
      const index = +colorBtn.dataset.color;
      if (sheetIndex === index) closeSheet();
      else openSheet(index);
      return;
    }
    const act = e.target.closest("[data-act]")?.dataset.act;
    if (!act) return;
    if (act === "back") location.hash = "#/";
    if (act === "undo") undo(meta);
    if (act === "redo") redo(meta);
    if (act === "zoomout") {
      const p = { x: board.cssW / 2, y: board.cssH / 2 };
      board.zoomAt(p.x, p.y, 1 / 1.25);
      board.requestDraw();
    }
    if (act === "zoomin") {
      const p = { x: board.cssW / 2, y: board.cssH / 2 };
      board.zoomAt(p.x, p.y, 1.25);
      board.requestDraw();
    }
    if (act === "fit") {
      board.fit();
      board.requestDraw();
    }
    if (act === "next") nextUnfilled();
    if (act === "loupe") {
      app.settings.loupe = !app.settings.loupe;
      e.target.closest("[data-act]").setAttribute("aria-pressed", String(app.settings.loupe));
      localStorage.setItem("wcca-settings", JSON.stringify(app.settings));
      if (!app.settings.loupe) hideLoupe();
    }
    if (act === "highlight") {
      board.highlight = !board.highlight;
      e.target.closest("[data-act]").setAttribute("aria-pressed", String(board.highlight));
      board.rebuildHighlight();
      board.requestDraw();
    }
    if (act === "save") savePng();
    if (act === "print") printPage();
    if (act === "close-complete") document.getElementById("complete").hidden = true;
    if (act === "close-colors") closeSheet();
  };
  root.addEventListener("click", onClick);
  const onMix = (e) => {
    if (e.target.id !== "mix-color") return;
    applyPick(e.target.value, true);
  };
  root.addEventListener("change", onMix);

  window.addEventListener("keydown", onKey);
  function onKey(e) {
    if (!alive) return;
    if (e.key === "Escape" && sheetIndex != null) {
      e.preventDefault();
      closeSheet();
      return;
    }
    if ((e.metaKey || e.ctrlKey) && e.key.toLowerCase() === "z") {
      e.preventDefault();
      if (e.shiftKey) redo(meta);
      else undo(meta);
    }
  }

  canvas.addEventListener("wheel", (e) => {
    e.preventDefault();
    const p = localPoint(e);
    board.gesturing = true;
    board.zoomAt(p.x, p.y, Math.exp(-e.deltaY * 0.0012));
    board.requestDraw();
    clearTimeout(canvas._wheelEnd);
    canvas._wheelEnd = setTimeout(() => {
      board.gesturing = false;
      board.requestDraw();
    }, 120);
  }, { passive: false });

  canvas.addEventListener("pointerdown", (e) => {
    if (e.pointerType === "pen") {
      lastPen = performance.now();
      penHover = true;
    }
    if (e.pointerType === "touch") {
      const palm = (e.width || 0) > 34 || (e.height || 0) > 34;
      const recentPen = penHover || performance.now() - lastPen < 800;
      if (palm || recentPen) return;
    }
    try { canvas.setPointerCapture(e.pointerId); } catch { /* ignore */ }
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, type: e.pointerType });
    if (pointers.size === 1) {
      mode = "pending";
      moved = false;
      start = { x: e.clientX, y: e.clientY, t: performance.now(), type: e.pointerType, panX: board.panX, panY: board.panY };
      pinch = null;
      queueLoupe(e);
    } else if (pointers.size === 2) {
      mode = "pinch";
      moved = true;
      hideLoupe();
      const pts = [...pointers.values()];
      pinch = { dist: Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) || 1 };
    }
  });

  canvas.addEventListener("pointermove", (e) => {
    if (e.pointerType === "pen") {
      lastPen = performance.now();
      penHover = e.buttons === 0 || penHover;
      if (e.buttons === 0) penHover = true;
    }
    if (!pointers.has(e.pointerId)) {
      if (e.pointerType === "mouse" && pointers.size === 0) queueLoupe(e);
      return;
    }
    if (pointers.size === 1) queueLoupe(e);
    pointers.set(e.pointerId, { x: e.clientX, y: e.clientY, type: e.pointerType });
    if (mode === "pinch" && pointers.size >= 2 && pinch) {
      const pts = [...pointers.values()];
      const dist = Math.hypot(pts[0].x - pts[1].x, pts[0].y - pts[1].y) || 1;
      const mid = { x: (pts[0].x + pts[1].x) / 2, y: (pts[0].y + pts[1].y) / 2 };
      const rect = canvas.getBoundingClientRect();
      const factor = dist / pinch.dist;
      pinch.dist = dist;
      board.gesturing = true;
      board.zoomAt(mid.x - rect.left, mid.y - rect.top, factor);
      board.requestDraw();
      return;
    }
    if (!start || mode === "pinch") return;
    const dx = e.clientX - start.x;
    const dy = e.clientY - start.y;
    const slop = app.settings.loupe && picture.tier === "adult" ? LOUPE_PAN_SLOP : 9;
    if (!moved && Math.hypot(dx, dy) > slop) {
      moved = true;
      mode = "pan";
      board.gesturing = true;
    }
    if (mode !== "pan") return;
    if (start.type === "pen" && app.settings.shade) {
      const p = localPoint(e);
      const hit = board.hitTest(p.x, p.y);
      if (hit >= 0 && board.regions[hit].c === board.selected) {
        const pressure = Math.max(0.15, Math.min(1, e.pressure || 0.5));
        doFill(hit, meta, Math.round(pressure * 255));
      }
      return;
    }
    board.panX = start.panX + dx;
    board.panY = start.panY + dy;
    board.clampPan();
    start.panX = board.panX;
    start.panY = board.panY;
    start.x = e.clientX;
    start.y = e.clientY;
    board.requestDraw();
  });

  const endPointer = (e) => {
    if (e.pointerType === "pen" && e.type === "pointerup") penHover = false;
    const was = pointers.get(e.pointerId);
    pointers.delete(e.pointerId);
    if (!was) return;
    if (pointers.size === 0) {
      const tap = mode === "pending" && !moved && performance.now() - (start?.t || 0) < 500;
      const penFills = start?.type === "pen";
      const fingerFills = start?.type !== "pen" && !app.settings.penOnly;
      if (tap && (penFills || fingerFills)) {
        const p = localPoint(e);
        const hit = board.hitTest(p.x, p.y);
        if (hit >= 0) {
          if (penFills && app.settings.shade) {
            const pressure = Math.max(0.15, Math.min(1, e.pressure || 0.45));
            doFill(hit, meta, Math.round(pressure * 220));
          } else doFill(hit, meta, 0);
        }
      }
      mode = null;
      start = null;
      pinch = null;
      hideLoupe();
      board.gesturing = false;
      board.requestDraw();
    }
  };
  canvas.addEventListener("pointerup", endPointer);
  canvas.addEventListener("pointercancel", endPointer);
  canvas.addEventListener("pointerleave", (e) => {
    if (e.pointerType === "pen") penHover = false;
    if (pointers.size === 0) hideLoupe();
  });

  const ro = new ResizeObserver(() => {
    if (!board) return;
    board.layout();
    board.clampPan();
    board.requestDraw();
  });
  ro.observe(canvas.parentElement);
  root._cleanup = () => {
    alive = false;
    sheetIndex = null;
    shadeBase = null;
    ro.disconnect();
    root.removeEventListener("click", onClick);
    root.removeEventListener("change", onMix);
    window.removeEventListener("keydown", onKey);
    clearTimeout(saveTimer);
    if (loupeRaf) cancelAnimationFrame(loupeRaf);
    hideLoupe();
    if (board) {
      const snap = board.snapshot();
      saveProgress({
        id: meta.id,
        title: meta.title,
        tier: meta.tier,
        pack: meta.pack || null,
        rev: meta.rev || board.picture?.rev || 1,
        updatedAt: Date.now(),
        total: board.regions.length,
        ...snap,
      });
    }
    app.board = null;
    board = null;
  };
}

export function closePlay(root) {
  root._cleanup?.();
}

export { asset };

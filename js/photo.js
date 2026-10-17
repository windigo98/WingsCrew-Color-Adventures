import { app, asset } from "./state.js";
import { canUsePhoto } from "./unlock.js";
import { savePhoto } from "./db.js";

let worker = null;

export function renderPhoto(root) {
  const unlocked = canUsePhoto(app.ent);
  root.innerHTML = `
    <section class="screen photo">
      <p class="eyebrow">From a photo</p>
      <h1>Turn a picture into a page.</h1>
      <p>The photo stays on this device. Nothing is uploaded. A full unlock or the future-packs pass lets you color and save the page.</p>
      ${unlocked ? "" : `<p class="banner">Preview is free. Coloring this page is part of Full Unlock. <a href="#/shop">See the shop</a></p>`}
      <label class="file-pick">Choose a photo
        <input id="photo-file" type="file" accept="image/*" capture="environment">
      </label>
      <img id="photo-preview" alt="" hidden>
      <div class="sliders">
        <label>Colors <output id="k-out">18</output>
          <input id="k-range" type="range" min="8" max="48" value="18">
        </label>
        <label>Detail <output id="d-out">Medium</output>
          <input id="d-range" type="range" min="0" max="100" value="45">
        </label>
      </div>
      <div class="row-actions">
        <button type="button" id="photo-go" disabled>Make a page</button>
        <button type="button" id="photo-cancel" class="ghost" hidden>Cancel</button>
      </div>
      <div class="progress-wrap" id="photo-progress" hidden>
        <div class="progress-bar"><span id="photo-bar"></span></div>
        <p id="photo-stage">Working…</p>
      </div>
      <div id="photo-done" hidden>
        <p id="photo-summary"></p>
        <div class="row-actions">
          <button type="button" id="photo-color">Color this page</button>
        </div>
      </div>
      <p class="form-error" id="photo-error" hidden></p>
    </section>`;
  const fileInput = root.querySelector("#photo-file");
  const preview = root.querySelector("#photo-preview");
  const go = root.querySelector("#photo-go");
  const kRange = root.querySelector("#k-range");
  const dRange = root.querySelector("#d-range");
  let imageData = null;
  let result = null;

  const detailLabel = () => {
    const v = +dRange.value;
    root.querySelector("#d-out").textContent = v < 34 ? "Easier" : v < 67 ? "Medium" : "Intricate";
  };
  kRange.addEventListener("input", () => {
    root.querySelector("#k-out").textContent = kRange.value;
  });
  dRange.addEventListener("input", detailLabel);
  detailLabel();

  fileInput.addEventListener("change", async () => {
    const file = fileInput.files && fileInput.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    preview.src = url;
    preview.hidden = false;
    const img = await loadImage(url);
    const max = 900;
    const scale = Math.min(1, max / Math.max(img.width, img.height));
    const canvas = document.createElement("canvas");
    canvas.width = Math.max(16, Math.round(img.width * scale));
    canvas.height = Math.max(16, Math.round(img.height * scale));
    const ctx = canvas.getContext("2d", { willReadFrequently: true });
    ctx.drawImage(img, 0, 0, canvas.width, canvas.height);
    imageData = ctx.getImageData(0, 0, canvas.width, canvas.height);
    go.disabled = false;
    URL.revokeObjectURL(url);
  });

  go.addEventListener("click", () => {
    if (!imageData) return;
    root.querySelector("#photo-error").hidden = true;
    root.querySelector("#photo-done").hidden = true;
    root.querySelector("#photo-progress").hidden = false;
    root.querySelector("#photo-cancel").hidden = false;
    go.disabled = true;
    if (worker) worker.terminate();
    worker = new Worker(new URL("./photo-worker.js", import.meta.url), { type: "module" });
    worker.onmessage = async (event) => {
      const msg = event.data;
      if (msg.error) {
        fail(msg.error);
        return;
      }
      root.querySelector("#photo-bar").style.width = Math.round((msg.progress || 0) * 100) + "%";
      root.querySelector("#photo-stage").textContent = msg.stage || "";
      if (!msg.picture) return;
      result = msg.picture;
      result.title = "My Photo";
      root.querySelector("#photo-progress").hidden = true;
      root.querySelector("#photo-cancel").hidden = true;
      root.querySelector("#photo-done").hidden = false;
      root.querySelector("#photo-summary").textContent = `${result.regions.length} regions · ${result.palette.length} colors`;
      const colorBtn = root.querySelector("#photo-color");
      if (!canUsePhoto(app.ent)) {
        colorBtn.textContent = "Unlock to color";
        colorBtn.onclick = () => {
          location.hash = "#/shop";
        };
      } else {
        colorBtn.textContent = "Color this page";
        colorBtn.onclick = async () => {
          await savePhoto({ id: result.id, picture: result, createdAt: Date.now() });
          location.hash = "#/play/" + result.id;
        };
      }
      go.disabled = false;
    };
    worker.onerror = () => fail("The photo tool stopped. Try a smaller picture.");
    const copy = imageData.data.slice();
    worker.postMessage(
      {
        buffer: copy.buffer,
        width: imageData.width,
        height: imageData.height,
        colors: +kRange.value,
        detail: +dRange.value / 100,
      },
      [copy.buffer]
    );
  });

  root.querySelector("#photo-cancel").addEventListener("click", () => {
    if (worker) worker.terminate();
    worker = null;
    root.querySelector("#photo-progress").hidden = true;
    root.querySelector("#photo-cancel").hidden = true;
    go.disabled = !imageData;
    root.querySelector("#photo-stage").textContent = "Cancelled";
  });

  function fail(message) {
    root.querySelector("#photo-error").hidden = false;
    root.querySelector("#photo-error").textContent = message;
    root.querySelector("#photo-progress").hidden = true;
    go.disabled = !imageData;
  }
}

function loadImage(url) {
  return new Promise((resolve, reject) => {
    const img = new Image();
    img.onload = () => resolve(img);
    img.onerror = () => reject(new Error("Could not read that image."));
    img.src = url;
  });
}

export { asset };

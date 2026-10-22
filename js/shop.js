import { app, asset } from "./state.js";
import { lookupCode, rememberUnlock, hasAccess } from "./unlock.js";
import { inKidsMode, parentGate } from "./gate.js";

const BUY_CLEAR = "wcca-buy-cleared";

function money(n) {
  return "$" + Number(n).toFixed(2);
}

function productById(id) {
  return app.payments.products.find((p) => p.id === id);
}

export function renderShop(root) {
  const test = app.payments.testMode;
  const packs = app.catalog.packs.filter((p) => !p.free);
  const owned = (id) => {
    const pack = app.catalog.packs.find((p) => p.id === id);
    return pack ? hasAccess(app.ent, pack) : app.ent.has(id);
  };
  root.innerHTML = `
    <section class="screen shop">
      ${test ? `<p class="banner">TEST MODE: no real charge. Buy buttons open a practice checkout inside the app.</p>` : ""}
      <header class="screen-head">
        <p class="eyebrow">Pack store</p>
        <h1>Try free. Pay once.</h1>
        <p>No ads and no subscription. On the web, the charge comes from Payhip, not from this app. The app never sees your card.</p>
        <p><a href="#/how">How buying works</a></p>
      </header>
      ${cardFor(productById("full-unlock"), owned("full-unlock") || packs.every((p) => owned(p.id)), true)}
      <div class="pack-grid">
        ${packs.map((pack) => packCard(pack, owned(pack.id))).join("")}
      </div>
      <h2>Bundles</h2>
      <div class="pack-grid">
        ${cardFor(productById("bundle-story"), owned("bundle-story"))}
        ${cardFor(productById("all-future"), app.ent.has("all-future"))}
      </div>
      <form id="code-form" class="code-box">
        <h2>Enter unlock code</h2>
        <p>Paste the code from your Payhip email. It unlocks on this device, and you can enter it again if you reinstall.</p>
        <p class="fine">Codes are checked on this device against a list of scrambled fingerprints. That only stops casual copying.</p>
        <label>Unlock code <input name="code" autocomplete="off" placeholder="WCCA-...."></label>
        <p class="form-error" id="code-error" hidden></p>
        <button type="submit">Unlock</button>
      </form>
    </section>`;
  root.querySelector("#code-form").addEventListener("submit", async (e) => {
    e.preventDefault();
    const code = new FormData(e.target).get("code");
    const err = root.querySelector("#code-error");
    const found = await lookupCode(code);
    if (!found.ok) {
      err.hidden = false;
      err.textContent = found.reason;
      return;
    }
    const product = productById(found.product);
    await rememberUnlock(found.code, product.unlocks);
    const { entitlements } = await import("./unlock.js");
    app.ent = await entitlements();
    err.hidden = true;
    renderShop(root);
    const note = document.createElement("p");
    note.className = "banner";
    note.textContent = `${product.name} is unlocked on this device.`;
    root.querySelector(".shop").prepend(note);
  });
  bindShopClicks(root);
}

function packCard(pack, isOwned) {
  const product = productById(pack.productId);
  const preview = pack.pictures[0] ? asset(pack.pictures[0].preview) : "";
  return `<article class="store-card">
    <img src="${preview}" alt="">
    <div>
      <h3>${pack.title}</h3>
      <p>${pack.blurb}</p>
      <p class="price">${isOwned ? "Unlocked" : money(product.price) + " once"}</p>
      ${isOwned ? `<span class="pill">Yours</span>` : `<button type="button" data-buy="${product.id}">Buy</button>`}
    </div>
  </article>`;
}

function cardFor(product, isOwned, hero = false) {
  if (!product) return "";
  return `<article class="store-card${hero ? " hero-card" : ""}">
    <div>
      <h3>${product.name}</h3>
      <p>${product.blurb}</p>
      <p class="price">${isOwned ? "Unlocked" : money(product.price) + " one-time"}</p>
      ${isOwned ? `<span class="pill">Yours</span>` : `<button type="button" data-buy="${product.id}">Buy</button>`}
    </div>
  </article>`;
}

export function bindShopClicks(root) {
  if (root.dataset.shopBound) return;
  root.dataset.shopBound = "1";
  root.addEventListener("click", async (e) => {
    const id = e.target.closest("[data-buy]")?.dataset.buy;
    if (!id) return;
    if (inKidsMode()) {
      if (!(await parentGate())) return;
      sessionStorage.setItem(BUY_CLEAR, "1");
    }
    if (!app.settings.seenHow) {
      sessionStorage.setItem("wcca-after-how", id);
      location.hash = "#/how";
      return;
    }
    startPurchase(id);
  });
}

function openCheckout(id, product) {
  if (app.payments.testMode) {
    location.hash = "#/checkout/" + id;
    return;
  }
  window.open(product.payhipUrl, "_blank", "noopener");
}

export function startPurchase(id) {
  const product = productById(id);
  if (!product) return;
  const cleared = sessionStorage.getItem(BUY_CLEAR) === "1";
  sessionStorage.removeItem(BUY_CLEAR);
  if (inKidsMode() && !cleared) {
    parentGate().then((ok) => {
      if (ok) openCheckout(id, product);
    });
    return;
  }
  openCheckout(id, product);
}

export function renderHow(root) {
  root.innerHTML = `
    <section class="screen how">
      <p class="eyebrow">How buying works</p>
      <h1>Five small steps. Pay once.</h1>
      <ol class="steps">
        <li><strong>You tap Buy.</strong> Pick a pack, the Full Unlock, a bundle, or the future-packs pass.</li>
        <li><strong>Payhip takes the payment.</strong> You go to a secure checkout on payhip.com and pay by card or PayPal. This app never sees your card number. On the web, the charge comes from Payhip, not from WingsCrew Color Adventures.</li>
        <li><strong>Payhip emails your code.</strong> Right after payment, Payhip sends a license unlock code.</li>
        <li><strong>Come back and paste it.</strong> Open Enter unlock code in the shop and paste the code.</li>
        <li><strong>It stays unlocked.</strong> The pack unlocks on this device. The same code works again if you reinstall or restore a backup.</li>
      </ol>
      <p>Every price is a one-time payment. There is no subscription and nothing renews.</p>
      <p>Questions or a refund: <a href="mailto:dovewingsbusiness@gmail.com">dovewingsbusiness@gmail.com</a></p>
      <div class="row-actions">
        <button type="button" id="how-continue">Continue</button>
        <a class="button ghost" href="#/shop">Back to the shop</a>
      </div>
    </section>`;
  root.querySelector("#how-continue").addEventListener("click", () => {
    app.settings.seenHow = true;
    localStorage.setItem("wcca-settings", JSON.stringify(app.settings));
    const next = sessionStorage.getItem("wcca-after-how");
    sessionStorage.removeItem("wcca-after-how");
    if (next) startPurchase(next);
    else location.hash = "#/shop";
  });
}

export function renderCheckout(root, productId) {
  const product = productById(productId);
  if (!product) {
    root.innerHTML = `<section class="screen"><p>That product is missing.</p></section>`;
    return;
  }
  if (!app.payments.testMode) {
    root.innerHTML = `<section class="screen"><p>Opening Payhip…</p></section>`;
    const leave = async () => {
      if (inKidsMode() && !(await parentGate())) {
        location.hash = "#/shop";
        return;
      }
      window.open(product.payhipUrl, "_blank", "noopener");
      location.hash = "#/shop";
    };
    leave();
    return;
  }
  root.innerHTML = `
    <section class="screen checkout">
      <p class="banner">TEST MODE: no real charge</p>
      <p class="eyebrow">Practice checkout</p>
      <h1>Order summary</h1>
      <article class="store-card">
        <div>
          <h3>${product.name}</h3>
          <p>${product.blurb}</p>
          <p class="price">${money(product.price)} one-time</p>
          <p class="fine">This pretend Payhip page does not take a card and does not bill anyone. A real purchase will open payhip.com instead.</p>
        </div>
      </article>
      <div class="row-actions">
        <button type="button" id="fake-pay">Pay ${money(product.price)} (practice)</button>
        <a class="button ghost" href="#/shop">Cancel</a>
      </div>
      <div id="test-result" hidden>
        <h2>Payment recorded in test mode</h2>
        <p>Here is your practice unlock code. On a real order, Payhip would email this.</p>
        <p class="code-chip" id="test-code"></p>
        <button type="button" id="use-code">Enter this code</button>
      </div>
    </section>`;
  root.querySelector("#fake-pay").addEventListener("click", () => {
    root.querySelector("#test-result").hidden = false;
    root.querySelector("#test-code").textContent = product.testCode;
  });
  root.querySelector("#use-code").addEventListener("click", async () => {
    const found = await lookupCode(product.testCode);
    if (!found.ok) return;
    await rememberUnlock(found.code, product.unlocks);
    const { entitlements } = await import("./unlock.js");
    app.ent = await entitlements();
    location.hash = "#/shop";
  });
}

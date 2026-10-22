/** A simple grown-up check before kids can save, share, print, or leave the app. */

import { app } from "./state.js";

/** Little Kids and Big Kids shelves. The choice sticks while Shop and Settings are open. */
export function inKidsMode() {
  return app.tierFilter === "little" || app.tierFilter === "big";
}

export function isExternalHref(href) {
  if (!href) return false;
  const raw = href.trim();
  if (!raw || raw.startsWith("#")) return false;
  if (/^(mailto|tel|sms):/i.test(raw)) return true;
  try {
    const url = new URL(raw, location.href);
    if (url.protocol !== "http:" && url.protocol !== "https:") return false;
    return url.origin !== location.origin;
  } catch {
    return false;
  }
}

let pending = null;

export function parentGate() {
  if (pending) return pending;
  pending = new Promise((resolve) => {
    const a = 2 + Math.floor(Math.random() * 8);
    const b = 2 + Math.floor(Math.random() * 7);
    const answer = a + b;
    const root = document.getElementById("modal-root");
    const wrap = document.createElement("div");
    wrap.className = "modal-back";
    wrap.innerHTML = `
      <div class="modal" role="dialog" aria-modal="true" aria-labelledby="gate-title">
        <p class="eyebrow">Grown-ups</p>
        <h2 id="gate-title">A grown-up can help with this.</h2>
        <p>What is ${a} + ${b}?</p>
        <form id="gate-form">
          <input id="gate-answer" inputmode="numeric" autocomplete="off" aria-label="Answer">
          <p class="form-error" id="gate-error" hidden>Try the sum once more.</p>
          <div class="row-actions">
            <button type="submit">Continue</button>
            <button type="button" id="gate-hold" class="ghost">Hold to confirm</button>
            <button type="button" id="gate-cancel" class="ghost">Not now</button>
          </div>
        </form>
      </div>`;
    root.appendChild(wrap);
    const input = wrap.querySelector("#gate-answer");
    input.focus();
    let holdTimer = 0;
    const close = (ok) => {
      wrap.remove();
      pending = null;
      resolve(ok);
    };
    wrap.querySelector("#gate-form").addEventListener("submit", (e) => {
      e.preventDefault();
      if (Number(input.value) === answer) close(true);
      else wrap.querySelector("#gate-error").hidden = false;
    });
    wrap.querySelector("#gate-cancel").addEventListener("click", () => close(false));
    const hold = wrap.querySelector("#gate-hold");
    const start = () => {
      hold.classList.add("holding");
      holdTimer = setTimeout(() => close(true), 1600);
    };
    const stop = () => {
      hold.classList.remove("holding");
      clearTimeout(holdTimer);
    };
    hold.addEventListener("pointerdown", start);
    hold.addEventListener("pointerup", stop);
    hold.addEventListener("pointerleave", stop);
  });
  return pending;
}

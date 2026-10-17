# WingsCrew Color Adventures

A tablet-first color-by-number book from J D's WingsCrew studio. It is a static site: plain HTML, CSS, and JavaScript, with no backend and no build step required to host it.

**Pages URL:** https://windigo98.github.io/WingsCrew-Color-Adventures/

Every path is relative, and navigation is a hash router (`#/play/sunny-dragon`), so the app works from that project-site subpath.

## Open it

Any static host can serve this folder. For the Pages subpath locally:

```bash
node tools/serve.mjs
```

Then open http://127.0.0.1:4173/WingsCrew-Color-Adventures/

You can also open `index.html` from a local server at the site root. Opening the file directly (`file://`) will not work: the app uses ES modules, IndexedDB, and a service worker.

## GitHub Pages

This environment could not turn Pages on (the GitHub API for this repo declined the settings change). Turn it on once:

1. On GitHub, open **Settings → Pages** for `windigo98/WingsCrew-Color-Adventures`.
2. **Build and deployment → Source:** Deploy from a branch.
3. **Branch:** `main`, folder **`/ (root)`**.
4. Save. The first deploy can take a minute.
5. Confirm https://windigo98.github.io/WingsCrew-Color-Adventures/ loads the book.

`.nojekyll` is in the repo so GitHub Pages serves the `packs/` and `js/` trees as they are. Do not add a custom domain file unless you mean to leave `github.io`.

## What you can do

- Color three tiers: Little Kids, Big Kids, and Adults. Adults zoom to 8× the fit size, pan, undo and redo, jump to the next unfilled region, and highlight every region of the selected number.
- Numbers sit inside regions and hide when they would be smaller than about 10px.
- A stylus (`pointerType: "pen"`) fills precisely. A large touch, or a finger while the pen is hovering, is ignored. Settings can switch to pen-only fill (fingers only pan and zoom) and pressure shading.
- Progress autosaves in IndexedDB per picture. Settings can export and import a `.wingscrew.json` backup.
- Finished pages can be saved as PNG or printed. Little Kids and Big Kids pages ask a grown-up (a short sum, or hold to confirm) before saving or printing.
- Photo-to-puzzle runs entirely in a web worker on the device: palette reduction, regions, outlines, and number placement. Coloring a photo page needs Full Unlock or All Future Packs. The preview step does not.
- There are no ads, accounts, analytics, or third-party trackers.

## Packs

| Pack | Price | Pictures |
| --- | --- | --- |
| Starter | Free | 6, including an adult mandala |
| Fantastical Creatures | $2.49 | 8, including adult pages |
| Mandalas & Patterns | $2.99 | 8, mostly adult (up to 2,616 regions) |
| Christmas | $1.99 | 6 |
| Halloween | $1.99 | 7 (a pictorial adult page and a skull mandala) |
| Full Unlock | $4.99 once | Creatures, Mandalas, Christmas, Halloween, and photo-to-puzzle |
| Storybook Bundle | $5.99 once | Creatures, Christmas, and Halloween |
| All Future Packs | $16.99 once | Everything above, plus packs added later |

Prices are one-time. There is no subscription. On the web, a real charge comes from Payhip, not from this app. The app never sees a card number.

`node tools/check-packs.mjs` loads every picture (decrypting paid packs), checks each region for a palette index, a path, and a label point inside the region, and samples the page for gaps and overlaps. The latest run checked **35 pictures, 0 failed**. Details are in `docs/check-report.json`. Pictorial pages sampled with 0 missed cells. A few mandalas show a hairline miss or overlap under 0.1% of samples, inside the 0.4% allowance. That allowance is for edge rays on shared borders, not for open holes.

## Picture format

Each page is JSON:

```json
{
  "id": "sunny-dragon",
  "title": "Sunny Dragon",
  "tier": "little",
  "viewBox": [0, 0, 1000, 1000],
  "palette": [{ "hex": "#8ECAE6", "name": "Sky" }],
  "regions": [{ "c": 0, "d": "M 0 0 L 10 0 L 10 10 Z", "x": 5, "y": 5 }]
}
```

`c` is the palette index, `d` is an even-odd SVG path (holes are extra subpaths), and `x`/`y` is the number's anchor. Paid files are wrapped as `{ "enc": "WCCA1", "product": "creatures", "data": "<base64>" }`. The wrapper is a light XOR so a casual download is not plain art. The key ships in `config/pack-keys.json`. This is not DRM.

## Add a pack

1. Draw a page in `tools/art/scenes.mjs` with `kit()` (rectangles, polygons, strokes — no anti-aliasing, so regions stay closed), or add a mandala entry in `tools/art/mandalas.mjs`.
2. Point it at a pack id. If the pack is new, add it to `PACKS` in `tools/generate-packs.mjs`, add a product in `config/payments.json`, and add a key in `config/pack-keys.json`.
3. Generate and check:

```bash
node tools/generate-packs.mjs
node tools/check-packs.mjs
```

`node tools/generate-packs.mjs sunny-dragon` rebuilds one picture and skips rewriting the catalog. Run it with no argument before you ship.

Region targets: Little Kids 10–40, Big Kids 60–250, Adults 800–2,800. The tracer walks pixel corners so neighboring regions share edges. Simplification is cached per edge, so both sides stay gap-closed.

## Buying, test mode, and real Payhip

`config/payments.json` has `"testMode": true`. Buy buttons then open an in-app practice checkout labeled **TEST MODE: no real charge**. It shows the price, a pretend pay button, and a practice unlock code. Paste that code (or tap Enter this code) and the pack unlocks on the device. The same code works again after a reinstall if you enter it under Restore / Enter unlock code.

Practice codes, also listed in `config/payments.json`:

| Product | Code |
| --- | --- |
| Full Unlock | `WCCA-FULL-TEST-DEMO-4K7Q` |
| Fantastical Creatures | `WCCA-CREA-TEST-DEMO-8M2P` |
| Mandalas & Patterns | `WCCA-MAND-TEST-DEMO-5R9T` |
| Christmas | `WCCA-XMAS-TEST-DEMO-3W6H` |
| Halloween | `WCCA-HALL-TEST-DEMO-7N4C` |
| Storybook Bundle | `WCCA-BND3-TEST-DEMO-2Y8F` |
| All Future Packs | `WCCA-PASS-TEST-DEMO-6L1V` |

Codes are checked offline. The app hashes `WingsCrew-Color-Adventures-v1|` plus the code and compares it to `data/unlock-hashes.json`. That only stops casual copying. A determined person can read the hash list and the test codes.

To create the real license list:

```bash
node tools/generate-codes.mjs
```

That rewrites `data/unlock-hashes.json` (commit this) and `secrets/UNLOCK-CODES.txt` (gitignored). Upload each product's codes to Payhip as that product's license keys. Keep the practice code in the list so test mode still unlocks.

Switching to real checkout, only after each Payhip product exists:

1. Replace every `payhipUrl` in `config/payments.json`. They are `https://payhip.com/TODO/...` placeholders today.
2. Set `"testMode": false`.
3. Buy then opens that Payhip URL in a new tab. The customer pays by card or PayPal on payhip.com, Payhip emails the code, and they paste it into Enter unlock code.

There are no payment secrets in this repo. Do not add Payhip or Stripe API keys.

The shop links to **How buying works**, and the first Buy on a device shows those five steps before checkout: tap Buy, pay on Payhip, receive a code by email, paste it, and keep the unlock on this device (the code works again if you reinstall). Refunds and questions go to dovewingsbusiness@gmail.com. The note on the page says the charge comes from Payhip, not from the app.

## Architecture

- `index.html`, `css/app.css`, `js/` — the app. `js/main.js` boots the catalog, routes hashes, and decrypts a paid pack in the browser.
- `js/renderer.js` — one canvas, one `Path2D` per region. Hit tests use a spatial grid and `isPointInPath` in world coordinates. While you pan or zoom with many regions on screen, the page is a cached bitmap (1536px) so the frame stays cheap. Zoomed in, it redraws vectors so edges stay sharp. Numbers are redrawn in screen space and skipped when they are too small.
- `js/play.js` — palette progress, undo/redo, pinch, pen, palm rejection.
- `js/db.js` — IndexedDB database `wingscrew-color-adventures` (progress, photo pages, entitlements). Entitlements are also mirrored in `localStorage`.
- `js/photo-worker.js` — k-means in CIELAB, connected components, merge, the same vectorizer as the packs, pole-of-inaccessibility labels.
- `sw.js` and `manifest.webmanifest` — installable PWA. The service worker precaches the shell and starter catalog, then caches pack files as they are opened, so a reload works offline.
- `tools/` — art generator, coverage check, icon rasterizer, license hashes. Node is for authoring only.

## Performance (measured here, not on an iPad)

Playwright on Linux, Chromium, viewport 1024×1366, picture **Dragon Queen** (2,113 regions):

| Action | Time |
| --- | --- |
| Open the page (paths, grid, caches) | 153 ms |
| Pan frame, cached bitmap | 0.3 ms |
| Zoom frame, cached bitmap | 0.2 ms |
| Vector frame at 6× (96 regions visible) | 2.0 ms |
| Fill one region | 0.6 ms |
| Rebuild the full color cache | 0.4 ms |

Those times are from this host's Chromium. A real iPad Safari will be slower, especially the first open of a 2,000-region page and a full vector redraw. The gesture path uses the bitmap cache once more than about 380 regions are moving, which is the case the iPad needs. This project was not run on iPad hardware.

The same coloring flow (fill, zoom, pan, undo, redo, pen pointer, palm rejection) passed on Chromium and WebKit at 1024×1366, and on Chromium at 390×844. The tablet Chromium run also completed the test-mode purchase, a photo conversion, a parent-gate PNG download, and an offline reload. Screenshots are in `docs/screenshots/`.

```bash
npm install
npx playwright install chromium webkit
npm test
```

## Brand and contact

The header and app icons use the WingsCrew feather. The original logo file was not stored in the repo, so `icons/logo.svg` was drawn to match the orange feather, navy band, and cream **WingsCrew** lettering, then rasterized to the PWA icons (`node tools/make-icons.mjs`).

© 2026 WingsCrew. All rights reserved. See `LICENSE`.

Feedback: [dovewingsbusiness@gmail.com](mailto:dovewingsbusiness@gmail.com)

Tip: https://cash.app/$windigo98

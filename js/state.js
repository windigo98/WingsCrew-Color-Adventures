export const app = {
  catalog: null,
  payments: null,
  ent: new Set(),
  settings: {
    penOnly: false,
    shade: false,
    sound: true,
    numberScale: 1,
    thickLines: false,
    colorNames: false,
    patterns: false,
    bigNumbers: false,
    reduceMotion: "auto",
    loupe: false,
    seenHow: false,
    installDismissed: false,
    visits: 0,
  },
  tierFilter: "all",
  board: null,
};

/** Picture ids removed when the Christmas pack was redrawn from the approved line art. */
export const RETIRED_PICTURE_IDS = new Set([
  "jolly-tree",
  "snow-friend",
  "reindeer-flight",
  "cozy-wreath",
  "sleigh-ride",
  "ornament-mandala",
]);

export const TIER_LABEL = {
  little: "Little Kids",
  big: "Big Kids",
  adult: "Adults",
};

export function asset(path) {
  return new URL("../" + path.replace(/^\.\//, ""), import.meta.url).href;
}

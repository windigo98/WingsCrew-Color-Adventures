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
    seenHow: false,
    installDismissed: false,
    visits: 0,
  },
  tierFilter: "all",
  board: null,
};

export const TIER_LABEL = {
  little: "Little Kids",
  big: "Big Kids",
  adult: "Adults",
};

export function asset(path) {
  return new URL("../" + path.replace(/^\.\//, ""), import.meta.url).href;
}

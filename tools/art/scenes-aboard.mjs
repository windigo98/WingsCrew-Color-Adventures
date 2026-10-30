import { kit, swatch } from "./drawkit.mjs";

const P = (...items) => items.map(([hex, name]) => swatch(hex, name));

/**
 * Original tender-style steam engine. Berry, green, or navy, with a headlamp.
 * No face, no number, and no blue tank-engine silhouette.
 * x,y is the cab's top-left. s scales a roughly 520-long engine.
 */
function steamEngine(d, x, y, s, pal, tender = false) {
  const k = (n) => n * s;
  d.cloud(x + k(360), y - k(24), Math.max(26, k(36)), pal.smoke);
  if (tender) {
    d.window(x - k(188), y + k(48), k(176), k(150), pal.tender);
    d.ell(x - k(100), y + k(58), k(70), k(28), pal.coal);
    d.circ(x - k(150), y + k(230), Math.max(36, k(44)), pal.wheel);
    d.circ(x - k(48), y + k(230), Math.max(36, k(44)), pal.wheel);
  }
  d.window(x - k(8), y - k(40), k(176), k(48), pal.roof);
  d.window(x, y, k(160), k(198), pal.cab);
  d.ell(x + k(268), y + k(118), k(176), k(76), pal.boiler);
  d.window(x + k(34), y + k(36), k(92), k(86), pal.glass);
  d.circ(x + k(246), y + k(36), Math.max(26, k(32)), pal.brass);
  d.window(x + k(352), y + k(8), k(58), k(108), pal.stack);
  d.ell(x + k(381), y + k(8), k(42), k(20), pal.stack);
  d.circ(x + k(448), y + k(86), Math.max(24, k(30)), pal.lamp);
  const wr = Math.max(38, k(48));
  d.circ(x + k(48), y + k(228), wr, pal.wheel);
  d.circ(x + k(188), y + k(236), wr + 4, pal.wheel);
  d.circ(x + k(328), y + k(236), wr + 4, pal.wheel);
  const nose = x + k(328) + wr * 0.55;
  d.poly(
    [
      [nose - k(10), y + k(150)],
      [nose + k(130), y + k(236)],
      [nose - k(20), y + k(236)],
    ],
    pal.pilot
  );
}

function railcar(d, x, y, w, h, body, roof, detail, wheel) {
  d.window(x, y, w, h, body);
  d.window(x - 10, y - 40, w + 20, 46, roof);
  d.window(x + w * 0.3, y + h * 0.16, Math.max(54, w * 0.38), Math.max(64, h * 0.58), detail);
  const wy = y + h + 8;
  d.circ(x + w * 0.24, wy, 42, wheel);
  d.circ(x + w * 0.76, wy, 42, wheel);
}

export const ABOARD = [
  {
    id: "steam-friend",
    pack: "aboard",
    title: "Steam Friend",
    tier: "little",
    palette: P(
      ["#8ECAE6", "Sky"],
      ["#FFD166", "Sun"],
      ["#FFF8EE", "Cloud"],
      ["#B7E39A", "Hill"],
      ["#5F9E45", "Grass"],
      ["#B23A48", "Boiler"],
      ["#F6E7C1", "Cab"],
      ["#8C3A2F", "Roof"],
      ["#7EC8E3", "Window"],
      ["#3E4C59", "Stack"],
      ["#E7EEF5", "Smoke"],
      ["#1B2430", "Wheel"],
      ["#F2D15C", "Lamp"],
      ["#6B3A2A", "Pilot"],
      ["#C4A574", "Track"],
      ["#E07A3D", "Tender"],
      ["#2B241C", "Coal"],
      ["#E6B325", "Brass"]
    ),
    draw(p, S) {
      const d = kit(p, S);
      d.bg(0);
      d.circ(860, 140, 72, 1);
      d.cloud(150, 150, 42, 2);
      d.cloud(430, 110, 30, 2);
      d.hill(280, 1040, 560, 280, 3);
      d.hill(820, 1080, 480, 240, 4);
      d.window(70, 770, 860, 42, 14);
      steamEngine(
        d,
        300,
        500,
        1.02,
        {
          boiler: 5,
          cab: 6,
          roof: 7,
          glass: 8,
          stack: 9,
          smoke: 10,
          wheel: 11,
          lamp: 12,
          pilot: 13,
          brass: 17,
          tender: 15,
          coal: 16,
        },
        true
      );
      d.circ(140, 900, 28, 4);
      d.circ(900, 880, 34, 4);
    },
  },
  {
    id: "bridge-crossing",
    pack: "aboard",
    title: "Bridge Crossing",
    tier: "little",
    palette: P(
      ["#9FD4EE", "Sky"],
      ["#FFE08A", "Sun"],
      ["#FFF8EE", "Cloud"],
      ["#8FBF6A", "Hill"],
      ["#1F6F8B", "River"],
      ["#C4A574", "Stone"],
      ["#8D5A34", "Wood"],
      ["#1F6B4A", "Boiler"],
      ["#F6E7C1", "Cab"],
      ["#245C3A", "Roof"],
      ["#7EC8E3", "Window"],
      ["#3E4C59", "Stack"],
      ["#E7EEF5", "Smoke"],
      ["#1B2430", "Wheel"],
      ["#F2D15C", "Lamp"],
      ["#6B3A2A", "Pilot"],
      ["#E6B325", "Brass"],
      ["#2F7D4A", "Tree"]
    ),
    draw(p, S) {
      const d = kit(p, S);
      d.bg(0);
      d.circ(120, 120, 64, 1);
      d.cloud(760, 130, 36, 2);
      d.hill(160, 980, 420, 260, 3);
      d.hill(860, 1000, 380, 220, 3);
      d.window(0, 700, 1000, 300, 4);
      d.window(40, 520, 920, 120, 5);
      d.window(90, 620, 110, 300, 5);
      d.window(330, 620, 110, 300, 5);
      d.window(570, 620, 110, 300, 5);
      d.window(810, 620, 110, 300, 5);
      d.ell(250, 690, 100, 78, 4);
      d.ell(490, 690, 100, 78, 4);
      d.ell(730, 690, 100, 78, 4);
      d.window(40, 500, 920, 36, 6);
      d.tree(70, 860, 240, 17, 17, 6);
      d.tree(930, 880, 220, 17, 17, 6);
      steamEngine(d, 250, 300, 0.92, {
        boiler: 7,
        cab: 8,
        roof: 9,
        glass: 10,
        stack: 11,
        smoke: 12,
        wheel: 13,
        lamp: 14,
        pilot: 15,
        brass: 16,
      });
    },
  },
  {
    id: "colorful-cars",
    pack: "aboard",
    title: "Colorful Cars",
    tier: "little",
    palette: P(
      ["#C5E4F7", "Sky"],
      ["#FFD166", "Sun"],
      ["#FFF8EE", "Cloud"],
      ["#8FBF6A", "Grass"],
      ["#8D5A34", "Track"],
      ["#243E73", "Boiler"],
      ["#F6E7C1", "Cab"],
      ["#1B2E4B", "Roof"],
      ["#7EC8E3", "Window"],
      ["#3E4C59", "Stack"],
      ["#E7EEF5", "Smoke"],
      ["#1B2430", "Wheel"],
      ["#F2D15C", "Lamp"],
      ["#6B3A2A", "Pilot"],
      ["#E6B325", "Brass"],
      ["#C44536", "Boxcar"],
      ["#F4E1B5", "Cream"],
      ["#1A9B8E", "Teal car"],
      ["#0E5C56", "Teal roof"],
      ["#A32030", "Caboose"],
      ["#E07A3D", "Cupola"]
    ),
    draw(p, S) {
      const d = kit(p, S);
      d.bg(0);
      d.circ(80, 90, 48, 1);
      d.cloud(860, 110, 32, 2);
      d.hill(500, 1080, 760, 280, 3);
      d.window(20, 760, 960, 36, 4);
      steamEngine(d, 16, 575, 0.8, {
        boiler: 5,
        cab: 6,
        roof: 7,
        glass: 8,
        stack: 9,
        smoke: 10,
        wheel: 11,
        lamp: 12,
        pilot: 13,
        brass: 14,
      });
      railcar(d, 470, 590, 160, 145, 15, 16, 12, 11);
      railcar(d, 650, 590, 160, 145, 17, 18, 16, 11);
      d.window(830, 575, 145, 160, 19);
      d.window(818, 534, 168, 46, 20);
      d.window(868, 488, 70, 54, 16);
      d.window(882, 502, 42, 30, 8);
      d.circ(868, 762, 40, 11);
      d.circ(940, 762, 40, 11);
    },
  },
  {
    id: "station-stop",
    pack: "aboard",
    title: "Station Stop",
    tier: "little",
    palette: P(
      ["#B7DFF3", "Sky"],
      ["#FFD166", "Sun"],
      ["#FFF8EE", "Cloud"],
      ["#7CB342", "Grass"],
      ["#C4A574", "Platform"],
      ["#F4E1B5", "Station"],
      ["#C44536", "Roof"],
      ["#6B3A2A", "Door"],
      ["#7EC8E3", "Window"],
      ["#F7FBFF", "Clock"],
      ["#1B2430", "Wheel"],
      ["#8D5A34", "Bench"],
      ["#B23A48", "Boiler"],
      ["#FFF6E4", "Cab"],
      ["#8C3A2F", "Cab roof"],
      ["#3E4C59", "Stack"],
      ["#E7EEF5", "Smoke"],
      ["#E6B325", "Lamp"],
      ["#6B3A2A", "Pilot"],
      ["#2F7D4A", "Bush"]
    ),
    draw(p, S) {
      const d = kit(p, S);
      d.bg(0);
      d.circ(860, 120, 60, 1);
      d.cloud(180, 130, 34, 2);
      d.hill(500, 1080, 740, 260, 3);
      d.window(40, 800, 920, 48, 4);
      d.window(60, 470, 320, 330, 5);
      d.tri(40, 480, 360, 160, 6);
      d.window(170, 640, 100, 160, 7);
      d.window(90, 540, 80, 78, 8);
      d.window(270, 540, 80, 78, 8);
      d.circ(220, 560, 42, 9);
      d.window(70, 830, 160, 24, 11);
      d.window(88, 854, 18, 40, 11);
      d.window(196, 854, 18, 40, 11);
      d.circ(120, 900, 30, 19);
      d.circ(860, 900, 36, 19);
      steamEngine(d, 460, 590, 0.8, {
        boiler: 12,
        cab: 13,
        roof: 14,
        glass: 8,
        stack: 15,
        smoke: 16,
        wheel: 10,
        lamp: 17,
        pilot: 18,
        brass: 17,
      });
    },
  },
  {
    id: "tunnel-hello",
    pack: "aboard",
    title: "Tunnel Hello",
    tier: "little",
    palette: P(
      ["#D7EEF8", "Sky"],
      ["#FFE08A", "Sun"],
      ["#FFF8EE", "Cloud"],
      ["#6FA04A", "Mountain"],
      ["#3E6B3A", "Peak"],
      ["#1B2430", "Tunnel"],
      ["#8FBF6A", "Grass"],
      ["#8D5A34", "Track"],
      ["#E07A3D", "Boiler"],
      ["#F6E7C1", "Cab"],
      ["#C4451E", "Roof"],
      ["#7EC8E3", "Window"],
      ["#3E4C59", "Stack"],
      ["#E7EEF5", "Smoke"],
      ["#1B2430", "Wheel"],
      ["#F2D15C", "Lamp"],
      ["#6B3A2A", "Pilot"],
      ["#E6B325", "Brass"],
      ["#2F7D4A", "Pine"]
    ),
    draw(p, S) {
      const d = kit(p, S);
      d.bg(0);
      d.circ(820, 120, 58, 1);
      d.cloud(160, 140, 32, 2);
      d.hill(500, 1080, 760, 240, 6);
      d.poly(
        [
          [0, 860],
          [40, 520],
          [220, 300],
          [400, 860],
        ],
        3
      );
      d.poly(
        [
          [280, 900],
          [520, 240],
          [860, 900],
        ],
        4
      );
      d.poly(
        [
          [700, 880],
          [900, 420],
          [1040, 880],
        ],
        3
      );
      d.ell(230, 700, 120, 145, 5);
      d.window(70, 790, 860, 36, 7);
      d.pine(80, 870, 200, 18, 16);
      d.pine(930, 890, 180, 18, 16);
      steamEngine(d, 250, 545, 0.96, {
        boiler: 8,
        cab: 9,
        roof: 10,
        glass: 11,
        stack: 12,
        smoke: 13,
        wheel: 14,
        lamp: 15,
        pilot: 16,
        brass: 17,
      });
    },
  },
  {
    id: "moon-caboose",
    pack: "aboard",
    title: "Moon Caboose",
    tier: "little",
    palette: P(
      ["#1C2340", "Night"],
      ["#F4EFE0", "Moon"],
      ["#FFE08A", "Star"],
      ["#243044", "Hill"],
      ["#8D5A34", "Track"],
      ["#A32030", "Caboose"],
      ["#6B1D28", "Roof"],
      ["#F2D15C", "Cupola"],
      ["#7EC8E3", "Window"],
      ["#F6E7C1", "Lantern"],
      ["#1B2430", "Wheel"],
      ["#3E6B3A", "Pine"],
      ["#C4A574", "Door"],
      ["#5C4030", "Trunk"]
    ),
    draw(p, S) {
      const d = kit(p, S);
      d.bg(0);
      d.circ(760, 180, 96, 1);
      d.star(120, 110, 62, 2, 5);
      d.star(280, 210, 48, 2, 5);
      d.star(500, 80, 44, 2, 5);
      d.star(930, 300, 40, 2, 4);
      d.hill(500, 1080, 760, 260, 3);
      d.pine(90, 900, 260, 11, 13);
      d.pine(900, 920, 220, 11, 13);
      d.window(60, 800, 880, 36, 4);
      d.window(230, 520, 500, 230, 5);
      d.window(214, 478, 532, 52, 6);
      d.window(390, 400, 180, 90, 7);
      d.window(430, 424, 100, 52, 8);
      d.window(420, 590, 110, 120, 12);
      d.circ(680, 590, 40, 9);
      d.circ(340, 770, 48, 10);
      d.circ(620, 770, 48, 10);
    },
  },
];

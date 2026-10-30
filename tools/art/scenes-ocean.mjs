import { kit, swatch } from "./drawkit.mjs";

const P = (...items) => items.map(([hex, name]) => swatch(hex, name));

function dolphin(d, x, y, s, tilt, body, belly, fin, eye) {
  d.ell(x, y, 170 * s, 52 * s, body, tilt);
  d.ell(x - 8 * s, y + 16 * s, 96 * s, 24 * s, belly, tilt);
  const tx = x - Math.cos(tilt) * 150 * s;
  const ty = y - Math.sin(tilt) * 150 * s;
  d.poly(
    [
      [tx, ty],
      [tx - 70 * s, ty - 50 * s],
      [tx - 20 * s, ty + 10 * s],
      [tx - 64 * s, ty + 54 * s],
    ],
    fin
  );
  d.poly(
    [
      [x + 10 * s, y - 36 * s],
      [x + 46 * s, y - 110 * s],
      [x + 70 * s, y - 20 * s],
    ],
    fin
  );
  d.circ(x + 90 * s, y - 8 * s, Math.max(16, 22 * s), eye);
}

export const OCEAN = [
  {
    id: "friendly-whale",
    pack: "ocean",
    title: "Friendly Whale",
    tier: "little",
    palette: P(
      ["#8ECAE6", "Sky"],
      ["#FFD166", "Sun"],
      ["#FFF8EE", "Cloud"],
      ["#1F6F8B", "Sea"],
      ["#4EA8C9", "Wave"],
      ["#7CB342", "Island"],
      ["#2F7D4A", "Palm"],
      ["#3D6F8C", "Whale"],
      ["#D7E7F2", "Belly"],
      ["#F7FBFF", "Eye"],
      ["#1B2430", "Pupil"],
      ["#E7EEF5", "Spout"],
      ["#F4A4B0", "Cheek"],
      ["#1A4E66", "Fin"]
    ),
    draw(p, S) {
      const d = kit(p, S);
      d.bg(0);
      d.circ(820, 140, 70, 1);
      d.cloud(160, 150, 40, 2);
      d.cloud(420, 100, 28, 2);
      d.ell(500, 1180, 820, 620, 3);
      d.ell(500, 560, 760, 90, 4);
      d.ell(180, 820, 150, 70, 5);
      d.cap(150, 800, 150, 680, 14, 6);
      d.poly(
        [
          [150, 660],
          [90, 760],
          [210, 740],
        ],
        6
      );
      d.ell(520, 700, 280, 150, 7);
      d.ell(540, 760, 160, 70, 8);
      d.poly(
        [
          [250, 680],
          [80, 600],
          [120, 720],
          [90, 800],
          [250, 760],
        ],
        13
      );
      d.poly(
        [
          [620, 600],
          [760, 520],
          [700, 680],
        ],
        13
      );
      d.circ(680, 650, 42, 9);
      d.circ(696, 654, 20, 10);
      d.circ(610, 710, 30, 12);
      d.circ(450, 530, 42, 11);
      d.circ(510, 470, 36, 11);
      d.circ(480, 410, 30, 11);
    },
  },
  {
    id: "starfish-pool",
    pack: "ocean",
    title: "Starfish Pool",
    tier: "little",
    palette: P(
      ["#F6E2B3", "Sand"],
      ["#1F8AAD", "Pool"],
      ["#E07A3D", "Starfish"],
      ["#F2D15C", "Center"],
      ["#F4E1B5", "Shell"],
      ["#C96B8A", "Fan shell"],
      ["#2F7D4A", "Weed"],
      ["#1B6B45", "Kelp"],
      ["#7A8C99", "Rock"],
      ["#FFE08A", "Sun"],
      ["#E85D04", "Crab"],
      ["#FFF8EE", "Bubble"]
    ),
    draw(p, S) {
      const d = kit(p, S);
      d.bg(0);
      d.circ(140, 110, 54, 9);
      d.ell(500, 560, 340, 250, 1);
      d.star(500, 560, 168, 2, 5);
      d.circ(500, 560, 42, 3);
      d.ell(250, 780, 70, 40, 4, 0.4);
      d.ell(760, 760, 64, 36, 5, -0.3);
      d.cap(120, 980, 180, 700, 16, 6);
      d.cap(200, 1000, 240, 760, 12, 7);
      d.cap(820, 980, 780, 720, 16, 7);
      d.blob(820, 880, 70, 8, 4, 0.7);
      d.ell(360, 800, 84, 50, 10);
      d.circ(290, 775, 36, 10);
      d.circ(430, 775, 36, 10);
      d.circ(640, 390, 34, 11);
      d.circ(730, 470, 28, 11);
    },
  },
  {
    id: "coral-palace",
    pack: "ocean",
    title: "Coral Palace",
    tier: "big",
    target: 190,
    palette: P(
      ["#145C78", "Deep"],
      ["#1F8AAD", "Water"],
      ["#F6E2B3", "Sand"],
      ["#E07A3D", "Coral"],
      ["#C44536", "Tower"],
      ["#F2D15C", "Window"],
      ["#F48FB1", "Fan"],
      ["#1B6B45", "Weed"],
      ["#F4A261", "Fish"],
      ["#FFF6EA", "Belly"],
      ["#1B2430", "Eye"],
      ["#E7EEF5", "Bubble"],
      ["#7A3048", "Anemone"]
    ),
    draw(p, S) {
      const d = kit(p, S);
      d.bg(0);
      d.ell(500, 200, 620, 220, 1);
      d.ell(500, 1080, 760, 280, 2);
      d.window(300, 460, 400, 280, 3);
      d.window(180, 400, 120, 260, 4);
      d.window(700, 430, 110, 230, 4);
      d.window(430, 280, 140, 300, 4);
      d.tri(170, 410, 140, 120, 6);
      d.tri(690, 440, 130, 110, 6);
      d.tri(415, 290, 170, 140, 3);
      d.window(470, 520, 60, 90, 5);
      d.circ(230, 500, 18, 5);
      d.circ(750, 530, 16, 5);
      d.circ(500, 400, 16, 5);
      d.ell(220, 700, 70, 28, 8, -0.2);
      d.poly([[290, 690], [340, 650], [320, 720]], 8);
      d.circ(200, 690, 8, 10);
      d.ell(760, 640, 54, 22, 8, 0.4);
      d.poly([[800, 630], [860, 600], [840, 660]], 9);
      d.circ(740, 632, 7, 10);
      d.line([[120, 980], [160, 760], [140, 640]], 18, 7);
      d.line([[860, 1000], [820, 780]], 16, 7);
      for (const [x, y, r] of [
        [140, 240, 12],
        [240, 180, 9],
        [700, 160, 11],
        [860, 240, 8],
        [600, 220, 7],
      ]) d.circ(x, y, r, 11);
      d.flower(140, 900, 28, 12, 5);
      d.flower(880, 880, 24, 6, 5);
      d.blob(300, 920, 50, 6, 2, 0.6);
      d.blob(700, 940, 46, 12, 5, 0.7);
    },
  },
  {
    id: "dolphin-leap",
    pack: "ocean",
    title: "Dolphin Leap",
    tier: "big",
    target: 175,
    palette: P(
      ["#F6C98B", "Sunset"],
      ["#F4A261", "Glow"],
      ["#FFE08A", "Sun"],
      ["#1F6F8B", "Sea"],
      ["#4EA8C9", "Wave"],
      ["#7F8C9A", "Dolphin"],
      ["#F7FBFF", "Belly"],
      ["#5C6B7A", "Fin"],
      ["#1B2430", "Eye"],
      ["#FFF8EE", "Splash"],
      ["#E7EEF5", "Cloud"],
      ["#C96B8A", "Bird"]
    ),
    draw(p, S) {
      const d = kit(p, S);
      d.bg(0);
      d.ell(500, 280, 700, 260, 1);
      d.circ(180, 180, 70, 2);
      d.cloud(760, 120, 36, 10);
      d.ell(500, 1120, 860, 480, 3);
      d.ell(280, 640, 220, 50, 4);
      d.ell(700, 680, 240, 46, 4);
      dolphin(d, 420, 480, 1.15, -0.55, 5, 6, 7, 8);
      dolphin(d, 680, 560, 0.82, -0.35, 5, 6, 7, 8);
      for (const [x, y, r] of [
        [300, 620, 14],
        [340, 660, 10],
        [260, 680, 8],
        [560, 700, 12],
        [620, 740, 9],
      ]) d.circ(x, y, r, 9);
      d.poly([[120, 300], [160, 280], [150, 320]], 11);
      d.poly([[860, 260], [910, 240], [900, 290]], 11);
    },
  },
  {
    id: "seahorse-garden",
    pack: "ocean",
    title: "Seahorse Garden",
    tier: "big",
    target: 180,
    palette: P(
      ["#0E4D66", "Deep"],
      ["#1A9B8E", "Seahorse"],
      ["#F6E7C1", "Belly"],
      ["#F2D15C", "Fin"],
      ["#1B2430", "Eye"],
      ["#F7FBFF", "Shine"],
      ["#2F7D4A", "Kelp"],
      ["#7DCE6A", "Leaf"],
      ["#E07A3D", "Coral"],
      ["#F48FB1", "Blossom"],
      ["#E7EEF5", "Bubble"],
      ["#C4A574", "Sand"]
    ),
    draw(p, S) {
      const d = kit(p, S);
      d.bg(0);
      d.ell(500, 1100, 780, 220, 11);
      d.line([[140, 1000], [180, 620], [150, 420]], 22, 6);
      d.line([[240, 1020], [260, 700], [300, 520]], 16, 7);
      d.line([[800, 1000], [760, 640], [820, 460]], 20, 6);
      d.line([[900, 1020], [860, 760]], 14, 7);
      d.ell(500, 560, 70, 150, 1);
      d.ell(500, 430, 78, 90, 1);
      d.ell(470, 340, 36, 48, 1);
      d.poly([[500, 300], [470, 230], [530, 250]], 1);
      d.ell(540, 600, 28, 90, 2);
      d.poly([[430, 500], [330, 430], [400, 560]], 3);
      d.poly([[560, 480], [680, 420], [640, 540]], 3);
      d.ell(500, 760, 50, 70, 1, 0.6);
      d.circ(500, 400, 16, 5);
      d.circ(506, 402, 8, 4);
      d.circ(470, 430, 10, 2);
      d.flower(220, 860, 26, 8, 3);
      d.flower(780, 840, 30, 9, 3);
      d.blob(160, 920, 60, 8, 3, 0.7);
      d.blob(860, 930, 70, 9, 6, 0.6);
      for (const [x, y, r] of [
        [300, 200, 12],
        [360, 260, 8],
        [700, 180, 10],
        [640, 240, 7],
        [120, 300, 9],
      ]) d.circ(x, y, r, 10);
    },
  },
  {
    id: "reef-glow",
    pack: "ocean",
    title: "Reef Glow",
    tier: "adult",
    target: 1550,
    minPiece: 22,
    palette: P(
      ["#0B3A4A", "Deep"],
      ["#14627A", "Water"],
      ["#F6E2B3", "Sand"],
      ["#E07A3D", "Coral"],
      ["#C44536", "Fan"],
      ["#F48FB1", "Anemone"],
      ["#F2D15C", "Glow"],
      ["#7DCE6A", "Weed"],
      ["#1B6B45", "Kelp"],
      ["#D7E7F2", "Manta"],
      ["#1B2430", "Eye"],
      ["#F4A261", "Fish"],
      ["#FFF6EA", "Belly"],
      ["#E7EEF5", "Bubble"],
      ["#7A3048", "Rose coral"]
    ),
    draw(p, S) {
      const d = kit(p, S);
      d.bg(0);
      d.ell(500, 160, 640, 200, 1);
      d.ell(500, 1120, 800, 240, 2);
      for (let i = 0; i < 9; i++) {
        const x = 80 + i * 100;
        d.poly(
          [
            [x, 900],
            [x + 20, 760 - (i % 3) * 30],
            [x + 50, 900],
          ],
          i % 2 ? 3 : 4
        );
      }
      d.ell(500, 520, 260, 70, 9, -0.15);
      d.poly([[180, 500], [40, 360], [160, 560], [80, 680], [240, 560]], 9);
      d.poly([[820, 500], [960, 340], [860, 560], [940, 700], [760, 560]], 9);
      for (let i = 0; i < 8; i++) d.ell(400 + (i % 4) * 50, 500 + Math.floor(i / 4) * 24, 10, 14, 6, 0.4);
      d.circ(620, 500, 14, 10);
      d.circ(626, 502, 6, 0);
      d.ell(300, 700, 80, 28, 11, -0.3);
      d.ell(300, 712, 40, 12, 12);
      d.poly([[370, 690], [430, 660], [400, 720]], 11);
      d.circ(250, 692, 7, 10);
      d.ell(720, 760, 64, 22, 11, 0.5);
      d.poly([[770, 750], [840, 730], [790, 790]], 12);
      d.circ(690, 752, 6, 10);
      d.line([[100, 980], [140, 700], [110, 520]], 16, 8);
      d.line([[200, 1000], [230, 760]], 12, 7);
      d.line([[860, 1000], [820, 720], [860, 560]], 16, 8);
      d.flower(160, 900, 36, 5, 6);
      d.flower(840, 880, 32, 14, 6);
      d.flower(500, 930, 28, 3, 6);
      for (let i = 0; i < 16; i++) {
        const x = 60 + ((i * 97) % 880);
        const y = 40 + ((i * 53) % 260);
        d.circ(x, y, 4 + (i % 3) * 2, 13);
      }
      for (let i = 0; i < 6; i++) d.ell(180 + i * 120, 840, 16, 28, i % 2 ? 4 : 14, 0.2);
    },
  },
];

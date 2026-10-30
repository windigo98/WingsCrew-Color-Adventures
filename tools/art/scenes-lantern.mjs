import { kit, swatch } from "./drawkit.mjs";

const P = (...items) => items.map(([hex, name]) => swatch(hex, name));

export const LANTERN = [
  {
    id: "moon-hare",
    pack: "lantern",
    title: "Moon Hare",
    tier: "adult",
    target: 1400,
    minPiece: 22,
    palette: P(
      ["#1C2340", "Night"],
      ["#F4EFE0", "Moon"],
      ["#FFE08A", "Star"],
      ["#D9C7A2", "Hare"],
      ["#F7FBFF", "Chest"],
      ["#C4A574", "Ear"],
      ["#1B2430", "Eye"],
      ["#8FBF6A", "Meadow"],
      ["#3E6B3A", "Hill"],
      ["#F48FB1", "Flower"],
      ["#E6B325", "Center"],
      ["#6C3B8A", "Shadow"],
      ["#E7EEF5", "Tail"]
    ),
    draw(p, S) {
      const d = kit(p, S);
      d.bg(0);
      d.circ(720, 220, 150, 1);
      for (let i = 0; i < 28; i++) {
        const x = 30 + ((i * 89) % 940);
        const y = 24 + ((i * 47) % 300);
        if (Math.hypot(x - 720, y - 220) > 170) d.star(x, y, 4 + (i % 3) * 2, 2, 4);
      }
      d.hill(200, 1020, 480, 240, 7);
      d.hill(800, 1060, 420, 200, 8);
      d.ell(520, 680, 170, 90, 3, -0.2);
      d.ell(540, 720, 90, 48, 4);
      d.circ(330, 560, 72, 3);
      d.poly([[300, 530], [250, 390], [340, 510]], 3);
      d.poly([[360, 520], [430, 400], [400, 540]], 3);
      d.poly([[310, 500], [300, 440], [340, 500]], 5);
      d.poly([[370, 500], [400, 440], [410, 510]], 5);
      d.circ(310, 550, 12, 1);
      d.circ(314, 552, 6, 6);
      d.circ(300, 590, 10, 6);
      d.ell(300, 600, 16, 10, 4);
      for (let i = 0; i < 10; i++) d.ell(430 + (i % 5) * 28, 640 + Math.floor(i / 5) * 26, 8, 14, 11, 0.5);
      d.circ(700, 640, 28, 12);
      d.cap(460, 760, 440, 900, 16, 3);
      d.cap(600, 750, 630, 910, 16, 3);
      d.ell(430, 920, 28, 12, 6);
      d.ell(640, 920, 26, 12, 6);
      for (const [x, y] of [
        [140, 900],
        [260, 940],
        [760, 900],
        [880, 860],
        [500, 960],
      ]) d.flower(x, y, 18, 9, 10);
    },
  },
  {
    id: "clock-garden",
    pack: "lantern",
    title: "Clock Garden",
    tier: "adult",
    target: 1650,
    minPiece: 22,
    palette: P(
      ["#F6E7C1", "Wall"],
      ["#FBF7EF", "Face"],
      ["#1B2430", "Tick"],
      ["#C44536", "Hour"],
      ["#243E73", "Minute"],
      ["#E6B325", "Hub"],
      ["#2F7D4A", "Vine"],
      ["#1B6B45", "Leaf"],
      ["#F48FB1", "Rose"],
      ["#F2D15C", "Center"],
      ["#8D5A34", "Frame"],
      ["#7EC8E3", "Pane"]
    ),
    draw(p, S) {
      const d = kit(p, S);
      d.bg(0);
      d.window(70, 70, 860, 860, 10);
      d.window(110, 110, 780, 780, 11);
      d.circ(500, 470, 250, 1);
      d.circ(500, 470, 210, 0);
      for (let i = 0; i < 12; i++) {
        const a = -Math.PI / 2 + (i / 12) * Math.PI * 2;
        const r0 = 168;
        const r1 = 200;
        d.cap(500 + Math.cos(a) * r0, 470 + Math.sin(a) * r0, 500 + Math.cos(a) * r1, 470 + Math.sin(a) * r1, 7, 2);
      }
      d.cap(500, 470, 500, 330, 10, 4);
      d.cap(500, 470, 640, 500, 12, 3);
      d.circ(500, 470, 22, 5);
      d.line(
        [
          [160, 860],
          [220, 620],
          [300, 700],
          [500, 760],
          [760, 640],
          [860, 860],
        ],
        14,
        6
      );
      for (let i = 0; i < 8; i++) {
        const a = -2.4 + (i / 7) * 4.6;
        d.ell(500 + Math.cos(a) * 300, 700 + Math.sin(a) * 80, 22, 40, i % 2 ? 7 : 6, a);
      }
      d.flower(180, 800, 28, 8, 9);
      d.flower(820, 800, 26, 8, 9);
      d.flower(340, 860, 22, 8, 5);
      d.flower(660, 870, 24, 8, 9);
      for (let i = 0; i < 10; i++) d.ell(150 + (i % 5) * 30, 160 + Math.floor(i / 5) * 36, 10, 16, 7, 0.8);
      for (let i = 0; i < 10; i++) d.ell(720 + (i % 5) * 30, 160 + Math.floor(i / 5) * 36, 10, 16, 6, -0.6);
    },
  },
  {
    id: "peacock-gate",
    pack: "lantern",
    title: "Peacock Gate",
    tier: "adult",
    target: 1500,
    minPiece: 22,
    palette: P(
      ["#E7F3EA", "Garden"],
      ["#8D5A34", "Gate"],
      ["#1F6B4A", "Peacock"],
      ["#0E5C56", "Neck"],
      ["#F2D15C", "Beak"],
      ["#1B2430", "Eye"],
      ["#1A9B8E", "Feather"],
      ["#2F5DA8", "Feather blue"],
      ["#F6C6D0", "Eye ring"],
      ["#E6B325", "Eye gold"],
      ["#7CB342", "Hedge"],
      ["#F48FB1", "Rose"],
      ["#F4E1B5", "Path"]
    ),
    draw(p, S) {
      const d = kit(p, S);
      d.bg(0);
      d.ell(500, 1080, 700, 220, 12);
      d.window(120, 180, 70, 620, 1);
      d.window(810, 180, 70, 620, 1);
      d.ell(500, 180, 420, 80, 1);
      d.ell(500, 860, 260, 40, 10);
      const cx = 500;
      const cy = 640;
      for (let i = 0; i < 13; i++) {
        const a = Math.PI + (i / 12) * Math.PI;
        const x = cx + Math.cos(a) * 250;
        const y = cy + Math.sin(a) * 230;
        d.ell(x, y, 28, 78, i % 2 ? 6 : 7, a + Math.PI / 2);
        d.circ(x, y + 16, 16, 8);
        d.circ(x, y + 16, 7, 9);
      }
      d.ell(500, 700, 70, 110, 2);
      d.cap(500, 620, 500, 470, 22, 3);
      d.circ(500, 450, 28, 3);
      d.poly([[520, 450], [560, 458], [520, 468]], 4);
      d.circ(490, 444, 6, 5);
      d.poly([[470, 430], [500, 400], [510, 436]], 6);
      d.flower(180, 900, 22, 11, 9);
      d.flower(820, 900, 22, 11, 9);
      d.flower(300, 940, 18, 11, 4);
      d.flower(700, 940, 18, 11, 4);
      for (let i = 0; i < 8; i++) d.ell(160 + i * 20, 300 + (i % 3) * 18, 10, 18, 10, 0.4);
      for (let i = 0; i < 8; i++) d.ell(700 + i * 20, 320 + (i % 3) * 16, 10, 18, 10, -0.4);
    },
  },
  {
    id: "glass-butterfly",
    pack: "lantern",
    title: "Glass Butterfly",
    tier: "adult",
    target: 1480,
    minPiece: 22,
    palette: P(
      ["#D7EEF8", "Sky"],
      ["#F6E7C1", "Frame"],
      ["#C5E4F7", "Glass"],
      ["#6C3B8A", "Wing"],
      ["#C9B6E4", "Lower wing"],
      ["#F2D15C", "Spot"],
      ["#1B2430", "Body"],
      ["#F48FB1", "Blush spot"],
      ["#2F7D4A", "Vine"],
      ["#E07A3D", "Flower"],
      ["#FFF8EE", "Sill"],
      ["#8D5A34", "Wood"]
    ),
    draw(p, S) {
      const d = kit(p, S);
      d.bg(0);
      d.window(90, 70, 820, 860, 11);
      d.window(130, 110, 740, 700, 1);
      d.window(160, 140, 680, 640, 2);
      d.window(478, 140, 44, 640, 1);
      d.window(160, 440, 680, 40, 1);
      d.ell(360, 400, 150, 110, 3, -0.4);
      d.ell(640, 400, 150, 110, 3, 0.4);
      d.ell(390, 540, 120, 90, 4, 0.5);
      d.ell(610, 540, 120, 90, 4, -0.5);
      d.cap(500, 360, 500, 620, 16, 6);
      d.circ(500, 350, 18, 6);
      d.cap(480, 340, 440, 280, 4, 6);
      d.cap(520, 340, 560, 280, 4, 6);
      d.circ(440, 270, 8, 6);
      d.circ(560, 270, 8, 6);
      d.circ(300, 380, 28, 5);
      d.circ(690, 370, 26, 5);
      d.circ(340, 470, 18, 7);
      d.circ(660, 460, 16, 7);
      d.circ(400, 560, 20, 5);
      d.circ(600, 560, 18, 7);
      d.line([[180, 760], [300, 620], [500, 700], [760, 600], [840, 760]], 12, 8);
      d.flower(220, 800, 26, 9, 5);
      d.flower(780, 800, 24, 9, 5);
      d.flower(500, 840, 20, 3, 5);
      for (let i = 0; i < 6; i++) d.ell(200 + i * 22, 200, 8, 16, 8, 1.1);
      for (let i = 0; i < 6; i++) d.ell(680 + i * 22, 200, 8, 16, 8, -1.1);
      d.window(90, 820, 820, 50, 10);
    },
  },
];

import { kit, swatch } from "./drawkit.mjs";

const P = (...items) => items.map(([hex, name]) => swatch(hex, name));

function scene(def) {
  return def;
}

export const PICTURES = [
  scene({
    id: "sunny-dragon",
    pack: "starter",
    title: "Sunny Dragon",
    tier: "little",
    palette: P(
      ["#8ECAE6", "Sky"],
      ["#FFD166", "Sun"],
      ["#B5D96A", "Far hill"],
      ["#6FA04A", "Near hill"],
      ["#FFF8EE", "Cloud"],
      ["#F27D16", "Body"],
      ["#FF9F45", "Head"],
      ["#FFE3B8", "Belly"],
      ["#E85D04", "Wing"],
      ["#FFB703", "Spikes"],
      ["#F4A4B0", "Cheek"],
      ["#FFFbf5", "Eye"],
      ["#1B2430", "Pupil"],
      ["#C4451E", "Nose"],
      ["#3E8E41", "Grass"]
    ),
    draw(p, S) {
      const d = kit(p, S);
      d.bg(0);
      d.circ(820, 150, 78, 1);
      d.hill(260, 900, 520, 250, 2);
      d.hill(820, 980, 460, 210, 3);
      d.cloud(180, 180, 46, 4);
      d.cloud(430, 120, 34, 4);
      d.poly([[430, 470], [700, 300], [760, 430], [620, 520], [500, 560]], 8);
      d.ell(560, 590, 210, 120, 5);
      d.ell(575, 630, 130, 68, 6);
      d.cap(700, 560, 860, 430, 36, 5);
      d.poly([[860, 400], [940, 430], [850, 470]], 9);
      d.circ(300, 500, 88, 6);
      d.ell(175, 530, 78, 40, 6);
      d.poly([[250, 420], [280, 340], [310, 430]], 9);
      d.poly([[330, 430], [370, 350], [390, 450]], 9);
      d.poly([[500, 490], [540, 400], [570, 510]], 9);
      d.circ(250, 480, 22, 11);
      d.circ(256, 484, 10, 12);
      d.circ(150, 525, 8, 13);
      d.circ(230, 530, 16, 10);
      d.cap(500, 720, 500, 820, 22, 5);
      d.cap(640, 700, 660, 830, 20, 5);
      d.ell(490, 850, 36, 16, 13);
      d.ell(670, 850, 32, 14, 13);
      d.cap(220, 900, 280, 820, 8, 14);
      d.cap(360, 910, 400, 840, 7, 14);
    },
  }),

  scene({
    id: "fantasy-castle",
    pack: "starter",
    title: "Fantasy Castle",
    tier: "little",
    palette: P(
      ["#9FD4EE", "Sky"],
      ["#FFE08A", "Sun"],
      ["#8FBF6A", "Hill"],
      ["#F4E1B5", "Wall"],
      ["#E7C98A", "Tower"],
      ["#C44536", "Roof"],
      ["#8C3A2F", "Door"],
      ["#7EC8E3", "Window"],
      ["#F2D15C", "Flag"],
      ["#5C4A32", "Bridge"],
      ["#6FA0C8", "Moat"],
      ["#FFF8EE", "Cloud"],
      ["#3E8E41", "Bush"]
    ),
    draw(p, S) {
      const d = kit(p, S);
      d.bg(0);
      d.circ(150, 140, 60, 1);
      d.cloud(780, 150, 40, 11);
      d.hill(500, 920, 620, 220, 2);
      d.ell(500, 760, 340, 70, 10);
      d.window(250, 470, 500, 250, 3);
      d.window(190, 390, 110, 220, 4);
      d.window(700, 410, 100, 200, 4);
      d.window(430, 300, 140, 280, 4);
      d.tri(180, 400, 130, 120, 5);
      d.tri(690, 420, 120, 110, 5);
      d.tri(415, 310, 170, 150, 5);
      d.window(455, 560, 90, 110, 6);
      d.circ(500, 545, 16, 1);
      d.window(220, 500, 36, 48, 7);
      d.window(740, 520, 32, 44, 7);
      d.window(470, 400, 28, 40, 7);
      d.window(530, 400, 28, 40, 7);
      d.cap(500, 180, 500, 310, 6, 8);
      d.poly([[500, 150], [560, 190], [500, 210], [500, 180]], 8);
      d.poly([[300, 800], [700, 800], [680, 860], [320, 860]], 9);
      d.circ(180, 860, 28, 12);
      d.circ(840, 870, 34, 12);
    },
  }),

  scene({
    id: "meadow-fox",
    pack: "starter",
    title: "Meadow Fox",
    tier: "big",
    target: 150,
    palette: P(
      ["#B7E0F2", "Sky"],
      ["#C8E59A", "Meadow"],
      ["#7CB342", "Hill"],
      ["#E07A3D", "Fox"],
      ["#FFF6EA", "Chest"],
      ["#C45C26", "Ear"],
      ["#1B2430", "Nose"],
      ["#F4EFE4", "Eye"],
      ["#3E8E41", "Leaf"],
      ["#1F7A43", "Pine"],
      ["#8D5A34", "Trunk"],
      ["#F48FB1", "Flower"],
      ["#FFD166", "Center"],
      ["#FFF8EE", "Cloud"],
      ["#6FA04A", "Grass"]
    ),
    draw(p, S) {
      const d = kit(p, S);
      d.bg(0);
      d.cloud(160, 120, 36, 13);
      d.cloud(700, 90, 28, 13);
      d.hill(200, 860, 480, 280, 1);
      d.hill(780, 920, 420, 220, 2);
      d.tree(120, 820, 280, 8, 9, 10);
      d.tree(860, 800, 240, 9, 8, 10);
      d.pine(40, 900, 200, 9, 10);
      d.ell(470, 640, 170, 70, 3, -0.3);
      d.circ(300, 560, 78, 3);
      d.poly([[250, 520], [230, 420], [300, 500]], 3);
      d.poly([[340, 510], [390, 410], [370, 530]], 3);
      d.poly([[255, 500], [250, 450], [290, 500]], 5);
      d.poly([[350, 495], [370, 445], [385, 510]], 5);
      d.ell(330, 640, 70, 55, 4);
      d.circ(270, 545, 12, 7);
      d.circ(274, 547, 6, 6);
      d.circ(250, 575, 8, 6);
      d.cap(600, 650, 820, 520, 32, 3);
      d.ell(850, 500, 36, 28, 4);
      d.cap(430, 690, 410, 820, 16, 3);
      d.cap(520, 690, 540, 830, 16, 3);
      d.ell(400, 840, 28, 12, 6);
      d.ell(550, 845, 26, 12, 6);
      for (const [x, y] of [[180, 880], [300, 900], [640, 890], [760, 860], [500, 920]]) d.flower(x, y, 16, 11, 12);
      d.cap(250, 930, 290, 860, 5, 14);
      d.cap(700, 940, 730, 870, 5, 14);
    },
  }),

  scene({
    id: "forest-walk",
    pack: "starter",
    title: "Forest Walk",
    tier: "big",
    target: 190,
    palette: P(
      ["#D7EFE4", "Light"],
      ["#8FBF6A", "Canopy"],
      ["#2F7D4A", "Shade"],
      ["#1F6B45", "Pine"],
      ["#C4A574", "Path"],
      ["#8D5A34", "Trunk"],
      ["#E7C98A", "Mushroom"],
      ["#C44536", "Cap"],
      ["#FFF8EE", "Spot"],
      ["#6C8C3A", "Fern"],
      ["#F4E1B5", "Stone"],
      ["#7EC8E3", "Sky gap"]
    ),
    draw(p, S) {
      const d = kit(p, S);
      d.bg(0);
      d.ell(500, 80, 420, 90, 11);
      d.hill(180, 980, 500, 260, 1);
      d.hill(820, 1000, 420, 220, 2);
      d.poly([[280, 980], [420, 620], [560, 980]], 4);
      d.poly([[430, 980], [520, 700], [640, 980]], 4);
      d.tree(140, 900, 360, 2, 3, 5);
      d.tree(300, 860, 300, 1, 2, 5);
      d.pine(620, 880, 340, 3, 5);
      d.pine(800, 900, 380, 3, 5);
      d.tree(900, 860, 260, 2, 1, 5);
      d.circ(220, 780, 22, 7);
      d.ell(220, 800, 34, 16, 6);
      d.circ(470, 820, 18, 7);
      d.ell(470, 836, 28, 14, 6);
      d.circ(230, 760, 6, 8);
      d.circ(214, 768, 5, 8);
      d.circ(476, 804, 5, 8);
      for (const [x, y, s] of [[120, 930, 26], [360, 940, 20], [700, 950, 24], [860, 930, 18]]) {
        d.poly([[x, y], [x + s, y - s * 1.4], [x + s * 2, y]], 9);
      }
      d.ell(250, 900, 40, 18, 10);
      d.ell(760, 910, 50, 20, 10);
    },
  }),

  scene({
    id: "ocean-fish",
    pack: "starter",
    title: "Ocean Fish",
    tier: "big",
    target: 170,
    palette: P(
      ["#1F6F8B", "Deep sea"],
      ["#2E8BC0", "Water"],
      ["#F08A5D", "Koi"],
      ["#FFF6EA", "Belly"],
      ["#E85D04", "Stripe"],
      ["#1B2430", "Eye"],
      ["#F4EFE4", "Shine"],
      ["#7DCE6A", "Weed"],
      ["#1B7A3A", "Kelp"],
      ["#F2D15C", "Fin"],
      ["#E6B325", "Bubble"],
      ["#F6C6D0", "Coral"],
      ["#C9B6E4", "Shell"]
    ),
    draw(p, S) {
      const d = kit(p, S);
      d.bg(0);
      d.ell(500, 200, 520, 180, 1);
      d.ell(500, 620, 230, 110, 2, -0.2);
      d.ell(520, 660, 140, 60, 3);
      d.ell(340, 600, 50, 22, 4, 0.4);
      d.ell(500, 590, 46, 20, 4, -0.2);
      d.ell(650, 640, 48, 20, 4, 0.3);
      d.poly([[760, 600], [900, 520], [880, 640], [900, 740], [760, 670]], 9);
      d.poly([[430, 540], [520, 470], [560, 560]], 9);
      d.poly([[480, 700], [560, 790], [600, 690]], 9);
      d.circ(360, 600, 16, 6);
      d.circ(364, 602, 8, 5);
      d.circ(300, 640, 10, 5);
      for (const [x, y, r] of [[180, 200, 14], [240, 280, 10], [140, 360, 8], [700, 180, 12], [800, 260, 9], [620, 300, 7]]) d.circ(x, y, r, 10);
      d.line([[120, 980], [160, 700], [130, 520]], 18, 7);
      d.line([[200, 1000], [240, 760], [210, 600]], 14, 8);
      d.line([[860, 1000], [820, 780], [860, 640]], 16, 7);
      d.blob(160, 900, 70, 11, 3, 0.7);
      d.blob(880, 880, 80, 12, 5, 0.6);
      d.ell(500, 980, 200, 40, 11);
    },
  }),

  scene({
    id: "baby-phoenix",
    pack: "creatures",
    title: "Baby Phoenix",
    tier: "little",
    palette: P(
      ["#FFE8C2", "Dawn"],
      ["#F4A261", "Sun"],
      ["#E85D04", "Body"],
      ["#FFD166", "Chest"],
      ["#C4451E", "Wing"],
      ["#FF8C42", "Head"],
      ["#1B2430", "Eye"],
      ["#FFF6EA", "Shine"],
      ["#F48FB1", "Cheek"],
      ["#6FA04A", "Hill"]
    ),
    draw(p, S) {
      const d = kit(p, S);
      d.bg(0);
      d.circ(780, 180, 90, 1);
      d.hill(500, 980, 640, 200, 9);
      d.ell(500, 600, 150, 110, 2);
      d.ell(500, 640, 90, 60, 3);
      d.circ(340, 500, 70, 5);
      d.poly([[300, 470], [250, 400], [340, 450]], 4);
      d.circ(315, 490, 12, 7);
      d.circ(318, 492, 6, 6);
      d.circ(300, 520, 10, 8);
      d.poly([[560, 520], [780, 360], [800, 520], [640, 580]], 4);
      d.poly([[560, 640], [760, 700], [700, 780], [540, 700]], 4);
      d.poly([[620, 500], [700, 430], [720, 520]], 3);
      d.poly([[180, 980], [260, 820], [300, 980]], 1);
    },
  }),

  scene({
    id: "unicorn-meadow",
    pack: "creatures",
    title: "Unicorn Meadow",
    tier: "little",
    palette: P(
      ["#D7EEF8", "Sky"],
      ["#B7E39A", "Grass"],
      ["#FFF8EE", "Coat"],
      ["#F4A4C0", "Mane"],
      ["#8C6BC9", "Mane shadow"],
      ["#E8C872", "Horn"],
      ["#1B2430", "Eye"],
      ["#F48FB1", "Flower"],
      ["#FFD166", "Center"],
      ["#7CB342", "Hill"],
      ["#C9B6E4", "Cloud"]
    ),
    draw(p, S) {
      const d = kit(p, S);
      d.bg(0);
      d.cloud(180, 140, 40, 10);
      d.hill(300, 900, 500, 240, 1);
      d.hill(800, 960, 400, 180, 9);
      d.ell(520, 620, 180, 90, 2);
      d.circ(320, 540, 70, 2);
      d.poly([[300, 500], [250, 390], [340, 490]], 3);
      d.poly([[340, 500], [400, 400], [390, 520]], 4);
      d.poly([[300, 470], [320, 340], [345, 470]], 5);
      d.circ(300, 530, 10, 6);
      d.ell(300, 570, 18, 10, 3);
      d.cap(470, 560, 430, 430, 16, 3);
      d.cap(500, 540, 520, 420, 14, 4);
      d.cap(450, 700, 430, 830, 14, 2);
      d.cap(600, 690, 630, 840, 14, 2);
      d.ell(430, 850, 26, 12, 6);
      d.ell(640, 850, 24, 12, 6);
      d.flower(200, 860, 18, 7, 8);
      d.flower(760, 880, 16, 7, 8);
      d.flower(880, 820, 14, 4, 8);
    },
  }),

  scene({
    id: "sea-serpent",
    pack: "creatures",
    title: "Sea Serpent",
    tier: "big",
    target: 180,
    palette: P(
      ["#145C78", "Sea"],
      ["#1F8A70", "Wave"],
      ["#7DCE6A", "Serpent"],
      ["#E8F5C8", "Belly"],
      ["#1B2430", "Eye"],
      ["#F4EFE4", "Shine"],
      ["#F2D15C", "Fin"],
      ["#0E3D52", "Deep"],
      ["#F08A5D", "Coral"],
      ["#FFF8EE", "Foam"]
    ),
    draw(p, S) {
      const d = kit(p, S);
      d.bg(0);
      d.ell(200, 280, 260, 80, 7);
      d.ell(700, 180, 300, 70, 7);
      for (let i = 0; i < 5; i++) {
        const x = 180 + i * 160;
        const y = 520 + (i % 2 === 0 ? -70 : 80);
        d.ell(x, y, 110, 70, 2, i * 0.2);
        d.ell(x, y + 20, 70, 36, 3, i * 0.2);
      }
      d.circ(160, 430, 70, 2);
      d.circ(130, 420, 12, 5);
      d.circ(134, 422, 6, 4);
      d.poly([[200, 400], [250, 330], [230, 430]], 6);
      d.poly([[860, 620], [980, 540], [960, 700]], 6);
      d.blob(120, 860, 80, 8, 2, 0.6);
      d.blob(860, 880, 90, 8, 4, 0.7);
      d.ell(400, 140, 90, 20, 9);
      d.ell(620, 100, 70, 16, 9);
    },
  }),

  scene({
    id: "griffin-perch",
    pack: "creatures",
    title: "Griffin Perch",
    tier: "big",
    target: 200,
    palette: P(
      ["#F6E2B3", "Sky"],
      ["#C4A574", "Lion"],
      ["#8D5A34", "Mane"],
      ["#E6A23C", "Beak"],
      ["#FFF6EA", "Wing"],
      ["#A97848", "Feather"],
      ["#1B2430", "Eye"],
      ["#7A8C6A", "Cliff"],
      ["#5C5346", "Rock"],
      ["#6FA04A", "Moss"],
      ["#E8C872", "Sun"]
    ),
    draw(p, S) {
      const d = kit(p, S);
      d.bg(0);
      d.circ(820, 120, 70, 10);
      d.poly([[0, 780], [420, 520], [560, 700], [1000, 640], [1000, 1000], [0, 1000]], 7);
      d.poly([[200, 820], [360, 700], [420, 860]], 8);
      d.ell(430, 640, 160, 80, 1);
      d.circ(280, 560, 70, 1);
      d.poly([[230, 540], [180, 470], [270, 530]], 2);
      d.poly([[300, 530], [340, 450], [350, 550]], 2);
      d.poly([[210, 560], [160, 580], [230, 590]], 3);
      d.circ(250, 550, 10, 6);
      d.circ(252, 552, 5, 0);
      d.poly([[500, 560], [760, 300], [800, 480], [560, 600]], 4);
      d.line([[560, 420], [700, 360]], 10, 5);
      d.line([[540, 500], [720, 430]], 10, 5);
      d.line([[520, 560], [700, 520]], 8, 5);
      d.cap(400, 700, 380, 820, 18, 1);
      d.cap(520, 700, 540, 830, 16, 1);
      d.ell(370, 840, 30, 14, 3);
      d.ell(550, 845, 28, 12, 3);
      d.blob(700, 780, 40, 9, 6, 0.5);
    },
  }),

  scene({
    id: "night-owl",
    pack: "creatures",
    title: "Night Owl",
    tier: "big",
    target: 160,
    palette: P(
      ["#1C2340", "Night"],
      ["#F4EFE0", "Moon"],
      ["#8C6A43", "Owl"],
      ["#E7C98A", "Face"],
      ["#FFF8EE", "Belly"],
      ["#1B2430", "Eye"],
      ["#E6A23C", "Beak"],
      ["#5C5346", "Branch"],
      ["#6FA04A", "Leaves"],
      ["#FFE08A", "Star"],
      ["#3D2B5A", "Shadow"]
    ),
    draw(p, S) {
      const d = kit(p, S);
      d.bg(0);
      d.crescent(780, 160, 80, 1, 0);
      for (const [x, y, r] of [[120, 100, 8], [200, 180, 5], [300, 80, 6], [560, 140, 4], [640, 70, 7], [90, 240, 4], [480, 60, 5]]) d.star(x, y, r, 9, 5);
      d.ell(500, 560, 170, 200, 2);
      d.ell(500, 500, 120, 110, 3);
      d.ell(500, 680, 90, 80, 4);
      d.circ(450, 490, 28, 5);
      d.circ(550, 490, 28, 5);
      d.circ(450, 490, 12, 1);
      d.circ(550, 490, 12, 1);
      d.poly([[500, 530], [480, 560], [520, 560]], 6);
      d.poly([[360, 500], [250, 620], [420, 600]], 10);
      d.poly([[640, 500], [760, 620], [580, 600]], 10);
      d.cap(180, 820, 860, 760, 16, 7);
      d.circ(240, 740, 30, 8);
      d.circ(700, 700, 26, 8);
      d.poly([[470, 760], [500, 800], [530, 760]], 6);
    },
  }),

  scene({
    id: "phoenix-rise",
    pack: "creatures",
    title: "Phoenix Rise",
    tier: "adult",
    target: 1300,
    palette: P(
      ["#2B1845", "Dusk"],
      ["#F4A261", "Glow"],
      ["#E85D04", "Flame"],
      ["#FFD166", "Light"],
      ["#C4451E", "Feather"],
      ["#FFF1D0", "Breast"],
      ["#1B2430", "Eye"],
      ["#7A2E0E", "Ash"],
      ["#F6C6D0", "Spark"],
      ["#6C3B8A", "Smoke"],
      ["#E6B325", "Star"]
    ),
    draw(p, S) {
      const d = kit(p, S);
      d.bg(0);
      d.ell(500, 980, 420, 180, 1);
      for (let i = 0; i < 40; i++) {
        const a = (i / 40) * Math.PI * 2;
        const rr = 80 + (i % 5) * 70;
        d.circ(500 + Math.cos(a) * rr * 1.4, 180 + Math.sin(a) * rr * 0.5, 3 + (i % 3), 10);
      }
      d.ell(480, 560, 150, 180, 2);
      d.ell(480, 600, 80, 100, 5);
      d.circ(360, 430, 62, 3);
      d.poly([[330, 400], [300, 330], [370, 390]], 3);
      d.circ(340, 420, 10, 6);
      d.circ(344, 422, 5, 0);
      d.poly([[300, 450], [230, 470], [300, 490]], 4);
      for (let i = 0; i < 7; i++) {
        const y = 300 + i * 28;
        d.poly([[560, 520 + i * 10], [900 - i * 20, y], [860, y + 40], [560, 560 + i * 8]], i % 2 ? 4 : 3);
      }
      for (let i = 0; i < 5; i++) {
        d.poly([[420, 680 + i * 8], [180, 760 + i * 30], [240, 820 + i * 20], [460, 720]], i % 2 ? 2 : 1);
      }
      for (let i = 0; i < 18; i++) d.ell(430 + (i % 6) * 22, 500 + Math.floor(i / 6) * 26, 8, 12, 8, 0.4);
      d.cap(430, 720, 400, 860, 14, 7);
      d.cap(530, 730, 560, 870, 14, 7);
    },
  }),

  scene({
    id: "dragon-queen",
    pack: "creatures",
    title: "Dragon Queen",
    tier: "adult",
    target: 2100,
    minPiece: 20,
    palette: P(
      ["#14213D", "Night"],
      ["#F4EFE0", "Moon"],
      ["#E07A3D", "Scales"],
      ["#C45C26", "Shadow scale"],
      ["#FFD166", "Gold"],
      ["#FFF1D0", "Belly"],
      ["#8C1C13", "Wing"],
      ["#F4A261", "Membrane"],
      ["#1B2430", "Eye"],
      ["#F6E7C1", "Horn"],
      ["#6FA04A", "Pine"],
      ["#243E2A", "Forest"],
      ["#FFE08A", "Star"],
      ["#7A3048", "Ridge"]
    ),
    draw(p, S) {
      const d = kit(p, S);
      d.bg(0);
      d.circ(760, 150, 70, 1);
      for (let i = 0; i < 28; i++) {
        const x = 40 + ((i * 97) % 920);
        const y = 30 + ((i * 53) % 280);
        if (Math.hypot(x - 760, y - 150) > 90) d.star(x, y, 4 + (i % 3) * 2, 12, 4);
      }
      d.hill(200, 980, 460, 220, 11);
      d.hill(780, 1000, 400, 180, 10);
      d.pine(80, 900, 260, 10, 11);
      d.pine(180, 930, 200, 11, 10);
      d.ell(560, 600, 230, 120, 2, -0.15);
      d.ell(580, 640, 140, 62, 5);
      for (let row = 0; row < 4; row++) {
        for (let col = 0; col < 7; col++) {
          d.ell(450 + col * 30, 560 + row * 24, 8, 11, row % 2 ? 3 : 13, 0.5);
        }
      }
      d.cap(760, 560, 930, 420, 28, 2);
      d.poly([[930, 390], [990, 450], [900, 470]], 4);
      d.circ(340, 500, 78, 2);
      d.ell(230, 530, 70, 34, 2);
      d.poly([[300, 440], [320, 340], [360, 450]], 9);
      d.poly([[360, 450], [410, 350], [420, 470]], 9);
      d.circ(300, 490, 12, 5);
      d.circ(304, 492, 6, 8);
      d.circ(210, 525, 7, 8);
      d.poly([[480, 500], [760, 220], [820, 420], [560, 560]], 6);
      d.poly([[520, 480], [700, 300], [740, 430], [540, 520]], 7);
      for (let i = 0; i < 4; i++) d.line([[560 + i * 30, 500 - i * 10], [700, 320 + i * 28]], 6, 4);
      d.cap(500, 700, 470, 860, 18, 2);
      d.cap(650, 690, 690, 870, 16, 3);
      d.ell(460, 880, 30, 14, 4);
      d.ell(700, 885, 28, 12, 4);
      d.poly([[500, 520], [530, 450], [560, 530]], 9);
      d.poly([[600, 500], [640, 430], [660, 520]], 9);
    },
  }),

  scene({
    id: "celestial-wolf",
    pack: "creatures",
    title: "Celestial Wolf",
    tier: "adult",
    target: 1600,
    palette: P(
      ["#1C2340", "Night"],
      ["#D5DDE6", "Wolf"],
      ["#6E7C8A", "Shade"],
      ["#F4EFE0", "Moon"],
      ["#FFF8EE", "Chest"],
      ["#1B2430", "Nose"],
      ["#FFE08A", "Star"],
      ["#3D348B", "Aurora"],
      ["#6C8CFF", "Glow"],
      ["#243044", "Pine"],
      ["#8FA4B8", "Fur"]
    ),
    draw(p, S) {
      const d = kit(p, S);
      d.bg(0);
      d.circ(500, 300, 180, 3);
      for (let i = 0; i < 5; i++) d.ell(200 + i * 150, 80, 80, 18, i % 2 ? 7 : 8);
      for (let i = 0; i < 36; i++) d.star(30 + ((i * 113) % 940), 20 + ((i * 67) % 220), 3 + (i % 4), 6, 4);
      d.hill(180, 1000, 400, 180, 9);
      d.hill(820, 1020, 380, 160, 9);
      d.ell(500, 680, 160, 90, 1, -0.1);
      d.ell(520, 720, 80, 50, 4);
      d.circ(340, 560, 80, 1);
      d.poly([[290, 530], [250, 410], [340, 500]], 2);
      d.poly([[380, 520], [450, 400], [420, 530]], 2);
      d.ell(300, 590, 40, 22, 4);
      d.circ(310, 550, 10, 3);
      d.circ(314, 552, 5, 5);
      d.circ(270, 590, 8, 5);
      d.cap(640, 700, 860, 640, 26, 1);
      d.ell(880, 620, 30, 22, 10);
      for (let i = 0; i < 12; i++) d.ell(430 + (i % 4) * 28, 640 + Math.floor(i / 4) * 22, 8, 12, 10, 0.6);
      d.cap(450, 760, 430, 900, 14, 2);
      d.cap(560, 760, 590, 910, 14, 2);
      d.ell(420, 915, 24, 10, 5);
      d.ell(600, 920, 24, 10, 5);
    },
  }),

  scene({
    id: "jolly-tree",
    pack: "christmas",
    title: "Jolly Tree",
    tier: "little",
    palette: P(
      ["#E5F4FF", "Snow sky"],
      ["#F7FBFF", "Snow"],
      ["#1B7A3A", "Tree"],
      ["#0E5C38", "Branch"],
      ["#C81D25", "Ornament"],
      ["#F2D15C", "Star"],
      ["#8D5A34", "Trunk"],
      ["#F4A4B0", "Bauble"],
      ["#7EC8E3", "Bauble blue"]
    ),
    draw(p, S) {
      const d = kit(p, S);
      d.bg(0);
      d.hill(500, 1000, 700, 180, 1);
      d.cap(500, 820, 500, 900, 22, 6);
      d.poly([[500, 180], [300, 480], [700, 480]], 2);
      d.poly([[500, 340], [250, 680], [750, 680]], 3);
      d.poly([[500, 500], [220, 860], [780, 860]], 2);
      d.star(500, 150, 48, 5, 5);
      d.circ(430, 400, 16, 4);
      d.circ(560, 450, 14, 7);
      d.circ(400, 600, 16, 8);
      d.circ(600, 640, 18, 4);
      d.circ(500, 760, 16, 7);
      d.circ(340, 800, 14, 5);
      d.circ(660, 790, 14, 8);
    },
  }),

  scene({
    id: "snow-friend",
    pack: "christmas",
    title: "Snow Friend",
    tier: "little",
    palette: P(
      ["#D7ECFA", "Sky"],
      ["#F7FBFF", "Snow"],
      ["#E7EEF5", "Shadow"],
      ["#1B2430", "Coal"],
      ["#E85D04", "Carrot"],
      ["#C81D25", "Scarf"],
      ["#3E6B3A", "Pine"],
      ["#8D5A34", "Twig"],
      ["#F2D15C", "Star"]
    ),
    draw(p, S) {
      const d = kit(p, S);
      d.bg(0);
      d.hill(500, 980, 700, 200, 1);
      d.pine(120, 860, 280, 6, 7);
      d.pine(880, 880, 240, 6, 7);
      d.circ(500, 700, 120, 1);
      d.circ(500, 480, 86, 1);
      d.circ(500, 320, 60, 1);
      d.circ(475, 310, 8, 3);
      d.circ(525, 310, 8, 3);
      d.poly([[530, 330], [590, 340], [530, 350]], 4);
      d.circ(500, 460, 8, 3);
      d.circ(500, 520, 8, 3);
      d.circ(500, 680, 8, 3);
      d.circ(500, 760, 8, 3);
      d.ell(500, 400, 90, 18, 5);
      d.cap(400, 360, 300, 300, 6, 7);
      d.cap(600, 360, 710, 290, 6, 7);
      d.star(200, 120, 16, 8, 5);
      d.star(780, 90, 12, 8, 4);
      d.ell(500, 860, 150, 20, 2);
    },
  }),

  scene({
    id: "reindeer-flight",
    pack: "christmas",
    title: "Reindeer Flight",
    tier: "big",
    target: 150,
    palette: P(
      ["#1C2340", "Night"],
      ["#C4A574", "Coat"],
      ["#8D5A34", "Antler"],
      ["#F4E1B5", "Belly"],
      ["#1B2430", "Eye"],
      ["#C81D25", "Nose"],
      ["#F7FBFF", "Snow"],
      ["#FFE08A", "Star"],
      ["#3E6B3A", "Pine"],
      ["#E6B325", "Bell"]
    ),
    draw(p, S) {
      const d = kit(p, S);
      d.bg(0);
      for (let i = 0; i < 18; i++) d.star(40 + ((i * 90) % 920), 30 + ((i * 40) % 200), 4 + (i % 3), 7, 4);
      d.hill(500, 1000, 700, 160, 6);
      d.pine(80, 920, 200, 8, 2);
      d.pine(920, 940, 180, 8, 2);
      d.ell(520, 560, 180, 80, 1, -0.4);
      d.circ(300, 470, 60, 1);
      d.ell(230, 500, 40, 22, 1);
      d.circ(250, 460, 8, 4);
      d.circ(210, 500, 8, 5);
      d.line([[280, 430], [220, 340], [180, 300]], 8, 2);
      d.line([[220, 340], [160, 360]], 6, 2);
      d.line([[320, 420], [360, 320], [410, 280]], 8, 2);
      d.line([[360, 320], [390, 350]], 6, 2);
      d.ell(500, 590, 70, 36, 3);
      d.cap(430, 600, 400, 760, 12, 1);
      d.cap(600, 620, 640, 780, 12, 1);
      d.circ(500, 500, 10, 9);
      d.poly([[680, 520], [760, 470], [720, 560]], 2);
    },
  }),

  scene({
    id: "cozy-wreath",
    pack: "christmas",
    title: "Cozy Wreath",
    tier: "big",
    target: 140,
    palette: P(
      ["#F6E7C1", "Door"],
      ["#8D5A34", "Wood"],
      ["#1B7A3A", "Wreath"],
      ["#0E5C38", "Needle"],
      ["#C81D25", "Bow"],
      ["#F2D15C", "Bell"],
      ["#F4A4B0", "Berry"],
      ["#7EC8E3", "Bauble"],
      ["#FFF8EE", "Snow"],
      ["#6B3A2A", "Frame"]
    ),
    draw(p, S) {
      const d = kit(p, S);
      d.bg(0);
      d.window(180, 120, 640, 760, 9);
      d.window(220, 160, 560, 680, 1);
      d.circ(500, 470, 230, 2);
      d.circ(500, 470, 140, 1);
      for (let i = 0; i < 14; i++) {
        const a = (i / 14) * Math.PI * 2;
        d.circ(500 + Math.cos(a) * 185, 470 + Math.sin(a) * 185, 28, i % 2 ? 3 : 2);
      }
      for (let i = 0; i < 8; i++) {
        const a = (i / 8) * Math.PI * 2 + 0.2;
        d.circ(500 + Math.cos(a) * 185, 470 + Math.sin(a) * 185, 10, i % 2 ? 6 : 7);
      }
      d.poly([[430, 280], [500, 360], [570, 280], [540, 270], [500, 320], [460, 270]], 4);
      d.circ(500, 250, 16, 5);
      d.ell(500, 860, 160, 24, 8);
    },
  }),

  scene({
    id: "sleigh-ride",
    pack: "christmas",
    title: "Sleigh Ride",
    tier: "big",
    target: 210,
    palette: P(
      ["#E7F3FF", "Sky"],
      ["#F7FBFF", "Snow"],
      ["#C81D25", "Sleigh"],
      ["#F2D15C", "Trim"],
      ["#1B7A3A", "Pine"],
      ["#8D5A34", "Gift wrap"],
      ["#2F5DA8", "Gift"],
      ["#6FA04A", "Ribbon"],
      ["#E07A3D", "Reindeer"],
      ["#1B2430", "Runner"],
      ["#FFF8EE", "Cloud"]
    ),
    draw(p, S) {
      const d = kit(p, S);
      d.bg(0);
      d.cloud(200, 160, 40, 10);
      d.cloud(700, 120, 30, 10);
      d.hill(500, 980, 700, 180, 1);
      d.pine(90, 860, 220, 4, 8);
      d.pine(200, 900, 160, 4, 8);
      d.poly([[380, 700], [860, 640], [900, 760], [420, 820]], 2);
      d.line([[400, 800], [200, 860]], 10, 9);
      d.line([[860, 750], [980, 800]], 10, 9);
      d.cap(460, 680, 800, 640, 8, 3);
      d.window(520, 660, 70, 50, 5);
      d.window(640, 640, 80, 60, 6);
      d.cap(555, 640, 555, 700, 6, 7);
      d.cap(680, 620, 680, 690, 6, 7);
      d.ell(280, 760, 70, 30, 8);
      d.circ(220, 730, 28, 8);
      d.poly([[200, 710], [170, 650], [230, 700]], 3);
      d.circ(210, 725, 5, 9);
    },
  }),

  scene({
    id: "pumpkin-patch",
    pack: "halloween",
    title: "Pumpkin Patch",
    tier: "little",
    palette: P(
      ["#FFE0B0", "Sky"],
      ["#7CB342", "Field"],
      ["#F18F01", "Pumpkin"],
      ["#D97706", "Ridge"],
      ["#2F7D4A", "Stem"],
      ["#1B2430", "Face"],
      ["#C4451E", "Leaf"],
      ["#F4E1B5", "Moon"],
      ["#6FA04A", "Vine"]
    ),
    draw(p, S) {
      const d = kit(p, S);
      d.bg(0);
      d.circ(800, 140, 50, 7);
      d.hill(500, 980, 700, 240, 1);
      d.ell(500, 640, 180, 140, 2);
      d.ell(430, 640, 40, 130, 3);
      d.ell(570, 640, 40, 130, 3);
      d.cap(500, 500, 540, 420, 12, 4);
      d.poly([[400, 600], [460, 620], [430, 670]], 5);
      d.poly([[600, 600], [540, 620], [570, 670]], 5);
      d.poly([[470, 700], [530, 700], [500, 750]], 5);
      d.ell(280, 760, 90, 70, 2);
      d.cap(280, 690, 300, 640, 8, 4);
      d.ell(740, 800, 70, 54, 3);
      d.cap(740, 750, 760, 700, 7, 4);
      d.line([[200, 900], [400, 800], [700, 860]], 8, 8);
    },
  }),

  scene({
    id: "friendly-ghost",
    pack: "halloween",
    title: "Friendly Ghost",
    tier: "little",
    palette: P(
      ["#2C2140", "Night"],
      ["#F4F1EA", "Ghost"],
      ["#1B2430", "Eye"],
      ["#F4A4B0", "Cheek"],
      ["#F4EFE0", "Moon"],
      ["#6FA04A", "Hill"],
      ["#E07A3D", "Pumpkin"],
      ["#FFE08A", "Star"]
    ),
    draw(p, S) {
      const d = kit(p, S);
      d.bg(0);
      d.crescent(780, 150, 70, 4, 0);
      d.star(140, 120, 14, 7, 5);
      d.star(300, 80, 10, 7, 4);
      d.star(560, 100, 8, 7, 4);
      d.hill(500, 1000, 700, 200, 5);
      d.poly([[350, 780], [300, 620], [340, 480], [500, 400], [660, 480], [700, 640], [640, 780], [560, 700], [500, 780], [440, 700]], 1);
      d.circ(430, 540, 18, 2);
      d.circ(560, 540, 18, 2);
      d.ell(490, 610, 28, 16, 3);
      d.ell(250, 860, 70, 50, 6);
      d.poly([[230, 820], [250, 840], [270, 820]], 2);
      d.poly([[250, 860], [270, 880], [250, 870]], 2);
      d.star(900, 240, 12, 7, 5);
      d.circ(680, 900, 36, 6);
      d.cap(680, 860, 700, 800, 7, 5);
      d.ell(500, 940, 90, 16, 4);
    },
  }),

  scene({
    id: "black-cat",
    pack: "halloween",
    title: "Black Cat",
    tier: "big",
    target: 140,
    palette: P(
      ["#3D2B5A", "Dusk"],
      ["#1B2430", "Cat"],
      ["#F4EFE0", "Moon"],
      ["#E6A23C", "Eye"],
      ["#F48FB1", "Nose"],
      ["#6FA04A", "Hill"],
      ["#E07A3D", "Pumpkin"],
      ["#2F7D4A", "Stem"],
      ["#C9B6E4", "Fence"],
      ["#FFF8EE", "Whisker shine"]
    ),
    draw(p, S) {
      const d = kit(p, S);
      d.bg(0);
      d.circ(160, 160, 70, 2);
      d.hill(500, 980, 680, 200, 5);
      for (let i = 0; i < 5; i++) d.poly([[120 + i * 180, 860], [160 + i * 180, 700], [200 + i * 180, 860]], 8);
      d.cap(140, 780, 900, 780, 6, 8);
      d.ell(520, 700, 130, 70, 1);
      d.circ(360, 600, 70, 1);
      d.poly([[320, 560], [300, 470], [370, 560]], 1);
      d.poly([[400, 560], [450, 470], [430, 570]], 1);
      d.ell(340, 590, 14, 10, 3);
      d.ell(390, 590, 14, 10, 3);
      d.circ(365, 620, 6, 4);
      d.cap(620, 680, 780, 560, 22, 1);
      d.ell(250, 860, 60, 44, 6);
      d.cap(250, 820, 270, 770, 7, 7);
      d.circ(500, 900, 16, 6);
    },
  }),

  scene({
    id: "haunted-house",
    pack: "halloween",
    title: "Haunted House",
    tier: "big",
    target: 200,
    palette: P(
      ["#241833", "Sky"],
      ["#3D2B5A", "Cloud"],
      ["#5C5346", "House"],
      ["#2B241C", "Roof"],
      ["#F4E1B5", "Window"],
      ["#1B2430", "Door"],
      ["#6B8F71", "Ground"],
      ["#E07A3D", "Pumpkin"],
      ["#8C6A43", "Fence"],
      ["#F4EFE0", "Moon"],
      ["#7A3048", "Shutter"]
    ),
    draw(p, S) {
      const d = kit(p, S);
      d.bg(0);
      d.crescent(800, 120, 60, 9, 0);
      d.blob(200, 140, 50, 1, 2, 0.6);
      d.blob(420, 90, 36, 1, 4, 0.5);
      d.hill(500, 1000, 700, 180, 6);
      d.window(300, 420, 360, 300, 2);
      d.poly([[280, 430], [480, 220], [700, 430]], 3);
      d.window(470, 250, 70, 160, 2);
      d.poly([[460, 260], [505, 160], [550, 260]], 3);
      d.window(360, 500, 50, 70, 4);
      d.window(560, 500, 50, 70, 4);
      d.window(450, 560, 60, 110, 5);
      d.window(340, 510, 12, 70, 10);
      d.window(618, 510, 12, 70, 10);
      d.circ(490, 620, 6, 4);
      for (let i = 0; i < 6; i++) d.poly([[80 + i * 70, 860], [100 + i * 70, 760], [130 + i * 70, 860]], 8);
      d.ell(180, 880, 50, 36, 7);
      d.ell(820, 900, 44, 32, 7);
      d.circ(200, 300, 8, 9);
    },
  }),

  scene({
    id: "moon-bats",
    pack: "halloween",
    title: "Moon Bats",
    tier: "big",
    target: 160,
    palette: P(
      ["#1C2340", "Night"],
      ["#F4EFE0", "Moon"],
      ["#241833", "Bat"],
      ["#6C3B8A", "Cloud"],
      ["#E07A3D", "Hill"],
      ["#2F7D4A", "Pine"],
      ["#FFE08A", "Star"],
      ["#F4A4B0", "Eye"]
    ),
    draw(p, S) {
      const d = kit(p, S);
      d.bg(0);
      d.circ(500, 380, 180, 1);
      for (let i = 0; i < 12; i++) d.star(40 + ((i * 80) % 300), 40 + ((i * 50) % 180), 5, 6, 4);
      for (let i = 0; i < 8; i++) d.star(700 + ((i * 30) % 250), 40 + ((i * 40) % 160), 4, 6, 4);
      d.hill(500, 1000, 700, 220, 4);
      d.pine(100, 900, 220, 5, 4);
      d.pine(880, 920, 180, 5, 4);
      const bat = (x, y, s) => {
        d.ell(x, y, s * 0.35, s * 0.22, 2);
        d.poly([[x - s * 0.2, y], [x - s, y - s * 0.5], [x - s * 0.2, y + s * 0.15]], 2);
        d.poly([[x + s * 0.2, y], [x + s, y - s * 0.45], [x + s * 0.2, y + s * 0.15]], 2);
        d.circ(x - s * 0.1, y - s * 0.02, s * 0.06, 7);
        d.circ(x + s * 0.1, y - s * 0.02, s * 0.06, 7);
      };
      bat(280, 240, 70);
      bat(700, 200, 54);
      bat(180, 420, 40);
      bat(820, 360, 48);
      bat(620, 520, 36);
      d.blob(300, 160, 40, 3, 3, 0.5);
    },
  }),

  scene({
    id: "skull-garden",
    pack: "halloween",
    title: "Skull Garden",
    tier: "adult",
    target: 1400,
    palette: P(
      ["#241833", "Night"],
      ["#F3E6C9", "Bone"],
      ["#1B2430", "Socket"],
      ["#E07A3D", "Marigold"],
      ["#7A3048", "Rose"],
      ["#6FA04A", "Vine"],
      ["#F4EFE0", "Moon"],
      ["#C9B6E4", "Mist"],
      ["#8D5A34", "Soil"]
    ),
    draw(p, S) {
      const d = kit(p, S);
      d.bg(0);
      d.circ(800, 140, 64, 6);
      for (let i = 0; i < 20; i++) d.star(30 + ((i * 97) % 700), 24 + ((i * 41) % 180), 4, 7, 4);
      d.hill(500, 1020, 720, 200, 8);
      d.ell(500, 520, 210, 230, 1);
      d.ell(420, 470, 55, 64, 2);
      d.ell(580, 470, 55, 64, 2);
      d.poly([[500, 540], [470, 610], [530, 610]], 2);
      for (let i = 0; i < 6; i++) d.window(360 + i * 42, 680, 28, 48, 1);
      for (let i = 0; i < 5; i++) d.window(390 + i * 42, 730, 22, 36, 2);
      d.ell(500, 820, 160, 40, 1);
      for (let i = 0; i < 10; i++) d.flower(140 + i * 80, 900 - (i % 3) * 20, 18, i % 2 ? 3 : 4, 6);
      d.line([[120, 860], [300, 700], [500, 760], [760, 680], [900, 860]], 10, 5);
      for (let i = 0; i < 8; i++) d.ell(400 + (i % 4) * 50, 400 + Math.floor(i / 4) * 40, 10, 16, 7, 0.4);
    },
  }),
];

// Procedural isometric building renderer — NO gradients, flat colors for performance
// Buildings draw from baseY (ground level) upward, properly integrated with iso tiles

import { TILE_W, TILE_H } from './gameTypes';

// ===== Helpers =====
function darken(hex: string, amt: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${Math.max(0, Math.floor(r * (1 - amt)))},${Math.max(0, Math.floor(g * (1 - amt)))},${Math.max(0, Math.floor(b * (1 - amt)))})`;
}

function lighten(hex: string, amt: number): string {
  const r = parseInt(hex.slice(1, 3), 16);
  const g = parseInt(hex.slice(3, 5), 16);
  const b = parseInt(hex.slice(5, 7), 16);
  return `rgb(${Math.min(255, Math.floor(r + (255 - r) * amt))},${Math.min(255, Math.floor(g + (255 - g) * amt))},${Math.min(255, Math.floor(b + (255 - b) * amt))})`;
}

// Draw an isometric box anchored at (cx, baseY) — baseY is ground level, box goes upward
function isoBox(ctx: CanvasRenderingContext2D, cx: number, baseY: number, w: number, h: number, depth: number, topCol: string, leftCol: string, rightCol: string) {
  const hw = w / 2;
  const hh = h / 2;

  // Top face
  ctx.fillStyle = topCol;
  ctx.beginPath();
  ctx.moveTo(cx, baseY - depth - hh);
  ctx.lineTo(cx + hw, baseY - depth);
  ctx.lineTo(cx, baseY - depth + hh);
  ctx.lineTo(cx - hw, baseY - depth);
  ctx.closePath();
  ctx.fill();

  // Left face
  ctx.fillStyle = leftCol;
  ctx.beginPath();
  ctx.moveTo(cx - hw, baseY - depth);
  ctx.lineTo(cx, baseY - depth + hh);
  ctx.lineTo(cx, baseY + hh);
  ctx.lineTo(cx - hw, baseY);
  ctx.closePath();
  ctx.fill();

  // Right face
  ctx.fillStyle = rightCol;
  ctx.beginPath();
  ctx.moveTo(cx + hw, baseY - depth);
  ctx.lineTo(cx, baseY - depth + hh);
  ctx.lineTo(cx, baseY + hh);
  ctx.lineTo(cx + hw, baseY);
  ctx.closePath();
  ctx.fill();
}

function drawRoof(ctx: CanvasRenderingContext2D, cx: number, roofBase: number, w: number, roofH: number, color: string) {
  const hw = w / 2;
  const hh = w / 4;
  ctx.fillStyle = color;
  ctx.beginPath();
  ctx.moveTo(cx, roofBase - roofH);
  ctx.lineTo(cx + hw, roofBase);
  ctx.lineTo(cx, roofBase + hh);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = darken(color, 0.2);
  ctx.beginPath();
  ctx.moveTo(cx, roofBase - roofH);
  ctx.lineTo(cx - hw, roofBase);
  ctx.lineTo(cx, roofBase + hh);
  ctx.closePath();
  ctx.fill();
}

function drawWindow(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = '#87CEEB';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#5a4030';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(x, y, w, h);
}

function drawDoor(ctx: CanvasRenderingContext2D, x: number, y: number, w: number, h: number) {
  ctx.fillStyle = '#6b4226';
  ctx.fillRect(x, y, w, h);
  ctx.strokeStyle = '#4a2e18';
  ctx.lineWidth = 0.5;
  ctx.strokeRect(x, y, w, h);
}

// ===== Construction scaffolding =====
export function drawScaffolding(ctx: CanvasRenderingContext2D, cx: number, baseY: number, bw: number, bh: number, progress: number, time: number) {
  const scale = 10 + (bw - 1) * 8;
  const height = scale * 1.5;
  const builtHeight = height * progress;

  // Foundation — iso diamond
  ctx.fillStyle = '#8b7355';
  ctx.beginPath();
  ctx.moveTo(cx, baseY + 4);
  ctx.lineTo(cx + scale, baseY);
  ctx.lineTo(cx, baseY - 4);
  ctx.lineTo(cx - scale, baseY);
  ctx.closePath();
  ctx.fill();

  // Partial walls
  if (progress > 0.1) {
    const wallH = Math.min(builtHeight, height * 0.7);
    ctx.fillStyle = `rgba(180, 160, 130, ${0.5 + progress * 0.5})`;
    ctx.beginPath();
    ctx.moveTo(cx - scale, baseY);
    ctx.lineTo(cx, baseY - 4);
    ctx.lineTo(cx, baseY - 4 - wallH);
    ctx.lineTo(cx - scale, baseY - wallH);
    ctx.closePath();
    ctx.fill();
    ctx.fillStyle = `rgba(160, 140, 110, ${0.5 + progress * 0.5})`;
    ctx.beginPath();
    ctx.moveTo(cx + scale, baseY);
    ctx.lineTo(cx, baseY - 4);
    ctx.lineTo(cx, baseY - 4 - wallH);
    ctx.lineTo(cx + scale, baseY - wallH);
    ctx.closePath();
    ctx.fill();
  }

  // Scaffolding poles
  ctx.strokeStyle = '#8B6914';
  ctx.lineWidth = 1.5;
  const poleH = height * 0.9;
  ctx.beginPath();
  ctx.moveTo(cx - scale + 2, baseY - 1);
  ctx.lineTo(cx - scale + 2, baseY - 1 - poleH);
  ctx.moveTo(cx + scale - 2, baseY - 1);
  ctx.lineTo(cx + scale - 2, baseY - 1 - poleH);
  ctx.stroke();

  // Cross beams
  ctx.lineWidth = 0.8;
  for (let i = 1; i <= 3; i++) {
    const y = baseY - poleH * (i / 4);
    ctx.beginPath();
    ctx.moveTo(cx - scale + 2, y);
    ctx.lineTo(cx + scale - 2, y);
    ctx.stroke();
  }

  // Progress text
  const pct = Math.floor(progress * 100);
  ctx.fillStyle = '#fff';
  ctx.font = 'bold 8px sans-serif';
  ctx.textAlign = 'center';
  ctx.strokeStyle = '#000';
  ctx.lineWidth = 2;
  ctx.strokeText(`${pct}%`, cx, baseY - height - 6);
  ctx.fillText(`${pct}%`, cx, baseY - height - 6);

  // Hammer
  if (progress < 1) {
    const hammerX = cx + Math.sin(time * 5) * 3;
    const hammerY = baseY - builtHeight - 8 + Math.cos(time * 5) * 1.5;
    ctx.font = '10px serif';
    ctx.fillText('🔨', hammerX - 5, hammerY);
  }
}

// ===== CONSTRUCTION TIMES =====
export const CONSTRUCTION_TIMES: Record<string, number> = {
  road: 5, house: 15, mansion: 45, workshop: 20, market: 30,
  wall: 10, tower: 40, barracks: 60, farm: 25, windmill: 50,
  hospital: 55, school_building: 45, church: 50, well: 10,
  fountain: 8, garden: 5, statue: 30,
};

// ===== Building draw functions =====
type DrawFn = (ctx: CanvasRenderingContext2D, cx: number, baseY: number, level: number, time: number) => void;

const drawHouse: DrawFn = (ctx, cx, baseY, level, time) => {
  const sizes = [
    { w: 18, h: 9, d: 12, roof: 10, wallCol: '#c4a876', roofCol: '#8b6914' },
    { w: 20, h: 10, d: 15, roof: 12, wallCol: '#b89e6e', roofCol: '#7a5c12' },
    { w: 22, h: 11, d: 18, roof: 13, wallCol: '#d4c4a0', roofCol: '#9e4b2a' },
    { w: 24, h: 12, d: 22, roof: 14, wallCol: '#e8dcc4', roofCol: '#8b3a26' },
    { w: 26, h: 13, d: 26, roof: 16, wallCol: '#f0e8d8', roofCol: '#6b2a1a' },
  ];
  const s = sizes[Math.min(level - 1, sizes.length - 1)];
  isoBox(ctx, cx, baseY, s.w, s.h, s.d, lighten(s.wallCol, 0.15), s.wallCol, darken(s.wallCol, 0.15));
  drawRoof(ctx, cx, baseY - s.d, s.w + 4, s.roof, s.roofCol);
  if (level >= 2) drawDoor(ctx, cx - 2, baseY - 6, 4, 6);
  if (level >= 3) {
    drawWindow(ctx, cx - 7, baseY - s.d + 4, 3, 3);
    drawWindow(ctx, cx + 4, baseY - s.d + 4, 3, 3);
  }
  if (level >= 4) {
    ctx.fillStyle = '#8b7355';
    ctx.fillRect(cx + 6, baseY - s.d - s.roof + 2, 3, 6);
  }
};

const drawMansion: DrawFn = (ctx, cx, baseY, level) => {
  const s = { w: 28 + level * 2, h: 14 + level, d: 18 + level * 3, roofH: 14 + level * 2 };
  const wallCol = level >= 4 ? '#f0e8d8' : level >= 3 ? '#d4c4a0' : '#c4a876';
  const roofCol = level >= 4 ? '#6b2a1a' : level >= 3 ? '#9e4b2a' : '#8b6914';
  isoBox(ctx, cx, baseY, s.w, s.h, s.d, lighten(wallCol, 0.15), wallCol, darken(wallCol, 0.15));
  drawRoof(ctx, cx, baseY - s.d, s.w + 6, s.roofH, roofCol);
  drawDoor(ctx, cx - 3, baseY - 8, 6, 8);
  drawWindow(ctx, cx - 10, baseY - s.d + 5, 4, 4);
  drawWindow(ctx, cx + 6, baseY - s.d + 5, 4, 4);
  if (level >= 3) {
    drawWindow(ctx, cx - 10, baseY - s.d + 12, 4, 4);
    drawWindow(ctx, cx + 6, baseY - s.d + 12, 4, 4);
  }
};

const drawWorkshop: DrawFn = (ctx, cx, baseY, level) => {
  const d = 14 + level * 2;
  const wallCol = '#a89070';
  isoBox(ctx, cx, baseY, 20, 10, d, lighten(wallCol, 0.1), wallCol, darken(wallCol, 0.2));
  ctx.fillStyle = '#6b5a3a';
  ctx.beginPath();
  ctx.moveTo(cx - 12, baseY - d);
  ctx.lineTo(cx + 12, baseY - d);
  ctx.lineTo(cx + 14, baseY - d + 3);
  ctx.lineTo(cx - 10, baseY - d + 3);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#555';
  ctx.fillRect(cx - 3, baseY - 5, 6, 3);
  drawDoor(ctx, cx - 2, baseY - 6, 4, 6);
};

const drawMarket: DrawFn = (ctx, cx, baseY, level) => {
  const d = 12 + level * 2;
  const wallCol = '#c4a060';
  isoBox(ctx, cx, baseY, 26, 13, d, lighten(wallCol, 0.15), wallCol, darken(wallCol, 0.15));
  const colors = ['#c0392b', '#e74c3c', '#c0392b'];
  const stripeW = 18;
  for (let i = 0; i < 3; i++) {
    ctx.fillStyle = colors[i];
    ctx.fillRect(cx - stripeW / 2 + i * (stripeW / 3), baseY - d - 2, stripeW / 3, 3);
  }
  if (level >= 2) {
    ctx.fillStyle = '#f5a623';
    ctx.beginPath(); ctx.arc(cx - 4, baseY - 5, 2, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#e74c3c';
    ctx.beginPath(); ctx.arc(cx + 2, baseY - 5, 1.5, 0, Math.PI * 2); ctx.fill();
    ctx.fillStyle = '#27ae60';
    ctx.beginPath(); ctx.arc(cx + 6, baseY - 5.5, 1.8, 0, Math.PI * 2); ctx.fill();
  }
};

const drawWall: DrawFn = (ctx, cx, baseY, level) => {
  const h = 6 + level * 2;
  const col = level >= 3 ? '#8a8a8a' : '#7a6a50';
  isoBox(ctx, cx, baseY, TILE_W * 0.7, TILE_H * 0.35, h, lighten(col, 0.1), col, darken(col, 0.2));
  if (level >= 3) {
    for (let i = -2; i <= 2; i += 2) {
      ctx.fillStyle = col;
      ctx.fillRect(cx + i * 3 - 1, baseY - h - 3, 2, 3);
    }
  }
};

const drawTower: DrawFn = (ctx, cx, baseY, level) => {
  const h = 22 + level * 4;
  const col = level >= 3 ? '#8a8a8a' : '#7a6a50';
  isoBox(ctx, cx, baseY, 14, 7, h, lighten(col, 0.1), col, darken(col, 0.2));
  ctx.fillStyle = '#4a3a2a';
  ctx.beginPath();
  ctx.moveTo(cx, baseY - h - 8);
  ctx.lineTo(cx + 8, baseY - h);
  ctx.lineTo(cx - 8, baseY - h);
  ctx.closePath();
  ctx.fill();
  ctx.fillStyle = '#333';
  ctx.fillRect(cx - 1, baseY - h + 8, 2, 5);
};

const drawBarracks: DrawFn = (ctx, cx, baseY, level) => {
  const d = 16 + level * 3;
  const col = level >= 3 ? '#8a7a6a' : '#6a5a4a';
  isoBox(ctx, cx, baseY, 30, 15, d, lighten(col, 0.1), col, darken(col, 0.2));
  ctx.fillStyle = darken(col, 0.3);
  ctx.beginPath();
  ctx.moveTo(cx, baseY - d - 3);
  ctx.lineTo(cx + 16, baseY - d);
  ctx.lineTo(cx, baseY - d + 8);
  ctx.lineTo(cx - 16, baseY - d);
  ctx.closePath();
  ctx.fill();
  drawDoor(ctx, cx - 3, baseY - 8, 6, 8);
  if (level >= 2) {
    ctx.fillStyle = '#c0392b';
    ctx.fillRect(cx + 10, baseY - d - 8, 2, 8);
    ctx.fillRect(cx + 12, baseY - d - 8, 5, 4);
  }
};

const drawFarm: DrawFn = (ctx, cx, baseY, level, time) => {
  // Plowed soil — iso box sitting on ground
  const soilCol = '#6b5a3a';
  isoBox(ctx, cx, baseY, 28, 14, 3, lighten(soilCol, 0.1), soilCol, darken(soilCol, 0.15));
  // Crops
  const cropH = 3 + level * 1.2;
  const cropColors = ['#228B22', '#32CD32', '#2E8B57', '#3CB371'];
  for (let i = -3; i <= 3; i++) {
    const sway = Math.sin(time * 1.2 + i * 0.5) * 0.6;
    ctx.fillStyle = cropColors[(i + 3) % cropColors.length];
    ctx.beginPath();
    ctx.ellipse(cx + i * 3 + sway, baseY - 4 - cropH, 1, cropH, 0, 0, Math.PI * 2);
    ctx.fill();
  }
  // Fence at level 3+
  if (level >= 3) {
    ctx.strokeStyle = '#8b6914';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - 14, baseY);
    ctx.lineTo(cx - 14, baseY - 6);
    ctx.moveTo(cx + 14, baseY);
    ctx.lineTo(cx + 14, baseY - 6);
    ctx.moveTo(cx - 14, baseY - 4);
    ctx.lineTo(cx + 14, baseY - 4);
    ctx.stroke();
  }
};

const drawWindmill: DrawFn = (ctx, cx, baseY, level, time) => {
  const h = 20 + level * 3;
  const col = '#d4c4a0';
  isoBox(ctx, cx, baseY, 16, 8, h, lighten(col, 0.1), col, darken(col, 0.15));
  ctx.fillStyle = '#8b6914';
  ctx.beginPath();
  ctx.moveTo(cx, baseY - h - 6);
  ctx.lineTo(cx + 9, baseY - h);
  ctx.lineTo(cx - 9, baseY - h);
  ctx.closePath();
  ctx.fill();
  // Blades
  const angle = time * 1.2;
  ctx.save();
  ctx.translate(cx, baseY - h + 2);
  ctx.rotate(angle);
  ctx.strokeStyle = '#5a4a30';
  ctx.lineWidth = 1.5;
  for (let i = 0; i < 4; i++) {
    const a = i * Math.PI / 2;
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a) * 12, Math.sin(a) * 12);
    ctx.stroke();
    ctx.fillStyle = 'rgba(200,180,140,0.5)';
    ctx.beginPath();
    ctx.moveTo(0, 0);
    ctx.lineTo(Math.cos(a - 0.12) * 12, Math.sin(a - 0.12) * 12);
    ctx.lineTo(Math.cos(a + 0.12) * 12, Math.sin(a + 0.12) * 12);
    ctx.closePath();
    ctx.fill();
  }
  ctx.restore();
  drawDoor(ctx, cx - 2, baseY - 6, 4, 6);
};

const drawHospital: DrawFn = (ctx, cx, baseY, level) => {
  const d = 16 + level * 2;
  const col = level >= 3 ? '#e8e0d0' : '#c4b090';
  isoBox(ctx, cx, baseY, 28, 14, d, lighten(col, 0.1), col, darken(col, 0.1));
  drawRoof(ctx, cx, baseY - d, 32, 10, level >= 3 ? '#9e4b2a' : '#8b6914');
  drawDoor(ctx, cx - 3, baseY - 8, 6, 8);
  // Red cross
  ctx.fillStyle = '#ff3333';
  ctx.fillRect(cx - 1.5, baseY - d + 3, 3, 8);
  ctx.fillRect(cx - 5, baseY - d + 5.5, 10, 3);
  if (level >= 2) {
    drawWindow(ctx, cx - 10, baseY - d + 6, 3, 3);
    drawWindow(ctx, cx + 7, baseY - d + 6, 3, 3);
  }
};

const drawSchool: DrawFn = (ctx, cx, baseY, level) => {
  const d = 16 + level * 2;
  const col = level >= 3 ? '#e0d0b8' : '#c4a876';
  isoBox(ctx, cx, baseY, 28, 14, d, lighten(col, 0.1), col, darken(col, 0.1));
  drawRoof(ctx, cx, baseY - d, 32, 12, '#8b5a3a');
  drawDoor(ctx, cx - 3, baseY - 8, 6, 8);
  if (level >= 3) {
    ctx.fillStyle = col;
    ctx.fillRect(cx + 8, baseY - d - 10, 4, 10);
    ctx.fillStyle = '#d4a645';
    ctx.beginPath();
    ctx.arc(cx + 10, baseY - d - 4, 2, 0, Math.PI * 2);
    ctx.fill();
  }
};

const drawChurch: DrawFn = (ctx, cx, baseY, level) => {
  const d = 18 + level * 3;
  const col = level >= 3 ? '#e8e0d0' : '#c4b090';
  isoBox(ctx, cx, baseY, 24, 12, d, lighten(col, 0.1), col, darken(col, 0.1));
  drawRoof(ctx, cx, baseY - d, 28, 14, level >= 3 ? '#6b4a2a' : '#8b6914');
  ctx.fillStyle = col;
  ctx.fillRect(cx - 2, baseY - d - 14 - level * 2, 4, 14 + level * 2);
  ctx.fillStyle = '#d4a645';
  ctx.fillRect(cx - 0.5, baseY - d - 18 - level * 2, 1, 5);
  ctx.fillRect(cx - 2, baseY - d - 16 - level * 2, 4, 1);
  drawDoor(ctx, cx - 3, baseY - 8, 6, 8);
};

const drawWell: DrawFn = (ctx, cx, baseY, level) => {
  const col = '#8a8a7a';
  isoBox(ctx, cx, baseY, 12, 6, 6, lighten(col, 0.1), col, darken(col, 0.15));
  ctx.fillStyle = '#4a90d9';
  ctx.beginPath();
  ctx.ellipse(cx, baseY - 6, 4, 2, 0, 0, Math.PI * 2);
  ctx.fill();
  if (level >= 2) {
    ctx.strokeStyle = '#6b5a3a';
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.moveTo(cx - 4, baseY - 6);
    ctx.lineTo(cx - 4, baseY - 14);
    ctx.lineTo(cx + 4, baseY - 14);
    ctx.lineTo(cx + 4, baseY - 6);
    ctx.stroke();
  }
};

const drawFountain: DrawFn = (ctx, cx, baseY, level, time) => {
  const col = '#9a9a8a';
  isoBox(ctx, cx, baseY, 14, 7, 4, lighten(col, 0.1), col, darken(col, 0.15));
  ctx.fillStyle = '#4a90d9';
  ctx.beginPath();
  ctx.ellipse(cx, baseY - 4, 5, 2.5, 0, 0, Math.PI * 2);
  ctx.fill();
  if (level >= 2) {
    ctx.fillStyle = col;
    ctx.fillRect(cx - 1, baseY - 10, 2, 6);
    const jetH = 3 + Math.sin(time * 3) * 1.2;
    ctx.fillStyle = 'rgba(74, 144, 217, 0.5)';
    ctx.beginPath();
    ctx.arc(cx, baseY - 10 - jetH, 2, 0, Math.PI * 2);
    ctx.fill();
  }
};

const drawGarden: DrawFn = (ctx, cx, baseY, level, time) => {
  ctx.fillStyle = '#5a4a2a';
  ctx.beginPath();
  ctx.ellipse(cx, baseY, 8, 4, 0, 0, Math.PI * 2);
  ctx.fill();
  const flowerColors = ['#e74c3c', '#f1c40f', '#9b59b6', '#3498db', '#e67e22'];
  const count = 3 + level;
  for (let i = 0; i < count; i++) {
    const angle = (i / count) * Math.PI * 2;
    const r = 4 + level * 0.5;
    const fx = cx + Math.cos(angle) * r;
    const fy = baseY + Math.sin(angle) * r * 0.5;
    const sway = Math.sin(time * 1.2 + i) * 0.4;
    ctx.strokeStyle = '#228B22';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(fx, fy);
    ctx.lineTo(fx + sway, fy - 4 - level);
    ctx.stroke();
    ctx.fillStyle = flowerColors[i % flowerColors.length];
    ctx.beginPath();
    ctx.arc(fx + sway, fy - 4 - level, 1.5, 0, Math.PI * 2);
    ctx.fill();
  }
};

const drawStatue: DrawFn = (ctx, cx, baseY, level) => {
  const col = '#9a9a8a';
  isoBox(ctx, cx, baseY, 10, 5, 6, lighten(col, 0.1), col, darken(col, 0.2));
  ctx.fillStyle = '#8a8a7a';
  ctx.fillRect(cx - 2, baseY - 18, 4, 12);
  ctx.beginPath();
  ctx.arc(cx, baseY - 20, 3, 0, Math.PI * 2);
  ctx.fill();
  if (level >= 3) {
    ctx.strokeStyle = '#8a8a7a';
    ctx.lineWidth = 1.5;
    ctx.beginPath();
    ctx.moveTo(cx - 2, baseY - 15);
    ctx.lineTo(cx - 6, baseY - 18);
    ctx.moveTo(cx + 2, baseY - 15);
    ctx.lineTo(cx + 6, baseY - 12);
    ctx.stroke();
  }
};

const drawRoad: DrawFn = (ctx, cx, baseY, level) => {
  if (level >= 2) {
    ctx.fillStyle = 'rgba(120, 100, 70, 0.3)';
    for (let i = -2; i <= 2; i++) {
      for (let j = -1; j <= 1; j++) {
        ctx.fillRect(cx + i * 4 - 1, baseY + j * 3 - 1, 2, 2);
      }
    }
  }
};

const drawMonument: DrawFn = (ctx, cx, baseY, level, time) => {
  const col = '#d4c4a0';
  isoBox(ctx, cx, baseY, 32, 16, 30, lighten(col, 0.1), col, darken(col, 0.1));
  ctx.fillStyle = '#e8dcc4';
  for (let i = -2; i <= 2; i++) {
    ctx.fillRect(cx + i * 6 - 1, baseY - 28, 2, 26);
  }
  ctx.fillStyle = lighten(col, 0.2);
  ctx.beginPath();
  ctx.moveTo(cx, baseY - 36);
  ctx.lineTo(cx + 17, baseY - 30);
  ctx.lineTo(cx - 17, baseY - 30);
  ctx.closePath();
  ctx.fill();
};

// Registry
const BUILDING_RENDERERS: Record<string, DrawFn> = {
  road: drawRoad, house: drawHouse, mansion: drawMansion,
  workshop: drawWorkshop, market: drawMarket, wall: drawWall,
  tower: drawTower, barracks: drawBarracks, farm: drawFarm,
  windmill: drawWindmill, hospital: drawHospital, school_building: drawSchool,
  church: drawChurch, well: drawWell, fountain: drawFountain,
  garden: drawGarden, statue: drawStatue,
};

const MONUMENT_IDS = [
  'torre_belem', 'ponte_dom_luis', 'universidade_coimbra', 'castelo_guimaraes',
  'fortaleza_sagres', 'templo_romano', 'castelo_braganca', 'moliceiro_aveiro',
  'castelo_beja', 'jardim_episcopal', 'se_guarda', 'castelo_leiria',
  'castelo_marvao', 'castelo_almourol', 'castelo_palmela', 'santuario_luzia',
  'solar_mateus', 'se_viseu', 'lagoa_sete_cidades', 'monte_funchal',
];
for (const id of MONUMENT_IDS) {
  BUILDING_RENDERERS[id] = drawMonument;
}

export function drawBuilding(ctx: CanvasRenderingContext2D, defId: string, cx: number, baseY: number, level: number, time: number) {
  const renderer = BUILDING_RENDERERS[defId];
  if (renderer) {
    renderer(ctx, cx, baseY, level, time);
  } else {
    isoBox(ctx, cx, baseY, 16, 8, 14, '#c4a876', '#a89060', '#8a7a50');
  }
}

export function getConstructionProgress(startedAt: string | null, durationSeconds: number): number {
  if (!startedAt || durationSeconds <= 0) return 1;
  const elapsed = (Date.now() - new Date(startedAt).getTime()) / 1000;
  return Math.min(1, elapsed / durationSeconds);
}

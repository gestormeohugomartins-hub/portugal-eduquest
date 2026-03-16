// ====== Procedural Terrain Generation ======
// Generates decorative elements (trees, rocks, animals) around the village grid

import { TILE_W, TILE_H } from './gameTypes';
import { gridToIso } from './gridLogic';

export type TerrainElementType = 'pine' | 'oak' | 'bush' | 'rock_small' | 'rock_large' | 'iron_ore' | 'coal_ore' | 'sheep' | 'rabbit' | 'deer' | 'fish_spot' | 'river_tile' | 'lake_tile' | 'flower' | 'mushroom';

export interface TerrainElement {
  id: number;
  type: TerrainElementType;
  gx: number;
  gy: number;
  scale: number;
  variant: number;
  animOffset: number;
}

export interface TerrainConfig {
  district?: string | null;
  gridSize: number;
  seed: number;
}

// Simple seeded random
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

const COASTAL_DISTRICTS = ['lisboa', 'porto', 'faro', 'setubal', 'aveiro', 'leiria', 'viana_castelo', 'acores', 'madeira'];
const RIVER_DISTRICTS = ['santarem', 'coimbra', 'portalegre', 'evora', 'castelo_branco', 'vila_real'];
const LAKE_DISTRICTS = ['braganca', 'guarda', 'viseu', 'braga', 'beja'];

const WILDERNESS_BORDER = 6;

export function generateTerrain(config: TerrainConfig): TerrainElement[] {
  const { district, gridSize, seed } = config;
  const rand = seededRandom(seed);
  const elements: TerrainElement[] = [];
  let id = 0;

  const totalSize = gridSize + WILDERNESS_BORDER * 2;
  const minBound = -WILDERNESS_BORDER;
  const maxBound = gridSize + WILDERNESS_BORDER;

  const hasCoast = district ? COASTAL_DISTRICTS.includes(district) : false;
  const hasRiver = district ? RIVER_DISTRICTS.includes(district) : false;
  const hasLake = district ? LAKE_DISTRICTS.includes(district) : false;

  // Water generation (unchanged logic)
  if (hasCoast) {
    for (let i = minBound; i < maxBound; i++) {
      for (let depth = 0; depth < 3; depth++) {
        elements.push({ id: id++, type: 'lake_tile', gx: i, gy: maxBound - 1 - depth, scale: 1, variant: Math.floor(rand() * 4), animOffset: rand() * Math.PI * 2 });
      }
      if (rand() < 0.15) {
        elements.push({ id: id++, type: 'fish_spot', gx: i + rand() * 0.5, gy: maxBound - 2 + rand(), scale: 0.6 + rand() * 0.4, variant: Math.floor(rand() * 3), animOffset: rand() * Math.PI * 2 });
      }
    }
  }

  if (hasRiver) {
    for (let i = minBound; i < maxBound; i++) {
      const riverY = minBound + Math.floor((i - minBound) * 0.7) + Math.floor(rand() * 2) - 1;
      if (riverY >= minBound && riverY < maxBound && (i < 0 || i >= gridSize || riverY < 0 || riverY >= gridSize)) {
        elements.push({ id: id++, type: 'river_tile', gx: i, gy: riverY, scale: 1, variant: Math.floor(rand() * 4), animOffset: rand() * Math.PI * 2 });
        elements.push({ id: id++, type: 'river_tile', gx: i, gy: riverY + 1, scale: 1, variant: Math.floor(rand() * 4), animOffset: rand() * Math.PI * 2 });
      }
      if (rand() < 0.1 && (i < 0 || i >= gridSize)) {
        elements.push({ id: id++, type: 'fish_spot', gx: i + 0.5, gy: (riverY ?? 0) + 0.5, scale: 0.5 + rand() * 0.4, variant: Math.floor(rand() * 3), animOffset: rand() * Math.PI * 2 });
      }
    }
  }

  if (hasLake) {
    const lakeX = minBound + 2, lakeY = minBound + 2;
    for (let dy = 0; dy < 4; dy++) {
      for (let dx = 0; dx < 5; dx++) {
        if ((dx === 0 || dx === 4) && (dy === 0 || dy === 3) && rand() < 0.5) continue;
        elements.push({ id: id++, type: 'lake_tile', gx: lakeX + dx, gy: lakeY + dy, scale: 1, variant: Math.floor(rand() * 4), animOffset: rand() * Math.PI * 2 });
      }
    }
    for (let i = 0; i < 3; i++) {
      elements.push({ id: id++, type: 'fish_spot', gx: lakeX + 1 + rand() * 3, gy: lakeY + 1 + rand() * 2, scale: 0.5 + rand() * 0.3, variant: Math.floor(rand() * 3), animOffset: rand() * Math.PI * 2 });
    }
  }

  const waterSet = new Set<string>();
  for (const el of elements) {
    if (el.type === 'lake_tile' || el.type === 'river_tile') {
      waterSet.add(`${Math.floor(el.gx)},${Math.floor(el.gy)}`);
    }
  }

  const isWater = (gx: number, gy: number) => waterSet.has(`${Math.floor(gx)},${Math.floor(gy)}`);
  const isInsideGrid = (gx: number, gy: number) => gx >= 0 && gx < gridSize && gy >= 0 && gy < gridSize;

  // Generate trees, bushes, flowers, mushrooms
  for (let y = minBound; y < maxBound; y++) {
    for (let x = minBound; x < maxBound; x++) {
      if (isInsideGrid(x, y)) continue;
      if (isWater(x, y)) continue;

      const distFromGrid = Math.max(
        Math.max(0, -x), Math.max(0, x - gridSize + 1),
        Math.max(0, -y), Math.max(0, y - gridSize + 1)
      );
      const treeDensity = 0.28 + distFromGrid * 0.07;

      if (rand() < treeDensity) {
        const type = rand() < 0.55 ? 'pine' : 'oak';
        elements.push({ id: id++, type, gx: x + rand() * 0.6 - 0.3, gy: y + rand() * 0.6 - 0.3, scale: 0.7 + rand() * 0.6, variant: Math.floor(rand() * 5), animOffset: rand() * Math.PI * 2 });
      }

      if (rand() < 0.14) {
        elements.push({ id: id++, type: 'bush', gx: x + rand() * 0.8 - 0.4, gy: y + rand() * 0.8 - 0.4, scale: 0.4 + rand() * 0.4, variant: Math.floor(rand() * 4), animOffset: rand() * Math.PI * 2 });
      }

      // Flowers (new)
      if (rand() < 0.06 && distFromGrid <= 4) {
        elements.push({ id: id++, type: 'flower', gx: x + rand() * 0.7 - 0.35, gy: y + rand() * 0.7 - 0.35, scale: 0.3 + rand() * 0.4, variant: Math.floor(rand() * 5), animOffset: rand() * Math.PI * 2 });
      }

      // Mushrooms (new)
      if (rand() < 0.03 && distFromGrid >= 3) {
        elements.push({ id: id++, type: 'mushroom', gx: x + rand() * 0.5, gy: y + rand() * 0.5, scale: 0.3 + rand() * 0.3, variant: Math.floor(rand() * 3), animOffset: rand() * Math.PI * 2 });
      }

      if (rand() < 0.08) {
        elements.push({ id: id++, type: rand() < 0.7 ? 'rock_small' : 'rock_large', gx: x + rand() * 0.5, gy: y + rand() * 0.5, scale: 0.5 + rand() * 0.5, variant: Math.floor(rand() * 3), animOffset: rand() * Math.PI * 2 });
      }

      if (rand() < 0.02 && distFromGrid >= 2) {
        elements.push({ id: id++, type: rand() < 0.5 ? 'iron_ore' : 'coal_ore', gx: x + rand() * 0.3, gy: y + rand() * 0.3, scale: 0.6 + rand() * 0.4, variant: Math.floor(rand() * 2), animOffset: rand() * Math.PI * 2 });
      }
    }
  }

  // Animals
  const animalCount = Math.floor(totalSize * 0.8);
  for (let i = 0; i < animalCount; i++) {
    const gx = minBound + rand() * totalSize;
    const gy = minBound + rand() * totalSize;
    if (isInsideGrid(Math.floor(gx), Math.floor(gy))) continue;
    if (isWater(gx, gy)) continue;
    const r = rand();
    const type: TerrainElementType = r < 0.45 ? 'sheep' : r < 0.75 ? 'rabbit' : 'deer';
    elements.push({ id: id++, type, gx, gy, scale: type === 'deer' ? 0.8 + rand() * 0.3 : 0.5 + rand() * 0.4, variant: Math.floor(rand() * 3), animOffset: rand() * Math.PI * 2 });
  }

  return elements;
}

// ====== Canvas Drawing Functions for Terrain ======

export function drawTerrainElement(ctx: CanvasRenderingContext2D, el: TerrainElement, tileW: number, tileH: number, time: number) {
  const { sx, sy } = gridToIso(el.gx, el.gy, tileW, tileH);

  switch (el.type) {
    case 'pine': drawPineTree(ctx, sx, sy, el.scale, el.variant, time + el.animOffset); break;
    case 'oak': drawOakTree(ctx, sx, sy, el.scale, el.variant, time + el.animOffset); break;
    case 'bush': drawBush(ctx, sx, sy, el.scale, el.variant, time + el.animOffset); break;
    case 'rock_small': drawRock(ctx, sx, sy, el.scale, false, el.variant); break;
    case 'rock_large': drawRock(ctx, sx, sy, el.scale, true, el.variant); break;
    case 'iron_ore': drawOre(ctx, sx, sy, el.scale, 'iron', time + el.animOffset); break;
    case 'coal_ore': drawOre(ctx, sx, sy, el.scale, 'coal', time + el.animOffset); break;
    case 'sheep': drawSheep(ctx, sx, sy, el.scale, time + el.animOffset); break;
    case 'rabbit': drawRabbit(ctx, sx, sy, el.scale, time + el.animOffset); break;
    case 'deer': drawDeer(ctx, sx, sy, el.scale, time + el.animOffset); break;
    case 'fish_spot': drawFishSpot(ctx, sx, sy, el.scale, time + el.animOffset); break;
    case 'river_tile': drawWaterTile(ctx, sx, sy, tileW, tileH, time + el.animOffset, '#3a7abd'); break;
    case 'lake_tile': drawWaterTile(ctx, sx, sy, tileW, tileH, time + el.animOffset, '#2a6aad'); break;
    case 'flower': drawFlower(ctx, sx, sy, el.scale, el.variant, time + el.animOffset); break;
    case 'mushroom': drawMushroom(ctx, sx, sy, el.scale, el.variant); break;
  }
}

// Enhanced wilderness grass tile with texture
export function drawWildernessTile(ctx: CanvasRenderingContext2D, gx: number, gy: number, tileW: number, tileH: number, gridSize: number) {
  const { sx, sy } = gridToIso(gx, gy, tileW, tileH);

  const distFromGrid = Math.max(
    Math.max(0, -gx), Math.max(0, gx - gridSize + 1),
    Math.max(0, -gy), Math.max(0, gy - gridSize + 1)
  );
  const darkness = Math.min(0.35, distFromGrid * 0.04);
  const noise = ((gx * 7 + gy * 13) % 7) - 3;
  const r = Math.max(18, 42 - darkness * 40 + noise);
  const g = Math.max(45, 85 - darkness * 50 + noise * 1.5);
  const b = Math.max(15, 35 - darkness * 25 + noise * 0.5);

  // Main tile
  ctx.beginPath();
  ctx.moveTo(sx, sy - tileH / 2);
  ctx.lineTo(sx + tileW / 2, sy);
  ctx.lineTo(sx, sy + tileH / 2);
  ctx.lineTo(sx - tileW / 2, sy);
  ctx.closePath();

  // Gradient for 3D depth
  const grad = ctx.createLinearGradient(sx - tileW / 4, sy - tileH / 2, sx + tileW / 4, sy + tileH / 2);
  grad.addColorStop(0, `rgb(${r + 8}, ${g + 12}, ${b + 5})`);
  grad.addColorStop(0.5, `rgb(${r}, ${g}, ${b})`);
  grad.addColorStop(1, `rgb(${Math.max(10, r - 10)}, ${Math.max(30, g - 15)}, ${Math.max(8, b - 8)})`);
  ctx.fillStyle = grad;
  ctx.fill();

  // Subtle grass texture lines
  if (distFromGrid < 6 && (gx + gy) % 3 === 0) {
    ctx.strokeStyle = `rgba(${r + 15}, ${g + 20}, ${b + 10}, 0.25)`;
    ctx.lineWidth = 0.3;
    ctx.beginPath();
    ctx.moveTo(sx - 4, sy);
    ctx.lineTo(sx - 2, sy - 3);
    ctx.moveTo(sx + 2, sy + 1);
    ctx.lineTo(sx + 4, sy - 2);
    ctx.stroke();
  }

  ctx.strokeStyle = `rgba(30, 55, 22, 0.2)`;
  ctx.lineWidth = 0.3;
  ctx.stroke();
}

// ====== Enhanced drawing functions ======

function drawPineTree(ctx: CanvasRenderingContext2D, sx: number, sy: number, scale: number, variant: number, time: number) {
  const sway = Math.sin(time * 1.0 + variant) * 1.2 * scale;
  const s = scale;

  // Shadow (elongated, soft)
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.beginPath();
  ctx.ellipse(sx + 3, sy + 3, 7 * s, 3 * s, 0.3, 0, Math.PI * 2);
  ctx.fill();

  // Trunk with bark texture
  const trunkGrad = ctx.createLinearGradient(sx - 2 * s, sy, sx + 2 * s, sy);
  trunkGrad.addColorStop(0, '#3a2210');
  trunkGrad.addColorStop(0.3, '#6b4420');
  trunkGrad.addColorStop(0.7, '#5a3a18');
  trunkGrad.addColorStop(1, '#2a1808');
  ctx.fillStyle = trunkGrad;
  ctx.fillRect(sx - 1.5 * s, sy - 8 * s, 3 * s, 10 * s);

  // Foliage layers (gradient triangles)
  const greens = [
    ['#0d4a1a', '#1a6e2a'], ['#126020', '#1e8030'],
    ['#187028', '#249038'], ['#1e8030', '#2aa040'],
    ['#1a6025', '#228a35'],
  ];
  for (let i = 0; i < 3; i++) {
    const ty = sy - 10 * s - i * 7 * s;
    const width = (13 - i * 3) * s;
    const pair = greens[(variant + i) % greens.length];

    ctx.beginPath();
    ctx.moveTo(sx + sway * (1 + i * 0.3), ty - 9 * s);
    ctx.lineTo(sx + width / 2, ty);
    ctx.lineTo(sx - width / 2, ty);
    ctx.closePath();

    const leafGrad = ctx.createLinearGradient(sx - width / 2, ty, sx + width / 2, ty - 8 * s);
    leafGrad.addColorStop(0, pair[0]);
    leafGrad.addColorStop(1, pair[1]);
    ctx.fillStyle = leafGrad;
    ctx.fill();

    // Snow-like highlight on top edge
    ctx.strokeStyle = `rgba(180, 220, 160, 0.15)`;
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(sx + sway * (1 + i * 0.3), ty - 9 * s);
    ctx.lineTo(sx + width / 3, ty - 3 * s);
    ctx.stroke();
  }
}

function drawOakTree(ctx: CanvasRenderingContext2D, sx: number, sy: number, scale: number, variant: number, time: number) {
  const sway = Math.sin(time * 0.7 + variant) * 1.0 * scale;
  const s = scale;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.beginPath();
  ctx.ellipse(sx + 4, sy + 3, 10 * s, 4 * s, 0.2, 0, Math.PI * 2);
  ctx.fill();

  // Trunk
  const trunkGrad = ctx.createLinearGradient(sx - 3 * s, sy, sx + 3 * s, sy);
  trunkGrad.addColorStop(0, '#3a2010');
  trunkGrad.addColorStop(0.4, '#6b4420');
  trunkGrad.addColorStop(1, '#2a1808');
  ctx.fillStyle = trunkGrad;
  ctx.fillRect(sx - 2.5 * s, sy - 6 * s, 5 * s, 8 * s);

  // Branches
  ctx.strokeStyle = '#5a3818';
  ctx.lineWidth = 1.5 * s;
  ctx.beginPath();
  ctx.moveTo(sx - 1 * s, sy - 8 * s);
  ctx.lineTo(sx - 6 * s + sway, sy - 12 * s);
  ctx.moveTo(sx + 1 * s, sy - 8 * s);
  ctx.lineTo(sx + 5 * s + sway, sy - 11 * s);
  ctx.stroke();

  // Foliage clusters (multiple overlapping circles)
  const greens = ['#1a6828', '#227a32', '#2a8a3a', '#1e7030', '#2d9440'];
  const clusters = [
    { ox: 0, oy: -14, r: 10 },
    { ox: -5, oy: -12, r: 7 },
    { ox: 5, oy: -13, r: 8 },
    { ox: -3, oy: -17, r: 6 },
    { ox: 4, oy: -16, r: 7 },
  ];
  for (let i = 0; i < clusters.length; i++) {
    const c = clusters[i];
    const grad = ctx.createRadialGradient(
      sx + c.ox * s + sway - 2, sy + c.oy * s - 2,
      0,
      sx + c.ox * s + sway, sy + c.oy * s,
      c.r * s
    );
    grad.addColorStop(0, greens[(variant + i + 1) % greens.length]);
    grad.addColorStop(1, greens[(variant + i) % greens.length]);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.arc(sx + c.ox * s + sway, sy + c.oy * s, c.r * s, 0, Math.PI * 2);
    ctx.fill();
  }

  // Light specks
  ctx.fillStyle = 'rgba(200, 255, 180, 0.12)';
  ctx.beginPath();
  ctx.arc(sx + sway - 3 * s, sy - 16 * s, 4 * s, 0, Math.PI * 2);
  ctx.fill();
}

function drawBush(ctx: CanvasRenderingContext2D, sx: number, sy: number, scale: number, variant: number, time: number) {
  const s = scale;
  const sway = Math.sin(time * 1.5 + variant) * 0.5 * s;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  ctx.beginPath();
  ctx.ellipse(sx, sy + 1, 6 * s, 2.5 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  const colors = [
    ['#2a5a28', '#3a7a3a'], ['#306030', '#4a8a4a'],
    ['#1e5020', '#2a6a2a'], ['#2d6a2d', '#3d8a3d'],
  ];
  const pair = colors[variant % colors.length];

  // Main bush body
  const grad = ctx.createRadialGradient(sx - 1 * s + sway, sy - 4 * s, 0, sx + sway, sy - 2 * s, 6 * s);
  grad.addColorStop(0, pair[1]);
  grad.addColorStop(1, pair[0]);
  ctx.fillStyle = grad;
  ctx.beginPath();
  ctx.ellipse(sx + sway, sy - 3 * s, 6 * s, 4 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  // Bump
  ctx.fillStyle = pair[1];
  ctx.beginPath();
  ctx.ellipse(sx + 2 * s + sway, sy - 5 * s, 3.5 * s, 2.5 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  // Berry dots on some bushes
  if (variant >= 2) {
    const berryColors = ['#cc3333', '#dd4444', '#bb2222'];
    for (let i = 0; i < 4; i++) {
      ctx.fillStyle = berryColors[i % berryColors.length];
      ctx.beginPath();
      ctx.arc(sx + (i - 1.5) * 2.5 * s + sway, sy - 3 * s + (i % 2) * 2 * s, 0.8 * s, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawRock(ctx: CanvasRenderingContext2D, sx: number, sy: number, scale: number, large: boolean, variant: number) {
  const s = scale;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.1)';
  ctx.beginPath();
  ctx.ellipse(sx + 2, sy + 2, (large ? 9 : 6) * s, (large ? 3.5 : 2.5) * s, 0.15, 0, Math.PI * 2);
  ctx.fill();

  if (large) {
    // Multi-faceted large rock
    const baseColors = ['#6a6a6a', '#7a7a7a', '#5a5a5a'];
    const base = baseColors[variant % baseColors.length];

    // Dark face
    ctx.beginPath();
    ctx.moveTo(sx - 7 * s, sy);
    ctx.lineTo(sx - 5 * s, sy - 9 * s);
    ctx.lineTo(sx + 3 * s, sy - 11 * s);
    ctx.lineTo(sx + 8 * s, sy - 4 * s);
    ctx.lineTo(sx + 6 * s, sy);
    ctx.closePath();
    const rockGrad = ctx.createLinearGradient(sx - 7 * s, sy, sx + 8 * s, sy - 11 * s);
    rockGrad.addColorStop(0, '#4a4a4a');
    rockGrad.addColorStop(0.5, base);
    rockGrad.addColorStop(1, '#8a8a8a');
    ctx.fillStyle = rockGrad;
    ctx.fill();

    // Highlight edge
    ctx.strokeStyle = 'rgba(255,255,255,0.1)';
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(sx - 5 * s, sy - 9 * s);
    ctx.lineTo(sx + 3 * s, sy - 11 * s);
    ctx.lineTo(sx + 8 * s, sy - 4 * s);
    ctx.stroke();

    // Moss patches
    ctx.fillStyle = 'rgba(80, 120, 60, 0.3)';
    ctx.beginPath();
    ctx.ellipse(sx - 2 * s, sy - 2 * s, 3 * s, 1.5 * s, 0, 0, Math.PI * 2);
    ctx.fill();
  } else {
    const grays = ['#7a7a7a', '#888888', '#6a6a6a'];
    const grad = ctx.createRadialGradient(sx - 1 * s, sy - 4 * s, 0, sx, sy - 2 * s, 5 * s);
    grad.addColorStop(0, '#999');
    grad.addColorStop(1, grays[variant % grays.length]);
    ctx.fillStyle = grad;
    ctx.beginPath();
    ctx.ellipse(sx, sy - 3 * s, 5 * s, 4 * s, -0.2, 0, Math.PI * 2);
    ctx.fill();

    // Specular highlight
    ctx.fillStyle = 'rgba(255,255,255,0.15)';
    ctx.beginPath();
    ctx.ellipse(sx - 1.5 * s, sy - 5 * s, 2 * s, 1.5 * s, -0.3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawOre(ctx: CanvasRenderingContext2D, sx: number, sy: number, scale: number, type: 'iron' | 'coal', time: number) {
  const s = scale;
  drawRock(ctx, sx, sy, scale, true, 0);

  // Ore vein sparkles
  const color = type === 'iron' ? '#c0a060' : '#2a2a2a';
  const glowColor = type === 'iron' ? 'rgba(255,200,80,0.4)' : 'rgba(60,60,60,0.3)';
  const spots = 5;
  for (let i = 0; i < spots; i++) {
    const ox = (Math.sin(i * 2.3) * 4) * s;
    const oy = (Math.cos(i * 1.7) * 3 - 5) * s;
    const pulse = Math.sin(time * 2 + i * 1.5) * 0.3 + 0.7;

    // Glow
    ctx.globalAlpha = pulse * 0.5;
    ctx.fillStyle = glowColor;
    ctx.beginPath();
    ctx.arc(sx + ox, sy + oy, 3 * s, 0, Math.PI * 2);
    ctx.fill();

    // Ore crystal
    ctx.globalAlpha = 1;
    ctx.fillStyle = color;
    ctx.beginPath();
    // Small crystal shape
    ctx.moveTo(sx + ox, sy + oy - 2 * s);
    ctx.lineTo(sx + ox + 1.5 * s, sy + oy);
    ctx.lineTo(sx + ox, sy + oy + 1 * s);
    ctx.lineTo(sx + ox - 1.5 * s, sy + oy);
    ctx.closePath();
    ctx.fill();

    if (type === 'iron') {
      ctx.fillStyle = 'rgba(255,240,180,0.3)';
      ctx.beginPath();
      ctx.arc(sx + ox - 0.5 * s, sy + oy - 1 * s, 0.8 * s, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawSheep(ctx: CanvasRenderingContext2D, sx: number, sy: number, scale: number, time: number) {
  const s = scale;
  const bobble = Math.sin(time * 2) * 0.6;
  const walkX = Math.sin(time * 0.5) * 3;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  ctx.beginPath();
  ctx.ellipse(sx + walkX, sy + 1, 6 * s, 2.5 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  // Legs
  ctx.strokeStyle = '#3a3a3a';
  ctx.lineWidth = 1.2 * s;
  const legPhase = Math.sin(time * 3);
  ctx.beginPath();
  ctx.moveTo(sx + walkX - 3 * s, sy - 1 * s);
  ctx.lineTo(sx + walkX - 3 * s + legPhase, sy + 1);
  ctx.moveTo(sx + walkX + 3 * s, sy - 1 * s);
  ctx.lineTo(sx + walkX + 3 * s - legPhase, sy + 1);
  ctx.stroke();

  // Fluffy body with gradient
  const bodyGrad = ctx.createRadialGradient(sx + walkX - 1, sy - 5 * s + bobble, 0, sx + walkX, sy - 4 * s + bobble, 7 * s);
  bodyGrad.addColorStop(0, '#fffef5');
  bodyGrad.addColorStop(0.7, '#f0ece0');
  bodyGrad.addColorStop(1, '#d8d4c8');
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.ellipse(sx + walkX, sy - 4 * s + bobble, 6 * s, 4.5 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  // Wool texture bumps
  ctx.fillStyle = 'rgba(255,255,255,0.3)';
  for (let i = 0; i < 4; i++) {
    const bx = sx + walkX + (i - 1.5) * 2.5 * s;
    const by = sy - 5 * s + bobble + (i % 2) * 2 * s;
    ctx.beginPath();
    ctx.arc(bx, by, 1.8 * s, 0, Math.PI * 2);
    ctx.fill();
  }

  // Head
  ctx.fillStyle = '#2a2a2a';
  ctx.beginPath();
  ctx.arc(sx + walkX + 5 * s, sy - 5 * s + bobble, 2.5 * s, 0, Math.PI * 2);
  ctx.fill();

  // Eye
  ctx.fillStyle = '#fff';
  ctx.beginPath();
  ctx.arc(sx + walkX + 6 * s, sy - 5.5 * s + bobble, 0.6 * s, 0, Math.PI * 2);
  ctx.fill();
}

function drawRabbit(ctx: CanvasRenderingContext2D, sx: number, sy: number, scale: number, time: number) {
  const s = scale;
  const hop = Math.abs(Math.sin(time * 3)) * 3;
  const walkX = Math.sin(time * 0.8) * 5;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.06)';
  ctx.beginPath();
  ctx.ellipse(sx + walkX, sy + 1, 4 * s, 1.5 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body with fur gradient
  const bodyGrad = ctx.createRadialGradient(sx + walkX, sy - 3 * s - hop, 0, sx + walkX, sy - 3 * s - hop, 4 * s);
  bodyGrad.addColorStop(0, '#b89a7a');
  bodyGrad.addColorStop(1, '#8a6a4a');
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.ellipse(sx + walkX, sy - 3 * s - hop, 3.5 * s, 2.5 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  // Tail
  ctx.fillStyle = '#d0c0a0';
  ctx.beginPath();
  ctx.arc(sx + walkX - 3 * s, sy - 3 * s - hop, 1.2 * s, 0, Math.PI * 2);
  ctx.fill();

  // Head
  const headGrad = ctx.createRadialGradient(sx + walkX + 2.5 * s, sy - 5.5 * s - hop, 0, sx + walkX + 2.5 * s, sy - 5 * s - hop, 3 * s);
  headGrad.addColorStop(0, '#b89a7a');
  headGrad.addColorStop(1, '#9a7a5a');
  ctx.fillStyle = headGrad;
  ctx.beginPath();
  ctx.arc(sx + walkX + 2.5 * s, sy - 5 * s - hop, 2 * s, 0, Math.PI * 2);
  ctx.fill();

  // Ears with inner pink
  for (const earX of [-0.5, 1]) {
    ctx.fillStyle = '#a08060';
    ctx.beginPath();
    ctx.ellipse(sx + walkX + (2 + earX) * s, sy - 8 * s - hop, 0.9 * s, 3 * s, earX * 0.3, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = 'rgba(200, 150, 140, 0.4)';
    ctx.beginPath();
    ctx.ellipse(sx + walkX + (2 + earX) * s, sy - 8 * s - hop, 0.5 * s, 2 * s, earX * 0.3, 0, Math.PI * 2);
    ctx.fill();
  }

  // Eye
  ctx.fillStyle = '#222';
  ctx.beginPath();
  ctx.arc(sx + walkX + 3.5 * s, sy - 5.3 * s - hop, 0.5 * s, 0, Math.PI * 2);
  ctx.fill();
}

function drawDeer(ctx: CanvasRenderingContext2D, sx: number, sy: number, scale: number, time: number) {
  const s = scale;
  const walkX = Math.sin(time * 0.3) * 4;
  const bobble = Math.sin(time * 1.5) * 0.5;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.1)';
  ctx.beginPath();
  ctx.ellipse(sx + walkX + 2, sy + 2, 8 * s, 3 * s, 0.15, 0, Math.PI * 2);
  ctx.fill();

  // Legs
  ctx.strokeStyle = '#6a4020';
  ctx.lineWidth = 1.5 * s;
  const legPhase = Math.sin(time * 2);
  ctx.beginPath();
  ctx.moveTo(sx + walkX - 4 * s, sy - 3 * s);
  ctx.lineTo(sx + walkX - 4 * s + legPhase, sy + 1);
  ctx.moveTo(sx + walkX - 2 * s, sy - 2.5 * s);
  ctx.lineTo(sx + walkX - 2 * s - legPhase * 0.5, sy + 1);
  ctx.moveTo(sx + walkX + 3 * s, sy - 3 * s);
  ctx.lineTo(sx + walkX + 3 * s - legPhase, sy + 1);
  ctx.moveTo(sx + walkX + 5 * s, sy - 2.5 * s);
  ctx.lineTo(sx + walkX + 5 * s + legPhase * 0.5, sy + 1);
  ctx.stroke();

  // Hooves
  ctx.fillStyle = '#3a2010';
  for (const lx of [-4, -2, 3, 5]) {
    ctx.beginPath();
    ctx.ellipse(sx + walkX + lx * s + (lx < 0 ? legPhase : -legPhase) * (Math.abs(lx) < 3 ? 0.5 : 1), sy + 1, 1 * s, 0.6 * s, 0, 0, Math.PI * 2);
    ctx.fill();
  }

  // Body with fur gradient
  const bodyGrad = ctx.createRadialGradient(sx + walkX, sy - 7 * s + bobble, 0, sx + walkX, sy - 6 * s + bobble, 8 * s);
  bodyGrad.addColorStop(0, '#a07040');
  bodyGrad.addColorStop(0.7, '#8a5830');
  bodyGrad.addColorStop(1, '#6a4020');
  ctx.fillStyle = bodyGrad;
  ctx.beginPath();
  ctx.ellipse(sx + walkX, sy - 6 * s + bobble, 7 * s, 4 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  // Belly highlight
  ctx.fillStyle = 'rgba(200, 180, 150, 0.25)';
  ctx.beginPath();
  ctx.ellipse(sx + walkX, sy - 4 * s + bobble, 5 * s, 2 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  // White spots
  ctx.fillStyle = 'rgba(255,250,230,0.2)';
  for (let i = 0; i < 5; i++) {
    ctx.beginPath();
    ctx.arc(sx + walkX + (i - 2) * 2.5 * s, sy - 7 * s + bobble + (i % 2) * 2 * s, 0.8 * s, 0, Math.PI * 2);
    ctx.fill();
  }

  // Neck + head
  ctx.fillStyle = '#7a5020';
  ctx.beginPath();
  ctx.ellipse(sx + walkX + 6 * s, sy - 10 * s + bobble, 2 * s, 3.5 * s, 0.3, 0, Math.PI * 2);
  ctx.fill();

  const headGrad = ctx.createRadialGradient(sx + walkX + 7 * s, sy - 13 * s + bobble, 0, sx + walkX + 7 * s, sy - 13 * s + bobble, 3 * s);
  headGrad.addColorStop(0, '#9a7040');
  headGrad.addColorStop(1, '#7a5020');
  ctx.fillStyle = headGrad;
  ctx.beginPath();
  ctx.arc(sx + walkX + 7 * s, sy - 13 * s + bobble, 2.5 * s, 0, Math.PI * 2);
  ctx.fill();

  // Nose
  ctx.fillStyle = '#3a2010';
  ctx.beginPath();
  ctx.ellipse(sx + walkX + 9 * s, sy - 12.5 * s + bobble, 1 * s, 0.7 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  // Eye
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.arc(sx + walkX + 8 * s, sy - 13.5 * s + bobble, 0.5 * s, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = 'rgba(255,255,255,0.5)';
  ctx.beginPath();
  ctx.arc(sx + walkX + 8.2 * s, sy - 13.7 * s + bobble, 0.2 * s, 0, Math.PI * 2);
  ctx.fill();

  // Antlers with better detail
  ctx.strokeStyle = '#4a2a08';
  ctx.lineWidth = 1.2 * s;
  ctx.lineCap = 'round';
  ctx.beginPath();
  ctx.moveTo(sx + walkX + 6.5 * s, sy - 15 * s + bobble);
  ctx.quadraticCurveTo(sx + walkX + 4 * s, sy - 18 * s + bobble, sx + walkX + 3 * s, sy - 19 * s + bobble);
  ctx.moveTo(sx + walkX + 4.5 * s, sy - 17.5 * s + bobble);
  ctx.lineTo(sx + walkX + 3 * s, sy - 18.5 * s + bobble);
  ctx.moveTo(sx + walkX + 7.5 * s, sy - 15 * s + bobble);
  ctx.quadraticCurveTo(sx + walkX + 10 * s, sy - 18 * s + bobble, sx + walkX + 11 * s, sy - 19 * s + bobble);
  ctx.moveTo(sx + walkX + 9.5 * s, sy - 17.5 * s + bobble);
  ctx.lineTo(sx + walkX + 11 * s, sy - 18.5 * s + bobble);
  ctx.stroke();
  ctx.lineCap = 'butt';
}

function drawFishSpot(ctx: CanvasRenderingContext2D, sx: number, sy: number, scale: number, time: number) {
  const s = scale;
  // Concentric ripples
  for (let r = 0; r < 3; r++) {
    const ripple = ((time * 0.8) + r * 0.7) % 2.5;
    const alpha = Math.max(0, 1 - ripple / 2.5) * 0.4;
    const radius = ripple * 5 * s;
    ctx.strokeStyle = `rgba(180, 220, 255, ${alpha})`;
    ctx.lineWidth = 0.8;
    ctx.beginPath();
    ctx.ellipse(sx, sy, radius, radius * 0.5, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Fish jump
  const jumpPhase = Math.sin(time * 0.3 + sx * 0.1);
  if (jumpPhase > 0.88) {
    const jumpY = (jumpPhase - 0.88) * 35;
    // Fish body
    ctx.fillStyle = '#607888';
    ctx.beginPath();
    ctx.ellipse(sx, sy - jumpY * s, 2.5 * s, 1.2 * s, 0.3, 0, Math.PI * 2);
    ctx.fill();
    // Tail
    ctx.beginPath();
    ctx.moveTo(sx - 2 * s, sy - jumpY * s);
    ctx.lineTo(sx - 4 * s, sy - jumpY * s - 1.5 * s);
    ctx.lineTo(sx - 4 * s, sy - jumpY * s + 1.5 * s);
    ctx.closePath();
    ctx.fill();
    // Belly
    ctx.fillStyle = 'rgba(200, 220, 230, 0.5)';
    ctx.beginPath();
    ctx.ellipse(sx, sy - jumpY * s + 0.5 * s, 2 * s, 0.6 * s, 0.3, 0, Math.PI * 2);
    ctx.fill();
    // Water splash
    ctx.fillStyle = 'rgba(200, 230, 255, 0.4)';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(sx + (i - 1) * 2 * s, sy - jumpY * s * 0.3 + 1, 0.8 * s, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawWaterTile(ctx: CanvasRenderingContext2D, sx: number, sy: number, tileW: number, tileH: number, time: number, baseColor: string) {
  ctx.beginPath();
  ctx.moveTo(sx, sy - tileH / 2);
  ctx.lineTo(sx + tileW / 2, sy);
  ctx.lineTo(sx, sy + tileH / 2);
  ctx.lineTo(sx - tileW / 2, sy);
  ctx.closePath();

  // Water gradient
  const waterGrad = ctx.createLinearGradient(sx - tileW / 4, sy - tileH / 2, sx + tileW / 4, sy + tileH / 2);
  const shimmerVal = Math.sin(time * 1.5 + sx * 0.05 + sy * 0.03) * 15;
  waterGrad.addColorStop(0, baseColor);
  waterGrad.addColorStop(0.5, `rgb(${58 + shimmerVal}, ${122 + shimmerVal}, ${189 + shimmerVal})`);
  waterGrad.addColorStop(1, baseColor);
  ctx.fillStyle = waterGrad;
  ctx.fill();

  // Specular reflections
  const specAlpha = Math.max(0, Math.sin(time * 2 + sx * 0.15) * 0.2);
  ctx.fillStyle = `rgba(200, 235, 255, ${specAlpha})`;
  ctx.fill();

  ctx.strokeStyle = 'rgba(20, 60, 120, 0.2)';
  ctx.lineWidth = 0.4;
  ctx.stroke();

  // Wave lines
  const waveAlpha = 0.15 + Math.sin(time * 1.2 + sy * 0.1) * 0.08;
  ctx.strokeStyle = `rgba(200, 235, 255, ${waveAlpha})`;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  const waveY = Math.sin(time * 2 + sx * 0.2) * 1;
  ctx.moveTo(sx - 10, sy + waveY);
  ctx.quadraticCurveTo(sx - 3, sy - 1.5 + waveY, sx + 3, sy + 0.5 + waveY);
  ctx.quadraticCurveTo(sx + 6, sy + 1.5 + waveY, sx + 10, sy + waveY);
  ctx.stroke();
}

// New: Flowers
function drawFlower(ctx: CanvasRenderingContext2D, sx: number, sy: number, scale: number, variant: number, time: number) {
  const s = scale;
  const sway = Math.sin(time * 2 + variant) * 0.8 * s;

  // Stem
  ctx.strokeStyle = '#3a7a2a';
  ctx.lineWidth = 0.8 * s;
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.quadraticCurveTo(sx + sway * 0.5, sy - 4 * s, sx + sway, sy - 7 * s);
  ctx.stroke();

  // Petals
  const petalColors = ['#e84393', '#fd79a8', '#ffeaa7', '#74b9ff', '#a29bfe'];
  const color = petalColors[variant % petalColors.length];
  const petals = 5;
  for (let i = 0; i < petals; i++) {
    const angle = (Math.PI * 2 * i) / petals + time * 0.2;
    const px = sx + sway + Math.cos(angle) * 2.5 * s;
    const py = sy - 7 * s + Math.sin(angle) * 1.5 * s;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.ellipse(px, py, 1.5 * s, 1 * s, angle, 0, Math.PI * 2);
    ctx.fill();
  }

  // Center
  ctx.fillStyle = '#fdcb6e';
  ctx.beginPath();
  ctx.arc(sx + sway, sy - 7 * s, 1 * s, 0, Math.PI * 2);
  ctx.fill();
}

// New: Mushrooms
function drawMushroom(ctx: CanvasRenderingContext2D, sx: number, sy: number, scale: number, variant: number) {
  const s = scale;

  // Stem
  ctx.fillStyle = '#e8dcc8';
  ctx.fillRect(sx - 1 * s, sy - 4 * s, 2 * s, 5 * s);

  // Cap
  const capColors = [['#c0392b', '#e74c3c'], ['#8e6d3a', '#a0804a'], ['#f39c12', '#f1c40f']];
  const pair = capColors[variant % capColors.length];
  const capGrad = ctx.createRadialGradient(sx - 1 * s, sy - 6 * s, 0, sx, sy - 5 * s, 5 * s);
  capGrad.addColorStop(0, pair[1]);
  capGrad.addColorStop(1, pair[0]);
  ctx.fillStyle = capGrad;
  ctx.beginPath();
  ctx.ellipse(sx, sy - 5 * s, 4 * s, 2.5 * s, 0, Math.PI, Math.PI * 2);
  ctx.fill();

  // Dots on red mushrooms
  if (variant === 0) {
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath();
    ctx.arc(sx - 1 * s, sy - 6 * s, 0.6 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(sx + 1.5 * s, sy - 5.5 * s, 0.5 * s, 0, Math.PI * 2);
    ctx.fill();
  }
}

export function getWildernessBorder(): number {
  return WILDERNESS_BORDER;
}

export function studentIdToSeed(studentId: string): number {
  let hash = 0;
  for (let i = 0; i < studentId.length; i++) {
    hash = ((hash << 5) - hash) + studentId.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

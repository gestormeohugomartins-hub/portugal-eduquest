// ====== Procedural Terrain Generation ======
// Optimized: NO gradients, flat colors only for 30fps performance

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

const WILDERNESS_BORDER = 5;

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

  // Water
  if (hasCoast) {
    for (let i = minBound; i < maxBound; i++) {
      for (let depth = 0; depth < 3; depth++) {
        elements.push({ id: id++, type: 'lake_tile', gx: i, gy: maxBound - 1 - depth, scale: 1, variant: Math.floor(rand() * 4), animOffset: rand() * Math.PI * 2 });
      }
      if (rand() < 0.12) {
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
      if (rand() < 0.08 && (i < 0 || i >= gridSize)) {
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
    for (let i = 0; i < 2; i++) {
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

  // Trees, bushes — reduced density
  for (let y = minBound; y < maxBound; y++) {
    for (let x = minBound; x < maxBound; x++) {
      if (isInsideGrid(x, y)) continue;
      if (isWater(x, y)) continue;

      const distFromGrid = Math.max(
        Math.max(0, -x), Math.max(0, x - gridSize + 1),
        Math.max(0, -y), Math.max(0, y - gridSize + 1)
      );
      const treeDensity = 0.22 + distFromGrid * 0.06;

      if (rand() < treeDensity) {
        const type = rand() < 0.55 ? 'pine' : 'oak';
        elements.push({ id: id++, type, gx: x + rand() * 0.6 - 0.3, gy: y + rand() * 0.6 - 0.3, scale: 0.7 + rand() * 0.5, variant: Math.floor(rand() * 5), animOffset: rand() * Math.PI * 2 });
      }

      if (rand() < 0.1) {
        elements.push({ id: id++, type: 'bush', gx: x + rand() * 0.8 - 0.4, gy: y + rand() * 0.8 - 0.4, scale: 0.4 + rand() * 0.4, variant: Math.floor(rand() * 4), animOffset: rand() * Math.PI * 2 });
      }

      if (rand() < 0.04 && distFromGrid <= 3) {
        elements.push({ id: id++, type: 'flower', gx: x + rand() * 0.7 - 0.35, gy: y + rand() * 0.7 - 0.35, scale: 0.3 + rand() * 0.4, variant: Math.floor(rand() * 5), animOffset: rand() * Math.PI * 2 });
      }

      if (rand() < 0.06) {
        elements.push({ id: id++, type: rand() < 0.7 ? 'rock_small' : 'rock_large', gx: x + rand() * 0.5, gy: y + rand() * 0.5, scale: 0.5 + rand() * 0.5, variant: Math.floor(rand() * 3), animOffset: rand() * Math.PI * 2 });
      }

      if (rand() < 0.015 && distFromGrid >= 2) {
        elements.push({ id: id++, type: rand() < 0.5 ? 'iron_ore' : 'coal_ore', gx: x + rand() * 0.3, gy: y + rand() * 0.3, scale: 0.6 + rand() * 0.4, variant: Math.floor(rand() * 2), animOffset: rand() * Math.PI * 2 });
      }
    }
  }

  // Animals — reduced count
  const animalCount = Math.floor(totalSize * 0.5);
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

// ====== Canvas Drawing — ALL FLAT COLORS, NO GRADIENTS ======

export function drawTerrainElement(ctx: CanvasRenderingContext2D, el: TerrainElement, tileW: number, tileH: number, time: number) {
  const { sx, sy } = gridToIso(el.gx, el.gy, tileW, tileH);

  switch (el.type) {
    case 'pine': drawPineTree(ctx, sx, sy, el.scale, el.variant, time + el.animOffset); break;
    case 'oak': drawOakTree(ctx, sx, sy, el.scale, el.variant, time + el.animOffset); break;
    case 'bush': drawBush(ctx, sx, sy, el.scale, el.variant); break;
    case 'rock_small': drawRock(ctx, sx, sy, el.scale, false); break;
    case 'rock_large': drawRock(ctx, sx, sy, el.scale, true); break;
    case 'iron_ore': drawOre(ctx, sx, sy, el.scale, 'iron'); break;
    case 'coal_ore': drawOre(ctx, sx, sy, el.scale, 'coal'); break;
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

// Wilderness tile — flat color
export function drawWildernessTile(ctx: CanvasRenderingContext2D, gx: number, gy: number, tileW: number, tileH: number, gridSize: number) {
  const { sx, sy } = gridToIso(gx, gy, tileW, tileH);

  const distFromGrid = Math.max(
    Math.max(0, -gx), Math.max(0, gx - gridSize + 1),
    Math.max(0, -gy), Math.max(0, gy - gridSize + 1)
  );
  const darkness = Math.min(0.35, distFromGrid * 0.05);
  const noise = ((gx * 7 + gy * 13) % 5) - 2;
  const r = Math.max(18, Math.floor(42 - darkness * 40 + noise));
  const g = Math.max(45, Math.floor(85 - darkness * 50 + noise));
  const b = Math.max(15, Math.floor(35 - darkness * 25));

  ctx.beginPath();
  ctx.moveTo(sx, sy - tileH / 2);
  ctx.lineTo(sx + tileW / 2, sy);
  ctx.lineTo(sx, sy + tileH / 2);
  ctx.lineTo(sx - tileW / 2, sy);
  ctx.closePath();
  ctx.fillStyle = `rgb(${r},${g},${b})`;
  ctx.fill();
}

// ====== Simplified drawing — NO gradients ======

function drawPineTree(ctx: CanvasRenderingContext2D, sx: number, sy: number, scale: number, variant: number, time: number) {
  const sway = Math.sin(time * 0.8) * 0.8 * scale;
  const s = scale;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.1)';
  ctx.beginPath();
  ctx.ellipse(sx + 2, sy + 2, 6 * s, 2.5 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  // Trunk
  ctx.fillStyle = '#5a3a18';
  ctx.fillRect(sx - 1.5 * s, sy - 8 * s, 3 * s, 10 * s);

  // Foliage layers — flat triangles
  const greens = ['#1a5a25', '#1e6e2a', '#22802e', '#1a6028', '#187028'];
  for (let i = 0; i < 3; i++) {
    const ty = sy - 10 * s - i * 6 * s;
    const width = (12 - i * 3) * s;
    ctx.fillStyle = greens[(variant + i) % greens.length];
    ctx.beginPath();
    ctx.moveTo(sx + sway * (1 + i * 0.2), ty - 8 * s);
    ctx.lineTo(sx + width / 2, ty);
    ctx.lineTo(sx - width / 2, ty);
    ctx.closePath();
    ctx.fill();
  }
}

function drawOakTree(ctx: CanvasRenderingContext2D, sx: number, sy: number, scale: number, variant: number, time: number) {
  const sway = Math.sin(time * 0.6) * 0.7 * scale;
  const s = scale;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.1)';
  ctx.beginPath();
  ctx.ellipse(sx + 3, sy + 2, 8 * s, 3 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  // Trunk
  ctx.fillStyle = '#5a3818';
  ctx.fillRect(sx - 2 * s, sy - 6 * s, 4 * s, 8 * s);

  // Foliage — overlapping circles, flat
  const greens = ['#1a6828', '#227a32', '#2a8a3a', '#1e7030'];
  const clusters = [
    { ox: 0, oy: -13, r: 9 },
    { ox: -4, oy: -11, r: 6 },
    { ox: 4, oy: -12, r: 7 },
    { ox: -2, oy: -16, r: 5 },
    { ox: 3, oy: -15, r: 6 },
  ];
  for (let i = 0; i < clusters.length; i++) {
    const c = clusters[i];
    ctx.fillStyle = greens[(variant + i) % greens.length];
    ctx.beginPath();
    ctx.arc(sx + c.ox * s + sway, sy + c.oy * s, c.r * s, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawBush(ctx: CanvasRenderingContext2D, sx: number, sy: number, scale: number, variant: number) {
  const s = scale;
  const colors = ['#2a5a28', '#306030', '#1e5020', '#2d6a2d'];
  ctx.fillStyle = colors[variant % colors.length];
  ctx.beginPath();
  ctx.ellipse(sx, sy - 3 * s, 5 * s, 3.5 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  // Berry dots
  if (variant >= 2) {
    ctx.fillStyle = '#cc3333';
    for (let i = 0; i < 3; i++) {
      ctx.beginPath();
      ctx.arc(sx + (i - 1) * 2.5 * s, sy - 3 * s + (i % 2) * 1.5 * s, 0.7 * s, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawRock(ctx: CanvasRenderingContext2D, sx: number, sy: number, scale: number, large: boolean) {
  const s = scale;
  if (large) {
    ctx.fillStyle = '#6a6a6a';
    ctx.beginPath();
    ctx.moveTo(sx - 6 * s, sy);
    ctx.lineTo(sx - 4 * s, sy - 8 * s);
    ctx.lineTo(sx + 3 * s, sy - 9 * s);
    ctx.lineTo(sx + 7 * s, sy - 3 * s);
    ctx.lineTo(sx + 5 * s, sy);
    ctx.closePath();
    ctx.fill();
    // Highlight edge
    ctx.fillStyle = '#7a7a7a';
    ctx.beginPath();
    ctx.moveTo(sx - 4 * s, sy - 8 * s);
    ctx.lineTo(sx + 3 * s, sy - 9 * s);
    ctx.lineTo(sx + 7 * s, sy - 3 * s);
    ctx.lineTo(sx + 1 * s, sy - 5 * s);
    ctx.closePath();
    ctx.fill();
  } else {
    ctx.fillStyle = '#7a7a7a';
    ctx.beginPath();
    ctx.ellipse(sx, sy - 2.5 * s, 4 * s, 3 * s, -0.2, 0, Math.PI * 2);
    ctx.fill();
    ctx.fillStyle = '#8a8a8a';
    ctx.beginPath();
    ctx.ellipse(sx - 1 * s, sy - 4 * s, 2 * s, 1.5 * s, -0.3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawOre(ctx: CanvasRenderingContext2D, sx: number, sy: number, scale: number, type: 'iron' | 'coal') {
  const s = scale;
  drawRock(ctx, sx, sy, scale, true);
  const color = type === 'iron' ? '#c0a060' : '#2a2a2a';
  for (let i = 0; i < 4; i++) {
    const ox = (Math.sin(i * 2.3) * 3.5) * s;
    const oy = (Math.cos(i * 1.7) * 2.5 - 5) * s;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.moveTo(sx + ox, sy + oy - 1.5 * s);
    ctx.lineTo(sx + ox + 1.2 * s, sy + oy);
    ctx.lineTo(sx + ox, sy + oy + 0.8 * s);
    ctx.lineTo(sx + ox - 1.2 * s, sy + oy);
    ctx.closePath();
    ctx.fill();
  }
}

function drawSheep(ctx: CanvasRenderingContext2D, sx: number, sy: number, scale: number, time: number) {
  const s = scale;
  const bobble = Math.sin(time * 1.5) * 0.5;
  const walkX = Math.sin(time * 0.4) * 2;

  // Legs
  ctx.strokeStyle = '#3a3a3a';
  ctx.lineWidth = 1 * s;
  ctx.beginPath();
  ctx.moveTo(sx + walkX - 3 * s, sy - 1 * s);
  ctx.lineTo(sx + walkX - 3 * s, sy + 1);
  ctx.moveTo(sx + walkX + 3 * s, sy - 1 * s);
  ctx.lineTo(sx + walkX + 3 * s, sy + 1);
  ctx.stroke();

  // Body
  ctx.fillStyle = '#f0ece0';
  ctx.beginPath();
  ctx.ellipse(sx + walkX, sy - 4 * s + bobble, 5 * s, 3.5 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  // Head
  ctx.fillStyle = '#2a2a2a';
  ctx.beginPath();
  ctx.arc(sx + walkX + 4 * s, sy - 4.5 * s + bobble, 2 * s, 0, Math.PI * 2);
  ctx.fill();
}

function drawRabbit(ctx: CanvasRenderingContext2D, sx: number, sy: number, scale: number, time: number) {
  const s = scale;
  const hop = Math.abs(Math.sin(time * 2.5)) * 2;
  const walkX = Math.sin(time * 0.7) * 3;

  // Body
  ctx.fillStyle = '#a08060';
  ctx.beginPath();
  ctx.ellipse(sx + walkX, sy - 3 * s - hop, 3 * s, 2 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  // Head
  ctx.fillStyle = '#a08060';
  ctx.beginPath();
  ctx.arc(sx + walkX + 2 * s, sy - 4.5 * s - hop, 1.8 * s, 0, Math.PI * 2);
  ctx.fill();

  // Ears
  ctx.fillStyle = '#906a4a';
  ctx.beginPath();
  ctx.ellipse(sx + walkX + 1.5 * s, sy - 7 * s - hop, 0.7 * s, 2.5 * s, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(sx + walkX + 2.8 * s, sy - 7 * s - hop, 0.7 * s, 2.5 * s, 0.2, 0, Math.PI * 2);
  ctx.fill();

  // Tail
  ctx.fillStyle = '#d0c0a0';
  ctx.beginPath();
  ctx.arc(sx + walkX - 2.5 * s, sy - 3 * s - hop, 1 * s, 0, Math.PI * 2);
  ctx.fill();
}

function drawDeer(ctx: CanvasRenderingContext2D, sx: number, sy: number, scale: number, time: number) {
  const s = scale;
  const walkX = Math.sin(time * 0.25) * 3;
  const bobble = Math.sin(time * 1.2) * 0.4;

  // Legs
  ctx.strokeStyle = '#6a4020';
  ctx.lineWidth = 1.2 * s;
  ctx.beginPath();
  ctx.moveTo(sx + walkX - 3 * s, sy - 3 * s);
  ctx.lineTo(sx + walkX - 3 * s, sy + 1);
  ctx.moveTo(sx + walkX + 3 * s, sy - 3 * s);
  ctx.lineTo(sx + walkX + 3 * s, sy + 1);
  ctx.moveTo(sx + walkX - 1 * s, sy - 3 * s);
  ctx.lineTo(sx + walkX - 1 * s, sy + 1);
  ctx.moveTo(sx + walkX + 4.5 * s, sy - 3 * s);
  ctx.lineTo(sx + walkX + 4.5 * s, sy + 1);
  ctx.stroke();

  // Body
  ctx.fillStyle = '#8a5830';
  ctx.beginPath();
  ctx.ellipse(sx + walkX, sy - 6 * s + bobble, 6 * s, 3.5 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  // Neck + head
  ctx.fillStyle = '#7a5020';
  ctx.beginPath();
  ctx.ellipse(sx + walkX + 5 * s, sy - 9 * s + bobble, 1.5 * s, 3 * s, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#8a6030';
  ctx.beginPath();
  ctx.arc(sx + walkX + 6 * s, sy - 12 * s + bobble, 2 * s, 0, Math.PI * 2);
  ctx.fill();

  // Eye
  ctx.fillStyle = '#1a1a1a';
  ctx.beginPath();
  ctx.arc(sx + walkX + 7 * s, sy - 12.5 * s + bobble, 0.4 * s, 0, Math.PI * 2);
  ctx.fill();

  // Antlers
  ctx.strokeStyle = '#4a2a08';
  ctx.lineWidth = 1 * s;
  ctx.beginPath();
  ctx.moveTo(sx + walkX + 5.5 * s, sy - 14 * s + bobble);
  ctx.lineTo(sx + walkX + 3.5 * s, sy - 17 * s + bobble);
  ctx.moveTo(sx + walkX + 4.2 * s, sy - 16 * s + bobble);
  ctx.lineTo(sx + walkX + 3 * s, sy - 17 * s + bobble);
  ctx.moveTo(sx + walkX + 6.5 * s, sy - 14 * s + bobble);
  ctx.lineTo(sx + walkX + 8.5 * s, sy - 17 * s + bobble);
  ctx.moveTo(sx + walkX + 8 * s, sy - 16 * s + bobble);
  ctx.lineTo(sx + walkX + 9 * s, sy - 17 * s + bobble);
  ctx.stroke();
}

function drawFishSpot(ctx: CanvasRenderingContext2D, sx: number, sy: number, scale: number, time: number) {
  const s = scale;
  // Simple ripple
  const ripple = (time * 0.8) % 2.5;
  const alpha = Math.max(0, 1 - ripple / 2.5) * 0.35;
  const radius = ripple * 4 * s;
  ctx.strokeStyle = `rgba(180, 220, 255, ${alpha})`;
  ctx.lineWidth = 0.7;
  ctx.beginPath();
  ctx.ellipse(sx, sy, radius, radius * 0.5, 0, 0, Math.PI * 2);
  ctx.stroke();
}

function drawWaterTile(ctx: CanvasRenderingContext2D, sx: number, sy: number, tileW: number, tileH: number, time: number, baseColor: string) {
  ctx.beginPath();
  ctx.moveTo(sx, sy - tileH / 2);
  ctx.lineTo(sx + tileW / 2, sy);
  ctx.lineTo(sx, sy + tileH / 2);
  ctx.lineTo(sx - tileW / 2, sy);
  ctx.closePath();

  // Flat water with subtle shimmer via alternating between 2 colors
  const shimmer = Math.sin(time * 1.2 + sx * 0.04) > 0;
  ctx.fillStyle = shimmer ? baseColor : (baseColor === '#3a7abd' ? '#3570ab' : '#2560a0');
  ctx.fill();

  ctx.strokeStyle = 'rgba(20, 60, 120, 0.15)';
  ctx.lineWidth = 0.3;
  ctx.stroke();
}

function drawFlower(ctx: CanvasRenderingContext2D, sx: number, sy: number, scale: number, variant: number, time: number) {
  const s = scale;
  const sway = Math.sin(time * 1.5 + variant) * 0.6 * s;

  // Stem
  ctx.strokeStyle = '#3a7a2a';
  ctx.lineWidth = 0.7 * s;
  ctx.beginPath();
  ctx.moveTo(sx, sy);
  ctx.lineTo(sx + sway, sy - 6 * s);
  ctx.stroke();

  // Flower head
  const colors = ['#e84393', '#fd79a8', '#ffeaa7', '#74b9ff', '#a29bfe'];
  ctx.fillStyle = colors[variant % colors.length];
  ctx.beginPath();
  ctx.arc(sx + sway, sy - 6 * s, 2 * s, 0, Math.PI * 2);
  ctx.fill();

  // Center
  ctx.fillStyle = '#fdcb6e';
  ctx.beginPath();
  ctx.arc(sx + sway, sy - 6 * s, 0.8 * s, 0, Math.PI * 2);
  ctx.fill();
}

function drawMushroom(ctx: CanvasRenderingContext2D, sx: number, sy: number, scale: number, variant: number) {
  const s = scale;
  // Stem
  ctx.fillStyle = '#e8dcc8';
  ctx.fillRect(sx - 1 * s, sy - 4 * s, 2 * s, 5 * s);
  // Cap
  const capColors = ['#c0392b', '#8e6d3a', '#f39c12'];
  ctx.fillStyle = capColors[variant % capColors.length];
  ctx.beginPath();
  ctx.ellipse(sx, sy - 5 * s, 3.5 * s, 2 * s, 0, Math.PI, Math.PI * 2);
  ctx.fill();
  // Dots on red
  if (variant === 0) {
    ctx.fillStyle = 'rgba(255,255,255,0.7)';
    ctx.beginPath();
    ctx.arc(sx - 1 * s, sy - 5.5 * s, 0.5 * s, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(sx + 1.2 * s, sy - 5 * s, 0.4 * s, 0, Math.PI * 2);
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

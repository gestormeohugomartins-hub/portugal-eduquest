// ====== Procedural Terrain Generation ======
// Generates decorative elements (trees, rocks, animals) around the village grid

import { TILE_W, TILE_H } from './gameTypes';
import { gridToIso } from './gridLogic';

export type TerrainElementType = 'pine' | 'oak' | 'bush' | 'rock_small' | 'rock_large' | 'iron_ore' | 'coal_ore' | 'sheep' | 'rabbit' | 'deer' | 'fish_spot' | 'river_tile' | 'lake_tile';

export interface TerrainElement {
  id: number;
  type: TerrainElementType;
  gx: number; // grid x (can be fractional, outside village bounds)
  gy: number;
  scale: number;
  variant: number; // visual variant seed
  animOffset: number; // animation phase offset
}

export interface TerrainConfig {
  district?: string | null;
  gridSize: number;
  seed: number; // deterministic seed from student id
}

// Simple seeded random
function seededRandom(seed: number): () => number {
  let s = seed;
  return () => {
    s = (s * 16807 + 0) % 2147483647;
    return (s - 1) / 2147483646;
  };
}

// Districts with water features
const COASTAL_DISTRICTS = ['lisboa', 'porto', 'faro', 'setubal', 'aveiro', 'leiria', 'viana_castelo', 'acores', 'madeira'];
const RIVER_DISTRICTS = ['santarem', 'coimbra', 'portalegre', 'evora', 'castelo_branco', 'vila_real'];
const LAKE_DISTRICTS = ['braganca', 'guarda', 'viseu', 'braga', 'beja'];

// How many tiles of "wilderness" surround the grid
const WILDERNESS_BORDER = 6;

export function generateTerrain(config: TerrainConfig): TerrainElement[] {
  const { district, gridSize, seed } = config;
  const rand = seededRandom(seed);
  const elements: TerrainElement[] = [];
  let id = 0;

  const totalSize = gridSize + WILDERNESS_BORDER * 2;
  const minBound = -WILDERNESS_BORDER;
  const maxBound = gridSize + WILDERNESS_BORDER;

  // Determine water features based on district
  const hasCoast = district ? COASTAL_DISTRICTS.includes(district) : false;
  const hasRiver = district ? RIVER_DISTRICTS.includes(district) : false;
  const hasLake = district ? LAKE_DISTRICTS.includes(district) : false;

  // Generate water tiles (river or coast on one edge)
  if (hasCoast) {
    // Coast on the south-east edge
    for (let i = minBound; i < maxBound; i++) {
      for (let depth = 0; depth < 3; depth++) {
        elements.push({
          id: id++, type: 'lake_tile',
          gx: i, gy: maxBound - 1 - depth,
          scale: 1, variant: Math.floor(rand() * 4),
          animOffset: rand() * Math.PI * 2,
        });
      }
      // Fish spots
      if (rand() < 0.15) {
        elements.push({
          id: id++, type: 'fish_spot',
          gx: i + rand() * 0.5, gy: maxBound - 2 + rand(),
          scale: 0.6 + rand() * 0.4, variant: Math.floor(rand() * 3),
          animOffset: rand() * Math.PI * 2,
        });
      }
    }
  }

  if (hasRiver) {
    // River flowing diagonally from top-left corner to bottom-right
    for (let i = minBound; i < maxBound; i++) {
      const riverY = minBound + Math.floor((i - minBound) * 0.7) + Math.floor(rand() * 2) - 1;
      if (riverY >= minBound && riverY < maxBound) {
        // Only place river tiles outside the village grid
        if (i < 0 || i >= gridSize || riverY < 0 || riverY >= gridSize) {
          elements.push({
            id: id++, type: 'river_tile',
            gx: i, gy: riverY,
            scale: 1, variant: Math.floor(rand() * 4),
            animOffset: rand() * Math.PI * 2,
          });
          elements.push({
            id: id++, type: 'river_tile',
            gx: i, gy: riverY + 1,
            scale: 1, variant: Math.floor(rand() * 4),
            animOffset: rand() * Math.PI * 2,
          });
        }
      }
      if (rand() < 0.1 && (i < 0 || i >= gridSize)) {
        elements.push({
          id: id++, type: 'fish_spot',
          gx: i + 0.5, gy: riverY + 0.5,
          scale: 0.5 + rand() * 0.4, variant: Math.floor(rand() * 3),
          animOffset: rand() * Math.PI * 2,
        });
      }
    }
  }

  if (hasLake) {
    // Lake cluster in one corner
    const lakeX = minBound + 2;
    const lakeY = minBound + 2;
    for (let dy = 0; dy < 4; dy++) {
      for (let dx = 0; dx < 5; dx++) {
        if ((dx === 0 || dx === 4) && (dy === 0 || dy === 3) && rand() < 0.5) continue; // irregular shape
        elements.push({
          id: id++, type: 'lake_tile',
          gx: lakeX + dx, gy: lakeY + dy,
          scale: 1, variant: Math.floor(rand() * 4),
          animOffset: rand() * Math.PI * 2,
        });
      }
    }
    // Fish spots in lake
    for (let i = 0; i < 3; i++) {
      elements.push({
        id: id++, type: 'fish_spot',
        gx: lakeX + 1 + rand() * 3, gy: lakeY + 1 + rand() * 2,
        scale: 0.5 + rand() * 0.3, variant: Math.floor(rand() * 3),
        animOffset: rand() * Math.PI * 2,
      });
    }
  }

  // Collect water tile positions for exclusion
  const waterSet = new Set<string>();
  for (const el of elements) {
    if (el.type === 'lake_tile' || el.type === 'river_tile') {
      waterSet.add(`${Math.floor(el.gx)},${Math.floor(el.gy)}`);
    }
  }

  const isWater = (gx: number, gy: number) => waterSet.has(`${Math.floor(gx)},${Math.floor(gy)}`);
  const isInsideGrid = (gx: number, gy: number) => gx >= 0 && gx < gridSize && gy >= 0 && gy < gridSize;

  // Generate trees
  for (let y = minBound; y < maxBound; y++) {
    for (let x = minBound; x < maxBound; x++) {
      if (isInsideGrid(x, y)) continue;
      if (isWater(x, y)) continue;

      // Tree density: higher further from grid
      const distFromGrid = Math.max(
        Math.max(0, -x), Math.max(0, x - gridSize + 1),
        Math.max(0, -y), Math.max(0, y - gridSize + 1)
      );
      const treeDensity = 0.25 + distFromGrid * 0.08;

      if (rand() < treeDensity) {
        const type = rand() < 0.6 ? 'pine' : 'oak';
        elements.push({
          id: id++, type,
          gx: x + rand() * 0.6 - 0.3, gy: y + rand() * 0.6 - 0.3,
          scale: 0.7 + rand() * 0.6,
          variant: Math.floor(rand() * 4),
          animOffset: rand() * Math.PI * 2,
        });
      }

      // Bushes (small vegetation)
      if (rand() < 0.12) {
        elements.push({
          id: id++, type: 'bush',
          gx: x + rand() * 0.8 - 0.4, gy: y + rand() * 0.8 - 0.4,
          scale: 0.4 + rand() * 0.4,
          variant: Math.floor(rand() * 3),
          animOffset: rand() * Math.PI * 2,
        });
      }

      // Rocks
      if (rand() < 0.08) {
        const rockType = rand() < 0.7 ? 'rock_small' : 'rock_large';
        elements.push({
          id: id++, type: rockType,
          gx: x + rand() * 0.5, gy: y + rand() * 0.5,
          scale: 0.5 + rand() * 0.5,
          variant: Math.floor(rand() * 3),
          animOffset: rand() * Math.PI * 2,
        });
      }

      // Ore deposits (rarer)
      if (rand() < 0.02 && distFromGrid >= 2) {
        elements.push({
          id: id++, type: rand() < 0.5 ? 'iron_ore' : 'coal_ore',
          gx: x + rand() * 0.3, gy: y + rand() * 0.3,
          scale: 0.6 + rand() * 0.4,
          variant: Math.floor(rand() * 2),
          animOffset: rand() * Math.PI * 2,
        });
      }
    }
  }

  // Animals (fewer, wandering in wilderness)
  const animalCount = Math.floor(totalSize * 0.8);
  for (let i = 0; i < animalCount; i++) {
    const gx = minBound + rand() * totalSize;
    const gy = minBound + rand() * totalSize;
    if (isInsideGrid(Math.floor(gx), Math.floor(gy))) continue;
    if (isWater(gx, gy)) continue;

    const r = rand();
    const type: TerrainElementType = r < 0.45 ? 'sheep' : r < 0.75 ? 'rabbit' : 'deer';
    elements.push({
      id: id++, type,
      gx, gy,
      scale: type === 'deer' ? 0.8 + rand() * 0.3 : 0.5 + rand() * 0.4,
      variant: Math.floor(rand() * 3),
      animOffset: rand() * Math.PI * 2,
    });
  }

  return elements;
}

// ====== Canvas Drawing Functions for Terrain ======

export function drawTerrainElement(
  ctx: CanvasRenderingContext2D,
  el: TerrainElement,
  tileW: number,
  tileH: number,
  time: number,
) {
  const { sx, sy } = gridToIso(el.gx, el.gy, tileW, tileH);

  switch (el.type) {
    case 'pine': drawPineTree(ctx, sx, sy, el.scale, el.variant, time + el.animOffset); break;
    case 'oak': drawOakTree(ctx, sx, sy, el.scale, el.variant, time + el.animOffset); break;
    case 'bush': drawBush(ctx, sx, sy, el.scale, el.variant); break;
    case 'rock_small': drawRock(ctx, sx, sy, el.scale, false, el.variant); break;
    case 'rock_large': drawRock(ctx, sx, sy, el.scale, true, el.variant); break;
    case 'iron_ore': drawOre(ctx, sx, sy, el.scale, 'iron'); break;
    case 'coal_ore': drawOre(ctx, sx, sy, el.scale, 'coal'); break;
    case 'sheep': drawSheep(ctx, sx, sy, el.scale, time + el.animOffset); break;
    case 'rabbit': drawRabbit(ctx, sx, sy, el.scale, time + el.animOffset); break;
    case 'deer': drawDeer(ctx, sx, sy, el.scale, time + el.animOffset); break;
    case 'fish_spot': drawFishSpot(ctx, sx, sy, el.scale, time + el.animOffset); break;
    case 'river_tile': drawWaterTile(ctx, sx, sy, tileW, tileH, time + el.animOffset, '#3a7abd'); break;
    case 'lake_tile': drawWaterTile(ctx, sx, sy, tileW, tileH, time + el.animOffset, '#2a6aad'); break;
  }
}

// Draw wilderness grass tile (darker, varied)
export function drawWildernessTile(
  ctx: CanvasRenderingContext2D,
  gx: number, gy: number,
  tileW: number, tileH: number,
  gridSize: number,
) {
  const { sx, sy } = gridToIso(gx, gy, tileW, tileH);

  // Darker grass outside village
  const distFromGrid = Math.max(
    Math.max(0, -gx), Math.max(0, gx - gridSize + 1),
    Math.max(0, -gy), Math.max(0, gy - gridSize + 1)
  );
  const darkness = Math.min(0.4, distFromGrid * 0.06);
  const baseGreen = [58, 100, 50]; // darker wilderness green
  const r = baseGreen[0] - darkness * 30 + ((gx * 7 + gy * 13) % 5);
  const g = baseGreen[1] - darkness * 40 + ((gx * 3 + gy * 11) % 8);
  const b = baseGreen[2] - darkness * 20 + ((gx * 5 + gy * 9) % 4);

  ctx.beginPath();
  ctx.moveTo(sx, sy - tileH / 2);
  ctx.lineTo(sx + tileW / 2, sy);
  ctx.lineTo(sx, sy + tileH / 2);
  ctx.lineTo(sx - tileW / 2, sy);
  ctx.closePath();
  ctx.fillStyle = `rgb(${Math.max(20, r)}, ${Math.max(50, g)}, ${Math.max(20, b)})`;
  ctx.fill();
  ctx.strokeStyle = `rgba(30, 60, 25, 0.3)`;
  ctx.lineWidth = 0.5;
  ctx.stroke();
}

// ====== Individual drawing functions ======

function drawPineTree(ctx: CanvasRenderingContext2D, sx: number, sy: number, scale: number, variant: number, time: number) {
  const sway = Math.sin(time * 1.2) * 1.5 * scale;
  const s = scale;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.beginPath();
  ctx.ellipse(sx, sy + 2, 6 * s, 3 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  // Trunk
  ctx.fillStyle = '#5a3a1a';
  ctx.fillRect(sx - 1.5 * s, sy - 8 * s, 3 * s, 10 * s);

  // Foliage layers (triangles)
  const greens = ['#1a5c2a', '#1e6e32', '#227a38', '#268640'];
  for (let i = 0; i < 3; i++) {
    const ty = sy - 10 * s - i * 7 * s;
    const width = (12 - i * 3) * s;
    ctx.fillStyle = greens[(variant + i) % greens.length];
    ctx.beginPath();
    ctx.moveTo(sx + sway * (1 + i * 0.3), ty - 8 * s);
    ctx.lineTo(sx + width / 2, ty);
    ctx.lineTo(sx - width / 2, ty);
    ctx.closePath();
    ctx.fill();
  }
}

function drawOakTree(ctx: CanvasRenderingContext2D, sx: number, sy: number, scale: number, variant: number, time: number) {
  const sway = Math.sin(time * 0.8 + variant) * 1.2 * scale;
  const s = scale;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.15)';
  ctx.beginPath();
  ctx.ellipse(sx, sy + 2, 8 * s, 4 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  // Trunk
  ctx.fillStyle = '#6b4420';
  ctx.fillRect(sx - 2 * s, sy - 6 * s, 4 * s, 8 * s);

  // Round foliage
  const greens = ['#2d7a3a', '#358a42', '#3d9a4a'];
  ctx.fillStyle = greens[variant % greens.length];
  ctx.beginPath();
  ctx.arc(sx + sway, sy - 14 * s, 9 * s, 0, Math.PI * 2);
  ctx.fill();
  // Highlight
  ctx.fillStyle = greens[(variant + 1) % greens.length];
  ctx.beginPath();
  ctx.arc(sx + sway - 2 * s, sy - 16 * s, 5 * s, 0, Math.PI * 2);
  ctx.fill();
}

function drawBush(ctx: CanvasRenderingContext2D, sx: number, sy: number, scale: number, variant: number) {
  const s = scale;
  const colors = ['#3a7a3a', '#4a8a4a', '#2a6a2a'];
  ctx.fillStyle = colors[variant % colors.length];
  ctx.beginPath();
  ctx.ellipse(sx, sy - 3 * s, 5 * s, 4 * s, 0, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = colors[(variant + 1) % colors.length];
  ctx.beginPath();
  ctx.ellipse(sx + 2 * s, sy - 4 * s, 3 * s, 2.5 * s, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawRock(ctx: CanvasRenderingContext2D, sx: number, sy: number, scale: number, large: boolean, variant: number) {
  const s = scale;
  const grays = ['#7a7a7a', '#8a8a8a', '#6a6a6a'];
  
  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.1)';
  ctx.beginPath();
  ctx.ellipse(sx, sy + 1, (large ? 8 : 5) * s, (large ? 3 : 2) * s, 0, 0, Math.PI * 2);
  ctx.fill();

  // Rock body
  ctx.fillStyle = grays[variant % grays.length];
  ctx.beginPath();
  if (large) {
    ctx.moveTo(sx - 7 * s, sy);
    ctx.lineTo(sx - 5 * s, sy - 8 * s);
    ctx.lineTo(sx + 3 * s, sy - 10 * s);
    ctx.lineTo(sx + 8 * s, sy - 4 * s);
    ctx.lineTo(sx + 6 * s, sy);
    ctx.closePath();
  } else {
    ctx.ellipse(sx, sy - 3 * s, 5 * s, 4 * s, -0.2, 0, Math.PI * 2);
  }
  ctx.fill();

  // Highlight
  ctx.fillStyle = `rgba(255,255,255,0.15)`;
  ctx.beginPath();
  ctx.ellipse(sx - 2 * s, sy - (large ? 7 : 4) * s, 3 * s, 2 * s, 0, 0, Math.PI * 2);
  ctx.fill();
}

function drawOre(ctx: CanvasRenderingContext2D, sx: number, sy: number, scale: number, type: 'iron' | 'coal') {
  const s = scale;
  // Base rock
  drawRock(ctx, sx, sy, scale, true, 0);
  // Ore sparkles
  const color = type === 'iron' ? '#c0a060' : '#3a3a3a';
  const spots = 4;
  for (let i = 0; i < spots; i++) {
    const ox = (Math.sin(i * 2.3) * 4) * s;
    const oy = (Math.cos(i * 1.7) * 3 - 5) * s;
    ctx.fillStyle = color;
    ctx.beginPath();
    ctx.arc(sx + ox, sy + oy, 1.5 * s, 0, Math.PI * 2);
    ctx.fill();
    if (type === 'iron') {
      ctx.fillStyle = 'rgba(255,220,100,0.4)';
      ctx.beginPath();
      ctx.arc(sx + ox, sy + oy, 2.5 * s, 0, Math.PI * 2);
      ctx.fill();
    }
  }
}

function drawSheep(ctx: CanvasRenderingContext2D, sx: number, sy: number, scale: number, time: number) {
  const s = scale;
  const bobble = Math.sin(time * 2) * 0.8;
  const walkX = Math.sin(time * 0.5) * 3;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.1)';
  ctx.beginPath();
  ctx.ellipse(sx + walkX, sy + 1, 5 * s, 2 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body (fluffy white)
  ctx.fillStyle = '#f0ece0';
  ctx.beginPath();
  ctx.ellipse(sx + walkX, sy - 4 * s + bobble, 6 * s, 4 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  // Head
  ctx.fillStyle = '#2a2a2a';
  ctx.beginPath();
  ctx.arc(sx + walkX + 4 * s, sy - 5 * s + bobble, 2.5 * s, 0, Math.PI * 2);
  ctx.fill();

  // Legs
  ctx.strokeStyle = '#2a2a2a';
  ctx.lineWidth = 1.2 * s;
  const legPhase = Math.sin(time * 3);
  ctx.beginPath();
  ctx.moveTo(sx + walkX - 3 * s, sy - 1 * s);
  ctx.lineTo(sx + walkX - 3 * s + legPhase, sy + 1);
  ctx.moveTo(sx + walkX + 3 * s, sy - 1 * s);
  ctx.lineTo(sx + walkX + 3 * s - legPhase, sy + 1);
  ctx.stroke();
}

function drawRabbit(ctx: CanvasRenderingContext2D, sx: number, sy: number, scale: number, time: number) {
  const s = scale;
  const hop = Math.abs(Math.sin(time * 3)) * 3;
  const walkX = Math.sin(time * 0.8) * 5;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.08)';
  ctx.beginPath();
  ctx.ellipse(sx + walkX, sy + 1, 3 * s, 1.5 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body
  ctx.fillStyle = '#9a7a5a';
  ctx.beginPath();
  ctx.ellipse(sx + walkX, sy - 3 * s - hop, 3.5 * s, 2.5 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  // Head
  ctx.fillStyle = '#a08060';
  ctx.beginPath();
  ctx.arc(sx + walkX + 2.5 * s, sy - 5 * s - hop, 2 * s, 0, Math.PI * 2);
  ctx.fill();

  // Ears
  ctx.fillStyle = '#a08060';
  ctx.beginPath();
  ctx.ellipse(sx + walkX + 2 * s, sy - 8 * s - hop, 1 * s, 3 * s, -0.2, 0, Math.PI * 2);
  ctx.fill();
  ctx.beginPath();
  ctx.ellipse(sx + walkX + 3.5 * s, sy - 8 * s - hop, 1 * s, 3 * s, 0.2, 0, Math.PI * 2);
  ctx.fill();
}

function drawDeer(ctx: CanvasRenderingContext2D, sx: number, sy: number, scale: number, time: number) {
  const s = scale;
  const walkX = Math.sin(time * 0.3) * 4;
  const bobble = Math.sin(time * 1.5) * 0.5;

  // Shadow
  ctx.fillStyle = 'rgba(0,0,0,0.12)';
  ctx.beginPath();
  ctx.ellipse(sx + walkX, sy + 1, 7 * s, 3 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  // Body
  ctx.fillStyle = '#8a6030';
  ctx.beginPath();
  ctx.ellipse(sx + walkX, sy - 6 * s + bobble, 7 * s, 4 * s, 0, 0, Math.PI * 2);
  ctx.fill();

  // Neck + head
  ctx.fillStyle = '#7a5020';
  ctx.beginPath();
  ctx.ellipse(sx + walkX + 6 * s, sy - 10 * s + bobble, 2 * s, 3 * s, 0.3, 0, Math.PI * 2);
  ctx.fill();
  ctx.fillStyle = '#8a6030';
  ctx.beginPath();
  ctx.arc(sx + walkX + 7 * s, sy - 13 * s + bobble, 2.5 * s, 0, Math.PI * 2);
  ctx.fill();

  // Antlers
  ctx.strokeStyle = '#5a3a10';
  ctx.lineWidth = 1 * s;
  ctx.beginPath();
  ctx.moveTo(sx + walkX + 6.5 * s, sy - 15 * s + bobble);
  ctx.lineTo(sx + walkX + 5 * s, sy - 19 * s + bobble);
  ctx.lineTo(sx + walkX + 3.5 * s, sy - 18 * s + bobble);
  ctx.moveTo(sx + walkX + 7.5 * s, sy - 15 * s + bobble);
  ctx.lineTo(sx + walkX + 9 * s, sy - 19 * s + bobble);
  ctx.lineTo(sx + walkX + 10.5 * s, sy - 18 * s + bobble);
  ctx.stroke();

  // Legs
  ctx.strokeStyle = '#6a4020';
  ctx.lineWidth = 1.5 * s;
  const legPhase = Math.sin(time * 2);
  ctx.beginPath();
  ctx.moveTo(sx + walkX - 4 * s, sy - 3 * s);
  ctx.lineTo(sx + walkX - 4 * s + legPhase, sy + 1);
  ctx.moveTo(sx + walkX + 4 * s, sy - 3 * s);
  ctx.lineTo(sx + walkX + 4 * s - legPhase, sy + 1);
  ctx.stroke();
}

function drawFishSpot(ctx: CanvasRenderingContext2D, sx: number, sy: number, scale: number, time: number) {
  const s = scale;
  // Ripple circles
  const ripple1 = (time * 0.8) % 2;
  const ripple2 = ((time * 0.8) + 1) % 2;
  
  for (const ripple of [ripple1, ripple2]) {
    const alpha = 1 - ripple / 2;
    const radius = ripple * 6 * s;
    ctx.strokeStyle = `rgba(200, 230, 255, ${alpha * 0.5})`;
    ctx.lineWidth = 1;
    ctx.beginPath();
    ctx.ellipse(sx, sy, radius, radius * 0.5, 0, 0, Math.PI * 2);
    ctx.stroke();
  }

  // Occasional fish jump
  const jumpPhase = Math.sin(time * 0.3 + sx);
  if (jumpPhase > 0.9) {
    const jumpY = (jumpPhase - 0.9) * 30;
    ctx.fillStyle = '#708090';
    ctx.beginPath();
    ctx.ellipse(sx, sy - jumpY * s, 2 * s, 1 * s, 0.3, 0, Math.PI * 2);
    ctx.fill();
  }
}

function drawWaterTile(
  ctx: CanvasRenderingContext2D,
  sx: number, sy: number,
  tileW: number, tileH: number,
  time: number,
  baseColor: string,
) {
  // Diamond shape water tile
  ctx.beginPath();
  ctx.moveTo(sx, sy - tileH / 2);
  ctx.lineTo(sx + tileW / 2, sy);
  ctx.lineTo(sx, sy + tileH / 2);
  ctx.lineTo(sx - tileW / 2, sy);
  ctx.closePath();
  ctx.fillStyle = baseColor;
  ctx.fill();

  // Shimmer
  const shimmer = Math.sin(time * 2 + sx * 0.1) * 0.15 + 0.1;
  ctx.fillStyle = `rgba(150, 200, 255, ${shimmer})`;
  ctx.fill();

  ctx.strokeStyle = 'rgba(30, 80, 140, 0.3)';
  ctx.lineWidth = 0.5;
  ctx.stroke();

  // Small wave lines
  ctx.strokeStyle = `rgba(200, 230, 255, ${0.2 + Math.sin(time * 1.5 + sy * 0.1) * 0.1})`;
  ctx.lineWidth = 0.5;
  ctx.beginPath();
  const waveY = Math.sin(time * 2 + sx * 0.2) * 1;
  ctx.moveTo(sx - 8, sy + waveY);
  ctx.quadraticCurveTo(sx, sy - 2 + waveY, sx + 8, sy + waveY);
  ctx.stroke();
}

// Get the wilderness border size
export function getWildernessBorder(): number {
  return WILDERNESS_BORDER;
}

// Convert student id to numeric seed
export function studentIdToSeed(studentId: string): number {
  let hash = 0;
  for (let i = 0; i < studentId.length; i++) {
    hash = ((hash << 5) - hash) + studentId.charCodeAt(i);
    hash |= 0;
  }
  return Math.abs(hash);
}

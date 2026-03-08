import { GRID_SIZE, BUILDING_DEFS, PlacedBuilding, GridTile, TileType } from './gameTypes';

// Initialize empty grid
export function createEmptyGrid(): GridTile[][] {
  const grid: GridTile[][] = [];
  for (let y = 0; y < GRID_SIZE; y++) {
    grid[y] = [];
    for (let x = 0; x < GRID_SIZE; x++) {
      grid[y][x] = { x, y, type: 'grass' };
    }
  }
  return grid;
}

// Apply buildings to grid (mark tiles as occupied)
export function applyBuildingsToGrid(grid: GridTile[][], buildings: PlacedBuilding[]): GridTile[][] {
  const g = grid.map(row => row.map(t => ({ ...t, buildingId: undefined })));
  for (const b of buildings) {
    const def = BUILDING_DEFS[b.defId];
    if (!def) continue;
    for (let dy = 0; dy < def.height; dy++) {
      for (let dx = 0; dx < def.width; dx++) {
        const ty = b.y + dy;
        const tx = b.x + dx;
        if (ty >= 0 && ty < GRID_SIZE && tx >= 0 && tx < GRID_SIZE) {
          g[ty][tx].buildingId = b.id;
          if (def.id === 'road') g[ty][tx].type = 'road';
          else if (def.id === 'wall') g[ty][tx].type = 'wall';
        }
      }
    }
  }
  return g;
}

// Check if tiles are free for placement
export function canPlace(grid: GridTile[][], x: number, y: number, width: number, height: number): boolean {
  for (let dy = 0; dy < height; dy++) {
    for (let dx = 0; dx < width; dx++) {
      const tx = x + dx;
      const ty = y + dy;
      if (tx < 0 || tx >= GRID_SIZE || ty < 0 || ty >= GRID_SIZE) return false;
      if (grid[ty][tx].buildingId) return false;
    }
  }
  return true;
}

// Check adjacency to road (any neighbor is road)
export function hasRoadAccess(grid: GridTile[][], x: number, y: number, width: number, height: number): boolean {
  const directions = [[-1, 0], [1, 0], [0, -1], [0, 1]];
  for (let dy = 0; dy < height; dy++) {
    for (let dx = 0; dx < width; dx++) {
      for (const [ddx, ddy] of directions) {
        const nx = x + dx + ddx;
        const ny = y + dy + ddy;
        if (nx >= 0 && nx < GRID_SIZE && ny >= 0 && ny < GRID_SIZE) {
          if (grid[ny][nx].type === 'road') return true;
        }
      }
    }
  }
  return false;
}

// Convert grid coords to isometric screen coords
export function gridToIso(gx: number, gy: number, tileW: number, tileH: number): { sx: number; sy: number } {
  return {
    sx: (gx - gy) * (tileW / 2),
    sy: (gx + gy) * (tileH / 2),
  };
}

// Convert screen coords to grid coords
export function isoToGrid(sx: number, sy: number, tileW: number, tileH: number): { gx: number; gy: number } {
  const gx = Math.floor((sx / (tileW / 2) + sy / (tileH / 2)) / 2);
  const gy = Math.floor((sy / (tileH / 2) - sx / (tileW / 2)) / 2);
  return { gx, gy };
}

// Calculate upgrade cost
export function getUpgradeCost(defId: string, currentLevel: number): { coins: number; diamonds: number } {
  const def = BUILDING_DEFS[defId];
  if (!def) return { coins: 0, diamonds: 0 };
  const mult = Math.pow(def.upgradeCostMultiplier, currentLevel);
  return {
    coins: Math.round(def.costCoins * mult),
    diamonds: Math.round(def.costDiamonds * mult),
  };
}

// Get total stats from all buildings
export function getTotalStats(buildings: PlacedBuilding[]): { citizens: number; defense: number; xp: number } {
  let citizens = 0, defense = 0, xp = 0;
  for (const b of buildings) {
    const def = BUILDING_DEFS[b.defId];
    if (!def) continue;
    const lvlMult = 1 + (b.level - 1) * 0.5;
    citizens += Math.round(def.citizenBonus * lvlMult);
    defense += Math.round(def.defenseBonus * lvlMult);
    xp += Math.round(def.xpBonus * lvlMult);
  }
  return { citizens, defense, xp };
}

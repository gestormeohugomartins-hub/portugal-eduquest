import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { TILE_W, TILE_H, BUILDING_DEFS, PlacedBuilding, GridTile } from '@/lib/gameTypes';
import { gridToIso, applyBuildingsToGrid } from '@/lib/gridLogic';
import { BUILDING_SPRITES, getSpriteImage, preloadSprites } from '@/lib/sprites';
import { updateParticles, drawParticles, addSmokeParticle, addSparkle, drawFlag, drawWaterShimmer } from '@/lib/canvasEffects';
import { AnimatedCitizen, Complaint } from '@/lib/simulation';
import { generateTerrain, drawTerrainElement, drawWildernessTile, getWildernessBorder, studentIdToSeed, TerrainElement } from '@/lib/terrainGeneration';

interface IsometricCanvasProps {
  grid: GridTile[][];
  buildings: PlacedBuilding[];
  gridSize: number;
  selectedBuilding: string | null;
  ghostPos: { x: number; y: number } | null;
  canPlaceGhost: boolean;
  productionReady: Set<string>;
  animatedCitizens: AnimatedCitizen[];
  complaints: Complaint[];
  studentId?: string;
  district?: string | null;
  cooldownElements?: Set<number>;
  onTileClick: (gx: number, gy: number) => void;
  onTileHover: (gx: number, gy: number) => void;
  onBuildingClick: (building: PlacedBuilding) => void;
  onTerrainClick?: (element: TerrainElement) => void;
}

const GRASS_COLORS = ['#4a7c3f', '#4e8243', '#467838', '#528645'];
const ROAD_COLOR = '#a09070';
const ROAD_BORDER = '#7a6a55';
const WALL_COLOR = '#6b6b6b';
const FARM_COLORS = ['#6b8e23', '#7a9e32', '#5a7e13'];

export const IsometricCanvas = ({
  grid, buildings, gridSize, selectedBuilding, ghostPos, canPlaceGhost,
  productionReady, animatedCitizens, complaints, studentId, district,
  onTileClick, onTileHover, onBuildingClick,
}: IsometricCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [camera, setCamera] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [camStart, setCamStart] = useState({ x: 0, y: 0 });
  const [spritesLoaded, setSpritesLoaded] = useState(false);
  const animFrameRef = useRef<number>(0);
  const timeRef = useRef(0);

  const fullGrid = useMemo(() => applyBuildingsToGrid(grid, buildings), [grid, buildings]);

  // Generate terrain elements (deterministic based on student id)
  const terrainElements = useMemo(() => {
    const seed = studentId ? studentIdToSeed(studentId) : 12345;
    return generateTerrain({ district, gridSize, seed });
  }, [studentId, district, gridSize]);

  const wildernessBorder = getWildernessBorder();
  const originX = (gridSize * TILE_W) / 2;
  const originY = 50;

  useEffect(() => {
    preloadSprites().then(() => setSpritesLoaded(true));
  }, []);

  const screenToGrid = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const mx = (clientX - rect.left - w / 2) / zoom - camera.x + originX;
    const my = (clientY - rect.top - h / 2) / zoom - camera.y + originY;
    const gx = Math.floor((mx / (TILE_W / 2) + my / (TILE_H / 2)) / 2);
    const gy = Math.floor((my / (TILE_H / 2) - mx / (TILE_W / 2)) / 2);
    if (gx >= 0 && gx < gridSize && gy >= 0 && gy < gridSize) return { gx, gy };
    return null;
  }, [camera, zoom, gridSize, originX]);

  // Animation loop
  useEffect(() => {
    let running = true;
    const loop = () => {
      if (!running) return;
      timeRef.current += 0.016;
      render();
      animFrameRef.current = requestAnimationFrame(loop);
    };
    loop();
    return () => { running = false; cancelAnimationFrame(animFrameRef.current); };
  }, [fullGrid, buildings, camera, zoom, ghostPos, selectedBuilding, canPlaceGhost, gridSize, spritesLoaded, productionReady, animatedCitizens, complaints]);

  // Smoke effects
  useEffect(() => {
    const interval = setInterval(() => {
      for (const b of buildings) {
        const def = BUILDING_DEFS[b.defId];
        if (!def) continue;
        if (def.id === 'workshop' || def.id === 'market' || def.id === 'windmill') {
          const cx = b.x + def.width / 2 - 0.5;
          const cy = b.y + def.height / 2 - 0.5;
          const { sx, sy } = gridToIso(cx, cy, TILE_W, TILE_H);
          addSmokeParticle(sx, sy - 20);
        }
        if (productionReady.has(b.id)) {
          const cx = b.x + def.width / 2 - 0.5;
          const cy = b.y + def.height / 2 - 0.5;
          const { sx, sy } = gridToIso(cx, cy, TILE_W, TILE_H);
          addSparkle(sx, sy - 15);
        }
      }
    }, 800);
    return () => clearInterval(interval);
  }, [buildings, productionReady]);

  function render() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    canvas.width = w * dpr;
    canvas.height = h * dpr;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.clearRect(0, 0, w, h);
    ctx.fillStyle = '#0e200a';
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(camera.x - originX, camera.y - originY);

    const time = timeRef.current;

    // Pre-compute water tile positions
    const waterTileSet = new Set<string>();
    for (const el of terrainElements) {
      if (el.type === 'river_tile' || el.type === 'lake_tile') {
        waterTileSet.add(`${Math.floor(el.gx)},${Math.floor(el.gy)}`);
      }
    }

    // Draw wilderness tiles (outside village grid)
    const wb = wildernessBorder;
    for (let y = -wb; y < gridSize + wb; y++) {
      for (let x = -wb; x < gridSize + wb; x++) {
        if (x >= 0 && x < gridSize && y >= 0 && y < gridSize) continue;
        if (!waterTileSet.has(`${x},${y}`)) {
          drawWildernessTile(ctx, x, y, TILE_W, TILE_H, gridSize);
        }
      }
    }

    // Draw water terrain elements (tiles) first
    for (const el of terrainElements) {
      if (el.type === 'river_tile' || el.type === 'lake_tile') {
        drawTerrainElement(ctx, el, TILE_W, TILE_H, time);
      }
    }

    // Draw village tiles
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        const tile = fullGrid[y]?.[x];
        if (!tile) continue;
        const { sx, sy } = gridToIso(x, y, TILE_W, TILE_H);
        drawIsoDiamond(ctx, sx, sy, tile.type, x, y, tile.buildingId, buildings);
      }
    }

    // Draw terrain elements (sorted by depth for proper overlap)
    const sortedTerrain = terrainElements
      .filter(el => el.type !== 'river_tile' && el.type !== 'lake_tile')
      .sort((a, b) => (a.gx + a.gy) - (b.gx + b.gy));
    for (const el of sortedTerrain) {
      drawTerrainElement(ctx, el, TILE_W, TILE_H, time);
    }

    // Draw ghost
    if (ghostPos && selectedBuilding) {
      const def = BUILDING_DEFS[selectedBuilding];
      if (def) {
        for (let dy = 0; dy < def.height; dy++) {
          for (let dx = 0; dx < def.width; dx++) {
            const { sx, sy } = gridToIso(ghostPos.x + dx, ghostPos.y + dy, TILE_W, TILE_H);
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = canPlaceGhost ? '#00ff0066' : '#ff000066';
            drawDiamondPath(ctx, sx, sy);
            ctx.fill();
            ctx.globalAlpha = 1;
          }
        }
        const { sx, sy } = gridToIso(ghostPos.x, ghostPos.y, TILE_W, TILE_H);
        ctx.globalAlpha = 0.6;
        drawBuildingSprite(ctx, def.id, sx, sy, def.width, def.height, 1);
        ctx.globalAlpha = 1;
      }
    }

    // Draw buildings sorted by depth
    const sorted = [...buildings].sort((a, b) => (a.y + a.x) - (b.y + b.x));
    for (const b of sorted) {
      const def = BUILDING_DEFS[b.defId];
      if (!def) continue;

      const cx = b.x + def.width / 2 - 0.5;
      const cy = b.y + def.height / 2 - 0.5;
      const { sx, sy } = gridToIso(cx, cy, TILE_W, TILE_H);

      if (def.id === 'road' || def.id === 'wall') continue;

      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath();
      ctx.ellipse(sx, sy + 4, 16 * def.width, 8 * def.height, 0, 0, Math.PI * 2);
      ctx.fill();

      drawBuildingSprite(ctx, b.defId, sx, sy, def.width, def.height, b.level);

      // Flags on towers/monuments
      if (def.id === 'tower' || def.category === 'monument') {
        drawFlag(ctx, sx + 8, sy - 20 - (b.level - 1) * 2, time);
      }

      // Fountain water
      if (def.id === 'fountain' || def.id === 'well') {
        drawWaterShimmer(ctx, sx, sy - 8, 20, time);
      }

      // Farm crop animation
      if (def.id === 'farm') {
        drawFarmCrops(ctx, sx, sy, b.level, time);
      }

      // Hospital cross
      if (def.id === 'hospital') {
        drawCross(ctx, sx, sy - 25, time);
      }

      // Level badge
      if (b.level > 1) {
        ctx.fillStyle = '#f5a623';
        ctx.beginPath();
        ctx.arc(sx + 14, sy - 22 - (b.level - 1) * 2, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.stroke();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${b.level}`, sx + 14, sy - 19 - (b.level - 1) * 2);
      }

      // Production ready indicator
      if (productionReady.has(b.id)) {
        const bobY = Math.sin(time * 4) * 3;
        ctx.fillStyle = '#f5a623';
        ctx.beginPath();
        ctx.arc(sx, sy - 30 + bobY, 8, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText('🪙', sx, sy - 27 + bobY);
      }
    }

    // Draw animated citizens
    for (const citizen of animatedCitizens) {
      const { sx, sy } = gridToIso(citizen.x, citizen.y, TILE_W, TILE_H);
      drawCitizen(ctx, sx, sy, citizen, time);
    }

    // Draw particles
    updateParticles();
    drawParticles(ctx);

    ctx.restore();
  }

  function drawCitizen(ctx: CanvasRenderingContext2D, sx: number, sy: number, citizen: AnimatedCitizen, time: number) {
    // Body
    const bobble = Math.sin(time * 8 + citizen.id) * 1;
    ctx.fillStyle = citizen.color;
    ctx.beginPath();
    ctx.ellipse(sx, sy - 4 + bobble, 3, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head
    ctx.fillStyle = '#f5d0a0';
    ctx.beginPath();
    ctx.arc(sx, sy - 10 + bobble, 2.5, 0, Math.PI * 2);
    ctx.fill();

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.15)';
    ctx.beginPath();
    ctx.ellipse(sx, sy + 2, 3, 1.5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Complaint bubble
    if (citizen.complaint && citizen.complaintTimer > 0) {
      const alpha = Math.min(1, citizen.complaintTimer / 30);
      ctx.globalAlpha = alpha;
      // Bubble
      ctx.fillStyle = '#fff';
      ctx.beginPath();
      ctx.roundRect(sx - 18, sy - 26 + bobble, 36, 14, 4);
      ctx.fill();
      ctx.strokeStyle = '#ccc';
      ctx.lineWidth = 0.5;
      ctx.stroke();
      // Text
      ctx.fillStyle = '#333';
      ctx.font = '7px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(citizen.complaint, sx, sy - 17 + bobble);
      ctx.globalAlpha = 1;
    }
  }

  function drawFarmCrops(ctx: CanvasRenderingContext2D, sx: number, sy: number, level: number, time: number) {
    // Draw little crop rows
    const cropColors = ['#228B22', '#32CD32', '#6B8E23', '#9ACD32'];
    for (let i = 0; i < 3 + level; i++) {
      const ox = (i - 2) * 6;
      const oy = (i % 2) * 3 - 2;
      const sway = Math.sin(time * 2 + i) * 1;
      ctx.fillStyle = cropColors[i % cropColors.length];
      ctx.beginPath();
      ctx.ellipse(sx + ox + sway, sy + oy - 3, 2, 3 + level * 0.5, 0, 0, Math.PI * 2);
      ctx.fill();
    }
  }

  function drawCross(ctx: CanvasRenderingContext2D, sx: number, sy: number, time: number) {
    const pulse = Math.sin(time * 2) * 0.1 + 0.9;
    ctx.globalAlpha = pulse;
    ctx.fillStyle = '#ff3333';
    ctx.fillRect(sx - 1.5, sy - 5, 3, 10);
    ctx.fillRect(sx - 5, sy - 1.5, 10, 3);
    ctx.globalAlpha = 1;
  }

  function drawBuildingSprite(ctx: CanvasRenderingContext2D, defId: string, sx: number, sy: number, bw: number, bh: number, level: number) {
    const sprite = BUILDING_SPRITES[defId];
    const img = sprite ? getSpriteImage(sprite.image) : null;

    if (img && sprite) {
      const drawW = 32 + (bw - 1) * 24 + (level - 1) * 4;
      const drawH = drawW * (sprite.sh / sprite.sw);
      ctx.drawImage(img, sprite.sx, sprite.sy, sprite.sw, sprite.sh, sx - drawW / 2, sy - drawH + 8, drawW, drawH);
    } else {
      const def = BUILDING_DEFS[defId];
      if (def) {
        const baseSize = 22 + (bw - 1) * 10;
        const levelSize = baseSize + (level - 1) * 3;
        ctx.font = `${levelSize}px serif`;
        ctx.textAlign = 'center';
        ctx.fillText(def.emoji, sx, sy - 6 - (level - 1) * 2);
      }
    }
  }

  function drawIsoDiamond(ctx: CanvasRenderingContext2D, sx: number, sy: number, type: string, x: number, y: number, buildingId: string | undefined, allBuildings: PlacedBuilding[]) {
    let color: string;
    if (type === 'road') color = ROAD_COLOR;
    else if (type === 'wall') color = WALL_COLOR;
    else {
      // Check if this tile is a farm
      if (buildingId) {
        const b = allBuildings.find(b => b.id === buildingId);
        if (b && b.defId === 'farm') {
          color = FARM_COLORS[(x + y) % FARM_COLORS.length];
        } else {
          color = GRASS_COLORS[(x + y * 3) % GRASS_COLORS.length];
        }
      } else {
        color = GRASS_COLORS[(x + y * 3) % GRASS_COLORS.length];
      }
    }

    drawDiamondPath(ctx, sx, sy);
    ctx.fillStyle = color;
    ctx.fill();
    ctx.strokeStyle = type === 'road' ? ROAD_BORDER : '#3a6030';
    ctx.lineWidth = 0.5;
    ctx.stroke();
  }

  function drawDiamondPath(ctx: CanvasRenderingContext2D, sx: number, sy: number) {
    ctx.beginPath();
    ctx.moveTo(sx, sy - TILE_H / 2);
    ctx.lineTo(sx + TILE_W / 2, sy);
    ctx.lineTo(sx, sy + TILE_H / 2);
    ctx.lineTo(sx - TILE_W / 2, sy);
    ctx.closePath();
  }

  // Mouse/touch handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setCamStart({ ...camera });
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragging) {
      setCamera({ x: camStart.x + (e.clientX - dragStart.x) / zoom, y: camStart.y + (e.clientY - dragStart.y) / zoom });
    } else {
      const pos = screenToGrid(e.clientX, e.clientY);
      if (pos) onTileHover(pos.gx, pos.gy);
    }
  };
  const handleMouseUp = (e: React.MouseEvent) => {
    if (dragging) {
      const dist = Math.abs(e.clientX - dragStart.x) + Math.abs(e.clientY - dragStart.y);
      if (dist < 5) {
        const pos = screenToGrid(e.clientX, e.clientY);
        if (pos) {
          const tile = fullGrid[pos.gy]?.[pos.gx];
          if (tile?.buildingId && !selectedBuilding) {
            const b = buildings.find(b => b.id === tile.buildingId);
            if (b) { onBuildingClick(b); setDragging(false); return; }
          }
          onTileClick(pos.gx, pos.gy);
        }
      }
    }
    setDragging(false);
  };
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(z => Math.max(0.4, Math.min(2.5, z - e.deltaY * 0.001)));
  };
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setDragging(true);
      setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
      setCamStart({ ...camera });
    }
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (dragging && e.touches.length === 1) {
      setCamera({ x: camStart.x + (e.touches[0].clientX - dragStart.x) / zoom, y: camStart.y + (e.touches[0].clientY - dragStart.y) / zoom });
    }
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (dragging && e.changedTouches.length === 1) {
      const t = e.changedTouches[0];
      if (Math.abs(t.clientX - dragStart.x) + Math.abs(t.clientY - dragStart.y) < 10) {
        const pos = screenToGrid(t.clientX, t.clientY);
        if (pos) onTileClick(pos.gx, pos.gy);
      }
    }
    setDragging(false);
  };

  return (
    <canvas
      ref={canvasRef}
      className="w-full h-full cursor-grab active:cursor-grabbing touch-none"
      onMouseDown={handleMouseDown}
      onMouseMove={handleMouseMove}
      onMouseUp={handleMouseUp}
      onMouseLeave={() => setDragging(false)}
      onWheel={handleWheel}
      onTouchStart={handleTouchStart}
      onTouchMove={handleTouchMove}
      onTouchEnd={handleTouchEnd}
    />
  );
};

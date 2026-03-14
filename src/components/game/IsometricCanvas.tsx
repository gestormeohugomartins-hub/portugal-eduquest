import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { TILE_W, TILE_H, BUILDING_DEFS, PlacedBuilding, GridTile } from '@/lib/gameTypes';
import { gridToIso, applyBuildingsToGrid } from '@/lib/gridLogic';
import { BUILDING_SPRITES, getSpriteImage, preloadSprites } from '@/lib/sprites';
import { updateParticles, drawParticles, addSmokeParticle, addSparkle, addLeafParticle, addFirefly, drawFlag, drawWaterShimmer, drawAtmosphere } from '@/lib/canvasEffects';
import { AnimatedCitizen, Complaint } from '@/lib/simulation';
import { generateTerrain, drawTerrainElement, drawWildernessTile, getWildernessBorder, studentIdToSeed, TerrainElement } from '@/lib/terrainGeneration';
import { drawBuilding, drawScaffolding, getConstructionProgress } from '@/lib/buildingRenderer';

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

const GRASS_COLORS_LIGHT = ['#4e8243', '#528645', '#4a7e3f', '#558a48', '#4c8040'];
const GRASS_COLORS_DARK = ['#3a6a30', '#3e6e34', '#38662e', '#407038', '#3c6c32'];
const ROAD_COLOR = '#a09070';
const ROAD_BORDER = '#7a6a55';
const WALL_COLOR = '#6b6b6b';
const FARM_COLORS = ['#6b8e23', '#7a9e32', '#5a7e13', '#648a1e'];

export const IsometricCanvas = ({
  grid, buildings, gridSize, selectedBuilding, ghostPos, canPlaceGhost,
  productionReady, animatedCitizens, complaints, studentId, district, cooldownElements,
  onTileClick, onTileHover, onBuildingClick, onTerrainClick,
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

  // Convert screen coords to fractional grid coords (for terrain element detection, supports outside grid)
  const screenToWorldGrid = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;
    const mx = (clientX - rect.left - w / 2) / zoom - camera.x + originX;
    const my = (clientY - rect.top - h / 2) / zoom - camera.y + originY;
    const gx = (mx / (TILE_W / 2) + my / (TILE_H / 2)) / 2;
    const gy = (my / (TILE_H / 2) - mx / (TILE_W / 2)) / 2;
    return { gx, gy };
  }, [camera, zoom, originX]);

  // Find nearest terrain element to world coords
  const findTerrainElement = useCallback((worldGx: number, worldGy: number): TerrainElement | null => {
    let closest: TerrainElement | null = null;
    let closestDist = 1.5; // max click distance in grid units
    for (const el of terrainElements) {
      if (el.type === 'river_tile' || el.type === 'lake_tile' || el.type === 'bush') continue;
      const dx = el.gx - worldGx;
      const dy = el.gy - worldGy;
      const dist = Math.sqrt(dx * dx + dy * dy);
      if (dist < closestDist) {
        closestDist = dist;
        closest = el;
      }
    }
    return closest;
  }, [terrainElements]);

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

  // Smoke, leaf and firefly effects
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
      // Occasional leaf particles from trees in terrain
      if (Math.random() < 0.3) {
        const gx = Math.random() * gridSize;
        const gy = Math.random() * gridSize;
        const { sx, sy } = gridToIso(gx, gy, TILE_W, TILE_H);
        addLeafParticle(sx, sy - 20);
      }
      // Fireflies at dusk
      if (Math.random() < 0.15) {
        const gx = Math.random() * gridSize;
        const gy = Math.random() * gridSize;
        const { sx, sy } = gridToIso(gx, gy, TILE_W, TILE_H);
        addFirefly(sx, sy - 10);
      }
    }, 800);
    return () => clearInterval(interval);
  }, [buildings, productionReady, gridSize]);

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
        drawBuilding(ctx, def.id, sx, sy, 1, timeRef.current);
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

      if (def.id === 'road') {
        drawBuilding(ctx, 'road', sx, sy, b.level, time);
        continue;
      }
      if (def.id === 'wall') {
        drawBuilding(ctx, 'wall', sx, sy, b.level, time);
        continue;
      }

      // Enhanced shadow with gradient
      const shadowGrad = ctx.createRadialGradient(sx + 3, sy + 5, 0, sx + 3, sy + 5, 18 * def.width);
      shadowGrad.addColorStop(0, 'rgba(0,0,0,0.2)');
      shadowGrad.addColorStop(1, 'rgba(0,0,0,0)');
      ctx.fillStyle = shadowGrad;
      ctx.beginPath();
      ctx.ellipse(sx + 3, sy + 5, 18 * def.width, 9 * def.height, 0.15, 0, Math.PI * 2);
      ctx.fill();

      // Check construction progress
      const progress = getConstructionProgress(b.constructionStartedAt ?? null, b.constructionDuration ?? 0);

      if (progress < 1) {
        drawScaffolding(ctx, sx, sy, def.width, def.height, progress, time);
      } else {
        drawBuilding(ctx, b.defId, sx, sy, b.level, time);

        if (def.id === 'tower' || def.category === 'monument') {
          drawFlag(ctx, sx + 8, sy - 20 - (b.level - 1) * 2, time);
        }
      }

      // Level badge
      if (b.level > 1 && progress >= 1) {
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
      if (productionReady.has(b.id) && progress >= 1) {
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

    // Atmosphere overlay (drawn in screen space)
    drawAtmosphere(ctx, w, h, time);
  }

  function drawCitizen(ctx: CanvasRenderingContext2D, sx: number, sy: number, citizen: AnimatedCitizen, time: number) {
    const bobble = Math.sin(time * 8 + citizen.id) * 1;
    const walkLean = Math.sin(time * 4 + citizen.id * 2) * 0.5;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.beginPath();
    ctx.ellipse(sx, sy + 2, 4, 1.8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Feet
    ctx.fillStyle = '#4a3020';
    const footPhase = Math.sin(time * 8 + citizen.id);
    ctx.beginPath();
    ctx.ellipse(sx - 1.5 + footPhase * 0.5, sy + 0.5, 1.2, 0.6, 0, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.ellipse(sx + 1.5 - footPhase * 0.5, sy + 0.5, 1.2, 0.6, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body with clothing gradient
    const bodyGrad = ctx.createLinearGradient(sx - 3, sy - 2 + bobble, sx + 3, sy + 3 + bobble);
    bodyGrad.addColorStop(0, citizen.color);
    bodyGrad.addColorStop(1, darkenColor(citizen.color, 0.3));
    ctx.fillStyle = bodyGrad;
    ctx.beginPath();
    ctx.ellipse(sx + walkLean, sy - 3 + bobble, 3.5, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Belt/waist detail
    ctx.strokeStyle = darkenColor(citizen.color, 0.5);
    ctx.lineWidth = 0.5;
    ctx.beginPath();
    ctx.moveTo(sx - 3 + walkLean, sy - 1 + bobble);
    ctx.lineTo(sx + 3 + walkLean, sy - 1 + bobble);
    ctx.stroke();

    // Arms
    ctx.strokeStyle = citizen.color;
    ctx.lineWidth = 1.5;
    const armSwing = Math.sin(time * 6 + citizen.id) * 2;
    ctx.beginPath();
    ctx.moveTo(sx - 3 + walkLean, sy - 4 + bobble);
    ctx.lineTo(sx - 5 + walkLean + armSwing, sy - 1 + bobble);
    ctx.moveTo(sx + 3 + walkLean, sy - 4 + bobble);
    ctx.lineTo(sx + 5 + walkLean - armSwing, sy - 1 + bobble);
    ctx.stroke();

    // Head with skin tone
    const skinTones = ['#f5d0a0', '#e8c090', '#d4a878', '#c49468'];
    const skinIdx = Math.abs(citizen.id) % skinTones.length;
    ctx.fillStyle = skinTones[skinIdx];
    ctx.beginPath();
    ctx.arc(sx + walkLean, sy - 9.5 + bobble, 3, 0, Math.PI * 2);
    ctx.fill();

    // Hair
    const hairColors = ['#3a2010', '#1a1008', '#6a4020', '#8a6030', '#2a1a08'];
    ctx.fillStyle = hairColors[Math.abs(citizen.id * 3) % hairColors.length];
    ctx.beginPath();
    ctx.arc(sx + walkLean, sy - 10.5 + bobble, 3, Math.PI, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#222';
    ctx.beginPath();
    ctx.arc(sx + walkLean - 1, sy - 9.5 + bobble, 0.5, 0, Math.PI * 2);
    ctx.fill();
    ctx.beginPath();
    ctx.arc(sx + walkLean + 1, sy - 9.5 + bobble, 0.5, 0, Math.PI * 2);
    ctx.fill();

    // Complaint bubble (improved)
    if (citizen.complaint && citizen.complaintTimer > 0) {
      const alpha = Math.min(1, citizen.complaintTimer / 30);
      ctx.globalAlpha = alpha;
      // Bubble with pointer
      ctx.fillStyle = 'rgba(255,255,255,0.92)';
      ctx.beginPath();
      ctx.roundRect(sx - 20, sy - 28 + bobble, 40, 15, 5);
      ctx.fill();
      // Pointer triangle
      ctx.beginPath();
      ctx.moveTo(sx - 2, sy - 13 + bobble);
      ctx.lineTo(sx + 2, sy - 13 + bobble);
      ctx.lineTo(sx, sy - 11 + bobble);
      ctx.closePath();
      ctx.fill();
      // Shadow
      ctx.strokeStyle = 'rgba(0,0,0,0.1)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.roundRect(sx - 20, sy - 28 + bobble, 40, 15, 5);
      ctx.stroke();
      // Text
      ctx.fillStyle = '#333';
      ctx.font = '7px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(citizen.complaint, sx, sy - 18 + bobble);
      ctx.globalAlpha = 1;
    }
  }

  // Utility to darken a hex color
  function darkenColor(hex: string, amount: number): string {
    const r = parseInt(hex.slice(1, 3), 16);
    const g = parseInt(hex.slice(3, 5), 16);
    const b = parseInt(hex.slice(5, 7), 16);
    return `rgb(${Math.max(0, Math.floor(r * (1 - amount)))}, ${Math.max(0, Math.floor(g * (1 - amount)))}, ${Math.max(0, Math.floor(b * (1 - amount)))})`;
  }


  function drawIsoDiamond(ctx: CanvasRenderingContext2D, sx: number, sy: number, type: string, x: number, y: number, buildingId: string | undefined, allBuildings: PlacedBuilding[]) {
    drawDiamondPath(ctx, sx, sy);

    if (type === 'road') {
      // Road with worn texture gradient
      const roadGrad = ctx.createLinearGradient(sx - TILE_W / 4, sy - TILE_H / 4, sx + TILE_W / 4, sy + TILE_H / 4);
      roadGrad.addColorStop(0, '#b0a080');
      roadGrad.addColorStop(0.5, ROAD_COLOR);
      roadGrad.addColorStop(1, '#8a7a60');
      ctx.fillStyle = roadGrad;
      ctx.fill();
      // Wear marks
      ctx.strokeStyle = ROAD_BORDER;
      ctx.lineWidth = 0.4;
      ctx.stroke();
      // Center line
      ctx.strokeStyle = 'rgba(140, 120, 90, 0.3)';
      ctx.lineWidth = 0.5;
      ctx.beginPath();
      ctx.moveTo(sx - 5, sy);
      ctx.lineTo(sx + 5, sy);
      ctx.stroke();
    } else if (type === 'wall') {
      ctx.fillStyle = WALL_COLOR;
      ctx.fill();
      ctx.strokeStyle = '#555';
      ctx.lineWidth = 0.5;
      ctx.stroke();
    } else {
      // Grass tile with gradient for 3D depth
      let isFarm = false;
      if (buildingId) {
        const b = allBuildings.find(b => b.id === buildingId);
        if (b && b.defId === 'farm') isFarm = true;
      }

      if (isFarm) {
        const farmGrad = ctx.createLinearGradient(sx - TILE_W / 4, sy - TILE_H / 2, sx + TILE_W / 4, sy + TILE_H / 2);
        farmGrad.addColorStop(0, FARM_COLORS[(x + y) % FARM_COLORS.length]);
        farmGrad.addColorStop(1, FARM_COLORS[(x + y + 1) % FARM_COLORS.length]);
        ctx.fillStyle = farmGrad;
      } else {
        const idx = (x + y * 3) % GRASS_COLORS_LIGHT.length;
        const grad = ctx.createLinearGradient(sx - TILE_W / 4, sy - TILE_H / 2, sx + TILE_W / 4, sy + TILE_H / 2);
        grad.addColorStop(0, GRASS_COLORS_LIGHT[idx]);
        grad.addColorStop(1, GRASS_COLORS_DARK[idx]);
        ctx.fillStyle = grad;
      }
      ctx.fill();
      ctx.strokeStyle = '#3a6030';
      ctx.lineWidth = 0.3;
      ctx.stroke();

      // Grass detail on some tiles
      if (!isFarm && !buildingId && (x * 7 + y * 11) % 5 === 0) {
        ctx.strokeStyle = 'rgba(100, 160, 80, 0.2)';
        ctx.lineWidth = 0.4;
        ctx.beginPath();
        ctx.moveTo(sx - 3, sy + 1);
        ctx.lineTo(sx - 1, sy - 2);
        ctx.moveTo(sx + 1, sy + 2);
        ctx.lineTo(sx + 3, sy - 1);
        ctx.stroke();
      }
    }
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
        } else if (onTerrainClick) {
          // Clicked outside village grid — check for terrain elements
          const worldPos = screenToWorldGrid(e.clientX, e.clientY);
          if (worldPos) {
            const el = findTerrainElement(worldPos.gx, worldPos.gy);
            if (el) onTerrainClick(el);
          }
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
        if (pos) {
          onTileClick(pos.gx, pos.gy);
        } else if (onTerrainClick) {
          const worldPos = screenToWorldGrid(t.clientX, t.clientY);
          if (worldPos) {
            const el = findTerrainElement(worldPos.gx, worldPos.gy);
            if (el) onTerrainClick(el);
          }
        }
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

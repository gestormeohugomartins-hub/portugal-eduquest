import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { TILE_W, TILE_H, BUILDING_DEFS, PlacedBuilding, GridTile } from '@/lib/gameTypes';
import { gridToIso, applyBuildingsToGrid } from '@/lib/gridLogic';
import { preloadSprites } from '@/lib/sprites';
import { updateParticles, drawParticles, addSmokeParticle, addSparkle, addLeafParticle, addFirefly, drawFlag, drawAtmosphere } from '@/lib/canvasEffects';
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

const GRASS_COLORS = ['#4e8243', '#528645', '#4a7e3f', '#558a48', '#4c8040'];
const ROAD_COLOR = '#a09070';
const WALL_COLOR = '#6b6b6b';
const FARM_COLORS = ['#6b8e23', '#7a9e32', '#5a7e13', '#648a1e'];

// Reduced wilderness border for performance
const PERF_WILDERNESS_BORDER = 6;

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
  const animFrameRef = useRef<number>(0);
  const timeRef = useRef(0);
  const lastCanvasSize = useRef({ w: 0, h: 0 });

  // Use refs for render data so animation loop doesn't restart
  const renderDataRef = useRef({
    fullGrid: null as GridTile[][] | null,
    buildings: [] as PlacedBuilding[],
    gridSize: 0,
    selectedBuilding: null as string | null,
    ghostPos: null as { x: number; y: number } | null,
    canPlaceGhost: false,
    productionReady: new Set<string>(),
    animatedCitizens: [] as AnimatedCitizen[],
    complaints: [] as Complaint[],
    camera: { x: 0, y: 0 },
    zoom: 1,
  });

  const fullGrid = useMemo(() => applyBuildingsToGrid(grid, buildings), [grid, buildings]);

  const terrainElements = useMemo(() => {
    const seed = studentId ? studentIdToSeed(studentId) : 12345;
    return generateTerrain({ district, gridSize, seed });
  }, [studentId, district, gridSize]);

  // Pre-sort and pre-filter terrain for rendering
  const sortedNonWaterTerrain = useMemo(() => 
    terrainElements
      .filter(el => el.type !== 'river_tile' && el.type !== 'lake_tile')
      .sort((a, b) => (a.gx + a.gy) - (b.gx + b.gy)),
    [terrainElements]
  );

  const waterTerrain = useMemo(() => 
    terrainElements.filter(el => el.type === 'river_tile' || el.type === 'lake_tile'),
    [terrainElements]
  );

  const waterTileSet = useMemo(() => {
    const set = new Set<string>();
    for (const el of waterTerrain) {
      set.add(`${Math.floor(el.gx)},${Math.floor(el.gy)}`);
    }
    return set;
  }, [waterTerrain]);

  const originX = (gridSize * TILE_W) / 2;
  const originY = 50;

  useEffect(() => {
    preloadSprites();
  }, []);

  // Update render data ref on prop changes (no re-render, no loop restart)
  useEffect(() => {
    renderDataRef.current.fullGrid = fullGrid;
    renderDataRef.current.buildings = buildings;
    renderDataRef.current.gridSize = gridSize;
    renderDataRef.current.selectedBuilding = selectedBuilding;
    renderDataRef.current.ghostPos = ghostPos;
    renderDataRef.current.canPlaceGhost = canPlaceGhost;
    renderDataRef.current.productionReady = productionReady;
    renderDataRef.current.animatedCitizens = animatedCitizens;
    renderDataRef.current.complaints = complaints;
    renderDataRef.current.camera = camera;
    renderDataRef.current.zoom = zoom;
  });

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

  const findTerrainElement = useCallback((worldGx: number, worldGy: number): TerrainElement | null => {
    let closest: TerrainElement | null = null;
    let closestDist = 1.5;
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

  // Stable animation loop — runs once, reads refs
  useEffect(() => {
    let running = true;
    let lastFrame = 0;
    const TARGET_FPS = 30;
    const FRAME_TIME = 1000 / TARGET_FPS;

    const loop = (timestamp: number) => {
      if (!running) return;
      animFrameRef.current = requestAnimationFrame(loop);

      // Throttle to ~30fps
      if (timestamp - lastFrame < FRAME_TIME) return;
      lastFrame = timestamp;

      timeRef.current += 0.033; // ~30fps step
      render();
    };
    animFrameRef.current = requestAnimationFrame(loop);
    return () => { running = false; cancelAnimationFrame(animFrameRef.current); };
  }, []); // Empty deps — stable loop

  // Smoke & leaf effects — reduced frequency
  useEffect(() => {
    const interval = setInterval(() => {
      const rd = renderDataRef.current;
      for (const b of rd.buildings) {
        const def = BUILDING_DEFS[b.defId];
        if (!def) continue;
        if (def.id === 'workshop' || def.id === 'market' || def.id === 'windmill') {
          const cx = b.x + def.width / 2 - 0.5;
          const cy = b.y + def.height / 2 - 0.5;
          const { sx, sy } = gridToIso(cx, cy, TILE_W, TILE_H);
          addSmokeParticle(sx, sy - 20);
        }
        if (rd.productionReady.has(b.id)) {
          const cx = b.x + def.width / 2 - 0.5;
          const cy = b.y + def.height / 2 - 0.5;
          const { sx, sy } = gridToIso(cx, cy, TILE_W, TILE_H);
          addSparkle(sx, sy - 15);
        }
      }
      // Reduced leaf/firefly rate
      if (Math.random() < 0.15) {
        const gx = Math.random() * rd.gridSize;
        const gy = Math.random() * rd.gridSize;
        const { sx, sy } = gridToIso(gx, gy, TILE_W, TILE_H);
        addLeafParticle(sx, sy - 20);
      }
      if (Math.random() < 0.05) {
        const gx = Math.random() * rd.gridSize;
        const gy = Math.random() * rd.gridSize;
        const { sx, sy } = gridToIso(gx, gy, TILE_W, TILE_H);
        addFirefly(sx, sy - 10);
      }
    }, 1200);
    return () => clearInterval(interval);
  }, []);

  function render() {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d', { alpha: false });
    if (!ctx) return;

    const rd = renderDataRef.current;
    const dpr = window.devicePixelRatio || 1;
    const w = canvas.clientWidth;
    const h = canvas.clientHeight;

    // Only resize canvas buffer when dimensions actually change
    if (lastCanvasSize.current.w !== w || lastCanvasSize.current.h !== h) {
      canvas.width = w * dpr;
      canvas.height = h * dpr;
      lastCanvasSize.current = { w, h };
    }
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0);

    ctx.fillStyle = '#0e200a';
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.scale(rd.zoom, rd.zoom);
    ctx.translate(rd.camera.x - originX, rd.camera.y - originY);

    const time = timeRef.current;
    const gs = rd.gridSize;

    // Viewport culling bounds (in screen-space, approximate)
    const viewHalfW = (w / 2) / rd.zoom + 100;
    const viewHalfH = (h / 2) / rd.zoom + 100;
    const camX = rd.camera.x;
    const camY = rd.camera.y;

    const isVisible = (isoX: number, isoY: number) => {
      const screenX = isoX - originX + camX;
      const screenY = isoY - originY + camY;
      return Math.abs(screenX) < viewHalfW && Math.abs(screenY) < viewHalfH;
    };

    // Draw wilderness tiles (reduced border)
    const wb = PERF_WILDERNESS_BORDER;
    for (let y = -wb; y < gs + wb; y++) {
      for (let x = -wb; x < gs + wb; x++) {
        if (x >= 0 && x < gs && y >= 0 && y < gs) continue;
        if (waterTileSet.has(`${x},${y}`)) continue;
        const { sx, sy } = gridToIso(x, y, TILE_W, TILE_H);
        if (!isVisible(sx, sy)) continue;
        drawWildernessTile(ctx, x, y, TILE_W, TILE_H, gs);
      }
    }

    // Draw water tiles
    for (const el of waterTerrain) {
      const { sx, sy } = gridToIso(el.gx, el.gy, TILE_W, TILE_H);
      if (!isVisible(sx, sy)) continue;
      drawTerrainElement(ctx, el, TILE_W, TILE_H, time);
    }

    // Draw village tiles (flat colors — no gradients per tile)
    const fg = rd.fullGrid;
    if (fg) {
      for (let y = 0; y < gs; y++) {
        for (let x = 0; x < gs; x++) {
          const tile = fg[y]?.[x];
          if (!tile) continue;
          const { sx, sy } = gridToIso(x, y, TILE_W, TILE_H);
          if (!isVisible(sx, sy)) continue;
          drawIsoDiamond(ctx, sx, sy, tile.type, x, y, tile.buildingId, rd.buildings);
        }
      }
    }

    // Draw terrain elements (pre-sorted, with culling)
    for (const el of sortedNonWaterTerrain) {
      const { sx, sy } = gridToIso(el.gx, el.gy, TILE_W, TILE_H);
      if (!isVisible(sx, sy)) continue;
      drawTerrainElement(ctx, el, TILE_W, TILE_H, time);
    }

    // Draw ghost
    if (rd.ghostPos && rd.selectedBuilding) {
      const def = BUILDING_DEFS[rd.selectedBuilding];
      if (def) {
        for (let dy = 0; dy < def.height; dy++) {
          for (let dx = 0; dx < def.width; dx++) {
            const { sx, sy } = gridToIso(rd.ghostPos.x + dx, rd.ghostPos.y + dy, TILE_W, TILE_H);
            ctx.globalAlpha = 0.5;
            ctx.fillStyle = rd.canPlaceGhost ? '#00ff0066' : '#ff000066';
            drawDiamondPath(ctx, sx, sy);
            ctx.fill();
            ctx.globalAlpha = 1;
          }
        }
        const { sx, sy } = gridToIso(rd.ghostPos.x, rd.ghostPos.y, TILE_W, TILE_H);
        ctx.globalAlpha = 0.6;
        drawBuilding(ctx, def.id, sx, sy, 1, time);
        ctx.globalAlpha = 1;
      }
    }

    // Draw buildings sorted by depth
    const sorted = [...rd.buildings].sort((a, b) => (a.y + a.x) - (b.y + b.x));
    for (const b of sorted) {
      const def = BUILDING_DEFS[b.defId];
      if (!def) continue;

      const cx = b.x + def.width / 2 - 0.5;
      const cy = b.y + def.height / 2 - 0.5;
      const { sx, sy } = gridToIso(cx, cy, TILE_W, TILE_H);
      if (!isVisible(sx, sy)) continue;

      if (def.id === 'road' || def.id === 'wall') {
        drawBuilding(ctx, def.id, sx, sy, b.level, time);
        continue;
      }

      // Simple shadow (ellipse, no gradient)
      ctx.fillStyle = 'rgba(0,0,0,0.15)';
      ctx.beginPath();
      ctx.ellipse(sx + 3, sy + 5, 16 * def.width, 8 * def.height, 0, 0, Math.PI * 2);
      ctx.fill();

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
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 10px sans-serif';
        ctx.textAlign = 'center';
        ctx.fillText(`${b.level}`, sx + 14, sy - 19 - (b.level - 1) * 2);
      }

      // Production ready indicator
      if (rd.productionReady.has(b.id) && progress >= 1) {
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

    // Draw citizens (simplified)
    for (const citizen of rd.animatedCitizens) {
      const { sx, sy } = gridToIso(citizen.x, citizen.y, TILE_W, TILE_H);
      if (!isVisible(sx, sy)) continue;
      drawCitizen(ctx, sx, sy, citizen, time);
    }

    // Particles
    updateParticles();
    drawParticles(ctx);

    ctx.restore();

    // Lightweight atmosphere (skip on low zoom)
    if (rd.zoom > 0.6) {
      drawAtmosphere(ctx, w, h, time);
    }
  }

  function drawCitizen(ctx: CanvasRenderingContext2D, sx: number, sy: number, citizen: AnimatedCitizen, time: number) {
    const bobble = Math.sin(time * 8 + citizen.id) * 1;

    // Shadow
    ctx.fillStyle = 'rgba(0,0,0,0.12)';
    ctx.beginPath();
    ctx.ellipse(sx, sy + 2, 4, 1.8, 0, 0, Math.PI * 2);
    ctx.fill();

    // Body (single fill, no gradient)
    ctx.fillStyle = citizen.color;
    ctx.beginPath();
    ctx.ellipse(sx, sy - 3 + bobble, 3.5, 5, 0, 0, Math.PI * 2);
    ctx.fill();

    // Head
    const skinTones = ['#f5d0a0', '#e8c090', '#d4a878', '#c49468'];
    ctx.fillStyle = skinTones[Math.abs(citizen.id) % skinTones.length];
    ctx.beginPath();
    ctx.arc(sx, sy - 9.5 + bobble, 3, 0, Math.PI * 2);
    ctx.fill();

    // Eyes
    ctx.fillStyle = '#222';
    ctx.fillRect(sx - 1.5, sy - 10 + bobble, 1, 1);
    ctx.fillRect(sx + 0.5, sy - 10 + bobble, 1, 1);

    // Complaint bubble (simplified)
    if (citizen.complaint && citizen.complaintTimer > 0) {
      const alpha = Math.min(1, citizen.complaintTimer / 30);
      ctx.globalAlpha = alpha;
      ctx.fillStyle = 'rgba(255,255,255,0.9)';
      ctx.beginPath();
      ctx.roundRect(sx - 18, sy - 26 + bobble, 36, 13, 4);
      ctx.fill();
      ctx.fillStyle = '#333';
      ctx.font = '7px sans-serif';
      ctx.textAlign = 'center';
      ctx.fillText(citizen.complaint, sx, sy - 17 + bobble);
      ctx.globalAlpha = 1;
    }
  }

  function drawIsoDiamond(ctx: CanvasRenderingContext2D, sx: number, sy: number, type: string, x: number, y: number, buildingId: string | undefined, allBuildings: PlacedBuilding[]) {
    drawDiamondPath(ctx, sx, sy);

    if (type === 'road') {
      ctx.fillStyle = ROAD_COLOR;
      ctx.fill();
      ctx.strokeStyle = '#7a6a55';
      ctx.lineWidth = 0.4;
      ctx.stroke();
    } else if (type === 'wall') {
      ctx.fillStyle = WALL_COLOR;
      ctx.fill();
    } else {
      let isFarm = false;
      if (buildingId) {
        const b = allBuildings.find(b => b.id === buildingId);
        if (b && b.defId === 'farm') isFarm = true;
      }

      if (isFarm) {
        ctx.fillStyle = FARM_COLORS[(x + y) % FARM_COLORS.length];
      } else {
        ctx.fillStyle = GRASS_COLORS[(x + y * 3) % GRASS_COLORS.length];
      }
      ctx.fill();
      ctx.strokeStyle = '#3a6030';
      ctx.lineWidth = 0.3;
      ctx.stroke();
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
          const fg = renderDataRef.current.fullGrid;
          const tile = fg?.[pos.gy]?.[pos.gx];
          if (tile?.buildingId && !selectedBuilding) {
            const b = buildings.find(b => b.id === tile.buildingId);
            if (b) { onBuildingClick(b); setDragging(false); return; }
          }
          onTileClick(pos.gx, pos.gy);
        } else if (onTerrainClick) {
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

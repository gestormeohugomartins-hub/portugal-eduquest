import { useRef, useState, useCallback, useEffect, useMemo } from 'react';
import { GRID_SIZE, TILE_W, TILE_H, BUILDING_DEFS, PlacedBuilding, GridTile } from '@/lib/gameTypes';
import { gridToIso, applyBuildingsToGrid } from '@/lib/gridLogic';

interface IsometricCanvasProps {
  grid: GridTile[][];
  buildings: PlacedBuilding[];
  selectedBuilding: string | null;
  ghostPos: { x: number; y: number } | null;
  canPlaceGhost: boolean;
  onTileClick: (gx: number, gy: number) => void;
  onTileHover: (gx: number, gy: number) => void;
  onBuildingClick: (building: PlacedBuilding) => void;
}

// Colors
const GRASS_COLORS = ['#4a7c3f', '#4e8243', '#467838', '#528645'];
const ROAD_COLOR = '#a09070';
const ROAD_BORDER = '#7a6a55';
const WALL_COLOR = '#6b6b6b';
const WATER_COLOR = '#4a90d9';

export const IsometricCanvas = ({
  grid, buildings, selectedBuilding, ghostPos, canPlaceGhost,
  onTileClick, onTileHover, onBuildingClick,
}: IsometricCanvasProps) => {
  const canvasRef = useRef<HTMLCanvasElement>(null);
  const [camera, setCamera] = useState({ x: 0, y: 0 });
  const [zoom, setZoom] = useState(1);
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [camStart, setCamStart] = useState({ x: 0, y: 0 });

  const fullGrid = useMemo(() => applyBuildingsToGrid(grid, buildings), [grid, buildings]);

  // Center offset
  const originX = (GRID_SIZE * TILE_W) / 2;
  const originY = 50;

  const screenToGrid = useCallback((clientX: number, clientY: number) => {
    const canvas = canvasRef.current;
    if (!canvas) return null;
    const rect = canvas.getBoundingClientRect();
    const mx = (clientX - rect.left - canvas.width / 2) / zoom - camera.x + originX;
    const my = (clientY - rect.top - canvas.height / 2) / zoom - camera.y + originY;
    // Invert iso transform
    const gx = Math.floor((mx / (TILE_W / 2) + my / (TILE_H / 2)) / 2);
    const gy = Math.floor((my / (TILE_H / 2) - mx / (TILE_W / 2)) / 2);
    if (gx >= 0 && gx < GRID_SIZE && gy >= 0 && gy < GRID_SIZE) return { gx, gy };
    return null;
  }, [camera, zoom]);

  // Draw
  useEffect(() => {
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
    
    // Background
    ctx.fillStyle = '#2d4a1e';
    ctx.fillRect(0, 0, w, h);

    ctx.save();
    ctx.translate(w / 2, h / 2);
    ctx.scale(zoom, zoom);
    ctx.translate(camera.x - originX, camera.y - originY);

    // Draw tiles
    for (let y = 0; y < GRID_SIZE; y++) {
      for (let x = 0; x < GRID_SIZE; x++) {
        const tile = fullGrid[y]?.[x];
        if (!tile) continue;
        const { sx, sy } = gridToIso(x, y, TILE_W, TILE_H);
        
        drawIsoDiamond(ctx, sx, sy, tile.type, x, y);
      }
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
        // Ghost emoji
        const { sx, sy } = gridToIso(ghostPos.x, ghostPos.y, TILE_W, TILE_H);
        ctx.globalAlpha = 0.7;
        ctx.font = `${20 + (def.width - 1) * 8}px serif`;
        ctx.textAlign = 'center';
        ctx.fillText(def.emoji, sx, sy - 8);
        ctx.globalAlpha = 1;
      }
    }

    // Draw buildings (sorted by y for depth)
    const sorted = [...buildings].sort((a, b) => (a.y + a.x) - (b.y + b.x));
    for (const b of sorted) {
      const def = BUILDING_DEFS[b.defId];
      if (!def || def.id === 'road' || def.id === 'wall') continue;
      
      // Center of building
      const cx = b.x + def.width / 2 - 0.5;
      const cy = b.y + def.height / 2 - 0.5;
      const { sx, sy } = gridToIso(cx, cy, TILE_W, TILE_H);
      
      // Shadow
      ctx.fillStyle = 'rgba(0,0,0,0.2)';
      ctx.beginPath();
      ctx.ellipse(sx, sy + 4, 16 * def.width, 8 * def.height, 0, 0, Math.PI * 2);
      ctx.fill();
      
      // Building emoji with size based on building size and level
      const baseSize = 22 + (def.width - 1) * 10;
      const levelSize = baseSize + (b.level - 1) * 3;
      ctx.font = `${levelSize}px serif`;
      ctx.textAlign = 'center';
      ctx.fillText(def.emoji, sx, sy - 6 - (b.level - 1) * 2);
      
      // Level badge
      if (b.level > 1) {
        ctx.fillStyle = '#f5a623';
        ctx.beginPath();
        ctx.arc(sx + 12, sy - 18 - (b.level - 1) * 2, 7, 0, Math.PI * 2);
        ctx.fill();
        ctx.fillStyle = '#fff';
        ctx.font = 'bold 9px sans-serif';
        ctx.fillText(`${b.level}`, sx + 12, sy - 15 - (b.level - 1) * 2);
      }
    }

    ctx.restore();
  }, [fullGrid, buildings, camera, zoom, ghostPos, selectedBuilding, canPlaceGhost]);

  function drawIsoDiamond(ctx: CanvasRenderingContext2D, sx: number, sy: number, type: string, x: number, y: number) {
    let color: string;
    if (type === 'road') color = ROAD_COLOR;
    else if (type === 'wall') color = WALL_COLOR;
    else if (type === 'water') color = WATER_COLOR;
    else color = GRASS_COLORS[(x + y * 3) % GRASS_COLORS.length];

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

  // Handlers
  const handleMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setCamStart({ ...camera });
  };

  const handleMouseMove = (e: React.MouseEvent) => {
    if (dragging) {
      const dx = (e.clientX - dragStart.x) / zoom;
      const dy = (e.clientY - dragStart.y) / zoom;
      setCamera({ x: camStart.x + dx, y: camStart.y + dy });
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
          // Check if clicking existing building
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

  // Touch support
  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setDragging(true);
      setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
      setCamStart({ ...camera });
    }
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (dragging && e.touches.length === 1) {
      const dx = (e.touches[0].clientX - dragStart.x) / zoom;
      const dy = (e.touches[0].clientY - dragStart.y) / zoom;
      setCamera({ x: camStart.x + dx, y: camStart.y + dy });
    }
  };
  const handleTouchEnd = (e: React.TouchEvent) => {
    if (dragging && e.changedTouches.length === 1) {
      const t = e.changedTouches[0];
      const dist = Math.abs(t.clientX - dragStart.x) + Math.abs(t.clientY - dragStart.y);
      if (dist < 10) {
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

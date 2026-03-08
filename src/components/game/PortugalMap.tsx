import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ZoomIn, ZoomOut, RotateCcw, Users, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { getDistrictPaths, districtLabels } from '@/lib/portugalMapUtils';

interface PlayerInDistrict {
  district: string;
  count: number;
  players: { id: string; display_name: string; nickname: string | null; village_level: number; xp: number }[];
}

interface PortugalMapProps {
  studentId?: string;
  district?: string | null;
}

// The original SVG group has transform="translate(-65,0)" and viewBox "0 0 190 366.667"
// Mainland paths are in coordinate space ~75-245 x, 5-360 y
// After translate(-65,0), they render at ~10-180 x, 5-360 y
// We'll use a viewBox that places islands on the left and mainland on the right
const VIEWBOX = "-220 -10 420 400";
const MAINLAND_TRANSFORM = "translate(-65, 0)";

export const PortugalMap = ({ studentId, district: myDistrict }: PortugalMapProps) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [districtData, setDistrictData] = useState<Record<string, PlayerInDistrict>>({});
  const [loading, setLoading] = useState(true);
  const [hoveredDistrict, setHoveredDistrict] = useState<string | null>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const [lastTouchDist, setLastTouchDist] = useState<number | null>(null);

  const districtPaths = useMemo(() => getDistrictPaths(), []);

  useEffect(() => {
    const fetchPlayers = async () => {
      const { data } = await supabase
        .from('students')
        .select('id, display_name, nickname, village_level, xp, district')
        .not('district', 'is', null);
      if (data) {
        const grouped: Record<string, PlayerInDistrict> = {};
        for (const player of data) {
          const d = player.district as string;
          if (!grouped[d]) grouped[d] = { district: d, count: 0, players: [] };
          grouped[d].count++;
          grouped[d].players.push({ id: player.id, display_name: player.display_name, nickname: player.nickname, village_level: player.village_level, xp: player.xp });
        }
        for (const d of Object.values(grouped)) d.players.sort((a, b) => b.xp - a.xp);
        setDistrictData(grouped);
      }
      setLoading(false);
    };
    fetchPlayers();
  }, []);

  const totalPlayers = useMemo(() => Object.values(districtData).reduce((sum, d) => sum + d.count, 0), [districtData]);

  const handleZoomIn = () => setZoom(z => Math.min(4, z * 1.4));
  const handleZoomOut = () => setZoom(z => Math.max(0.5, z / 1.4));
  const handleReset = () => { setZoom(1); setPan({ x: 0, y: 0 }); setSelectedDistrict(null); };

  const handleMouseDown = (e: React.MouseEvent) => {
    setDragging(true);
    setDragStart({ x: e.clientX, y: e.clientY });
    setPanStart({ ...pan });
  };
  const handleMouseMove = (e: React.MouseEvent) => {
    if (!dragging) return;
    setPan({ x: panStart.x + (e.clientX - dragStart.x) / zoom, y: panStart.y + (e.clientY - dragStart.y) / zoom });
  };
  const handleMouseUp = () => setDragging(false);

  const handleWheel = useCallback((e: WheelEvent) => {
    e.preventDefault();
    setZoom(z => Math.max(0.5, Math.min(4, z - e.deltaY * 0.002)));
  }, []);

  useEffect(() => {
    const el = containerRef.current;
    if (!el) return;
    el.addEventListener('wheel', handleWheel, { passive: false });
    return () => el.removeEventListener('wheel', handleWheel);
  }, [handleWheel]);

  const handleTouchStart = (e: React.TouchEvent) => {
    if (e.touches.length === 1) {
      setDragging(true);
      setDragStart({ x: e.touches[0].clientX, y: e.touches[0].clientY });
      setPanStart({ ...pan });
    } else if (e.touches.length === 2) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      setLastTouchDist(Math.sqrt(dx * dx + dy * dy));
    }
  };
  const handleTouchMove = (e: React.TouchEvent) => {
    if (e.touches.length === 1 && dragging) {
      setPan({ x: panStart.x + (e.touches[0].clientX - dragStart.x) / zoom, y: panStart.y + (e.touches[0].clientY - dragStart.y) / zoom });
    } else if (e.touches.length === 2 && lastTouchDist !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      setZoom(z => Math.max(0.5, Math.min(4, z * (dist / lastTouchDist))));
      setLastTouchDist(dist);
    }
  };
  const handleTouchEnd = () => { setDragging(false); setLastTouchDist(null); };

  const handleDistrictClick = (key: string) => {
    if (selectedDistrict === key) {
      const info = districtLabels[key];
      if (info) {
        setZoom(2.5);
        setPan({ x: -(info.x - 0), y: -(info.y - 180) });
      }
    } else {
      setSelectedDistrict(key);
    }
  };

  const isIsland = (key: string) => key === 'acores' || key === 'madeira';
  const showPlayerCount = zoom >= 1.2;
  const showPlayerNames = zoom >= 2.5;

  return (
    <div className="px-2 h-[calc(100vh-10rem)] flex flex-col">
      {/* Header */}
      <div className="flex items-center justify-between mb-2">
        <div>
          <h2 className="font-display text-lg font-bold">🗺️ Mapa de Portugal</h2>
          <p className="font-body text-xs text-muted-foreground">
            {totalPlayers} jogador{totalPlayers !== 1 ? 'es' : ''} em {Object.keys(districtData).length} distritos
          </p>
        </div>
        <div className="flex gap-1">
          <Button size="icon" variant="outline" className="h-8 w-8" onClick={handleZoomIn}><ZoomIn className="w-4 h-4" /></Button>
          <Button size="icon" variant="outline" className="h-8 w-8" onClick={handleZoomOut}><ZoomOut className="w-4 h-4" /></Button>
          <Button size="icon" variant="outline" className="h-8 w-8" onClick={handleReset}><RotateCcw className="w-4 h-4" /></Button>
        </div>
      </div>

      {/* Map Container */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden rounded-xl border-2 border-border cursor-grab active:cursor-grabbing touch-none select-none"
        style={{ background: 'linear-gradient(180deg, hsl(210 50% 25%) 0%, hsl(210 60% 18%) 100%)' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => setDragging(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <svg
          viewBox={VIEWBOX}
          className="w-full h-full"
          style={{
            transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
            transformOrigin: 'center center',
          }}
        >
          <defs>
            <linearGradient id="oceanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(210, 50%, 28%)" />
              <stop offset="100%" stopColor="hsl(210, 60%, 18%)" />
            </linearGradient>
            <filter id="selectedGlow" x="-30%" y="-30%" width="160%" height="160%">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feFlood floodColor="hsl(45, 90%, 60%)" floodOpacity="0.6" result="color" />
              <feComposite in="color" in2="blur" operator="in" result="glow" />
              <feMerge><feMergeNode in="glow" /><feMergeNode in="glow" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="myGlow" x="-20%" y="-20%" width="140%" height="140%">
              <feGaussianBlur stdDeviation="2" result="blur" />
              <feFlood floodColor="hsl(45, 80%, 55%)" floodOpacity="0.4" result="color" />
              <feComposite in="color" in2="blur" operator="in" result="glow" />
              <feMerge><feMergeNode in="glow" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <filter id="hoverGlow" x="-15%" y="-15%" width="130%" height="130%">
              <feGaussianBlur stdDeviation="1.5" result="blur" />
              <feFlood floodColor="hsl(140, 50%, 50%)" floodOpacity="0.3" result="color" />
              <feComposite in="color" in2="blur" operator="in" result="glow" />
              <feMerge><feMergeNode in="glow" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
            <style>{`
              @keyframes districtBounceIn {
                0% { transform: scale(0.96); opacity: 0.5; }
                50% { transform: scale(1.02); }
                100% { transform: scale(1); opacity: 1; }
              }
              @keyframes districtPulse {
                0%, 100% { opacity: 1; }
                50% { opacity: 0.75; }
              }
              @keyframes badgePop {
                0% { transform: scale(0); opacity: 0; }
                60% { transform: scale(1.2); }
                100% { transform: scale(1); opacity: 1; }
              }
              .district-path {
                transition: fill 0.35s ease, stroke 0.3s ease, stroke-width 0.3s ease, opacity 0.3s ease;
                cursor: pointer;
              }
              .district-path:hover { filter: url(#hoverGlow); }
              .district-selected {
                animation: districtBounceIn 0.4s ease-out forwards;
                filter: url(#selectedGlow);
              }
              .district-selected-pulse { animation: districtPulse 2s ease-in-out infinite; }
              .district-mine { filter: url(#myGlow); }
              .badge-pop { animation: badgePop 0.3s ease-out forwards; }
              .district-label { transition: fill 0.3s ease; pointer-events: none; }
            `}</style>
          </defs>

          <rect x="-220" y="-10" width="420" height="400" fill="url(#oceanGrad)" />

          {/* Ocean wave lines */}
          {[60, 140, 240, 320].map((y, i) => (
            <path key={i} d={`M-220,${y} Q-70,${y + (i % 2 ? 6 : -6)} 80,${y} Q150,${y + (i % 2 ? -6 : 6)} 200,${y}`} fill="none" stroke="hsl(210, 40%, 30%)" strokeWidth="0.4" opacity="0.4" />
          ))}

          {/* Separator between islands and mainland */}
          <line x1="-45" y1="-5" x2="-45" y2="385" stroke="hsl(210, 30%, 35%)" strokeWidth="0.6" strokeDasharray="4,3" opacity="0.5" />
          <text x="-40" y="200" fill="hsl(210, 30%, 50%)" fontSize="7" fontStyle="italic" opacity="0.6" transform="rotate(90, -40, 200)">Oceano Atlântico</text>

          {/* Island headers */}
          <text x="-155" y="32" textAnchor="middle" fill="hsl(45, 60%, 70%)" fontSize="8" fontWeight="bold" opacity="0.8">Açores</text>
          <text x="-155" y="175" textAnchor="middle" fill="hsl(45, 60%, 70%)" fontSize="8" fontWeight="bold" opacity="0.8">Madeira</text>

          {/* Mainland districts (using real SVG paths with original transform) */}
          <g transform={MAINLAND_TRANSFORM}>
            {Object.entries(districtPaths).filter(([key]) => !isIsland(key)).map(([key, pathD]) => {
              const isSelected = selectedDistrict === key;
              const isMine = myDistrict === key;
              const isHovered = hoveredDistrict === key;
              const count = districtData[key]?.count || 0;
              const intensity = Math.min(1, count / 10);

              const fillColor = isSelected
                ? 'hsl(140, 55%, 42%)'
                : isMine
                  ? 'hsl(45, 70%, 45%)'
                  : count > 0
                    ? `hsl(140, ${25 + intensity * 35}%, ${28 + intensity * 15}%)`
                    : 'hsl(140, 15%, 25%)';

              const strokeColor = isSelected ? 'hsl(45, 90%, 65%)' : isMine ? 'hsl(45, 80%, 55%)' : 'hsl(140, 25%, 40%)';

              const classNames = [
                'district-path',
                isSelected ? 'district-selected district-selected-pulse' : '',
                !isSelected && isMine ? 'district-mine' : '',
              ].filter(Boolean).join(' ');

              return (
                <path
                  key={key}
                  d={pathD}
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth={isSelected ? 1.5 : isMine ? 0.8 : 0.25}
                  strokeLinejoin="round"
                  opacity={isSelected ? 1 : selectedDistrict && !isSelected ? 0.55 : 0.92}
                  className={classNames}
                  onClick={() => handleDistrictClick(key)}
                  onMouseEnter={() => setHoveredDistrict(key)}
                  onMouseLeave={() => setHoveredDistrict(null)}
                />
              );
            })}
          </g>

          {/* Island districts */}
          {Object.entries(districtPaths).filter(([key]) => isIsland(key)).map(([key, pathD]) => {
            const isSelected = selectedDistrict === key;
            const isMine = myDistrict === key;
            const count = districtData[key]?.count || 0;
            const intensity = Math.min(1, count / 10);

            const fillColor = isSelected
              ? 'hsl(140, 55%, 42%)'
              : isMine
                ? 'hsl(45, 70%, 45%)'
                : count > 0
                  ? `hsl(140, ${25 + intensity * 35}%, ${28 + intensity * 15}%)`
                  : 'hsl(140, 15%, 25%)';

            const strokeColor = isSelected ? 'hsl(45, 90%, 65%)' : isMine ? 'hsl(45, 80%, 55%)' : 'hsl(140, 25%, 40%)';

            return (
              <path
                key={key}
                d={pathD}
                fill={fillColor}
                stroke={strokeColor}
                strokeWidth={isSelected ? 1 : 0.5}
                strokeLinejoin="round"
                opacity={isSelected ? 1 : selectedDistrict && !isSelected ? 0.55 : 0.92}
                className={`district-path ${isSelected ? 'district-selected district-selected-pulse' : ''} ${!isSelected && isMine ? 'district-mine' : ''}`}
                onClick={() => handleDistrictClick(key)}
                onMouseEnter={() => setHoveredDistrict(key)}
                onMouseLeave={() => setHoveredDistrict(null)}
              />
            );
          })}

          {/* District labels */}
          <g transform={MAINLAND_TRANSFORM}>
            {Object.entries(districtLabels).filter(([key]) => !isIsland(key)).map(([key, info]) => {
              const isSelected = selectedDistrict === key;
              const isMine = myDistrict === key;
              if (!(zoom >= 1.2 || isSelected || isMine)) return null;
              const count = districtData[key]?.count || 0;

              // Offset to roughly match the translate(-65) paths
              const lx = info.x + 65;
              const ly = info.y;

              return (
                <g key={key}>
                  <text
                    x={lx} y={ly}
                    textAnchor="middle"
                    fill={isSelected ? 'hsl(45, 90%, 85%)' : isMine ? 'hsl(45, 80%, 75%)' : 'hsl(140, 20%, 75%)'}
                    fontSize={isSelected ? 8 : 6}
                    fontWeight={isSelected || isMine ? 'bold' : 'normal'}
                    className="district-label"
                    style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.9)' }}
                  >
                    {info.label}
                  </text>
                  {count > 0 && (showPlayerCount || isSelected) && (
                    <g className={isSelected ? 'badge-pop' : ''}>
                      <rect
                        x={lx + 12} y={ly - 10}
                        width={count >= 100 ? 20 : count >= 10 ? 16 : 12}
                        height={10} rx={5}
                        fill={isSelected ? 'hsl(45, 90%, 55%)' : 'hsl(45, 80%, 50%)'}
                        stroke="hsl(45, 60%, 30%)" strokeWidth="0.3"
                      />
                      <text
                        x={lx + 12 + (count >= 100 ? 10 : count >= 10 ? 8 : 6)}
                        y={ly - 2.5}
                        textAnchor="middle" fill="hsl(45, 10%, 10%)" fontSize="6" fontWeight="bold"
                      >{count}</text>
                    </g>
                  )}
                </g>
              );
            })}
          </g>

          {/* Island labels */}
          {Object.entries(districtLabels).filter(([key]) => isIsland(key)).map(([key, info]) => {
            const isSelected = selectedDistrict === key;
            const isMine = myDistrict === key;
            if (!(zoom >= 1.2 || isSelected || isMine)) return null;
            const count = districtData[key]?.count || 0;

            return (
              <g key={key}>
                <text
                  x={info.x} y={info.y}
                  textAnchor="middle"
                  fill={isSelected ? 'hsl(45, 90%, 85%)' : isMine ? 'hsl(45, 80%, 75%)' : 'hsl(140, 20%, 75%)'}
                  fontSize={isSelected ? 8 : 6}
                  fontWeight={isSelected || isMine ? 'bold' : 'normal'}
                  className="district-label"
                  style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.9)' }}
                >
                  {info.label}
                </text>
                {count > 0 && (showPlayerCount || isSelected) && (
                  <g className={isSelected ? 'badge-pop' : ''}>
                    <rect
                      x={info.x + 12} y={info.y - 10}
                      width={count >= 100 ? 20 : count >= 10 ? 16 : 12}
                      height={10} rx={5}
                      fill={isSelected ? 'hsl(45, 90%, 55%)' : 'hsl(45, 80%, 50%)'}
                      stroke="hsl(45, 60%, 30%)" strokeWidth="0.3"
                    />
                    <text
                      x={info.x + 12 + (count >= 100 ? 10 : count >= 10 ? 8 : 6)}
                      y={info.y - 2.5}
                      textAnchor="middle" fill="hsl(45, 10%, 10%)" fontSize="6" fontWeight="bold"
                    >{count}</text>
                  </g>
                )}
              </g>
            );
          })}

          {/* Player dots at high zoom */}
          <g transform={MAINLAND_TRANSFORM}>
            {showPlayerNames && Object.entries(districtLabels).filter(([key]) => !isIsland(key) && districtData[key]).map(([key, info]) => {
              const playerData = districtData[key];
              const lx = info.x + 65;
              const ly = info.y;
              return playerData.players.slice(0, 15).map((player, i) => {
                const angle = (i / Math.max(1, playerData.players.length)) * Math.PI * 2;
                const radius = 10 + (i % 3) * 5;
                const px = lx + Math.cos(angle) * radius;
                const py = ly + Math.sin(angle) * radius;
                const isMe = player.id === studentId;
                return (
                  <g key={player.id}>
                    <circle cx={px} cy={py} r={isMe ? 2.5 : 1.8} fill={isMe ? 'hsl(45, 90%, 55%)' : 'hsl(200, 70%, 60%)'} stroke="#fff" strokeWidth="0.3" />
                    {zoom >= 3 && (
                      <text x={px} y={py + 5} textAnchor="middle" fill="#e0e0e0" fontSize="3" style={{ textShadow: '0.5px 0.5px 1px rgba(0,0,0,0.9)' }}>
                        {player.nickname || player.display_name.split(' ')[0]}
                      </text>
                    )}
                  </g>
                );
              });
            })}
          </g>
        </svg>

        {/* Mini-map (visible when zoom >= 2) */}
        {zoom >= 2 && (
          <div className="absolute top-2 right-2 w-24 h-32 bg-card/70 backdrop-blur-sm rounded-lg border border-border overflow-hidden">
            <svg viewBox={VIEWBOX} className="w-full h-full">
              <rect x="-220" y="-10" width="420" height="400" fill="hsl(210, 50%, 22%)" />
              <g transform={MAINLAND_TRANSFORM}>
                {Object.entries(districtPaths).filter(([key]) => !isIsland(key)).map(([key, pathD]) => (
                  <path key={key} d={pathD} fill={selectedDistrict === key ? 'hsl(140, 55%, 42%)' : myDistrict === key ? 'hsl(45, 70%, 45%)' : 'hsl(140, 20%, 30%)'} stroke="hsl(140, 25%, 40%)" strokeWidth="0.2" />
                ))}
              </g>
              {Object.entries(districtPaths).filter(([key]) => isIsland(key)).map(([key, pathD]) => (
                <path key={key} d={pathD} fill="hsl(140, 20%, 30%)" stroke="hsl(140, 25%, 40%)" strokeWidth="0.2" />
              ))}
              {/* Viewport indicator */}
              <rect
                x={-pan.x - 210 / zoom}
                y={-pan.y - 200 / zoom}
                width={420 / zoom}
                height={400 / zoom}
                fill="none"
                stroke="hsl(45, 90%, 60%)"
                strokeWidth={1.5}
                rx={2}
                opacity={0.8}
              />
            </svg>
          </div>
        )}

        {/* Zoom indicator */}
        <div className="absolute bottom-2 left-2 bg-card/80 backdrop-blur-sm rounded px-2 py-1 text-xs font-body text-muted-foreground border border-border">
          Zoom: {zoom.toFixed(1)}x
        </div>
        <div className="absolute bottom-2 right-2 bg-card/80 backdrop-blur-sm rounded px-2 py-1 text-[10px] font-body text-muted-foreground border border-border">
          Clica num distrito • 2x para zoom
        </div>

        {/* Hovered district tooltip */}
        {hoveredDistrict && !selectedDistrict && districtLabels[hoveredDistrict] && (
          <div className="absolute top-2 left-1/2 -translate-x-1/2 bg-card/90 backdrop-blur-sm rounded-lg px-3 py-1.5 border border-border animate-fade-in">
            <span className="font-display text-xs font-bold">{districtLabels[hoveredDistrict].label}</span>
            <span className="font-body text-[10px] text-muted-foreground ml-2">
              {districtData[hoveredDistrict]?.count || 0} jogadores
            </span>
          </div>
        )}

        {/* Legend */}
        <div className="absolute top-2 left-2 bg-card/80 backdrop-blur-sm rounded px-2 py-1.5 text-[10px] font-body text-muted-foreground border border-border space-y-0.5">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: 'hsl(45, 70%, 45%)' }} />
            <span>O teu distrito</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: 'hsl(140, 55%, 42%)' }} />
            <span>Selecionado</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: 'hsl(140, 50%, 36%)' }} />
            <span>Com jogadores</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: 'hsl(140, 15%, 25%)' }} />
            <span>Sem jogadores</span>
          </div>
        </div>
      </div>

      {/* Selected District Panel */}
      {selectedDistrict && (
        <div className="mt-2 bg-card rounded-xl border border-border p-3 max-h-40 overflow-y-auto animate-fade-in">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-display text-sm font-bold flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-primary" />
              {districtLabels[selectedDistrict]?.label}
              {myDistrict === selectedDistrict && (
                <span className="text-xs bg-gold/20 text-gold px-1.5 py-0.5 rounded font-body">O teu distrito!</span>
              )}
            </h3>
            <div className="flex items-center gap-1 text-xs text-muted-foreground font-body">
              <Users className="w-3.5 h-3.5" />
              {districtData[selectedDistrict]?.count || 0} jogadores
            </div>
          </div>
          {districtData[selectedDistrict]?.players.length ? (
            <div className="space-y-1">
              {districtData[selectedDistrict].players.slice(0, 10).map((player, i) => (
                <div
                  key={player.id}
                  className={`flex items-center justify-between text-xs font-body px-2 py-1 rounded animate-fade-in ${player.id === studentId ? 'bg-gold/10 border border-gold/30' : 'bg-muted/30'}`}
                  style={{ animationDelay: `${i * 50}ms` }}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground font-bold w-4">#{i + 1}</span>
                    <span className="font-semibold">{player.nickname || player.display_name}{player.id === studentId && ' (Tu)'}</span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span>Nv.{player.village_level}</span>
                    <span>{player.xp} XP</span>
                  </div>
                </div>
              ))}
              {districtData[selectedDistrict].players.length > 10 && (
                <p className="text-[10px] text-muted-foreground text-center">+{districtData[selectedDistrict].players.length - 10} mais...</p>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground font-body text-center py-2">Nenhum jogador neste distrito ainda. Sê o primeiro! 🏆</p>
          )}
        </div>
      )}
    </div>
  );
};

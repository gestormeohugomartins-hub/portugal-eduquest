import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ZoomIn, ZoomOut, RotateCcw, Users, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

// Realistic district SVG paths (geographically accurate, simplified)
// Layout: Islands (Azores/Madeira) on the LEFT, mainland on the RIGHT
// ViewBox: 0 0 600 500
const districtPaths: Record<string, { path: string; labelX: number; labelY: number; label: string }> = {
  // === ISLANDS (LEFT SIDE) ===
  acores: {
    label: "Açores",
    labelX: 75, labelY: 105,
    // Archipelago shape - multiple small islands
    path: "M30,60 L45,55 L55,58 L60,65 L55,72 L40,75 L30,70Z M70,70 L85,65 L95,68 L100,75 L95,82 L80,85 L70,80Z M105,55 L120,50 L130,53 L135,60 L130,67 L115,70 L105,65Z M50,90 L65,85 L75,88 L80,95 L75,102 L60,105 L50,100Z M90,95 L105,90 L115,93 L120,100 L115,107 L100,110 L90,105Z",
  },
  madeira: {
    label: "Madeira",
    labelX: 75, labelY: 260,
    // Madeira + Porto Santo
    path: "M40,235 L55,228 L90,230 L110,238 L108,250 L90,258 L55,260 L40,252Z M65,270 L80,265 L95,268 L100,275 L95,282 L80,285 L65,280Z",
  },
  // === MAINLAND (RIGHT SIDE) ===
  viana_castelo: {
    label: "V. Castelo",
    labelX: 255, labelY: 60,
    path: "M230,30 L265,25 L280,35 L285,55 L275,70 L260,75 L240,68 L235,55 L230,42Z",
  },
  braga: {
    label: "Braga",
    labelX: 305, labelY: 55,
    path: "M280,35 L310,28 L330,35 L335,50 L328,65 L310,72 L290,68 L275,70 L285,55Z",
  },
  vila_real: {
    label: "Vila Real",
    labelX: 355, labelY: 55,
    path: "M330,35 L365,25 L390,30 L395,50 L385,65 L365,72 L345,68 L328,65 L335,50Z",
  },
  braganca: {
    label: "Bragança",
    labelX: 440, labelY: 45,
    path: "M390,30 L420,20 L465,18 L480,25 L485,45 L475,62 L450,68 L420,65 L395,50Z",
  },
  porto: {
    label: "Porto",
    labelX: 265, labelY: 100,
    path: "M235,75 L260,75 L290,68 L310,72 L305,90 L295,105 L275,110 L250,105 L238,95 L230,85Z",
  },
  aveiro: {
    label: "Aveiro",
    labelX: 255, labelY: 140,
    path: "M225,100 L250,105 L275,110 L280,130 L270,150 L250,155 L230,148 L220,130Z",
  },
  viseu: {
    label: "Viseu",
    labelX: 330, labelY: 110,
    path: "M295,75 L328,65 L365,72 L380,85 L375,105 L360,118 L335,125 L310,120 L295,110 L295,90Z",
  },
  guarda: {
    label: "Guarda",
    labelX: 415, labelY: 110,
    path: "M365,72 L420,65 L475,62 L478,85 L470,108 L445,120 L415,125 L390,118 L375,105 L380,85Z",
  },
  coimbra: {
    label: "Coimbra",
    labelX: 285, labelY: 175,
    path: "M240,155 L270,150 L310,120 L335,125 L330,150 L315,170 L290,180 L265,185 L245,175Z",
  },
  castelo_branco: {
    label: "C. Branco",
    labelX: 395, labelY: 165,
    path: "M315,130 L360,118 L415,125 L445,120 L460,140 L455,170 L430,185 L395,190 L360,185 L330,175 L315,160Z",
  },
  leiria: {
    label: "Leiria",
    labelX: 255, labelY: 215,
    path: "M225,190 L245,175 L265,185 L290,180 L300,200 L290,220 L270,230 L245,228 L228,215Z",
  },
  santarem: {
    label: "Santarém",
    labelX: 325, labelY: 225,
    path: "M280,195 L315,170 L345,180 L370,190 L380,210 L370,235 L345,245 L315,248 L290,240 L275,225Z",
  },
  portalegre: {
    label: "Portalegre",
    labelX: 430, labelY: 215,
    path: "M370,190 L410,185 L455,170 L470,185 L475,210 L460,230 L435,240 L405,238 L380,230 L370,210Z",
  },
  lisboa: {
    label: "Lisboa",
    labelX: 250, labelY: 270,
    path: "M220,245 L245,228 L275,235 L290,250 L285,270 L270,285 L248,290 L230,282 L218,265Z",
  },
  setubal: {
    label: "Setúbal",
    labelX: 280, labelY: 310,
    path: "M248,290 L270,285 L300,290 L320,300 L325,320 L310,340 L285,345 L260,338 L245,320 L240,300Z",
  },
  evora: {
    label: "Évora",
    labelX: 355, labelY: 290,
    path: "M300,255 L345,245 L405,238 L420,255 L415,280 L400,300 L370,310 L340,308 L315,300 L295,285Z",
  },
  beja: {
    label: "Beja",
    labelX: 350, labelY: 370,
    path: "M285,340 L315,330 L370,310 L400,300 L420,320 L430,350 L420,380 L395,400 L355,410 L315,405 L290,390 L275,365Z",
  },
  faro: {
    label: "Faro",
    labelX: 360, labelY: 440,
    path: "M290,410 L330,405 L395,400 L430,410 L450,425 L445,445 L425,460 L380,470 L330,468 L290,458 L275,440 L278,420Z",
  },
};

// Mapping from our district keys to display
const districtKeyToId: Record<string, string> = {
  viana_castelo: "viana_castelo",
  braga: "braga",
  vila_real: "vila_real",
  braganca: "braganca",
  porto: "porto",
  aveiro: "aveiro",
  viseu: "viseu",
  guarda: "guarda",
  coimbra: "coimbra",
  castelo_branco: "castelo_branco",
  leiria: "leiria",
  santarem: "santarem",
  portalegre: "portalegre",
  lisboa: "lisboa",
  setubal: "setubal",
  evora: "evora",
  beja: "beja",
  faro: "faro",
  acores: "acores",
  madeira: "madeira",
};

interface PlayerInDistrict {
  district: string;
  count: number;
  players: { id: string; display_name: string; nickname: string | null; village_level: number; xp: number }[];
}

interface PortugalMapProps {
  studentId?: string;
  district?: string | null;
}

export const PortugalMap = ({ studentId, district: myDistrict }: PortugalMapProps) => {
  const [zoom, setZoom] = useState(1);
  const [pan, setPan] = useState({ x: 0, y: 0 });
  const [dragging, setDragging] = useState(false);
  const [dragStart, setDragStart] = useState({ x: 0, y: 0 });
  const [panStart, setPanStart] = useState({ x: 0, y: 0 });
  const [selectedDistrict, setSelectedDistrict] = useState<string | null>(null);
  const [districtData, setDistrictData] = useState<Record<string, PlayerInDistrict>>({});
  const [loading, setLoading] = useState(true);
  const containerRef = useRef<HTMLDivElement>(null);

  // Touch support
  const [lastTouchDist, setLastTouchDist] = useState<number | null>(null);

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
          grouped[d].players.push({
            id: player.id,
            display_name: player.display_name,
            nickname: player.nickname,
            village_level: player.village_level,
            xp: player.xp,
          });
        }
        for (const d of Object.values(grouped)) {
          d.players.sort((a, b) => b.xp - a.xp);
        }
        setDistrictData(grouped);
      }
      setLoading(false);
    };
    fetchPlayers();
  }, []);

  const totalPlayers = useMemo(() =>
    Object.values(districtData).reduce((sum, d) => sum + d.count, 0),
    [districtData]
  );

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
    setPan({
      x: panStart.x + (e.clientX - dragStart.x) / zoom,
      y: panStart.y + (e.clientY - dragStart.y) / zoom,
    });
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

  // Touch handlers
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
      setPan({
        x: panStart.x + (e.touches[0].clientX - dragStart.x) / zoom,
        y: panStart.y + (e.touches[0].clientY - dragStart.y) / zoom,
      });
    } else if (e.touches.length === 2 && lastTouchDist !== null) {
      const dx = e.touches[0].clientX - e.touches[1].clientX;
      const dy = e.touches[0].clientY - e.touches[1].clientY;
      const dist = Math.sqrt(dx * dx + dy * dy);
      const scale = dist / lastTouchDist;
      setZoom(z => Math.max(0.5, Math.min(4, z * scale)));
      setLastTouchDist(dist);
    }
  };
  const handleTouchEnd = () => { setDragging(false); setLastTouchDist(null); };

  const handleDistrictClick = (key: string) => {
    if (selectedDistrict === key) {
      const info = districtPaths[key];
      setZoom(2.5);
      setPan({ x: -(info.labelX - 300), y: -(info.labelY - 250) });
    } else {
      setSelectedDistrict(key);
    }
  };

  const showPlayerNames = zoom >= 2.5;
  const showPlayerCount = zoom >= 1.2;

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
          <Button size="icon" variant="outline" className="h-8 w-8" onClick={handleZoomIn}>
            <ZoomIn className="w-4 h-4" />
          </Button>
          <Button size="icon" variant="outline" className="h-8 w-8" onClick={handleZoomOut}>
            <ZoomOut className="w-4 h-4" />
          </Button>
          <Button size="icon" variant="outline" className="h-8 w-8" onClick={handleReset}>
            <RotateCcw className="w-4 h-4" />
          </Button>
        </div>
      </div>

      {/* Map Container */}
      <div
        ref={containerRef}
        className="flex-1 relative overflow-hidden rounded-xl border-2 border-border cursor-grab active:cursor-grabbing touch-none select-none"
        style={{ background: 'linear-gradient(180deg, hsl(210 50% 25%) 0%, hsl(210 60% 20%) 100%)' }}
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => setDragging(false)}
        onTouchStart={handleTouchStart}
        onTouchMove={handleTouchMove}
        onTouchEnd={handleTouchEnd}
      >
        <svg
          viewBox="0 0 600 500"
          className="w-full h-full"
          style={{
            transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
            transformOrigin: 'center center',
          }}
        >
          {/* Ocean background */}
          <defs>
            <linearGradient id="oceanGrad" x1="0%" y1="0%" x2="100%" y2="100%">
              <stop offset="0%" stopColor="hsl(210, 50%, 28%)" />
              <stop offset="100%" stopColor="hsl(210, 60%, 18%)" />
            </linearGradient>
            <filter id="glow">
              <feGaussianBlur stdDeviation="3" result="blur" />
              <feMerge>
                <feMergeNode in="blur" />
                <feMergeNode in="SourceGraphic" />
              </feMerge>
            </filter>
          </defs>
          <rect x="0" y="0" width="600" height="500" fill="url(#oceanGrad)" />

          {/* Subtle ocean wave lines */}
          {[80, 160, 320, 400].map((y, i) => (
            <path
              key={i}
              d={`M0,${y} Q150,${y + (i % 2 ? 8 : -8)} 300,${y} Q450,${y + (i % 2 ? -8 : 8)} 600,${y}`}
              fill="none"
              stroke="hsl(210, 40%, 30%)"
              strokeWidth="0.5"
              opacity="0.4"
            />
          ))}

          {/* Separator line between islands and mainland */}
          <line x1="160" y1="15" x2="160" y2="485" stroke="hsl(210, 30%, 35%)" strokeWidth="0.8" strokeDasharray="6,4" opacity="0.5" />
          <text x="165" y="250" fill="hsl(210, 30%, 50%)" fontSize="10" fontStyle="italic" opacity="0.6"
            transform="rotate(90, 165, 250)">Oceano Atlântico</text>

          {/* Island labels */}
          <text x="75" y="38" textAnchor="middle" fill="hsl(45, 60%, 70%)" fontSize="11" fontWeight="bold" opacity="0.8">
            Açores
          </text>
          <text x="75" y="218" textAnchor="middle" fill="hsl(45, 60%, 70%)" fontSize="11" fontWeight="bold" opacity="0.8">
            Madeira
          </text>

          {/* District regions */}
          {Object.entries(districtPaths).map(([key, info]) => {
            const isSelected = selectedDistrict === key;
            const isMine = myDistrict === key;
            const playerData = districtData[key];
            const count = playerData?.count || 0;
            const intensity = Math.min(1, count / 10);

            const fillColor = isSelected
              ? 'hsl(140, 50%, 40%)'
              : isMine
                ? 'hsl(45, 70%, 45%)'
                : count > 0
                  ? `hsl(140, ${25 + intensity * 35}%, ${28 + intensity * 15}%)`
                  : 'hsl(140, 15%, 25%)';

            const strokeColor = isSelected
              ? 'hsl(45, 90%, 60%)'
              : isMine
                ? 'hsl(45, 80%, 55%)'
                : 'hsl(140, 25%, 40%)';

            return (
              <g key={key} onClick={() => handleDistrictClick(key)} className="cursor-pointer">
                <path
                  d={info.path}
                  fill={fillColor}
                  stroke={strokeColor}
                  strokeWidth={isSelected ? 2 : 0.8}
                  opacity={isSelected ? 1 : 0.92}
                  style={{ transition: 'fill 0.2s, stroke-width 0.2s' }}
                />

                {/* District label */}
                {(zoom >= 1.2 || isSelected || isMine) && (
                  <text
                    x={info.labelX}
                    y={info.labelY}
                    textAnchor="middle"
                    fill={isSelected ? 'hsl(45, 90%, 80%)' : isMine ? 'hsl(45, 80%, 75%)' : 'hsl(140, 20%, 75%)'}
                    fontSize={isSelected ? 11 : 9}
                    fontWeight={isSelected || isMine ? 'bold' : 'normal'}
                    style={{ textShadow: '1px 1px 2px rgba(0,0,0,0.8)', pointerEvents: 'none' }}
                  >
                    {info.label}
                  </text>
                )}

                {/* Player count badge */}
                {count > 0 && (showPlayerCount || isSelected) && (
                  <g>
                    <rect
                      x={info.labelX + 18}
                      y={info.labelY - 15}
                      width={count >= 100 ? 30 : count >= 10 ? 24 : 18}
                      height={16}
                      rx={4}
                      fill="hsl(45, 80%, 50%)"
                      stroke="hsl(45, 60%, 30%)"
                      strokeWidth="0.5"
                    />
                    <text
                      x={info.labelX + 18 + (count >= 100 ? 15 : count >= 10 ? 12 : 9)}
                      y={info.labelY - 4}
                      textAnchor="middle"
                      fill="hsl(45, 10%, 10%)"
                      fontSize="9"
                      fontWeight="bold"
                    >
                      {count}
                    </text>
                  </g>
                )}

                {/* Player dots at high zoom */}
                {showPlayerNames && playerData?.players.slice(0, 20).map((player, i) => {
                  const angle = (i / Math.max(1, playerData.players.length)) * Math.PI * 2;
                  const radius = 15 + (i % 3) * 8;
                  const px = info.labelX + Math.cos(angle) * radius;
                  const py = info.labelY + Math.sin(angle) * radius;
                  const isMe = player.id === studentId;

                  return (
                    <g key={player.id}>
                      <circle
                        cx={px}
                        cy={py}
                        r={isMe ? 4 : 3}
                        fill={isMe ? 'hsl(45, 90%, 55%)' : 'hsl(200, 70%, 60%)'}
                        stroke="#fff"
                        strokeWidth="0.5"
                      />
                      {zoom >= 3 && (
                        <text
                          x={px}
                          y={py + 8}
                          textAnchor="middle"
                          fill="#e0e0e0"
                          fontSize="5"
                          style={{ textShadow: '1px 1px 1px rgba(0,0,0,0.9)' }}
                        >
                          {player.nickname || player.display_name.split(' ')[0]}
                        </text>
                      )}
                    </g>
                  );
                })}
              </g>
            );
          })}
        </svg>

        {/* Zoom indicator */}
        <div className="absolute bottom-2 left-2 bg-card/80 backdrop-blur-sm rounded px-2 py-1 text-xs font-body text-muted-foreground border border-border">
          Zoom: {zoom.toFixed(1)}x
        </div>
        <div className="absolute bottom-2 right-2 bg-card/80 backdrop-blur-sm rounded px-2 py-1 text-[10px] font-body text-muted-foreground border border-border">
          Clica num distrito • 2x para zoom
        </div>

        {/* Legend */}
        <div className="absolute top-2 left-2 bg-card/80 backdrop-blur-sm rounded px-2 py-1.5 text-[10px] font-body text-muted-foreground border border-border space-y-0.5">
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: 'hsl(45, 70%, 45%)' }} />
            <span>O teu distrito</span>
          </div>
          <div className="flex items-center gap-1.5">
            <div className="w-3 h-3 rounded-sm" style={{ background: 'hsl(140, 50%, 40%)' }} />
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
        <div className="mt-2 bg-card rounded-xl border border-border p-3 max-h-40 overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-display text-sm font-bold flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-primary" />
              {districtPaths[selectedDistrict]?.label}
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
                  className={`flex items-center justify-between text-xs font-body px-2 py-1 rounded ${
                    player.id === studentId ? 'bg-gold/10 border border-gold/30' : 'bg-muted/30'
                  }`}
                >
                  <div className="flex items-center gap-2">
                    <span className="text-muted-foreground font-bold w-4">#{i + 1}</span>
                    <span className="font-semibold">
                      {player.nickname || player.display_name}
                      {player.id === studentId && ' (Tu)'}
                    </span>
                  </div>
                  <div className="flex items-center gap-2 text-muted-foreground">
                    <span>Nv.{player.village_level}</span>
                    <span>{player.xp} XP</span>
                  </div>
                </div>
              ))}
              {districtData[selectedDistrict].players.length > 10 && (
                <p className="text-[10px] text-muted-foreground text-center">
                  +{districtData[selectedDistrict].players.length - 10} mais...
                </p>
              )}
            </div>
          ) : (
            <p className="text-xs text-muted-foreground font-body text-center py-2">
              Nenhum jogador neste distrito ainda. Sê o primeiro! 🏆
            </p>
          )}
        </div>
      )}
    </div>
  );
};

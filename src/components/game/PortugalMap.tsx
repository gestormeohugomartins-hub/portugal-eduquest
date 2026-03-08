import { useState, useEffect, useCallback, useRef, useMemo } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { ZoomIn, ZoomOut, RotateCcw, Users, MapPin } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface DistrictInfo {
  x: number;
  y: number;
  label: string;
  // SVG polygon points for district shape (simplified)
  path: string;
}

const districtPositions: Record<string, DistrictInfo> = {
  viana_castelo: { x: 15, y: 8, label: "Viana do Castelo", path: "M8,2 L22,2 L24,10 L18,14 L8,12Z" },
  braga: { x: 25, y: 12, label: "Braga", path: "M22,2 L34,4 L36,14 L24,16 L18,14 L24,10Z" },
  vila_real: { x: 35, y: 10, label: "Vila Real", path: "M34,4 L46,2 L48,14 L38,18 L36,14Z" },
  braganca: { x: 52, y: 8, label: "Bragança", path: "M46,2 L62,2 L60,14 L48,14Z" },
  porto: { x: 18, y: 22, label: "Porto", path: "M8,12 L18,14 L24,16 L22,26 L10,28 L6,22Z" },
  aveiro: { x: 14, y: 32, label: "Aveiro", path: "M6,22 L10,28 L22,26 L20,38 L8,40 L4,32Z" },
  viseu: { x: 34, y: 26, label: "Viseu", path: "M24,16 L36,14 L38,18 L42,28 L30,34 L22,30 L22,26Z" },
  guarda: { x: 50, y: 26, label: "Guarda", path: "M38,18 L48,14 L60,14 L58,30 L50,34 L42,28Z" },
  coimbra: { x: 22, y: 40, label: "Coimbra", path: "M8,40 L20,38 L22,30 L30,34 L28,44 L14,46Z" },
  castelo_branco: { x: 46, y: 40, label: "C. Branco", path: "M30,34 L42,28 L50,34 L58,30 L56,44 L38,48 L28,44Z" },
  leiria: { x: 16, y: 50, label: "Leiria", path: "M4,46 L14,46 L28,44 L26,54 L12,56Z" },
  santarem: { x: 30, y: 54, label: "Santarém", path: "M26,54 L28,44 L38,48 L44,52 L36,60 L22,58Z" },
  portalegre: { x: 50, y: 50, label: "Portalegre", path: "M38,48 L56,44 L58,54 L48,58 L44,52Z" },
  lisboa: { x: 16, y: 64, label: "Lisboa", path: "M8,58 L22,58 L24,66 L14,70 L6,66Z" },
  setubal: { x: 22, y: 72, label: "Setúbal", path: "M14,70 L24,66 L32,68 L30,78 L18,76Z" },
  evora: { x: 38, y: 66, label: "Évora", path: "M24,66 L36,60 L48,58 L46,70 L38,74 L32,68Z" },
  beja: { x: 36, y: 80, label: "Beja", path: "M18,76 L30,78 L38,74 L46,70 L48,82 L28,88Z" },
  faro: { x: 32, y: 90, label: "Faro", path: "M18,86 L28,88 L48,82 L46,94 L16,94Z" },
  acores: { x: 78, y: 22, label: "Açores", path: "M72,16 L84,16 L86,28 L72,28Z" },
  madeira: { x: 78, y: 52, label: "Madeira", path: "M72,46 L86,46 L86,58 L72,58Z" },
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

  // Fetch player counts per district
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
        // Sort players by xp desc within each district
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
  const handleZoomOut = () => setZoom(z => Math.max(0.8, z / 1.4));
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
  const handleWheel = (e: React.WheelEvent) => {
    e.preventDefault();
    setZoom(z => Math.max(0.8, Math.min(4, z - e.deltaY * 0.002)));
  };

  const handleDistrictClick = (key: string) => {
    if (selectedDistrict === key) {
      // Zoom into district
      const pos = districtPositions[key];
      setZoom(3);
      setPan({ x: -(pos.x - 50) * 4, y: -(pos.y - 50) * 4 });
    } else {
      setSelectedDistrict(key);
    }
  };

  // Size of player dots based on zoom
  const dotSize = Math.max(2, 4 / zoom);
  const showPlayerNames = zoom >= 2.5;
  const showPlayerCount = zoom >= 1.5;

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
        className="flex-1 relative overflow-hidden rounded-xl border-2 border-border bg-[#1a3a2a] cursor-grab active:cursor-grabbing touch-none select-none"
        onMouseDown={handleMouseDown}
        onMouseMove={handleMouseMove}
        onMouseUp={handleMouseUp}
        onMouseLeave={() => setDragging(false)}
        onWheel={handleWheel}
      >
        {/* SVG Map */}
        <svg
          viewBox="0 0 100 100"
          className="w-full h-full"
          style={{
            transform: `scale(${zoom}) translate(${pan.x / zoom}px, ${pan.y / zoom}px)`,
            transformOrigin: 'center center',
          }}
        >
          {/* Sea background */}
          <rect x="0" y="0" width="100" height="100" fill="#1a3a5a" />

          {/* Mainland rough outline */}
          <path
            d="M6,2 L62,2 L60,14 L58,30 L56,44 L58,54 L48,58 L46,70 L48,82 L46,94 L16,94 L18,86 L6,66 L4,46 L4,32 L6,22Z"
            fill="#2a5a3a"
            stroke="#3a7a4a"
            strokeWidth="0.5"
          />

          {/* Island backgrounds */}
          <rect x="70" y="14" width="18" height="16" rx="2" fill="#2a5a3a" stroke="#3a7a4a" strokeWidth="0.3" />
          <rect x="70" y="44" width="18" height="16" rx="2" fill="#2a5a3a" stroke="#3a7a4a" strokeWidth="0.3" />

          {/* District regions */}
          {Object.entries(districtPositions).map(([key, info]) => {
            const isSelected = selectedDistrict === key;
            const isMine = myDistrict === key;
            const playerData = districtData[key];
            const count = playerData?.count || 0;

            // Color intensity based on player count
            const intensity = Math.min(1, count / 10);
            const fillColor = isSelected
              ? 'hsl(140, 60%, 35%)'
              : isMine
                ? 'hsl(45, 80%, 45%)'
                : count > 0
                  ? `hsl(140, ${30 + intensity * 40}%, ${25 + intensity * 20}%)`
                  : 'hsl(140, 15%, 22%)';

            return (
              <g key={key} onClick={() => handleDistrictClick(key)} className="cursor-pointer">
                <path
                  d={info.path}
                  fill={fillColor}
                  stroke={isSelected ? 'hsl(45, 90%, 60%)' : isMine ? 'hsl(45, 80%, 55%)' : '#4a8a5a'}
                  strokeWidth={isSelected ? '0.8' : '0.3'}
                  opacity={isSelected ? 1 : 0.9}
                />

                {/* District dot */}
                <circle
                  cx={info.x}
                  cy={info.y}
                  r={isMine ? 2 : count > 0 ? 1.5 : 1}
                  fill={isMine ? 'hsl(45, 90%, 55%)' : count > 0 ? 'hsl(140, 70%, 55%)' : '#5a8a6a'}
                  stroke="#fff"
                  strokeWidth="0.3"
                />

                {/* Player count badge */}
                {count > 0 && (showPlayerCount || isSelected) && (
                  <>
                    <rect
                      x={info.x + 2}
                      y={info.y - 3}
                      width={count >= 10 ? 8 : 6}
                      height={5}
                      rx={1}
                      fill="hsl(45, 80%, 50%)"
                      stroke="#fff"
                      strokeWidth="0.2"
                    />
                    <text
                      x={info.x + (count >= 10 ? 6 : 5)}
                      y={info.y + 0.5}
                      textAnchor="middle"
                      fill="#fff"
                      fontSize="3"
                      fontWeight="bold"
                    >
                      {count}
                    </text>
                  </>
                )}

                {/* District label (visible at higher zoom) */}
                {(zoom >= 1.8 || isSelected) && (
                  <text
                    x={info.x}
                    y={info.y + 4.5}
                    textAnchor="middle"
                    fill="#c0e0c0"
                    fontSize={isSelected ? '3' : '2.2'}
                    fontWeight={isSelected ? 'bold' : 'normal'}
                  >
                    {info.label}
                  </text>
                )}

                {/* Individual player dots at high zoom */}
                {showPlayerNames && playerData?.players.slice(0, 20).map((player, i) => {
                  const angle = (i / Math.max(1, playerData.players.length)) * Math.PI * 2;
                  const radius = 3 + (i % 3) * 1.5;
                  const px = info.x + Math.cos(angle) * radius;
                  const py = info.y + Math.sin(angle) * radius;
                  const isMe = player.id === studentId;

                  return (
                    <g key={player.id}>
                      <circle
                        cx={px}
                        cy={py}
                        r={isMe ? 1.2 : 0.8}
                        fill={isMe ? 'hsl(45, 90%, 55%)' : 'hsl(200, 70%, 60%)'}
                        stroke="#fff"
                        strokeWidth="0.15"
                      />
                      {zoom >= 3.5 && (
                        <text
                          x={px}
                          y={py + 2}
                          textAnchor="middle"
                          fill="#e0e0e0"
                          fontSize="1.5"
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

          {/* Separator line for islands */}
          <line x1="68" y1="14" x2="68" y2="60" stroke="#4a8a6a" strokeWidth="0.3" strokeDasharray="1,1" />
          <text x="69" y="36" fill="#6aaa8a" fontSize="2" transform="rotate(90, 69, 36)">Ilhas</text>
        </svg>

        {/* Zoom level indicator */}
        <div className="absolute bottom-2 left-2 bg-card/80 backdrop-blur-sm rounded px-2 py-1 text-xs font-body text-muted-foreground border border-border">
          Zoom: {zoom.toFixed(1)}x
        </div>

        {/* Hint */}
        <div className="absolute bottom-2 right-2 bg-card/80 backdrop-blur-sm rounded px-2 py-1 text-[10px] font-body text-muted-foreground border border-border">
          Clica num distrito • Clica 2x para zoom
        </div>
      </div>

      {/* Selected District Panel */}
      {selectedDistrict && (
        <div className="mt-2 bg-card rounded-xl border border-border p-3 max-h-40 overflow-y-auto">
          <div className="flex items-center justify-between mb-2">
            <h3 className="font-display text-sm font-bold flex items-center gap-1.5">
              <MapPin className="w-4 h-4 text-primary" />
              {districtPositions[selectedDistrict]?.label}
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

import { useState, useEffect, useCallback, useRef } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { IsometricCanvas } from './IsometricCanvas';
import { BuildMenu } from './BuildMenu';
import { BuildingInfoModal } from './BuildingInfoModal';
import { ExpansionPanel } from './ExpansionPanel';
import { MIN_GRID_SIZE, BUILDING_DEFS, EXPANSION_LEVELS, PlacedBuilding } from '@/lib/gameTypes';
import { createEmptyGrid, applyBuildingsToGrid, canPlace, hasRoadAccess, getUpgradeCost, getTotalStats } from '@/lib/gridLogic';
import { SFX } from '@/lib/sounds';
import { AmbientMusic } from '@/lib/ambientMusic';
import { addBuildParticles, addCoinParticle } from '@/lib/canvasEffects';
import { gridToIso } from '@/lib/gridLogic';
import { TILE_W, TILE_H } from '@/lib/gameTypes';
import { calculateSimState, SimState, AnimatedCitizen, createAnimatedCitizen, updateCitizen, SIM_TICK_MS, SIM_RATES, Complaint } from '@/lib/simulation';
import { toast } from 'sonner';
import { BookOpen, Shield, Users, Sparkles, Music, Volume2, Maximize, Crown, Lock, Heart, Apple, Droplets, GraduationCap } from 'lucide-react';
import { Button } from '@/components/ui/button';

interface VillageViewProps {
  student: {
    id: string;
    village_level: number;
    defense_level: number;
    citizens: number;
    school_year: string;
    coins: number;
    diamonds: number;
    is_premium: boolean;
    district?: string | null;
    xp: number;
    max_xp_free: number;
  };
  onQuiz: () => void;
  onRefresh: () => void;
}

// Production rates (coins per minute per level)
const PRODUCTION_RATES: Record<string, number> = {
  workshop: 2,
  market: 4,
  windmill: 1,
};
const PRODUCTION_INTERVAL_MS = 60000;

export const VillageView = ({ student, onQuiz, onRefresh }: VillageViewProps) => {
  const [buildings, setBuildings] = useState<PlacedBuilding[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null);
  const [ghostPos, setGhostPos] = useState<{ x: number; y: number } | null>(null);
  const [canPlaceGhost, setCanPlaceGhost] = useState(false);
  const [infoBuilding, setInfoBuilding] = useState<PlacedBuilding | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [showExpansion, setShowExpansion] = useState(false);
  const [loading, setLoading] = useState(true);
  const [musicOn, setMusicOn] = useState(false);
  const [gridSize, setGridSize] = useState(MIN_GRID_SIZE);
  const [productionReady, setProductionReady] = useState<Set<string>>(new Set());
  const [showPremiumGate, setShowPremiumGate] = useState(false);

  // Simulation state
  const [simState, setSimState] = useState<SimState | null>(null);
  const [animatedCitizens, setAnimatedCitizens] = useState<AnimatedCitizen[]>([]);
  const citizenAnimRef = useRef<number>(0);

  const baseGrid = createEmptyGrid(gridSize);
  const fullGrid = applyBuildingsToGrid(baseGrid, buildings);
  const stats = getTotalStats(buildings);

  const isFree = !student.is_premium;
  const FREE_BUILDING_LIMIT = 15;
  const FREE_CATEGORIES = ['infrastructure', 'residential', 'production', 'military'];
  const xpLimited = isFree && student.xp >= student.max_xp_free;

  useEffect(() => {
    const expIdx = Math.min(student.village_level - 1, EXPANSION_LEVELS.length - 1);
    setGridSize(EXPANSION_LEVELS[Math.max(0, expIdx)].size);
  }, [student.village_level]);

  useEffect(() => { loadBuildings(); }, [student.id]);
  useEffect(() => { return () => { AmbientMusic.stop(); }; }, []);

  // Passive production timer
  useEffect(() => {
    if (buildings.length === 0) return;
    const interval = setInterval(() => {
      const producers = buildings.filter(b => PRODUCTION_RATES[b.defId]);
      if (producers.length > 0) {
        setProductionReady(prev => {
          const next = new Set(prev);
          producers.forEach(b => next.add(b.id));
          return next;
        });
      }
    }, PRODUCTION_INTERVAL_MS);

    const quickCheck = setTimeout(() => {
      const producers = buildings.filter(b => PRODUCTION_RATES[b.defId]);
      if (producers.length > 0) {
        setProductionReady(prev => {
          const next = new Set(prev);
          producers.forEach(b => next.add(b.id));
          return next;
        });
      }
    }, 10000);

    return () => { clearInterval(interval); clearTimeout(quickCheck); };
  }, [buildings]);

  // === SIMULATION TICK ===
  useEffect(() => {
    if (buildings.length === 0) return;
    const runSim = () => {
      const sim = calculateSimState(buildings, stats.citizens);
      setSimState(sim);

      // Apply population delta
      if (sim.populationDelta !== 0 && stats.citizens > 0) {
        const newCitizens = Math.max(5, stats.citizens + sim.populationDelta);
        if (newCitizens !== stats.citizens) {
          supabase.from('students').update({ citizens: newCitizens }).eq('id', student.id).then(() => {});
          if (sim.populationDelta < 0) {
            toast.warning(`${Math.abs(sim.populationDelta)} cidadão(s) saíram da aldeia! 😢`);
          }
        }
      }

      // Show random complaint as toast
      if (sim.complaints.length > 0 && Math.random() < 0.3) {
        const c = sim.complaints[Math.floor(Math.random() * sim.complaints.length)];
        toast.info(`${c.emoji} "${c.message}"`, { duration: 4000 });
      }
    };

    runSim(); // initial
    const interval = setInterval(runSim, SIM_TICK_MS);
    return () => clearInterval(interval);
  }, [buildings, stats.citizens, student.id]);

  // === ANIMATED CITIZENS ===
  useEffect(() => {
    // Get road tiles
    const roadTiles: { x: number; y: number }[] = [];
    for (let y = 0; y < gridSize; y++) {
      for (let x = 0; x < gridSize; x++) {
        if (fullGrid[y]?.[x]?.type === 'road') roadTiles.push({ x, y });
      }
    }
    if (roadTiles.length === 0) { setAnimatedCitizens([]); return; }

    // Create citizens proportional to population (max 20 for performance)
    const count = Math.min(20, Math.max(2, Math.floor(stats.citizens / 5)));
    const citizens: AnimatedCitizen[] = [];
    for (let i = 0; i < count; i++) {
      const c = createAnimatedCitizen(roadTiles);
      if (c) citizens.push(c);
    }
    setAnimatedCitizens(citizens);

    // Animation loop for citizens
    let running = true;
    const animate = () => {
      if (!running) return;
      setAnimatedCitizens(prev => {
        const updated = prev.map(c => {
          updateCitizen(c, roadTiles);

          // Randomly assign complaints to citizens
          if (simState?.complaints.length && c.complaintTimer <= 0 && Math.random() < 0.005) {
            const complaint = simState.complaints[Math.floor(Math.random() * simState.complaints.length)];
            c.complaint = `${complaint.emoji} ${complaint.message}`;
            c.complaintTimer = 120; // ~2 seconds at 60fps
          }
          return c;
        });
        return [...updated];
      });
      citizenAnimRef.current = requestAnimationFrame(animate);
    };
    animate();

    return () => { running = false; cancelAnimationFrame(citizenAnimRef.current); };
  }, [buildings, gridSize, stats.citizens]);

  // Update complaint assignment when simState changes
  useEffect(() => {
    if (!simState) return;
    setAnimatedCitizens(prev => prev.map(c => {
      if (simState.complaints.length > 0 && c.complaintTimer <= 0 && Math.random() < 0.02) {
        const complaint = simState.complaints[Math.floor(Math.random() * simState.complaints.length)];
        c.complaint = `${complaint.emoji} ${complaint.message}`;
        c.complaintTimer = 120;
      }
      return c;
    }));
  }, [simState]);

  const loadBuildings = async () => {
    const { data } = await supabase.from('buildings').select('*').eq('student_id', student.id);
    if (data) {
      setBuildings(data.map(b => ({
        id: b.id, defId: b.building_type,
        x: b.position_x, y: b.position_y,
        level: b.level, dbId: b.id,
      })));
    }
    setLoading(false);
  };

  const toggleMusic = () => {
    if (musicOn) { AmbientMusic.stop(); setMusicOn(false); }
    else { AmbientMusic.start(); setMusicOn(true); }
  };

  const collectProduction = async (building: PlacedBuilding) => {
    const rate = PRODUCTION_RATES[building.defId];
    if (!rate) return;
    const coinsEarned = rate * building.level;

    await supabase.from('students').update({
      coins: student.coins + coinsEarned,
    }).eq('id', student.id);

    const def = BUILDING_DEFS[building.defId];
    if (def) {
      const cx = building.x + def.width / 2 - 0.5;
      const cy = building.y + def.height / 2 - 0.5;
      const { sx, sy } = gridToIso(cx, cy, TILE_W, TILE_H);
      for (let i = 0; i < 5; i++) addCoinParticle(sx, sy - 15);
    }

    SFX.coins();
    toast.success(`+${coinsEarned} moedas recolhidas! 🪙`);
    setProductionReady(prev => {
      const next = new Set(prev);
      next.delete(building.id);
      return next;
    });
    onRefresh();
  };

  const handleTileClick = useCallback(async (gx: number, gy: number) => {
    if (!selectedBuilding) return;
    const def = BUILDING_DEFS[selectedBuilding];
    if (!def) return;

    if (isFree) {
      if (def.premiumOnly) { setShowPremiumGate(true); SFX.wrong(); return; }
      if (!FREE_CATEGORIES.includes(def.category)) {
        toast.error('Categoria Premium! Faz upgrade para desbloquear 👑');
        SFX.wrong(); return;
      }
      if (buildings.length >= FREE_BUILDING_LIMIT) {
        toast.error(`Limite gratuito: ${FREE_BUILDING_LIMIT} edifícios. Faz upgrade! 👑`);
        SFX.wrong(); setShowPremiumGate(true); return;
      }
    }

    if (!canPlace(fullGrid, gx, gy, def.width, def.height)) { toast.error('Espaço ocupado!'); SFX.wrong(); return; }
    if (def.requiresRoad && !hasRoadAccess(fullGrid, gx, gy, def.width, def.height)) { toast.error('Precisa de estrada adjacente!'); SFX.wrong(); return; }
    if (student.coins < def.costCoins || student.diamonds < def.costDiamonds) { toast.error('Recursos insuficientes!'); SFX.wrong(); return; }

    const { data, error } = await supabase
      .from('buildings')
      .insert({ student_id: student.id, building_type: def.id, position_x: gx, position_y: gy, level: 1 })
      .select().single();

    if (error) { toast.error('Erro ao construir!'); return; }

    await supabase.from('students').update({
      coins: student.coins - def.costCoins,
      diamonds: student.diamonds - def.costDiamonds,
    }).eq('id', student.id);

    const { sx, sy } = gridToIso(gx, gy, TILE_W, TILE_H);
    addBuildParticles(sx, sy);

    SFX.place();
    toast.success(`${def.name} construído! 🏗️`);
    setBuildings(prev => [...prev, { id: data.id, defId: def.id, x: gx, y: gy, level: 1, dbId: data.id }]);
    setSelectedBuilding(null);
    setGhostPos(null);
    onRefresh();
  }, [selectedBuilding, fullGrid, student, onRefresh, isFree, buildings.length]);

  const handleTileHover = useCallback((gx: number, gy: number) => {
    if (!selectedBuilding) return;
    const def = BUILDING_DEFS[selectedBuilding];
    if (!def) return;
    setGhostPos({ x: gx, y: gy });
    setCanPlaceGhost(
      canPlace(fullGrid, gx, gy, def.width, def.height) &&
      (!def.requiresRoad || hasRoadAccess(fullGrid, gx, gy, def.width, def.height))
    );
  }, [selectedBuilding, fullGrid]);

  const handleBuildingClick = useCallback((building: PlacedBuilding) => {
    if (productionReady.has(building.id)) { collectProduction(building); return; }
    setInfoBuilding(building);
    setShowInfo(true);
    SFX.click();
  }, [productionReady, student]);

  const handleUpgrade = async (building: PlacedBuilding) => {
    const def = BUILDING_DEFS[building.defId];
    if (!def) return;
    const cost = getUpgradeCost(building.defId, building.level);

    if (isFree && building.level >= 3) {
      toast.error('Limite gratuito: Nível 3. Faz upgrade Premium! 👑');
      SFX.wrong(); setShowPremiumGate(true); return;
    }

    if (student.coins < cost.coins || student.diamonds < cost.diamonds) {
      toast.error('Recursos insuficientes!'); SFX.wrong(); return;
    }
    await supabase.from('buildings').update({ level: building.level + 1 }).eq('id', building.dbId);
    await supabase.from('students').update({
      coins: student.coins - cost.coins, diamonds: student.diamonds - cost.diamonds,
    }).eq('id', student.id);
    SFX.upgrade();
    toast.success(`${def.name} evoluiu para nível ${building.level + 1}! ⬆️`);
    setBuildings(prev => prev.map(b => b.id === building.id ? { ...b, level: b.level + 1 } : b));
    onRefresh();
  };

  const handleDemolish = async (building: PlacedBuilding) => {
    const def = BUILDING_DEFS[building.defId];
    await supabase.from('buildings').delete().eq('id', building.dbId);
    if (def) {
      const refund = Math.floor(def.costCoins * 0.5);
      if (refund > 0) await supabase.from('students').update({ coins: student.coins + refund }).eq('id', student.id);
    }
    SFX.demolish();
    toast.info(`${def?.name || 'Edifício'} demolido. 50% devolvido.`);
    setBuildings(prev => prev.filter(b => b.id !== building.id));
    onRefresh();
  };

  const handleExpand = async () => {
    const currentIdx = EXPANSION_LEVELS.findIndex(l => l.size === gridSize);
    if (currentIdx < 0 || currentIdx >= EXPANSION_LEVELS.length - 1) return;

    if (isFree && gridSize >= 12) {
      toast.error('Expansão Premium! Limite gratuito: 12×12 👑');
      SFX.wrong(); setShowPremiumGate(true); return;
    }

    const next = EXPANSION_LEVELS[currentIdx + 1];
    if (student.coins < next.cost || student.diamonds < next.diamonds) {
      toast.error('Recursos insuficientes!'); SFX.wrong(); return;
    }
    await supabase.from('students').update({
      village_level: student.village_level + 1,
      coins: student.coins - next.cost,
      diamonds: student.diamonds - next.diamonds,
    }).eq('id', student.id);
    SFX.upgrade();
    toast.success(`Território expandido para ${next.size}×${next.size}! 🗺️`);
    setGridSize(next.size);
    setShowExpansion(false);
    onRefresh();
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="font-display text-lg animate-pulse">A carregar aldeia...</p>
      </div>
    );
  }

  return (
    <div className="relative h-[calc(100vh-10rem)]">
      {/* Stats overlay */}
      <div className="absolute top-2 left-2 z-20 flex gap-1.5 flex-wrap max-w-[70%]">
        <div className="bg-card/90 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center gap-1 text-xs font-body border border-border">
          <Users className="w-3.5 h-3.5 text-citizen" />
          <span className="font-bold">{stats.citizens}</span>
        </div>
        <div className="bg-card/90 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center gap-1 text-xs font-body border border-border">
          <Shield className="w-3.5 h-3.5 text-secondary" />
          <span className="font-bold">{stats.defense}</span>
        </div>
        <div className="bg-card/90 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center gap-1 text-xs font-body border border-border">
          <Sparkles className="w-3.5 h-3.5 text-primary" />
          <span className="font-bold">{stats.xp} XP</span>
        </div>
        <div className="bg-card/90 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center gap-1 text-xs font-body border border-border">
          <Maximize className="w-3.5 h-3.5 text-muted-foreground" />
          <span className="font-bold">{gridSize}×{gridSize}</span>
        </div>
        {/* Simulation stats */}
        {simState && (
          <>
            <div className={`bg-card/90 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center gap-1 text-xs font-body border ${simState.foodPerMin >= simState.foodConsumedPerMin ? 'border-green-500/50' : 'border-destructive/50'}`}>
              <Apple className="w-3.5 h-3.5 text-green-500" />
              <span className="font-bold">{simState.foodPerMin}/{simState.foodConsumedPerMin}</span>
            </div>
            <div className={`bg-card/90 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center gap-1 text-xs font-body border ${simState.happiness >= 50 ? 'border-green-500/50' : 'border-destructive/50'}`}>
              <Heart className={`w-3.5 h-3.5 ${simState.happiness >= 50 ? 'text-green-500' : 'text-destructive'}`} />
              <span className="font-bold">{simState.happiness}%</span>
            </div>
            {simState.diseaseRisk > 30 && (
              <div className="bg-card/90 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center gap-1 text-xs font-body border border-destructive/50 animate-pulse">
                <span className="text-xs">🤒</span>
                <span className="font-bold text-destructive">{simState.diseaseRisk}%</span>
              </div>
            )}
          </>
        )}
        {isFree && (
          <div className="bg-card/90 backdrop-blur-sm rounded-lg px-2 py-1 flex items-center gap-1 text-xs font-body border border-gold/50">
            <Lock className="w-3 h-3 text-gold" />
            <span className="font-bold text-gold">{buildings.length}/{FREE_BUILDING_LIMIT}</span>
          </div>
        )}
      </div>

      {xpLimited && (
        <div className="absolute top-12 left-2 right-16 z-20 bg-destructive/90 text-destructive-foreground text-xs font-body px-3 py-1.5 rounded-lg backdrop-blur-sm animate-pulse">
          <Crown className="w-3 h-3 inline mr-1" />
          XP máximo gratuito atingido! Faz upgrade Premium para continuar a evoluir.
        </div>
      )}

      {/* Simulation alerts */}
      {simState && simState.complaints.length > 0 && (
        <div className="absolute bottom-20 left-2 z-20 space-y-1 max-w-[200px]">
          {simState.complaints.slice(0, 3).map((c, i) => (
            <div key={i} className="bg-card/90 backdrop-blur-sm rounded-lg px-2 py-1 text-[10px] font-body border border-destructive/30 flex items-center gap-1">
              <span>{c.emoji}</span>
              <span className="text-destructive">{c.message}</span>
            </div>
          ))}
        </div>
      )}

      {/* Top right buttons */}
      <div className="absolute top-2 right-2 z-20 flex gap-1.5">
        <Button size="icon" variant="outline" onClick={toggleMusic}
          className="h-8 w-8 bg-card/90 backdrop-blur-sm"
          title={musicOn ? 'Desligar música' : 'Ligar música'}>
          {musicOn ? <Music className="w-4 h-4 text-primary" /> : <Volume2 className="w-4 h-4 text-muted-foreground" />}
        </Button>
        <Button size="sm" variant="outline" onClick={() => { setShowExpansion(true); SFX.click(); }}
          className="h-8 bg-card/90 backdrop-blur-sm text-xs">
          <Maximize className="w-3.5 h-3.5 mr-1" />Expandir
        </Button>
        <Button size="sm" onClick={() => { onQuiz(); SFX.click(); }}
          className="h-8 bg-primary text-primary-foreground font-bold animate-pulse shadow-lg">
          <BookOpen className="w-4 h-4 mr-1" />Quiz
        </Button>
      </div>

      {/* Canvas */}
      <IsometricCanvas
        grid={baseGrid} buildings={buildings} gridSize={gridSize}
        selectedBuilding={selectedBuilding} ghostPos={ghostPos} canPlaceGhost={canPlaceGhost}
        productionReady={productionReady}
        animatedCitizens={animatedCitizens}
        complaints={simState?.complaints || []}
        onTileClick={handleTileClick} onTileHover={handleTileHover} onBuildingClick={handleBuildingClick}
      />

      <BuildMenu
        selectedBuilding={selectedBuilding} onSelect={setSelectedBuilding}
        coins={student.coins} diamonds={student.diamonds}
        villageLevel={student.village_level} isPremium={student.is_premium}
        district={student.district}
      />

      <BuildingInfoModal
        building={infoBuilding} open={showInfo} onOpenChange={setShowInfo}
        onUpgrade={handleUpgrade} onDemolish={handleDemolish}
        coins={student.coins} diamonds={student.diamonds}
      />

      <ExpansionPanel
        open={showExpansion} onOpenChange={setShowExpansion}
        currentSize={gridSize} coins={student.coins} diamonds={student.diamonds}
        onExpand={handleExpand}
      />

      {/* Premium Gate Modal */}
      {showPremiumGate && (
        <div className="fixed inset-0 z-50 bg-foreground/50 flex items-center justify-center p-4" onClick={() => setShowPremiumGate(false)}>
          <div className="bg-card rounded-xl p-6 max-w-sm w-full text-center space-y-4 border-2 border-gold" onClick={e => e.stopPropagation()}>
            <Crown className="w-12 h-12 mx-auto text-gold" />
            <h2 className="font-display text-xl font-bold">Conteúdo Premium 👑</h2>
            <p className="font-body text-sm text-muted-foreground">
              Desbloqueia todas as funcionalidades com o plano Premium por apenas <strong>4,99€/ano</strong>:
            </p>
            <ul className="text-left text-sm font-body space-y-2">
              <li className="flex items-center gap-2">✅ Edifícios e decorações ilimitados</li>
              <li className="flex items-center gap-2">✅ Evolução até nível 5</li>
              <li className="flex items-center gap-2">✅ Expansão até 20×20</li>
              <li className="flex items-center gap-2">✅ Monumentos exclusivos do teu distrito</li>
              <li className="flex items-center gap-2">✅ XP ilimitado</li>
            </ul>
            <div className="flex gap-2">
              <Button variant="outline" className="flex-1" onClick={() => setShowPremiumGate(false)}>
                Mais tarde
              </Button>
              <Button className="flex-1 bg-gold text-gold-foreground" onClick={() => setShowPremiumGate(false)}>
                <Crown className="w-4 h-4 mr-1" /> Fazer Upgrade
              </Button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

import { useState, useEffect, useCallback } from 'react';
import { supabase } from '@/integrations/supabase/client';
import { IsometricCanvas } from './IsometricCanvas';
import { BuildMenu } from './BuildMenu';
import { BuildingInfoModal } from './BuildingInfoModal';
import { GRID_SIZE, BUILDING_DEFS, PlacedBuilding } from '@/lib/gameTypes';
import { createEmptyGrid, applyBuildingsToGrid, canPlace, hasRoadAccess, getUpgradeCost, getTotalStats } from '@/lib/gridLogic';
import { SFX } from '@/lib/sounds';
import { toast } from 'sonner';
import { BookOpen, Shield, Users, Sparkles } from 'lucide-react';
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
  };
  onQuiz: () => void;
  onRefresh: () => void;
}

export const VillageView = ({ student, onQuiz, onRefresh }: VillageViewProps) => {
  const [buildings, setBuildings] = useState<PlacedBuilding[]>([]);
  const [selectedBuilding, setSelectedBuilding] = useState<string | null>(null);
  const [ghostPos, setGhostPos] = useState<{ x: number; y: number } | null>(null);
  const [canPlaceGhost, setCanPlaceGhost] = useState(false);
  const [infoBuilding, setInfoBuilding] = useState<PlacedBuilding | null>(null);
  const [showInfo, setShowInfo] = useState(false);
  const [loading, setLoading] = useState(true);

  const baseGrid = createEmptyGrid();
  const fullGrid = applyBuildingsToGrid(baseGrid, buildings);
  const stats = getTotalStats(buildings);

  // Load buildings from DB
  useEffect(() => {
    loadBuildings();
  }, [student.id]);

  const loadBuildings = async () => {
    const { data } = await supabase
      .from('buildings')
      .select('*')
      .eq('student_id', student.id);

    if (data) {
      setBuildings(data.map(b => ({
        id: b.id,
        defId: b.building_type,
        x: b.position_x,
        y: b.position_y,
        level: b.level,
        dbId: b.id,
      })));
    }
    setLoading(false);
  };

  const handleTileClick = useCallback(async (gx: number, gy: number) => {
    if (!selectedBuilding) return;
    const def = BUILDING_DEFS[selectedBuilding];
    if (!def) return;

    // Validation
    if (!canPlace(fullGrid, gx, gy, def.width, def.height)) {
      toast.error('Espaço ocupado!');
      SFX.wrong();
      return;
    }

    if (def.requiresRoad && !hasRoadAccess(fullGrid, gx, gy, def.width, def.height)) {
      toast.error('Precisa de estrada adjacente!');
      SFX.wrong();
      return;
    }

    if (student.coins < def.costCoins || student.diamonds < def.costDiamonds) {
      toast.error('Recursos insuficientes!');
      SFX.wrong();
      return;
    }

    if (student.village_level < def.minVillageLevel) {
      toast.error(`Requer nível ${def.minVillageLevel} da aldeia!`);
      SFX.wrong();
      return;
    }

    if (def.premiumOnly && !student.is_premium) {
      toast.error('Conteúdo exclusivo Premium! 👑');
      SFX.wrong();
      return;
    }

    // Place building
    const { data, error } = await supabase
      .from('buildings')
      .insert({
        student_id: student.id,
        building_type: def.id,
        position_x: gx,
        position_y: gy,
        level: 1,
      })
      .select()
      .single();

    if (error) {
      toast.error('Erro ao construir!');
      return;
    }

    // Deduct resources
    await supabase
      .from('students')
      .update({
        coins: student.coins - def.costCoins,
        diamonds: student.diamonds - def.costDiamonds,
      })
      .eq('id', student.id);

    SFX.place();
    toast.success(`${def.name} construído! 🏗️`);

    setBuildings(prev => [...prev, {
      id: data.id,
      defId: def.id,
      x: gx,
      y: gy,
      level: 1,
      dbId: data.id,
    }]);
    setSelectedBuilding(null);
    setGhostPos(null);
    onRefresh();
  }, [selectedBuilding, fullGrid, student, onRefresh]);

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
    setInfoBuilding(building);
    setShowInfo(true);
    SFX.click();
  }, []);

  const handleUpgrade = async (building: PlacedBuilding) => {
    const def = BUILDING_DEFS[building.defId];
    if (!def) return;
    const cost = getUpgradeCost(building.defId, building.level);

    if (student.coins < cost.coins || student.diamonds < cost.diamonds) {
      toast.error('Recursos insuficientes!');
      SFX.wrong();
      return;
    }

    await supabase
      .from('buildings')
      .update({ level: building.level + 1 })
      .eq('id', building.dbId);

    await supabase
      .from('students')
      .update({
        coins: student.coins - cost.coins,
        diamonds: student.diamonds - cost.diamonds,
      })
      .eq('id', student.id);

    SFX.upgrade();
    toast.success(`${def.name} evoluiu para nível ${building.level + 1}! ⬆️`);
    setBuildings(prev => prev.map(b => b.id === building.id ? { ...b, level: b.level + 1 } : b));
    onRefresh();
  };

  const handleDemolish = async (building: PlacedBuilding) => {
    const def = BUILDING_DEFS[building.defId];
    await supabase.from('buildings').delete().eq('id', building.dbId);

    // Refund 50%
    if (def) {
      const refundCoins = Math.floor(def.costCoins * 0.5);
      if (refundCoins > 0) {
        await supabase
          .from('students')
          .update({ coins: student.coins + refundCoins })
          .eq('id', student.id);
      }
    }

    SFX.demolish();
    toast.info(`${def?.name || 'Edifício'} demolido. Recebeste 50% de volta.`);
    setBuildings(prev => prev.filter(b => b.id !== building.id));
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
      <div className="absolute top-2 left-2 z-20 flex gap-2">
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
      </div>

      {/* Quiz button */}
      <div className="absolute top-2 right-2 z-20">
        <Button
          size="sm"
          onClick={() => { onQuiz(); SFX.click(); }}
          className="bg-primary text-primary-foreground font-bold animate-pulse shadow-lg"
        >
          <BookOpen className="w-4 h-4 mr-1" />
          Quiz
        </Button>
      </div>

      {/* Canvas */}
      <IsometricCanvas
        grid={baseGrid}
        buildings={buildings}
        selectedBuilding={selectedBuilding}
        ghostPos={ghostPos}
        canPlaceGhost={canPlaceGhost}
        onTileClick={handleTileClick}
        onTileHover={handleTileHover}
        onBuildingClick={handleBuildingClick}
      />

      {/* Build Menu */}
      <BuildMenu
        selectedBuilding={selectedBuilding}
        onSelect={setSelectedBuilding}
        coins={student.coins}
        diamonds={student.diamonds}
        villageLevel={student.village_level}
        isPremium={student.is_premium}
        district={student.district}
      />

      {/* Building Info Modal */}
      <BuildingInfoModal
        building={infoBuilding}
        open={showInfo}
        onOpenChange={setShowInfo}
        onUpgrade={handleUpgrade}
        onDemolish={handleDemolish}
        coins={student.coins}
        diamonds={student.diamonds}
      />
    </div>
  );
};

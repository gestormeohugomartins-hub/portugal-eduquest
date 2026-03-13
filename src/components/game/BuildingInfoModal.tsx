import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BUILDING_DEFS, PlacedBuilding, getEvolutionTier } from '@/lib/gameTypes';
import { RESOURCE_INFO } from '@/hooks/useResources';
import { getUpgradeCost } from '@/lib/gridLogic';
import { Coins, Diamond, ArrowUp, Trash2, BookOpen } from 'lucide-react';
import { MonumentInfoModal } from './MonumentInfoModal';

interface BuildingInfoModalProps {
  building: PlacedBuilding | null;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onUpgrade: (building: PlacedBuilding) => void;
  onDemolish: (building: PlacedBuilding) => void;
  coins: number;
  diamonds: number;
}

export const BuildingInfoModal = ({
  building, open, onOpenChange, onUpgrade, onDemolish, coins, diamonds,
}: BuildingInfoModalProps) => {
  const [showMonumentInfo, setShowMonumentInfo] = useState(false);

  if (!building) return null;
  const def = BUILDING_DEFS[building.defId];
  if (!def) return null;

  const isMaxLevel = building.level >= def.maxLevel;
  const upgCost = getUpgradeCost(building.defId, building.level);
  const canUpgrade = !isMaxLevel && coins >= upgCost.coins && diamonds >= upgCost.diamonds;
  const isMonument = def.category === 'monument';

  const lvlMult = 1 + (building.level - 1) * 0.5;
  const evolution = getEvolutionTier(building.level);
  const nextEvolution = building.level < def.maxLevel ? getEvolutionTier(building.level + 1) : null;

  return (
    <>
      <Dialog open={open} onOpenChange={onOpenChange}>
        <DialogContent className="max-w-sm">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2 font-display">
              <span className="text-3xl">{def.emoji}</span>
              <div>
                <div>{def.name}</div>
                <div className="text-sm font-body text-muted-foreground">
                  {evolution.emoji} {evolution.name} (Nv {building.level}/{def.maxLevel})
                </div>
                {nextEvolution && (
                  <div className="text-[10px] font-body text-primary/70">
                    Próximo: {nextEvolution.emoji} {nextEvolution.name}
                  </div>
                )}
              </div>
            </DialogTitle>
          </DialogHeader>

          <p className="text-sm font-body text-muted-foreground">{def.description}</p>

          {/* Resource costs display */}
          {def.resourceCosts.length > 0 && (
            <div className="flex items-center gap-2 flex-wrap text-xs text-muted-foreground">
              <span className="font-semibold">Custo materiais:</span>
              {def.resourceCosts.map(rc => {
                const info = RESOURCE_INFO[rc.resource];
                return (
                  <span key={rc.resource} className="flex items-center gap-0.5">
                    {info.emoji} {rc.amount} {info.label}
                  </span>
                );
              })}
            </div>
          )}

          {/* Monument educational info button */}
          {isMonument && (
            <Button
              variant="outline"
              className="w-full border-primary/30 text-primary"
              onClick={() => { setShowMonumentInfo(true); onOpenChange(false); }}
            >
              <BookOpen className="w-4 h-4 mr-2" />
              📚 Ver informação educativa
            </Button>
          )}

          {/* Stats */}
          <div className="grid grid-cols-3 gap-2 py-2">
            {def.citizenBonus > 0 && (
              <div className="text-center p-2 bg-citizen/10 rounded-lg">
                <div className="text-lg font-bold text-citizen">
                  +{Math.round(def.citizenBonus * lvlMult)}
                </div>
                <div className="text-[10px] text-muted-foreground">Cidadãos</div>
              </div>
            )}
            {def.defenseBonus > 0 && (
              <div className="text-center p-2 bg-secondary/10 rounded-lg">
                <div className="text-lg font-bold text-secondary">
                  +{Math.round(def.defenseBonus * lvlMult)}
                </div>
                <div className="text-[10px] text-muted-foreground">Defesa</div>
              </div>
            )}
            {def.xpBonus > 0 && (
              <div className="text-center p-2 bg-primary/10 rounded-lg">
                <div className="text-lg font-bold text-primary">
                  +{Math.round(def.xpBonus * lvlMult)}
                </div>
                <div className="text-[10px] text-muted-foreground">XP</div>
              </div>
            )}
          </div>

          {/* Actions */}
          <div className="flex gap-2">
            {!isMaxLevel && (
              <Button
                className="flex-1"
                disabled={!canUpgrade}
                onClick={() => { onUpgrade(building); onOpenChange(false); }}
              >
                <ArrowUp className="w-4 h-4 mr-1" />
                Evoluir
                {upgCost.coins > 0 && (
                  <span className="ml-1 flex items-center gap-0.5">
                    <Coins className="w-3 h-3" />{upgCost.coins}
                  </span>
                )}
                {upgCost.diamonds > 0 && (
                  <span className="ml-1 flex items-center gap-0.5">
                    <Diamond className="w-3 h-3" />{upgCost.diamonds}
                  </span>
                )}
              </Button>
            )}
            {isMaxLevel && (
              <div className="flex-1 text-center text-sm text-gold font-bold py-2">
                ⭐ Nível Máximo!
              </div>
            )}
            <Button
              variant="destructive"
              size="icon"
              onClick={() => { onDemolish(building); onOpenChange(false); }}
            >
              <Trash2 className="w-4 h-4" />
            </Button>
          </div>
        </DialogContent>
      </Dialog>

      {/* Monument Info Modal */}
      <MonumentInfoModal
        open={showMonumentInfo}
        onOpenChange={setShowMonumentInfo}
        buildingDefId={building.defId}
        emoji={def.emoji}
      />
    </>
  );
};

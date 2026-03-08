import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { BUILDING_DEFS, PlacedBuilding } from '@/lib/gameTypes';
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
  if (!building) return null;
  const def = BUILDING_DEFS[building.defId];
  if (!def) return null;

  const isMaxLevel = building.level >= def.maxLevel;
  const upgCost = getUpgradeCost(building.defId, building.level);
  const canUpgrade = !isMaxLevel && coins >= upgCost.coins && diamonds >= upgCost.diamonds;

  const lvlMult = 1 + (building.level - 1) * 0.5;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-sm">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display">
            <span className="text-3xl">{def.emoji}</span>
            <div>
              <div>{def.name}</div>
              <div className="text-sm font-body text-muted-foreground">
                Nível {building.level}/{def.maxLevel}
              </div>
            </div>
          </DialogTitle>
        </DialogHeader>

        <p className="text-sm font-body text-muted-foreground">{def.description}</p>

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
  );
};

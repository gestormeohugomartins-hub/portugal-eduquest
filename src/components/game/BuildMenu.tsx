import { useState } from 'react';
import { Button } from '@/components/ui/button';
import { ScrollArea } from '@/components/ui/scroll-area';
import { BUILDING_DEFS, BUILDING_CATEGORIES, BuildingDef } from '@/lib/gameTypes';
import { SFX } from '@/lib/sounds';
import { Coins, Diamond, Lock, Crown } from 'lucide-react';

interface BuildMenuProps {
  selectedBuilding: string | null;
  onSelect: (defId: string | null) => void;
  coins: number;
  diamonds: number;
  villageLevel: number;
  isPremium: boolean;
  district?: string | null;
}

export const BuildMenu = ({
  selectedBuilding, onSelect, coins, diamonds, villageLevel, isPremium, district,
}: BuildMenuProps) => {
  const [activeCategory, setActiveCategory] = useState<string>('infrastructure');

  const filteredBuildings = Object.values(BUILDING_DEFS).filter(def => {
    if (def.category !== activeCategory) return false;
    // Hide district monuments not matching player district
    if (def.districtExclusive && def.districtExclusive !== district) return false;
    return true;
  });

  const canAfford = (def: BuildingDef) => coins >= def.costCoins && diamonds >= def.costDiamonds;
  const meetsLevel = (def: BuildingDef) => villageLevel >= def.minVillageLevel;
  const meetsAccess = (def: BuildingDef) => !def.premiumOnly || isPremium;

  return (
    <div className="absolute bottom-16 left-0 right-0 z-30 bg-card/95 backdrop-blur-sm border-t-2 border-border">
      {/* Category tabs */}
      <div className="flex gap-1 px-2 py-1.5 overflow-x-auto">
        {BUILDING_CATEGORIES.map(cat => (
          <button
            key={cat.id}
            onClick={() => { setActiveCategory(cat.id); SFX.click(); }}
            className={`flex items-center gap-1 px-2.5 py-1 rounded-lg text-xs font-body font-semibold whitespace-nowrap transition-colors
              ${activeCategory === cat.id
                ? 'bg-primary text-primary-foreground'
                : 'bg-muted text-muted-foreground hover:bg-muted/80'
              }`}
          >
            <span>{cat.emoji}</span>
            <span>{cat.name}</span>
          </button>
        ))}
      </div>

      {/* Buildings list */}
      <ScrollArea className="max-h-32">
        <div className="flex gap-2 px-2 py-2 overflow-x-auto">
          {filteredBuildings.map(def => {
            const affordable = canAfford(def);
            const levelOk = meetsLevel(def);
            const accessOk = meetsAccess(def);
            const available = affordable && levelOk && accessOk;
            const isSelected = selectedBuilding === def.id;

            return (
              <button
                key={def.id}
                onClick={() => {
                  if (available) {
                    onSelect(isSelected ? null : def.id);
                    SFX.click();
                  }
                }}
                className={`flex-shrink-0 w-20 p-2 rounded-lg border-2 text-center transition-all
                  ${isSelected ? 'border-primary bg-primary/10 scale-105' : 'border-border bg-card'}
                  ${!available ? 'opacity-50 cursor-not-allowed' : 'hover:border-primary/50 cursor-pointer'}
                `}
              >
                <div className="text-2xl mb-0.5">{def.emoji}</div>
                <div className="text-[10px] font-body font-bold leading-tight truncate">{def.name}</div>
                <div className="flex items-center justify-center gap-1 mt-0.5">
                  {def.costCoins > 0 && (
                    <span className="flex items-center gap-0.5 text-[9px]">
                      <Coins className="w-2.5 h-2.5 text-gold" />{def.costCoins}
                    </span>
                  )}
                  {def.costDiamonds > 0 && (
                    <span className="flex items-center gap-0.5 text-[9px]">
                      <Diamond className="w-2.5 h-2.5 text-diamond" />{def.costDiamonds}
                    </span>
                  )}
                </div>
                {!accessOk && <Crown className="w-3 h-3 mx-auto mt-0.5 text-gold" />}
                {!levelOk && accessOk && <Lock className="w-3 h-3 mx-auto mt-0.5 text-muted-foreground" />}
              </button>
            );
          })}
          {filteredBuildings.length === 0 && (
            <p className="text-xs text-muted-foreground px-4 py-2 font-body">
              Nenhuma construção disponível nesta categoria.
            </p>
          )}
        </div>
      </ScrollArea>

      {/* Cancel button when building selected */}
      {selectedBuilding && (
        <div className="px-2 pb-2">
          <Button
            size="sm"
            variant="destructive"
            className="w-full text-xs"
            onClick={() => { onSelect(null); SFX.click(); }}
          >
            ✕ Cancelar construção
          </Button>
        </div>
      )}
    </div>
  );
};

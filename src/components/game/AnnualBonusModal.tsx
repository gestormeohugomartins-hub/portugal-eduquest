import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Crown, Building2, ArrowUp } from "lucide-react";
import { toast } from "sonner";

const ESSENTIAL_BUILDINGS = [
  { id: "hospital", name: "Hospital", emoji: "🏥" },
  { id: "town_hall", name: "Câmara Municipal", emoji: "🏛️" },
  { id: "school", name: "Escola", emoji: "🏫" },
  { id: "fire_station", name: "Quartel de Bombeiros", emoji: "🚒" },
];

interface AnnualBonusModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  studentId: string;
  existingBuildings: { building_type: string; level: number; id: string }[];
  onBonusApplied: () => void;
}

export const AnnualBonusModal = ({ open, onOpenChange, studentId, existingBuildings, onBonusApplied }: AnnualBonusModalProps) => {
  const [selected, setSelected] = useState<string | null>(null);
  const [applying, setApplying] = useState(false);

  const ownedEssentials = ESSENTIAL_BUILDINGS.filter(eb =>
    existingBuildings.some(b => b.building_type === eb.id)
  );
  const missingEssentials = ESSENTIAL_BUILDINGS.filter(eb =>
    !existingBuildings.some(b => b.building_type === eb.id)
  );

  const hasAllEssentials = missingEssentials.length === 0;

  const handleApply = async () => {
    if (!selected) return;
    setApplying(true);

    try {
      if (hasAllEssentials) {
        // Upgrade selected building by +2 levels
        const building = existingBuildings.find(b => b.building_type === selected);
        if (building) {
          await supabase
            .from("buildings")
            .update({ level: building.level + 2 })
            .eq("id", building.id);
          toast.success(`${ESSENTIAL_BUILDINGS.find(e => e.id === selected)?.emoji} Edifício melhorado em +2 níveis!`);
        }
      } else {
        // Place new building at a free position
        await supabase
          .from("buildings")
          .insert({
            student_id: studentId,
            building_type: selected,
            level: 1,
            position_x: 5 + Math.floor(Math.random() * 5),
            position_y: 5 + Math.floor(Math.random() * 5),
          });
        toast.success(`${ESSENTIAL_BUILDINGS.find(e => e.id === selected)?.emoji} Edifício colocado na tua aldeia!`);
      }

      // Mark bonus as used
      await supabase
        .from("students")
        .update({ annual_bonus_building: selected } as any)
        .eq("id", studentId);

      onBonusApplied();
      onOpenChange(false);
    } catch (err: any) {
      toast.error("Erro ao aplicar bónus: " + err.message);
    }
    setApplying(false);
  };

  const options = hasAllEssentials ? ownedEssentials : missingEssentials;

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md">
        <DialogHeader>
          <DialogTitle className="font-display text-xl flex items-center gap-2">
            <Crown className="w-6 h-6 text-gold" />
            Bónus Anual Premium
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-4">
          <p className="font-body text-sm text-muted-foreground">
            {hasAllEssentials
              ? "Já tens todos os edifícios essenciais! Escolhe um para melhorar +2 níveis:"
              : "Escolhe um edifício essencial grátis para a tua aldeia:"}
          </p>

          <div className="grid grid-cols-2 gap-2">
            {options.map(building => {
              const existing = existingBuildings.find(b => b.building_type === building.id);
              return (
                <button
                  key={building.id}
                  onClick={() => setSelected(building.id)}
                  className={`rounded-lg border-2 p-4 text-center transition-all ${
                    selected === building.id
                      ? "border-gold bg-gold/10"
                      : "border-border hover:border-gold/50"
                  }`}
                >
                  <div className="text-3xl mb-1">{building.emoji}</div>
                  <p className="font-display font-bold text-sm">{building.name}</p>
                  {hasAllEssentials && existing && (
                    <p className="font-body text-xs text-muted-foreground flex items-center justify-center gap-1 mt-1">
                      <ArrowUp className="w-3 h-3" /> Nv.{existing.level} → Nv.{existing.level + 2}
                    </p>
                  )}
                </button>
              );
            })}
          </div>

          <Button
            className="w-full bg-gold text-foreground font-bold"
            onClick={handleApply}
            disabled={!selected || applying}
          >
            {applying ? "A aplicar..." : hasAllEssentials ? "Melhorar Edifício" : "Construir Edifício"}
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

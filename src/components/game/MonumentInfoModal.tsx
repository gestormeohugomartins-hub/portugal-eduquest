import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Separator } from "@/components/ui/separator";
import { ScrollArea } from "@/components/ui/scroll-area";
import { BookOpen, Calendar, Lightbulb, MapPin, Landmark } from "lucide-react";

interface MonumentInfo {
  id: string;
  building_def_id: string;
  district: string;
  full_name: string;
  historical_period: string | null;
  year_built: string | null;
  description_short: string;
  description_long: string;
  fun_fact: string | null;
  educational_topic: string | null;
}

interface MonumentInfoModalProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
  buildingDefId: string | null;
  emoji: string;
}

const districtLabels: Record<string, string> = {
  aveiro: "Aveiro", beja: "Beja", braga: "Braga", braganca: "Bragança",
  castelo_branco: "Castelo Branco", coimbra: "Coimbra", evora: "Évora",
  faro: "Faro", guarda: "Guarda", leiria: "Leiria", lisboa: "Lisboa",
  portalegre: "Portalegre", porto: "Porto", santarem: "Santarém",
  setubal: "Setúbal", viana_castelo: "Viana do Castelo", vila_real: "Vila Real",
  viseu: "Viseu", acores: "Açores", madeira: "Madeira",
};

export const MonumentInfoModal = ({ open, onOpenChange, buildingDefId, emoji }: MonumentInfoModalProps) => {
  const [info, setInfo] = useState<MonumentInfo | null>(null);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    if (open && buildingDefId) {
      setLoading(true);
      supabase
        .from("monument_info")
        .select("*")
        .eq("building_def_id", buildingDefId)
        .single()
        .then(({ data }) => {
          setInfo(data as MonumentInfo | null);
          setLoading(false);
        });
    }
  }, [open, buildingDefId]);

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-md max-h-[85vh]">
        <DialogHeader>
          <DialogTitle className="flex items-center gap-2 font-display text-lg">
            <span className="text-3xl">{emoji}</span>
            <div>
              <div>{info?.full_name || "Monumento"}</div>
              {info?.district && (
                <div className="text-sm font-body text-muted-foreground flex items-center gap-1">
                  <MapPin className="w-3 h-3" />
                  {districtLabels[info.district] || info.district}
                </div>
              )}
            </div>
          </DialogTitle>
        </DialogHeader>

        {loading ? (
          <div className="text-center py-8 text-muted-foreground text-sm">A carregar...</div>
        ) : info ? (
          <ScrollArea className="max-h-[60vh] pr-2">
            <div className="space-y-4">
              {/* Period & Date */}
              <div className="flex flex-wrap gap-2">
                {info.historical_period && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Landmark className="w-3 h-3" />
                    {info.historical_period}
                  </Badge>
                )}
                {info.year_built && (
                  <Badge variant="outline" className="flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {info.year_built}
                  </Badge>
                )}
              </div>

              {/* Short description */}
              <p className="text-sm font-body font-medium text-foreground">
                {info.description_short}
              </p>

              <Separator />

              {/* Long description */}
              <div>
                <h4 className="text-sm font-display font-bold mb-2 flex items-center gap-1">
                  <BookOpen className="w-4 h-4 text-primary" />
                  História
                </h4>
                <p className="text-sm font-body text-muted-foreground leading-relaxed">
                  {info.description_long}
                </p>
              </div>

              {/* Fun fact */}
              {info.fun_fact && (
                <div className="p-3 bg-accent/50 rounded-lg border border-accent">
                  <h4 className="text-sm font-display font-bold mb-1 flex items-center gap-1">
                    <Lightbulb className="w-4 h-4 text-gold" />
                    Sabias que...?
                  </h4>
                  <p className="text-sm font-body text-muted-foreground">
                    {info.fun_fact}
                  </p>
                </div>
              )}

              {/* Educational topic */}
              {info.educational_topic && (
                <div className="text-xs text-muted-foreground font-body">
                  📚 Tema educativo: <strong>{info.educational_topic}</strong>
                </div>
              )}
            </div>
          </ScrollArea>
        ) : (
          <p className="text-sm text-muted-foreground text-center py-4">
            Informação não disponível para este monumento.
          </p>
        )}
      </DialogContent>
    </Dialog>
  );
};

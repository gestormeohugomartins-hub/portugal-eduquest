import { useState, useEffect, useMemo } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { MapPin, Save, Loader2, Search } from "lucide-react";
import { toast } from "sonner";

interface School {
  id: string;
  name: string;
  district: string;
}

interface Student {
  id: string;
  display_name: string;
  school_id?: string | null;
  school_name?: string | null;
}

interface SchoolSelectorProps {
  children: Student[];
  onUpdate: () => void;
}

const districts = [
  { value: "Aveiro", label: "Aveiro" }, { value: "Beja", label: "Beja" },
  { value: "Braga", label: "Braga" }, { value: "Bragança", label: "Bragança" },
  { value: "Castelo Branco", label: "Castelo Branco" }, { value: "Coimbra", label: "Coimbra" },
  { value: "Évora", label: "Évora" }, { value: "Faro", label: "Faro" },
  { value: "Guarda", label: "Guarda" }, { value: "Leiria", label: "Leiria" },
  { value: "Lisboa", label: "Lisboa" }, { value: "Portalegre", label: "Portalegre" },
  { value: "Porto", label: "Porto" }, { value: "Santarém", label: "Santarém" },
  { value: "Setúbal", label: "Setúbal" }, { value: "Viana do Castelo", label: "Viana do Castelo" },
  { value: "Vila Real", label: "Vila Real" }, { value: "Viseu", label: "Viseu" },
  { value: "Açores", label: "Açores" }, { value: "Madeira", label: "Madeira" },
];

export const SchoolSelector = ({ children, onUpdate }: SchoolSelectorProps) => {
  const [saving, setSaving] = useState<string | null>(null);
  const [childState, setChildState] = useState<Record<string, { district: string; schoolId: string }>>({});
  const [allSchools, setAllSchools] = useState<School[]>([]);
  const [loadingSchools, setLoadingSchools] = useState(false);
  const [searchQuery, setSearchQuery] = useState<Record<string, string>>({});

  useEffect(() => {
    const init: Record<string, { district: string; schoolId: string }> = {};
    children.forEach(c => {
      init[c.id] = { district: "", schoolId: c.school_id || "" };
    });
    setChildState(init);
  }, [children]);

  const handleDistrictChange = async (childId: string, district: string) => {
    setChildState(prev => ({ ...prev, [childId]: { district, schoolId: "" } }));
    setLoadingSchools(true);
    
    const { data } = await supabase
      .from("schools")
      .select("id, name, district")
      .eq("district", district)
      .order("name");
    
    setFilteredSchools(data || []);
    setLoadingSchools(false);
  };

  const handleSchoolChange = (childId: string, schoolId: string) => {
    setChildState(prev => ({ ...prev, [childId]: { ...prev[childId], schoolId } }));
  };

  const handleSave = async (childId: string) => {
    const state = childState[childId];
    if (!state?.schoolId) { toast.error("Selecione uma escola"); return; }

    setSaving(childId);
    const school = filteredSchools.find(s => s.id === state.schoolId);
    const { error } = await supabase
      .from("students")
      .update({ school_id: state.schoolId, school_name: school?.name || null })
      .eq("id", childId);

    if (error) toast.error("Erro ao guardar escola");
    else { toast.success("Escola atualizada!"); onUpdate(); }
    setSaving(null);
  };

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-4">
        <MapPin className="w-5 h-5 text-primary" />
        <h3 className="font-display text-lg font-bold">Seleção de Escola</h3>
      </div>
      
      {children.map(child => (
        <div key={child.id} className="border border-border rounded-lg p-4">
          <h4 className="font-body font-bold mb-3">{child.display_name}</h4>
          {child.school_name && (
            <p className="text-sm text-muted-foreground mb-3">
              Escola atual: <strong>{child.school_name}</strong>
            </p>
          )}
          
          <div className="grid grid-cols-1 md:grid-cols-2 gap-3 mb-3">
            <div>
              <Label className="text-xs font-medium">Distrito</Label>
              <Select 
                value={childState[child.id]?.district || ""} 
                onValueChange={(v) => handleDistrictChange(child.id, v)}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Escolha o distrito" />
                </SelectTrigger>
                <SelectContent>
                  {districts.map(d => (
                    <SelectItem key={d.value} value={d.value}>{d.label}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-xs font-medium">Escola</Label>
              <Select 
                value={childState[child.id]?.schoolId || ""} 
                onValueChange={(v) => handleSchoolChange(child.id, v)}
                disabled={!childState[child.id]?.district || loadingSchools}
              >
                <SelectTrigger>
                  <SelectValue placeholder={loadingSchools ? "A carregar..." : "Escolha a escola"} />
                </SelectTrigger>
                <SelectContent>
                  {filteredSchools.map(s => (
                    <SelectItem key={s.id} value={s.id}>{s.name}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
          </div>
          
          <Button 
            onClick={() => handleSave(child.id)}
            disabled={saving === child.id || !childState[child.id]?.schoolId}
            size="sm"
            className="w-full"
          >
            {saving === child.id ? (
              <><Loader2 className="w-4 h-4 mr-2 animate-spin" />A guardar...</>
            ) : (
              <><Save className="w-4 h-4 mr-2" />Guardar Escola</>
            )}
          </Button>
        </div>
      ))}
    </div>
  );
};

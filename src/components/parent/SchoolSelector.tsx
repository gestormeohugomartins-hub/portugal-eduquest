import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { MapPin, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";

interface School {
  id: string;
  name: string;
  district: string;
  municipality: string | null;
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
  { value: "aveiro", label: "Aveiro" }, { value: "beja", label: "Beja" },
  { value: "braga", label: "Braga" }, { value: "braganca", label: "Bragança" },
  { value: "castelo_branco", label: "Castelo Branco" }, { value: "coimbra", label: "Coimbra" },
  { value: "evora", label: "Évora" }, { value: "faro", label: "Faro" },
  { value: "guarda", label: "Guarda" }, { value: "leiria", label: "Leiria" },
  { value: "lisboa", label: "Lisboa" }, { value: "portalegre", label: "Portalegre" },
  { value: "porto", label: "Porto" }, { value: "santarem", label: "Santarém" },
  { value: "setubal", label: "Setúbal" }, { value: "viana_castelo", label: "Viana do Castelo" },
  { value: "vila_real", label: "Vila Real" }, { value: "viseu", label: "Viseu" },
  { value: "acores", label: "Açores" }, { value: "madeira", label: "Madeira" },
];

export const SchoolSelector = ({ children, onUpdate }: SchoolSelectorProps) => {
  const [schools, setSchools] = useState<School[]>([]);
  const [filteredMunicipalities, setFilteredMunicipalities] = useState<string[]>([]);
  const [filteredLocalities, setFilteredLocalities] = useState<string[]>([]);
  const [filteredSchools, setFilteredSchools] = useState<School[]>([]);
  const [saving, setSaving] = useState<string | null>(null);
  const [childSchools, setChildSchools] = useState<Record<string, { 
    selectedDistrict: string; 
    selectedMunicipality: string;
    selectedLocality: string;
    selectedSchool: string;
  }>>({});

  useEffect(() => {
    loadSchools();
    initializeChildSchools();
  }, [children]);

  const loadSchools = async () => {
    const { data } = await supabase
      .from("schools")
      .select("*")
      .order("name");
    setSchools(data || []);
  };

  const initializeChildSchools = () => {
    const initialStates: Record<string, { selectedDistrict: string; selectedMunicipality: string; selectedLocality: string; selectedSchool: string }> = {};
    children.forEach(child => {
      // Find current school info if exists
      const currentSchool = schools.find(s => s.id === child.school_id);
      initialStates[child.id] = {
        selectedDistrict: currentSchool?.district || "",
        selectedMunicipality: currentSchool?.municipality || "",
        selectedLocality: currentSchool?.locality || "",
        selectedSchool: child.school_id || "",
      };
    });
    setChildSchools(initialStates);
  };

  const handleDistrictChange = (childId: string, district: string) => {
    const newState = { ...childSchools[childId], selectedDistrict: district, selectedMunicipality: "", selectedSchool: "" };
    setChildSchools(prev => ({ ...prev, [childId]: newState }));
    
    // Update municipalities list
    const districtSchools = schools.filter(s => s.district === district);
    const municipalities = [...new Set(districtSchools.map(s => s.municipality).filter(Boolean))].sort();
    setFilteredMunicipalities(municipalities);
    setFilteredSchools([]);
  };

  const handleMunicipalityChange = (childId: string, municipality: string) => {
    const newState = { ...childSchools[childId], selectedMunicipality: municipality, selectedSchool: "" };
    setChildSchools(prev => ({ ...prev, [childId]: newState }));
    
    // Update schools list
    const currentDistrict = childSchools[childId]?.selectedDistrict || "";
    const municipalitySchools = schools.filter(s => 
      s.district === currentDistrict && s.municipality === municipality
    ).sort((a, b) => a.name.localeCompare(b.name));
    setFilteredSchools(municipalitySchools);
  };

  const handleSchoolChange = (childId: string, schoolId: string) => {
    setChildSchools(prev => ({ 
      ...prev, 
      [childId]: { ...prev[childId], selectedSchool: schoolId }
    }));
  };

  const handleSaveSchool = async (childId: string) => {
    const schoolId = childSchools[childId]?.selectedSchool;
    if (!schoolId) {
      toast.error("Selecione uma escola");
      return;
    }

    setSaving(childId);
    
    const school = schools.find(s => s.id === schoolId);
    const { error } = await supabase
      .from("students")
      .update({
        school_id: schoolId,
        school_name: school?.name || null,
      })
      .eq("id", childId);

    if (error) {
      toast.error("Erro ao guardar escola");
    } else {
      toast.success("Escola atualizada com sucesso!");
      onUpdate();
    }
    setSaving(null);
  };

  const getDistrictLabel = (value: string) => {
    return districts.find(d => d.value === value)?.label || value;
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
          
          <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-3">
            <div>
              <Label className="text-xs font-medium">Distrito</Label>
              <Select 
                value={childSchools[child.id]?.selectedDistrict || ""} 
                onValueChange={(value) => handleDistrictChange(child.id, value)}
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
              <Label className="text-xs font-medium">Município</Label>
              <Select 
                value={childSchools[child.id]?.selectedMunicipality || ""} 
                onValueChange={(value) => handleMunicipalityChange(child.id, value)}
                disabled={!childSchools[child.id]?.selectedDistrict}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Escolha o município" />
                </SelectTrigger>
                <SelectContent>
                  {filteredMunicipalities.map(m => (
                    <SelectItem key={m} value={m}>{m}</SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            
            <div>
              <Label className="text-xs font-medium">Escola</Label>
              <Select 
                value={childSchools[child.id]?.selectedSchool || ""} 
                onValueChange={(value) => handleSchoolChange(child.id, value)}
                disabled={!childSchools[child.id]?.selectedMunicipality}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Escolha a escola" />
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
            onClick={() => handleSaveSchool(child.id)}
            disabled={saving === child.id || !childSchools[child.id]?.selectedSchool}
            size="sm"
            className="w-full"
          >
            {saving === child.id ? (
              <>
                <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                A guardar...
              </>
            ) : (
              <>
                <Save className="w-4 h-4 mr-2" />
                Guardar Escola
              </>
            )}
          </Button>
        </div>
      ))}
    </div>
  );
};
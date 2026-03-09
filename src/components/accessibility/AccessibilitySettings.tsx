import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { toast } from "sonner";
import { Eye } from "lucide-react";

interface AccessibilitySettingsProps {
  userId: string;
  table: "profiles" | "students";
  idField?: "user_id" | "id";
}

export const AccessibilitySettings = ({ userId, table, idField = "user_id" }: AccessibilitySettingsProps) => {
  const [magnifier, setMagnifier] = useState(false);
  const [dyslexia, setDyslexia] = useState(false);
  const [colorblindFilter, setColorblindFilter] = useState<string>("none");
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const load = async () => {
      const { data } = await supabase
        .from(table)
        .select("accessibility_magnifier, accessibility_dyslexia, accessibility_colorblind_filter")
        .eq(idField, userId)
        .single();
      if (data) {
        setMagnifier(data.accessibility_magnifier || false);
        setDyslexia(data.accessibility_dyslexia || false);
        setColorblindFilter(data.accessibility_colorblind_filter || "none");
      }
      setLoading(false);
    };
    load();
  }, [userId, table, idField]);

  const save = async (field: string, value: any) => {
    const { error } = await supabase
      .from(table)
      .update({ [field]: value })
      .eq(idField, userId);
    if (error) toast.error("Erro ao guardar definição");
    else toast.success("Definição guardada");
  };

  if (loading) return <p className="font-body text-sm text-muted-foreground">A carregar...</p>;

  return (
    <div className="space-y-4">
      <div className="flex items-center gap-2 mb-2">
        <Eye className="w-5 h-5 text-primary" />
        <h3 className="font-body font-bold">Acessibilidade</h3>
      </div>

      <div className="flex items-center justify-between">
        <Label className="font-body text-sm">Lupa (amplificação)</Label>
        <Switch checked={magnifier} onCheckedChange={v => { setMagnifier(v); save("accessibility_magnifier", v); }} />
      </div>

      <div className="flex items-center justify-between">
        <Label className="font-body text-sm">Modo Dislexia</Label>
        <Switch checked={dyslexia} onCheckedChange={v => { setDyslexia(v); save("accessibility_dyslexia", v); }} />
      </div>

      <div>
        <Label className="font-body text-sm mb-1 block">Filtro de Daltonismo</Label>
        <Select value={colorblindFilter} onValueChange={v => {
          setColorblindFilter(v);
          save("accessibility_colorblind_filter", v === "none" ? null : v);
        }}>
          <SelectTrigger><SelectValue /></SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Sem filtro</SelectItem>
            <SelectItem value="protanopia">Protanopia (vermelho-verde)</SelectItem>
            <SelectItem value="deuteranopia">Deuteranopia (verde-vermelho)</SelectItem>
            <SelectItem value="tritanopia">Tritanopia (azul-amarelo)</SelectItem>
          </SelectContent>
        </Select>
      </div>
    </div>
  );
};

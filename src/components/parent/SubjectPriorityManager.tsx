import { useState, useEffect } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Slider } from "@/components/ui/slider";
import { Label } from "@/components/ui/label";
import { Button } from "@/components/ui/button";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { toast } from "sonner";
import { BookOpen, Save } from "lucide-react";

interface SubjectPriorityManagerProps {
  parentId: string;
  children: { id: string; display_name: string; nickname?: string; school_year: string }[];
}

const subjectLabels: Record<string, string> = {
  portugues: "Português",
  matematica: "Matemática",
  estudo_meio: "Estudo do Meio",
  ingles: "Inglês",
};

export const SubjectPriorityManager = ({ parentId, children: kids }: SubjectPriorityManagerProps) => {
  const [priorities, setPriorities] = useState<Record<string, Record<string, number>>>({});
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    if (kids.length === 0) return;

    const load = async () => {
      const { data } = await supabase
        .from("subject_priorities")
        .select("*")
        .eq("parent_id", parentId);

      const map: Record<string, Record<string, number>> = {};
      kids.forEach(k => {
        const subjects = getSubjectsForYear(k.school_year);
        map[k.id] = {};
        subjects.forEach(s => { map[k.id][s] = 1; });
      });

      data?.forEach(p => {
        if (map[p.student_id]) map[p.student_id][p.subject] = p.priority;
      });

      setPriorities(map);
    };
    load();
  }, [kids, parentId]);

  const getSubjectsForYear = (year: string): string[] => {
    const base = ["portugues", "matematica", "estudo_meio"];
    if (year === "3" || year === "4") base.push("ingles");
    return base;
  };

  const handleChange = (childId: string, subject: string, value: number) => {
    setPriorities(prev => ({
      ...prev,
      [childId]: { ...prev[childId], [subject]: value },
    }));
  };

  const handleSave = async (childId: string) => {
    setSaving(true);
    const childPriorities = priorities[childId];
    if (!childPriorities) return;

    // Delete existing then insert
    await supabase.from("subject_priorities").delete().eq("student_id", childId).eq("parent_id", parentId);

    const rows = Object.entries(childPriorities).map(([subject, priority]) => ({
      student_id: childId,
      parent_id: parentId,
      subject: subject as any,
      priority,
    }));

    const { error } = await supabase.from("subject_priorities").insert(rows);
    if (error) toast.error("Erro ao guardar prioridades");
    else toast.success("Prioridades guardadas!");
    setSaving(false);
  };

  if (kids.length === 0) {
    return <p className="font-body text-sm text-muted-foreground">Sem educandos registados.</p>;
  }

  return (
    <div>
      <div className="flex items-center gap-2 mb-2">
        <BookOpen className="w-5 h-5 text-primary" />
        <h3 className="font-body font-bold">Prioridade de Disciplinas</h3>
      </div>
      <p className="font-body text-xs text-muted-foreground mb-4">
        Ajuste a incidência de cada disciplina nos quizzes. Valores mais altos = mais perguntas.
      </p>

      <Tabs defaultValue={kids[0]?.id}>
        <TabsList className="w-full mb-3">
          {kids.map(k => (
            <TabsTrigger key={k.id} value={k.id} className="font-body text-xs flex-1">
              {k.nickname || k.display_name}
            </TabsTrigger>
          ))}
        </TabsList>

        {kids.map(k => {
          const subjects = getSubjectsForYear(k.school_year);
          return (
            <TabsContent key={k.id} value={k.id}>
              <div className="space-y-4">
                {subjects.map(subject => (
                  <div key={subject}>
                    <div className="flex items-center justify-between mb-1">
                      <Label className="font-body text-sm">{subjectLabels[subject]}</Label>
                      <span className="font-body text-xs text-muted-foreground">
                        {priorities[k.id]?.[subject] || 1}/5
                      </span>
                    </div>
                    <Slider
                      min={1}
                      max={5}
                      step={1}
                      value={[priorities[k.id]?.[subject] || 1]}
                      onValueChange={([v]) => handleChange(k.id, subject, v)}
                    />
                  </div>
                ))}
                <Button onClick={() => handleSave(k.id)} disabled={saving} size="sm" className="w-full">
                  <Save className="w-4 h-4 mr-1" /> Guardar Prioridades
                </Button>
              </div>
            </TabsContent>
          );
        })}
      </Tabs>
    </div>
  );
};

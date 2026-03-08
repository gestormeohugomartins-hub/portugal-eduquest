import { useState } from "react";
import { supabase } from "@/integrations/supabase/client";
import { Switch } from "@/components/ui/switch";
import { Settings, Bell } from "lucide-react";
import { toast } from "sonner";

interface SettingsPanelProps {
  studentId: string;
  quizRemindersEnabled: boolean;
  onUpdate: () => void;
}

export const SettingsPanel = ({ studentId, quizRemindersEnabled, onUpdate }: SettingsPanelProps) => {
  const [reminders, setReminders] = useState(quizRemindersEnabled);
  const [saving, setSaving] = useState(false);

  const toggleReminders = async (enabled: boolean) => {
    setSaving(true);
    setReminders(enabled);
    const { error } = await supabase
      .from("students")
      .update({ quiz_reminders_enabled: enabled } as any)
      .eq("id", studentId);
    setSaving(false);

    if (error) {
      setReminders(!enabled);
      toast.error("Erro ao guardar definição.");
    } else {
      toast.success(enabled ? "Lembretes de quiz ativados." : "Lembretes de quiz desativados.");
      onUpdate();
    }
  };

  return (
    <div className="space-y-3">
      <h3 className="font-display text-sm font-bold flex items-center gap-2">
        <Settings className="w-4 h-4 text-muted-foreground" />
        Definições
      </h3>
      <div className="bg-card rounded-lg border border-border p-3 space-y-3">
        <div className="flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <Bell className="w-4 h-4 text-primary flex-shrink-0" />
            <div className="min-w-0">
              <p className="font-body text-xs font-bold">Lembretes de quiz</p>
              <p className="font-body text-[10px] text-muted-foreground">Notificação diária às 18h</p>
            </div>
          </div>
          <Switch
            checked={reminders}
            onCheckedChange={toggleReminders}
            disabled={saving}
            className="flex-shrink-0"
          />
        </div>
      </div>
    </div>
  );
};

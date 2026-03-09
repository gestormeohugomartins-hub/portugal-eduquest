import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AccessibilitySettings {
  magnifierEnabled: boolean;
  dyslexiaEnabled: boolean;
  colorblindFilter: string | null;
}

export const useAccessibility = ({ studentId, userId }: { studentId?: string; userId?: string } = {}) => {
  const [settings, setSettings] = useState<AccessibilitySettings>({
    magnifierEnabled: false,
    dyslexiaEnabled: false,
    colorblindFilter: null,
  });

  useEffect(() => {
    if (!studentId && !userId) return;

    const fetchSettings = async () => {
      if (studentId) {
        const { data, error } = await supabase
          .from("students")
          .select("accessibility_magnifier, accessibility_dyslexia, accessibility_colorblind_filter")
          .eq("id", studentId)
          .single();
        if (error || !data) return;
        setSettings({
          magnifierEnabled: data.accessibility_magnifier || false,
          dyslexiaEnabled: data.accessibility_dyslexia || false,
          colorblindFilter: data.accessibility_colorblind_filter,
        });
      } else if (userId) {
        const { data, error } = await supabase
          .from("profiles")
          .select("accessibility_magnifier, accessibility_dyslexia, accessibility_colorblind_filter")
          .eq("user_id", userId)
          .single();
        if (error || !data) return;
        setSettings({
          magnifierEnabled: data.accessibility_magnifier || false,
          dyslexiaEnabled: data.accessibility_dyslexia || false,
          colorblindFilter: data.accessibility_colorblind_filter,
        });
      }
    };

    fetchSettings();
  }, [studentId, userId]);

  useEffect(() => {
    const body = document.body;
    body.classList.remove('accessibility-dyslexia', 'accessibility-colorblind-protanopia', 'accessibility-colorblind-deuteranopia', 'accessibility-colorblind-tritanopia');
    if (settings.dyslexiaEnabled) body.classList.add('accessibility-dyslexia');
    if (settings.colorblindFilter) body.classList.add(`accessibility-colorblind-${settings.colorblindFilter}`);
    return () => {
      body.classList.remove('accessibility-dyslexia', 'accessibility-colorblind-protanopia', 'accessibility-colorblind-deuteranopia', 'accessibility-colorblind-tritanopia');
    };
  }, [settings.dyslexiaEnabled, settings.colorblindFilter]);

  return settings;
};

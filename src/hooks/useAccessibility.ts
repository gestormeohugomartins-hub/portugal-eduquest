import { useEffect, useState } from "react";
import { supabase } from "@/integrations/supabase/client";

interface AccessibilitySettings {
  magnifierEnabled: boolean;
  dyslexiaEnabled: boolean;
  colorblindFilter: string | null;
}

export const useAccessibility = (studentId?: string) => {
  const [settings, setSettings] = useState<AccessibilitySettings>({
    magnifierEnabled: false,
    dyslexiaEnabled: false,
    colorblindFilter: null,
  });

  useEffect(() => {
    if (!studentId) return;

    const fetchSettings = async () => {
      const { data, error } = await supabase
        .from("students")
        .select("accessibility_magnifier, accessibility_dyslexia, accessibility_colorblind_filter")
        .eq("id", studentId)
        .single();

      if (error) {
        console.error("Error fetching accessibility settings:", error);
        return;
      }

      if (data) {
        setSettings({
          magnifierEnabled: data.accessibility_magnifier || false,
          dyslexiaEnabled: data.accessibility_dyslexia || false,
          colorblindFilter: data.accessibility_colorblind_filter,
        });
      }
    };

    fetchSettings();
  }, [studentId]);

  // Apply accessibility classes to body
  useEffect(() => {
    const body = document.body;
    
    // Remove existing classes
    body.classList.remove('accessibility-dyslexia');
    body.classList.remove('accessibility-colorblind-protanopia');
    body.classList.remove('accessibility-colorblind-deuteranopia');
    body.classList.remove('accessibility-colorblind-tritanopia');

    // Apply dyslexia class if enabled
    if (settings.dyslexiaEnabled) {
      body.classList.add('accessibility-dyslexia');
    }

    // Apply colorblind filter if set
    if (settings.colorblindFilter) {
      body.classList.add(`accessibility-colorblind-${settings.colorblindFilter}`);
    }

    return () => {
      // Cleanup on unmount
      body.classList.remove('accessibility-dyslexia');
      body.classList.remove('accessibility-colorblind-protanopia');
      body.classList.remove('accessibility-colorblind-deuteranopia');
      body.classList.remove('accessibility-colorblind-tritanopia');
    };
  }, [settings.dyslexiaEnabled, settings.colorblindFilter]);

  return settings;
};
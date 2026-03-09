import React from "react";
import { MagnifierGlass } from "./MagnifierGlass";
import { TextHighlighter } from "./TextHighlighter";
import { useAccessibility } from "@/hooks/useAccessibility";

interface AccessibilityWrapperProps {
  children: React.ReactNode;
  studentId?: string;
}

export const AccessibilityWrapper = ({ children, studentId }: AccessibilityWrapperProps) => {
  const settings = useAccessibility(studentId);

  return (
    <>
      {/* SVG filters for colorblind support */}
      <svg width="0" height="0" style={{ position: 'absolute' }}>
        <defs>
          {/* Protanopia (red-green colorblind) */}
          <filter id="protanopia">
            <feColorMatrix
              type="matrix"
              values="0.567 0.433 0.000 0.000 0.000
                      0.558 0.442 0.000 0.000 0.000  
                      0.000 0.242 0.758 0.000 0.000
                      0.000 0.000 0.000 1.000 0.000"
            />
          </filter>
          
          {/* Deuteranopia (green-red colorblind) */}
          <filter id="deuteranopia">
            <feColorMatrix
              type="matrix"
              values="0.625 0.375 0.000 0.000 0.000
                      0.700 0.300 0.000 0.000 0.000
                      0.000 0.300 0.700 0.000 0.000
                      0.000 0.000 0.000 1.000 0.000"
            />
          </filter>
          
          {/* Tritanopia (blue-yellow colorblind) */}
          <filter id="tritanopia">
            <feColorMatrix
              type="matrix"
              values="0.950 0.050 0.000 0.000 0.000
                      0.000 0.433 0.567 0.000 0.000
                      0.000 0.475 0.525 0.000 0.000
                      0.000 0.000 0.000 1.000 0.000"
            />
          </filter>
        </defs>
      </svg>

      {/* Main content */}
      {children}
      
      {/* Accessibility components */}
      <MagnifierGlass enabled={settings.magnifierEnabled} />
      <TextHighlighter enabled={settings.dyslexiaEnabled} />
    </>
  );
};
import React, { useEffect, useRef, useState } from "react";

interface MagnifierGlassProps {
  enabled: boolean;
  zoomLevel?: number;
  width?: number;
  height?: number;
}

export const MagnifierGlass = ({ 
  enabled, 
  zoomLevel = 2, 
  width = 200, 
  height = 150 
}: MagnifierGlassProps) => {
  const [position, setPosition] = useState({ x: 0, y: 0 });
  const [isVisible, setIsVisible] = useState(false);
  const magnifierRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (!enabled) {
      setIsVisible(false);
      return;
    }

    const handleMouseMove = (e: MouseEvent) => {
      const x = e.clientX - width / 2;
      const y = e.clientY - height / 2;
      setPosition({ x, y });
      
      if (!isVisible) {
        setIsVisible(true);
      }
    };

    const handleMouseLeave = () => {
      setIsVisible(false);
    };

    document.addEventListener('mousemove', handleMouseMove);
    document.addEventListener('mouseleave', handleMouseLeave);

    return () => {
      document.removeEventListener('mousemove', handleMouseMove);
      document.removeEventListener('mouseleave', handleMouseLeave);
    };
  }, [enabled, width, height, isVisible]);

  if (!enabled || !isVisible) return null;

  return (
    <div
      ref={magnifierRef}
      className="fixed pointer-events-none z-[9999] border-2 border-primary rounded-lg overflow-hidden bg-background shadow-lg"
      style={{
        left: position.x,
        top: position.y,
        width: width,
        height: height,
        transform: 'translate(0, 0)',
      }}
    >
      <svg width={width} height={height} className="absolute inset-0">
        <defs>
          <filter id="magnifier" x="0%" y="0%" width="100%" height="100%">
            <feOffset in="SourceGraphic" dx="0" dy="0" />
          </filter>
        </defs>
        <foreignObject
          x="0"
          y="0"
          width={width}
          height={height}
          style={{
            transform: `scale(${zoomLevel})`,
            transformOrigin: '0 0',
            filter: 'url(#magnifier)',
          }}
        >
          <div
            style={{
              width: width / zoomLevel,
              height: height / zoomLevel,
              transform: `translate(${-position.x / zoomLevel}px, ${-position.y / zoomLevel}px)`,
              overflow: 'hidden',
            }}
          >
            <div
              dangerouslySetInnerHTML={{
                __html: document.documentElement.outerHTML
              }}
              style={{
                pointerEvents: 'none',
                userSelect: 'none',
              }}
            />
          </div>
        </foreignObject>
      </svg>
    </div>
  );
};
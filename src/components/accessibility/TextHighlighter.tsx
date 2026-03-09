import React, { useEffect } from "react";

interface TextHighlighterProps {
  enabled: boolean;
}

export const TextHighlighter = ({ enabled }: TextHighlighterProps) => {
  useEffect(() => {
    if (!enabled) return;

    const handleMouseOver = (e: Event) => {
      const target = e.target as HTMLElement;
      
      // Check if the target contains text
      if (target && target.nodeType === Node.ELEMENT_NODE) {
        // Find the closest text-containing element
        const textElement = findTextElement(target);
        if (textElement && textElement.textContent?.trim()) {
          textElement.classList.add('accessibility-text-highlight');
        }
      }
    };

    const handleMouseOut = (e: Event) => {
      const target = e.target as HTMLElement;
      
      if (target && target.nodeType === Node.ELEMENT_NODE) {
        const textElement = findTextElement(target);
        if (textElement) {
          textElement.classList.remove('accessibility-text-highlight');
        }
      }
    };

    const findTextElement = (element: HTMLElement): HTMLElement | null => {
      // Check if current element has direct text content
      const hasDirectText = Array.from(element.childNodes).some(
        node => node.nodeType === Node.TEXT_NODE && node.textContent?.trim()
      );
      
      if (hasDirectText) return element;
      
      // Check for common text-containing elements
      const textTags = ['P', 'SPAN', 'DIV', 'H1', 'H2', 'H3', 'H4', 'H5', 'H6', 'BUTTON', 'A', 'LI'];
      if (textTags.includes(element.tagName) && element.textContent?.trim()) {
        return element;
      }
      
      return null;
    };

    // Add event listeners to the entire document
    document.addEventListener('mouseover', handleMouseOver);
    document.addEventListener('mouseout', handleMouseOut);

    return () => {
      document.removeEventListener('mouseover', handleMouseOver);
      document.removeEventListener('mouseout', handleMouseOut);
      
      // Clean up any remaining highlights
      const highlightedElements = document.querySelectorAll('.accessibility-text-highlight');
      highlightedElements.forEach(el => el.classList.remove('accessibility-text-highlight'));
    };
  }, [enabled]);

  return null; // This is a utility component that doesn't render anything
};
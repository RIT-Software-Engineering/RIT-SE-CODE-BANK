'use client';

import { useState } from 'react';

/**
 * A reusable tooltip component that shows a message on hover.
 * @param {React.ReactNode} props.children - The element to hover over.
 * @param {string} props.text - The text to display in the tooltip.
 */
export default function Tooltip({ children, text }) {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div
      className="relative inline-flex group"
      onMouseEnter={() => setIsVisible(true)}
      onMouseLeave={() => setIsVisible(false)}
    >
      {children}
      {isVisible && (
        <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 w-max max-w-xs px-3 py-1.5 
                   bg-gray-800 text-white text-sm rounded-md shadow-lg z-10
                   opacity-0 group-hover:opacity-100 transition-opacity duration-200
                   pointer-events-none">
          {text}
          <div className="absolute left-1/2 -translate-x-1/2 top-full w-0 h-0 border-x-4 border-x-transparent border-t-4 border-t-gray-800"></div>
        </div>
      )}
    </div>
  );
}

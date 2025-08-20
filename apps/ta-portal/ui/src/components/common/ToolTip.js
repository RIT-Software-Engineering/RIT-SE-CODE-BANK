// src/components/common/ToolTip.js
'use client';

import { Tooltip as MuiTooltip } from '@mui/material';

/**
 * A reusable tooltip component that wraps a child element and shows a message on hover.
 * This component is a simple wrapper around Material-UI's Tooltip for consistency.
 * @param {React.ReactNode} props.children - The element to hover over. This element must be able to accept a ref.
 * @param {string} props.text - The text to display in the tooltip.
 */
export default function Tooltip({ children, text, ...props }) {
  return (
    <MuiTooltip title={text} arrow {...props}>
      {/* The child element is passed directly. It must be an element that can accept event listeners and a ref. */}
      {children}
    </MuiTooltip>
  );
}
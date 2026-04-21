"use client";
import React from "react";
import { TableCell, TableSortLabel } from "@mui/material";
import { useTheme } from "@mui/material/styles";

/**
 * Reusable table header cell with built-in sorting.
 * Automatically applies theme colors and proper styling.
 *
 * @param {string} id - Column identifier (used in sort)
 * @param {string} label - Display label for the column
 * @param {boolean} isActive - Whether this column is currently sorted
 * @param {string} sortDirection - Current sort direction: "asc" | "desc"
 * @param {Function} onSort - Callback when user clicks to sort (receives column id)
 * @param {string} width - CSS width value (optional)
 * @param {string} align - Text alignment: "left" | "right" | "center" (default: "left")
 * @returns {JSX.Element} Themed TableCell with TableSortLabel
 */
export default function SortableTableHeader({
  id,
  label,
  isActive,
  sortDirection = "asc",
  onSort,
  width,
  align = "left",
}) {
  const theme = useTheme();

  const cellSx = {
    backgroundColor: theme.palette.primary.main,
    color: theme.ritColors.white,
    ...(width && { width }),
  };

  const sortLabelSx = {
    color: `${theme.ritColors.white} !important`,
    "& .MuiTableSortLabel-icon": {
      color: `${theme.ritColors.white} !important`,
    },
  };

  return (
    <TableCell sx={cellSx} align={align}>
      <TableSortLabel
        active={isActive}
        direction={isActive ? sortDirection : "asc"}
        onClick={() => onSort(id)}
        sx={sortLabelSx}
      >
        {label}
      </TableSortLabel>
    </TableCell>
  );
}

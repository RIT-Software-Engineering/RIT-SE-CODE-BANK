"use client";
import React from "react";
import { Chip } from "@mui/material";
import { useTheme } from "@mui/material/styles";

/**
 * Unified StatusBadge component for displaying status/state information.
 * Supports multiple status types with automatic theme-aware coloring.
 *
 * @param {string} value - The status/state value (e.g., "ACCEPTED", "PENDING", "active")
 * @param {string} type - Type of status: "application" | "proposal" | "active" (default: "application")
 * @param {string} size - Chip size: "small" | "medium" (default: "medium")
 * @returns {JSX.Element} Themed Chip component
 */
export default function StatusBadge({ value, type = "application", size = "medium" }) {
  const theme = useTheme();

  // Color mappings by type
  const colorSchemes = {
    application: {
      ACCEPTED: theme.palette.success.main,
      REJECTED: theme.palette.error.main,
      PENDING: theme.palette.warning.main,
      default: theme.palette.grey[500],
    },
    proposal: {
      APPROVED: theme.palette.success.main,
      REJECTED: theme.palette.error.main,
      PENDING: theme.palette.warning.main,
      default: theme.palette.grey[500],
    },
    active: {
      active: theme.palette.success.main,
      true: theme.palette.success.main,
      1: theme.palette.success.main,
      "1": theme.palette.success.main,
      inactive: theme.palette.error.main,
      false: theme.palette.error.main,
      0: theme.palette.error.main,
      "0": theme.palette.error.main,
      pending: theme.palette.grey[500],
      default: theme.palette.grey[500],
    },
  };

  // Label mappings
  const labelMaps = {
    application: {
      ACCEPTED: "Accepted",
      REJECTED: "Rejected",
      PENDING: "Pending",
    },
    proposal: {
      APPROVED: "Approved",
      REJECTED: "Rejected",
      PENDING: "Pending",
    },
    active: {
      active: "Active",
      true: "Active",
      1: "Active",
      "1": "Active",
      inactive: "Inactive",
      false: "Inactive",
      0: "Inactive",
      "0": "Inactive",
      pending: "Pending",
    },
  };

  const scheme = colorSchemes[type] || colorSchemes.application;
  const labelMap = labelMaps[type] || labelMaps.application;

  // Determine background color
  const bgColor = scheme[value] || scheme.default;

  // Determine label text
  let label = labelMap[value];
  if (!label && typeof value === "string") {
    label = value.charAt(0).toUpperCase() + value.slice(1).toLowerCase();
  }
  label = label || "Unknown";

  return (
    <Chip
      label={label}
      size={size}
      sx={{
        fontWeight: 500,
        fontSize: size === "small" ? "0.75rem" : "0.85rem",
        px: 1,
        bgcolor: bgColor,
        color: theme.ritColors.white,
        border: "none",
      }}
    />
  );
}

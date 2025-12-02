// src/components/dashboard/SelectionCard.js
"use client";

import Link from "next/link";
import { Paper, Typography, ButtonBase, Box, useTheme } from "@mui/material";

/**
 * A styled, fixed-size card component for dashboard navigation.
 * @param {object} props - The component props.
 * @param {string} props.text - The text to display on the card.
 * @param {React.ReactNode} props.icon - The icon to display on the card.
 * @param {string} props.link - The navigation link for the card.
 */
export default function SelectionCard({ text, icon, link }) {
  const theme = useTheme();

  return (
    <Paper
      elevation={0}
      sx={{
        width: "100%",
        aspectRatio: "1",
        minHeight: 120,
        maxHeight: 160,
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        background: theme.palette.mode === 'dark'
          ? "linear-gradient(135deg, #2d2d2d 0%, #1f1f1f 100%)"
          : "linear-gradient(135deg, #ffffff 0%, #f9f9f9 100%)",
        border: `1px solid ${theme.palette.divider}`,
        borderRadius: 2,
        transition: (theme) => theme.transitions.create(
          ["transform", "box-shadow", "border-color", "background"],
          { duration: "200ms", easing: "ease-in-out" }
        ),
        "&:hover": {
          transform: "translateY(-6px)",
          boxShadow: `0 12px 24px ${theme.palette.action.hover}`,
          borderColor: theme.palette.primary.main,
          background: theme.palette.mode === 'dark'
            ? "linear-gradient(135deg, #3d3d3d 0%, #2f2f2f 100%)"
            : "linear-gradient(135deg, #fffbf0 0%, #fff5e0 100%)",
        },
      }}
    >
      <ButtonBase
        component={Link}
        href={link}
        sx={{
          width: "100%",
          height: "100%",
          p: 2,
          display: "flex",
          flexDirection: "column",
          justifyContent: "center",
          alignItems: "center",
          borderRadius: 2,
          gap: 1,
        }}
      >
        {icon && (
          <Box
            component="span"
            sx={{
              fontSize: { xs: "2rem", sm: "2.5rem", md: "2.75rem" },
              color: theme.palette.primary.main,
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
            }}
          >
            {icon}
          </Box>
        )}
        <Typography
          variant="body1"
          sx={{
            textAlign: "center",
            color: theme.palette.text.primary,
            fontSize: { xs: "0.95rem", sm: "1rem", md: "1.05rem" },
            fontWeight: 600,
            lineHeight: 1.3,
          }}
        >
          {text}
        </Typography>
      </ButtonBase>
    </Paper>
  );
}
// src/components/dashboard/SelectionCard.js
"use client";

import Link from "next/link";
import { Paper, Typography, ButtonBase, Box } from "@mui/material";

/**
 * A styled, fixed-size card component for dashboard navigation.
 * @param {object} props - The component props.
 * @param {string} props.text - The text to display on the card.
 * @param {React.ReactNode} props.icon - The icon to display on the card.
 * @param {string} props.link - The navigation link for the card.
 */
export default function SelectionCard({ text, icon, link }) {
  return (
    <Paper
      elevation={3}
      sx={{
        width: 200, // Set a fixed width
        height: 200, // Set a fixed height
        display: 'flex',
        justifyContent: 'center',
        alignItems: 'center',
        transition: "transform 0.2s ease-in-out, box-shadow 0.2s ease-in-out",
        "&:hover": {
          transform: "scale(1.05)",
          boxShadow: 6,
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
          borderRadius: 1,
          border: 'none',
          outline: 'none',
          '&:focus': {
            outline: 'none',
            border: 'none',
          },
          '&:active': {
            outline: 'none',
            border: 'none',
          },
          '&:focus-visible': {
            outline: 'none',
            border: 'none',
          },
        }}
      >
        {icon && (
          <Box
            component="span"
            sx={{ mb: 1.5, fontSize: "2.25rem", color: "primary.main" }}
          >
            {icon}
          </Box>
        )}
        <Typography
          variant="h2"
          sx={{
            textAlign: "center",
            color: "text.primary",
            fontSize: "1.25rem",
          }}
        >
          {text}
        </Typography>
      </ButtonBase>
    </Paper>
  );
}
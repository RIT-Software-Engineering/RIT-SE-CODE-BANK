"use client";

import { useTheme } from "@mui/material/styles";
import { Toaster } from "react-hot-toast";

export default function ToastProvider() {
  const theme = useTheme();

  return (
    <Toaster
      position="top-center"
      reverseOrder={false}
      toastOptions={{
        duration: 3500,
        style: {
          borderRadius: 10,
          background: theme.palette.background.paper,
          color: theme.palette.text.primary,
          border: `1px solid ${theme.palette.divider}`,
        },
        success: {
          duration: 2500,
          style: {
            backgroundColor: theme.palette.success.main,
            color: theme.palette.success.contrastText,
            border: `1px solid ${theme.palette.success.dark}`,
          },
        },
        error: {
          duration: 5000,
          style: {
            backgroundColor: theme.palette.error.main,
            color: theme.palette.error.contrastText,
            border: `1px solid ${theme.palette.error.dark}`,
          },
        },
      }}
    />
  );
}


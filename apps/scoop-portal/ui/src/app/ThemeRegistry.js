"use client";
import { ThemeProvider } from "@mui/material";
import baseTheme from "@styles/theme";

export default function ThemeRegistry({ children }) {
    return (
        <ThemeProvider theme={baseTheme} defaultMode="system">
            {children}
        </ThemeProvider>
    );
}

"use client";
import { ThemeProvider } from "@mui/material";
import theme from "@styles/theme";

export default function ThemeRegistry({ children }) {
    return <ThemeProvider theme={theme}>{children}</ThemeProvider>;
}


"use client";

import { createContext, useState, useMemo, useEffect } from "react";
import CssBaseline from "@mui/material/CssBaseline";
import { ThemeProvider } from "@mui/material/styles";
import { lightTheme, darkTheme } from "@/styles/theme";

export const ThemeContext = createContext({ toggleTheme: () => {} });

export default function ThemeRegistry({ children }) {
    const [mode, setMode] = useState("light");

    // Detect the system's preferred color scheme.
    useEffect(() => {
        const mediaQuery = window.matchMedia(
            "(prefers-color-scheme: dark)"
        );

        const updateTheme = () => {
            setMode(mediaQuery.matches ? "dark" : "light");
        };

        updateTheme();

        mediaQuery.addEventListener("change", updateTheme);

        return () => {
            mediaQuery.removeEventListener("change", updateTheme);
        };
    }, []);

    const toggleTheme = () => {
        setMode((previousMode) =>
            previousMode === "light" ? "dark" : "light"
        );
    };

    const theme = useMemo(
        () => (mode === "light" ? lightTheme : darkTheme),
        [mode]
    );

    return (
        <ThemeContext.Provider value={{ toggleTheme }}>
            <ThemeProvider theme={theme}>
                <CssBaseline />
                {children}
            </ThemeProvider>
        </ThemeContext.Provider>
    );
}

"use client";

import React, { createContext, useState, useMemo, useEffect } from "react";
import { CssBaseline, useMediaQuery } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { lightTheme, darkTheme } from "@styles/theme";

export const ThemeContext = createContext({ toggleTheme: () => {} });

/**
 * The component that provides the theme context and applies the theme to its children.
 * In addition, it handles the user's preferred color scheme and allows toggling between light and dark themes.
 *
 * @param {*} children - The compoenents to be wrapped by the theme provider (should be the whole app).
 * @returns {JSX.Element} The ThemeRegistry component that provides the theme context and applies the theme.
 */
export default function ThemeRegistry({ children }) {
  const prefersDarkMode = useMediaQuery("(prefers-color-scheme: dark)");
  const [mode, setMode] = useState("light");

  useEffect(() => {
    setMode(prefersDarkMode ? "dark" : "light");
  }, [prefersDarkMode]);

  const toggleTheme = () => {
    setMode((prevMode) => (prevMode === "light" ? "dark" : "light"));
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

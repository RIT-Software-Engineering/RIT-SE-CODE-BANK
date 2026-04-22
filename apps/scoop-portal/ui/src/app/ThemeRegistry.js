"use client";

import React, { createContext, useMemo, useEffect } from "react";
import { CssBaseline } from "@mui/material";
import { ThemeProvider } from "@mui/material/styles";
import { lightTheme } from "@styles/theme";

export const ThemeContext = createContext({ toggleTheme: () => {} });

/**
 * The component that provides the theme context and applies the theme to its children.
 * In addition, it handles the user's preferred color scheme and allows toggling between light and dark themes.
 *
 * @param {*} children - The compoenents to be wrapped by the theme provider (should be the whole app).
 * @returns {JSX.Element} The ThemeRegistry component that provides the theme context and applies the theme.
 */
export default function ThemeRegistry({ children }) {
  const mode = "light";

  const toggleTheme = () => {
    /* forced light theme: no-op */
  };

  const theme = useMemo(() => lightTheme, []);


  useEffect(() => {
    const root = document.documentElement;
    const ritVars = {
      '--rit-orange': '#F76902',
      '--rit-white': '#FFFFFF',
      '--rit-black': '#000000',
      '--rit-gray-1': '#D0D3D4',
      '--rit-gray-2': '#A2AAAD',
      '--rit-gray-3': '#7C878E',
      '--rit-gray-4': '#D7D2CB',
      '--rit-gray-5': '#ACA39A',
      '--rit-green': '#84BD00',
      '--rit-lime': '#C4D600',
      '--rit-blue': '#009CBD',
      '--rit-purple': '#7D55C7',
      '--rit-red': '#DA291C',
      '--rit-yellow': '#F6BE00',
      '--background': '#FFFFFF',
      '--foreground': '#212121',
      '--page-margin-desktop': '24px',
      '--page-margin-mobile': '16px',
    };
    Object.entries(ritVars).forEach(([name, value]) => {
      root.style.setProperty(name, value);
    });
  }, []);

  return (
    <ThemeContext.Provider value={{ toggleTheme }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
}

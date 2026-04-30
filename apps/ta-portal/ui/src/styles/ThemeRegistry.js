// src/styles/ThemeRegistry.js
'use client';

import React, { createContext, useState, useMemo } from 'react';
import { CssBaseline } from '@mui/material';
import { ThemeProvider } from '@mui/material/styles';
import { lightTheme, darkTheme } from './theme';

// Create context for theme switching
export const ThemeContext = createContext({ 
  toggleTheme: () => {},
  mode: 'light',
});

export default function ThemeRegistry({ children }) {
  const [mode, setMode] = useState('light');

  // Function to manually toggle theme
  const toggleTheme = () => {
    setMode((prevMode) => (prevMode === 'light' ? 'dark' : 'light'));
  };

  // Memoize theme to prevent unnecessary re-renders
  const theme = useMemo(
    () => (mode === 'light' ? lightTheme : darkTheme),
    [mode]
  );

  return (
    <ThemeContext.Provider value={{ toggleTheme, mode }}>
      <ThemeProvider theme={theme}>
        <CssBaseline />
        {children}
      </ThemeProvider>
    </ThemeContext.Provider>
  );
}
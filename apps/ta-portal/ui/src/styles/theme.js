// src/styles/theme.js
'use client';

import { createTheme, alpha } from '@mui/material/styles';

/**
 * RIT Brand Colors - centralized color palette
 */
export const ritColors = {
  orange: '#F76902',
  white: '#FFFFFF',
  black: '#000000',
  gray_1: '#D0D3D4',
  gray_2: '#A2AAAD',
  gray_3: '#7C878E',
  warm_gray_1: '#D7D2CB',
  warm_gray_2: '#ACA39A',
  dark_gray: '#222222',
  green: '#84BD00',
  yellow_green: '#C4D600',
  blue: '#009CBD',
  purple: '#7D55C7',
  red: '#DA291C',
  yellow: '#F6BE00',
};

/**
 * Base theme configuration
 */
const baseTheme = createTheme({
  ritColors,

  palette: {
    primary: {
      main: ritColors.orange,
      contrastText: ritColors.white,
    },
    secondary: {
      main: ritColors.black,
      contrastText: ritColors.white,
    },
    success: {
      main: ritColors.green,
      contrastText: ritColors.white,
    },
    error: {
      main: ritColors.red,
      contrastText: ritColors.white,
    },
    warning: {
      main: ritColors.yellow,
      contrastText: ritColors.black,
    },
    info: {
      main: ritColors.blue,
      contrastText: ritColors.white,
    },
  },

  typography: {
    fontFamily: [
      '"Helvetica Neue"',
      'Helvetica',
      'Roboto',
      'Arial',
      'sans-serif',
    ].join(','),
    h1: {
      fontSize: '2rem',
      lineHeight: '2.5rem',
      fontWeight: 900,
    },
    h2: {
      fontSize: '1.5rem',
      lineHeight: '2rem',
      fontWeight: 500,
    },
    h3: {
      fontSize: '1.25rem',
      lineHeight: '1.75rem',
      fontWeight: 300,
    },
    body1: {
      fontSize: '1rem',
      lineHeight: '1.5rem',
      fontWeight: 400,
    },
    smalltext: {
      fontSize: '0.875rem',
      lineHeight: '1.25rem',
      fontWeight: 300,
    },
  },

  components: {
    MuiTextField: {
      styleOverrides: {
        root: ({ theme }) => ({
          '& .MuiInputLabel-root': {
            color: theme.palette.text.secondary,
            fontFamily: theme.typography.fontFamily,
            fontSize: theme.typography.body1.fontSize,
            fontWeight: theme.typography.body1.fontWeight,
            lineHeight: theme.typography.body1.lineHeight,
            '&.Mui-focused': {
              color: theme.palette.primary.main,
              fontWeight: theme.typography.h3.fontWeight + 100,
            },
            '&.Mui-error': {
              color: theme.palette.error.main,
            },
          },
          '& .MuiOutlinedInput-root': {
            fontSize: theme.typography.body1.fontSize,
            fontFamily: theme.typography.fontFamily,
            fontWeight: theme.typography.body1.fontWeight,
            lineHeight: theme.typography.body1.lineHeight,
            backgroundColor: theme.palette.background.paper,
            borderRadius: '8px',
            '& fieldset': {
              borderColor: theme.palette.divider,
              borderWidth: '1px',
              transition: 'border-color 0.2s ease, border-width 0.2s ease',
            },
            '&:hover fieldset': {
              borderColor: theme.palette.text.secondary,
            },
            '&.Mui-focused fieldset': {
              borderColor: theme.palette.primary.main,
              borderWidth: '2px',
            },
            '&.Mui-error fieldset': {
              borderColor: theme.palette.error.main,
              borderWidth: '1.5px',
            },
            '& input': {
              color: theme.palette.text.primary,
              fontFamily: theme.typography.fontFamily,
              fontSize: theme.typography.body1.fontSize,
              fontWeight: theme.typography.body1.fontWeight,
              '&::placeholder': {
                color: theme.palette.text.secondary,
                opacity: 0.6,
                fontStyle: 'italic',
              },
            },
          },
          '& .MuiFormHelperText-root': {
            fontSize: theme.typography.smalltext.fontSize,
            lineHeight: theme.typography.smalltext.lineHeight,
            fontWeight: theme.typography.smalltext.fontWeight,
            fontFamily: theme.typography.fontFamily,
            marginTop: '6px',
            marginLeft: '2px',
            color: theme.palette.text.secondary,
            '&.Mui-error': {
              color: theme.palette.error.main,
              fontWeight: 500,
            },
          },
          '& .MuiInputLabel-asterisk': {
            color: theme.palette.error.main,
            fontSize: '1.1em',
            fontWeight: 600,
          },
          '& input[type="time"]::-webkit-calendar-picker-indicator': {
            filter: theme.palette.mode === 'dark' 
              ? 'invert(1)'
              : 'invert(0)',
          },
          '& input[type="date"]::-webkit-calendar-picker-indicator': {
            filter: theme.palette.mode === 'dark' 
              ? 'invert(1)'
              : 'invert(0)',
          },
        }),
      },
    },

    MuiSelect: {
      styleOverrides: {
        root: ({ theme }) => ({
          fontSize: theme.typography.body1.fontSize,
          fontFamily: theme.typography.fontFamily,
          fontWeight: theme.typography.body1.fontWeight,
          backgroundColor: theme.palette.background.paper,
          borderRadius: '8px',
          color: theme.palette.text.primary,
        }),
      },
    },

    MuiButton: {
      styleOverrides: {
        root: ({ theme }) => ({
          lineHeight: theme.typography.body1.lineHeight,
          textTransform: 'none',
          borderRadius: '8px',
        }),
      },
    },
  },
});

// Light Theme
export const lightTheme = createTheme({
  ...baseTheme,
  palette: {
    ...baseTheme.palette,
    mode: 'light',
    background: {
      default: ritColors.white,
      paper: ritColors.gray_1,
    },
    text: {
      primary: ritColors.black,
      secondary: ritColors.dark_gray,
    },
    action: {
      active: ritColors.black,
    },
  },
  components: {
    ...baseTheme.components,
    MuiChip: {
      styleOverrides: {
        root: ({ ownerState, theme }) => ({
          ...(ownerState.variant === 'filled' &&
            ownerState.color &&
            ownerState.color !== 'default' && {
              backgroundColor: theme.palette[ownerState.color].main,
              color: theme.palette[ownerState.color].contrastText,
              fontWeight: 600,
            }),
        }),
      },
    },
  },
});

// Dark Theme
export const darkTheme = createTheme({
  ...baseTheme,
  palette: {
    ...baseTheme.palette,
    mode: 'dark',
    background: {
      default: ritColors.black,
      paper: ritColors.black,
    },
    text: {
      primary: ritColors.white,
      secondary: ritColors.gray_1,
    },
    divider: ritColors.dark_gray,
    action: {
      active: ritColors.white,
      hover: 'rgba(255, 255, 255, 0.08)',
    },
  },
  components: {
    ...baseTheme.components,
    MuiPaper: {
      styleOverrides: {
        root: {
          backgroundColor: ritColors.black,
          border: 'none',
        },
      },
    },
    MuiDrawer: {
      styleOverrides: {
        paper: {
          backgroundColor: ritColors.black,
          border: 'none',
        },
      },
    },
    MuiAccordion: {
      styleOverrides: {
        root: {
          backgroundColor: ritColors.black,
          border: `1px solid ${ritColors.dark_gray}`,
        },
      },
    },
    MuiChip: {
      styleOverrides: {
        root: ({ ownerState, theme }) => ({
          ...(ownerState.variant === 'filled' &&
            ownerState.color &&
            ownerState.color !== 'default' && {
              backgroundColor: alpha(theme.palette[ownerState.color].main, 0.3),
              color: theme.palette[ownerState.color].main,
              fontWeight: 600,
            }),
        }),
      },
    },
  },
});

export default baseTheme;
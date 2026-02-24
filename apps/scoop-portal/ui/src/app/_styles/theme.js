import { createTheme } from "@mui/material/styles";

/**
 * This is the foundation of the custom themes.
 */
const baseTheme = createTheme({
  /**
   * If you need to use the RIT brand colors for anything specific
   * (and you don't feel like memorizing the color codes), you can
   * use the variables in ritColors
   */
  ritColors: {
    orange: "#F76902",
    white: "#FFFFFF",
    black: "#000000",
    gray_1: "#D0D3D4",
    gray_2: "#A2AAAD",
    gray_3: "#7C878E",
    warm_gray_1: "#D7D2CB",
    warm_gray_2: "#ACA39A",
    green: "#84BD00",
    yellow_green: "#C4D600",
    blue: "#009CBD",
    purple: "#7D55C7",
    red: "#DA291C",
  },
  palette: {
    primary: {
      main: "#F76902",
    },
    secondary: {
      main: "#000000",
    },
    success: {
      main: "#84BD00",
      light: "#9cca33",
      dark: "#5c8400",
      contrastText: "#FFFFFF",
    },
    error: {
      main: "#DA291C",
      light: "#e15349",
      dark: "#981c13",
      contrastText: "#FFFFFF",
    },
    warning: {
      main: "#F6BE00",
      light: "#f7cb33",
      dark: "#ac8500",
    },
    info: {
      main: "#009CBD",
      light: "#33afca",
      dark: "#006d84",
      contrastText: "#FFFFFF",
    },
  },
  typography: {
    fontFamily: [
      '"Helvetica Neue"',
      "Helvetica",
      "Roboto",
      "Arial",
      "sans-serif",
    ].join(","),
    h1: {
      fontSize: "2rem",
      lineHeight: "2.5rem",
      fontWeight: 900,
    },
    h2: {
      fontSize: "1.5rem",
      lineHeight: "2rem",
      fontWeight: 500,
    },
    h3: {
      fontSize: "1.25rem",
      lineHeight: "1.75rem",
      fontWeight: 300,
    },
    body1: {
      fontSize: "1rem",
      lineHeight: "1.5rem",
      fontWeight: 400,
      marginBottom: "1rem",
    },
    smalltext: {
      fontSize: "0.875rem",
      lineHeight: "1.25rem",
      fontWeight: 300,
    },
  },
  components: {
    MuiButton: {
      variants: [
        {
          props: { variant: "solid-orange" },
          style: {
            border: "1px solid #F76902",
            backgroundColor: "#F76902",
            color: "#FFFFFF",
            "&:hover": {
              border: "1px solid #C55400",
              backgroundColor: "#C55400",
            },
          },
        },
        {
          props: { variant: "solid-gray" },
          style: {
            border: "1px solid #D0D3D4",
            backgroundColor: "#D0D3D4",
            color: "#000000",
            "&:hover": {
              border: "1px solid #A2AAAD",
              backgroundColor: "#A2AAAD",
            },
          },
        },
        {
          props: { variant: "outline-orange" },
          style: {
            border: "1px solid #F76902",
            color: "#F76902",
            "&:hover": {
              backgroundColor: "#F76902",
              color: "#FFFFFF",
            },
          },
        },
      ],
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: "0px",
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#F76902",
          },
        },
      },
    },
    MuiAutocomplete: {
      styleOverrides: {
        inputRoot: {
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#F76902",
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: { "&.Mui-focused": { color: "#F76902" } },
      },
    },
  },
});

/**
 * This is the light theme.
 * It extends from the base theme and adds additional styles to make the light theme.
 */
export const lightTheme = createTheme({
  ...baseTheme,
  palette: {
    ...baseTheme.palette,
    mode: "light",
    background: {
      default: "#FFFFFF",
      paper: baseTheme.ritColors.warm_gray_1,
    },
    text: { primary: "#000000" },
  },
  components: {
    ...baseTheme.components,
    MuiTableRow: {
      styleOverrides: {
        root: {
          "&:hover": {
            backgroundColor: "#fafafa",
          },
        },
      },
    },
  },
});

/**
 * This is the dark theme.
 * It extends from the base theme and adds additional styles to make the dark theme.
 */
export const darkTheme = createTheme({
  ...baseTheme,
  palette: {
    ...baseTheme.palette,
    mode: "dark",
    background: {
      default: "#000000",
      paper: "#101010",
    },
    text: { primary: "#FFFFFF" },
  },
  components: {
    ...baseTheme.components,
    MuiTableRow: {
      styleOverrides: {
        root: {
          "&:hover": {
            backgroundColor: "#0e0e0e",
          },
        },
      },
    },
    MuiTypography: {
      styleOverrides: {
        h1: {
          color: "#FFFFFF",
        },
      },
    },
  },
});

export default baseTheme;

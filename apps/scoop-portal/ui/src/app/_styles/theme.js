import { createTheme } from "@mui/material";

const baseTheme = createTheme({
  colorSchemes: {
    dark: true,
  },
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
      styleOverrides: {
        root: {
          textTransform: "none",
          borderRadius: "0px",
          variants: [
            {
              props: { variant: "solid-orange" },
              style: {
                backgroundColor: "#F76902",
                color: "#FFFFFF",
                "&:hover": {
                  backgroundColor: "#000000",
                },
              },
            },
            {
              props: { variant: "solid-gray" },
              style: {
                backgroundColor: "#D0D3D4",
                color: "#000000",
                "&:hover": {
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
        },
      },
    },
  },
});

// Light Theme
export const lightTheme = createTheme({
  ...baseTheme,
  palette: {
    mode: "light",
    primary: { main: "#F76902" },
    background: {
      default: "#FFFFFF",
      paper: "#D7D2CB",
      card: "#e0e0e0",
    },
    text: { primary: "#000000" },
  },
});

// Dark Theme
export const darkTheme = createTheme({
  ...baseTheme,
  palette: {
    mode: "dark",
    primary: { main: "#F76902" },
    background: {
      default: "#000000",
      paper: "#121212",
      card: "#424242",
    },
    text: { primary: "#FFFFFF" },
  },
});

export default baseTheme;

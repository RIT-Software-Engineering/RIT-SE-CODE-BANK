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
  shape: {
    borderRadius: 0,
  },
  palette: {
    primary: {
      main: "#F76902",
      contrastText: "#FFFFFF",
    },
    secondary: {
      main: "#000000",
      contrastText: "#FFFFFF",
    },
    text: {
      primary: "#212121",
      secondary: "#4F4F4F", // less grey for better readability
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
      styleOverrides: {
        root: {
          boxShadow: "none",
          transition: "background-color 300ms cubic-bezier(0.4, 0, 0.2, 1), border-color 300ms cubic-bezier(0.4, 0, 0.2, 1), color 300ms cubic-bezier(0.4, 0, 0.2, 1)",
          "&:hover": {
            boxShadow: "none",
          },
        },
      },
      variants: [
        {
          props: { variant: "contained" },
          style: {
            backgroundColor: "#F76902",
            color: "#FFFFFF",
            border: "1px solid #F76902",
            height: "40px",
            fontWeight: 600,
            boxShadow: "none",
            "&:hover": {
              backgroundColor: "#000000",
              border: "1px solid #000000",
              boxShadow: "none",
            },
          },
        },
        {
          props: { variant: "outlined" },
          style: {
            border: "1px solid #F76902",
            color: "#F76902",
            backgroundColor: "transparent",
            "&:hover": {
              border: "1px solid #F76902",
              backgroundColor: "#F76902",
              color: "#FFFFFF",
            },
          },
        },
        {
          props: { variant: "text" },
          style: {
            color: "#F76902",
            "&:hover": {
              textDecoration: "underline",
              backgroundColor: "rgba(247,105,2,0.08)",
            },
          },
        },
        {
          props: { variant: "solid-orange" },
          style: {
            border: "1px solid #F76902",
            backgroundColor: "#F76902",
            color: "#FFFFFF",
            boxShadow: "none",
            "&:hover": {
              border: "1px solid #000000",
              backgroundColor: "#000000",
              color: "#FFFFFF",
              boxShadow: "none",
            },
          },
        },
        {
          props: { variant: "solid-gray" },
          style: {
            border: "1px solid #D0D3D4",
            backgroundColor: "#FFFFFF",
            color: "#212121",
            "&:hover": {
              border: "1px solid #A2AAAD",
              backgroundColor: "#F7F7F7",
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
          borderRadius: 0,
          fontWeight: 500,
        },
      },
    },
    MuiSelect: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#F76902",
          },
        },
      },
    },
    MuiMenuItem: {
      styleOverrides: {
        root: {
          borderLeft: "1px solid #D0D3D4",
          borderRight: "1px solid #D0D3D4",
          borderBottom: "1px solid #D0D3D4",
          borderTop: "none",
          borderRadius: 0,
          margin: 0,
          backgroundColor: "#FFFFFF",
          "&:first-of-type": {
            borderTop: "1px solid #D0D3D4",
          },
          "&.Mui-selected": {
            backgroundColor: "#F76902",
            color: "#FFFFFF",
          },
          "&:hover": {
            backgroundColor: "#F76902",
            color: "#FFFFFF",
          },
        },
      },
    },
    MuiAutocomplete: {
      styleOverrides: {
        inputRoot: {
          borderRadius: 0,
          "&.Mui-focused .MuiOutlinedInput-notchedOutline": {
            borderColor: "#F76902",
          },
        },
        option: {
          borderLeft: "1px solid #D0D3D4",
          borderRight: "1px solid #D0D3D4",
          borderBottom: "1px solid #D0D3D4",
          borderTop: "none",
          borderRadius: 0,
          margin: 0,
          padding: "0.75rem 1rem",
          backgroundColor: "#FFFFFF",
          "&:first-of-type": {
            borderTop: "1px solid #D0D3D4",
          },
          "&.Mui-focused, &:hover": {
            backgroundColor: "rgba(247,105,2,0.08)",
          },
        },
      },
    },
    MuiInputLabel: {
      styleOverrides: {
        root: { "&.Mui-focused": { color: "#F76902" } },
      },
    },
    MuiPaper: {
      styleOverrides: {
        root: {
          borderRadius: 0,
          boxShadow: "none",
        },
      },
    },
    MuiCard: {
      styleOverrides: {
        root: {
          borderRadius: 0,
        },
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
      paper: "#FFFFFF", // remove warm gray paper background
    },
    text: {
      primary: "#212121",
      secondary: "#4F4F4F",
    },
  },
  components: {
    ...baseTheme.components,
    MuiSelect: {
      styleOverrides: {
        ...baseTheme.components.MuiSelect?.styleOverrides,
        icon: {
          color: "#000000",
        },
      },
    },
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
    MuiSelect: {
      styleOverrides: {
        ...baseTheme.components.MuiSelect?.styleOverrides,
        icon: {
          color: "#FFFFFF",
        },
      },
    },
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
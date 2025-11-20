import { createTheme } from '@mui/material/styles';

// --- RIT UI Design Document Colors ---
const RIT_ORANGE = '#F76902'; 
const PRIMARY_CONTRAST = '#FFFFFF'; // White
const BLACK_TEXT = '#000000';
const BLACK_HOVER = 'rgba(0, 0, 0, 0.2)'; // Transparent Black for hover background

const theme = createTheme({
  palette: {
    primary: {
      main: RIT_ORANGE, 
      dark: '#E66A00', 
      contrastText: PRIMARY_CONTRAST,
    },
  },
  components: {
    // 🎯 1. Target the AppBar (The Top Navigation)
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: RIT_ORANGE,
          color: PRIMARY_CONTRAST,
          
          // Target Buttons specifically INSIDE the AppBar
          '& .MuiButton-root': {
            color: PRIMARY_CONTRAST, 
            transition: 'all 0.3s ease',
            '&:hover': {
              backgroundColor: BLACK_HOVER, 
              color: BLACK_TEXT, 
            },
          },
        },
      },
    },
    
    //  2. Target Global Buttons (Everywhere else in the app)
    MuiButton: {
      defaultProps: {
        color: 'primary', 
      },
      styleOverrides: {
        root: {
          color: BLACK_TEXT, 
          '&:hover': {
            backgroundColor: 'rgba(247, 105, 2, 0.1)', 
          },
        },
        // Ensure "Contained" buttons stay Orange with White text
        containedPrimary: {
            backgroundColor: RIT_ORANGE, 
            color: PRIMARY_CONTRAST, 
            '&:hover': {
                backgroundColor: '#D15600', 
                color: PRIMARY_CONTRAST, 
            }
        },
        outlined: {
            '&:hover': {
                borderColor: BLACK_TEXT, // Changes the outline (border) to black on hover
                color: BLACK_TEXT,       // Ensures text is also black on hover
                backgroundColor: 'transparent' 
            }
        }
      },
    },
  },
});

export default theme;
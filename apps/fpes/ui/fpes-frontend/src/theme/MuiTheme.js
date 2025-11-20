import { createTheme } from '@mui/material/styles';

// --- RIT UI Design Document Colors ---
const RIT_ORANGE = '#F76902'; 
const PRIMARY_CONTRAST = '#FFFFFF'; // White
const BLACK_TEXT = '#000000';
const BLACK_HOVER = 'rgba(0, 0, 0, 0.2)'; 

const theme = createTheme({
  palette: {
    primary: {
      main: RIT_ORANGE, 
      dark: '#E66A00', 
      contrastText: PRIMARY_CONTRAST,
    },
  },
  components: {
    // 🎯 Target the AppBar (Assuming you want the RIT Orange background for the navbar)
    MuiAppBar: {
      styleOverrides: {
        root: {
          backgroundColor: RIT_ORANGE, // Navbar Background is RIT Orange
          color: PRIMARY_CONTRAST, // Default text color on AppBar is White
        },
      },
    },
    
    // 🎯 Target all default MUI Buttons globally
    MuiButton: {
      defaultProps: {
        color: 'primary', 
      },
      styleOverrides: {
        root: {
          // --- Custom Styles for Buttons (Text/Link Buttons in Header) ---
          
          // 💡 FIX: Set default text color to WHITE
          color: PRIMARY_CONTRAST, 

          // Hover/Focus/Active State Overrides
          '&:hover': {
            // Apply the translucent black hover background
            backgroundColor: BLACK_HOVER, 
            // 💡 FIX: Force text color to BLACK only on hover
            color: BLACK_TEXT, 
          },
          '&:focus, &:active': {
            // Ensure text color is black on focus/active states
            color: BLACK_TEXT, 
          }
        },
        // Override for contained buttons (like ADD SERVICE/Submit)
        containedPrimary: {
            backgroundColor: RIT_ORANGE, 
            color: PRIMARY_CONTRAST,
            '&:hover': {
                backgroundColor: '#AA4702',
            }
        }
      },
    },
  },
});

export default theme;
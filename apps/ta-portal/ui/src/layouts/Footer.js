// src/components/Footer.js
'use client';

import { Box, Typography, useTheme } from '@mui/material';


/**
 * Footer component, used to display information about the Rochester Institute of Technology at the bottom of each page.
 * 
 * @returns {JSX.Element} The JSX element representing the footer.
 */
export default function Footer() {
  const theme = useTheme();
  
  return (
    <Box
      component="footer"
      sx={{
        backgroundColor: theme.palette.mode === 'dark' 
          ? '#0a0a0a'  // Slightly lighter than pure black for dark mode
          : '#000000',
        color: '#ffffff',
        py: 4,
        px: 2,
        textAlign: 'center',
        mt: 'auto',
        borderTop: theme.palette.mode === 'dark' 
          ? '2px solid rgba(255, 255, 255, 0.12)'  // Subtle border in dark mode
          : 'none',
        boxShadow: theme.palette.mode === 'dark'
          ? '0 -4px 12px rgba(0, 0, 0, 0.3)'  // Shadow to lift footer in dark mode
          : 'none',
      }}
    >
      <Typography 
        variant="h3" 
        component="p" 
        sx={{ 
          fontSize: { xs: '1rem', md: '1.25rem' },
          mb: 1,
          fontWeight: 600,
        }}
      >
        Rochester Institute of Technology
      </Typography>
      <Typography variant="body1" sx={{ fontSize: { xs: '0.9rem', md: '1rem' } }}>
        1 Lomb Memorial Drive, Rochester, NY 14623-5603
        <br />
        Copyright © Rochester Institute of Technology. All Rights Reserved.
      </Typography>
    </Box>
  );
}
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
        backgroundColor: '#000000',
        color: '#ffffff',
        py: 4,
        px: 2,
        textAlign: 'center',
        mt: 'auto',
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
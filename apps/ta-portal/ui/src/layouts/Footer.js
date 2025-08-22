// src/components/Footer.js
'use client';

import { Box, Typography } from '@mui/material';


/**
 * Footer component, used to display information about the Rochester Institute of Technology at the bottom of each page.
 * 
 * @returns {JSX.Element} The JSX element representing the footer.
 */
export default function Footer() {
  return (
    <Box
      component="footer"
      sx={(theme) => ({
        backgroundColor: 'background.paper', 
        color: 'text.primary',
        py: 3,
        px: 2,
        textAlign: 'center',
        mt: 'auto',
        borderTop: `1px solid ${
          theme.palette.mode === 'dark' ? theme.palette.divider : 'transparent'
        }`,
      })}
    >
      <Typography 
        variant="h3" 
        component="p" 
        sx={{ 
          fontSize: { xs: '1rem', md: '1.25rem' },
          mb: 1,
        }}
      >
        Rochester Institute of Technology
      </Typography>
      <Typography variant="body1">
        1 Lomb Memorial Drive, Rochester, NY 14623-5603
        <br />
        Copyright © Rochester Institute of Technology. All Rights Reserved.
      </Typography>
    </Box>
  );
}
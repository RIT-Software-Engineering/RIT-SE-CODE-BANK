import React from 'react';
import Header from '@components/Header';
import { Container, Typography } from '@mui/material';

export default function CoopReporting() {
  return (
    <>
      <Header />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h1" sx={{ fontSize: '2rem', fontWeight: 900, color: '#fff', mb: 4 }}>
          Co-op Reporting
        </Typography>
        <Typography>This is a placeholder for the co-op reports page.</Typography>
      </Container>
    </>
  );
}

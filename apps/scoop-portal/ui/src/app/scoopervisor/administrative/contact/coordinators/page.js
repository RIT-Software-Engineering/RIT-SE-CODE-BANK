import React from 'react';
import Header from '@components/Header';
import { Container, Typography } from '@mui/material';

export default function ContactCoordinators() {
  return (
    <>
      <Header />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h1" sx={{ fontSize: '2rem', fontWeight: 900, color: '#fff', mb: 4 }}>
          Contact Co-op Coordinators
        </Typography>
        <Typography>This is a placeholder for the coordinator contact page.</Typography>
      </Container>
    </>
  );
}

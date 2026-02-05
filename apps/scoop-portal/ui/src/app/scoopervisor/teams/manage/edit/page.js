import React from 'react';
import Header from '@components/Header';
import { Container, Typography } from '@mui/material';

export default function EditTeams() {
  return (
    <>
      <Header />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h1" sx={{ fontSize: '2rem', fontWeight: 900, color: '#fff', mb: 4 }}>
          Edit Teams
        </Typography>
        <Typography>This is a placeholder for the team editing page.</Typography>
      </Container>
    </>
  );
}

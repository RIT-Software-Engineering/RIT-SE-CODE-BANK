import React from 'react';
import Header from '@components/Header';
import { Container, Typography } from '@mui/material';

export default function AssignProjectScoopverisor() {
  return (
    <>
      <Header role="/"/>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h1" sx={{ fontSize: '2rem', fontWeight: 900, color: '#fff', mb: 4 }}>
          Scoopervisor Assignment
        </Typography>
        <Typography>This is a placeholder for the project scoopervisor assignment page.</Typography>
      </Container>
    </>
  );
}

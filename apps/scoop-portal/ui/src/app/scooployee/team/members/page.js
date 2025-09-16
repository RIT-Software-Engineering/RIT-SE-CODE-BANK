import React from 'react';
import Header from '@components/Header';
import { Container, Typography } from '@mui/material';

export default function ViewTeamMembers() {
  return (
    <>
      <Header role="/scooployee/dashboard"/>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h1" sx={{ fontSize: '2rem', fontWeight: 900, color: '#fff', mb: 4 }}>
          Your Team Members
        </Typography>
        <Typography>This is a placeholder for the scooployee team members page.</Typography>
      </Container>
    </>
  );
}

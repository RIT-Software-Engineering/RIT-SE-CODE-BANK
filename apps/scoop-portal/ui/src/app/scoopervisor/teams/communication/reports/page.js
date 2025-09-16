import React from 'react';
import Header from '@components/Header';
import { Container, Typography } from '@mui/material';

export default function ReviewTeamReports() {
  return (
    <>
      <Header role="/scoopervisor/dashboard"/>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h1" sx={{ fontSize: '2rem', fontWeight: 900, color: '#fff', mb: 4 }}>
          Team Reports
        </Typography>
        <Typography>This is a placeholder for the team report review page.</Typography>
      </Container>
    </>
  );
}

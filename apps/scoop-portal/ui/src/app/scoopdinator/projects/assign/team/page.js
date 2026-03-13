'use client';
import React from 'react';
import Header from '@components/Header';
import { Container, Typography } from '@mui/material';
import { useUser } from "../../../utils/user-context/page";
import UnauthorizedPage from '../../../unauthorized/page';

export default function AssignProjectTeams() {
  const { user } = useUser();
    if (!user || user.type !== "scoopervisor" && user.type !== "scoopdinator") {
        return <UnauthorizedPage />;
      }
  return (
    
    <>
      <Header />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h1" sx={{ fontSize: '2rem', fontWeight: 900, color: '#fff', mb: 4 }}>
          Team Assignment
        </Typography>
        <Typography>This is a placeholder for the project team assignment page.</Typography>
      </Container>
    </>
  );
}

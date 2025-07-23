import React from 'react';
import Header from '@components/Header';
import { Container, Typography } from '@mui/material';
import { useUser } from "../../user-context/page";
import UnauthorizedPage from '../../unauthorized/page';

export default function AssignScooployees() {
  const { user } = useUser();
    if (!user || user.type !== "coach" && user.type !== "admin") {
        return <UnauthorizedPage />;
      }
  return (
    <>
      <Header />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h1" sx={{ fontSize: '2rem', fontWeight: 900, color: '#fff', mb: 4 }}>
          Assign Scooployees
        </Typography>
        <Typography>This is a placeholder for the team assignment by scooployee page.</Typography>
      </Container>
    </>
  );
}

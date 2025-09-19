import React from "react";
import Header from "@components/Header";
import { Container, Typography } from "@mui/material";

export default function AssignScooployees() {
  return (
    <>
      <Header />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h1" sx={{ mb: 4 }}>
          Assign Scooployees
        </Typography>
        <Typography>
          This is a placeholder for the team assignment by scooployee page.
        </Typography>
      </Container>
    </>
  );
}

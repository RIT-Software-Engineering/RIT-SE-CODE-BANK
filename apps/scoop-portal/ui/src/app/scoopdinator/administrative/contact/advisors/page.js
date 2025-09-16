import React from "react";
import Header from "@components/Header";
import { Container, Typography } from "@mui/material";

export default function ContactAdvisors() {
  return (
    <>
      <Header role="/scoopdinator/dashboard"/>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h1" sx={{ mb: 4 }}>
          Contact Advisors
        </Typography>
        <Typography>
          This is a placeholder for the advisor contact page.
        </Typography>
      </Container>
    </>
  );
}

"use client";

import React from "react";
import Header from "@components/Header";
import {
  Box,
  Button,
  Card,
  Container,
  Typography,
  useTheme,
} from "@mui/material";
import EditNoteIcon from "@mui/icons-material/EditNote";

const mockJournalEntries = [
  {
    id: 1,
    contact: "Alice Johnson",
    date: "June 13, 2025",
    notes: "",
  },
];

export default function Journal() {
  //   const editNotes
  const theme = useTheme();

  return (
    <>
      <Header role="/scooployee/dashboard"/>
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h1" sx={{ mb: 4 }}>
          Journal
        </Typography>
        <>
          {mockJournalEntries.map((JournalEntry) => (
            <Card
              key={JournalEntry.id}
              sx={{
                fontFamily:
                  '"Helvetica Neue", Helvetica, Roboto, Arial, sans-serif',
                padding: "1rem",
                backgroundColor: theme.palette.background.paper,
              }}
            >
              <Box
                sx={{
                  display: "flex",
                  justifyContent: "space-between",
                }}
              >
                <Typography variant="h2">{JournalEntry.date}</Typography>
                <Button startIcon={<EditNoteIcon />} variant="solid-orange">
                  Edit Notes
                </Button>
              </Box>
              <Typography variant="h3">{JournalEntry.contact}</Typography>
              <Typography>Notes:</Typography>
              <Box
                sx={{
                  border: "1px solid black",
                  borderRadius: "1rem",
                  padding: "1rem",
                }}
              >
                {JournalEntry.notes}
              </Box>
            </Card>
          ))}
        </>
      </Container>
    </>
  );
}

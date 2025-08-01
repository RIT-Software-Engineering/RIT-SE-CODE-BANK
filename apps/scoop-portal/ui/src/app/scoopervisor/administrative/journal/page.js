import React from "react";
import Header from "@components/Header";
import { Box, Button, Container, Typography } from "@mui/material";
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

  return (
    <>
      <Header />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h1" sx={{ mb: 4 }}>
          Journal
        </Typography>
        <>
          {mockJournalEntries.map((JournalEntry) => (
            <Container
              key={JournalEntry.id}
              sx={{
                fontFamily:
                  '"Helvetica Neue", Helvetica, Roboto, Arial, sans-serif',
                backgroundColor: "#212121",
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
              <Typography>{JournalEntry.contact}</Typography>
              <Typography>Notes:</Typography>
              <Box
                sx={{
                  border: "1px solid black",
                  borderRadius: "10px",
                  padding: "1em",
                }}
              >
                {JorunalEntry.notes}
              </Box>
            </Container>
          ))}
        </>
      </Container>
    </>
  );
}

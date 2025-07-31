"use client";

import React, { useEffect, useState } from "react";
import Header from "@components/Header";
import {
  Box,
  Button,
  Card,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
  useTheme,
} from "@mui/material";
import EditNoteIcon from "@mui/icons-material/EditNote";
import toast, { Toaster } from "react-hot-toast";
import JournalLoading from "./loading";

// BUG: There's dark mode flicker on this page
// TODO: Doc comment for Journal()
export default function Journal() {
  const theme = useTheme();
  const [journalEntries, setJournalEntries] = useState([]);
  const [contactees, setContactees] = useState({});
  const [editingEntry, setEditingEntry] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [loading, setLoading] = useState([]);

  useEffect(() => {
    console.log("API URL:", process.env.NEXT_PUBLIC_API_URL);
    const fetchEntries = async () => {
      setLoading(true);

      // Fetch all journal entries
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/journal`
        );
        const data = await res.json();
        setJournalEntries(data);

        // Fetch contactee info for all unique contacteeIds
        const uniqueIds = [...new Set(data.map((e) => e.contacteeId))];
        const contacteeMap = {};
        await Promise.all(
          uniqueIds.map(async (id) => {
            // Adjust endpoint as needed for API
            const res = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/api/users/${id}`
            );
            if (res.ok) {
              const user = await res.json();
              contacteeMap[id] = `${user.fname} ${user.lname}`;
            } else {
              contacteeMap[i] = "Unknown";
            }
          })
        );
        setContactees(contacteeMap);
      } catch (err) {
        console.error("Failed to fetch journal entries or contactees:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEntries();
  }, []);

  const handleEditClick = (entry) => {
    setEditingEntry(entry);
    setEditValue(entry.notes);
  };

  const handleCancelEdit = () => {
    setEditingEntry(null);
  };

  const saveEntryNotes = async (entry) => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/journal/${entry.id}`,
        {
          method: "PUT",
          headers: {
            "Content-Type": "application/json",
          },
          body: JSON.stringify({ notes: editValue }),
        }
      );
      setJournalEntries((prev) =>
        prev.map((e) => (e.id === entry.id ? { ...e, notes: editValue } : e))
      );
    } catch (error) {
      console.error("Failed to save entry notes:", error);
    }
    setEditingEntry(null);
  };

  const handleSaveEdit = (entry) => {
    toast.promise(saveEntryNotes(entry), {
      loading: "Saving...",
      success: "Notes saved!",
      error: "Failed to save notes.",
    });
  };

  if (loading) {
    return <JournalLoading />;
  }

  return (
    <>
      <Header />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <Typography variant="h1" sx={{ mb: 4 }}>
          Journal
        </Typography>

        {journalEntries.length === 0 ? (
          <Typography variant="body1">
            No journal entries found. Please check back later.
          </Typography>
        ) : (
          journalEntries
            .sort((a, b) => new Date(b.date) - new Date(a.date))
            .map((entry) => (
              <Card
                key={entry.id}
                square
                sx={{
                  fontFamily:
                    '"Helvetica Neue", Helvetica, Roboto, Arial, sans-serif',
                  padding: "1rem",
                }}
              >
              <Box sx={{ display: "flex", justifyContent: "space-between" }}>
                  <Typography variant="h2">
                    {entry.date
                      ? new Date(entry.date).toLocaleDateString("en-US", {
                          year: "numeric",
                          month: "long",
                          day: "numeric",
                          hour: "numeric",
                          minute: "numeric",
                        })
                      : ""}
                  </Typography>
                  <Button
                    startIcon={<EditNoteIcon />}
                    variant="solid-orange"
                    onClick={() => handleEditClick(entry)}
                  >
                    Edit Notes
                  </Button>
                </Box>
                <Typography variant="h3">
                  with {contactees[entry.contacteeId] || entry.contacteeId}
                </Typography>
                <Typography variant="body1">Notes:</Typography>
                <Box
                  sx={{
                    border: "1px solid black",
                    padding: "1rem",
                    marginTop: "1rem",
                  }}
                >
                  <pre
                    style={{
                      margin: 0,
                      fontFamily: "inherit",
                      background: "none",
                      border: "none",
                    }}
                  >
                    {entry.notes}
                  </pre>
                </Box>
              </Card>
            ))
        )}
      </Container>
      <Dialog
        open={!!editingEntry}
        onClose={handleSaveEdit}
        maxWidth="sm"
        fullWidth
      >
        {editingEntry && (
          <>
            <DialogTitle>
              Journal Entry for{" "}
              {new Date(editingEntry.date).toLocaleDateString("en-US", {
                year: "numeric",
                month: "long",
                day: "numeric",
                hour: "numeric",
                minute: "numeric",
              })}
              <br />
              with{" "}
              {contactees[editingEntry.contacteeId] || editingEntry.contacteeId}
            </DialogTitle>
            <DialogContent>
              <Box>
                <textarea
                  value={editValue}
                  onChange={(e) => setEditValue(e.target.value)}
                  style={{
                    resize: "none",
                    width: "95%",
                    height: "200px",
                    padding: "10px",
                    border: "1px solid #ccc",
                    borderRadius: "4px",
                    fontFamily:
                      '"Helvetica Neue", Helvetica, Roboto, Arial, sans-serif',
                    fontSize: "1rem",
                  }}
                />
              </Box>
            </DialogContent>
            <DialogActions>
              <Button variant="outline-orange" onClick={handleCancelEdit}>
                Cancel
              </Button>
              <Button
                variant="outline-orange"
                onClick={() => handleSaveEdit(editingEntry)}
              >
                Save
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Toaster
        position="top-center"
        reverseOrder={false}
        toastOptions={{
          style: { borderRadius: "0px" },
          success: {
            style: {
              backgroundColor: theme.palette.success.main,
              color: theme.palette.success.contrastText,
            },
          },
          error: {
            style: {
              backgroundColor: theme.palette.error.main,
              color: theme.palette.error.contrastText,
            },
          },
        }}
      />
      {/* TODO: Add footer? */}
    </>
  );
}

"use client";

import React, { useEffect, useState } from "react";
import Header from "@components/Header";
import JournalHeader from "@components/journal/JournalHeader";
import FilterDialog from "@components/FilterDialog";
import {
  Box,
  Button,
  Card,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Select,
  Typography,
  useTheme,
} from "@mui/material";
import EditNoteIcon from "@mui/icons-material/EditNote";
import toast, { Toaster } from "react-hot-toast";
import JournalLoading from "./loading";

// TODO: Doc comment for Journal()
/**
 *
 * @returns
 */
export default function Journal() {
  const theme = useTheme();
  // For the journal entry data
  const [journalEntries, setJournalEntries] = useState([]);
  const [semesterGroups, setSemesterGroups] = useState({});
  const [contactees, setContactees] = useState({});
  // For opening the Filter Dialog
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);

  // For filtering journal entries
  // For editing nournal entry notes
  const [editingEntry, setEditingEntry] = useState(null);
  const [editValue, setEditValue] = useState("");
  // For page loading
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log("API URL:", process.env.NEXT_PUBLIC_API_URL);

    const fetchEntries = async () => {
      setLoading(true);

      // Build the API url for fetching the data
      let url = `${process.env.NEXT_PUBLIC_API_URL}/api/journal/admin`;
      // if (semesterGroupId || contacteeEmail) {
      //   url += "?";
      //   if (semesterGroupId) {
      //     url += `semester_group=${semesterGroupId}`;
      //   }
      //   if (contacteeEmail) {
      //     url += `contactee=${contacteeEmail}`;
      //   }
      // }

      // Fetch the journal entries
      try {
        console.log("Fetching journal entries...");
        const res = await fetch(url);
        const data = await res.json();
        console.log(data);
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

  // Functions for filtering journal entries
  const handleOpenFilterDialog = () => setFilterDialogOpen(true);
  const handleCloseFilterDialog = () => setFilterDialogOpen(false);

  // const handleCancelFilter = () => {
  //   return;
  // };

  // Functions for editing journal entry notes
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
      <Container maxWidth="lg" sx={{ py: 4, "& > *:last-child": { mb: "0" } }}>
        <JournalHeader setFilterDialogOpen={setFilterDialogOpen} />
        {journalEntries.length === 0 ? (
          <Typography variant="body1">
            No journal entries found. Please check back later.
          </Typography>
        ) : (
          journalEntries.map((entry) => (
            <Card
              key={entry.id}
              square
              sx={{
                fontFamily:
                  '"Helvetica Neue", Helvetica, Roboto, Arial, sans-serif',
                padding: "1rem",
                mb: "0.5rem",
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
                with {contactees[entry.contacteeEmail] || entry.contacteeEmail}
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

      {/* For Filter */}
      <FilterDialog
        open={filterDialogOpen}
        title="Filter Journal Entries"
        onCancel={handleCloseFilterDialog}
        actionLabel="Filter"
      >
        <Typography>Filter by semester</Typography>
        <Select>
          <MenuItem>There is no option</MenuItem>
        </Select>
        <Typography>Filter by contactee</Typography>
      </FilterDialog>

      {/* For Note Editing */}
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
              {contactees[editingEntry.contacteeEmail] ||
                editingEntry.contacteeEmail}
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

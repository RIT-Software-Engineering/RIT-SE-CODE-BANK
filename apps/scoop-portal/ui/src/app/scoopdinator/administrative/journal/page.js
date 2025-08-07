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
  FormControl,
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
  const [contactees, setContactees] = useState({});
  const [semester_groups, setSemesterGroups] = useState({});

  // New entries
  const [newEntryOpen, setNewEntryOpen] = useState(false);
  // For opening the Filter Dialog
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  // For filtering journal entries
  const [filterSemesterValue, setFilterSemesterValue] = useState("");
  const [filterContacteeValue, setFilterContacteeValue] = useState("");
  // For editing nournal entry notes
  const [editingEntry, setEditingEntry] = useState(null);
  const [editValue, setEditValue] = useState("");
  // For page loading
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    console.log("API URL:", process.env.NEXT_PUBLIC_API_URL);

    const fetchEntries = async () => {
      setLoading(true);

      // Fetch the journal entries
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/journal/admin` //change to scoopdinator?
        );
        const data = await res.json();
        console.log(data);
        setJournalEntries(data);

        // Fetch contactee info for all unique contacteeIds
        const uniqueContactees = [
          ...new Set(
            data?.map((e) => `${e.contactee_fname}:::${e.contactee_lname}`)
          ),
        ];
        const contacteeMap = {};
        await Promise.all(
          uniqueContactees.map(async (entry) => {
            const [fname, lname] = entry.split(":::");
            const res = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/api/users?fname=${encodeURIComponent(fname)}&lname=${encodeURIComponent(lname)}`
            );
            if (res.ok) {
              const user = await res.json();
              const fullName = `${fname} ${lname}`;
              contacteeMap[fullName] = user[0].id;
            } else {
              contacteeMap["Unknown"] = "Unknown";
            }
          })
        );
        setContactees(contacteeMap);

        // Fetch semester info for all unique semester_GroupId
        const uniqueSemesterGroupIds = [
          ...new Set(data.map((e) => e.semester_GroupId)),
        ];
        const semesterGroupMap = {};
        await Promise.all(
          uniqueSemesterGroupIds.map(async (id) => {
            const res = await fetch(
              `${process.env.NEXT_PUBLIC_API_URL}/api/semestergroup/${id}`
            );
            if (res.ok) {
              const semester_group = await res.json();
              semesterGroupMap[id] = `${semester_group.name}`;
            } else {
              semesterGroupMap[id] = "Unknown";
            }
          })
        );
        setSemesterGroups(semesterGroupMap);
        console.log(semesterGroupMap);
      } catch (err) {
        console.error("Failed to fetch journal entries or contactees: ", err);
      } finally {
        setLoading(false);
      }
    };

    fetchEntries();
  }, []);

  // Functions for filtering journal entries
  const handleOpenFilterDialog = () => setFilterDialogOpen(true);
  const handleCloseFilterDialog = () => setFilterDialogOpen(false);
  const handleFilterSemesterChange = (event) => {
    setFilterSemesterValue(event.target.value || "");
  };
  const handleFilterContacteeChange = (event) => {
    setFilterContacteeValue(event.target.value || "");
  };
  const handleApplyFilter = async () => {
    setLoading(true);

    // Build the API url for fetching the data
    let url = `${process.env.NEXT_PUBLIC_API_URL}/api/journal/admin`; //change to scoopdinator?
    if (filterSemesterValue != "" || filterContacteeValue != "") {
      url += "?";
      if (filterSemesterValue) {
        url += `semester_GroupId=${filterSemesterValue}`;
      }
      if (filterSemesterValue != "" && filterContacteeValue != "") {
        url += `&`;
      }
      if (filterContacteeValue) {
        // For demo purposes and this bit of code,
        // Don't use "SUPER DUPER ADMIN" in test data.
        const [fname, lname] = filterContacteeValue.split(" ");
        url += `contactee_fname=${encodeURIComponent(fname)}&contactee_lname=${encodeURIComponent(lname)}`;
      }
    }

    // Fetch filtered journal entries
    try {
      console.log(url);
      const res = await fetch(url);
      const data = await res.json();
      console.log(data);
      setJournalEntries(data);
    } catch (error) {
      console.error("Failed to apply filter:", err);
    } finally {
      setLoading(false);
      setFilterDialogOpen(false); // Close the dialog after applying
    }
  };

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
        <Button variant="outline-orange" 
        // onClick={() => setNewEntryOpen(true)}
        >
          Add Entry
        </Button>
        {journalEntries.length === 0 ? (
          <Typography variant="body1">
            No journal entries found. Please check back later.
          </Typography>
        ) : (
          journalEntries?.map((entry) => (
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
                with {entry.contactee_fname} {entry.contactee_lname}
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
      {/* Add Entry */}
      <Dialog
        open={newEntryOpen}
        onClose={() => setNewEntryOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Create New Journal Entry</DialogTitle>
        <DialogContent>
          {/* Form inputs here */}
          <Box>
            <FormControl fullWidth sx={{ mb: 2 }}>
              <Select
                value={filterSemesterValue}
                onChange={handleFilterSemesterChange}
              >
                <MenuItem value="">Select Semester</MenuItem>
                {Object.entries(semester_groups).map(([id, name]) => (
                  <MenuItem key={id} value={id}>
                    {name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <Select
                value={filterContacteeValue}
                onChange={handleFilterContacteeChange}
              >
                <MenuItem value="">Select Contactee</MenuItem>
                {Object.entries(contactees).map(([name, id]) => (
                  <MenuItem key={id} value={name}>
                    {name}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>

            <textarea
              placeholder="Write your notes here..."
              value={editValue}
              onChange={(e) => setEditValue(e.target.value)}
              style={{
                width: "100%",
                height: "150px",
                border: "1px solid #ccc",
                padding: "10px",
                fontFamily:
                  '"Helvetica Neue", Helvetica, Roboto, Arial, sans-serif',
              }}
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setNewEntryOpen(false)}>Cancel</Button>
          <Button variant="contained" 
          // onClick={handleCreateNewEntry}
          >
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* For Filter */}
      <FilterDialog
        open={filterDialogOpen}
        title="Filter Journal Entries"
        onCancel={handleCloseFilterDialog}
        onSubmit={handleApplyFilter}
        actionLabel="Apply Filter"
      >
        <Typography>Filter by semester</Typography>
        <FormControl>
          <Select
            value={filterSemesterValue}
            onChange={handleFilterSemesterChange}
          >
            <MenuItem key="none" value="">
              <em>None</em>
            </MenuItem>
            {Object.entries(semester_groups).map(([id, name]) => (
              <MenuItem key={id} value={id}>
                {name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Typography>Filter by contactee</Typography>
        <FormControl>
          <Select
            value={filterContacteeValue}
            onChange={handleFilterContacteeChange}
          >
            <MenuItem key="none" value="">
              <em>None</em>
            </MenuItem>
            {Object.entries(contactees).map(([name, id]) => (
              <MenuItem key={id} value={name}>
                {name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>
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
              {`${editingEntry.contactee_fname} ${editingEntry.contactee_lname}`}
            </DialogTitle>
            <DialogContent>
              <Box>
                <textarea
                  value={editValue || ""}
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
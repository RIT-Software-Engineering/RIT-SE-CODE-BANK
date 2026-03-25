"use client";

import FilterDialog from "@components/FilterDialog";
import Header from "@components/Header";
import JournalHeader from "@components/journal/JournalHeader";
import EditNoteIcon from "@mui/icons-material/EditNote";
import {
  Autocomplete,
  Box,
  Button,
  Card,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { notify } from "utils/notify";
import JournalLoading from "./loading";

/**
 * Renders the content for the Journal Page
 * @returns {JSX.Element}
 */
export default function Journal() {
  const theme = useTheme();
  /*
   * These constants are for storing data on the journal entries,
   * contactees in the entries, and semester groups that the entries
   * are a part of.
   */
  const [journalEntries, setJournalEntries] = useState([]);
  const [contactees, setContactees] = useState({});
  const [semesterGroups, setSemesterGroups] = useState({});

  /**
   * This is for determining whether the dialog box for creating a
   * new journal entry should be open or closed.
   */
  const [newEntryOpen, setNewEntryOpen] = useState(false);
  // For opening the Filter Dialog
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  // For filtering journal entries
  const [filterSemesterValue, setFilterSemesterValue] = useState("");
  const [filterContacteeValue, setFilterContacteeValue] = useState("");
  // For creating new journal entries
  const [newEntrySemester, setNewEntrySemester] = useState("");
  const [newEntryContactee, setNewEntryContactee] = useState("");
  // For editing journal entry notes
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
        const [entriesRes, usersRes, semestersRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/journal/scoopdinator`), //changed admin to scoopdinator
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/semestergroup`),
        ]);

        const [entries, users, semesterGroups] = await Promise.all([
          entriesRes.json(),
          usersRes.json(),
          semestersRes.json(),
        ]);

        // Ensure entries is an array before setting it
        setJournalEntries(Array.isArray(entries) ? entries : []);

        const contacteeMap = {};
        users.forEach((user) => {
          const fullName = `${user.fname} ${user.lname}`;
          contacteeMap[user.id] = fullName;
        });
        setContactees(contacteeMap);

        const semesterGroupMap = {};
        semesterGroups.forEach((group) => {
          semesterGroupMap[group.id] = group.name;
        });
        setSemesterGroups(semesterGroupMap);
      } catch (err) {
        console.error("Failed to fetch data: ", err);
        setJournalEntries([]); // Set to empty array on error
      } finally {
        setLoading(false);
      }
    };

    fetchEntries();
  }, []);

  // Functions for filtering journal entries
  /**
   * Handles the change in the semester filter selections.
   *
   * This function updates the state of the semester filter value
   * based on the selected value from the dropdown.
   * @param {*} event
   * @returns {void}
   */
  const handleFilterSemesterChange = (event) => {
    setFilterSemesterValue(event.target.value || "");
  };

  /**
   * Handles the change in the contactee filter selection.
   *
   * This function updates the state of the contactee filter value
   * based on the selected value from the dropdown.
   * @param {*} event
   * @returns {void}
   */
  const handleFilterContacteeChange = (event) => {
    setFilterContacteeValue(event.target.value || "");
  };

  /**
   * Handles the logic for applying the filter to the journal entries.
   *
   * This function will fetch the journal entries based on the selected semester
   * and contactee values. If no filters are applied, it will fetch all journal entries.
   * It will also close the filter dialog after applying the filter.
   * @async
   * @returns {void}
   */
  const handleApplyFilter = async () => {
    setLoading(true);

    // Build the API url for fetching the data
    let url = `${process.env.NEXT_PUBLIC_API_URL}/api/journal/scoopdinator`; //changed to scoopdinator
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
      // Ensure data is an array before setting it
      setJournalEntries(Array.isArray(data) ? data : []);
    } catch (error) { 
      console.error("Failed to apply filter:", error);
      setJournalEntries([]); // Set to empty array on error
    } finally {
      setLoading(false);
      setFilterDialogOpen(false); // Close the dialog after applying
    }
  };

  // Functions for editing journal entry notes
  /**
   * Handles the logic for setting up the journal entry to have their notes edited.
   *
   * This function will set the editing entry to the entry that is being edited
   * and set the edit value to the current notes of that entry.
   * @param {*} entry
   * @returns {void}
   */
  const handleEditClick = (entry) => {
    setEditingEntry(entry);
    setEditValue(entry.notes);
  };

  /**
   * Handles the logic for canceling editing journal entry notes.
   *
   * This functiol will set the editing entry to null. No changes will be saved
   * to the database.
   * @returns {void}
   */
  const handleCancelEdit = () => {
    setEditingEntry(null);
  };

  /**
   * Saves the new notes for the journal entry to the database.
   *
   * This function will update the journal entry notes in the database
   * and update the state of the journal entries to reflect the changes.
   * @async
   * @param {*} entry - The entry that will have their notes updated
   * @returns {void}
   */
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
      // Check for successful response from API
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      // Assuming the update is successful, update local state
      setJournalEntries((prev) =>
        prev.map((e) => (e.id === entry.id ? { ...e, notes: editValue } : e))
      );

      return { message: "Notes saved successfully." };
    } catch (error) {
      console.error("Failed to save entry notes: ", error);
      throw error;
    } finally {
      setEditingEntry(null);
    }
  };

  /**
   * Handles the logic for saving the edited notes of a journal entry.
   *
   * This function will call the saveEntryNotes function
   * to update the notes in the database and reset the edit value.
   * A toast notification will be displayed to indicate success or failure.
   * @param {*} entry - The entry to be updated in the database
   */
  const handleSaveEdit = (entry) => {
    notify.promise(saveEntryNotes(entry), {
      loading: "Saving…",
      success: "Notes saved!",
      error: "Failed to save notes.",
    });
    setEditValue("");
  };

  const postNewEntry = async () => {
    const [contactee_fname, contactee_lname] =
      contactees[newEntryContactee]?.split(" ") || ["", ""];

    const entry = {
      date: new Date().toISOString(), // Add this to match existing entries
      contactee_fname,
      contactee_lname,
      notes: editValue,
      journal_owner_fname: "Demo",
      journal_owner_lname: "Owner",
      journal_owner_type: "admin",
      semester_GroupId: Number(newEntrySemester),
    };

    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/journal`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(entry),
        }
      );

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const data = await res.json();
      if (data.entry) {
        setJournalEntries((prev) => [data.entry, ...prev]);
      } else {
        console.warn("No entry returned from API, or unexpected structure.");
        throw new Error("API did not return the expected entry object.");
      }

      setNewEntryOpen(false);
      setEditValue("");
      setNewEntrySemester("");
      setNewEntryContactee("");
      return { message: "Journal entry created!" };
    } catch (error) {
      console.error("Failed to create a new journal entry: ", error);
      throw error;
    }
  };

  /**
   * A stubbed function for creating a new journal entry.
   * Currently, an alert is produced.
   * @returns {void}
   */
  const handleCreateNewEntry = () => {
    if (!newEntrySemester || !newEntryContactee) {
      notify.error("Please fill out all fields.");
      return;
    }

    notify.promise(postNewEntry(), {
      loading: "Creating journal entry…",
      success: "Journal entry created!",
      error: "Failed to create a new journal entry.",
    });
  };

  if (loading) {
    return <JournalLoading />;
  }

  return (
    <>
      <Header />
      <Container maxWidth="lg" sx={{ py: 4, "& > *:last-child": { mb: "0" } }}>
        <JournalHeader
          setFilterDialogOpen={setFilterDialogOpen}
          setNewEntryOpen={setNewEntryOpen}
        />
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
                with {entry.contactee_fname} {entry.contactee_lname}
              </Typography>
              <Typography>
                Semester: {semesterGroups[entry.semester_GroupId] || "Unknown"}
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
            {/* TODO: Add option and functionality for picking the date and time for the journal entries. */}
            <FormControl fullWidth>
              <Autocomplete
                options={Object.entries(semesterGroups).map(([id, name]) => ({
                  label: name,
                  value: id,
                }))}
                getOptionLabel={(option) => option.label}
                onChange={(event, newValue) =>
                  setNewEntrySemester(newValue ? newValue.value : "")
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Semester"
                    variant="outlined"
                    fullWidth
                    required
                  />
                )}
                sx={{ my: 2 }}
              />
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <Autocomplete
                options={Object.entries(contactees).map(([id, name]) => ({
                  label: name,
                  value: id,
                }))}
                getOptionLabel={(option) => option.label}
                onChange={(event, newValue) =>
                  setNewEntryContactee(newValue ? newValue.value : "")
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Contactee"
                    variant="outlined"
                    fullWidth
                    required
                  />
                )}
              />
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
          <Button
            variant="outline-orange"
            onClick={() => setNewEntryOpen(false)}
          >
            Cancel
          </Button>
          <Button variant="outline-orange" onClick={handleCreateNewEntry}>
            Save
          </Button>
        </DialogActions>
      </Dialog>

      {/* For Filter */}
      <FilterDialog
        open={filterDialogOpen}
        title="Filter Journal Entries"
        onCancel={() => setFilterDialogOpen(false)}
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
            {Object.entries(semesterGroups).map(([id, name]) => (
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
            {Object.entries(contactees).map(([id, name]) => (
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
        onClose={handleCancelEdit}
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

      {/* TODO: Add footer? */}
    </>
  );
}

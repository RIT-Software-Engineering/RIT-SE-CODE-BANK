"use client";

import FilterDialog from "@components/FilterDialog";
import Header from "@components/Header";
import JournalHeader from "@components/journal/JournalHeader";
import EditNoteIcon from "@mui/icons-material/EditNote";
import { useUser } from "../utils/user-context/page";
import {
  Autocomplete,
  Box,
  Button,
  Card,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  InputLabel,
  MenuItem,
  Select,
  TextField,
  Typography,
  useTheme,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import toast, { Toaster } from "react-hot-toast";

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
  const [filteredJournalEntries, setFilteredJournalEntries] = useState([]);
  const [users, setUsers] = useState({});
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
  const [filterSenderValue, setFilterSenderValue] = useState("");
  const [filterRecipientValue, setFilterRecipientValue] = useState("");
  const [filterTopicValue, setFilterTopicValue] = useState("");
  // For creating new journal entries
  const [newEntrySemester, setNewEntrySemester] = useState("");
  const [newEntryRecipientIds, setNewEntryRecipientIds] = useState([]);
  const [newEntryTopicId, setNewEntryTopicId] = useState("");
  // For editing journal entry notes
  const [editingEntry, setEditingEntry] = useState(null);
  const [editValue, setEditValue] = useState("");

  const [replyEntry, setReplyEntry] = useState(null);

  const { user } = useUser();
  
    useEffect(() => {
      async function fetchEntries () {
        if (user == null || user.id == null){
          return;
        }
        try {
        const [entriesRes, usersRes, semestersRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/journal/${user.id}`), 
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/semestergroup`),
        ]);

        const [entries, loadedUsers, semesterGroups] = await Promise.all([
          entriesRes.json(),
          usersRes.json(),
          semestersRes.json(),
        ]);

        // Ensure entries is an array before setting it
        setJournalEntries(Array.isArray(entries) ? entries : []);
        setFilteredJournalEntries(Array.isArray(entries) ? entries : []);

        const contacteeMap = {};
        loadedUsers.forEach((loadedUser) => {
          const fullName = `${loadedUser.fname} ${loadedUser.lname}`;
          contacteeMap[loadedUser.id] = fullName;
        });
        setUsers(contacteeMap);

        const semesterGroupMap = {};
        semesterGroups.forEach((group) => {
          semesterGroupMap[group.id] = group.name;
        });
        setSemesterGroups(semesterGroupMap);
      } catch (err) {
        console.error("Failed to fetch data: ", err);
        setJournalEntries([]); // Set to empty array on error
      }
      return null;
  
      }
      fetchEntries();
    }, [user]);

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
  const handleFilterRecipientChange = (event) => {
    setFilterRecipientValue(event.target.value || "");
  };
  const handleFilterSenderChange = (event) => {
    setFilterSenderValue(event.target.value || "");
  };
  const handleFilterTopicChange = (event) => {
    setFilterTopicValue(event.target.value || "");
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
    if(filterSemesterValue != "" || filterRecipientValue != "" || filterSenderValue != "" || filterTopicValue != ""){
      let baseArray = Array.from(journalEntries)
      if (filterSemesterValue) {
        baseArray = baseArray.filter((entry) => entry.semester_GroupId == filterSemesterValue);
      }  
      if(filterRecipientValue){
        baseArray = baseArray.filter(entry => entry.recipients.some(recipient => recipient.id === filterRecipientValue));
      }
      if(filterSenderValue){
        baseArray = baseArray.filter((entry) => entry.sender_id == filterSenderValue);
      }
      if(filterTopicValue){
        baseArray = baseArray.filter((entry) => entry.topic_id == filterTopicValue);
      }
      setFilteredJournalEntries(baseArray)
    }
    else{
      setFilteredJournalEntries(Array.from(journalEntries));
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
      setFilteredJournalEntries((prev) =>
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
    toast.promise(saveEntryNotes(entry), {
      loading: "Saving...",
      success: "Notes saved!",
      error: "Failed to save notes.",
    });
    setEditValue("");
  };

  const postNewEntry = async () => {

    const entry = {
      date: new Date().toISOString(), // Add this to match existing entries
      sender_id: user.id,
      notes: editValue,
      recipient_ids: newEntryRecipientIds,
      topic_id: newEntryTopicId,
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
        setJournalEntries((prev) => [...prev, data.entry]);
        setFilteredJournalEntries((prev) => [...prev, data.entry]);
        //handleApplyFilter();
      } else {
        console.warn("No entry returned from API, or unexpected structure.");
        throw new Error("API did not return the expected entry object.");
      }

      setNewEntryOpen(false);
      setEditValue("");
      setNewEntrySemester("");
      setNewEntryRecipientIds([]);
      setNewEntryTopicId("");
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
    if (!newEntrySemester || !newEntryRecipientIds || !newEntryTopicId) {
      toast.error("Please fill out all fields.");
      return;
    }

    toast.promise(postNewEntry(), {
      loading: "Creating new journal entry...",
      success: "Journal entry created!",
      error: "Failed to create a new journal entry.",
    });
  };

  return (
    <>
      <Header />
      <Container maxWidth="lg" sx={{ py: 4, "& > *:last-child": { mb: "0" } }}>
        <JournalHeader
          setFilterDialogOpen={setFilterDialogOpen}
          setNewEntryOpen={setNewEntryOpen}
        />
        {filteredJournalEntries.length === 0 ? (
          <Typography variant="body1">
            No journal entries found. Please check back later.
          </Typography>
        ) : (
          filteredJournalEntries.map((entry) => (
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
                To: {entry.recipients.map(rec => rec.fname + " " + rec.lname).join(", ")}
              </Typography>
              <Typography variant="h3">
                From: {entry.sender.fname} {entry.sender.lname}
              </Typography>
              <Typography variant="h3">
                About: {entry.topic.fname} {entry.topic.lname}
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
              <Divider sx={{ my: 2 }} />
              <Button
                  variant="solid-orange"
                  onClick={() => setReplyEntry(entry)}
                >
                  Show Replies
                </Button>
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
                multiple
                options={Object.entries(users).map(([id, name]) => ({
                  label: name,
                  value: id,
                }))}
                getOptionLabel={(option) => option.label}
                onChange={(event, selected) =>
                  setNewEntryRecipientIds(selected.map(selectedName => selectedName.value))
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Recipient"
                    variant="outlined"
                    fullWidth
                    required
                  />
                )}
              />
            </FormControl>

            <FormControl fullWidth sx={{ mb: 2 }}>
              <Autocomplete
                options={Object.entries(users).map(([id, name]) => ({
                  label: name,
                  value: id,
                }))}
                getOptionLabel={(option) => option.label}
                onChange={(event, newValue) =>
                  setNewEntryTopicId(newValue ? newValue.value : "")
                }
                renderInput={(params) => (
                  <TextField
                    {...params}
                    label="Topic"
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

        <Typography>Filter by sender</Typography>
          <FormControl>
            <Select
              value={filterSenderValue}
              onChange={handleFilterSenderChange}
            >
              <MenuItem key="none" value="">
                <em>None</em>
              </MenuItem>
              {Object.entries(users).map(([id, name]) => (
                <MenuItem key={id} value={id}>
                  {name}
                </MenuItem>
              ))}
          </Select>
        </FormControl>

        <Typography>Filter by recipient</Typography>
        <FormControl>
          <Select
            value={filterRecipientValue}
            onChange={handleFilterRecipientChange}
          >
            <MenuItem key="none" value="">
              <em>None</em>
            </MenuItem>
            {Object.entries(users).map(([id, name]) => (
              <MenuItem key={id} value={id}>
                {name}
              </MenuItem>
            ))}
          </Select>
        </FormControl>

        <Typography>Filter by topic</Typography>
        <FormControl>
          <Select
            value={filterTopicValue}
            onChange={handleFilterTopicChange}
          >
            <MenuItem key="none" value="">
              <em>None</em>
            </MenuItem>
            {Object.entries(users).map(([id, name]) => (
              <MenuItem key={id} value={id}>
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
              {editingEntry.recipients.map(rec => rec.fname + " " + rec.lname).join(", ")}
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
      <Dialog
        open={replyEntry != null}
        onClose={() => setReplyEntry(null)}
        maxWidth="sm"
        fullWidth
      >
        {replyEntry && (
        <DialogContent>
          <Typography>{JSON.stringify(replyEntry.next_entries)}</Typography>
        </DialogContent>
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

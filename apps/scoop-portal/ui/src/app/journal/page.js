"use client";

import React, { useEffect, useState } from "react";
import FilterDialog from "@components/FilterDialog";
import Header from "@components/Header";
import JournalHeader from "@components/journal/JournalHeader";
import { useUser } from "../utils/user-context/page";
import {
  Autocomplete,
  Avatar,
  Box,
  Button,
  Chip,
  Container,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  MenuItem,
  Paper,
  Select,
  Stack,
  TextField,
  Tooltip,
  Typography,
  useTheme,
  alpha
} from "@mui/material";

import Timeline from "@mui/lab/Timeline";
import TimelineItem from "@mui/lab/TimelineItem";
import TimelineSeparator from "@mui/lab/TimelineSeparator";
import TimelineConnector from "@mui/lab/TimelineConnector";
import TimelineContent from "@mui/lab/TimelineContent";
import TimelineDot from "@mui/lab/TimelineDot";
import TimelineOppositeContent, { timelineOppositeContentClasses } from "@mui/lab/TimelineOppositeContent";

import toast, { Toaster } from "react-hot-toast";

const CAN_CREATE_JOURNAL = ["scoopdinator", "advisor", "scoopervisor"];

export default function Journal() {
  const theme = useTheme();

  const [journalEntries, setJournalEntries] = useState([]);
  const [filteredJournalEntries, setFilteredJournalEntries] = useState([]);
  const [users, setUsers] = useState({});
  const [allUsers, setAllUsers] = useState([]);
  const [scooployeeUsers, setScooployeeUsers] = useState({});
  const [semesterGroups, setSemesterGroups] = useState({});

  const [newEntryOpen, setNewEntryOpen] = useState(false);
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);

  // Filter States
  const [filterSemesterValue, setFilterSemesterValue] = useState("");
  const [filterSenderValue, setFilterSenderValue] = useState("");
  const [filterRecipientValue, setFilterRecipientValue] = useState("");
  const [filterTopicValue, setFilterTopicValue] = useState("");
  const [filterEntryTypeValue, setFilterEntryTypeValue] = useState("");
  const [filterTimeValue, setFilterTimeValue] = useState("newest_first");

  // New Entry States
  const [newEntryNotes, setNewEntryNotes] = useState("");
  const [newEntrySemester, setNewEntrySemester] = useState("");
  const [newEntryRecipientIds, setNewEntryRecipientIds] = useState([]);
  const [newEntryRecipientObjects, setNewEntryRecipientObjects] = useState([]);
  const [newEntryTopicId, setNewEntryTopicId] = useState("");
  const [newEntryPreviousId, setNewEntryPreviousId] = useState(null);
  const [newEntryVisibilityLevel, setNewEntryVisibilityLevel] = useState("");
  const [newEntryIsComment, setNewEntryIsComment] = useState(false);

  // Edit States
  const [editingEntry, setEditingEntry] = useState(null);
  const [editValue, setEditValue] = useState("");
  const [replyEntry, setReplyEntry] = useState(null);

  const { user } = useUser();

  useEffect(() => {
    async function fetchEntries() {
      if (user == null || user.id == null) return;
      try {
        const [entriesRes, usersRes, semestersRes] = await Promise.all([
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/journal/${user.id}`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users`),
          fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/semestergroup`),
        ]);

        const [entries, loadedUsers, semesterGroupsData] = await Promise.all([
          entriesRes.json(),
          usersRes.json(),
          semestersRes.json(),
        ]);

        setJournalEntries(Array.isArray(entries) ? entries : []);
        handleApplyFilter(Array.isArray(entries) ? entries : []);

        const contacteeMap = {};
        const scooployeeMap = {};
        loadedUsers.forEach((loadedUser) => {
          contacteeMap[loadedUser.id] = `${loadedUser.fname} ${loadedUser.lname}`;
          if (loadedUser.type === "scooployee") {
            scooployeeMap[loadedUser.id] = `${loadedUser.fname} ${loadedUser.lname}`;
          }
        });
        setUsers(contacteeMap);
        setAllUsers(loadedUsers);
        setScooployeeUsers(scooployeeMap);

        const semesterGroupMap = {};
        semesterGroupsData.forEach((group) => {
          semesterGroupMap[group.id] = group.name;
        });
        setSemesterGroups(semesterGroupMap);
      } catch (err) {
        console.error("Failed to fetch data: ", err);
        setJournalEntries([]);
      }
    }
    fetchEntries();
  }, [user]);

  const handleJSONDownload = () => {
    const JSONString = JSON.stringify(journalEntries, null, 2);
    const blob = new Blob([JSONString], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `journal_entries_${new Date().toISOString().split('T')[0]}.json`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);
  };

  // -- Filters --
  const handleFilterSemesterChange = (e) => setFilterSemesterValue(e.target.value || "");
  const handleFilterRecipientChange = (e) => setFilterRecipientValue(e.target.value || "");
  const handleFilterSenderChange = (e) => setFilterSenderValue(e.target.value || "");
  const handleFilterTopicChange = (e) => setFilterTopicValue(e.target.value || "");
  const handleFilterEntryTypeChange = (e) => setFilterEntryTypeValue(e.target.value || "");
  const handleFilterTimeChange = (e) => setFilterTimeValue(e.target.value || "");

  const handleApplyFilter = (baseArray = null) => {
    if (baseArray == null) baseArray = Array.from(journalEntries);
    if (filterTopicValue) baseArray = baseArray.filter((entry) => entry.topic_id == filterTopicValue);
    if (filterSemesterValue) baseArray = baseArray.filter((entry) => entry.semester_GroupId == filterSemesterValue);
    if (filterRecipientValue) baseArray = baseArray.filter(entry => entry.recipients.some(recipient => recipient.id === filterRecipientValue));
    if (filterSenderValue) baseArray = baseArray.filter((entry) => entry.sender_id == filterSenderValue);
    if (filterEntryTypeValue) baseArray = baseArray.filter((entry) => entry.entry_type == filterEntryTypeValue);
    if (filterTimeValue === "oldest_first") baseArray.sort((a, b) => new Date(a.date) - new Date(b.date));
    if (filterTimeValue === "newest_first") baseArray.sort((a, b) => new Date(b.date) - new Date(a.date));
    setFilteredJournalEntries(baseArray);
  };

  const handleClearFilter = () => {
    setFilterSemesterValue("");
    setFilterSenderValue("");
    setFilterRecipientValue("");
    setFilterTopicValue("");
    setFilterEntryTypeValue("");
    setFilterTimeValue("newest_first");
    const fullArray = Array.from(journalEntries).sort((a, b) => new Date(b.date) - new Date(a.date));
    setFilteredJournalEntries(fullArray);
  };

  const getVisibilityOptions = () => {
    const roleRank = { scooployee: 1, advisor: 2, scoopervisor: 3, scoopdinator: 4 };
    const rank = user?.type ? (roleRank[user.type] ?? 0) : 0;
    const options = [{ value: "PERSONAL", label: "Private Note" }];
    if (rank >= 1) options.push({ value: "1", label: "Everyone" });
    if (rank >= 2) options.push({ value: "2", label: "Advisors and higher" });
    if (rank >= 3) options.push({ value: "3", label: "Scoopervisors and higher" });
    if (rank >= 4) options.push({ value: "4", label: "Scoopdinators only" });
    return options;
  };

  const isPrivateEntry = newEntryVisibilityLevel === "PERSONAL";

  const getEligibleRecipients = () => {
    const roleRank = { scooployee: 1, advisor: 2, scoopervisor: 3, scoopdinator: 4 };
    const visibilityRank = parseInt(newEntryVisibilityLevel) || 0;
    return Object.entries(users)
      .filter(([id]) => {
        const u = allUsers.find(u => u.id === id);
        if (!u) return true;
        return (roleRank[u.type] ?? 0) >= visibilityRank;
      })
      .filter(([id]) => !newEntryRecipientIds.includes(id))
      .map(([id, name]) => ({ label: name, value: id }));
  };

  // -- Edit Logic --
  const handleEditClick = (entry) => {
    setEditingEntry(entry);
    setEditValue(entry.notes);
  };
  const handleCancelEdit = () => setEditingEntry(null);

  const saveEntryNotes = async (entry) => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/journal/${entry.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ notes: editValue }),
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);
      setJournalEntries((prev) => prev.map((e) => (e.id === entry.id ? { ...e, notes: editValue } : e)));
      setFilteredJournalEntries((prev) => prev.map((e) => (e.id === entry.id ? { ...e, notes: editValue } : e)));
      return { message: "Notes saved successfully." };
    } catch (error) {
      console.error("Failed to save entry notes: ", error);
      throw error;
    } finally {
      setEditingEntry(null);
    }
  };

  const handleSaveEdit = (entry) => {
    toast.promise(saveEntryNotes(entry), { loading: "Saving...", success: "Notes saved!", error: "Failed to save notes." });
    setEditValue("");
  };

  // -- New Entry Logic --
  const postNewEntry = async () => {
    const privacy_level = newEntryVisibilityLevel === "PERSONAL" ? "PERSONAL" : "PUBLIC";
    const visibility_level = newEntryVisibilityLevel !== "PERSONAL" ? parseInt(newEntryVisibilityLevel) : 1;

    const entry = {
      date: new Date().toISOString(),
      sender_id: user.id,
      notes: newEntryNotes,
      recipient_ids: isPrivateEntry ? [] : newEntryRecipientIds,
      topic_id: newEntryTopicId,
      semester_GroupId: Number(newEntrySemester),
      previous_entryid: parseInt(newEntryPreviousId) || null,
      entry_type: "MANUAL",
      visibility_level,
      privacy_level,
    };

    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/journal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(entry),
      });
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const data = await res.json();
      if (data.entry) {
        let updatedEntries = Array.from(journalEntries);
        if (!newEntryIsComment) {
          updatedEntries = [...updatedEntries, data.entry];
        } else {
          updatedEntries = updatedEntries.map((check_entry) => {
            if (check_entry.id == parseInt(newEntryPreviousId)) {
              return { ...check_entry, next_entries: [...check_entry.next_entries, data.entry] };
            }
            return check_entry;
          });
        }
        setJournalEntries(updatedEntries);
        handleApplyFilter(updatedEntries);
      }
      handleCancelNewEntry();
      return { message: "Journal entry created!" };
    } catch (error) {
      console.error("Failed to create a new journal entry: ", error);
      throw error;
    }
  };

  const handleCancelNewEntry = () => {
    setNewEntryOpen(false);
    setNewEntryNotes("");
    setNewEntrySemester("");
    setNewEntryRecipientIds([]);
    setNewEntryRecipientObjects([]);
    setNewEntryTopicId("");
    setNewEntryPreviousId(null);
    setNewEntryVisibilityLevel("");
    setNewEntryIsComment(false);
  };

  const handleCreateNewEntry = () => {
    const missingRecipients = !isPrivateEntry && !newEntryRecipientIds.length;
    if (!newEntrySemester || missingRecipients || !newEntryTopicId || !newEntryVisibilityLevel || !newEntryNotes.trim()) {
      toast.error("Please fill out all fields.");
      return;
    }
    toast.promise(postNewEntry(), { loading: "Creating new journal entry...", success: "Journal entry created!", error: "Failed to create a new journal entry." });
  };

  const getInitials = (fname, lname) => {
    return `${fname ? fname[0] : ""}${lname ? lname[0] : ""}`.toUpperCase();
  };

  function EntriesList({ entries, commentView = false }) {
    const isDarkMode = theme.palette.mode === 'dark';

    if (entries == null || entries.length === 0) {
      return (
        <Typography variant="body1" sx={{ textAlign: 'center', mt: 4, color: 'text.secondary' }}>
          No journal entries found.
        </Typography>
      );
    }

    return (
      <Timeline
        position="right"
        sx={{
          [`& .${timelineOppositeContentClasses.root}`]: {
            flex: 0.2,
          },
        }}
      >
        {entries.map((entry) => {
          const isSender = entry.sender_id === user.id;
          const entryDate = new Date(entry.date);
          const avatarBgColor = isSender ? theme.palette.primary.main : theme.palette.secondary.main;
          const avatarTextColor = theme.palette.getContrastText(avatarBgColor);

          return (
            <TimelineItem key={entry.id}>
              <TimelineOppositeContent color="text.secondary">
                <Typography variant="body2" sx={{ fontWeight: 'bold', color: isDarkMode ? 'text.primary' : 'inherit' }}>
                  {entryDate.toLocaleDateString("en-US", { month: "short", day: "numeric" })}
                </Typography>
                <Typography variant="caption" display="block">
                  {entryDate.toLocaleTimeString("en-US", { hour: "numeric", minute: "2-digit" })}
                </Typography>
                <Typography variant="caption" sx={{ fontStyle: "italic", mt: 0.5, display: "block" }}>
                  {entryDate.getFullYear()}
                </Typography>
              </TimelineOppositeContent>

              <TimelineSeparator>
                <TimelineDot
                  color={entry.entry_type === "AUTOMATED" ? "grey" : "primary"}
                  sx={{ p: 0, overflow: 'hidden', border: isDarkMode ? '1px solid #444' : 'none' }}
                >
                  <Tooltip title={`${entry.sender.fname} ${entry.sender.lname}`}>
                    <Avatar
                      sx={{
                        width: 36,
                        height: 36,
                        fontSize: '0.9rem',
                        fontWeight: 'bold',
                        bgcolor: avatarBgColor,
                        color: avatarTextColor,
                      }}
                    >
                      {getInitials(entry.sender.fname, entry.sender.lname)}
                    </Avatar>
                  </Tooltip>
                </TimelineDot>
                <TimelineConnector sx={{ bgcolor: isDarkMode ? 'rgba(255,255,255,0.12)' : undefined }} />
              </TimelineSeparator>

              <TimelineContent sx={{ py: '12px', px: 2 }}>
                <Paper
                  elevation={isDarkMode ? 3 : 2}
                  sx={{
                    p: 2,
                    borderRadius: 3,
                    position: "relative",
                    borderTopLeftRadius: 0,
                    backgroundColor: isDarkMode
                      ? (isSender ? alpha(theme.palette.primary.main, 0.15) : theme.palette.background.paper)
                      : (isSender ? "#f9fcfd" : "#fff"),
                    border: isDarkMode ? `1px solid ${alpha(theme.palette.common.white, 0.1)}` : 'none'
                  }}
                >
                  <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", mb: 1 }}>
                    <Box>
                      <Typography variant="subtitle1" sx={{ fontWeight: "bold", lineHeight: 1.2, color: 'text.primary' }}>
                        {entry.sender.fname} {entry.sender.lname}
                      </Typography>
                      <Typography variant="caption" color="text.secondary">
                        To: {entry.recipients.length > 0 ? entry.recipients.map(rec => `${rec.fname} ${rec.lname}`).join(", ") : "No recipients"}
                      </Typography>
                    </Box>
                    {isSender && (
                      <Button size="small" onClick={() => handleEditClick(entry)} sx={{ color: '#FF6A00' }}>
                        Edit
                      </Button>
                    )}
                  </Box>

                  <Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: 'wrap', gap: 1 }}>
                    <Chip
                      label={`Topic: ${entry.topic.fname} ${entry.topic.lname}`}
                      size="small"
                      variant="outlined"
                      sx={{ borderColor: isDarkMode ? 'rgba(255,255,255,0.2)' : undefined }}
                    />
                    {semesterGroups[entry.semester_GroupId] && (
                      <Chip label={semesterGroups[entry.semester_GroupId]} size="small" color="primary" variant="outlined" />
                    )}
                    <Chip label={entry.privacy_level == "PUBLIC" ? "Public" : "Private"} size="small" color={entry.privacy_level == "PUBLIC" ? "success" : "warning"} variant="outlined" />
                    <Chip label={entry.entry_type} size="small" sx={{ opacity: 0.7 }} />
                  </Stack>

                  <Box
                    sx={{
                      backgroundColor: isDarkMode ? alpha(theme.palette.common.white, 0.05) : "rgba(0,0,0,0.03)",
                      padding: "1rem",
                      borderRadius: 1,
                      borderLeft: `4px solid ${theme.palette.primary.main}`,
                      color: 'text.primary'
                    }}
                  >
                    <Typography
                      variant="body2"
                      component="pre"
                      sx={{
                        whiteSpace: "pre-wrap",
                        fontFamily: "inherit",
                        m: 0,
                        color: 'inherit'
                      }}
                    >
                      {entry.notes}
                    </Typography>
                  </Box>

                  {commentView && (
                    <Box sx={{ mt: 2, display: 'flex', gap: 1, justifyContent: 'flex-end' }}>
                      <Button
                        size="small"
                        onClick={() => setReplyEntry(entry)}
                        sx={{ color: 'text.secondary' }}
                      >
                        {entry.next_entries.length || 0} Replies
                      </Button>
                      <Button
                        size="small"
                        variant={isDarkMode ? "outlined" : "contained"}
                        onClick={() => {
                          setNewEntryPreviousId(entry.id);
                          setNewEntryIsComment(true);
                          setNewEntryTopicId(entry.topic_id);
                          setNewEntryRecipientIds(entry.recipients.map(r => r.id));
                          setNewEntryRecipientObjects(entry.recipients);
                          setNewEntrySemester(entry.semester_GroupId);
                          setNewEntryOpen(true);
                        }}
                      >
                        Reply
                      </Button>
                    </Box>
                  )}
                </Paper>
              </TimelineContent>
            </TimelineItem>
          );
        })}
      </Timeline>
    );
  }

  return (
    <>
      <Header />
      <Container maxWidth="lg" sx={{ py: 4 }}>
        <JournalHeader
          setFilterDialogOpen={setFilterDialogOpen}
          setNewEntryOpen={CAN_CREATE_JOURNAL.includes(user?.type) ? setNewEntryOpen : null}
          handleJSONDownload={handleJSONDownload}
        />
        <EntriesList entries={filteredJournalEntries.filter(entry => entry.previous_entryid == null)} commentView={true} />
      </Container>

      {/* Add Entry / Reply Dialog */}
      <Dialog open={newEntryOpen} onClose={handleCancelNewEntry} maxWidth="sm" fullWidth>
        <DialogTitle>{newEntryIsComment ? "Add Reply" : "Create New Journal Entry"}</DialogTitle>
        <DialogContent>
          <Box sx={{ mt: 1 }}>
            {/* Visibility first — drives whether recipient field shows */}
            <TextField
              select
              label="Visibility"
              required
              fullWidth
              value={newEntryVisibilityLevel}
              onChange={(e) => {
                setNewEntryVisibilityLevel(e.target.value);
                setNewEntryRecipientIds([]);
                setNewEntryRecipientObjects([]);
              }}
              sx={{ mb: 2 }}
            >
              {getVisibilityOptions().map((opt) => (
                <MenuItem key={opt.value} value={opt.value}>{opt.label}</MenuItem>
              ))}
            </TextField>

            {!newEntryIsComment && (
              <Autocomplete
                options={Object.entries(semesterGroups).map(([id, name]) => ({ label: name, value: id }))}
                getOptionLabel={(option) => option.label}
                onChange={(e, v) => setNewEntrySemester(v ? v.value : "")}
                renderInput={(params) => <TextField {...params} label="Semester" required />}
                sx={{ mb: 2 }}
              />
            )}

            {/* Recipients — hidden for private notes, locked chips on reply, autocomplete on new */}
            {!isPrivateEntry && (
              !newEntryIsComment ? (
                <Autocomplete
                  multiple
                  options={getEligibleRecipients()}
                  getOptionLabel={(option) => option.label}
                  value={Object.entries(users).filter(([id]) => newEntryRecipientIds.includes(id)).map(([id, name]) => ({ label: name, value: id }))}
                  onChange={(e, s) => setNewEntryRecipientIds(s.map(sn => sn.value))}
                  isOptionEqualToValue={(option, value) => option.value === value.value}
                  renderInput={(params) => <TextField {...params} label="Recipient" required />}
                  sx={{ mb: 2 }}
                />
              ) : (
                <Box sx={{ mb: 2 }}>
                  <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                    Recipients
                  </Typography>
                  <Stack direction="row" spacing={1} sx={{ flexWrap: 'wrap', gap: 1 }}>
                    {newEntryRecipientObjects.map(r => (
                      <Chip key={r.id} label={`${r.fname} ${r.lname}`} size="small" />
                    ))}
                  </Stack>
                </Box>
              )
            )}

            {!newEntryIsComment && (
              <Autocomplete
                options={Object.entries(users).map(([id, name]) => ({ label: name, value: id }))}
                getOptionLabel={(option) => option.label}
                onChange={(e, v) => setNewEntryTopicId(v ? v.value : "")}
                renderInput={(params) => <TextField {...params} label="Topic" required />}
                sx={{ mb: 2 }}
              />
            )}

            <TextField
              multiline
              rows={6}
              placeholder="Write your notes here..."
              value={newEntryNotes}
              onChange={(e) => setNewEntryNotes(e.target.value)}
              fullWidth
              variant="outlined"
              required
            />
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={handleCancelNewEntry}>Cancel</Button>
          <Button variant="contained" onClick={handleCreateNewEntry}>Save</Button>
        </DialogActions>
      </Dialog>

      {/* Filter Dialog */}
      <FilterDialog
        open={filterDialogOpen}
        title="Filter Journal Entries"
        onCancel={() => setFilterDialogOpen(false)}
        onSubmit={() => handleApplyFilter()}
        actionLabel="Apply Filter"
        secondaryAction={<Button variant="outlined" onClick={handleClearFilter}>Clear Filter</Button>}
      >
        <Stack spacing={2}>
          <Box>
            <Typography variant="caption" color="text.secondary">Semester</Typography>
            <Select fullWidth size="small" value={filterSemesterValue} onChange={handleFilterSemesterChange} displayEmpty>
              <MenuItem value=""><em>None</em></MenuItem>
              {Object.entries(semesterGroups).map(([id, name]) => <MenuItem key={id} value={id}>{name}</MenuItem>)}
            </Select>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Sender</Typography>
            <Select fullWidth size="small" value={filterSenderValue} onChange={handleFilterSenderChange} displayEmpty>
              <MenuItem value=""><em>None</em></MenuItem>
              {Object.entries(users).map(([id, name]) => <MenuItem key={id} value={id}>{name}</MenuItem>)}
            </Select>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Recipient</Typography>
            <Select fullWidth size="small" value={filterRecipientValue} onChange={handleFilterRecipientChange} displayEmpty>
              <MenuItem value=""><em>None</em></MenuItem>
              {Object.entries(users).map(([id, name]) => <MenuItem key={id} value={id}>{name}</MenuItem>)}
            </Select>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Topic</Typography>
            <Select fullWidth size="small" value={filterTopicValue} onChange={handleFilterTopicChange} displayEmpty>
              <MenuItem value=""><em>None</em></MenuItem>
              {Object.entries(users).map(([id, name]) => <MenuItem key={id} value={id}>{name}</MenuItem>)}
            </Select>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Entry Type</Typography>
            <Select fullWidth size="small" value={filterEntryTypeValue} onChange={handleFilterEntryTypeChange} displayEmpty>
              <MenuItem value=""><em>None</em></MenuItem>
              <MenuItem value="AUTOMATED">AUTOMATED</MenuItem>
              <MenuItem value="MANUAL">MANUAL</MenuItem>
            </Select>
          </Box>
          <Box>
            <Typography variant="caption" color="text.secondary">Time</Typography>
            <Select fullWidth size="small" value={filterTimeValue} onChange={handleFilterTimeChange} displayEmpty>
              <MenuItem value="newest_first">Newest First</MenuItem>
              <MenuItem value="oldest_first">Oldest First</MenuItem>
            </Select>
          </Box>
        </Stack>
      </FilterDialog>

      {/* Edit Dialog */}
      <Dialog open={!!editingEntry} onClose={handleCancelEdit} maxWidth="sm" fullWidth>
        {editingEntry && (
          <>
            <DialogTitle>Edit Note</DialogTitle>
            <DialogContent>
              <TextField
                multiline
                rows={8}
                value={editValue}
                onChange={(e) => setEditValue(e.target.value)}
                fullWidth
                sx={{ mt: 1 }}
              />
            </DialogContent>
            <DialogActions>
              <Button onClick={handleCancelEdit}>Cancel</Button>
              <Button variant="contained" onClick={() => handleSaveEdit(editingEntry)}>Save</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Reply Dialog */}
      <Dialog open={replyEntry != null} onClose={() => setReplyEntry(null)} maxWidth="md" fullWidth>
        {replyEntry && (
          <>
            <DialogTitle>Thread</DialogTitle>
            <DialogContent dividers>
              {replyEntry.next_entries.length > 0 ? (
                <EntriesList entries={replyEntry.next_entries} commentView={false} />
              ) : (
                <Typography color="text.secondary" sx={{ py: 2, textAlign: "center" }}>
                  No replies found
                  <br />
                  Be the first to reply!
                </Typography>
              )}
            </DialogContent>
            <DialogActions>
              <Button onClick={() => setReplyEntry(null)}>Close</Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      <Toaster position="top-center" reverseOrder={false} />
    </>
  );
}
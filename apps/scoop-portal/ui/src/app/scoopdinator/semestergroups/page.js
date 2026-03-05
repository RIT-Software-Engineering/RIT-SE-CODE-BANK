"use client";
import React, { useState, useEffect } from "react";
import Header from "@components/Header";
import { useTheme } from "@mui/material/styles";
import {
  Typography,
  Paper,
  Table,
  TableHead,
  TableCell,
  TableRow,
  TableBody,
  Button,
  Dialog,
  DialogTitle,
  DialogContent,
  Box,
  DialogActions,
  TableSortLabel,
  Snackbar,
  Alert,
  TextField,
  InputAdornment,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";

export default function ManageSemesterGroups() {
  const theme = useTheme();

  const [groups, setGroups] = useState([]);
  const [selectedGroup, setSelectedGroup] = useState(null);
  const [sortField, setSortField] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");
  const [searchQuery, setSearchQuery] = useState("");

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  const [addOpen, setAddOpen] = useState(false);
  const [newGroup, setNewGroup] = useState({ name: "", dept: "", start_date: "", end_date: "" });
  const [addingGroup, setAddingGroup] = useState(false);
  const [addErrors, setAddErrors] = useState({});

  const [editFields, setEditFields] = useState({ name: "", dept: "", start_date: "", end_date: "" });
  const [savingEdit, setSavingEdit] = useState(false);
  const [confirmEditOpen, setConfirmEditOpen] = useState(false);
  const [editErrors, setEditErrors] = useState({});

  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deletingGroup, setDeletingGroup] = useState(false);

  const fetchAllGroups = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/semestergroup`);
      const data = await res.json();
      setGroups(data);
    } catch (err) {
      console.error("Failed to fetch semester groups:", err);
    }
  };

  useEffect(() => {
    fetchAllGroups();
  }, []);

  const handleOpen = (group) => {
    setSelectedGroup(group);
    setEditErrors({});
    setEditFields({
      name: group.name,
      dept: group.dept,
      start_date: group.start_date ? group.start_date.slice(0, 10) : "",
      end_date: group.end_date ? group.end_date.slice(0, 10) : "",
    });
  };

  const handleClose = () => {
    setSelectedGroup(null);
    setEditErrors({});
    setConfirmEditOpen(false);
    setConfirmDeleteOpen(false);
  };

  const handleSort = (field) => {
    const isAsc = sortField === field && sortOrder === "asc";
    setSortField(field);
    setSortOrder(isAsc ? "desc" : "asc");
  };

  const validateFields = (fields) => {
    const errs = {};
    if (!fields.name.trim()) errs.name = "Name is required.";
    if (!fields.dept.trim()) errs.dept = "Department is required.";
    if (!fields.start_date) errs.start_date = "Start date is required.";
    if (!fields.end_date) errs.end_date = "End date is required.";
    if (fields.start_date && fields.end_date && fields.end_date < fields.start_date)
      errs.end_date = "End date must be after start date.";
    return errs;
  };

  const sortedGroups = [...groups].sort((a, b) => {
    if (!sortField) return 0;
    let aVal = a[sortField]?.toString().toLowerCase() ?? "";
    let bVal = b[sortField]?.toString().toLowerCase() ?? "";
    if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
    if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  const filteredGroups = sortedGroups.filter((group) => {
    if (!searchQuery.trim()) return true;
    const q = searchQuery.trim().toLowerCase();
    return (
      group.name?.toLowerCase().includes(q) ||
      group.dept?.toLowerCase().includes(q)
    );
  });

  const handleSaveEditClick = () => {
    const errs = validateFields(editFields);
    setEditErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setConfirmEditOpen(true);
  };

  const handleConfirmEdit = async () => {
    setSavingEdit(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/semestergroup/${selectedGroup.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(editFields),
        }
      );
      if (!res.ok) throw new Error("Failed to update semester group");
      await fetchAllGroups();
      setConfirmEditOpen(false);
      handleClose();
      setSnackbarSeverity("success");
      setSnackbarMsg("Semester group updated successfully!");
      setSnackbarOpen(true);
    } catch (err) {
      console.error(err);
      setSnackbarSeverity("error");
      setSnackbarMsg(err.message || "Failed to update semester group. Please try again.");
      setSnackbarOpen(true);
    } finally {
      setSavingEdit(false);
    }
  };

  const formatDate = (dateStr) => {
  if (!dateStr) return "—";
  const [year, month, day] = dateStr.slice(0, 10).split("-");
  return `${month}/${day}/${year}`;
};

  const handleConfirmDelete = async () => {
    setDeletingGroup(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/semestergroup/${selectedGroup.id}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        const serverMsg = errorData?.error || errorData?.message || `HTTP ${res.status}`;
        throw new Error(serverMsg);
      }
      setGroups((prev) => prev.filter((g) => g.id !== selectedGroup.id));
      setConfirmDeleteOpen(false);
      handleClose();
      setSnackbarSeverity("success");
      setSnackbarMsg("Semester group deleted successfully.");
      setSnackbarOpen(true);
    } catch (err) {
      console.error("Delete error:", err);
      setSnackbarSeverity("error");
      setSnackbarMsg(err.message || "Failed to delete semester group. Please try again.");
      setSnackbarOpen(true);
    } finally {
      setDeletingGroup(false);
    }
  };

  const handleAddGroup = async () => {
    const errs = validateFields(newGroup);
    setAddErrors(errs);
    if (Object.keys(errs).length > 0) return;

    const isDuplicate = groups.some(
      (g) => g.name.trim().toLowerCase() === newGroup.name.trim().toLowerCase()
    );
    if (isDuplicate) {
      setSnackbarSeverity("error");
      setSnackbarMsg("A semester group with this name already exists.");
      setSnackbarOpen(true);
      return;
    }

    setAddingGroup(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/semestergroup`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newGroup),
      });
      if (!res.ok) throw new Error("Failed to add semester group");
      await fetchAllGroups();
      setSnackbarSeverity("success");
      setSnackbarMsg("Semester group added successfully!");
      setSnackbarOpen(true);
      setNewGroup({ name: "", dept: "", start_date: "", end_date: "" });
      setAddErrors({});
      setAddOpen(false);
    } catch (err) {
      console.error(err);
      setSnackbarSeverity("error");
      setSnackbarMsg(err.message || "Failed to add semester group. Please try again.");
      setSnackbarOpen(true);
    } finally {
      setAddingGroup(false);
    }
  };

  const tableCellSx = { backgroundColor: theme.palette.primary.main, color: theme.ritColors.white };
  const sortLabelSx = { color: theme.ritColors.white, "& .MuiTableSortLabel-icon": { color: `${theme.ritColors.white} !important` } };

  return (
    <>
      <Header />
      <Typography variant="h4" sx={{ fontWeight: 600, mb: 3 }}>
        Manage Semester Groups
      </Typography>

      {/* Toolbar */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, gap: 2 }}>
        <TextField
          size="small"
          placeholder="Search..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          sx={{ width: 220, mt: 1.75 }}
          InputProps={{
            startAdornment: (
              <InputAdornment position="start">
                <SearchIcon fontSize="small" sx={{ color: theme.palette.text.secondary }} />
              </InputAdornment>
            ),
          }}
        />
        <Button variant="solid-orange" onClick={() => setAddOpen(true)} startIcon={<AddIcon />}>
          Add Semester Group
        </Button>
      </Box>

      {/* Table */}
      <Paper elevation={1} square sx={{ maxHeight: 500, overflow: "auto" }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {["name", "dept", "start_date", "end_date"].map((field) => (
                <TableCell key={field} sx={tableCellSx}>
                  <TableSortLabel
                    active={sortField === field}
                    direction={sortField === field ? sortOrder : "asc"}
                    onClick={() => handleSort(field)}
                    sx={sortLabelSx}
                  >
                    {field === "name" && "Name"}
                    {field === "dept" && "Department"}
                    {field === "start_date" && "Start Date"}
                    {field === "end_date" && "End Date"}
                  </TableSortLabel>
                </TableCell>
              ))}
              <TableCell sx={tableCellSx} align="right">Options</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredGroups.map((group) => (
              <TableRow key={group.id}>
                <TableCell>{group.name}</TableCell>
                <TableCell>{group.dept}</TableCell>
                <TableCell>{formatDate(group.start_date)}</TableCell>
                <TableCell>{formatDate(group.end_date)}</TableCell>
                <TableCell align="right">
                  <Button variant="outline-orange" onClick={() => handleOpen(group)}>Edit</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* Edit Modal */}
      <Dialog open={!!selectedGroup} onClose={handleClose} maxWidth="sm" fullWidth>
        {selectedGroup && (
          <>
            <DialogTitle sx={{ bgcolor: theme.palette.primary.main, color: theme.ritColors.white, fontWeight: 600 }}>
              Edit: {selectedGroup.name}
            </DialogTitle>
            <DialogContent dividers>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
                <TextField
                  label="Name *"
                  value={editFields.name}
                  onChange={(e) => { setEditFields((p) => ({ ...p, name: e.target.value })); setEditErrors((p) => ({ ...p, name: undefined })); }}
                  fullWidth
                  error={!!editErrors.name}
                  helperText={editErrors.name}
                />
                <TextField
                  label="Department *"
                  value={editFields.dept}
                  onChange={(e) => { setEditFields((p) => ({ ...p, dept: e.target.value })); setEditErrors((p) => ({ ...p, dept: undefined })); }}
                  fullWidth
                  error={!!editErrors.dept}
                  helperText={editErrors.dept}
                />
                <TextField
                  label="Start Date *"
                  type="date"
                  value={editFields.start_date}
                  onChange={(e) => { setEditFields((p) => ({ ...p, start_date: e.target.value })); setEditErrors((p) => ({ ...p, start_date: undefined })); }}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  error={!!editErrors.start_date}
                  helperText={editErrors.start_date}
                />
                <TextField
                  label="End Date *"
                  type="date"
                  value={editFields.end_date}
                  onChange={(e) => { setEditFields((p) => ({ ...p, end_date: e.target.value })); setEditErrors((p) => ({ ...p, end_date: undefined })); }}
                  fullWidth
                  InputLabelProps={{ shrink: true }}
                  error={!!editErrors.end_date}
                  helperText={editErrors.end_date}
                />
              </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2, gap: 0.5 }}>
              <Button onClick={handleClose} variant="outlined" color="inherit" disabled={savingEdit}>
                Cancel
              </Button>
              <Button variant="contained" color="error" onClick={() => setConfirmDeleteOpen(true)} disabled={savingEdit}>
                Delete
              </Button>
              <Button variant="solid-orange" onClick={handleSaveEditClick} disabled={savingEdit}>
                {savingEdit ? "Saving..." : "Save"}
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Confirm Edit Dialog */}
      <Dialog open={confirmEditOpen} onClose={() => setConfirmEditOpen(false)}>
        <DialogTitle>Confirm Changes</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to save changes to{" "}
            <strong>{editFields.name}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 2, py: 1.5, gap: 0.5 }}>
          <Button onClick={() => setConfirmEditOpen(false)} variant="outlined" color="inherit">Cancel</Button>
          <Button onClick={handleConfirmEdit} variant="solid-orange" disabled={savingEdit}>
            {savingEdit ? "Saving..." : "Confirm"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Delete Dialog */}
      <Dialog open={confirmDeleteOpen} onClose={() => setConfirmDeleteOpen(false)}>
        <DialogTitle sx={{ fontWeight: 600 }}>Delete Semester Group</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete{" "}
            <strong>{selectedGroup?.name}</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 2, py: 1.5, gap: 0.5 }}>
          <Button onClick={() => setConfirmDeleteOpen(false)} variant="outlined" color="inherit" disabled={deletingGroup}>
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete} variant="contained" color="error" disabled={deletingGroup}>
            {deletingGroup ? "Deleting..." : "Confirm"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Semester Group Modal */}
      <Dialog
        open={addOpen}
        onClose={() => { setAddOpen(false); setNewGroup({ name: "", dept: "", start_date: "", end_date: "" }); setAddErrors({}); }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Add Semester Group</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              label="Name *"
              value={newGroup.name}
              onChange={(e) => { setNewGroup((p) => ({ ...p, name: e.target.value })); setAddErrors((p) => ({ ...p, name: undefined })); }}
              fullWidth
              error={!!addErrors.name}
              helperText={addErrors.name}
            />
            <TextField
              label="Department *"
              value={newGroup.dept}
              onChange={(e) => { setNewGroup((p) => ({ ...p, dept: e.target.value })); setAddErrors((p) => ({ ...p, dept: undefined })); }}
              fullWidth
              error={!!addErrors.dept}
              helperText={addErrors.dept}
            />
            <TextField
              label="Start Date *"
              type="date"
              value={newGroup.start_date}
              onChange={(e) => { setNewGroup((p) => ({ ...p, start_date: e.target.value })); setAddErrors((p) => ({ ...p, start_date: undefined })); }}
              fullWidth
              InputLabelProps={{ shrink: true }}
              error={!!addErrors.start_date}
              helperText={addErrors.start_date}
            />
            <TextField
              label="End Date *"
              type="date"
              value={newGroup.end_date}
              onChange={(e) => { setNewGroup((p) => ({ ...p, end_date: e.target.value })); setAddErrors((p) => ({ ...p, end_date: undefined })); }}
              fullWidth
              InputLabelProps={{ shrink: true }}
              error={!!addErrors.end_date}
              helperText={addErrors.end_date}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 2, py: 1.5, gap: 0.5 }}>
          <Button
            onClick={() => { setAddOpen(false); setNewGroup({ name: "", dept: "", start_date: "", end_date: "" }); setAddErrors({}); }}
            variant="outlined" color="inherit"
          >
            Cancel
          </Button>
          <Button onClick={handleAddGroup} variant="solid-orange" disabled={addingGroup}>
            {addingGroup ? "Adding..." : "Add"}
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar open={snackbarOpen} autoHideDuration={3000} onClose={() => setSnackbarOpen(false)}>
        <Alert onClose={() => setSnackbarOpen(false)} severity={snackbarSeverity} sx={{ width: "100%" }}>
          {snackbarMsg}
        </Alert>
      </Snackbar>
    </>
  );
}
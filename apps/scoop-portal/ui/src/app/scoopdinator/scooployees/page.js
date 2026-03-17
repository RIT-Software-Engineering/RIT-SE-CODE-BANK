"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
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
  Select,
  MenuItem,
  TableSortLabel,
  Snackbar,
  Alert,
  TextField,
  Chip,
  FormControl,
  InputLabel,
  InputAdornment,
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";
import SearchIcon from "@mui/icons-material/Search";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";

const TYPE_LABELS = {
  prospect: "Prospect",
  scooployee: "Scooployee",
  scoopervisor: "Scoopervisor",
  advisor: "Advisor",
};

const USER_TYPES = ["scooployee", "scoopervisor", "prospect", "advisor"];

const isValidEmail = (email) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim());

const getActiveState = (user) => {
  const val = user.active;
  if (val === "pending") return "pending";
  if (val === "active") return "active";
  return "inactive";
};

const StatusBadge = ({ activeState }) => {
  const theme = useTheme();
  const config = {
    active:   { label: "Active",   color: theme.palette.success.main },
    inactive: { label: "Inactive", color: theme.palette.error.main },
    pending:  { label: "Pending",  color: theme.palette.grey[500] },
  };
  const { label, color } = config[activeState] ?? config.inactive;
  return (
    <Chip
      label={label}
      size="medium"
      sx={{
        fontWeight: 400,
        fontSize: "0.85rem",
        px: 1,
        bgcolor: color,
        color: theme.ritColors.white,
        border: "none",
      }}
    />
  );
};

export default function ViewScooployees() {
  const router = useRouter();
  const theme = useTheme();

  const [users, setUsers] = useState([]);
  const [selectedUser, setSelectedUser] = useState(null);
  const [sortField, setSortField] = useState("semester_group");
  const [sortOrder, setSortOrder] = useState("dsc");

  const [semesterGroups, setSemesterGroups] = useState([]);

  // Filters
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterType, setFilterType] = useState("all");
  const [filterSemesterGroup, setFilterSemesterGroup] = useState("all");

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [searchQuery, setSearchQuery] = useState("");

  const [addOpen, setAddOpen] = useState(false);
  const [newUser, setNewUser] = useState({ fname: "", lname: "", email: "", type: "prospect", semesterGroupId: "", active: "pending" });
  const [addingUser, setAddingUser] = useState(false);
  const [addErrors, setAddErrors] = useState({});

  // Edit state
  const [editFields, setEditFields] = useState({
    fname: "",
    lname: "",
    email: "",
    type: "",
    semesterGroupId: "",
    active: "pending",
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const [confirmEditOpen, setConfirmEditOpen] = useState(false);
  const [editErrors, setEditErrors] = useState({});

  // Delete state
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deletingUser, setDeletingUser] = useState(false);

  const fetchAllUsers = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users`);
      const data = await res.json();
      setUsers(data.filter((u) => USER_TYPES.includes(u.type)));
    } catch (err) {
      console.error("Failed to fetch users:", err);
    }
  };

  useEffect(() => {
    fetchAllUsers();
  }, []);

  useEffect(() => {
    const fetchSemesterGroups = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/semestergroup`);
        const data = await res.json();
        setSemesterGroups(data);
      } catch (err) {
        console.error("Failed to fetch semester groups:", err);
      }
    };
    fetchSemesterGroups();
  }, []);

  const resolveGroupId = (user) =>
    user.semesterGroupId ||
    (user.semester_group && user.semester_group !== "null"
      ? semesterGroups.find((sg) => sg.name === user.semester_group)?.id ?? ""
      : "");

  const resolveGroupName = (user) => {
    if (!user.semester_group || user.semester_group === "null") return null;
    return (
      semesterGroups.find((sg) => String(sg.id) === String(user.semester_group))?.name ??
      user.semester_group
    );
  };

  const handleOpen = (user) => {
    setSelectedUser(user);
    setEditErrors({});
    setEditFields({
      fname: user.fname,
      lname: user.lname,
      email: user.email,
      type: user.type || "",
      semesterGroupId: String(resolveGroupId(user)),
      active: user.active !== undefined ? String(user.active) : "pending",
    });
  };

  const handleClose = () => {
    setSelectedUser(null);
    setEditErrors({});
    setConfirmEditOpen(false);
    setConfirmDeleteOpen(false);
  };

  const handleSort = (field) => {
    const isAsc = sortField === field && sortOrder === "asc";
    setSortField(field);
    setSortOrder(isAsc ? "desc" : "asc");
  };

  const sortedUsers = [...users].sort((a, b) => {
    if (!sortField) return 0;
    let aVal, bVal;
    if (sortField === "semester_group") {
      aVal = (resolveGroupName(a) ?? "").toLowerCase();
      bVal = (resolveGroupName(b) ?? "").toLowerCase();
    } else if (sortField === "type") {
      aVal = (TYPE_LABELS[a.type] ?? "").toLowerCase();
      bVal = (TYPE_LABELS[b.type] ?? "").toLowerCase();
    } else if (sortField === "active") {
      aVal = getActiveState(a);
      bVal = getActiveState(b);
    } else {
      aVal = a[sortField]?.toString().toLowerCase() ?? "";
      bVal = b[sortField]?.toString().toLowerCase() ?? "";
    }
    if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
    if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  const filteredUsers = sortedUsers.filter((user) => {
    const activeState = getActiveState(user);
    if (filterStatus !== "all" && activeState !== filterStatus) return false;
    if (filterType !== "all" && user.type !== filterType) return false;
    if (filterSemesterGroup !== "all") {
      const sg = user.semester_group && user.semester_group !== "null" ? user.semester_group : null;
      if (!sg) {
        if (filterSemesterGroup !== "none") return false;
      } else {
        const matched =
          String(sg) === filterSemesterGroup ||
          semesterGroups.find((s) => String(s.id) === filterSemesterGroup)?.name === sg;
        if (!matched) return false;
      }
    }
    if (searchQuery.trim()) {
      const q = searchQuery.trim().toLowerCase();
      const groupName = resolveGroupName(user)?.toLowerCase() ?? "";
      const matched =
        user.fname?.toLowerCase().includes(q) ||
        user.lname?.toLowerCase().includes(q) ||
        user.email?.toLowerCase().includes(q) ||
        (TYPE_LABELS[user.type] ?? "").toLowerCase().includes(q) ||
        groupName.includes(q);
      if (!matched) return false;
    }
    return true;
  });

  const handleSaveEditClick = () => {
    const errs = {};
    if (!editFields.fname.trim()) errs.fname = "First name is required.";
    if (!editFields.lname.trim()) errs.lname = "Last name is required.";
    if (!editFields.email.trim()) {
      errs.email = "Email is required.";
    } else if (!isValidEmail(editFields.email)) {
      errs.email = "Please enter a valid email address.";
    }
    if (!editFields.type) errs.type = "Type is required.";
    setEditErrors(errs);
    if (Object.keys(errs).length > 0) return;
    setConfirmEditOpen(true);
  };

  const handleConfirmEdit = async () => {
    setSavingEdit(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/${selectedUser.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            fname: editFields.fname,
            lname: editFields.lname,
            email: editFields.email,
            type: editFields.type,
            active: editFields.active,
            semester_group: editFields.semesterGroupId
              ? (semesterGroups.find((sg) => String(sg.id) === String(editFields.semesterGroupId))?.name ?? "null")
              : "null",
          }),
        }
      );
      if (!res.ok) throw new Error("Failed to update user");

      const resolvedGroupName = editFields.semesterGroupId
        ? (semesterGroups.find((sg) => String(sg.id) === String(editFields.semesterGroupId))?.name ?? "null")
        : "null";
      const updatedUser = { ...selectedUser, ...editFields, semester_group: resolvedGroupName };
      setUsers((prev) =>
        prev.map((u) => u.id === selectedUser.id ? { ...u, ...editFields, semester_group: resolvedGroupName } : u)
      );
      setSelectedUser(updatedUser);
      setConfirmEditOpen(false);
      setSnackbarSeverity("success");
      setSnackbarMsg("User updated successfully!");
      setSnackbarOpen(true);
    } catch (err) {
      console.error(err);
      alert("Failed to update user. Please try again.");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleConfirmDelete = async () => {
    setDeletingUser(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/${selectedUser.id}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        const serverMsg = errorData?.error || errorData?.message || `HTTP ${res.status}`;
        throw new Error(serverMsg);
      }
      setUsers((prev) => prev.filter((u) => u.id !== selectedUser.id));
      setConfirmDeleteOpen(false);
      handleClose();
      setSnackbarSeverity("success");
      setSnackbarMsg("User deleted successfully.");
      setSnackbarOpen(true);
    } catch (err) {
      console.error("Delete error:", err);
      setSnackbarSeverity("error");
      setSnackbarMsg(err.message || "Failed to delete user. Please try again.");
      setSnackbarOpen(true);
    } finally {
      setDeletingUser(false);
    }
  };

  const handleAddUser = async () => {
    const { fname, lname, email, type, semesterGroupId, active } = newUser;

    const errs = {};
    if (!fname.trim()) errs.fname = "First name is required.";
    if (!lname.trim()) errs.lname = "Last name is required.";
    if (!email.trim()) {
      errs.email = "Email is required.";
    } else if (!isValidEmail(email)) {
      errs.email = "Please enter a valid email address.";
    }
    if (!type) errs.type = "Type is required.";
    setAddErrors(errs);
    if (Object.keys(errs).length > 0) return;

    let user_id = "";
    if (!newUser.email.includes("@")) {
      user_id = newUser.fname.toLowerCase() + newUser.lname.toLowerCase();
    } else {
      user_id = newUser.email.split("@")[0];
    }

    const isDuplicate = users.some(
      (u) => u.email.trim().toLowerCase() === email.trim().toLowerCase()
    );
    if (isDuplicate) {
      setSnackbarSeverity("error");
      setSnackbarMsg("A user with this email already exists.");
      setSnackbarOpen(true);
      return;
    }

    setAddingUser(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: user_id,
          fname,
          lname,
          email,
          semester_group: semesterGroupId
            ? (semesterGroups.find((sg) => String(sg.id) === String(semesterGroupId))?.name ?? "null")
            : "null",
          project: "null",
          active: active || "pending",
          type: type || "prospect",
          last_login: "",
          prev_login: "",
        }),
      });
      if (!res.ok) throw new Error("Failed to add user");

      await fetchAllUsers();
      setSnackbarSeverity("success");
      setSnackbarMsg("User added successfully!");
      setSnackbarOpen(true);
      setNewUser({ fname: "", lname: "", email: "", type: "prospect", semesterGroupId: "", active: "pending" });
      setAddErrors({});
      setAddOpen(false);
    } catch (err) {
      console.error(err);
      setSnackbarSeverity("error");
      setSnackbarMsg(err.message || "Failed to add user. Please try again.");
      setSnackbarOpen(true);
    } finally {
      setAddingUser(false);
    }
  };

  const handleJournalClick = () => {
    if (selectedUser?.id) router.push(`/journal`);
  };

  const filterChipSx = {
    bgcolor: theme.palette.info.main,
    color: theme.ritColors.white,
    fontWeight: 400,
    fontSize: "0.85rem",
    px: 0.5,
    "& .MuiChip-deleteIcon": {
      color: "rgba(255,255,255,0.7)",
      "&:hover": { color: theme.ritColors.white },
    },
  };

  return (
    <>
      <Header />
      <Typography variant="h4" sx={{ fontWeight: 600, mb: 3 }}>
        Manage Users
      </Typography>

      {/* Toolbar */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, gap: 2 }}>
        <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", flexWrap: "wrap" }}>
          <Button variant="outline-orange" startIcon={<FilterAltOutlinedIcon />} onClick={() => setFilterDialogOpen(true)}>
            Filter
          </Button>
          {filterStatus !== "all" && (
            <Chip size="medium" label={`Status: ${filterStatus}`} onDelete={() => setFilterStatus("all")} sx={filterChipSx} />
          )}
          {filterType !== "all" && (
            <Chip size="medium" label={`Type: ${TYPE_LABELS[filterType]}`} onDelete={() => setFilterType("all")} sx={filterChipSx} />
          )}
          {filterSemesterGroup !== "all" && (
            <Chip
              size="medium"
              label={`Group: ${filterSemesterGroup === "none" ? "No Group" : (semesterGroups.find((sg) => String(sg.id) === filterSemesterGroup)?.name ?? filterSemesterGroup)}`}
              onDelete={() => setFilterSemesterGroup("all")}
              sx={filterChipSx}
            />
          )}
        </Box>

        <Box sx={{ display: "flex", gap: 1.5, alignItems: "center" }}>
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
            Add User
          </Button>
        </Box>
      </Box>

      {/* Table */}
      <Paper elevation={1} square sx={{ maxHeight: 500, overflow: "auto" }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {["fname", "lname", "email"].map((field) => (
                <TableCell key={field} sx={{ backgroundColor: theme.palette.primary.main, color: theme.ritColors.white }}>
                  <TableSortLabel
                    active={sortField === field}
                    direction={sortField === field ? sortOrder : "asc"}
                    onClick={() => handleSort(field)}
                    sx={{
                      color: theme.ritColors.white,
                      "& .MuiTableSortLabel-icon": { color: `${theme.ritColors.white} !important` },
                    }}
                  >
                    {field === "fname" && "First Name"}
                    {field === "lname" && "Last Name"}
                    {field === "email" && "Email"}
                  </TableSortLabel>
                </TableCell>
              ))}
              <TableCell sx={{ backgroundColor: theme.palette.primary.main, color: theme.ritColors.white }}>
                <TableSortLabel
                  active={sortField === "type"}
                  direction={sortField === "type" ? sortOrder : "asc"}
                  onClick={() => handleSort("type")}
                  sx={{ color: theme.ritColors.white, "& .MuiTableSortLabel-icon": { color: `${theme.ritColors.white} !important` } }}
                >
                  Type
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ backgroundColor: theme.palette.primary.main, color: theme.ritColors.white }}>
                <TableSortLabel
                  active={sortField === "semester_group"}
                  direction={sortField === "semester_group" ? sortOrder : "asc"}
                  onClick={() => handleSort("semester_group")}
                  sx={{ color: theme.ritColors.white, "& .MuiTableSortLabel-icon": { color: `${theme.ritColors.white} !important` } }}
                >
                  Semester Group
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ backgroundColor: theme.palette.primary.main, color: theme.ritColors.white }}>
                <TableSortLabel
                  active={sortField === "active"}
                  direction={sortField === "active" ? sortOrder : "asc"}
                  onClick={() => handleSort("active")}
                  sx={{ color: theme.ritColors.white, "& .MuiTableSortLabel-icon": { color: `${theme.ritColors.white} !important` } }}
                >
                  Status
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ backgroundColor: theme.palette.primary.main, color: theme.ritColors.white }} align="right">Options</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.fname}</TableCell>
                <TableCell>{user.lname}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>{TYPE_LABELS[user.type] || "—"}</TableCell>
                <TableCell>
                  {resolveGroupName(user) ?? (
                    <span style={{ color: theme.ritColors.gray_2, fontStyle: "italic" }}>No Group</span>
                  )}
                </TableCell>
                <TableCell><StatusBadge activeState={getActiveState(user)} /></TableCell>
                <TableCell align="right">
                  <Button variant="outline-orange" onClick={() => handleOpen(user)}>Edit</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* Edit Modal */}
      <Dialog open={!!selectedUser} onClose={handleClose} maxWidth="sm" fullWidth>
        {selectedUser && (
          <>
            <DialogTitle sx={{ bgcolor: theme.palette.primary.main, color: theme.ritColors.white, fontWeight: 600 }}>
              Edit: {selectedUser.fname} {selectedUser.lname}
            </DialogTitle>
            <DialogContent dividers>
              <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
                <TextField
                  label="First Name *"
                  value={editFields.fname}
                  onChange={(e) => { setEditFields((p) => ({ ...p, fname: e.target.value })); setEditErrors((p) => ({ ...p, fname: undefined })); }}
                  fullWidth
                  error={!!editErrors.fname}
                  helperText={editErrors.fname}
                />
                <TextField
                  label="Last Name *"
                  value={editFields.lname}
                  onChange={(e) => { setEditFields((p) => ({ ...p, lname: e.target.value })); setEditErrors((p) => ({ ...p, lname: undefined })); }}
                  fullWidth
                  error={!!editErrors.lname}
                  helperText={editErrors.lname}
                />
                <TextField
                  label="Email *"
                  type="email"
                  value={editFields.email}
                  onChange={(e) => { setEditFields((p) => ({ ...p, email: e.target.value })); setEditErrors((p) => ({ ...p, email: undefined })); }}
                  fullWidth
                  error={!!editErrors.email}
                  helperText={editErrors.email}
                />
                <FormControl fullWidth error={!!editErrors.type}>
                  <InputLabel>Type *</InputLabel>
                  <Select value={editFields.type} label="Type *"
                    onChange={(e) => { setEditFields((p) => ({ ...p, type: e.target.value })); setEditErrors((p) => ({ ...p, type: undefined })); }}>
                    <MenuItem value="" disabled>Select a Type</MenuItem>
                    <MenuItem value="prospect">Prospect</MenuItem>
                    <MenuItem value="scooployee">Scooployee</MenuItem>
                    <MenuItem value="scoopervisor">Scoopervisor</MenuItem>
                    <MenuItem value="advisor">Advisor</MenuItem>
                  </Select>
                  {editErrors.type && <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>{editErrors.type}</Typography>}
                </FormControl>
                <FormControl fullWidth>
                  <InputLabel>Status *</InputLabel>
                  <Select value={editFields.active} label="Status *"
                    onChange={(e) => setEditFields((p) => ({ ...p, active: e.target.value }))}>
                    <MenuItem value="active">Active</MenuItem>
                    <MenuItem value="inactive">Inactive</MenuItem>
                    <MenuItem value="pending">Pending</MenuItem>
                  </Select>
                </FormControl>
                <FormControl fullWidth>
                  <InputLabel>Semester Group</InputLabel>
                  <Select value={editFields.semesterGroupId} label="Semester Group"
                    onChange={(e) => setEditFields((p) => ({ ...p, semesterGroupId: e.target.value }))}>
                    <MenuItem value="">No Semester Group</MenuItem>
                    {semesterGroups.map((sg) => (
                      <MenuItem key={sg.id} value={String(sg.id)}>{sg.name}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
              </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2, gap: 0.5 }}>
              <Button onClick={handleClose} variant="outlined" color="inherit" disabled={savingEdit}>
                Cancel
              </Button>
              <Button variant="contained" color="info" onClick={handleJournalClick}>
                Journal
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
            <strong>{editFields.fname} {editFields.lname}</strong>?
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
        <DialogTitle sx={{ fontWeight: 600 }}>Delete User</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to delete{" "}
            <strong>{selectedUser?.fname} {selectedUser?.lname}</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 2, py: 1.5, gap: 0.5 }}>
          <Button onClick={() => setConfirmDeleteOpen(false)} variant="outlined" color="inherit" disabled={deletingUser}>
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete} variant="contained" color="error" disabled={deletingUser}>
            {deletingUser ? "Deleting..." : "Confirm"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add User Modal */}
      <Dialog
        open={addOpen}
        onClose={() => { setAddOpen(false); setNewUser({ fname: "", lname: "", email: "", type: "prospect", semesterGroupId: "", active: "pending" }); setAddErrors({}); }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Add User</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              label="First Name *"
              value={newUser.fname}
              onChange={(e) => { setNewUser((p) => ({ ...p, fname: e.target.value })); setAddErrors((p) => ({ ...p, fname: undefined })); }}
              fullWidth
              error={!!addErrors.fname}
              helperText={addErrors.fname}
            />
            <TextField
              label="Last Name *"
              value={newUser.lname}
              onChange={(e) => { setNewUser((p) => ({ ...p, lname: e.target.value })); setAddErrors((p) => ({ ...p, lname: undefined })); }}
              fullWidth
              error={!!addErrors.lname}
              helperText={addErrors.lname}
            />
            <TextField
              label="Email *"
              type="email"
              value={newUser.email}
              onChange={(e) => { setNewUser((p) => ({ ...p, email: e.target.value })); setAddErrors((p) => ({ ...p, email: undefined })); }}
              fullWidth
              error={!!addErrors.email}
              helperText={addErrors.email}
            />
            <FormControl fullWidth error={!!addErrors.type}>
              <InputLabel shrink>Type *</InputLabel>
              <Select
                value={newUser.type}
                label="Type *"
                displayEmpty
                notched
                onChange={(e) => { setNewUser((p) => ({ ...p, type: e.target.value })); setAddErrors((p) => ({ ...p, type: undefined })); }}
              >
                <MenuItem value="" disabled>Select a Type</MenuItem>
                <MenuItem value="prospect">Prospect</MenuItem>
                <MenuItem value="scooployee">Scooployee</MenuItem>
                <MenuItem value="scoopervisor">Scoopervisor</MenuItem>
                <MenuItem value="advisor">Advisor</MenuItem>
              </Select>
              {addErrors.type && <Typography variant="caption" color="error" sx={{ mt: 0.5, ml: 1.75 }}>{addErrors.type}</Typography>}
            </FormControl>
            <FormControl fullWidth>
              <InputLabel shrink>Status</InputLabel>
              <Select
                value={newUser.active}
                label="Status"
                displayEmpty
                notched
                onChange={(e) => setNewUser((p) => ({ ...p, active: e.target.value }))}
              >
                <MenuItem value="pending">Pending</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel shrink>Semester Group</InputLabel>
              <Select
                value={newUser.semesterGroupId}
                label="Semester Group"
                displayEmpty
                notched
                onChange={(e) => setNewUser((p) => ({ ...p, semesterGroupId: e.target.value }))}
              >
                <MenuItem value="">No Semester Group</MenuItem>
                {semesterGroups.map((sg) => (
                  <MenuItem key={sg.id} value={String(sg.id)}>{sg.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 2, py: 1.5, gap: 0.5 }}>
          <Button
            onClick={() => { setAddOpen(false); setNewUser({ fname: "", lname: "", email: "", type: "prospect", semesterGroupId: "", active: "pending" }); setAddErrors({}); }}
            variant="outlined" color="inherit">
            Cancel
          </Button>
          <Button onClick={handleAddUser} variant="solid-orange" disabled={addingUser}>
            {addingUser ? "Adding..." : "Add"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Filter Modal */}
      <Dialog open={filterDialogOpen} onClose={() => setFilterDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ bgcolor: theme.palette.primary.main, color: theme.ritColors.white, fontWeight: 600 }}>
          Filter Users
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select value={filterStatus} label="Status" onChange={(e) => setFilterStatus(e.target.value)}>
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
                <MenuItem value="pending">Pending</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select value={filterType} label="Type" onChange={(e) => setFilterType(e.target.value)}>
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="prospect">Prospect</MenuItem>
                <MenuItem value="scooployee">Scooployee</MenuItem>
                <MenuItem value="scoopervisor">Scoopervisor</MenuItem>
                <MenuItem value="advisor">Advisor</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Semester Group</InputLabel>
              <Select value={filterSemesterGroup} label="Semester Group" onChange={(e) => setFilterSemesterGroup(e.target.value)}>
                <MenuItem value="all">All Groups</MenuItem>
                <MenuItem value="none">No Group</MenuItem>
                {semesterGroups.map((sg) => (
                  <MenuItem key={sg.id} value={String(sg.id)}>{sg.name}</MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 2, py: 1.5, gap: 0.5 }}>
          <Button variant="outlined" color="inherit"
            onClick={() => { setFilterStatus("all"); setFilterType("all"); setFilterSemesterGroup("all"); }}>
            Reset
          </Button>
          <Button variant="solid-orange" onClick={() => setFilterDialogOpen(false)}>Apply</Button>
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
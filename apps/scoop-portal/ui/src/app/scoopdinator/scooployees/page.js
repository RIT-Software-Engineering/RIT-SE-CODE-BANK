"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@components/Header";
import FilterListIcon from "@mui/icons-material/FilterList";
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
} from "@mui/material";
import AddIcon from "@mui/icons-material/Add";

const TYPE_LABELS = {
  prospect: "Prospect",
  scooployee: "Scooployee",
  scoopervisor: "Scoopervisor",
};

const EMPLOYEE_TYPES = ["scooployee", "scoopervisor", "prospect"];

const isActive = (emp) => {
  if (emp.active !== undefined && emp.active !== null) {
    return emp.active === true || emp.active === "true" || emp.active === 1 || emp.active === "1";
  }
  if (emp.project === "null") return false;
  return true;
};

const StatusBadge = ({ active }) => {
  const theme = useTheme();
  return (
    <Chip
      label={active ? "Active" : "Inactive"}
      size="small"
      sx={{
        fontWeight: 600,
        fontSize: "0.7rem",
        bgcolor: active ? theme.palette.success.main : theme.palette.error.main,
        color: theme.ritColors.white,
        border: "none",
      }}
    />
  );
};

export default function ViewScooployees() {
  const router = useRouter();
  const theme = useTheme();

  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [sortField, setSortField] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");

  const [semesterGroups, setSemesterGroups] = useState([]);

  // Filters
  const [filterStatus, setFilterStatus] = useState("active");
  const [filterType, setFilterType] = useState("all");
  const [filterSemesterGroup, setFilterSemesterGroup] = useState("all");

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState("");
  const [snackbarSeverity, setSnackbarSeverity] = useState("success");

  const [filterDialogOpen, setFilterDialogOpen] = useState(false);

  const [addOpen, setAddOpen] = useState(false);
  const [newEmployee, setNewEmployee] = useState({ fname: "", lname: "", email: "", type: "prospect", semesterGroupId: "" });
  const [addingEmployee, setAddingEmployee] = useState(false);

  // Edit state
  const [editMode, setEditMode] = useState(false);
  const [editFields, setEditFields] = useState({
    fname: "",
    lname: "",
    email: "",
    type: "",
    semesterGroupId: "",
    active: "true",
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const [confirmEditOpen, setConfirmEditOpen] = useState(false);

  // Delete state
  const [confirmDeleteOpen, setConfirmDeleteOpen] = useState(false);
  const [deletingEmployee, setDeletingEmployee] = useState(false);

  const fetchAllEmployees = async () => {
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users`);
      const data = await res.json();
      setEmployees(data.filter((u) => EMPLOYEE_TYPES.includes(u.type)));
    } catch (err) {
      console.error("Failed to fetch employees:", err);
    }
  };

  useEffect(() => {
    fetchAllEmployees();
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

  const handleOpen = (emp) => {
    setSelectedEmployee({ ...emp, hasBeenRead: true });
    setEditFields({
      fname: emp.fname,
      lname: emp.lname,
      email: emp.email,
      type: emp.type || "",
      semesterGroupId: emp.semesterGroupId || "",
      active: emp.active !== undefined ? String(emp.active) : "true",
    });
    setEditMode(false);
    setEmployees((prev) =>
      prev.map((e) => (e.id === emp.id ? { ...e, hasBeenRead: true } : e))
    );
  };

  const handleClose = () => {
    setSelectedEmployee(null);
    setEditMode(false);
    setConfirmEditOpen(false);
    setConfirmDeleteOpen(false);
  };

  const handleSort = (field) => {
    const isAsc = sortField === field && sortOrder === "asc";
    setSortField(field);
    setSortOrder(isAsc ? "desc" : "asc");
  };

  const sortedEmployees = [...employees].sort((a, b) => {
    if (!sortField) return 0;
    const aVal = a[sortField]?.toString().toLowerCase();
    const bVal = b[sortField]?.toString().toLowerCase();
    if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
    if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  const filteredEmployees = sortedEmployees.filter((emp) => {
    if (filterStatus === "active" && !isActive(emp)) return false;
    if (filterStatus === "inactive" && isActive(emp)) return false;
    if (filterType !== "all" && emp.type !== filterType) return false;
    if (filterSemesterGroup !== "all") {
      const sgVal = emp.semester_group && emp.semester_group !== "null" ? String(emp.semester_group) : "none";
      if (filterSemesterGroup === "none" ? sgVal !== "none" : sgVal !== filterSemesterGroup) return false;
    }
    return true;
  });

  const handleEditClick = () => setEditMode(true);

  const handleCancelEdit = () => {
    setEditFields({
      fname: selectedEmployee.fname,
      lname: selectedEmployee.lname,
      email: selectedEmployee.email,
      type: selectedEmployee.type || "",
      semesterGroupId: selectedEmployee.semesterGroupId || "",
      active: selectedEmployee.active !== undefined ? String(selectedEmployee.active) : "true",
    });
    setEditMode(false);
  };

  const handleSaveEditClick = () => {
    if (!editFields.fname || !editFields.lname || !editFields.email) return;
    setConfirmEditOpen(true);
  };

  const handleConfirmEdit = async () => {
    setSavingEdit(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/${selectedEmployee.id}`,
        {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ type: editFields.type, active: editFields.active }),
        }
      );
      if (!res.ok) throw new Error("Failed to update employee");

      const updatedEmployee = { ...selectedEmployee, ...editFields };
      setEmployees((prev) =>
        prev.map((e) => e.id === selectedEmployee.id ? { ...e, ...editFields } : e)
      );
      setSelectedEmployee(updatedEmployee);
      setEditMode(false);
      setConfirmEditOpen(false);
      setSnackbarSeverity("success");
      setSnackbarMsg("Employee updated successfully!");
      setSnackbarOpen(true);
    } catch (err) {
      console.error(err);
      alert("Failed to update employee. Please try again.");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleConfirmDelete = async () => {
    setDeletingEmployee(true);
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/${selectedEmployee.id}`,
        { method: "DELETE" }
      );
      if (!res.ok) {
        const errorData = await res.json().catch(() => null);
        const serverMsg = errorData?.error || errorData?.message || `HTTP ${res.status}`;
        console.error("Delete failed:", serverMsg);
        throw new Error(serverMsg);
      }
      setEmployees((prev) => prev.filter((e) => e.id !== selectedEmployee.id));
      setConfirmDeleteOpen(false);
      handleClose();
      setSnackbarSeverity("success");
      setSnackbarMsg("Employee deleted successfully.");
      setSnackbarOpen(true);
    } catch (err) {
      console.error("Delete error:", err);
      setSnackbarSeverity("error");
      setSnackbarMsg(err.message || "Failed to delete employee. Please try again.");
      setSnackbarOpen(true);
    } finally {
      setDeletingEmployee(false);
    }
  };

  const handleAddEmployee = async () => {
    const { fname, lname, email, type, semesterGroupId } = newEmployee;
    if (!fname || !lname || !email) return;

    let user_id = "";
    if (!newEmployee.email.includes("@")) {
      user_id = newEmployee.fname.toLowerCase() + newEmployee.lname.toLowerCase();
    } else {
      user_id = newEmployee.email.split("@")[0];
    }

    const isDuplicate = employees.some(
      (emp) => emp.email.trim().toLowerCase() === email.trim().toLowerCase()
    );
    if (isDuplicate) {
      setSnackbarSeverity("error");
      setSnackbarMsg("An employee with this email already exists.");
      setSnackbarOpen(true);
      return;
    }

    setAddingEmployee(true);
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
          active: "true",
          type: type || "prospect",
          last_login: "",
          prev_login: "",
        }),
      });
      if (!res.ok) throw new Error("Failed to add employee");

      await fetchAllEmployees();
      setSnackbarSeverity("success");
      setSnackbarMsg("Employee added successfully!");
      setSnackbarOpen(true);
      setNewEmployee({ fname: "", lname: "", email: "", type: "prospect", semesterGroupId: "" });
      setAddOpen(false);
    } catch (err) {
      console.error(err);
      alert("Failed to add employee. Please try again.");
    } finally {
      setAddingEmployee(false);
    }
  };

  const handleJournalClick = () => {
    if (selectedEmployee?.id) router.push(`/journal`);
  };

  const filterChipSx = {
    bgcolor: theme.palette.info.main,
    color: theme.ritColors.white,
    fontWeight: 500,
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
          <Button variant="outline-orange" startIcon={<FilterListIcon />} onClick={() => setFilterDialogOpen(true)}>
            Filter
          </Button>
          {filterStatus !== "active" && (
            <Chip size="small" label={`Status: ${filterStatus}`} onDelete={() => setFilterStatus("active")} sx={filterChipSx} />
          )}
          {filterType !== "all" && (
            <Chip size="small" label={`Type: ${TYPE_LABELS[filterType]}`} onDelete={() => setFilterType("all")} sx={filterChipSx} />
          )}
          {filterSemesterGroup !== "all" && (
            <Chip
              size="small"
              label={`Group: ${filterSemesterGroup === "none" ? "No Group" : (semesterGroups.find((sg) => String(sg.id) === filterSemesterGroup)?.name ?? filterSemesterGroup)}`}
              onDelete={() => setFilterSemesterGroup("all")}
              sx={filterChipSx}
            />
          )}
        </Box>

        <Button variant="solid-orange" onClick={() => setAddOpen(true)} startIcon={<AddIcon />}>
          Add User
        </Button>
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
              <TableCell sx={{ backgroundColor: theme.palette.primary.main, color: theme.ritColors.white }}>Type</TableCell>
              <TableCell sx={{ backgroundColor: theme.palette.primary.main, color: theme.ritColors.white }}>Status</TableCell>
              <TableCell sx={{ backgroundColor: theme.palette.primary.main, color: theme.ritColors.white }} align="right">Details</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredEmployees.map((employee) => (
              <TableRow key={employee.id} sx={{ opacity: employee.hasBeenRead ? 0.6 : 1, transition: "opacity 0.3s" }}>
                <TableCell>{employee.fname}</TableCell>
                <TableCell>{employee.lname}</TableCell>
                <TableCell>{employee.email}</TableCell>
                <TableCell>{TYPE_LABELS[employee.type] || "—"}</TableCell>
                <TableCell><StatusBadge active={isActive(employee)} /></TableCell>
                <TableCell align="right">
                  <Button variant="outline-orange" onClick={() => handleOpen(employee)}>View</Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* Employee View Modal */}
      <Dialog open={!!selectedEmployee} onClose={handleClose} maxWidth="sm" fullWidth>
        {selectedEmployee && (
          <>
            <DialogTitle sx={{ bgcolor: theme.palette.primary.main, color: theme.ritColors.white, fontWeight: 600 }}>
              Employee: {selectedEmployee.fname} {selectedEmployee.lname}
            </DialogTitle>
            <DialogContent dividers>
              {editMode ? (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
                  <TextField label="First Name" value={editFields.fname}
                    onChange={(e) => setEditFields((p) => ({ ...p, fname: e.target.value }))} fullWidth />
                  <TextField label="Last Name" value={editFields.lname}
                    onChange={(e) => setEditFields((p) => ({ ...p, lname: e.target.value }))} fullWidth />
                  <TextField label="Email" type="email" value={editFields.email}
                    onChange={(e) => setEditFields((p) => ({ ...p, email: e.target.value }))} fullWidth />
                  <FormControl fullWidth>
                    <InputLabel>Type</InputLabel>
                    <Select value={editFields.type} label="Type"
                      onChange={(e) => setEditFields((p) => ({ ...p, type: e.target.value }))}>
                      <MenuItem value="" disabled>Select a Type</MenuItem>
                      <MenuItem value="prospect">Prospect</MenuItem>
                      <MenuItem value="scooployee">Scooployee</MenuItem>
                      <MenuItem value="scoopervisor">Scoopervisor</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select value={editFields.active} label="Status"
                      onChange={(e) => setEditFields((p) => ({ ...p, active: e.target.value }))}>
                      <MenuItem value="true">Active</MenuItem>
                      <MenuItem value="false">Inactive</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl fullWidth>
                    <InputLabel>Semester Group</InputLabel>
                    <Select value={editFields.semesterGroupId} label="Semester Group"
                      onChange={(e) => setEditFields((p) => ({ ...p, semesterGroupId: e.target.value }))}>
                      <MenuItem value="">No Semester Group</MenuItem>
                      {semesterGroups.map((sg) => (
                        <MenuItem key={sg.id} value={sg.id}>{sg.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              ) : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  <Typography><strong>First Name:</strong> {selectedEmployee.fname}</Typography>
                  <Typography><strong>Last Name:</strong> {selectedEmployee.lname}</Typography>
                  <Typography><strong>Email:</strong> {selectedEmployee.email}</Typography>
                  <Typography><strong>Type:</strong> {TYPE_LABELS[selectedEmployee.type] || "—"}</Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography component="span" sx={{ lineHeight: 1, display: "flex", alignItems: "center" }}>
                      <strong>Status:</strong>
                    </Typography>
                    <Box sx={{ display: "flex", alignItems: "center" }}>
                      <StatusBadge active={isActive(selectedEmployee)} />
                    </Box>
                  </Box>
                  <Typography>
                    <strong>Semester Group:</strong>{" "}
                    {selectedEmployee.semester_group && selectedEmployee.semester_group !== "null"
                      ? (semesterGroups.find((sg) => String(sg.id) === String(selectedEmployee.semester_group))?.name ?? selectedEmployee.semester_group)
                      : <span style={{ color: theme.ritColors.gray_2, fontStyle: "italic" }}>No Semester Group</span>}
                  </Typography>
                </Box>
              )}
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2, gap: 0.5 }}>
              {editMode ? (
                <>
                  <Button onClick={handleCancelEdit} variant="outlined" color="inherit" disabled={savingEdit}>
                    Cancel
                  </Button>
                  <Button variant="solid-orange" onClick={handleSaveEditClick}
                    disabled={savingEdit || !editFields.fname || !editFields.lname || !editFields.email}>
                    {savingEdit ? "Saving..." : "Save"}
                  </Button>
                </>
              ) : (
                <>
                  <Button onClick={handleClose} variant="outlined" color="inherit">Close</Button>
                  <Button variant="contained" color="info" onClick={handleJournalClick}>Journal</Button>
                  <Button variant="contained" color="error" onClick={() => setConfirmDeleteOpen(true)}>Delete</Button>
                  <Button variant="solid-orange" onClick={handleEditClick}>Edit</Button>
                </>
              )}
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
            <strong>{selectedEmployee?.fname} {selectedEmployee?.lname}</strong>? This action cannot be undone.
          </Typography>
        </DialogContent>
        <DialogActions sx={{ px: 2, py: 1.5, gap: 0.5 }}>
          <Button onClick={() => setConfirmDeleteOpen(false)} variant="outlined" color="inherit" disabled={deletingEmployee}>
            Cancel
          </Button>
          <Button onClick={handleConfirmDelete} variant="contained" color="error" disabled={deletingEmployee}>
            {deletingEmployee ? "Deleting..." : "Confirm"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Employee Modal */}
      <Dialog
        open={addOpen}
        onClose={() => { setAddOpen(false); setNewEmployee({ fname: "", lname: "", email: "", type: "prospect", semesterGroupId: "" }); }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Add Employee</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField label="First Name" value={newEmployee.fname}
              onChange={(e) => setNewEmployee((p) => ({ ...p, fname: e.target.value }))} fullWidth />
            <TextField label="Last Name" value={newEmployee.lname}
              onChange={(e) => setNewEmployee((p) => ({ ...p, lname: e.target.value }))} fullWidth />
            <TextField label="Email" type="email" value={newEmployee.email}
              onChange={(e) => setNewEmployee((p) => ({ ...p, email: e.target.value }))} fullWidth />
            <Select value={newEmployee.type}
              onChange={(e) => setNewEmployee((p) => ({ ...p, type: e.target.value }))}
              fullWidth displayEmpty>
              <MenuItem value="" disabled>Select a Type</MenuItem>
              <MenuItem value="prospect">Prospect</MenuItem>
              <MenuItem value="scooployee">Scooployee</MenuItem>
              <MenuItem value="scoopervisor">Scoopervisor</MenuItem>
            </Select>
            <Select value={newEmployee.semesterGroupId}
              onChange={(e) => setNewEmployee((p) => ({ ...p, semesterGroupId: e.target.value }))}
              fullWidth displayEmpty>
              <MenuItem value="">No Semester Group</MenuItem>
              {semesterGroups.map((sg) => (
                <MenuItem key={sg.id} value={sg.id}>{sg.name}</MenuItem>
              ))}
            </Select>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 2, py: 1.5, gap: 0.5 }}>
          <Button
            onClick={() => { setAddOpen(false); setNewEmployee({ fname: "", lname: "", email: "", type: "prospect", semesterGroupId: "" }); }}
            variant="outlined" color="inherit">
            Cancel
          </Button>
          <Button onClick={handleAddEmployee} variant="solid-orange"
            disabled={addingEmployee || !newEmployee.fname || !newEmployee.lname || !newEmployee.email}>
            {addingEmployee ? "Adding..." : "Add"}
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
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
              </Select>
            </FormControl>
            <FormControl fullWidth>
              <InputLabel>Type</InputLabel>
              <Select value={filterType} label="Type" onChange={(e) => setFilterType(e.target.value)}>
                <MenuItem value="all">All Types</MenuItem>
                <MenuItem value="prospect">Prospect</MenuItem>
                <MenuItem value="scooployee">Scooployee</MenuItem>
                <MenuItem value="scoopervisor">Scoopervisor</MenuItem>
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
            onClick={() => { setFilterStatus("active"); setFilterType("all"); setFilterSemesterGroup("all"); }}>
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
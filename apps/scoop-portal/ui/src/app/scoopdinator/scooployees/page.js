"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Header from "@components/Header";
import FilterListIcon from "@mui/icons-material/FilterList";
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

const StatusBadge = ({ active }) => (
  <Chip
    label={active ? "Active" : "Inactive"}
    size="small"
    sx={{
      fontWeight: 600,
      fontSize: "0.7rem",
      bgcolor: active ? "#e6f4ea" : "#fce8e8",
      color: active ? "#2e7d32" : "#c62828",
      border: `1px solid ${active ? "#a5d6a7" : "#ef9a9a"}`,
    }}
  />
);

const generateId = () => Math.random().toString(36).substring(2, 10) + Date.now().toString(36);

export default function ViewScooployees() {
  const router = useRouter();

  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [sortField, setSortField] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");

  const [teams, setTeams] = useState([]);
  const [semesterGroups, setSemesterGroups] = useState([]);

  // Filters
  const [filterStatus, setFilterStatus] = useState("active");
  const [filterType, setFilterType] = useState("all");
  const [filterSemesterGroup, setFilterSemesterGroup] = useState("all");

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState("");

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
    teamId: "",
    semesterGroupId: "",
    active: "true",
  });
  const [savingEdit, setSavingEdit] = useState(false);
  const [confirmEditOpen, setConfirmEditOpen] = useState(false);

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
    const fetchTeams = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/teams`);
        const data = await res.json();
        setTeams(data);
      } catch (err) {
        console.error("Failed to fetch teams:", err);
      }
    };
    fetchTeams();
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
      teamId: emp.teams && emp.teams.length > 0 ? emp.teams[0].id : "",
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

  const handleEditClick = () => {
    setEditMode(true);
  };

  const handleCancelEdit = () => {
    setEditFields({
      fname: selectedEmployee.fname,
      lname: selectedEmployee.lname,
      email: selectedEmployee.email,
      type: selectedEmployee.type || "",
      teamId: selectedEmployee.teams && selectedEmployee.teams.length > 0 ? selectedEmployee.teams[0].id : "",
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
          body: JSON.stringify({
            type: editFields.type,
            active: editFields.active,
          }),
        }
      );

      if (!res.ok) throw new Error("Failed to update employee");

      if (editFields.teamId && editFields.teamId !== (selectedEmployee.teams?.[0]?.id || "")) {
        const teamRes = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/teams/${editFields.teamId}/members`,
          {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({ userId: selectedEmployee.id }),
          }
        );
        if (!teamRes.ok) throw new Error("Failed to assign team");
      }

      const assignedTeams = editFields.teamId
        ? teams.filter((t) => t.id === editFields.teamId)
        : selectedEmployee.teams || [];

      const updatedEmployee = {
        ...selectedEmployee,
        ...editFields,
        teams: assignedTeams,
      };

      setEmployees((prev) =>
        prev.map((e) =>
          e.id === selectedEmployee.id ? { ...e, ...editFields, teams: assignedTeams } : e
        )
      );
      setSelectedEmployee(updatedEmployee);
      setEditMode(false);
      setConfirmEditOpen(false);
      setSnackbarMsg("Employee updated successfully!");
      setSnackbarOpen(true);
    } catch (err) {
      console.error(err);
      alert("Failed to update employee. Please try again.");
    } finally {
      setSavingEdit(false);
    }
  };

  const handleAddEmployee = async () => {
    const { fname, lname, email, type, semesterGroupId } = newEmployee;
    if (!fname || !lname || !email) return;

    setAddingEmployee(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: generateId(),
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
    if (selectedEmployee?.id) {
      router.push(`/journal`);
    }
  };

  return (
    <>
      <Header />
      <Typography variant="h4" sx={{ fontWeight: 600, mb: 3 }}>
        View Users
      </Typography>

      {/* Toolbar */}
      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
          gap: 2,
        }}
      >
        <Box sx={{ display: "flex", gap: 1, alignItems: "center", flexWrap: "wrap" }}>
          <Button
            variant="outlined"
            startIcon={<FilterListIcon />}
            onClick={() => setFilterDialogOpen(true)}
          >
            Filter
          </Button>
          {filterStatus !== "active" && (
            <Chip size="small" label={`Status: ${filterStatus}`} onDelete={() => setFilterStatus("active")} />
          )}
          {filterType !== "all" && (
            <Chip size="small" label={`Type: ${TYPE_LABELS[filterType]}`} onDelete={() => setFilterType("all")} />
          )}
          {filterSemesterGroup !== "all" && (
            <Chip
              size="small"
              label={`Group: ${filterSemesterGroup === "none" ? "No Group" : (semesterGroups.find((sg) => String(sg.id) === filterSemesterGroup)?.name ?? filterSemesterGroup)}`}
              onDelete={() => setFilterSemesterGroup("all")}
            />
          )}
        </Box>

        <Button variant="contained" onClick={() => setAddOpen(true)}>
          Add
        </Button>
      </Box>

      {/* Table */}
      <Paper elevation={1} square sx={{ maxHeight: 500, overflow: "auto" }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {["fname", "lname", "email"].map((field) => (
                <TableCell
                  key={field}
                  sx={{ backgroundColor: "#F76902", color: "#fff" }}
                >
                  <TableSortLabel
                    active={sortField === field}
                    direction={sortField === field ? sortOrder : "asc"}
                    onClick={() => handleSort(field)}
                    sx={{
                      color: "#fff",
                      "& .MuiTableSortLabel-icon": {
                        color: "#b35200 !important",
                      },
                    }}
                  >
                    {field === "fname" && "First Name"}
                    {field === "lname" && "Last Name"}
                    {field === "email" && "Email"}
                  </TableSortLabel>
                </TableCell>
              ))}
              <TableCell sx={{ backgroundColor: "#F76902", color: "#fff" }}>
                Type
              </TableCell>
              <TableCell sx={{ backgroundColor: "#F76902", color: "#fff" }}>
                Status
              </TableCell>
              <TableCell sx={{ backgroundColor: "#F76902", color: "#fff" }} align="right">
                Details
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredEmployees.map((employee) => (
              <TableRow
                key={employee.id}
                sx={{
                  opacity: employee.hasBeenRead ? 0.6 : 1,
                  transition: "opacity 0.3s",
                }}
              >
                <TableCell>{employee.fname}</TableCell>
                <TableCell>{employee.lname}</TableCell>
                <TableCell>{employee.email}</TableCell>
                <TableCell>{TYPE_LABELS[employee.type] || "—"}</TableCell>
                <TableCell>
                  <StatusBadge active={isActive(employee)} />
                </TableCell>
                <TableCell align="right">
                  <Button
                    variant="outline-orange"
                    onClick={() => handleOpen(employee)}
                  >
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* Employee View Modal */}
      <Dialog
        open={!!selectedEmployee}
        onClose={handleClose}
        maxWidth="sm"
        fullWidth
      >
        {selectedEmployee && (
          <>
            <DialogTitle
              sx={{ bgcolor: "#F76902", color: "#fff", fontWeight: 600 }}
            >
              Employee: {selectedEmployee.fname} {selectedEmployee.lname}
            </DialogTitle>
            <DialogContent dividers>
              {editMode ? (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
                  <TextField
                    label="First Name"
                    value={editFields.fname}
                    onChange={(e) =>
                      setEditFields((prev) => ({ ...prev, fname: e.target.value }))
                    }
                    fullWidth
                  />
                  <TextField
                    label="Last Name"
                    value={editFields.lname}
                    onChange={(e) =>
                      setEditFields((prev) => ({ ...prev, lname: e.target.value }))
                    }
                    fullWidth
                  />
                  <TextField
                    label="Email"
                    type="email"
                    value={editFields.email}
                    onChange={(e) =>
                      setEditFields((prev) => ({ ...prev, email: e.target.value }))
                    }
                    fullWidth
                  />
                  <FormControl fullWidth>
                    <InputLabel>Type</InputLabel>
                    <Select
                      value={editFields.type}
                      label="Type"
                      onChange={(e) =>
                        setEditFields((prev) => ({ ...prev, type: e.target.value }))
                      }
                    >
                      <MenuItem value="" disabled>Select a Type</MenuItem>
                      <MenuItem value="prospect">Prospect</MenuItem>
                      <MenuItem value="scooployee">Scooployee</MenuItem>
                      <MenuItem value="scoopervisor">Scoopervisor</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl fullWidth>
                    <InputLabel>Status</InputLabel>
                    <Select
                      value={editFields.active}
                      label="Status"
                      onChange={(e) =>
                        setEditFields((prev) => ({ ...prev, active: e.target.value }))
                      }
                    >
                      <MenuItem value="true">Active</MenuItem>
                      <MenuItem value="false">Inactive</MenuItem>
                    </Select>
                  </FormControl>
                  <FormControl fullWidth>
                    <InputLabel>Team</InputLabel>
                    <Select
                      value={editFields.teamId}
                      label="Team"
                      onChange={(e) =>
                        setEditFields((prev) => ({ ...prev, teamId: e.target.value }))
                      }
                    >
                      <MenuItem value="">No Team</MenuItem>
                      {teams.map((team) => (
                        <MenuItem key={team.id} value={team.id}>{team.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                  <FormControl fullWidth>
                    <InputLabel>Semester Group</InputLabel>
                    <Select
                      value={editFields.semesterGroupId}
                      label="Semester Group"
                      onChange={(e) =>
                        setEditFields((prev) => ({ ...prev, semesterGroupId: e.target.value }))
                      }
                    >
                      <MenuItem value="">No Semester Group</MenuItem>
                      {semesterGroups.map((sg) => (
                        <MenuItem key={sg.id} value={sg.id}>{sg.name}</MenuItem>
                      ))}
                    </Select>
                  </FormControl>
                </Box>
              ) : (
                <Box sx={{ display: "flex", flexDirection: "column", gap: 1 }}>
                  <Typography>
                    <strong>First Name:</strong> {selectedEmployee.fname}
                  </Typography>
                  <Typography>
                    <strong>Last Name:</strong> {selectedEmployee.lname}
                  </Typography>
                  <Typography>
                    <strong>Email:</strong> {selectedEmployee.email}
                  </Typography>
                  <Typography>
                    <strong>Type:</strong>{" "}
                    {TYPE_LABELS[selectedEmployee.type] || "—"}
                  </Typography>
                  <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                    <Typography component="span"><strong>Status:</strong></Typography>
                    <StatusBadge active={isActive(selectedEmployee)} />
                  </Box>
                  <Typography>
                    <strong>Team:</strong>{" "}
                    {selectedEmployee.teams && selectedEmployee.teams.length > 0
                      ? selectedEmployee.teams[0].name
                      : <span style={{ color: "#9e9e9e", fontStyle: "italic" }}>No Team</span>}
                  </Typography>
                  <Typography>
                    <strong>Semester Group:</strong>{" "}
                    {selectedEmployee.semester_group && selectedEmployee.semester_group !== "null"
                      ? (semesterGroups.find((sg) => String(sg.id) === String(selectedEmployee.semester_group))?.name ?? selectedEmployee.semester_group)
                      : <span style={{ color: "#9e9e9e", fontStyle: "italic" }}>No Semester Group</span>}
                  </Typography>
                </Box>
              )}
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
              {editMode ? (
                <>
                  <Button
                    variant="contained"
                    onClick={handleSaveEditClick}
                    disabled={
                      savingEdit ||
                      !editFields.fname ||
                      !editFields.lname ||
                      !editFields.email
                    }
                  >
                    {savingEdit ? "Saving..." : "Save"}
                  </Button>
                  <Button
                    onClick={handleCancelEdit}
                    variant="outlined"
                    color="inherit"
                    disabled={savingEdit}
                  >
                    Cancel
                  </Button>
                </>
              ) : (
                <>
                  <Button
                    variant="contained"
                    sx={{ bgcolor: "#84BD00", "&:hover": { bgcolor: "#6da400" } }}
                    onClick={handleJournalClick}
                  >
                    Journal
                  </Button>
                  <Button
                    variant="contained"
                    sx={{ bgcolor: "#F76902", "&:hover": { bgcolor: "#d45a00" } }}
                    onClick={handleEditClick}
                  >
                    Edit
                  </Button>
                  <Button onClick={handleClose} variant="outlined" color="inherit">
                    Close
                  </Button>
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
        <DialogActions>
          <Button onClick={() => setConfirmEditOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleConfirmEdit} variant="contained" disabled={savingEdit}>
            {savingEdit ? "Saving..." : "Yes, Save"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Employee Modal */}
      <Dialog
        open={addOpen}
        onClose={() => {
          setAddOpen(false);
          setNewEmployee({ fname: "", lname: "", email: "", type: "prospect", semesterGroupId: "" });
        }}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Add Employee</DialogTitle>
        <DialogContent>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <TextField
              label="First Name"
              value={newEmployee.fname}
              onChange={(e) =>
                setNewEmployee((prev) => ({ ...prev, fname: e.target.value }))
              }
              fullWidth
            />
            <TextField
              label="Last Name"
              value={newEmployee.lname}
              onChange={(e) =>
                setNewEmployee((prev) => ({ ...prev, lname: e.target.value }))
              }
              fullWidth
            />
            <TextField
              label="Email"
              type="email"
              value={newEmployee.email}
              onChange={(e) =>
                setNewEmployee((prev) => ({ ...prev, email: e.target.value }))
              }
              fullWidth
            />
            <Select
              value={newEmployee.type}
              onChange={(e) =>
                setNewEmployee((prev) => ({ ...prev, type: e.target.value }))
              }
              fullWidth
              displayEmpty
            >
              <MenuItem value="" disabled>Select a Type</MenuItem>
              <MenuItem value="prospect">Prospect</MenuItem>
              <MenuItem value="scooployee">Scooployee</MenuItem>
              <MenuItem value="scoopervisor">Scoopervisor</MenuItem>
            </Select>
            <Select
              value={newEmployee.semesterGroupId}
              onChange={(e) =>
                setNewEmployee((prev) => ({ ...prev, semesterGroupId: e.target.value }))
              }
              fullWidth
              displayEmpty
            >
              <MenuItem value="">No Semester Group</MenuItem>
              {semesterGroups.map((sg) => (
                <MenuItem key={sg.id} value={sg.id}>{sg.name}</MenuItem>
              ))}
            </Select>
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setAddOpen(false);
              setNewEmployee({ fname: "", lname: "", email: "", type: "prospect", semesterGroupId: "" });
            }}
            color="inherit"
          >
            Cancel
          </Button>
          <Button
            onClick={handleAddEmployee}
            variant="contained"
            disabled={
              addingEmployee ||
              !newEmployee.fname ||
              !newEmployee.lname ||
              !newEmployee.email
            }
          >
            {addingEmployee ? "Adding..." : "Add"}
          </Button>
        </DialogActions>
      </Dialog>

      {/* Filter Modal */}
      <Dialog
        open={filterDialogOpen}
        onClose={() => setFilterDialogOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle sx={{ bgcolor: "#F76902", color: "#fff", fontWeight: 600 }}>
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
        <DialogActions sx={{ px: 3, py: 2 }}>
          <Button
            variant="outlined"
            color="inherit"
            onClick={() => {
              setFilterStatus("active");
              setFilterType("all");
              setFilterSemesterGroup("all");
            }}
          >
            Reset
          </Button>
          <Button variant="contained" onClick={() => setFilterDialogOpen(false)}>
            Apply
          </Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={snackbarOpen}
        autoHideDuration={3000}
        onClose={() => setSnackbarOpen(false)}
      >
        <Alert
          onClose={() => setSnackbarOpen(false)}
          severity="success"
          sx={{ width: "100%" }}
        >
          {snackbarMsg}
        </Alert>
      </Snackbar>
    </>
  );
}
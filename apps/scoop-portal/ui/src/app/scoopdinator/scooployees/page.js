"use client";
import React, { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import Papa from "papaparse";
import Header from "@components/Header";
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
} from "@mui/material";

export default function ViewScooployees() {
  const router = useRouter();

  const [employees, setEmployees] = useState([]);
  const [selectedEmployee, setSelectedEmployee] = useState(null);
  const [filter, setFilter] = useState("all");
  const [sortField, setSortField] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");

  const [assignModalOpen, setAssignModalOpen] = useState(false);
  const [teams, setTeams] = useState([]);
  const [selectedTeam, setSelectedTeam] = useState("");
  const [confirmAssignOpen, setConfirmAssignOpen] = useState(false);

  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMsg, setSnackbarMsg] = useState("");

  const [manageOpen, setManageOpen] = useState(false);
  const [addOpen, setAddOpen] = useState(false);
  const [importFile, setImportFile] = useState(null);
  const [importing, setImporting] = useState(false);

  const [newEmployee, setNewEmployee] = useState({ fname: "", lname: "", email: "" });
  const [addingEmployee, setAddingEmployee] = useState(false);

  // Edit state
  const [editMode, setEditMode] = useState(false);
  const [editFields, setEditFields] = useState({ fname: "", lname: "", email: "", type: "" });
  const [savingEdit, setSavingEdit] = useState(false);
  const [confirmEditOpen, setConfirmEditOpen] = useState(false);

  const OPTIONS = ["all", "active", "inactive"];

  useEffect(() => {
    const fetchEmployees = async () => {
      try {
        const res = await fetch(
          `${process.env.NEXT_PUBLIC_API_URL}/api/users/employees`
        );
        const data = await res.json();
        setEmployees(data);
      } catch (err) {
        console.error("Failed to fetch employees:", err);
      }
    };
    fetchEmployees();
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

  const handleOpen = (emp) => {
    setSelectedEmployee({ ...emp, hasBeenRead: true });
    setEditFields({ fname: emp.fname, lname: emp.lname, email: emp.email, type: emp.type || "" });
    setEditMode(false);
    setEmployees((prev) =>
      prev.map((e) => (e.id === emp.id ? { ...e, hasBeenRead: true } : e))
    );
  };

  const handleClose = () => {
    setSelectedEmployee(null);
    setAssignModalOpen(false);
    setConfirmAssignOpen(false);
    setSelectedTeam("");
    setEditMode(false);
    setConfirmEditOpen(false);
  };

  const setStatus = (employee) => {
    return employee.project === "null" ? "inactive" : "active";
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

  const filteredEmployees =
    filter === "all"
      ? sortedEmployees
      : sortedEmployees.filter((employee) => setStatus(employee) === filter);

  const handleAssignClick = () => {
    setAssignModalOpen(true);
  };

  const handleTeamSelect = (e) => {
    setSelectedTeam(e.target.value);
  };

  const handleConfirmAssignOpen = () => {
    if (!selectedTeam) return;
    setConfirmAssignOpen(true);
  };

  const handleConfirmAssign = async () => {
    try {
      const res = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/teams/${selectedTeam}/members`,
        {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ userId: selectedEmployee.id }),
        }
      );

      if (!res.ok) {
        throw new Error("Failed to assign team");
      }

      setEmployees((prev) =>
        prev.map((e) =>
          e.id === selectedEmployee.id
            ? {
                ...e,
                teams: teams.filter((t) => t.id === selectedTeam),
              }
            : e
        )
      );

      setSelectedEmployee((prev) => ({
        ...prev,
        teams: teams.filter((t) => t.id === selectedTeam),
      }));

      setSnackbarMsg("Employee successfully assigned to team!");
      setSnackbarOpen(true);
      setConfirmAssignOpen(false);
      setAssignModalOpen(false);
    } catch (error) {
      console.error(error);
      alert("Error assigning team, please try again.");
    }
  };

  const handleEditClick = () => {
    setEditMode(true);
  };

  const handleCancelEdit = () => {
    setEditFields({
      fname: selectedEmployee.fname,
      lname: selectedEmployee.lname,
      email: selectedEmployee.email,
      type: selectedEmployee.type || "",
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
          body: JSON.stringify({ type: editFields.type }),
        }
      );

      if (!res.ok) throw new Error("Failed to update employee");

      const updatedEmployee = {
        ...selectedEmployee,
        ...editFields,
      };

      setEmployees((prev) =>
        prev.map((e) => (e.id === selectedEmployee.id ? { ...e, ...editFields } : e))
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

  const downloadCSV = () => {
    if (employees.length === 0) return;

    const csvData = employees.map(({ fname, lname, email, teams }) => ({
      fname,
      lname,
      email,
      team: teams && teams.length > 0 ? teams[0].name : "",
    }));

    const csv = Papa.unparse(csvData);
    const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.setAttribute("download", "employees.csv");
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
  };

  const handleImportCSV = () => {
    if (!importFile) return;

    setImporting(true);

    Papa.parse(importFile, {
      header: true,
      skipEmptyLines: true,
      complete: async (results) => {
        const employeesToAdd = results.data;

        try {
          for (const emp of employeesToAdd) {
            const payload = {
              fname: emp.fname || "",
              lname: emp.lname || "",
              email: emp.email || "",
              semester_group: emp.semesterGroup || "",
              project: emp.project || "",
              active: emp.active !== undefined ? String(emp.active) : "true",
              type: emp.type || "",
              last_login: emp.last_login || "",
              prev_login: emp.prev_login || "",
            };

            await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users`, {
              method: "POST",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(payload),
            });
          }

          setSnackbarMsg("Employees imported successfully!");
          setSnackbarOpen(true);
          setImportFile(null);
          setManageOpen(false);

          const res = await fetch(
            `${process.env.NEXT_PUBLIC_API_URL}/api/users/employees`
          );
          const data = await res.json();
          setEmployees(data);
        } catch (err) {
          console.error("Import error:", err);
          alert("Failed to import CSV. Please check the file format.");
        } finally {
          setImporting(false);
        }
      },
      error: (err) => {
        console.error("CSV parse error:", err);
        setImporting(false);
        alert("Failed to parse CSV.");
      },
    });
  };

  const handleAddEmployee = async () => {
    const { fname, lname, email } = newEmployee;
    if (!fname || !lname || !email) return;

    setAddingEmployee(true);
    try {
      const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fname,
          lname,
          email,
          semester_group: "",
          project: "null",
          active: "true",
          type: "scooployee",
          last_login: "",
          prev_login: "",
        }),
      });

      if (!res.ok) throw new Error("Failed to add employee");

      const refreshRes = await fetch(
        `${process.env.NEXT_PUBLIC_API_URL}/api/users/employees`
      );
      const data = await refreshRes.json();
      setEmployees(data);

      setSnackbarMsg("Employee added successfully!");
      setSnackbarOpen(true);
      setNewEmployee({ fname: "", lname: "", email: "" });
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
        View Scooployees
      </Typography>

      <Box
        sx={{
          display: "flex",
          justifyContent: "space-between",
          alignItems: "center",
          mb: 2,
        }}
      >
        <Select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          sx={{
            borderRadius: 2,
            minWidth: 200,
            boxShadow: 1,
          }}
        >
          {OPTIONS.map((option) => (
            <MenuItem key={option} value={option}>
              {option.charAt(0).toUpperCase() + option.slice(1)}
            </MenuItem>
          ))}
        </Select>
        <Box>
          <Button
            variant="contained"
            onClick={() => setAddOpen(true)}
            sx={{ mr: "10px" }}
          >
            Add
          </Button>
          <Button
            variant="contained"
            onClick={() => setManageOpen(true)}
            sx={{ mr: "10px" }}
          >
            Manage
          </Button>
        </Box>
      </Box>

      <Paper elevation={1} square sx={{ maxHeight: 500, overflow: "auto" }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {["fname", "lname", "email", "project"].map((field) => (
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
                    {field === "project" && "Team"}
                  </TableSortLabel>
                </TableCell>
              ))}
              <TableCell
                sx={{ backgroundColor: "#F76902", color: "#fff" }}
                align="right"
              >
                Actions
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
                <TableCell>
                  {employee.teams && employee.teams.length > 0
                    ? employee.teams[0].name
                    : "Not Assigned"}
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
                  <Select
                    value={editFields.type}
                    onChange={(e) =>
                      setEditFields((prev) => ({ ...prev, type: e.target.value }))
                    }
                    fullWidth
                    displayEmpty
                  >
                    <MenuItem value="" disabled>
                      Select a Type
                    </MenuItem>
                    <MenuItem value="scooployee">Scooployee</MenuItem>
                    <MenuItem value="scoopervisor">Scoopervisor</MenuItem>
                    <MenuItem value="scoopdinator">Scoopdinator</MenuItem>
                  </Select>
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
                    <strong>Semester Group:</strong>{" "}
                    {selectedEmployee.semesterGroup}
                  </Typography>
                  <Typography>
                    <strong>Team:</strong>{" "}
                    {selectedEmployee.teams && selectedEmployee.teams.length > 0
                      ? selectedEmployee.teams[0].name
                      : "Not Assigned"}
                  </Typography>
                  <Typography>
                    <strong>Type:</strong> {selectedEmployee.type || "—"}
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
                    sx={{ bgcolor: "#007bff", "&:hover": { bgcolor: "#0066cc" } }}
                    onClick={handleAssignClick}
                  >
                    Assign
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
      <Dialog
        open={confirmEditOpen}
        onClose={() => setConfirmEditOpen(false)}
      >
        <DialogTitle>Confirm Changes</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to save changes to{" "}
            <strong>
              {editFields.fname} {editFields.lname}
            </strong>
            ?
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

      {/* Assign Team Modal */}
      <Dialog
        open={assignModalOpen}
        onClose={() => setAssignModalOpen(false)}
        maxWidth="xs"
        fullWidth
      >
        <DialogTitle>Assign Team</DialogTitle>
        <DialogContent>
          <Select
            value={selectedTeam}
            onChange={handleTeamSelect}
            fullWidth
            displayEmpty
          >
            <MenuItem value="" disabled>
              Select a Team
            </MenuItem>
            {teams.map((team) => (
              <MenuItem key={team.id} value={team.id}>
                {team.name}
              </MenuItem>
            ))}
          </Select>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setAssignModalOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button
            onClick={handleConfirmAssignOpen}
            disabled={!selectedTeam}
            variant="contained"
          >
            Confirm
          </Button>
        </DialogActions>
      </Dialog>

      {/* Confirm Assign Dialog */}
      <Dialog
        open={confirmAssignOpen}
        onClose={() => setConfirmAssignOpen(false)}
      >
        <DialogTitle>Confirm Assignment</DialogTitle>
        <DialogContent>
          <Typography>
            Are you sure you want to assign{" "}
            <strong>
              {selectedEmployee?.fname} {selectedEmployee?.lname}
            </strong>{" "}
            to the team{" "}
            <strong>{teams.find((t) => t.id === selectedTeam)?.name}</strong>?
          </Typography>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setConfirmAssignOpen(false)} color="inherit">
            Cancel
          </Button>
          <Button onClick={handleConfirmAssign} variant="contained">
            Yes, Assign
          </Button>
        </DialogActions>
      </Dialog>

      {/* Add Employee Modal */}
      <Dialog
        open={addOpen}
        onClose={() => {
          setAddOpen(false);
          setNewEmployee({ fname: "", lname: "", email: "" });
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
          </Box>
        </DialogContent>
        <DialogActions>
          <Button
            onClick={() => {
              setAddOpen(false);
              setNewEmployee({ fname: "", lname: "", email: "" });
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

      {/* Manage Modal */}
      <Dialog
        open={manageOpen}
        onClose={() => setManageOpen(false)}
        maxWidth="sm"
        fullWidth
      >
        <DialogTitle>Manage Employees</DialogTitle>
        <DialogContent>
          <Box sx={{ mb: 2 }}>
            <Button variant="contained" onClick={downloadCSV} sx={{ mr: 2 }}>
              Export CSV
            </Button>
            <Button variant="contained" component="label" disabled={importing}>
              Import CSV
              <input
                type="file"
                accept=".csv"
                hidden
                onChange={(e) => setImportFile(e.target.files?.[0] || null)}
              />
            </Button>
            {importFile && (
              <Button
                variant="contained"
                color="success"
                onClick={handleImportCSV}
                disabled={importing}
                sx={{ ml: 2 }}
              >
                {importing ? "Importing..." : "Start Import"}
              </Button>
            )}
          </Box>
        </DialogContent>
        <DialogActions>
          <Button onClick={() => setManageOpen(false)} color="inherit">
            Close
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
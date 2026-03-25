"use client";
import React, { useState, useEffect } from "react";
import Header from "@components/Header";
import StatusBadge from "@components/StatusBadge";
import SortableTableHeader from "@components/SortableTableHeader";
import { useTheme } from "@mui/material/styles";
import {
  Typography, Paper, Table, TableHead, TableCell, TableRow, TableBody,
  Box, Select, MenuItem, TextField, FormControl,
  InputLabel, InputAdornment, Dialog, DialogTitle, DialogContent, DialogActions, Button,
  TableSortLabel,
  Chip,
} from "@mui/material";
import SearchIcon from "@mui/icons-material/Search";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";

const isActive = (user) => {
  if (user.active !== undefined && user.active !== null) {
    return user.active === true || user.active === "true" || user.active === 1 || user.active === "1";
  }
  if (user.project === "null") return false;
  return true;
};

export default function ViewScooployees() {
  const theme = useTheme();
  const [users, setUsers] = useState([]);
  const [semesterGroups, setSemesterGroups] = useState([]);
  const [sortField, setSortField] = useState(null);
  const [sortOrder, setSortOrder] = useState("asc");
  const [filterStatus, setFilterStatus] = useState("all");
  const [filterSemesterGroup, setFilterSemesterGroup] = useState("all");
  const [searchQuery, setSearchQuery] = useState("");
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);

  useEffect(() => {
    const fetchUsers = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/users`);
        const data = await res.json();
        setUsers(data.filter((u) => u.type === "scooployee"));
      } catch (err) {
        console.error("Failed to fetch users:", err);
      }
    };
    fetchUsers();
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

  const resolveGroupName = (user) => {
    if (!user.semester_group || user.semester_group === "null") return null;
    return semesterGroups.find((sg) => String(sg.id) === String(user.semester_group))?.name ?? user.semester_group;
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
    } else if (sortField === "active") {
      aVal = isActive(a) ? "active" : "inactive";
      bVal = isActive(b) ? "active" : "inactive";
    } else {
      aVal = a[sortField]?.toString().toLowerCase() ?? "";
      bVal = b[sortField]?.toString().toLowerCase() ?? "";
    }
    if (aVal < bVal) return sortOrder === "asc" ? -1 : 1;
    if (aVal > bVal) return sortOrder === "asc" ? 1 : -1;
    return 0;
  });

  const filteredUsers = sortedUsers.filter((user) => {
    if (filterStatus === "active" && !isActive(user)) return false;
    if (filterStatus === "inactive" && isActive(user)) return false;
    if (filterSemesterGroup !== "all") {
      const sg = user.semester_group && user.semester_group !== "null" ? user.semester_group : null;
      if (!sg) {
        if (filterSemesterGroup !== "none") return false;
      } else {
        const matched = String(sg) === filterSemesterGroup ||
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
        groupName.includes(q);
      if (!matched) return false;
    }
    return true;
  });

  const filterChipSx = {
    bgcolor: theme.palette.info.main, color: theme.ritColors.white,
    fontWeight: 400, fontSize: "0.85rem", px: 0.5,
    "& .MuiChip-deleteIcon": { color: "rgba(255,255,255,0.7)", "&:hover": { color: theme.ritColors.white } },
  };

  return (
    <>
      <Header />
      <Typography variant="h4" sx={{ fontWeight: 600, mb: 3 }}>View Scooployees</Typography>

      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, gap: 2 }}>
        <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", flexWrap: "wrap" }}>
          <Button variant="outline-orange" startIcon={<FilterAltOutlinedIcon />} onClick={() => setFilterDialogOpen(true)}>
            Filter
          </Button>
          {filterStatus !== "all" && (
            <Chip size="medium" label={`Status: ${filterStatus}`} onDelete={() => setFilterStatus("all")} sx={filterChipSx} />
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
        <TextField
          size="small" placeholder="Search..." value={searchQuery}
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
      </Box>

      <Paper elevation={1} square sx={{ maxHeight: 500, overflow: "auto" }}>
        <Table stickyHeader>
          <TableHead>
            <TableRow>
              {["fname", "lname", "email"].map((field) => (
                <TableCell key={field} sx={{ backgroundColor: theme.palette.primary.main, color: theme.ritColors.white }}>
                  <TableSortLabel
                    active={sortField === field} direction={sortField === field ? sortOrder : "asc"}
                    onClick={() => handleSort(field)}
                    sx={{ color: theme.ritColors.white, "& .MuiTableSortLabel-icon": { color: `${theme.ritColors.white} !important` } }}
                  >
                    {field === "fname" && "First Name"}
                    {field === "lname" && "Last Name"}
                    {field === "email" && "Email"}
                  </TableSortLabel>
                </TableCell>
              ))}
              <TableCell sx={{ backgroundColor: theme.palette.primary.main, color: theme.ritColors.white }}>
                <TableSortLabel
                  active={sortField === "semester_group"} direction={sortField === "semester_group" ? sortOrder : "asc"}
                  onClick={() => handleSort("semester_group")}
                  sx={{ color: theme.ritColors.white, "& .MuiTableSortLabel-icon": { color: `${theme.ritColors.white} !important` } }}
                >
                  Semester Group
                </TableSortLabel>
              </TableCell>
              <TableCell sx={{ backgroundColor: theme.palette.primary.main, color: theme.ritColors.white }}>
                <TableSortLabel
                  active={sortField === "active"} direction={sortField === "active" ? sortOrder : "asc"}
                  onClick={() => handleSort("active")}
                  sx={{ color: theme.ritColors.white, "& .MuiTableSortLabel-icon": { color: `${theme.ritColors.white} !important` } }}
                >
                  Status
                </TableSortLabel>
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredUsers.map((user) => (
              <TableRow key={user.id}>
                <TableCell>{user.fname}</TableCell>
                <TableCell>{user.lname}</TableCell>
                <TableCell>{user.email}</TableCell>
                <TableCell>
                  {resolveGroupName(user) ?? <span style={{ color: theme.ritColors.gray_2, fontStyle: "italic" }}>No Group</span>}
                </TableCell>
                <TableCell><StatusBadge value={isActive(user) ? "active" : "inactive"} type="active" /></TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      <Dialog open={filterDialogOpen} onClose={() => setFilterDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ bgcolor: theme.palette.primary.main, color: theme.ritColors.white, fontWeight: 600 }}>
          Filter Scooployees
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select value={filterStatus} label="Status" onChange={(e) => setFilterStatus(e.target.value)}>
                <MenuItem value="all">All</MenuItem>
                <MenuItem value="active">Active</MenuItem>
                <MenuItem value="inactive">Inactive</MenuItem>
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
          <Button variant="outlined" color="inherit" onClick={() => { setFilterStatus("all"); setFilterSemesterGroup("all"); }}>
            Reset
          </Button>
          <Button variant="solid-orange" onClick={() => setFilterDialogOpen(false)}>Apply</Button>
        </DialogActions>
      </Dialog>
    </>
  );
}
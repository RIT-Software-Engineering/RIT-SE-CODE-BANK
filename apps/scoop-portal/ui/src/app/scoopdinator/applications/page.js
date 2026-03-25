"use client";
import React, { useState, useEffect, useMemo } from "react";
import {
  Box,
  Button,
  FormControl,
  InputAdornment,
  InputLabel,
  MenuItem,
  Paper,
  Select,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TextField,
  ToggleButton,
  ToggleButtonGroup,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useRouter } from "next/navigation";
import IconButton from "@mui/material/IconButton";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import TableRowsIcon from "@mui/icons-material/TableRows";
import ViewKanbanIcon from "@mui/icons-material/ViewKanban";
import SearchIcon from "@mui/icons-material/Search";

import Header from "@components/Header";
import StatusBadge from "@components/StatusBadge";
import SortableTableHeader from "@components/SortableTableHeader";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";
import { getComparator } from "@utils/sortingUtils";

/**
 * The statuses to filter applications by.
 */
const STATUSES = ["ALL", "ACCEPTED", "REJECTED", "PENDING"];

export default function SupervisorApplicationsPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  /**
   * The list of applications to be displayed on the page.
   */
  const [applications, setApplications] = useState([]);
  const [filter, setFilter] = useState("ALL");
  const [view, setView] = useState("table"); // "table" | "kanban"
  const [order, setOrder] = useState("desc");
  const [orderBy, setOrderBy] = useState("createdAt");
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);
  const [dateFrom, setDateFrom] = useState("");
  const [dateTo, setDateTo] = useState("");
  const [searchQuery, setSearchQuery] = useState("");

  const router = useRouter();

  useEffect(() => {
    const fetchApps = async () => {
      try {
        const res = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/application`);
        const data = await res.json();
        setApplications(data);
      } catch (err) {
        console.error("Failed to fetch applications:", err);
      }
    };
    fetchApps();
  }, []);

  /**
   * Handles the logic for opening a selected application.
   *
   * This function marks the application as read locally and navigates
   * to the application detail page.
   *
   * @param {*} app - The application that's been selected to be opened.
   * @returns {void}
   */
  const handleOpen = (app) => {
    setApplications((prev) =>
      prev.map((a) => (a.id === app.id ? { ...a, hasBeenRead: true } : a))
    );
    router.push(`/scoopdinator/applications/${app.id}`);
  };

  /**
   *
   * @param {*} data
   * @returns {Response}
   */
  async function postNewUsers(data) {
    try {
      const response = await fetch(
        process.env.NEXT_PUBLIC_API_URL + "/api/users",
        {
          method: "POST",
          body: JSON.stringify(data),
          headers: { "Content-Type": "application/json" },
        }
      );
      console.log("Submitting users with data:", data);
      return response;
    } catch (error) {
      console.error("Error submitting user:", error);
    }
  }

  /**
   * Temporary data for user creation
   */
  const tempData = {
    semester_group: "default",
    project: "default",
    active: "default",
    last_login: "default",
    prev_login: "default",
  };

  /**
   * Creates a new user object from the application data.
   *
   * This function formats the application data into a user object that can be
   * used to create a new user in the database. It extracts relevant fields
   * from the application and sets default values for fields that are not
   * provided.
   *
   * @param {*} app - The application providing information on the new user to create.
   * @returns {User} The new user created from the application.
   */
  const createUserFromApp = (app) => {
    return {
      fname: app.firstName,
      lname: app.lastName,
      email: app.ritEmail,
      type: "scooployee",
      semester_group: tempData.semester_group,
      project: tempData.project,
      active: tempData.active,
      last_login: tempData.last_login,
      prev_login: tempData.prev_login,
    };
  };

  /**
   * Handles the logic to submit accepted applicants as new users into the database.
   *
   * @returns {void}
   */
  const handleSubmit = () => {
    const acceptedApps = applications.filter((app) => app.status === "ACCEPTED");
    for (let app of acceptedApps) {
      let newUser = createUserFromApp(app);
      console.log("Submitting user:", newUser);
      postNewUsers(newUser);
    }
  };

  const handleBack = () => router.back();

  const handleSort = (column) => {
    if (orderBy === column) {
      setOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setOrderBy(column);
      setOrder("asc");
    }
  };

  const filteredApps = useMemo(() => {
    const filtered = applications.filter((app) => {
      if (filter !== "ALL" && app.status !== filter) return false;
      if (dateFrom && new Date(app.createdAt) < new Date(dateFrom)) return false;
      if (dateTo && new Date(app.createdAt) > new Date(dateTo + "T23:59:59")) return false;
      if (searchQuery.trim()) {
        const q = searchQuery.trim().toLowerCase();
        const matched =
          app.firstName?.toLowerCase().includes(q) ||
          app.lastName?.toLowerCase().includes(q) ||
          app.ritEmail?.toLowerCase().includes(q);
        if (!matched) return false;
      }
      return true;
    });
    return [...filtered].sort(getComparator(order, orderBy));
  }, [applications, filter, dateFrom, dateTo, searchQuery, order, orderBy]);

  // Theme-aware toggle button styles — visible in both light and dark
  const toggleSx = {
    border: `1px solid ${isDark ? theme.palette.grey[600] : theme.palette.grey[400]}`,
    color: isDark ? theme.palette.grey[300] : theme.palette.grey[700],
    "&.Mui-selected": {
      backgroundColor: theme.palette.primary.main,
      color: "#fff",
      borderColor: theme.palette.primary.main,
      "&:hover": { backgroundColor: theme.palette.primary.main },
    },
    "&:hover": {
      backgroundColor: isDark ? "rgba(247,105,2,0.15)" : "rgba(247,105,2,0.08)",
    },
  };

  // Date picker calendar icon — theme-aware via text color
  const datePickerSx = {
    "& input[type='date']::-webkit-calendar-picker-indicator": {
      filter: isDark ? "invert(1)" : "none",
      cursor: "pointer",
    },
  };

  const columns = [
    { id: "firstName", label: "First Name" },
    { id: "lastName", label: "Last Name" },
    { id: "ritEmail", label: "Email" },
    { id: "createdAt", label: "Submitted" },
    { id: "status", label: "Status" },
  ];

  // ── View Components ──────────────────────────────────────────

  const TableView = () => (
    <Paper elevation={1} square sx={{ maxHeight: 500, overflow: "auto" }}>
      <Table stickyHeader>
        <TableHead>
          <TableRow>
            {columns.map((col) => (
              <SortableTableHeader
                key={col.id}
                id={col.id}
                label={col.label}
                isActive={orderBy === col.id}
                sortDirection={order}
                onSort={handleSort}
              />
            ))}
            <TableCell sx={{ backgroundColor: theme.palette.primary.main, color: theme.ritColors.white }} align="right">Options</TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {filteredApps.map((app) => (
            <TableRow
              key={app.id}
              sx={{
                opacity: app.hasBeenRead ? 0.6 : 1,
                transition: "opacity 0.3s",
              }}
            >
              <TableCell>{app.firstName}</TableCell>
              <TableCell>{app.lastName}</TableCell>
              <TableCell>{app.ritEmail}</TableCell>
              <TableCell>
                {new Date(app.createdAt).toLocaleDateString(undefined, {
                  year: "numeric", month: "long", day: "numeric",
                })}
              </TableCell>
              <TableCell>
                <StatusBadge value={app.status} type="application" />
              </TableCell>
              <TableCell align="right">
                <Button variant="outline-orange" onClick={() => handleOpen(app)}>
                  View
                </Button>
              </TableCell>
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </Paper>
  );

  const KanbanView = () => {
    const kanbanColumns = [
      { label: "Pending", key: "PENDING", color: theme.palette.grey[500], defaultOrder: "desc" },
      { label: "Accepted", key: "ACCEPTED", color: theme.palette.success.main, defaultOrder: "desc" },
      { label: "Rejected", key: "REJECTED", color: theme.palette.error.main, defaultOrder: "desc" },
    ];

    // Per-column sort state: { [columnKey]: { field: "createdAt"|"firstName", order: "asc"|"desc" } }
    const [colSort, setColSort] = useState(() =>
      Object.fromEntries(
        kanbanColumns.map(({ key, defaultOrder }) => [
          key,
          { field: "createdAt", order: defaultOrder },
        ])
      )
    );

    const toggleColSort = (key, field) => {
      setColSort((prev) => {
        const current = prev[key];
        const newOrder =
          current.field === field
            ? current.order === "asc" ? "desc" : "asc"
            : "asc";
        return { ...prev, [key]: { field, order: newOrder } };
      });
    };

    const columnApps = (key) => {
      const apps = filteredApps.filter((a) =>
        key === "PENDING" ? !a.status || a.status === "PENDING" : a.status === key
      );
      const { field, order } = colSort[key];
      return [...apps].sort((a, b) => {
        const aVal = field === "createdAt" ? new Date(a[field]) : (a[field] ?? "");
        const bVal = field === "createdAt" ? new Date(b[field]) : (b[field] ?? "");
        if (aVal < bVal) return order === "asc" ? -1 : 1;
        if (aVal > bVal) return order === "asc" ? 1 : -1;
        return 0;
      });
    };

    const SortBtn = ({ colKey, field, label, color }) => {
      const { field: activeField, order } = colSort[colKey];
      const isActive = activeField === field;
      return (
        <TableSortLabel
          active={isActive}
          direction={isActive ? order : "asc"}
          onClick={() => toggleColSort(colKey, field)}
          sx={{
            fontSize: "0.75rem",
            color: `${color} !important`,
            "& .MuiTableSortLabel-icon": { color: `${color} !important` },
          }}
        >
          {label}
        </TableSortLabel>
      );
    };

    return (
      <Box sx={{ display: "flex", gap: 2, alignItems: "flex-start", overflowX: "auto", pb: 1 }}>
        {kanbanColumns.map(({ label, key, color }) => {
          const apps = columnApps(key);
          return (
            <Box key={key} sx={{ flex: 1, minWidth: 260 }}>
              {/* Column header */}
              <Paper
                elevation={1}
                square
                sx={{
                  px: 2,
                  py: 1,
                  mb: 0,
                  backgroundColor: color,
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                }}
              >
                <Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
                  <Typography variant="subtitle1" fontWeight="bold" sx={{ color: theme.ritColors.white }}>
                    {label}
                  </Typography>
                  {/* Circle badge */}
                  <Box
                    sx={{
                      width: 22,
                      height: 22,
                      borderRadius: "50%",
                      bgcolor: "rgba(255,255,255,0.25)",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                    }}
                  >
                    <Typography variant="caption" sx={{ color: theme.ritColors.white, fontWeight: 700, lineHeight: 1 }}>
                      {apps.length}
                    </Typography>
                  </Box>
                </Box>
                {/* Sort controls */}
                <Box sx={{ display: "flex", gap: 1.5 }}>
                  <SortBtn colKey={key} field="createdAt" label="Submitted" color={theme.ritColors.white} />
                  <SortBtn colKey={key} field="firstName" label="Name" color={theme.ritColors.white} />
                </Box>
              </Paper>

              <Paper elevation={1} square sx={{ height: 452, overflow: "auto" }}>
                {apps.length === 0 ? (
                  <Box sx={{ height: "100%", display: "flex", alignItems: "center", justifyContent: "center" }}>
                    <Typography variant="body2" color="text.secondary" fontStyle="italic">
                      No applications
                    </Typography>
                  </Box>
                ) : (
                  apps.map((app, i) => (
                    <Box
                      key={app.id}
                      sx={{
                        px: 2,
                        py: 1.5,
                        opacity: app.hasBeenRead ? 0.6 : 1,
                        transition: "opacity 0.3s",
                        borderTop: i === 0 ? "none" : `1px solid ${theme.palette.divider}`,
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "space-between",
                        "&:hover": { backgroundColor: theme.palette.action.hover },
                      }}
                    >
                      <Box>
                        <Typography variant="body2" fontWeight={600}>
                          {app.firstName} {app.lastName}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {app.ritEmail}
                        </Typography>
                        <Typography variant="body2" color="text.secondary">
                          {new Date(app.createdAt).toLocaleDateString(undefined, { month: "short", day: "numeric", year: "numeric" })}
                        </Typography>
                      </Box>
                      <Button size="small" variant="outline-orange" onClick={() => handleOpen(app)}>
                        View
                      </Button>
                    </Box>
                  ))
                )}
              </Paper>
            </Box>
          );
        })}
      </Box>
    );
  };

  // ── Render ────────────────────────────────────────────────────

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
    <Box>
      <Header />
      <IconButton onClick={handleBack} aria-label="back">
        <ArrowBackIcon />
      </IconButton>
      <Typography variant="h4" sx={{ fontWeight: 600, mb: 3 }}>
        Review Applications
      </Typography>

      {/* Toolbar */}
      <Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2, gap: 2 }}>
        <Box sx={{ display: "flex", gap: 1.5, alignItems: "center", flexWrap: "wrap" }}>
          <Button variant="outline-orange" startIcon={<FilterAltOutlinedIcon />} onClick={() => setFilterDialogOpen(true)}>
            Filter
          </Button>
          {filter !== "ALL" && (
            <Chip
              size="medium"
              label={`Status: ${filter.charAt(0).toUpperCase() + filter.slice(1).toLowerCase()}`}
              onDelete={() => setFilter("ALL")}
              sx={filterChipSx}
            />
          )}
          {(dateFrom || dateTo) && (
            <Chip
              size="medium"
              label={`Submitted: ${dateFrom || "…"} → ${dateTo || "…"}`}
              onDelete={() => { setDateFrom(""); setDateTo(""); }}
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
          <ToggleButtonGroup
            value={view}
            exclusive
            onChange={(_, val) => val && setView(val)}
            size="small"
          >
            <ToggleButton value="table" aria-label="table view" sx={toggleSx}>
              <TableRowsIcon fontSize="small" />
            </ToggleButton>
            <ToggleButton value="kanban" aria-label="kanban view" sx={toggleSx}>
              <ViewKanbanIcon fontSize="small" />
            </ToggleButton>
          </ToggleButtonGroup>
        </Box>
      </Box>

      {view === "table" && <TableView />}
      {view === "kanban" && <KanbanView />}

      {/* Filter Dialog */}
      <Dialog open={filterDialogOpen} onClose={() => setFilterDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ bgcolor: theme.palette.primary.main, color: theme.ritColors.white, fontWeight: 600 }}>
          Filter Applications
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select
                value={filter}
                label="Status"
                onChange={(e) => setFilter(e.target.value)}
              >
                {STATUSES.map((s) => (
                  <MenuItem key={s} value={s}>
                    {s === "ALL" ? "All" : s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
            <TextField
              label="Submitted From"
              type="date"
              value={dateFrom}
              onChange={(e) => setDateFrom(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
              inputProps={{ max: dateTo || undefined }}
              sx={datePickerSx}
            />
            <TextField
              label="Submitted To"
              type="date"
              value={dateTo}
              onChange={(e) => setDateTo(e.target.value)}
              fullWidth
              InputLabelProps={{ shrink: true }}
              inputProps={{ min: dateFrom || undefined }}
              sx={datePickerSx}
            />
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 2, py: 1.5, gap: 0.5 }}>
          <Button variant="outlined" color="inherit" onClick={() => { setFilter("ALL"); setDateFrom(""); setDateTo(""); }}>Reset</Button>
          <Button variant="solid-orange" onClick={() => setFilterDialogOpen(false)}>Apply</Button>
        </DialogActions>
      </Dialog>
    </Box>
  );
}
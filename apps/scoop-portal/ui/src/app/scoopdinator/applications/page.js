"use client";
import React, { useState, useEffect, useMemo } from "react";
import {
  Alert,
  Box,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogActions,
  DialogContent,
  MenuItem,
  Paper,
  Select,
  Snackbar,
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableRow,
  TableSortLabel,
  Chip,
  ToggleButton,
  ToggleButtonGroup,
  FormControl,
  InputLabel,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { useRouter } from "next/navigation";
import IconButton from "@mui/material/IconButton";
import ArrowBackIcon from "@mui/icons-material/ArrowBack";
import TableRowsIcon from "@mui/icons-material/TableRows";
import ViewKanbanIcon from "@mui/icons-material/ViewKanban";

import Header from "@components/Header";
import FilterAltOutlinedIcon from "@mui/icons-material/FilterAltOutlined";

/**
 * The statuses to filter applications by.
 */
const STATUSES = ["ALL", "ACCEPTED", "REJECTED", "UNPROCESSED"];

const STATUS_COLORS = {
  ACCEPTED: "success",
  REJECTED: "error",
  UNPROCESSED: "default",
};

const StatusBadge = ({ status }) => {
  const theme = useTheme();
  const label = status
    ? status.charAt(0).toUpperCase() + status.slice(1).toLowerCase()
    : "Unprocessed";
  const color = STATUS_COLORS[status] ?? "default";
  const bgColor =
    color === "success"
      ? theme.palette.success.main
      : color === "error"
      ? theme.palette.error.main
      : theme.palette.grey[500];
  return (
    <Chip
      label={label}
      size="medium"
      sx={{
        fontWeight: 400,
        fontSize: "0.85rem",
        px: 1,
        bgcolor: bgColor,
        color: theme.ritColors.white,
        border: "none",
      }}
    />
  );
};

function descendingComparator(a, b, orderBy) {
  const aVal = orderBy === "createdAt" ? new Date(a[orderBy]) : (a[orderBy] ?? "");
  const bVal = orderBy === "createdAt" ? new Date(b[orderBy]) : (b[orderBy] ?? "");
  if (bVal < aVal) return -1;
  if (bVal > aVal) return 1;
  return 0;
}

function getComparator(order, orderBy) {
  return order === "desc"
    ? (a, b) => descendingComparator(a, b, orderBy)
    : (a, b) => -descendingComparator(a, b, orderBy);
}

export default function SupervisorApplicationsPage() {
  const theme = useTheme();
  const isDark = theme.palette.mode === "dark";

  /**
   * The list of applications to be displayed on the page.
   */
  const [applications, setApplications] = useState([]);
  const [status, setStatus] = useState("");
  const [selectedApp, setSelectedApp] = useState(null);
  const [filter, setFilter] = useState("ALL");
  const [view, setView] = useState("table"); // "table" | "kanban"
  const [order, setOrder] = useState("desc");
  const [orderBy, setOrderBy] = useState("createdAt");
  const [filterDialogOpen, setFilterDialogOpen] = useState(false);

  const [notification, setNotification] = useState({
    open: false,
    message: "",
    severity: "success",
  });
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

  //For testing. Runs when setSelectApp and handleOpen are called
  useEffect(() => {
    if (selectedApp) console.log("opening app:", selectedApp);
  }, [selectedApp]);

  /**
   * Handles the logic for opening a selected application.
   *
   * This function sets the selectedApp constant to the application that was
   * passed in and changes its hasBeenRead status to true. Next, it refelcts
   * this change in the list of applications.
   *
   * @param {*} app - The application that's been selected to be opened.
   * @returns {void}
   */
  const handleOpen = (app) => {
    setSelectedApp({ ...app, hasBeenRead: true });
    setApplications((prev) =>
      prev.map((a) => (a.id === app.id ? { ...a, hasBeenRead: true } : a))
    );
  };

  const downloadResume = async (id) => {
    try {
      const response = await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/application/${id}/resume`);
      if (!response.ok) throw new Error("Failed to download resume");
      const blob = await response.blob();
      const url = window.URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      const app = applications.find((app) => app.id === id);
      a.download = app?.resumeFileName || "resume.pdf";
      document.body.appendChild(a);
      a.click();
      window.URL.revokeObjectURL(url);
      document.body.removeChild(a);
    } catch (error) {
      console.error("Error downloading resume:", error);
      setNotification({ open: true, message: "Failed to download resume", severity: "error" });
    }
  };

  /**
   * Handles the logic for closing a selected application.
   *
   * This function simply sets the selectedApp constant to null.
   *
   * @returns {void}
   */
  const handleClose = () => setSelectedApp(null);

  /**
   * Updates the status of an application in the database.
   *
   * This function sends a PUT request to the API to update the status of
   * a specific application. It expects the application ID to be in
   * `selectedApp.id` and the new status to be passed as `newStatus`.
   *
   * @async
   * @param {*} newStatus - The new status to set for the application.
   * @throws {Error} If the update fails
   * @returns {Promise<void>}
   */
  async function putApplicationStatus(newStatus) {
    const res = await fetch(
      `${process.env.NEXT_PUBLIC_API_URL}/api/application/${selectedApp.id}`,
      {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: newStatus }),
      }
    );
    const result = await res.json();
    if (!res.ok) throw new Error(result.error || "Failed to update");
  }

  /**
   * Handles the logic for updating the status of a selected application.
   *
   * @param {*} status - The new status to set the application to
   * @returns {void}
   */
  const handleStatusUpdate = (status) => {
    console.log("Updating status to:", status);
    console.log("Updating status to:", status);
    if (!selectedApp) return;
    try {
      //update in database
      putApplicationStatus(status);
      const selectedAppCopy = { ...selectedApp };
      handleUserStatusUpdate(status, selectedAppCopy);
      //update local state
      setApplications((prev) =>
        prev.map((a) => (a.id === selectedApp.id ? { ...a, status } : a))
      );
      //
      setSelectedApp((prev) =>
        prev ? { ...prev, accepted: status === "accepted", status } : prev
      );
      // console.log(selectedApp.firstName, "has been", status);
      setStatus(status);
      setNotification({
        open: true,
        message: `Application for ${selectedApp.firstName} has been ${status}.`,
        severity: status === STATUSES[1] ? "success" : "error",
      });
      setSelectedApp(null);
    } catch (err) {
      setNotification({ open: true, message: `Failed to update status: ${err.message}`, severity: "error" });
    }
    // console.log("app status", selectedApp.status);
  };

  async function handleUserStatusUpdate(status, application) {
    console.log("Handling user status update for", application.applicant_id);
    let new_role = "";
    if (status == "ACCEPTED") new_role = "scooployee";
    else if (status == "REJECTED") new_role = "applicant";
    try {
      const userResponse = await fetch(
        process.env.NEXT_PUBLIC_API_URL + `/api/users/${application.applicant_id}`,
        { method: "GET" }
      );
      if (userResponse.status === 404) {
        console.log("User not found, creating new user:", application.applicant_id);
        await fetch(process.env.NEXT_PUBLIC_API_URL + "/api/users", {
          method: "POST",
          body: JSON.stringify({
            id: application.applicant_id,
            fname: application.firstName,
            lname: application.lastName,
            email: application.ritEmail,
            type: new_role,
            createdAt: new Date().toISOString(),
            semester_group: "null",
            project: "null",
            active: "",
            last_login: "null",
            prev_login: "null",
          }),
          headers: { "Content-Type": "application/json" },
        });
      } else {
        console.log("User found, updating role to:", new_role);
        await fetch(process.env.NEXT_PUBLIC_API_URL + `/api/users/${application.applicant_id}`, {
          method: "PUT",
          body: JSON.stringify({ type: new_role }),
          headers: { "Content-Type": "application/json" },
        });
      }
      console.log("Creating journal entry for status:", status);
      handleJournalEntry(application, status);
    } catch (error) {
      console.error("Error updating user role:", error);
    }
  }

  async function handleJournalEntry(application, status) {
    console.log("Creating journal entry for", application.firstName, "with status", status);
    let entry_string = "";
    if (status == "ACCEPTED") entry_string = `${application.firstName} ${application.lastName} has been accepted for SCOOP.`;
    else if (status == "REJECTED") entry_string = `${application.firstName} ${application.lastName} has been rejected for SCOOP.`;
    try {
      await fetch(`${process.env.NEXT_PUBLIC_API_URL}/api/journal`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          date: new Date().toISOString(),
          sender_id: application.applicant_id,
          notes: entry_string,
          recipient_ids: [],
          topic_id: application.applicant_id,
          semester_GroupId: null,
          previous_entryid: null,
          entry_type: "AUTOMATED",
          visibility_level: 1,
          privacy_level: "PUBLIC",
        }),
      });
    } catch (error) {
      console.error("Error creating journal entry:", error);
    }
  }

  const handleNotificationClose = (event, reason) => {
    if (reason === "clickaway") return;
    setNotification({ ...notification, open: false });
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
      type: "scooployee", //change to scooployee
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
   * This function filters the applications to find those that have been accepted, and then
   * creates a new user object for each accepted application. It then posts each new user
   * to the users API endpoint.
   *
   * For each application where accepted=true, format data into user and then do users post like how you would do application post.
   * @returns {void}
   */
  const handleSubmit = () => {
    //   let data ;
    //
    const acceptedApps = applications.filter((app) => app.status === "ACCEPTED");
    // console.log(acceptedApps)
    for (let app of acceptedApps) {
      // console.log(app)
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
    const filtered =
      filter === "ALL"
        ? applications
        : applications.filter((app) => app.status === filter);
    return [...filtered].sort(getComparator(order, orderBy));
  }, [applications, filter, order, orderBy]);

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
              <TableCell key={col.id} sx={{ backgroundColor: theme.palette.primary.main, color: theme.ritColors.white }}>
                <TableSortLabel
                  active={orderBy === col.id}
                  direction={orderBy === col.id ? order : "asc"}
                  onClick={() => handleSort(col.id)}
                  sx={{
                    color: `${theme.ritColors.white} !important`,
                    "& .MuiTableSortLabel-icon": { color: `${theme.ritColors.white} !important` },
                  }}
                >
                  {col.label}
                </TableSortLabel>
              </TableCell>
            ))}
            <TableCell sx={{ backgroundColor: theme.palette.primary.main, color: theme.ritColors.white }} align="right">Actions</TableCell>
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
                <StatusBadge status={app.status} />
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
      { label: "Unprocessed", key: "UNPROCESSED", color: theme.palette.grey[500], defaultOrder: "desc" },
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
        key === "UNPROCESSED" ? !a.status || a.status === "UNPROCESSED" : a.status === key
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

              <Paper elevation={1} square sx={{ overflow: "hidden" }}>
                {apps.length === 0 ? (
                  <Box sx={{ px: 2, py: 1.5 }}>
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
        </Box>

        {/* <Button
          onClick={() => handleSubmit()}
          sx={{
            bgcolor: "#F76902",
            color: "white",
            "&:hover": {
              bgcolor: "#d95e00",
            },
            m: 1,
          }}
        >
          Submit Accepted
        </Button> */}

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

      {view === "table" && <TableView />}
      {view === "kanban" && <KanbanView />}

      {/* Modal */}
      <Dialog open={!!selectedApp} onClose={handleClose} maxWidth="sm" fullWidth>
        {selectedApp && (
          <>
            <DialogTitle sx={{ bgcolor: theme.palette.primary.main, color: theme.ritColors.white, fontWeight: 600 }}>
              Application: {selectedApp.firstName} {selectedApp.lastName}
            </DialogTitle>
            <DialogContent dividers>
              <Typography variant="body2">
                Submitted on: {new Date(selectedApp.createdAt).toLocaleDateString()}
              </Typography>
              <Typography margin={2}><strong>Email:</strong><br />{selectedApp.ritEmail}</Typography>
              <Typography margin={2}><strong>Number of Co-op blocks completed?</strong><br />{selectedApp.coopsCompleted}</Typography>
              <Typography margin={2}><strong>Which semester did you start at RIT?</strong><br />{selectedApp.startSemester}</Typography>
              <Typography margin={2}><strong>Which courses have you already taken or are about to complete this term?</strong><br />{selectedApp.coursesTaken}</Typography>
              <Typography margin={2}><strong>When did you start searching for this co-op?</strong><br />{selectedApp.coopSearchStartDate}</Typography>
              {/* <Typography margin={2}>
                  <strong>Semester Started:</strong>{" "}
                  <br />
                  {selectedApp.startSemester}
              </Typography> */}
              <Typography margin={2}><strong>What methods/platforms have you used in order to try and get this co-op?</strong><br />{selectedApp.coopSearchPlatforms}</Typography>
              <Typography margin={2}><strong>Do you have any pending/open employer replies that you are waiting to hear back from at this time?</strong><br />{String(selectedApp.pendingOffers)}</Typography>
              <Typography margin={2}><strong>If Yes, and these as a result of an interview, name each employer and your last date of contact for each.</strong><br />{selectedApp.pendingOffersDetails}</Typography>
              <Typography margin={2}><strong>Have you received formal rejection letters/responses?</strong><br />{selectedApp.rejectionLetters}</Typography>
              <Typography margin={2}><strong>If Yes, approximately how many?</strong><br />{selectedApp.rejectionLettersDetails}</Typography>
              <Typography margin={2}><strong>SE does not currently have a co-op option for this summer. However, IF an approved unpaid opportunity became available, would you be interested in pursuing it?</strong><br />{String(selectedApp.SEcoopInterest)}</Typography>
              <Typography margin={2}><strong>If an option were to become available, would you be able to participate in-person at RIT?</strong><br />{String(selectedApp.SEcoopAvailability)}</Typography>
              <Typography margin={2}><strong>If Unable, please confirm that you can be remote by stating your capabilities</strong><br />{selectedApp.remoteAbility}</Typography>
              <Typography margin={2}><strong>Is there anything else you&apos;d like to share with us?</strong><br />{selectedApp.additionalInfo}</Typography>
              <Typography margin={2}>
                <strong>Resume:</strong><br />
                {selectedApp.hasResume ? (
                  <Button variant="contained" size="small" onClick={() => downloadResume(selectedApp.id)} sx={{ mt: 1 }}>
                    Download {selectedApp.resumeFileName || "Resume"}
                  </Button>
                ) : "No resume uploaded"}
              </Typography>
              <Box mt={3}>
                <Typography variant="subtitle2" color="text.secondary">
                  Current Status: {String(selectedApp.status)}
                </Typography>
                <Typography
                  variant="h6"
                  sx={{ color: "#7D55C7", fontWeight: 500 }}
                >
                  {/* {application} */}
                  {/* {selectedApp.status.charAt(0).toUpperCase() + selectedApp.status.slice(1)} */}
                </Typography>
              </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2, gap: 0.5 }}>
              <Button onClick={handleClose} variant="outlined" color="inherit">
                Close
              </Button>
              <Button variant="contained" onClick={() => handleStatusUpdate(STATUSES[2])} color="error">
                Reject
              </Button>
              <Button variant="contained" onClick={() => handleStatusUpdate(STATUSES[1])} color="success">
                Accept
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>

      {/* Filter Dialog */}
      <Dialog open={filterDialogOpen} onClose={() => setFilterDialogOpen(false)} maxWidth="xs" fullWidth>
        <DialogTitle sx={{ bgcolor: theme.palette.primary.main, color: theme.ritColors.white, fontWeight: 600 }}>
          Filter Applications
        </DialogTitle>
        <DialogContent dividers>
          <Box sx={{ display: "flex", flexDirection: "column", gap: 2, mt: 1 }}>
            <FormControl fullWidth>
              <InputLabel>Status</InputLabel>
              <Select value={filter} label="Status" onChange={(e) => setFilter(e.target.value)}>
                {STATUSES.map((s) => (
                  <MenuItem key={s} value={s}>
                    {s === "ALL" ? "All" : s.charAt(0).toUpperCase() + s.slice(1).toLowerCase()}
                  </MenuItem>
                ))}
              </Select>
            </FormControl>
          </Box>
        </DialogContent>
        <DialogActions sx={{ px: 2, py: 1.5, gap: 0.5 }}>
          <Button variant="outlined" color="inherit" onClick={() => setFilter("ALL")}>Reset</Button>
          <Button variant="solid-orange" onClick={() => setFilterDialogOpen(false)}>Apply</Button>
        </DialogActions>
      </Dialog>

      <Snackbar
        open={notification.open}
        autoHideDuration={4000}
        onClose={handleNotificationClose}
      >
        <Alert onClose={handleNotificationClose} severity={notification.severity} sx={{ width: "100%" }}>
          {notification.message}
        </Alert>
      </Snackbar>
    </Box>
  );
}
"use client";
import React, { useState, useEffect } from "react";
import {
  Box,
  Button,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Table,
  TableHead,
  TableRow,
  TableCell,
  TableBody,
  Select,
  MenuItem,
  Paper,
} from "@mui/material";

const STATUSES = ["all", "accepted", "rejected", "unprocessed"];

const mockApplications = [
  {
    id: 1,
    name: "Alice Johnson",
    email: "alice@rit.edu",
    status: "unprocessed",
    hasBeenRead: false,
    submittedAt: "2025-06-01",
  },
  {
    id: 2,
    name: "Bob Smith",
    email: "bob@rit.edu",
    status: "accepted",
    hasBeenRead: true,
    submittedAt: "2025-06-02",
  },
  {
    id: 3,
    name: "Cynthia Lee",
    email: "cynthia@rit.edu",
    status: "rejected",
    hasBeenRead: true,
    submittedAt: "2025-06-03",
  },
];

export default function SupervisorApplicationsPage() {
  const [applications, setApplications] = useState([]);
  const [selectedApp, setSelectedApp] = useState(null);
  const [filter, setFilter] = useState("all");

  useEffect(() => {
    setApplications(mockApplications);
  }, []);

  const handleOpen = (app) => {
    setSelectedApp({ ...app, hasBeenRead: true });
    setApplications((prev) =>
      prev.map((a) => (a.id === app.id ? { ...a, hasBeenRead: true } : a))
    );
  };

  const handleClose = () => setSelectedApp(null);

  const handleStatusUpdate = (status) => {
    if (!selectedApp) return;
    setApplications((prev) =>
      prev.map((a) =>
        a.id === selectedApp.id ? { ...a, status } : a
      )
    );
    setSelectedApp(null);
  };

  const filteredApps =
    filter === "all"
      ? applications
      : applications.filter((app) => app.status === filter);

  return (
    <Box
      sx={{
        fontFamily: `"Helvetica Neue", "Helvetica", "Roboto", "Arial", sans-serif"`,
        bgcolor: "#f5f5f5",
        minHeight: "100vh",
        p: 4,
      }}
    >
      <Typography variant="h4" sx={{ fontWeight: 600, mb: 3 }}>
        Review Applications
      </Typography>

      <Box mb={3}>
        <Select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          sx={{
            bgcolor: "#fff",
            borderRadius: 2,
            minWidth: 200,
            boxShadow: 1,
          }}
        >
          {STATUSES.map((status) => (
            <MenuItem key={status} value={status}>
              {status.charAt(0).toUpperCase() + status.slice(1)}
            </MenuItem>
          ))}
        </Select>
      </Box>

      <Paper elevation={1}>
        <Table>
          <TableHead sx={{ backgroundColor: "#F76902" }}>
            <TableRow>
              <TableCell sx={{ color: "#fff" }}>Name</TableCell>
              <TableCell sx={{ color: "#fff" }}>Email</TableCell>
              <TableCell sx={{ color: "#fff" }}>Submitted</TableCell>
              <TableCell sx={{ color: "#fff" }} align="right">
                Actions
              </TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {filteredApps.map((app) => (
              <TableRow
                key={app.id}
                sx={{
                  opacity: app.hasBeenRead ? 0.6 : 1,
                  transition: "opacity 0.3s",
                  "&:hover": {
                    backgroundColor: "#fafafa",
                  },
                }}
              >
                <TableCell>{app.name}</TableCell>
                <TableCell>{app.email}</TableCell>
                <TableCell>{app.submittedAt}</TableCell>
                <TableCell align="right">
                  <Button
                    variant="outlined"
                    onClick={() => handleOpen(app)}
                    sx={{
                      borderColor: "#F76902",
                      color: "#F76902",
                      "&:hover": {
                        backgroundColor: "#F76902",
                        color: "#fff",
                      },
                    }}
                  >
                    View
                  </Button>
                </TableCell>
              </TableRow>
            ))}
          </TableBody>
        </Table>
      </Paper>

      {/* Modal */}
      <Dialog open={!!selectedApp} onClose={handleClose} maxWidth="sm" fullWidth>
        {selectedApp && (
          <>
            <DialogTitle
              sx={{
                bgcolor: "#F76902",
                color: "#fff",
                fontWeight: 600,
              }}
            >
              Application: {selectedApp.name}
            </DialogTitle>
            <DialogContent dividers>
              <Typography><strong>Email:</strong> {selectedApp.email}</Typography>
              <Typography><strong>Submitted:</strong> {selectedApp.submittedAt}</Typography>
              <Typography mt={2} sx={{ fontStyle: "italic" }}>
                (Application content placeholder here...)
              </Typography>

              <Box mt={3}>
                <Typography variant="subtitle2" color="text.secondary">
                  Current Status:
                </Typography>
                <Typography variant="h6" sx={{ color: "#7D55C7", fontWeight: 500 }}>
                  {selectedApp.status.charAt(0).toUpperCase() + selectedApp.status.slice(1)}
                </Typography>
              </Box>
            </DialogContent>
            <DialogActions sx={{ px: 3, py: 2 }}>
              <Button
                variant="contained"
                onClick={() => handleStatusUpdate("accepted")}
                sx={{
                  bgcolor: "#84BD00",
                  "&:hover": { bgcolor: "#6da400" },
                }}
              >
                Accept
              </Button>
              <Button
                variant="contained"
                onClick={() => handleStatusUpdate("rejected")}
                sx={{
                  bgcolor: "#DA291C",
                  "&:hover": { bgcolor: "#b82018" },
                }}
              >
                Reject
              </Button>
              <Button onClick={handleClose} variant="outlined" color="inherit">
                Close
              </Button>
            </DialogActions>
          </>
        )}
      </Dialog>
    </Box>
  );
}
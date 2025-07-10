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
    Snackbar,
    Alert,
} from "@mui/material";
// import { application } from "express";

import Header from "@components/Header";

const STATUSES = ["all", "accepted", "rejected", "unprocessed"];

export default function SupervisorApplicationsPage() {
    const [applications, setApplications] = useState([]);
    const [selectedApp, setSelectedApp] = useState(null);
    const [filter, setFilter] = useState("all");
    const [notification, setNotification] = useState({
        open: false,
        message: "",
        severity: "success",
    });

    useEffect(() => {
        const fetchApps = async () => {
            try {
                const res = await fetch(
                    `${process.env.NEXT_PUBLIC_API_URL}/api/application`
                );
                const data = await res.json();
                setApplications(data);
            } catch (err) {
                console.error("Failed to fetch applications:", err);
            }
        };

        fetchApps();
    }, []);

    const handleOpen = (app) => {
        setSelectedApp({ ...app, hasBeenRead: true });
        setApplications((prev) =>
            prev.map((a) => (a.id === app.id ? { ...a, hasBeenRead: true } : a))
        );
        console.log("opening app:", selectedApp.firstName);
    };

    const handleClose = () => setSelectedApp(null);

    const handleStatusUpdate = (status) => {
        if (!selectedApp) return;
        setApplications((prev) =>
            prev.map((a) => (a.id === selectedApp.id ? { ...a, status } : a))
        );
        setSelectedApp(null);

        setNotification({
            open: true,
            message: `Application for ${selectedApp.name} has been ${status}.`,
            severity: status === "accepted" ? "success" : "error",
        });
    };

    const handleNotificationClose = (event, reason) => {
        if (reason === "clickaway") return;
        setNotification({ ...notification, open: false });
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

                <Paper elevation={1}>
                    <Table>
                        <TableHead sx={{ backgroundColor: "#F76902" }}>
                            <TableRow>
                                <TableCell sx={{ color: "#fff" }}>
                                    First Name
                                </TableCell>
                                <TableCell sx={{ color: "#fff" }}>
                                    Last Name
                                </TableCell>
                                <TableCell sx={{ color: "#fff" }}>
                                    Email
                                </TableCell>
                                <TableCell sx={{ color: "#fff" }}>
                                    Submitted
                                </TableCell>
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
                                    <TableCell>{app.firstName}</TableCell>
                                    <TableCell>{app.lastName}</TableCell>
                                    <TableCell>{app.ritEmail}</TableCell>
                                    <TableCell>{app.createdAt}</TableCell>
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
                <Dialog
                    open={!!selectedApp}
                    onClose={handleClose}
                    maxWidth="sm"
                    fullWidth
                >
                    {selectedApp && (
                        <>
                            <DialogTitle
                                sx={{
                                    bgcolor: "#F76902",
                                    color: "#fff",
                                    fontWeight: 600,
                                }}
                            >
                                Application:{" "}
                                {(selectedApp.firstName, selectedApp.lastName)}
                            </DialogTitle>
                            <DialogContent dividers>
                                <Typography>
                                    <strong>Email:</strong>{" "}
                                    {selectedApp.ritEmail}
                                </Typography>
                                <Typography>
                                    <strong>Submitted:</strong>{" "}
                                    {selectedApp.createdAt}
                                </Typography>
                                <Typography mt={2} sx={{ fontStyle: "italic" }}>
                                    {JSON.stringify(selectedApp)}
                                </Typography>

                                <Box mt={3}>
                                    <Typography
                                        variant="subtitle2"
                                        color="text.secondary"
                                    >
                                        Current Status: {selectedApp.accepted}
                                    </Typography>
                                    <Typography
                                        variant="h6"
                                        sx={{
                                            color: "#7D55C7",
                                            fontWeight: 500,
                                        }}
                                    >
                                        {/* {application} */}
                                        {/* {selectedApp.status.charAt(0).toUpperCase() + selectedApp.status.slice(1)} */}
                                    </Typography>
                                </Box>
                            </DialogContent>
                            <DialogActions sx={{ px: 3, py: 2 }}>
                                <Button
                                    variant="contained"
                                    onClick={() =>
                                        handleStatusUpdate("accepted")
                                    }
                                    sx={{
                                        bgcolor: "#84BD00",
                                        "&:hover": { bgcolor: "#6da400" },
                                    }}
                                >
                                    Accept
                                </Button>
                                <Button
                                    variant="contained"
                                    onClick={() =>
                                        handleStatusUpdate("rejected")
                                    }
                                    sx={{
                                        bgcolor: "#DA291C",
                                        "&:hover": { bgcolor: "#b82018" },
                                    }}
                                >
                                    Reject
                                </Button>
                                <Button
                                    onClick={handleClose}
                                    variant="outlined"
                                    color="inherit"
                                >
                                    Close
                                </Button>
                            </DialogActions>
                        </>
                    )}
                </Dialog>
            </Box>

            <Snackbar
                open={notification.open}
                autoHideDuration={4000}
                onClose={handleNotificationClose}
                anchorOrigin={{ vertical: "top", horizontal: "center" }}
            >
                <Alert
                    onClose={handleNotificationClose}
                    severity={notification.severity}
                    sx={{ width: "100%" }}
                    variant="filled"
                >
                    {notification.message}
                </Alert>
            </Snackbar>
        </Box>
    );
}

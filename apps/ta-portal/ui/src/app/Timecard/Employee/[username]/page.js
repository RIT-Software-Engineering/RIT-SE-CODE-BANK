// app/Timecard/Employee/[username]/page.js
"use client";

import React, { useState, useEffect, useCallback } from "react";
import FeatureGate from "@/components/common/FeatureGate";
import { FEATURES } from "@/configuration/featureFlags";
import {
    Box,
    Button,
    Paper,
    Table,
    TableBody,
    TableCell,
    TableContainer,
    TableHead,
    TableRow,
    TableFooter,
    Typography,
    TextField,
    Accordion,
    AccordionSummary,
    AccordionDetails,
    CircularProgress,
    Container,
    Alert,
} from "@mui/material";
import ExpandMoreIcon from "@mui/icons-material/ExpandMore";
import NotesModal from "@/components/timecard/NotesModal";
import ConfirmationModal from "@/components/common/models/ConfirmationModal";
import StartDateModal from "@/components/timecard/StartDateModal";
import { useNotification } from "@/contexts/NotificationContext";
import {
    upsertTimecard,
    getAllTimecardsForJob,
} from "@/services/db-apis";
import { useAuth } from "@/contexts/AuthContext";
import TimecardHistory from "@/components/timecard/TimecardHistory";

/**
 * Renders the employee timecard management page.
 * This component allows employees to view their active job, enter and edit weekly hours,
 * save progress, submit completed timecards, and view their submission history.
 * Access is restricted to users with the 'EMPLOYEE' role.
 */
export default function EmployeeTimecard() {
    // --- STATE MANAGEMENT ---

    // Core hooks for authentication context and user notifications.
    const { currentUser } = useAuth();
    const { showNotification } = useNotification();

    // State for core timecard data.
    const [currentTimecard, setCurrentTimecard] = useState([]); // The editable timecard for the current week.
    const [previousTimecards, setPreviousTimecards] = useState([]); // A list of previously submitted timecards.
    const [jobPositionHistoryId, setJobPositionHistoryId] = useState(null); // The ID of the employee's active job.
    const [weekStartDate, setWeekStartDate] = useState(null); // The start date of the current timecard week.

    // State for managing UI status (loading, submitting, errors).
    const [loading, setLoading] = useState(true);
    const [submitting, setSubmitting] = useState(false);
    const [error, setError] = useState(null);

    // State for controlling various modals (confirmation, notes, date selection).
    const [showClearConfirm, setShowClearConfirm] = useState(false);
    const [showSubmitConfirm, setShowSubmitConfirm] = useState(false);
    const [notesModal, setNotesModal] = useState({ show: false, day: null });
    const [showStartDateModal, setShowStartDateModal] = useState(false);
    const [needsInitialTimecard, setNeedsInitialTimecard] = useState(false); // Flag for first-time users.

    // --- HELPER & UTILITY FUNCTIONS ---

    /**
     * Formats a Date object into a 'YYYY-MM-DD' string.
     * @param {Date} date - The date to format.
     * @returns {string} The formatted date string.
     */
    const formatDate = (date) => date ? new Date(date).toISOString().slice(0, 10) : "";

    /**
     * Formats a Date object into a 'HH:mm' 24-hour time string.
     * @param {Date} date - The date object to format.
     * @returns {string} The formatted time string.
     */
    const formatTime = (date) => date ? new Date(date).toLocaleTimeString('en-GB', { hour: '2-digit', minute: '2-digit', hour12: false, timeZone: 'UTC' }) : "";

    /**
     * Generates a 7-day week structure starting from a given date.
     * @param {Date} weekStart - The starting date of the week (e.g., a Friday).
     * @returns {Array<Object>} An array of day objects for the timecard grid.
     */
    const buildWeekFrom = useCallback((weekStart) => {
        const dayLabels = ["Friday", "Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"];
        return dayLabels.map((label, i) => {
            const date = new Date(weekStart);
            date.setDate(date.getDate() + i);
            return { day: label, date: formatDate(date), ins: ["", "", ""], outs: ["", "", ""], total: 0, notes: "" };
        });
    }, []);

    /**
     * Calculates the difference in hours between two time strings (e.g., "14:30").
     * @param {string} startStr - The start time string.
     * @param {string} endStr - The end time string.
     * @returns {number} The duration in hours.
     */
    const hoursDiff = (startStr, endStr) => {
        if (!startStr || !endStr) return 0;
        const [sh, sm] = startStr.split(":").map(Number);
        const [eh, em] = endStr.split(":").map(Number);
        let start = new Date(0, 0, 0, sh, sm);
        let end = new Date(0, 0, 0, eh, em);
        if (end < start) end.setDate(end.getDate() + 1); // Handles overnight shifts.
        return (end - start) / 3600000; // Convert milliseconds to hours.
    };

    // --- DATA LOADING & SIDE EFFECTS ---

    // Effect to load initial data (active job and timecards) when the component mounts or the user changes.
    useEffect(() => {
        /**
         * Finds the user's currently active job from their records and triggers timecard loading.
         */
        const loadInitialData = async () => {
            // Find the user's currently active job from their nested records.
            const employeeRecords = currentUser.candidate?.employee;
            const activeJob = employeeRecords?.flatMap(e => e.jobPositionHistory).find(j => j.jobPositionHistoryStatus === "ACTIVE");

            if (activeJob) {
                setJobPositionHistoryId(activeJob.id);
                // If an active job is found, fetch all associated timecards.
                await loadAllTimecards(activeJob.id);
            } else {
                // If no active job is found, stop the loading process.
                setLoading(false);
            }
        };

        if (currentUser) {
            loadInitialData();
        } else {
            setLoading(false);
        }
    }, [currentUser, loadAllTimecards]);

    /**
     * Fetches all timecards for a given job and populates the component's state.
     * @param {number} jobHistoryId - The ID of the employee's active job history record.
     */
    const loadAllTimecards = useCallback(async (jobHistoryId) => {
        setLoading(true);
        setError(null);
        try {
            const allTimecards = await getAllTimecardsForJob(jobHistoryId);

            if (allTimecards.length === 0) {
                // This is a new employee with no timecards; prompt them to create the first one.
                setNeedsInitialTimecard(true);
                setCurrentTimecard([]);
                setPreviousTimecards([]);
            } else {
                // The API returns timecards sorted by most recent first.
                const mostRecent = allTimecards[0];
                setPreviousTimecards(allTimecards.length > 1 ? allTimecards.slice(1) : []);

                const weekStart = new Date(mostRecent.weekStartDate);
                setWeekStartDate(weekStart);

                // Populate the editable week with data from the most recent timecard.
                let editableWeek = buildWeekFrom(weekStart);
                if (mostRecent?.dailyEntries) {
                    const entriesMap = new Map(mostRecent.dailyEntries.map(entry => [formatDate(entry.day), entry]));
                    editableWeek = editableWeek.map((day) => {
                        const dbEntry = entriesMap.get(day.date);
                        return dbEntry ? { ...day, id: dbEntry.id, ins: [formatTime(dbEntry.timeIn1), formatTime(dbEntry.timeIn2), formatTime(dbEntry.timeIn3)], outs: [formatTime(dbEntry.timeOut1), formatTime(dbEntry.timeOut2), formatTime(dbEntry.timeOut3)], total: parseFloat(dbEntry.duration) || 0, notes: dbEntry.notes || "" } : day;
                    });
                }
                setCurrentTimecard(editableWeek);
                setNeedsInitialTimecard(false);
            }
        } catch (err) {
            console.error("Failed to load timecards:", err);
            setError(err.message || "An unknown error occurred while loading timecards.");
        } finally {
            setLoading(false);
        }
    }, [buildWeekFrom]);

    // --- EVENT HANDLERS ---

    /**
     * Updates the state when a user types in a time input field.
     * It recalculates the total hours for the affected day.
     * @param {number} dayIdx - The index of the day (0-6) in the week array.
     * @param {number} pairIdx - The index of the time-in/out pair (0-2).
     * @param {string} type - Either 'in' or 'out'.
     * @param {string} value - The new time value (e.g., "09:00").
     */
    const handleTimeChange = (dayIdx, pairIdx, type, value) => {
        setCurrentTimecard(prev => {
            const newTimecard = [...prev];
            const dayEntry = { ...newTimecard[dayIdx] };
            type === "in" ? (dayEntry.ins[pairIdx] = value) : (dayEntry.outs[pairIdx] = value);
            // Recalculate the total hours for the day.
            dayEntry.total = dayEntry.ins.reduce((acc, cur, i) => acc + hoursDiff(cur, dayEntry.outs[i]), 0);
            newTimecard[dayIdx] = dayEntry;
            return newTimecard;
        });
    };

    /**
     * Saves the current state of the timecard to the database without finalizing it.
     */
    const handleSaveProgress = async () => {
        if (!jobPositionHistoryId) {
            showNotification("No active job found. Cannot save progress.", "error");
            return;
        }
        setSubmitting(true);
        try {
            // Prepare the payload for the API.
            const payload = {
                jobPositionHistoryId, weekStartDate, isCurrentWeek: true,
                entries: currentTimecard.map(day => ({
                    date: day.date, notes: day.notes || "", duration: day.total || 0,
                    timeIn1: day.ins[0] || null, timeOut1: day.outs[0] || null,
                    timeIn2: day.ins[1] || null, timeOut2: day.outs[1] || null,
                    timeIn3: day.ins[2] || null, timeOut3: day.outs[2] || null,
                })),
            };
            await upsertTimecard(payload);
            showNotification("Progress saved successfully!", "success");
        } catch (error) {
            showNotification(error.message || "Failed to save progress.", "error");
        } finally {
            setSubmitting(false);
        }
    };

    /**
     * Clears all time entries from the current week after user confirmation.
     */
    const handleClearConfirm = () => {
        setCurrentTimecard(buildWeekFrom(weekStartDate));
        setShowClearConfirm(false);
        showNotification("Timecard has been cleared.", "info");
    };

    /**
     * Saves the notes from the NotesModal to the component's state.
     * @param {string} date - The date ('YYYY-MM-DD') of the day entry.
     * @param {string} notes - The new notes text.
     */
    const handleSaveNotes = (date, notes) => {
        setCurrentTimecard(prev => prev.map(d => d.date === date ? { ...d, notes } : d));
        showNotification("Notes updated. Click 'Save Progress' to persist changes.", "info");
    };

    /**
     * Exports the provided week's timecard data as a CSV file.
     * @param {object[]} timecardData - The array of day objects for the week.
     * @param {Date} startDate - The start date of the week being exported.
     */
    const handleExport = (timecardData, startDate) => {
        const weeklyTotal = timecardData.reduce((sum, d) => sum + (d.total || 0), 0);
        const headers = ["Day", "Date", "Time In 1", "Time Out 1", "Time In 2", "Time Out 2", "Time In 3", "Time Out 3", "Total (hrs)", "Notes"];
        const rows = timecardData.map(d => [d.day, d.date, d.ins[0], d.outs[0], d.ins[1], d.outs[1], d.ins[2], d.outs[2], d.total.toFixed(2), `"${(d.notes || '').replace(/"/g, '""')}"`].join(","));
        const totalRow = `\nWeek Total,,,,,,,,${weeklyTotal.toFixed(2)}`;
        const csv = [headers.join(","), ...rows].join("\n").concat(totalRow);
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);
        const fullName = `${currentUser?.lname || 'user'}_${currentUser?.fname || ''}`;
        const name = fullName.replace(/\s+/g, '_');
        const week = formatDate(startDate);
        link.download = `${name}_timecard_${week}.csv`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    /**
     * Initiates the final submit process by showing the start date selection modal for the next week.
     */
    const handleInitiateSubmit = () => {
        setShowSubmitConfirm(false);
        setShowStartDateModal(true);
    };

    /**
     * Finalizes the submission of the current week, exports it, and creates a new blank week.
     * @param {Date} newStartDate - The start date for the new timecard week, selected by the user.
     */
    const handleFinalSubmitAndCreateNew = async (newStartDate) => {
        setSubmitting(true);
        try {
            // Step 1: Perform a final save of the current week's data.
            const finalSavePayload = {
                jobPositionHistoryId, weekStartDate, isCurrentWeek: true,
                entries: currentTimecard.map(day => ({
                    date: day.date, notes: day.notes || "", duration: day.total || 0,
                    timeIn1: day.ins[0] || null, timeOut1: day.outs[0] || null,
                    timeIn2: day.ins[1] || null, timeOut2: day.outs[1] || null,
                    timeIn3: day.ins[2] || null, timeOut3: day.outs[2] || null,
                })),
            };
            await upsertTimecard(finalSavePayload);
    
            // Step 2: Create the NEW week's timecard record.
            const newWeekPayload = {
                jobPositionHistoryId, weekStartDate: newStartDate, isCurrentWeek: true, entries: []
            };
            await upsertTimecard(newWeekPayload);
    
            // Step 3: Export the data for the week that was just finalized.
            handleExport(currentTimecard, weekStartDate);
    
            // Step 4: Reload all timecard data from the database to reflect the changes.
            await loadAllTimecards(jobPositionHistoryId);
    
            showNotification("Timecard submitted successfully and new week started!", "success");
    
        } catch (error) {
            showNotification(error.message || "Failed to submit timecard.", "error");
        } finally {
            setSubmitting(false);
            setShowStartDateModal(false);
        }
    };

    /**
     * Creates the very first timecard for a new employee and saves it immediately.
     * @param {Date} startDate - The selected start date for their first week.
     */
    const handleCreateInitialTimecard = async (startDate) => {
        setSubmitting(true);
        try {
            const payload = {
                jobPositionHistoryId, weekStartDate: startDate, isCurrentWeek: true, entries: [] // A new week starts empty
            };
            await upsertTimecard(payload);
            
            // Now that the record is created, reload all data to enter the main timecard view.
            await loadAllTimecards(jobPositionHistoryId);
            showNotification("New timecard created. You can now start entering your hours.", "info");

        } catch (error) {
            showNotification(error.message || "Failed to create the first timecard.", "error");
        } finally {
            setSubmitting(false);
            setShowStartDateModal(false);
        }
    };

    // Calculate the total hours for the current week.
    const weeklyTotal = currentTimecard.reduce((sum, d) => sum + (d.total || 0), 0);

    // --- RENDER LOGIC ---

    // Display a loading spinner while the initial user authentication is being checked.
    if (currentUser === undefined || loading) {
        return (
            <Box sx={{ textAlign: 'center', py: 10 }}>
                <CircularProgress />
                <Typography sx={{ mt: 2 }}>Loading timecard...</Typography>
            </Box>
        );
    }
    
    // Main component render method.
    return (
        <FeatureGate feature={FEATURES.TIMECARD}>
        <>
            {/* Conditionally render content based on user role. */}
            {currentUser && currentUser.role === 'EMPLOYEE' ? (
                <>
                    {/* Handle initial state for new employees */}
                    {!jobPositionHistoryId && !loading && (
                        <Container><Alert severity="warning">You do not have an active job position. Please contact an administrator.</Alert></Container>
                    )}
                    {needsInitialTimecard && jobPositionHistoryId && (
                        <>
                            <Box sx={{ textAlign: 'center', py: 10 }}>
                                <Typography color="text.secondary" sx={{ mb: 2 }}>No timecard found. Let&apos;s create your first one.</Typography>
                                <Button variant="contained" onClick={() => setShowStartDateModal(true)} disabled={submitting}>
                                    {submitting ? <CircularProgress size={24} /> : "Create First Timecard"}
                                </Button>
                            </Box>
                            <StartDateModal
                                isOpen={showStartDateModal}
                                onClose={() => setShowStartDateModal(false)}
                                onConfirm={handleCreateInitialTimecard}
                                isSubmitting={submitting}
                            />
                        </>
                    )}
                    {error && (
                         <Container><Alert severity="error">{error}</Alert></Container>
                    )}
                    
                    {/* Main Timecard View */}
                    {jobPositionHistoryId && !needsInitialTimecard && !error && (
                        <Container maxWidth="xl" sx={{ py: 4 }}>
                            <Paper sx={{ p: { xs: 2, sm: 4 }, mb: 4 }}>
                                <Typography variant="h4" component="h1" align="center" gutterBottom fontWeight="bold">
                                    Weekly Timecard
                                </Typography>
                                <TableContainer component={Paper} elevation={2}>
                                    <Table sx={{ minWidth: 1200 }} size="small">
                                        <TableHead>
                                            <TableRow>
                                                <TableCell>Day</TableCell><TableCell>Date</TableCell><TableCell>Time In 1</TableCell><TableCell>Time Out 1</TableCell><TableCell>Time In 2</TableCell><TableCell>Time Out 2</TableCell><TableCell>Time In 3</TableCell><TableCell>Time Out 3</TableCell><TableCell align="right">Total (hrs)</TableCell><TableCell>Notes</TableCell>
                                            </TableRow>
                                        </TableHead>
                                        <TableBody>
                                            {currentTimecard.map((day, dayIdx) => (
                                                <TableRow key={day.date} hover>
                                                    <TableCell component="th" scope="row"><Typography fontWeight="medium">{day.day}</Typography></TableCell>
                                                    <TableCell><TextField type="date" value={day.date} variant="standard" InputProps={{ readOnly: true, disableUnderline: true }} /></TableCell>
                                                    {Array.from({ length: 3 }).map((_, pairIdx) => (
                                                        <React.Fragment key={pairIdx}>
                                                            <TableCell><TextField type="time" value={day.ins[pairIdx] || ""} onChange={(e) => handleTimeChange(dayIdx, pairIdx, "in", e.target.value)} variant="standard"/></TableCell>
                                                            <TableCell><TextField type="time" value={day.outs[pairIdx] || ""} onChange={(e) => handleTimeChange(dayIdx, pairIdx, "out", e.target.value)} variant="standard"/></TableCell>
                                                        </React.Fragment>
                                                    ))}
                                                    <TableCell align="right"><Typography>{(day.total || 0).toFixed(2)}</Typography></TableCell>
                                                    <TableCell><Button variant="text" size="small" onClick={() => setNotesModal({ show: true, day: day })}>{day.notes ? "Edit" : "Add"}</Button></TableCell>
                                                </TableRow>
                                            ))}
                                        </TableBody>
                                        <TableFooter>
                                            <TableRow sx={{ backgroundColor: 'action.hover' }}>
                                                <TableCell colSpan={8} align="right"><Typography variant="button" fontWeight="bold">Week Total:</Typography></TableCell>
                                                <TableCell colSpan={2} align="left"><Typography variant="h6" fontWeight="bold" color={weeklyTotal > 40 ? 'error.main' : 'text.primary'}>{weeklyTotal.toFixed(2)}</Typography></TableCell>
                                            </TableRow>
                                        </TableFooter>
                                    </Table>
                                </TableContainer>
                                <Box sx={{ mt: 4, display: 'flex', justifyContent: 'center', gap: 2, flexWrap: 'wrap' }}>
                                    <Button variant="contained" color="error" onClick={() => setShowClearConfirm(true)} disabled={submitting}>Clear</Button>
                                    <Button variant="outlined" onClick={handleSaveProgress} disabled={submitting} startIcon={submitting ? <CircularProgress size={20} /> : null}>{submitting ? "Saving..." : "Save Progress"}</Button>
                                    <Button variant="contained" color="primary" onClick={() => setShowSubmitConfirm(true)} disabled={submitting}>Submit Week</Button>
                                </Box>
                            </Paper>

                            {/* Previous Timecards Section */}
                            {previousTimecards.length > 0 && currentUser && (
                                <Paper sx={{ p: { xs: 2, sm: 4 } }}>
                                    <Accordion>
                                        <AccordionSummary expandIcon={<ExpandMoreIcon />}><Typography variant="h6" fontWeight={600}>Previous Timecards</Typography></AccordionSummary>
                                        <AccordionDetails>
                                            {previousTimecards.map(timecard => (
                                                <Accordion key={timecard.id}>
                                                    <AccordionSummary expandIcon={<ExpandMoreIcon />}><Typography>Timecard for week of {formatDate(timecard.weekStartDate)}</Typography></AccordionSummary>
                                                    <AccordionDetails><TimecardHistory timecard={timecard} user={currentUser} /></AccordionDetails>
                                                </Accordion>
                                            ))}
                                        </AccordionDetails>
                                    </Accordion>
                                </Paper>
                            )}
                        </Container>
                    )}
                </>
            ) : (
                // Render a fallback message if the user is not an employee.
                <Container>
                    <Paper sx={{ p: 4, textAlign: 'center' }}>
                        <Typography variant="h6" color="error">Access Denied</Typography>
                        <Typography sx={{ mt: 1 }}>
                            You must be logged in as an EMPLOYEE to view this page.
                        </Typography>
                    </Paper>
                </Container>
            )}

            {/* All modals are rendered here, outside the main conditional logic. */}
            <ConfirmationModal isOpen={showClearConfirm} onClose={() => setShowClearConfirm(false)} onConfirm={handleClearConfirm} title="Clear Timecard">
                Are you sure you want to clear all entries for this week? This action cannot be undone.
            </ConfirmationModal>

            <ConfirmationModal
                isOpen={showSubmitConfirm}
                onClose={() => setShowSubmitConfirm(false)}
                onConfirm={handleInitiateSubmit}
                title="Submit Timecard"
                isConfirming={submitting}
            >
                Are you sure you are ready to submit your timecard for the week? This will save the current week and start a new one. You will NOT be able to edit this timecard again.
            </ConfirmationModal>

            {notesModal.show && <NotesModal isOpen={notesModal.show} dayEntry={notesModal.day} onClose={() => setNotesModal({ show: false, day: null })} onSave={handleSaveNotes} />}

            <StartDateModal
                isOpen={showStartDateModal && !needsInitialTimecard}
                onClose={() => setShowStartDateModal(false)}
                onConfirm={handleFinalSubmitAndCreateNew}
                isSubmitting={submitting}
            />
        </>
        </FeatureGate>
    );
}
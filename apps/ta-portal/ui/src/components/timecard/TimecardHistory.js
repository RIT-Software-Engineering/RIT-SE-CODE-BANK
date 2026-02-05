// components/timecard/TimecardHistory.js
'use client';

import React from 'react';
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
    Typography 
} from '@mui/material';
import DownloadIcon from '@mui/icons-material/Download';

// Helper function to format date to YYYY-MM-DD
const formatDate = (date) => date ? new Date(date).toISOString().slice(0, 10) : "";

// Helper function to build a full 7-day week structure
const buildFullWeek = (weekStartDate) => {
    const dayLabels = ["Friday", "Saturday", "Sunday", "Monday", "Tuesday", "Wednesday", "Thursday"];
    return dayLabels.map((label, i) => {
        const date = new Date(weekStartDate);
        date.setDate(date.getDate() + i);
        return {
            dayLabel: label,
            date: formatDate(date),
            timeIn1: null, timeOut1: null,
            timeIn2: null, timeOut2: null,
            timeIn3: null, timeOut3: null,
            duration: 0,
            notes: "",
        };
    });
};

/**
 * TimecardHistory is a client-side component that displays a read-only view
 * of a single weekly timecard. It is used to show previous weeks' timecards.
 * @param {Object} props - The component's props.
 * @param {Object} props.timecard - The timecard object, including its daily entries.
 * @param {Object} props.user - The user object for the employee whose timecard this is.
 */
const TimecardHistory = ({ timecard, user }) => {
    // 1. Build a full 7-day week structure.
    const fullWeek = buildFullWeek(timecard.weekStartDate);

    // 2. Create a map of the existing entries for easy lookup.
    const entriesMap = new Map(timecard.dailyEntries.map(entry => [formatDate(entry.day), entry]));

    // 3. Merge the database entries into the full week structure.
    const displayWeek = fullWeek.map(day => {
        const dbEntry = entriesMap.get(day.date);
        if (dbEntry) {
            // If an entry exists, merge its data.
            return {
                ...day,
                ...dbEntry,
                duration: parseFloat(dbEntry.duration) || 0,
            };
        }
        // Otherwise, return the empty day structure.
        return day;
    });

    // Calculate the total hours for the week to display in the footer.
    const weeklyTotal = displayWeek.reduce((sum, day) => sum + day.duration, 0);

    /**
     * Handles the logic for exporting the current timecard view as a CSV file.
     */
    const handleExport = () => {
        // Define the headers for the CSV file.
        const headers = ["Day", "Date", "Time In 1", "Time Out 1", "Time In 2", "Time Out 2", "Time In 3", "Time Out 3", "Total (hrs)", "Notes"];
        // Map over the display data to create each row of the CSV.
        const rows = displayWeek.map(d => 
            [
                d.dayLabel, d.date, 
                d.timeIn1?.slice(11, 16) || '', d.timeOut1?.slice(11, 16) || '',
                d.timeIn2?.slice(11, 16) || '', d.timeOut2?.slice(11, 16) || '',
                d.timeIn3?.slice(11, 16) || '', d.timeOut3?.slice(11, 16) || '',
                d.duration.toFixed(2), 
                `"${(d.notes || '').replace(/"/g, '""')}"` // Enclose notes in quotes to handle commas
            ].join(",")
        );
        const totalRow = `\nWeek Total,,,,,,,,${weeklyTotal.toFixed(2)}`;
        // Combine headers, rows, and the total row into a single string.
        const csv = [headers.join(","), ...rows].join("\n").concat(totalRow);
        // Create a Blob object to represent the file.
        const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
        // Create a temporary link element to trigger the download.
        const link = document.createElement("a");
        link.href = URL.createObjectURL(blob);

        // Construct the filename using the employee's name and the week's start date.
        const employeeName = (user && user.fname && user.lname) 
            ? `${user.lname}_${user.fname}` 
            : 'user';
        const week = formatDate(timecard.weekStartDate);
        link.download = `${employeeName}_timecard_${week}.csv`;
        
        // Programmatically click the link to start the download and then remove it.
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
    };

    return (
        <Paper sx={{ my: 2, overflow: 'hidden' }}>
            <TableContainer sx={{ maxHeight: 500 }}>
                <Table stickyHeader aria-label="timecard history table">
                    <TableHead>
                        <TableRow>
                            <TableCell>Day</TableCell>
                            <TableCell>Date</TableCell>
                            <TableCell>Time In 1</TableCell>
                            <TableCell>Time Out 1</TableCell>
                            <TableCell>Time In 2</TableCell>
                            <TableCell>Time Out 2</TableCell>
                            <TableCell>Time In 3</TableCell>
                            <TableCell>Time Out 3</TableCell>
                            <TableCell align="right">Total (hrs)</TableCell>
                            <TableCell>Notes</TableCell>
                        </TableRow>
                    </TableHead>
                    <TableBody>
                        {displayWeek.map((day) => (
                            <TableRow key={day.date} hover>
                                <TableCell component="th" scope="row">
                                    <Typography variant="body2" fontWeight="medium">{day.dayLabel}</Typography>
                                </TableCell>
                                <TableCell>{day.date}</TableCell>
                                <TableCell>{day.timeIn1?.slice(11, 16) || '--'}</TableCell>
                                <TableCell>{day.timeOut1?.slice(11, 16) || '--'}</TableCell>
                                <TableCell>{day.timeIn2?.slice(11, 16) || '--'}</TableCell>
                                <TableCell>{day.timeOut2?.slice(11, 16) || '--'}</TableCell>
                                <TableCell>{day.timeIn3?.slice(11, 16) || '--'}</TableCell>
                                <TableCell>{day.timeOut3?.slice(11, 16) || '--'}</TableCell>
                                <TableCell align="right">{(day.duration || 0).toFixed(2)}</TableCell>
                                <TableCell sx={{ fontSize: '0.8rem', color: 'text.secondary' }}>{day.notes || '--'}</TableCell>
                            </TableRow>
                        ))}
                    </TableBody>
                    <TableFooter>
                        <TableRow sx={{ '&:last-child td, &:last-child th': { border: 0 }, backgroundColor: 'action.hover' }}>
                            <TableCell colSpan={8} align="right">
                                <Typography variant="body1" fontWeight="bold" textTransform="uppercase">Week Total:</Typography>
                            </TableCell>
                            <TableCell colSpan={2} align="left">
                                <Typography 
                                    variant="h6" 
                                    fontWeight="bold"
                                    color={weeklyTotal > 10 ? 'error.main' : 'text.primary'}
                                >
                                    {weeklyTotal.toFixed(2)}
                                </Typography>
                            </TableCell>
                        </TableRow>
                    </TableFooter>
                </Table>
            </TableContainer>
            <Box sx={{ p: 2, display: 'flex', justifyContent: 'flex-end' }}>
                <Button 
                    onClick={handleExport}
                    variant="outlined"
                    startIcon={<DownloadIcon />}
                >
                    Export this Week
                </Button>
            </Box>
        </Paper>
    );
};

export default TimecardHistory;
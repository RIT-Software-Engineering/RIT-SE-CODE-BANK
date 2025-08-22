// components/timecard/StartDateModal.js
"use client";

import React, { useState, useEffect } from 'react';
import { Modal, Box, Paper, Typography, TextField, Button, CircularProgress } from '@mui/material';

// Helper to get today's date in YYYY-MM-DD format
const getTodayString = () => new Date().toISOString().slice(0, 10);

/**
 * StartDateModal is a client-side component that displays a modal dialog
 * for selecting the starting date of a new timecard week.
 *
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the dialog is open
 * @param {function} props.onClose - Callback to close the dialog
 * @param {function} props.onConfirm - Callback fired with the selected start date
 * @param {boolean} props.isSubmitting - Whether the confirm action is in progress
 * @returns {React.ReactElement} - A Modal component with a form for selecting a date
 */
export default function StartDateModal({ isOpen, onClose, onConfirm, isSubmitting }) {
    const [startDate, setStartDate] = useState(getTodayString());
    const [error, setError] = useState('');

    useEffect(() => {
        if (isOpen) {
        setStartDate(getTodayString());
        setError('');
        }
    }, [isOpen]);

    if (!isOpen) return null;

    const handleConfirm = () => {
        const selectedDate = new Date(`${startDate}T00:00:00`);
        // In JavaScript, getDay() returns 0 for Sunday, 1 for Monday, ..., 5 for Friday, 6 for Saturday.
        if (selectedDate.getDay() !== 5) { 
            setError('Please select a Friday as the start date.');
            return;
        }
        setError('');
        onConfirm(selectedDate);
    };

    const style = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '90%',
        maxWidth: '28rem', // max-w-md
        bgcolor: 'background.paper',
        borderRadius: '12px',
        boxShadow: 24,
        p: 4,
    };

    return (
        <Modal
            open={isOpen}
            onClose={onClose}
            aria-labelledby="start-date-modal-title"
        >
            <Paper sx={style}>
                <Typography id="start-date-modal-title" variant="h6" component="h2" sx={{ mb: 1 }}>
                    Select New Timecard Start Date
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
                    Please select the starting Friday for the new timecard week.
                </Typography>
                <TextField
                    type="date"
                    value={startDate}
                    onChange={(e) => setStartDate(e.target.value)}
                    fullWidth
                    InputLabelProps={{
                        shrink: true,
                    }}
                    sx={{ mb: 1 }}
                />
                {error && <Typography color="error" variant="caption" sx={{ mb: 2, display: 'block' }}>{error}</Typography>}
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2, mt: 3 }}>
                    <Button 
                        variant="outlined" 
                        onClick={onClose} 
                        disabled={isSubmitting}
                    >
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={handleConfirm}
                        disabled={isSubmitting}
                        startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
                    >
                        {isSubmitting ? "Submitting..." : "Confirm & Start"}
                    </Button>
                </Box>
            </Paper>
        </Modal>
    );
}
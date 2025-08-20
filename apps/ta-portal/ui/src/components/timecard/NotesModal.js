// components/timecard/NotesModal.js
import React, { useState, useEffect } from 'react';
import { Modal, Box, Paper, Typography, TextField, Button } from '@mui/material';

export default function NotesModal({ dayEntry, isOpen, onClose, onSave }) {
    const [noteInput, setNoteInput] = useState('');

    useEffect(() => {
        if (dayEntry?.notes) {
            setNoteInput(dayEntry.notes);
        } else {
            setNoteInput('');
        }
    }, [dayEntry]);

    if (!isOpen || !dayEntry) return null;

    const style = {
        position: 'absolute',
        top: '50%',
        left: '50%',
        transform: 'translate(-50%, -50%)',
        width: '90%',
        maxWidth: '32rem', // max-w-lg
        bgcolor: 'background.paper',
        borderRadius: '12px',
        boxShadow: 24,
        p: 4,
    };

    return (
        <Modal
            open={isOpen}
            onClose={onClose}
            aria-labelledby="notes-modal-title"
        >
            <Paper sx={style}>
                <Typography id="notes-modal-title" variant="h6" component="h2" sx={{ mb: 2 }}>
                    Edit Notes for {dayEntry.day} ({dayEntry.date})
                </Typography>
                <TextField
                    fullWidth
                    multiline
                    rows={6}
                    value={noteInput}
                    onChange={(e) => setNoteInput(e.target.value)}
                    variant="outlined"
                    sx={{ mb: 3 }}
                />
                <Box sx={{ display: 'flex', justifyContent: 'flex-end', gap: 2 }}>
                    <Button variant="outlined" onClick={onClose}>
                        Cancel
                    </Button>
                    <Button
                        variant="contained"
                        color="primary"
                        onClick={async () => {
                            await onSave(dayEntry.date, noteInput);
                            onClose();
                        }}
                    >
                        Save
                    </Button>
                </Box>
            </Paper>
        </Modal>
    );
}
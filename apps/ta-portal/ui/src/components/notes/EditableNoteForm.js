// src/components/notes/EditableNoteForm.js
'use client';

import { useState, useEffect } from 'react';
import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  TextField,
  Typography,
} from '@mui/material';

/**
 * EditableNoteForm component for capturing admin/employer notes in a modal dialog.
 *
 * Displays a dialog with a text field for entering a note, along with
 * cancel and confirm actions. Useful for requiring user justification
 * or feedback before proceeding with an action.
 *
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the dialog is open
 * @param {Function} props.onClose - Callback to close the dialog
 * @param {Function} props.onConfirm - Callback fired with the entered note when confirmed
 * @param {string} props.title - Title text displayed at the top of the dialog
 * @param {boolean} props.isProcessing - Whether the confirm action is processing (disables input and shows loader)
 */

export default function EditableNoteForm({ isOpen, onClose, onConfirm, title, isProcessing }) {
  const [note, setNote] = useState('');

  // Clear the note when the modal is closed to prevent stale data
  useEffect(() => {
    if (!isOpen) {
      setNote('');
    }
  }, [isOpen]);

  const handleConfirm = () => {
    onConfirm(note);
  };

  const handleCancel = () => {
    setNote('');
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={handleCancel} fullWidth maxWidth="sm">
      <DialogTitle>
        <Typography variant="h2" component="div">
          {title}
        </Typography>
      </DialogTitle>
      <DialogContent dividers>
        <DialogContentText sx={{ mb: 2 }}>
          Please provide a message for this action. <b>Admins, other employers, and the candidate will be able to view this note.</b>
        </DialogContentText>
        <TextField
          autoFocus
          margin="dense"
          id="note"
          label="Note"
          type="text"
          fullWidth
          multiline
          rows={4}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Enter note..."
          disabled={isProcessing}
          sx={(theme) => ({
            "& .MuiOutlinedInput-root": {
              backgroundColor:
                theme.palette.mode === "dark"
                  ? ""
                  : "white",
            }
          })}
        />
      </DialogContent>
      <DialogActions sx={{ p: 3 }}>
        <Button onClick={handleCancel} disabled={isProcessing}>
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color="primary"
          disabled={!note || isProcessing}
        >
          {isProcessing ? <CircularProgress size={24} /> : 'Confirm'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
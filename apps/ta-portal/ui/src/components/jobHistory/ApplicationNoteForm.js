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
import { getApplicationNote, setApplicationNote } from '@/services/db-apis';

/**
 * ApplicationNoteForm component for capturing admin/employer notes in a modal dialog.
 *
 * Displays a dialog with a text field for entering a note, along with
 * cancel and save actions. Text field is updated with the existing notes and only saves
 * if the user presses the save button
 *
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the dialog is open
 * @param {Function} props.onClose - Callback to close the dialog
 * @param {boolean} props.isProcessing - Whether the confirm action is processing (disables input and shows loader)
 * @param {Number} props.applicationId - Application ID for the desired note
 */

export default function ApplicationNoteForm({ isOpen, onClose, isProcessing, applicationId }) {
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function loadNote() {
    setIsLoading(true);
    try {
      const result = await getApplicationNote(applicationId);
      setNote(result);
    } catch (error){
      console.error("Failed to fetch note:", error);
    } finally{
      setIsLoading(false);
    }
  }

  async function saveNote(){
    try {
      await setApplicationNote(applicationId, note);
    } catch (error){
      console.error("Failed to save note:", error);
    }
  }

  useEffect(() => {
    if (isOpen){
      loadNote();
    } else{
      setNote("");
    }
  }, [isOpen]);

  const handleConfirm = () => {
    saveNote();
    onClose();
  };

  const handleCancel = () => {
    onClose();
  };

  return (
    <Dialog open={isOpen} onClose={handleCancel} fullWidth maxWidth="sm">
      <DialogTitle>
        <Typography variant="h2" component="div">
          {"Edit Notes"}
        </Typography>
      </DialogTitle>
      <DialogContent dividers>
        <DialogContentText sx={{ mb: 2 }}>
          Private Notes:
        </DialogContentText>
        <TextField
          autoFocus
          margin="dense"
          id="note"
          label=""
          type="text"
          fullWidth
          multiline
          rows={4}
          value={note}
          onChange={(e) => setNote(e.target.value)}
          placeholder="Enter custom note..."
          disabled={isProcessing || isLoading}
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
        <Button onClick={handleCancel} disabled={isProcessing || isLoading}>
          Cancel
        </Button>
        <Button
          onClick={handleConfirm}
          variant="contained"
          color="primary"
          disabled={isProcessing || isLoading}
        >
          {isProcessing || isLoading ? <CircularProgress size={24} /> : 'Save'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
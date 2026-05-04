// src/components/notes/StateUpdateForm.js
'use client';

import { useState, useEffect } from 'react';
import {
  Accordion,
  AccordionActions,
  AccordionDetails,
  AccordionSummary,
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
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import { getApplicationNote, setApplicationNote } from '@/services/db-apis';

/**
 * StateUpdateForm component for capturing admin/employer notes in a modal dialog.
 *
 * Displays a dialog with a text field for entering a note, along with
 * cancel and confirm actions. Useful for requiring user justification
 * or feedback before proceeding with an action.
 * 
 * Contains an Accordion for editing exising notes if an ApplicationID is included.
 *
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the dialog is open
 * @param {Function} props.onClose - Callback to close the dialog
 * @param {Function} props.onConfirm - Callback fired with the entered message when confirmed
 * @param {string} props.title - Title text displayed at the top of the dialog
 * @param {boolean} props.isProcessing - Whether the confirm action is processing (disables input and shows loader)
 */

export default function StateUpdateForm({
   isOpen,
    onClose,
    onConfirm, 
    title, 
    isProcessing,
    textPrompt = "Include a custom message for the candidate (optional):",
    applicationId = null 
  }) {
  const [message, setMessage] = useState('');
  const [note, setNote] = useState('');
  const [isLoading, setIsLoading] = useState(false);

  async function loadNote() {
    setIsLoading(true);
    console.log("Getting Note with ID: ", applicationId);
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

  // Clear the message when the modal is closed to prevent stale data
  useEffect(() => {
    if (!isOpen) {
      setMessage('');
    }else {
      if (applicationId){
        loadNote();
      }
    }
  }, [isOpen]);

  const handleConfirm = () => {
    onConfirm(message);
  };

  const handleCancel = () => {
    setMessage('');
    onClose();
  };

  const handleSaveNote = () => {
    saveNote();
  }

  return (
    <Dialog open={isOpen} onClose={handleCancel} fullWidth maxWidth="sm">
      <DialogTitle>
        <Typography variant="h2" component="div">
          {title}
        </Typography>
      </DialogTitle>
      <DialogContent dividers>
        {applicationId && <Accordion>
          <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={(theme) => ({
              background: theme.palette.mode === 'dark'
              ? "" : "#e0e0e0"
            })}>
            <Typography variant="h3" component="div">Private Notes</Typography>
            
          </AccordionSummary>
          <AccordionDetails sx={(theme) => ({
              background: theme.palette.mode === 'dark'
              ? "" : "#e0e0e0"
            })}>
            <Typography color="text.secondary">Notes are visible only to admins and the assigned faculty.</Typography>
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
          </AccordionDetails>
          <AccordionActions sx={(theme) => ({
              background: theme.palette.mode === 'dark'
              ? "" : "#e0e0e0"
            })}>
            <Button
              onClick={handleSaveNote}
              variant="contained"
              color="primary"
              disabled={isProcessing || isLoading}
            >
              {isProcessing || isLoading ? <CircularProgress size={24} /> : 'Save Note'}
            </Button>
          </AccordionActions>
        </Accordion>}
        <DialogContentText sx={{ mb: 2 }}>
          {textPrompt}
        </DialogContentText>
        <TextField
          autoFocus
          margin="dense"
          id="message"
          label="Message"
          type="text"
          fullWidth
          multiline
          rows={4}
          value={message}
          onChange={(e) => setMessage(e.target.value)}
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
          {isProcessing || isLoading ? <CircularProgress size={24} /> : 'Confirm'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
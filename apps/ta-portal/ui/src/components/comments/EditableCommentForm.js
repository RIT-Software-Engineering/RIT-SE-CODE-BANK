// src/components/comments/EditableCommentForm.js
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
 * EditableCommentForm component for capturing user comments in a modal dialog.
 *
 * Displays a dialog with a text field for entering a comment, along with
 * cancel and confirm actions. Useful for requiring user justification
 * or feedback before proceeding with an action.
 *
 * @param {Object} props - Component props
 * @param {boolean} props.isOpen - Whether the dialog is open
 * @param {Function} props.onClose - Callback to close the dialog
 * @param {Function} props.onConfirm - Callback fired with the entered comment when confirmed
 * @param {string} props.title - Title text displayed at the top of the dialog
 * @param {boolean} props.isProcessing - Whether the confirm action is processing (disables input and shows loader)
 */

export default function EditableCommentForm({ isOpen, onClose, onConfirm, title, isProcessing }) {
  const [comment, setComment] = useState('');

  // Clear the comment when the modal is closed to prevent stale data
  useEffect(() => {
    if (!isOpen) {
      setComment('');
    }
  }, [isOpen]);

  const handleConfirm = () => {
    onConfirm(comment);
  };

  const handleCancel = () => {
    setComment('');
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
          Please provide a comment for this action:
        </DialogContentText>
        <TextField
          autoFocus
          margin="dense"
          id="comment"
          label="Comment"
          type="text"
          fullWidth
          multiline
          rows={4}
          value={comment}
          onChange={(e) => setComment(e.target.value)}
          placeholder="Enter comment..."
          disabled={isProcessing}
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
          disabled={!comment || isProcessing}
        >
          {isProcessing ? <CircularProgress size={24} /> : 'Confirm'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
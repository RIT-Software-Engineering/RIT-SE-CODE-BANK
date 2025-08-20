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
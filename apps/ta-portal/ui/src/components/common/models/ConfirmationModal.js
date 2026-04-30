// src/components/common/models/ConfirmationModal.js
'use client';

import {
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Typography,
} from '@mui/material';

/**
 * A reusable confirmation dialog component styled with Material-UI.
 * @param {boolean} isOpen - Whether the modal is visible.
 * @param {function} onClose - Function to call when the modal is closed or cancelled.
 * @param {function} onConfirm - Function to call when the confirm button is clicked.
 * @param {string} title - The title to display in the modal header.
 * @param {React.ReactNode} children - The content/message to display in the modal body.
 * @param {boolean} isConfirming - Optional flag to show a loading state on the confirm button.
 */
export default function ConfirmationModal({ isOpen, onClose, onConfirm, title, children, isConfirming = false }) {
  if (!isOpen) {
    return null;
  }

  return (
    <Dialog
      open={isOpen}
      onClose={onClose}
      aria-labelledby="confirmation-dialog-title"
      aria-describedby="confirmation-dialog-description"
    >
      <DialogTitle id="confirmation-dialog-title">
        <Typography variant="h2" component="div">{title}</Typography>
      </DialogTitle>
      <DialogContent>
        <div id="confirmation-dialog-description">
          {children}
        </div>
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose} variant="outlined" disabled={isConfirming}
          sx={(theme) => ({
            backgroundColor:
              theme.palette.mode === "dark"
                ? ""
                : "white",

            "&:hover": {
              backgroundColor:
                theme.palette.mode === "dark"
                  ? ""
                  : "#f5f5f5"
            }
          })}
        >
          Cancel
        </Button>
        <Button
          onClick={onConfirm}
          variant="contained"
          color="error"
          disabled={isConfirming}
        >
          {isConfirming ? <CircularProgress size={24} color="inherit" /> : 'Confirm'}
        </Button>
      </DialogActions>
    </Dialog>
  );
}
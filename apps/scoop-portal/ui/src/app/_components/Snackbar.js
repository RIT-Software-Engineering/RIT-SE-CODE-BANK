"use client";
import { Snackbar, Alert } from "@mui/material";

export default function ScooopSnackbar({ open, message, severity, onClose }) {
  return (
    <Snackbar open={open} autoHideDuration={3000} onClose={onClose}>
      <Alert onClose={onClose} severity={severity} sx={{ width: "100%" }}>
        {message}
      </Alert>
    </Snackbar>
  );
}
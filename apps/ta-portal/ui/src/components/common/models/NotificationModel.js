// src/components/common/models/NotificationModel.js
'use client';

import { Snackbar, Alert } from '@mui/material';

/**
 * A Material-UI styled notification component (toast/snackbar).
 * @param {object} props - The component props.
 * @param {object} props.notification - The notification object with a message and type.
 * @param {function} props.onDismiss - Callback to dismiss the notification.
 */
export default function Notification({ notification, onDismiss }) {
  const { message, type } = notification;

  // The Snackbar's onClose handler can handle both auto-hide and click-away events.
  const handleClose = (event, reason) => {
    // Prevents the snackbar from closing when the user clicks away.
    if (reason === 'clickaway') {
      return;
    }
    onDismiss();
  };

  return (
    <Snackbar
      open={!!message}
      autoHideDuration={5000} // Automatically dismisses after 5 seconds
      onClose={handleClose}
      anchorOrigin={{ vertical: 'top', horizontal: 'center' }}
    >
      {message && (
        <Alert
          onClose={onDismiss} // Provides the 'x' button to close the alert
          severity={type || 'info'} // Defaults to 'info' if no type is specified
          variant="filled"
          sx={{ width: '100%' }}
        >
          {message}
        </Alert>
      )}
    </Snackbar>
  );
}
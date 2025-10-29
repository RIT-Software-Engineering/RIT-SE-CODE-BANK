"use client";
import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import useNotifications from '../../hooks/useNotifications';
import { Box, Paper, Typography, Button } from '@mui/material';
import Link from 'next/link';

export default function NotificationsPage() {
  const { currentUser } = useAuth();
  const identifier = currentUser?.username || 'current-user';
  const { loadPreferences } = useNotifications({ appId: 'ta-portal', identifier });

  useEffect(() => {
    // wait for the authenticated user to be available so the hook uses the
    // same identifier as the header popup. This ensures shared preferences
    // (email/slack toggles) remain in sync across the app.
    if (!currentUser || !currentUser.username) return;
    loadPreferences();
  }, [currentUser?.username]);

  return (
    <Box sx={{ p: 4 }}>
      <Box sx={{ maxWidth: 920, mx: 'auto' }}>
        <Paper sx={{ p: 3 }}>
          <Typography variant="h5" sx={{ mb: 1 }}>Notifications</Typography>
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            Notification history is disabled. Manage your delivery preferences on the Settings page.
          </Typography>
          <Button component={Link} href="/Settings" variant="contained">Open Settings</Button>
        </Paper>
      </Box>
    </Box>
  );
}

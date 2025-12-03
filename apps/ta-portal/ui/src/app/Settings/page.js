"use client";
import React, { useEffect } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import useNotifications from '@/hooks/useNotifications';
import { Box, Container, Paper, Stack, Typography, FormControlLabel, Switch, Divider } from '@mui/material';

export default function SettingsPage() {
  const { currentUser } = useAuth();
  const identifier = currentUser?.username || 'current-user';
  const { prefs, loadPreferences, updatePreferences, loadingPrefs } = useNotifications({ appId: 'ta-portal', identifier });

  useEffect(() => {
    if (!currentUser?.username) return;
    loadPreferences();
  }, [currentUser?.username]);

  return (
    <Container maxWidth="md" sx={{ py: 4 }}>
      <Typography variant="h4" sx={{ mb: 3 }}>Settings</Typography>

      <Paper elevation={2} sx={{ p: { xs: 2, md: 3 } }}>
        <Stack spacing={2}>
          <Typography variant="h6">Notifications</Typography>
          <Typography variant="body2" color="text.secondary">
            Choose how you want to receive notifications. Email destinations are predetermined by your account.
          </Typography>
          <Divider />
          <Box sx={{ display: 'flex', gap: 3, alignItems: 'center', flexWrap: 'wrap' }}>
            <FormControlLabel
              sx={{ m: 0 }}
              control={
                <Switch
                  checked={!!prefs.notifyEmail}
                  onChange={() => updatePreferences({ notifyEmail: !prefs.notifyEmail })}
                  disabled={loadingPrefs}
                />
              }
              label="Email"
            />
            <FormControlLabel
              sx={{ m: 0 }}
              control={
                <Switch
                  checked={!!prefs.notifySlack}
                  onChange={() => updatePreferences({ notifySlack: !prefs.notifySlack })}
                  disabled={loadingPrefs}
                />
              }
              label="Slack"
            />
          </Box>
          <Typography variant="caption" color="text.secondary">
            Changes save automatically.
          </Typography>
        </Stack>
      </Paper>
    </Container>
  );
}

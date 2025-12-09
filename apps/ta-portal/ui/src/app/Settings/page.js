"use client";
import React, { useEffect, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import useNotifications from '@/hooks/useNotifications';
import { Box, Container, Paper, Stack, Typography, FormControlLabel, Switch, Divider, Alert, Link } from '@mui/material';

export default function SettingsPage() {
  const { currentUser } = useAuth();
  const identifier = currentUser?.username;
  
  // Don't initialize the hook at all if no user is logged in
  const hookResult = useNotifications({ 
    appId: 'ta-portal', 
    identifier: identifier || '__skip__' // Special value to prevent API calls
  });
  
  const { prefs, loadPreferences, updatePreferences, loadingPrefs } = hookResult;
  const [slackStatus, setSlackStatus] = useState({ inWorkspace: false, loading: true });
  const [showSlackUrl, setShowSlackUrl] = useState(true);
  const SLACK_WORKSPACE_URL = process.env.NEXT_PUBLIC_SLACK_WORKSPACE_URL || 'https://join.slack.com/t/seappdevelopm-rbk8535/shared_invite/zt-3kidmp7af-47tG2jUHffAJA7bp4W_4nA';
  const BASE_API_URL = process.env.NEXT_PUBLIC_BACKEND_URL + process.env.NEXT_PUBLIC_API_EXTENSION;
  const DATABASE_API_EXTENSION = process.env.NEXT_PUBLIC_DATABASE_API_EXTENSION;

  useEffect(() => {
    if (!identifier) {
      return;
    }
    // Note: loadPreferences() is already called by the useNotifications hook when identifier changes
    
    // Fetch feature flag for showing Slack URL
    async function fetchSlackUrlFeature() {
      try {
        const res = await fetch(`${BASE_API_URL}${DATABASE_API_EXTENSION}/feature-flags`);
        const flags = await res.json();
        setShowSlackUrl(flags.SLACK_WORKSPACE_URL !== false);
      } catch (error) {
        console.error('Failed to fetch feature flags:', error);
        setShowSlackUrl(true); // Default to showing URL on error
      }
    }
    
    fetchSlackUrlFeature();
  }, [currentUser?.username]);

  useEffect(() => {
    if (!currentUser?.email) return;
    
    // Check if user is in Slack workspace
    async function checkSlackStatus() {
      try {
        const url = `${BASE_API_URL}/notifications/preferences/ta-portal/${encodeURIComponent(identifier)}/slack-status?email=${encodeURIComponent(currentUser.email)}`;
        console.log('[Settings] Checking Slack status:', { url, email: currentUser.email, identifier });
        const res = await fetch(url);
        const data = await res.json();
        console.log('[Settings] Slack status response:', data);
        setSlackStatus({ inWorkspace: data.inWorkspace, loading: false, reason: data.reason });
      } catch (error) {
        console.error('Failed to check Slack workspace status:', error);
        setSlackStatus({ inWorkspace: false, loading: false, reason: 'error' });
      }
    }
    
    checkSlackStatus();
  }, [currentUser?.email, identifier]);

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
                  checked={!!prefs.notifySlack && slackStatus.inWorkspace}
                  onChange={() => updatePreferences({ notifySlack: !prefs.notifySlack })}
                  disabled={loadingPrefs || slackStatus.loading || !slackStatus.inWorkspace}
                />
              }
              label="Slack"
            />
          </Box>
          {!slackStatus.loading && !slackStatus.inWorkspace && (
            <Alert severity="info" sx={{ mt: 1 }}>
              You need to join the SE-Apps Slack workspace before you can enable Slack notifications.
              {showSlackUrl ? (
                <>
                  {' '}Visit{' '}
                  <Link href={SLACK_WORKSPACE_URL} target="_blank" rel="noopener">
                    {SLACK_WORKSPACE_URL.replace('https://', '')}
                  </Link>
                  {' '}to join.
                </>
              ) : (
                ' Contact the Software Engineering department to request access to the workspace.'
              )}
            </Alert>
          )}
          <Typography variant="caption" color="text.secondary">
            Changes save automatically.
          </Typography>
        </Stack>
      </Paper>
    </Container>
  );
}

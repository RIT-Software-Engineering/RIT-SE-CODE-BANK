import { useEffect, useState } from 'react';
import { getUserFromCookie } from '../utils/auth.js';
import { Box, Switch, FormControlLabel, Alert, Link, CircularProgress } from '@mui/material';
import { CMTJsonFetch } from '../utils/api.js';

export default function SettingsPage() {
    const currentUser = getUserFromCookie();
    const [prefs, setPrefs] = useState({ notifyEmail: false, notifySlack: false });
    const [slackStatus, setSlackStatus] = useState({ inWorkspace: false, loading: true });
    const [loading, setLoading] = useState(true);
        
    // Load preferences on mount
    useEffect(() => {
        if (!currentUser?.uid) return;
        
        async function loadPreferences() {
            try {
                const data = await CMTJsonFetch('GET', `/notifications/preferences/cmt/${currentUser.uid}`);
                setPrefs({
                notifyEmail: data.notifyEmail || false,
                notifySlack: data.notifySlack || false
                });
            } catch (error) {
                console.error('Failed to load preferences:', error);
            } finally {
                setLoading(false);
            }
        }
        
        loadPreferences();
    }, [currentUser?.uid]);
    
    // Check Slack workspace membership
    useEffect(() => {
        if (!currentUser?.email) return;
        
        async function checkSlackMembership() {
            try {
                const data = await CMTJsonFetch('GET', `/notifications/preferences/cmt/${currentUser.uid}/slack-status?email=${encodeURIComponent(currentUser.email)}`);
                setSlackStatus({ 
                inWorkspace: data.inWorkspace, 
                loading: false,
                //   reason: data.reason 
                });
            } catch (error) {
                console.error('Failed to check Slack status:', error);
                setSlackStatus({ inWorkspace: false, loading: false, 
                    // reason: 'error' 
                });
            }
        }
        
        checkSlackMembership();
    }, [currentUser?.email]);
    
    // Update preferences
    async function updatePreference(field, value) {
        try {
            const data = await CMTJsonFetch('PUT', `/notifications/preferences/cmt/${currentUser.uid}`, { [field]: value });
            setPrefs({
                notifyEmail: data.notifyEmail || false,
                notifySlack: data.notifySlack || false
            });
        } catch (error) {
            console.error('Failed to update preference:', error);
        }
    }
    
    if (loading) {
        return <CircularProgress />;
    }
    
    return (
        <Box>
        <h2>Notification Preferences</h2>
        
        {/* Email Toggle */}
        <FormControlLabel
            control={
            <Switch
                checked={prefs.notifyEmail}
                onChange={(e) => updatePreference('notifyEmail', e.target.checked)}
            />
            }
            label="Email Notifications"
        />
        
        {/* Slack Toggle */}
        <FormControlLabel
            control={
            <Switch
                checked={prefs.notifySlack}
                onChange={(e) => updatePreference('notifySlack', e.target.checked)}
                disabled={slackStatus.loading || !slackStatus.inWorkspace}
            />
            }
            label="Slack Notifications"
        />
        
        {/* Slack Workspace Alert */}
        {!slackStatus.loading && !slackStatus.inWorkspace && (
            <Alert severity="info" sx={{ mt: 2 }}>
            You must join the SE-APPS Slack workspace before enabling Slack notifications.
            <Link href="https://rit-gccis-se-apps.slack.com" target="_blank">
                Join Workspace
            </Link>
            </Alert>
        )}
        </Box>
    );
}
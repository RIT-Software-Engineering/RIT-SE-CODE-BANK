"use client";
import React, { useEffect, useMemo, useState } from 'react';
import { useAuth } from '@/contexts/AuthContext';
import useNotifications from '../../hooks/useNotifications';
import NotificationsIcon from '@mui/icons-material/Notifications';
import { Box, Paper, Typography, List, ListItem, Avatar, ListItemAvatar, ListItemText, Button, Divider, Switch, FormControlLabel, TextField, Tooltip, IconButton } from '@mui/material';
import InfoOutlinedIcon from '@mui/icons-material/InfoOutlined'

export default function NotificationsPage() {
  const { currentUser } = useAuth();
  const identifier = currentUser?.username || 'current-user';
  const { history, loadHistory, loadingHistory, loadPreferences, prefs, updatePreferences } = useNotifications({ appId: 'ta-portal', identifier });
  // Notifications are a single domain object; delivery method (email/slack) is metadata
  const [channelFilter, setChannelFilter] = useState('all');
  const [search, setSearch] = useState('');
  const [page, setPage] = useState(0);

  useEffect(() => {
    // wait for the authenticated user to be available so the hook uses the
    // same identifier as the header popup. This ensures shared preferences
    // (email/slack toggles) remain in sync across the app.
    if (!currentUser || !currentUser.username) return;
    loadHistory(0, 20);
    loadPreferences();
  }, [currentUser?.username]);

  const filtered = useMemo(() => {
    const s = search.trim().toLowerCase();
    return history.filter((n) => {
      if (channelFilter !== 'all' && n.channel !== channelFilter) return false;
      if (!s) return true;
      return (n.title + ' ' + n.message).toLowerCase().includes(s);
    });
  }, [history, channelFilter, search]);

  return (
    <Box sx={{ p: 4 }}>
      <Box sx={{ maxWidth: 920, mx: 'auto' }}>
        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 0.5, mb: 2 }}>
          <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <Typography variant="h4">Notifications</Typography>
            <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
              <FormControlLabel sx={{ m: 0 }} control={<Switch checked={!!prefs.notifyEmail} onChange={() => updatePreferences({ notifyEmail: !prefs.notifyEmail })} />} label="Email" />
              <FormControlLabel sx={{ m: 0 }} control={<Switch checked={!!prefs.notifySlack} onChange={() => updatePreferences({ notifySlack: !prefs.notifySlack })} />} label="Slack" />

              <Tooltip
                title={
                  <Box sx={{ maxWidth: 320 }}>
                    <Typography variant="body2" sx={{ fontWeight: 600, color: '#fff' }}>Delivery methods</Typography>
                    <Typography variant="caption" sx={{ display: 'block', color: 'rgba(255,255,255,0.9)', mt: 0.5 }}>Email: send notifications to your RIT email address.</Typography>
                    <Typography variant="caption" sx={{ display: 'block', color: 'rgba(255,255,255,0.9)', mt: 0.5 }}>Slack: send notifications via Slack message to your workspace account.</Typography>
                  </Box>
                }
                arrow
                placement="right"
                componentsProps={{
                  tooltip: {
                    sx: {
                      backgroundColor: 'rgba(33,33,33,0.85)',
                      color: '#fff',
                      boxShadow: '0 6px 18px rgba(0,0,0,0.24)',
                      borderRadius: 6,
                      padding: '12px 14px',
                      fontSize: '0.85rem',
                      maxWidth: 320,
                    }
                  },
                  arrow: {
                    sx: { color: 'rgba(33,33,33,0.85)' }
                  }
                }}
              >
                <IconButton size="small" aria-label="Notification help" sx={{ ml: 0.5 }}>
                  <InfoOutlinedIcon fontSize="small" />
                </IconButton>
              </Tooltip>
            </Box>
          </Box>
        </Box>

        <Paper sx={{ p: 2, mb: 2 }}>
          <Box sx={{ display: 'flex', gap: 2 }}>
            <TextField fullWidth value={search} onChange={(e) => setSearch(e.target.value)} placeholder="Search title or message" variant="outlined" size="small" />
          </Box>
        </Paper>

        <Paper sx={{ p: 2 }}>
          {filtered.length === 0 && !loadingHistory ? (
            <Typography variant="body2" color="text.secondary">No notifications found.</Typography>
          ) : (
            <List>
              {filtered.map((n) => (
                <React.Fragment key={n.id}>
                  <ListItem sx={{ bgcolor: n.read ? 'background.paper' : 'rgba(58, 138, 255, 0.03)', alignItems: 'center', py: 2 }}>
                    <ListItemAvatar>
                      <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                        <NotificationsIcon sx={{ color: 'common.white' }} />
                      </Avatar>
                    </ListItemAvatar>
                    <Box sx={{ flex: 1, ml: 1, minWidth: 0 }}>
                      <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                        <Typography sx={{ fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title}</Typography>
                        <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>{new Date(n.timestamp).toLocaleString()}</Typography>
                      </Box>
                      <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{n.message}</Typography>
                      {n.channel && <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>via {n.channel}</Typography>}
                    </Box>
                  </ListItem>
                  <Divider component="li" />
                </React.Fragment>
              ))}
            </List>
          )}
        </Paper>

        <Box sx={{ mt: 3, textAlign: 'center' }}>
          <Button variant="outlined" onClick={() => { loadHistory(page + 1, 20); setPage((p) => p + 1); }}>Load more</Button>
        </Box>
      </Box>
    </Box>
  );
}

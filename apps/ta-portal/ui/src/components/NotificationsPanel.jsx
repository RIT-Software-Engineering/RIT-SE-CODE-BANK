import React, { useState } from 'react';
import useNotifications from '../hooks/useNotifications';
import { motion, AnimatePresence } from 'framer-motion';
import NotificationsIcon from '@mui/icons-material/Notifications';
import {
  IconButton,
  Badge,
  Box,
  Paper,
  Typography,
  Switch,
  FormControlLabel,
  List,
  ListItem,
  ListItemAvatar,
  Avatar,
  ListItemText,
  Divider,
  Button,
  Tooltip,
  ClickAwayListener,
} from '@mui/material';
import InfoOutlined from '@mui/icons-material/InfoOutlined';

// Lightweight bell + popup panel. Use this in the navbar. Keeps presentation minimal.
export default function NotificationsPanel({ appId, identifier }) {
  const { recent, prefs, loadingPrefs, updatePreferences, loadRecent, loadingRecent } = useNotifications({ appId, identifier });
  const [open, setOpen] = useState(false);
  const [updatingChannel, setUpdatingChannel] = useState(null);

  async function toggleChannel(key) {
    setUpdatingChannel(key);
    try {
      await updatePreferences({ [key]: !prefs[key] });
    } catch (e) {
      // optional: show toast on error
      console.error('failed to update prefs', e);
    } finally {
      setUpdatingChannel(null);
    }
  }

  const unreadCount = recent.filter((r) => !r.read).length;

  return (
    <Box sx={{ position: 'relative' }}>
  <IconButton color="inherit" aria-label="Notifications" onClick={(e) => { e.stopPropagation(); setOpen((v) => { const next = !v; if (!v) loadRecent(5); return next; }); }}>
        <Badge badgeContent={unreadCount} color="secondary">
          <NotificationsIcon />
        </Badge>
      </IconButton>

      <AnimatePresence>
        {open && (
          <ClickAwayListener onClickAway={() => setOpen(false)}>
            <motion.div initial={{ opacity: 0, y: -6 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -6 }} style={{ position: 'absolute', right: 16, marginTop: 12, zIndex: 1300 }}>
            <Paper elevation={6} sx={{ width: { xs: 'calc(100vw - 32px)', sm: 360 }, maxWidth: 600, borderRadius: 2, overflow: 'hidden' }}>
              <Box sx={{ p: 2, display: 'flex', flexDirection: 'column', gap: 0.5, bgcolor: 'background.paper' }}>
                <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                  <Typography variant="subtitle1">Notifications</Typography>
                  <Box sx={{ display: 'flex', gap: 1, alignItems: 'center' }}>
                    <FormControlLabel sx={{ m: 0 }} control={<Switch size="small" checked={!!prefs.notifyEmail} onChange={() => toggleChannel('notifyEmail')} disabled={loadingPrefs || updatingChannel === 'notifyEmail'} />} label={<Typography variant="caption">Email</Typography>} />
                    <FormControlLabel sx={{ m: 0 }} control={<Switch size="small" checked={!!prefs.notifySlack} onChange={() => toggleChannel('notifySlack')} disabled={loadingPrefs || updatingChannel === 'notifySlack'} />} label={<Typography variant="caption">Slack</Typography>} />
                    <Tooltip
                      title={
                        <Box sx={{ maxWidth: 320 }}>
                          <Typography variant="body2" sx={{ fontWeight: 600, color: '#fff' }}>Delivery methods</Typography>
                          <Typography variant="caption" sx={{ display: 'block', color: 'rgba(255,255,255,0.9)', mt: 0.5 }}>Email: send notifications to your RIT email address.</Typography>
                          <Typography variant="caption" sx={{ display: 'block', color: 'rgba(255,255,255,0.9)', mt: 0.5 }}>Slack: send notifications via Slack message to your workspace account.</Typography>
                        </Box>
                      }
                      arrow
                      placement="bottom"
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
                      <IconButton size="small" sx={{ p: 0.5, ml: 0.5 }}><InfoOutlined fontSize="small" /></IconButton>
                    </Tooltip>
                  </Box>
                </Box>
                {/* explanatory text removed — tooltip provides details */}
              </Box>

              <Divider />

              <Box sx={{ maxHeight: 320, overflow: 'auto' }}>
                {loadingRecent ? (
                  <Box sx={{ p: 3 }}><Typography variant="body2">Loading…</Typography></Box>
                ) : recent.length === 0 ? (
                  <Box sx={{ p: 3 }}><Typography variant="body2" color="text.secondary">No recent notifications</Typography></Box>
                ) : (
                  <List disablePadding>
                    {recent.map((n) => (
                      <React.Fragment key={n.id}>
                        <ListItem sx={{ bgcolor: n.read ? 'background.paper' : 'rgba(58, 138, 255, 0.03)', alignItems: 'center', py: 2 }}>
                          <ListItemAvatar>
                            <Avatar sx={{ bgcolor: 'primary.main', width: 40, height: 40 }}>
                              <NotificationsIcon sx={{ color: 'common.white' }} fontSize="small" />
                            </Avatar>
                          </ListItemAvatar>
                          <Box sx={{ flex: 1, ml: 1, minWidth: 0 }}>
                            <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: 2 }}>
                              <Typography variant="body2" sx={{ color: 'text.primary', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{n.title}</Typography>
                              <Typography variant="caption" color="text.secondary" sx={{ flexShrink: 0 }}>{relativeTime(n.timestamp)}</Typography>
                            </Box>
                            <Typography variant="body2" sx={{ color: 'text.secondary', mt: 0.5, overflow: 'hidden', textOverflow: 'ellipsis', display: '-webkit-box', WebkitLineClamp: 2, WebkitBoxOrient: 'vertical' }}>{n.message}</Typography>
                            {n.channel && <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: 'block' }}>via {capitalize(n.channel)}</Typography>}
                          </Box>
                        </ListItem>
                        <Divider component="li" />
                      </React.Fragment>
                    ))}
                  </List>
                )}
              </Box>

              <Box sx={{ p: 1, textAlign: 'right' }}>
                <Button size="small" href="/Notifications">View all</Button>
              </Box>
            </Paper>
          </motion.div>
          </ClickAwayListener>
        )}
      </AnimatePresence>
    </Box>
  );
}

function relativeTime(iso) {
  try {
    const d = new Date(iso);
    const diff = Math.floor((Date.now() - d.getTime()) / 1000);
    if (diff < 60) return `${diff}s ago`;
    if (diff < 3600) return `${Math.floor(diff / 60)}m ago`;
    if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`;
    return `${Math.floor(diff / 86400)}d ago`;
  } catch (e) {
    return iso;
  }
}

function capitalize(s) {
  if (!s || typeof s !== 'string') return '';
  return s.charAt(0).toUpperCase() + s.slice(1);
}

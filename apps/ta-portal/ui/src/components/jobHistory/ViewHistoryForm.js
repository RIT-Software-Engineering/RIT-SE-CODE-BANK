// src/components/comments/ViewHistoryForm.js
'use client';

import { useState, useEffect } from 'react';
import { getComments } from '@/services/db-apis';
import { formatTimestamp } from '@/utils/dateTimeUtils';
import {
  Alert,
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  IconButton,
  Paper,
  Typography,
  Divider,
} from '@mui/material';
import { Close as CloseIcon } from '@mui/icons-material';

/**
 * ViewHistoryForm component for displaying a history of stat changes related to an item.
 *
 * Fetches and renders comments from the database for a given foreign key and table.
 * Shows comment details such as status, author (for admin/employer roles), timestamp,
 * and the comment text. Also handles loading and error states gracefully.
 *
 * @param {Object} props - Component props
 * @param {string|number} props.foreignKey - Identifier of the related item to fetch comments for
 * @param {string} props.foreignTableName - Name of the database table to query for comments
 * @param {string} props.itemTitle - Title of the related item, displayed in the dialog header
 * @param {string} [props.itemSubtitle] - Optional subtitle for additional context
 * @param {Object.<string, string>} props.statusEnumMap - Map of status values to human-readable labels
 * @param {string} props.userRole - Role of the current user (e.g., "ADMIN", "EMPLOYER", "CANDIDATE")
 * @param {Function} props.onClose - Callback to close the dialog
 */

export default function ViewHistoryForm({ 
  foreignKey, 
  foreignTableName,
  itemTitle,
  itemSubtitle,
  statusEnumMap,
  userRole, 
  onClose 
}) {
  const [comments, setComments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    async function fetchComments() {
      if (!foreignKey || !foreignTableName) return;
      try {
        setLoading(true);
        const data = await getComments(foreignTableName, foreignKey);
        setComments(data);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch notes:", err);
        setError('Could not load note history.');
      } finally {
        setLoading(false);
      }
    }

    fetchComments();
  }, [foreignKey, foreignTableName]);

  const renderContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      );
    }
    if (error) {
      return <Alert severity="error" sx={{ m: 2 }}>{error}</Alert>;
    }
    if (comments.length === 0) {
      return (
        <Typography color="text.secondary" sx={{ p: 4, textAlign: 'center' }}>
          No notes found for this item.
        </Typography>
      );
    }
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {comments.map((comment) => (
          <Paper key={comment.id} variant="outlined" sx={{ p: 2, bgcolor: 'background.default' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', background:'background.default', mb: 1 }}>
              <Box>
                <Typography variant="h3" component="p" sx={{ fontWeight: 'bold' }}>
                  {statusEnumMap[comment.status] || comment.status}
                </Typography>
                {(userRole === 'ADMIN' || userRole === 'EMPLOYER') && (
                  <Typography variant="body2" color="text.secondary" sx={{ mt: 0.5 }}>
                    By: <Box component="span" sx={{ fontWeight: 'medium' }}>{comment.author}</Box>
                  </Typography>
                )}
              </Box>
              <Typography variant="caption" color="text.secondary">
                {formatTimestamp(comment.timestamp)}
              </Typography>
            </Box>
            <Divider sx={{ my: 1 }} />
            <Typography variant="body1" sx={{ fontStyle: 'italic', color: 'text.primary' }}>
              &quot;{comment.comment}&quot;
            </Typography>
          </Paper>
        ))}
      </Box>
    );
  };

  return (
    <Dialog open={true} onClose={onClose} fullWidth maxWidth="md">
      <DialogTitle sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <Box>
          <Typography variant="h2" component="div">{itemTitle}</Typography>
          <Typography color="text.secondary">{itemSubtitle}</Typography>
        </Box>
        <IconButton onClick={onClose}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>
      <DialogContent dividers>
        {renderContent()}
      </DialogContent>
      <DialogActions sx={{ p: 2 }}>
        <Button onClick={onClose}>Close</Button>
      </DialogActions>
    </Dialog>
  );
}
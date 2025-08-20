// src/components/comments/ViewableCommentForm.js
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

export default function ViewableCommentForm({ 
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
        console.error("Failed to fetch comments:", err);
        setError('Could not load comment history.');
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
          No comments found for this item.
        </Typography>
      );
    }
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {comments.map((comment) => (
          <Paper key={comment.id} variant="outlined" sx={{ p: 2, bgcolor: 'action.hover' }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 1 }}>
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
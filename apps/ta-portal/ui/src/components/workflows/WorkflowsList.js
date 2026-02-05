// src/components/workflows/WorkflowsList.js
'use client';

import { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  List,
  ListItem,
  ListItemText,
  ListItemIcon,
  Chip,
  CircularProgress,
  Paper,
  Collapse,
} from '@mui/material';
import AssignmentIcon from '@mui/icons-material/Assignment';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';
import ExpandLessIcon from '@mui/icons-material/ExpandLess';
import { getUserWorkflows } from '@/services/workflow-apis';
import { useNotification } from '@/contexts/NotificationContext';

/**
 * Displays a list of workflows for the current user
 * @param {Object} props - Component props
 * @param {Object} props.user - Current user object
 * @returns {JSX.Element} WorkflowsList component
 */
export default function WorkflowsList({ user }) {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [expandedWorkflow, setExpandedWorkflow] = useState(null);
  const { showNotification } = useNotification();

  useEffect(() => {
    const fetchWorkflows = async () => {
      try {
        console.log('Attempting to fetch workflows for user:', user);
        if (!user?.username) {
          console.warn('No username available');
          setLoading(false);
          return;
        }
        const userWorkflows = await getUserWorkflows(user.username);
        console.log('Received workflows:', userWorkflows);
        setWorkflows(userWorkflows);
      } catch (error) {
        console.error('Error fetching workflows:', error);
        console.error('Error details:', {
          message: error.message,
          response: error.response?.data
        });
        showNotification('Failed to load workflows: ' + error.message, 'error');
      } finally {
        setLoading(false);
      }
    };

    fetchWorkflows();
  }, [user]);

  const handleExpandWorkflow = (workflowId) => {
    setExpandedWorkflow(expandedWorkflow === workflowId ? null : workflowId);
  };

  const getStateColor = (stateType) => {
    switch (stateType?.toLowerCase()) {
      case 'completed':
        return 'success';
      case 'in_progress':
        return 'primary';
      case 'not_started':
        return 'default';
      default:
        return 'default';
    }
  };

  if (loading) {
    return (
      <Box display="flex" justifyContent="center" alignItems="center" minHeight="200px">
        <CircularProgress />
      </Box>
    );
  }

  if (!workflows.length) {
    return (
      <Paper
        sx={{
          p: 3,
          textAlign: 'center',
          bgcolor: 'background.default',
          borderRadius: 2
        }}
      >
        <Typography variant="body1" color="text.secondary">
          No active workflows found
        </Typography>
      </Paper>
    );
  }

  return (
    <Box sx={{ width: '100%' }}>
      {workflows.map((workflow) => (
        <Paper
          key={workflow.id}
          elevation={1}
          sx={{ mb: 2, p: 2 }}
        >
          {/* Workflow Header */}
          <Box sx={{ display: 'flex', alignItems: 'center', mb: 2 }}>
            <AssignmentIcon color="primary" sx={{ mr: 1 }} />
            <Box>
              <Typography variant="h6" component="h3">
                {workflow.name}
              </Typography>
              <Typography variant="body2" color="text.secondary">
                {workflow.description}
              </Typography>
            </Box>
          </Box>

          {/* Actions List */}
          <Typography variant="subtitle2" color="text.secondary" sx={{ mb: 1 }}>
            Actions:
          </Typography>
          
          {workflow.actions && workflow.actions.length > 0 ? (
            <Box sx={{ pl: 2 }}>
              {workflow.actions.map((action, index) => (
                <Box key={action.id || index} sx={{ mb: 1 }}>
                  <Typography variant="body1" sx={{ fontWeight: 500 }}>
                    {index + 1}. {action.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ pl: 2 }}>
                    {action.description}
                  </Typography>
                  <Box sx={{ pl: 2, mt: 0.5 }}>
                    <Chip
                      label={action.status || 'not_started'}
                      size="small"
                      color={getStateColor(action.status)}
                    />
                  </Box>
                </Box>
              ))}
            </Box>
          ) : (
            <Typography variant="body2" color="text.secondary" sx={{ pl: 2 }}>
              No actions available
            </Typography>
          )}
        </Paper>
      ))}
    </Box>
  );
}
// src/components/workflows/WorkflowVisualization.js
'use client';

import React, { useState, useEffect } from 'react';
import {
  Box,
  Typography,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  Button,
  Switch,
  FormControlLabel,
  Chip,
  Paper,
  Grid,
  IconButton,
  Tooltip,
  Fade,
  CircularProgress
} from '@mui/material';
import {
  Close as CloseIcon,
  Assignment as AssignmentIcon,
  Timeline as TimelineIcon,
  Event as EventIcon
} from '@mui/icons-material';
import { getUserWorkflows } from '@/services/workflow-apis';

// Color mapping for different action states
const ACTION_STATE_COLORS = {
  completed: {
    backgroundColor: '#4caf50',
    color: '#ffffff',
    borderColor: '#388e3c',
    glow: 'rgba(76, 175, 80, 0.3)'
  },
  'in-progress': {
    backgroundColor: '#ff9800',
    color: '#ffffff', 
    borderColor: '#f57c00',
    glow: 'rgba(255, 152, 0, 0.3)'
  },
  pending: {
    backgroundColor: '#424242',
    color: '#ffffff',
    borderColor: '#212121',
    glow: 'rgba(66, 66, 66, 0.3)'
  },
  blocked: {
    backgroundColor: '#f44336',
    color: '#ffffff',
    borderColor: '#d32f2f',
    glow: 'rgba(244, 67, 54, 0.3)'
  },
  warning: {
    backgroundColor: '#ff5722',
    color: '#ffffff',
    borderColor: '#d84315',
    glow: 'rgba(255, 87, 34, 0.3)'
  },
  review: {
    backgroundColor: '#9c27b0',
    color: '#ffffff',
    borderColor: '#7b1fa2',
    glow: 'rgba(156, 39, 176, 0.3)'
  },
  approved: {
    backgroundColor: '#00c853',
    color: '#ffffff',
    borderColor: '#00a544',
    glow: 'rgba(0, 200, 83, 0.3)'
  }
};

// Role-specific workflow descriptions
const getRoleSpecificDescription = (userRole) => {
  switch (userRole) {
    case 'CANDIDATE':
      return 'Your application and hiring workflows';
    case 'EMPLOYEE':
      return 'Your task assignments and project workflows';
    case 'EMPLOYER':
      return 'Hiring processes and candidate management workflows';
    case 'ADMIN':
      return 'System administration and oversight workflows';
    default:
      return 'Your active workflows and processes';
  }
};

const ActionBubble = ({ action, onClick, isSelected }) => {
  const stateColor = ACTION_STATE_COLORS[action.status] || ACTION_STATE_COLORS.pending;
  
  return (
    <Tooltip title={`${action.name} - ${action.status}`} arrow>
      <Box
        onClick={() => onClick(action)}
        sx={{
          minWidth: '140px',
          height: '60px',
          borderRadius: '30px',
          backgroundColor: stateColor.backgroundColor,
          color: stateColor.color,
          border: `2px solid ${stateColor.borderColor}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          cursor: 'pointer',
          transition: 'all 0.3s ease-in-out',
          boxShadow: isSelected 
            ? `0 0 20px ${stateColor.glow}` 
            : `0 4px 8px rgba(0,0,0,0.1)`,
          transform: isSelected ? 'scale(1.05)' : 'scale(1)',
          margin: '8px',
          position: 'relative',
          '&:hover': {
            transform: 'scale(1.1)',
            boxShadow: `0 0 25px ${stateColor.glow}`,
            zIndex: 10
          },
          '&:active': {
            transform: 'scale(0.95)'
          }
        }}
      >
        <Typography variant="body2" fontWeight="600" textAlign="center" px={2}>
          {action.name}
        </Typography>
        
        {/* Status indicator dot */}
        <Box
          sx={{
            position: 'absolute',
            top: '-6px',
            right: '-6px',
            width: '16px',
            height: '16px',
            borderRadius: '50%',
            backgroundColor: stateColor.borderColor,
            border: '2px solid white',
            zIndex: 11
          }}
        />
      </Box>
    </Tooltip>
  );
};

const WorkflowCard = ({ workflow, viewMode, onActionClick, selectedAction }) => {
  return (
    <Paper
      elevation={3}
      sx={{
        p: 3,
        mb: 3,
        borderRadius: 2,
        backgroundColor: '#fafafa',
        border: '1px solid #e0e0e0'
      }}
    >
      <Typography variant="h6" fontWeight="600" mb={2} color="primary">
        {workflow.name}
      </Typography>
      
      {workflow.description && (
        <Typography variant="body2" color="text.secondary" mb={2}>
          {workflow.description}
        </Typography>
      )}

      {/* Actions Display */}
      <Box sx={{ mt: 2 }}>
        {viewMode === 'milestones' && (
          <Box sx={{ 
            display: 'flex', 
            flexWrap: 'wrap', 
            gap: 1,
            justifyContent: 'flex-start'
          }}>
            {workflow.actions?.map((action) => (
              <ActionBubble
                key={action.id}
                action={action}
                onClick={onActionClick}
                isSelected={selectedAction?.id === action.id}
              />
            ))}
          </Box>
        )}

        {viewMode === 'gantt' && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" mb={1}>Timeline View</Typography>
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 1 }}>
              {workflow.actions?.map((action, index) => (
                <Box key={action.id} sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
                  <Box sx={{ minWidth: '30px', textAlign: 'center' }}>
                    <Typography variant="caption" color="text.secondary">
                      {index + 1}
                    </Typography>
                  </Box>
                  <ActionBubble
                    action={action}
                    onClick={onActionClick}
                    isSelected={selectedAction?.id === action.id}
                  />
                </Box>
              ))}
            </Box>
          </Box>
        )}

        {viewMode === 'calendar' && (
          <Box sx={{ mt: 2 }}>
            <Typography variant="subtitle2" mb={1}>Calendar View</Typography>
            <Grid container spacing={1}>
              {workflow.actions?.map((action) => (
                <Grid item xs={12} sm={6} md={4} key={action.id}>
                  <ActionBubble
                    action={action}
                    onClick={onActionClick}
                    isSelected={selectedAction?.id === action.id}
                  />
                </Grid>
              ))}
            </Grid>
          </Box>
        )}
      </Box>

      {/* Workflow Stats */}
      <Box sx={{ mt: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
        <Chip 
          label={`${workflow.actions?.filter(a => a.status === 'completed').length || 0} Completed`}
          color="success"
          variant="outlined"
          size="small"
        />
        <Chip 
          label={`${workflow.actions?.filter(a => a.status === 'in-progress').length || 0} In Progress`}
          color="warning"
          variant="outlined"
          size="small"
        />
        <Chip 
          label={`${workflow.actions?.filter(a => a.status === 'pending').length || 0} Pending`}
          color="default"
          variant="outlined"
          size="small"
        />
      </Box>
    </Paper>
  );
};

const WorkflowVisualization = ({ open, onClose, user }) => {
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(false);
  const [viewMode, setViewMode] = useState('milestones');
  const [selectedAction, setSelectedAction] = useState(null);
  const [error, setError] = useState(null);

  useEffect(() => {
    if (open && user?.username) {
      fetchWorkflows();
    }
  }, [open, user?.username]);

  const fetchWorkflows = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getUserWorkflows(user.username);
      setWorkflows(data || []);
    } catch (err) {
      console.error('Failed to fetch workflows:', err);
      setError('Failed to load workflows. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleActionClick = (action) => {
    setSelectedAction(selectedAction?.id === action.id ? null : action);
  };

  const handleViewModeChange = (mode) => {
    setViewMode(mode);
    setSelectedAction(null); // Clear selection when changing view mode
  };

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="lg"
      fullWidth
      PaperProps={{
        sx: {
          minHeight: '80vh',
          backgroundColor: '#f5f5f5'
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        backgroundColor: '#1976d2',
        color: 'white',
        mb: 0
      }}>
        <Box>
          <Typography variant="h5" fontWeight="600">
            All Actions
          </Typography>
          <Typography variant="body2" sx={{ opacity: 0.9, mt: 0.5 }}>
            {getRoleSpecificDescription(user?.role)}
          </Typography>
        </Box>
        
        {/* View Mode Toggles */}
        <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
          <FormControlLabel
            control={
              <Switch
                checked={viewMode === 'milestones'}
                onChange={() => handleViewModeChange('milestones')}
                size="small"
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <AssignmentIcon fontSize="small" />
                <Typography variant="body2">Milestones</Typography>
              </Box>
            }
            sx={{ color: 'white', '& .MuiSwitch-track': { backgroundColor: 'rgba(255,255,255,0.3)' } }}
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={viewMode === 'gantt'}
                onChange={() => handleViewModeChange('gantt')}
                size="small"
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <TimelineIcon fontSize="small" />
                <Typography variant="body2">Gantt</Typography>
              </Box>
            }
            sx={{ color: 'white', '& .MuiSwitch-track': { backgroundColor: 'rgba(255,255,255,0.3)' } }}
          />
          
          <FormControlLabel
            control={
              <Switch
                checked={viewMode === 'calendar'}
                onChange={() => handleViewModeChange('calendar')}
                size="small"
              />
            }
            label={
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                <EventIcon fontSize="small" />
                <Typography variant="body2">Calendar</Typography>
              </Box>
            }
            sx={{ color: 'white', '& .MuiSwitch-track': { backgroundColor: 'rgba(255,255,255,0.3)' } }}
          />
          
          <IconButton onClick={onClose} sx={{ color: 'white' }}>
            <CloseIcon />
          </IconButton>
        </Box>
      </DialogTitle>

      <DialogContent sx={{ p: 3, backgroundColor: '#f5f5f5' }}>
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}

        {error && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography color="error" variant="h6">
              {error}
            </Typography>
            <Button onClick={fetchWorkflows} variant="contained" sx={{ mt: 2 }}>
              Retry
            </Button>
          </Box>
        )}

        {!loading && !error && workflows.length === 0 && (
          <Box sx={{ textAlign: 'center', py: 4 }}>
            <Typography variant="h6" color="text.secondary">
              No active workflows found
            </Typography>
            <Typography variant="body2" color="text.secondary" mt={1}>
              Your workflows will appear here when available
            </Typography>
          </Box>
        )}

        {!loading && !error && workflows.length > 0 && (
          <Fade in={true}>
            <Box>
              {workflows.map((workflow) => (
                <WorkflowCard
                  key={workflow.id}
                  workflow={workflow}
                  viewMode={viewMode}
                  onActionClick={handleActionClick}
                  selectedAction={selectedAction}
                />
              ))}
            </Box>
          </Fade>
        )}

        {/* Action Details Panel */}
        {selectedAction && (
          <Paper
            elevation={2}
            sx={{
              position: 'fixed',
              bottom: 20,
              right: 20,
              p: 2,
              maxWidth: 300,
              backgroundColor: 'white',
              border: '2px solid #1976d2',
              zIndex: 1300
            }}
          >
            <Typography variant="h6" fontWeight="600" mb={1}>
              {selectedAction.name}
            </Typography>
            <Chip 
              label={selectedAction.status} 
              color={
                selectedAction.status === 'completed' ? 'success' :
                selectedAction.status === 'in-progress' ? 'warning' : 'default'
              }
              size="small"
              sx={{ mb: 1 }}
            />
            <Typography variant="body2" color="text.secondary">
              Click anywhere to close this panel
            </Typography>
          </Paper>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default WorkflowVisualization;
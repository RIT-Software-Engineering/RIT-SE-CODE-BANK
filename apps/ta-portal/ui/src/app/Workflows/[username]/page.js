// src/app/Workflows/[username]/page.js
'use client';

import { useState, useEffect } from 'react';
import { useParams } from 'next/navigation';
import {
  Box,
  Container,
  Typography,
  Paper,
  Chip,
  CircularProgress,
  Button,
  Alert,
  Popover,
  Dialog,
  DialogTitle,
  DialogContent,
  DialogActions,
  IconButton,
  TextField,
  Divider,
  Snackbar,
  Menu,
  MenuItem,
  Fab
} from '@mui/material';
import { 
  ArrowBack as ArrowBackIcon,
  Close as CloseIcon,
  Event as EventIcon,
  Assignment as AssignmentIcon,
  Upload as UploadIcon,
  CheckCircle as CheckCircleIcon,
  PlayArrow as PlayArrowIcon,
  Add as AddIcon,
  MoreVert as MoreVertIcon
} from '@mui/icons-material';
import Link from 'next/link';
import { 
  getUserWorkflows, 
  getUserActions, 
  completeAction,
  updateActionState,
  createAction, 
  createWorkflow,
  getUserWorkflowStates,
  createWorkflowState,
  getOrCreateWorkflowState,
  getWorkflowStateWithActions
} from '@/services/workflow-apis';

// Simple color mapping for action states
const ACTION_COLORS = {
  completed: '#4caf50',
  'in-progress': '#ff9800',
  pending: '#757575',
  blocked: '#f44336',
  warning: '#ff5722'
};

// Function to generate dynamic action content based on action name
const getActionContent = (actionName) => {
  const name = actionName.toLowerCase();
  
  if (name.includes('interview') || name.includes('schedule')) {
    return {
      description: 'Schedule and conduct an interview with the candidate',
      startDate: '10/15/2025',
      dueDate: '10/25/2025',
      project: 'Software Engineering Position',
      submissionType: 'Individual',
      submissionStatus: 'Pending scheduling',
      modalTitle: 'Schedule Interview',
      fileTypes: 'No file submission required',
      uploadText: 'Schedule interview through calendar system'
    };
  }
  
  if (name.includes('resume') || name.includes('application')) {
    return {
      description: 'Submit your resume and application materials',
      startDate: '09/01/2025',
      dueDate: '09/30/2025',
      project: 'Software Engineering Application',
      submissionType: 'Individual',
      submissionStatus: 'Submitted',
      modalTitle: 'Submit Application',
      fileTypes: '.pdf, .doc, .docx',
      uploadText: 'Upload resume and cover letter'
    };
  }
  
  if (name.includes('screening')) {
    return {
      description: 'Complete initial screening questionnaire and assessment',
      startDate: '10/01/2025',
      dueDate: '10/10/2025',
      project: 'Candidate Evaluation Process',
      submissionType: 'Individual',
      submissionStatus: 'Completed',
      modalTitle: 'Complete Screening',
      fileTypes: 'Online form submission',
      uploadText: 'Complete screening questionnaire online'
    };
  }
  
  if (name.includes('background')) {
    return {
      description: 'Provide documentation for background check process',
      startDate: '11/01/2025',
      dueDate: '11/15/2025',
      project: 'Employment Verification',
      submissionType: 'Individual',
      submissionStatus: 'Awaiting documentation',
      modalTitle: 'Background Check',
      fileTypes: '.pdf (ID, references)',
      uploadText: 'Upload required background check documents'
    };
  }
  
  if (name.includes('offer')) {
    return {
      description: 'Review and respond to employment offer',
      startDate: '11/20/2025',
      dueDate: '11/30/2025',
      project: 'Employment Agreement',
      submissionType: 'Individual',
      submissionStatus: 'Offer pending',
      modalTitle: 'Review Offer',
      fileTypes: '.pdf (signed offer)',
      uploadText: 'Upload signed offer letter'
    };
  }
  
  if (name.includes('presentation') || name.includes('final')) {
    return {
      description: 'Prepare and submit the final project presentation',
      startDate: '11/20/2025',
      dueDate: '12/01/2025',
      project: 'CareCraze Online Patient Care Coordination Platform',
      submissionType: 'Team',
      submissionStatus: 'No submissions',
      modalTitle: 'Submit Final Presentation',
      fileTypes: '.pdf, .pptx',
      uploadText: 'Upload final presentation files'
    };
  }
  
  if (name.includes('peer evaluation') || name.includes('evaluation')) {
    return {
      description: 'Complete peer evaluation for team members',
      startDate: '10/15/2025',
      dueDate: '10/22/2025',
      project: 'Team Assessment Process',
      submissionType: 'Individual',
      submissionStatus: 'Pending completion',
      modalTitle: 'Submit Peer Evaluation',
      fileTypes: 'Online form',
      uploadText: 'Complete peer evaluation form online'
    };
  }
  
  if (name.includes('roles') || name.includes('team member')) {
    return {
      description: 'Define and assign team member roles and responsibilities',
      startDate: '09/15/2025',
      dueDate: '09/25/2025',
      project: 'Team Organization',
      submissionType: 'Team',
      submissionStatus: 'In progress',
      modalTitle: 'Define Team Roles',
      fileTypes: '.pdf, .doc',
      uploadText: 'Upload team roles document'
    };
  }
  
  if (name.includes('analysis') || name.includes('competitor')) {
    return {
      description: 'Conduct competitive analysis and market research',
      startDate: '10/01/2025',
      dueDate: '10/15/2025',
      project: 'Market Research Phase',
      submissionType: 'Team',
      submissionStatus: 'Research in progress',
      modalTitle: 'Submit Competitive Analysis',
      fileTypes: '.pdf, .xlsx',
      uploadText: 'Upload analysis report and data'
    };
  }
  
  if (name.includes('risk') || name.includes('assessment')) {
    return {
      description: 'Identify and assess project risks and mitigation strategies',
      startDate: '10/10/2025',
      dueDate: '10/20/2025',
      project: 'Risk Management',
      submissionType: 'Team',
      submissionStatus: 'Risk analysis needed',
      modalTitle: 'Submit Risk Assessment',
      fileTypes: '.pdf, .xlsx',
      uploadText: 'Upload risk assessment matrix'
    };
  }
  
  // Default fallback
  return {
    description: `Complete the ${actionName} task`,
    startDate: '10/01/2025',
    dueDate: '10/31/2025',
    project: 'Current Project',
    submissionType: 'Team',
    submissionStatus: 'Pending',
    modalTitle: actionName,
    fileTypes: '.pdf, .doc',
    uploadText: 'Upload required files'
  };
};

const ActionBubble = ({ action, onActionClick, onActionMenuClick }) => {
  const backgroundColor = ACTION_COLORS[action.status] || ACTION_COLORS.pending;
  
  return (
    <Box
      sx={{
        minWidth: '140px',
        height: '50px',
        borderRadius: '25px',
        backgroundColor,
        color: 'white',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'space-between',
        margin: '8px',
        px: 2,
        boxShadow: 2,
        cursor: 'pointer',
        transition: 'all 0.2s ease-in-out',
        position: 'relative',
        '&:hover': {
          transform: 'scale(1.05)',
          boxShadow: 4,
        }
      }}
    >
      <Box
        onClick={(event) => onActionClick(action, event)}
        sx={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          flex: 1,
          height: '100%'
        }}
      >
        <Typography variant="body2" fontWeight="500" textAlign="center">
          {action.name}
        </Typography>
      </Box>
      
      {/* Status Icon */}
      <Box sx={{ ml: 1 }}>
        {action.status === 'completed' && (
          <CheckCircleIcon sx={{ fontSize: 18, opacity: 0.8 }} />
        )}
        {action.status === 'in-progress' && (
          <PlayArrowIcon sx={{ fontSize: 18, opacity: 0.8 }} />
        )}
      </Box>
      
      {/* Action Menu Button */}
      <IconButton
        size="small"
        onClick={(event) => onActionMenuClick(event, action)}
        sx={{ 
          color: 'white', 
          opacity: 0.7,
          ml: 0.5,
          '&:hover': {
            opacity: 1,
            backgroundColor: 'rgba(255,255,255,0.1)'
          }
        }}
      >
        <MoreVertIcon sx={{ fontSize: 16 }} />
      </IconButton>
    </Box>
  );
};

// Action Detail Popup Component
const ActionPopup = ({ action, anchorEl, open, onClose, onViewAction, onCompleteAction, onStartAction, completingAction }) => {
  if (!action) return null;
  
  const actionContent = getActionContent(action.name);

  return (
    <Popover
      open={open}
      anchorEl={anchorEl}
      onClose={onClose}
      anchorOrigin={{
        vertical: 'bottom',
        horizontal: 'center',
      }}
      transformOrigin={{
        vertical: 'top',
        horizontal: 'center',
      }}
      PaperProps={{
        sx: {
          p: 2,
          minWidth: 320,
          backgroundColor: '#2c2c2c',
          color: 'white',
          border: '1px solid #555'
        }
      }}
    >
      <Typography variant="h6" fontWeight="600" mb={1}>
        {action.name}
      </Typography>
      
      <Chip 
        label={action.status || 'pending'} 
        size="small"
        sx={{
          mb: 2,
          backgroundColor: ACTION_COLORS[action.status] || ACTION_COLORS.pending,
          color: 'white'
        }}
      />
      
      <Typography variant="body2" color="#ccc" mb={1}>
        {actionContent.description}
      </Typography>
      
      <Box sx={{ mb: 2 }}>
        <Typography variant="body2" color="#aaa">
          <EventIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
          Starts: {actionContent.startDate}
        </Typography>
        <Typography variant="body2" color="#aaa">
          <EventIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
          Due: {actionContent.dueDate}
        </Typography>
      </Box>

      <Typography variant="body2" color="#aaa" mb={1}>
        Project: {actionContent.project}
      </Typography>
      
      <Typography variant="body2" color="#aaa" mb={2}>
        Submission Type: {actionContent.submissionType}
      </Typography>
      
      <Typography variant="body2" color="#ccc" mb={2}>
        {actionContent.submissionStatus}
      </Typography>

      {/* Action Buttons */}
      <Box sx={{ display: 'flex', gap: 1, mb: 1 }}>
        {action.status === 'pending' && (
          <Button 
            variant="outlined" 
            size="small"
            startIcon={<PlayArrowIcon />}
            onClick={() => onStartAction(action)}
            sx={{ 
              borderColor: '#ff9800',
              color: '#ff9800',
              '&:hover': { 
                borderColor: '#f57c00',
                backgroundColor: 'rgba(255, 152, 0, 0.1)'
              }
            }}
          >
            Start Action
          </Button>
        )}
        
        {(action.status === 'in-progress' || action.status === 'pending') && (
          <Button 
            variant="contained" 
            size="small"
            startIcon={<CheckCircleIcon />}
            onClick={() => onCompleteAction(action)}
            disabled={completingAction === action.id}
            sx={{ 
              backgroundColor: '#4caf50',
              '&:hover': { backgroundColor: '#388e3c' }
            }}
          >
            {completingAction === action.id ? 'Completing...' : 'Complete'}
          </Button>
        )}
        
        {action.status === 'completed' && (
          <Chip 
            label="Completed" 
            size="small"
            icon={<CheckCircleIcon />}
            sx={{
              backgroundColor: '#4caf50',
              color: 'white'
            }}
          />
        )}
      </Box>

      <Button 
        variant="outlined" 
        fullWidth 
        onClick={() => onViewAction(action)}
        sx={{ 
          borderColor: '#555',
          color: '#ccc',
          '&:hover': { 
            borderColor: '#666',
            backgroundColor: 'rgba(255,255,255,0.05)'
          }
        }}
      >
        View Details
      </Button>
    </Popover>
  );
};

// Detailed Action Modal Component
const ActionDetailModal = ({ action, open, onClose }) => {
  if (!action) return null;
  
  const actionContent = getActionContent(action.name);

  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="md"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: '#2c2c2c',
          color: 'white',
          minHeight: 500
        }
      }}
    >
      <DialogTitle sx={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center',
        borderBottom: '1px solid #555'
      }}>
        <Typography variant="h6" component="span" fontWeight="600">
          {action.name}
        </Typography>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Typography variant="body1" color="#ccc" mb={2}>
          {actionContent.description}
        </Typography>
        
        <Box sx={{ mb: 3 }}>
          <Typography variant="body2" color="#aaa" mb={1}>
            <EventIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
            Starts: {actionContent.startDate}
          </Typography>
          <Typography variant="body2" color="#aaa" mb={1}>
            <EventIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
            Due: {actionContent.dueDate}
          </Typography>
        </Box>

        <Typography variant="body2" color="#aaa" mb={1}>
          Project: {actionContent.project}
        </Typography>
        
        <Typography variant="body2" color="#aaa" mb={2}>
          Submission Type: {actionContent.submissionType}
        </Typography>
        
        <Typography variant="body2" color="#ccc" mb={3}>
          {actionContent.submissionStatus}
        </Typography>

        <Divider sx={{ borderColor: '#555', mb: 3 }} />

        <Typography variant="h6" fontWeight="600" mb={2}>
          {actionContent.modalTitle}
        </Typography>

        <Typography variant="body2" color="#aaa" mb={2}>
          {actionContent.fileTypes.includes('Online form') || actionContent.fileTypes.includes('No file') 
            ? actionContent.fileTypes
            : `File Submission (Accepted: ${actionContent.fileTypes}) (Max size of each file: 15 MB) *`
          }
        </Typography>

        {!actionContent.fileTypes.includes('Online form') && !actionContent.fileTypes.includes('No file') ? (
          <Box sx={{ 
            border: '2px dashed #555',
            borderRadius: 1,
            p: 3,
            textAlign: 'center',
            mb: 3,
            backgroundColor: '#333'
          }}>
            <UploadIcon sx={{ fontSize: 48, color: '#666', mb: 1 }} />
            <Typography variant="body2" color="#aaa">
              Choose Files - No file chosen
            </Typography>
          </Box>
        ) : (
          <Box sx={{ 
            border: '1px solid #555',
            borderRadius: 1,
            p: 3,
            textAlign: 'center',
            mb: 3,
            backgroundColor: '#333'
          }}>
            <AssignmentIcon sx={{ fontSize: 48, color: '#666', mb: 1 }} />
            <Typography variant="body2" color="#aaa">
              {actionContent.uploadText}
            </Typography>
          </Box>
        )}

        <Box sx={{ textAlign: 'right', mb: 2 }}>
          <Typography variant="body2" color="#aaa">
            This action can be submitted on {actionContent.dueDate} 7:00 PM
          </Typography>
        </Box>
      </DialogContent>

      <DialogActions sx={{ p: 3, borderTop: '1px solid #555' }}>
        <Button 
          onClick={onClose} 
          sx={{ color: '#aaa' }}
        >
          Cancel
        </Button>
        <Button 
          variant="contained" 
          sx={{ 
            backgroundColor: '#1976d2',
            '&:hover': { backgroundColor: '#1565c0' }
          }}
          disabled={actionContent.fileTypes.includes('No file')}
        >
          {actionContent.fileTypes.includes('No file') ? 'Schedule' : 'Submit'}
        </Button>
      </DialogActions>
    </Dialog>
  );
};

const WorkflowCard = ({ workflow, onActionClick, onActionMenuClick }) => {
  return (
    <Paper
      elevation={2}
      sx={{
        p: 3,
        mb: 3,
        borderRadius: 2,
        backgroundColor: '#fafafa'
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
      <Box sx={{ 
        display: 'flex', 
        flexWrap: 'wrap', 
        gap: 1,
        mt: 2
      }}>
        {workflow.actions?.map((action) => (
          <ActionBubble 
            key={action.id} 
            action={action} 
            onActionClick={onActionClick}
            onActionMenuClick={handleActionMenuClick}
          />
        ))}
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

export default function WorkflowsPage() {
  const params = useParams();
  const username = params.username;
  
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  
  // Popup and modal state
  const [selectedAction, setSelectedAction] = useState(null);
  const [popupAnchorEl, setPopupAnchorEl] = useState(null);
  const [detailModalOpen, setDetailModalOpen] = useState(false);
  
  // Action completion state
  const [completingAction, setCompletingAction] = useState(null);
  const [snackbarOpen, setSnackbarOpen] = useState(false);
  const [snackbarMessage, setSnackbarMessage] = useState('');
  const [snackbarSeverity, setSnackbarSeverity] = useState('success');
  
  // Action menu state
  const [actionMenuAnchor, setActionMenuAnchor] = useState(null);
  const [selectedActionForMenu, setSelectedActionForMenu] = useState(null);

  useEffect(() => {
    if (username) {
      fetchWorkflows();
    }
  }, [username]);

  const fetchWorkflows = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getUserWorkflows(username);
      setWorkflows(data || []);
    } catch (err) {
      console.error('Failed to fetch workflows:', err);
      setError('Failed to load workflows.');
    } finally {
      setLoading(false);
    }
  };

  // Handle action bubble click - show popup
  const handleActionClick = (action, event) => {
    setSelectedAction(action);
    setPopupAnchorEl(event.currentTarget);
  };

  // Handle popup close
  const handlePopupClose = () => {
    setPopupAnchorEl(null);
    setSelectedAction(null);
  };

  // Handle "View Action" click - open detailed modal
  const handleViewAction = (action) => {
    handlePopupClose(); // Close popup first
    setSelectedAction(action);
    setDetailModalOpen(true);
  };

  // Handle detail modal close
  const handleDetailModalClose = () => {
    setDetailModalOpen(false);
    setSelectedAction(null);
  };

  // Handle action completion using proper workflow state management
  const handleCompleteAction = async (action) => {
    if (action.status === 'completed') {
      showSnackbar('Action is already completed', 'info');
      return;
    }

    setCompletingAction(action.id);
    try {
      // First, get or create workflow state for this user and workflow
      const workflowForAction = workflows.find(wf => 
        wf.actions?.some(a => a.id === action.id)
      );
      
      if (!workflowForAction) {
        throw new Error('Could not find workflow for this action');
      }

      console.log('Getting workflow state for:', { username, workflowId: workflowForAction.id });
      
      // Get the workflow state (this will create one if it doesn't exist)
      const workflowState = await getOrCreateWorkflowState(username, workflowForAction.id);
      console.log('Got workflow state:', workflowState);

      // Get the full workflow state with action states
      const fullWorkflowState = await getWorkflowStateWithActions(workflowState.id);
      console.log('Full workflow state:', fullWorkflowState);

      // Find the action state for this specific action
      const actionState = findActionStateForAction(fullWorkflowState, action.id);
      
      if (!actionState) {
        throw new Error('Could not find action state for this action');
      }

      console.log('Found action state:', actionState);

      // Use the handleSubmit endpoint for completing actions
      await completeAction(actionState.id);
      
      // Update the local state to reflect completion
      const updatedWorkflows = workflows.map(workflow => ({
        ...workflow,
        actions: workflow.actions?.map(a => 
          a.id === action.id ? { ...a, status: 'completed' } : a
        )
      }));
      setWorkflows(updatedWorkflows);
      
      showSnackbar(`Action "${action.name}" completed successfully!`, 'success');
    } catch (error) {
      console.error('Failed to complete action:', error);
      showSnackbar(`Failed to complete action: ${error.message}`, 'error');
    } finally {
      setCompletingAction(null);
      handlePopupClose();
    }
  };

  // Handle starting an action (mark as in-progress)
  const handleStartAction = async (action) => {
    if (action.status !== 'pending' && action.status !== 'notStarted') {
      showSnackbar('Action cannot be started in its current state', 'warning');
      return;
    }

    try {
      // First, get or create workflow state for this user and workflow
      const workflowForAction = workflows.find(wf => 
        wf.actions?.some(a => a.id === action.id)
      );
      
      if (!workflowForAction) {
        throw new Error('Could not find workflow for this action');
      }

      // Get the workflow state (this will create one if it doesn't exist)
      const workflowState = await getOrCreateWorkflowState(username, workflowForAction.id);

      // Get the full workflow state with action states
      const fullWorkflowState = await getWorkflowStateWithActions(workflowState.id);

      // Find the action state for this specific action
      const actionState = findActionStateForAction(fullWorkflowState, action.id);
      
      if (!actionState) {
        throw new Error('Could not find action state for this action');
      }

      // Update the action state to inProgress
      await updateActionState(actionState.id, 'inProgress');
      
      // Update the local state to reflect in-progress status
      const updatedWorkflows = workflows.map(workflow => ({
        ...workflow,
        actions: workflow.actions?.map(a => 
          a.id === action.id ? { ...a, status: 'in-progress' } : a
        )
      }));
      setWorkflows(updatedWorkflows);
      
      showSnackbar(`Action "${action.name}" started!`, 'success');
    } catch (error) {
      console.error('Failed to start action:', error);
      showSnackbar(`Failed to start action: ${error.message}`, 'error');
    }
    handlePopupClose();
  };

  // Helper function to find action state for a given action ID
  const findActionStateForAction = (workflowState, actionId) => {
    if (!workflowState || !workflowState.baseActionState) {
      return null;
    }

    // Recursively search through the action state tree
    const searchActionStates = (actionState) => {
      if (actionState.actionId === actionId) {
        return actionState;
      }
      
      if (actionState.children && actionState.children.length > 0) {
        for (const child of actionState.children) {
          const found = searchActionStates(child);
          if (found) return found;
        }
      }
      
      return null;
    };

    return searchActionStates(workflowState.baseActionState);
  };

  // Show snackbar notification
  const showSnackbar = (message, severity = 'success') => {
    setSnackbarMessage(message);
    setSnackbarSeverity(severity);
    setSnackbarOpen(true);
  };

  // Handle snackbar close
  const handleSnackbarClose = () => {
    setSnackbarOpen(false);
  };

  // Handle action menu
  const handleActionMenuClick = (event, action) => {
    event.stopPropagation();
    setActionMenuAnchor(event.currentTarget);
    setSelectedActionForMenu(action);
  };

  const handleActionMenuClose = () => {
    setActionMenuAnchor(null);
    setSelectedActionForMenu(null);
  };

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Header */}
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}>
        <Button
          component={Link}
          href="/"
          startIcon={<ArrowBackIcon />}
          variant="outlined"
          sx={{ minWidth: 'auto' }}
        >
          Back to Dashboard
        </Button>
        <Box>
          <Typography variant="h3" component="h1" fontWeight="600">
            My Actions
          </Typography>
          <Typography variant="body1" color="text.secondary">
            {username}'s active actions
          </Typography>
        </Box>
      </Box>

      {/* Error Alert */}
      {error && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {error}
          <br />
        </Alert>
      )}

      {/* Loading State */}
      {loading && (
        <Box sx={{ display: 'flex', justifyContent: 'center', py: 8 }}>
          <CircularProgress size={60} />
        </Box>
      )}

      {/* No Actions */}
      {!loading && workflows.length === 0 && !error && (
        <Paper sx={{ p: 6, textAlign: 'center' }}>
          <Typography variant="h6" color="text.secondary" mb={2}>
            No Active Actions
          </Typography>
          <Typography variant="body2" color="text.secondary">
            Your actions will appear here when available.
          </Typography>
        </Paper>
      )}

      {/* Actions Grid */}
      {!loading && workflows.length > 0 && (() => {
        // Flatten all actions from all workflows into a single array
        const allActions = workflows.reduce((acc, workflow) => {
          return [...acc, ...(workflow.actions || [])];
        }, []);

        return (
          <Box sx={{ 
            display: 'grid', 
            gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))',
            gap: 3,
            mt: 2
          }}>
            {allActions.map((action, index) => (
              <ActionBubble
                key={`action-${index}-${action.id || action.name}`}
                action={action}
                onActionClick={handleActionClick}
                onActionMenuClick={handleActionMenuClick}
              />
            ))}
          </Box>
        );
      })()}

      {/* Action Popup */}
      <ActionPopup
        action={selectedAction}
        anchorEl={popupAnchorEl}
        open={Boolean(popupAnchorEl)}
        onClose={handlePopupClose}
        onViewAction={handleViewAction}
        onCompleteAction={handleCompleteAction}
        onStartAction={handleStartAction}
        completingAction={completingAction}
      />

      {/* Action Detail Modal */}
      <ActionDetailModal
        action={selectedAction}
        open={detailModalOpen}
        onClose={handleDetailModalClose}
      />

      {/* Action Menu */}
      <Menu
        anchorEl={actionMenuAnchor}
        open={Boolean(actionMenuAnchor)}
        onClose={handleActionMenuClose}
        PaperProps={{
          sx: {
            backgroundColor: '#2c2c2c',
            color: 'white',
            border: '1px solid #555'
          }
        }}
      >
        {selectedActionForMenu && selectedActionForMenu.status === 'pending' && (
          <MenuItem onClick={() => {
            handleStartAction(selectedActionForMenu);
            handleActionMenuClose();
          }}>
            <PlayArrowIcon sx={{ mr: 1 }} />
            Start Action
          </MenuItem>
        )}
        {selectedActionForMenu && (selectedActionForMenu.status === 'in-progress' || selectedActionForMenu.status === 'pending') && (
          <MenuItem onClick={() => {
            handleCompleteAction(selectedActionForMenu);
            handleActionMenuClose();
          }}>
            <CheckCircleIcon sx={{ mr: 1 }} />
            Mark Complete
          </MenuItem>
        )}
        <MenuItem onClick={() => {
          handleViewAction(selectedActionForMenu);
          handleActionMenuClose();
        }}>
          <AssignmentIcon sx={{ mr: 1 }} />
          View Details
        </MenuItem>
      </Menu>

      {/* Success/Error Snackbar */}
      <Snackbar
        open={snackbarOpen}
        autoHideDuration={4000}
        onClose={handleSnackbarClose}
        anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
      >
        <Alert 
          onClose={handleSnackbarClose} 
          severity={snackbarSeverity}
          sx={{ width: '100%' }}
        >
          {snackbarMessage}
        </Alert>
      </Snackbar>

      {/* Floating Action Button for Creating New Actions */}
      <Fab
        color="primary"
        aria-label="add action"
        sx={{
          position: 'fixed',
          bottom: 24,
          right: 24,
        }}
        onClick={() => showSnackbar('Create new action feature coming soon!', 'info')}
      >
        <AddIcon />
      </Fab>
    </Container>
  );
}
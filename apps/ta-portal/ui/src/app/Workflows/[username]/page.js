// src/app/Workflows/[username]/page.js
'use client';

import { useState, useEffect, useMemo } from 'react';
import { useParams, useSearchParams, useRouter } from 'next/navigation';
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
  Fab,
  Switch,
  FormControlLabel,
  Drawer,
  Radio,
  RadioGroup,
  Collapse,
  InputAdornment
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
  MoreVert as MoreVertIcon,
  ViewModule as GridViewIcon,
  ExpandMore,
  Group as TeamIcon,
  AccountTree as ComplexIcon,
  Task as SimpleIcon,
  Schedule as ScheduleIcon,
  Warning as WarningIcon,
  Groups as GroupsIcon,
  Person as PersonIcon,
  FilterList as FilterListIcon,
  Search as SearchIcon,
  ExpandMore as ExpandMoreIcon,
  ExpandLess as ExpandLessIcon
} from '@mui/icons-material';
import Link from 'next/link';
import { 
  getUserWorkflows, 
  getUserActions, 
  completeAction,
  startAction,
  updateActionState,
  createAction, 
  createWorkflow,
  getUserWorkflowStates,
  createWorkflowState,
  getOrCreateWorkflowState,
  getWorkflowStateWithActions,
  createHiringWorkflow,
  getHiringWorkflowPermissions,
  getWorkflowsByRole
} from '@/services/workflow-apis';

// Simple color mapping for action states
const ACTION_COLORS = {
  completed: '#4caf50',
  'in-progress': '#ff9800',
  pending: '#757575',
  blocked: '#f44336',
  warning: '#ff5722',
  overdue: '#d32f2f'
};

// Deadline Settings Dialog Component
const DeadlineSettingsDialog = ({ open, onClose, showExpiredActions, setShowExpiredActions }) => {
  return (
    <Dialog
      open={open}
      onClose={onClose}
      maxWidth="sm"
      fullWidth
      PaperProps={{
        sx: {
          backgroundColor: '#2c2c2c',
          color: 'white'
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
          Deadline Management Settings
        </Typography>
        <IconButton onClick={onClose} sx={{ color: 'white' }}>
          <CloseIcon />
        </IconButton>
      </DialogTitle>

      <DialogContent sx={{ p: 3 }}>
        <Typography variant="body1" color="#ccc" sx={{ mb: 3 }}>
          Configure how actions with deadlines are displayed in the workflow view.
        </Typography>
        
        <Box sx={{ mb: 3 }}>
          <FormControlLabel
            control={
              <Switch
                checked={showExpiredActions}
                onChange={(e) => setShowExpiredActions(e.target.checked)}
                color="primary"
              />
            }
            label={
              <Box>
                <Typography variant="subtitle1" color="white">
                  Show Expired Actions
                </Typography>
                <Typography variant="body2" color="#aaa">
                  When enabled, actions past their deadline will still be visible. When disabled, expired actions are hidden from view.
                </Typography>
              </Box>
            }
            sx={{ alignItems: 'flex-start' }}
          />
        </Box>

        {!showExpiredActions && (
          <Alert severity="warning" sx={{ backgroundColor: '#ff5722', color: 'white', mb: 2 }}>
            <Typography variant="body2">
              <WarningIcon sx={{ fontSize: 16, mr: 1, verticalAlign: 'middle' }} />
              Hiding expired actions may prevent users from completing overdue tasks. Use this feature carefully.
            </Typography>
          </Alert>
        )}

        <Typography variant="body2" color="#aaa">
          <strong>Note:</strong> Completed actions are always visible regardless of deadline status.
        </Typography>
      </DialogContent>

      <DialogActions sx={{ p: 3, borderTop: '1px solid #555' }}>
        <Button 
          onClick={onClose} 
          sx={{ color: '#aaa' }}
        >
          Close
        </Button>
      </DialogActions>
    </Dialog>
  );
};

// Helper function to check if action is past deadline
const isActionPastDeadline = (action) => {
  if (!action.deadline) return false;
  const deadline = new Date(action.deadline);
  const now = new Date();
  return now > deadline;
};

// Helper function to get deadline status
const getDeadlineStatus = (action) => {
  if (!action.deadline) return null;
  
  const deadline = new Date(action.deadline);
  const now = new Date();
  const timeDiff = deadline.getTime() - now.getTime();
  const daysDiff = Math.ceil(timeDiff / (1000 * 3600 * 24));
  
  if (daysDiff < 0) {
    return { status: 'overdue', days: Math.abs(daysDiff), text: `${Math.abs(daysDiff)} days overdue` };
  } else if (daysDiff === 0) {
    return { status: 'today', days: 0, text: 'Due today' };
  } else if (daysDiff <= 3) {
    return { status: 'urgent', days: daysDiff, text: `${daysDiff} days left` };
  } else {
    return { status: 'normal', days: daysDiff, text: `${daysDiff} days left` };
  }
};

// Helper function to determine if an action should be marked as overdue
const getActionStatusWithOverdue = (action) => {
  // If already completed, don't change status
  if (action.status === 'completed') {
    return action.status;
  }
  
  // Check if action is overdue and not completed
  const deadlineStatus = getDeadlineStatus(action);
  if (deadlineStatus && deadlineStatus.status === 'overdue' && action.status !== 'completed') {
    return 'overdue';
  }
  
  // Return original status if not overdue
  return action.status;
};

// Deadline Indicator Component
const DeadlineIndicator = ({ action, compact = false }) => {
  const deadlineStatus = getDeadlineStatus(action);
  
  if (!deadlineStatus) return null;
  
  const getColor = () => {
    switch (deadlineStatus.status) {
      case 'overdue': return '#d32f2f';
      case 'today': return '#ff5722';
      case 'urgent': return '#ff9800';
      default: return '#757575';
    }
  };
  
  if (compact) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
        <ScheduleIcon sx={{ fontSize: 12, mr: 0.5, color: getColor() }} />
        <Typography variant="caption" sx={{ fontSize: '10px', color: getColor() }}>
          {deadlineStatus.days}d
        </Typography>
      </Box>
    );
  }
  
  return (
    <Box sx={{ display: 'flex', alignItems: 'center', mt: 0.5 }}>
      <ScheduleIcon sx={{ fontSize: 14, mr: 0.5, color: getColor() }} />
      <Typography variant="caption" sx={{ color: getColor(), fontWeight: deadlineStatus.status === 'overdue' ? 'bold' : 'normal' }}>
        {deadlineStatus.text}
      </Typography>
    </Box>
  );
};

// Helper function to get team member completion status
const getTeamMemberStatus = (teamMembers = []) => {
  if (!Array.isArray(teamMembers) || teamMembers.length === 0) {
    return { completed: 0, total: 0, members: [] };
  }
  
  const completed = teamMembers.filter(member => member.status === 'completed').length;
  return { completed, total: teamMembers.length, members: teamMembers };
};

// Team Member Progress Component
const TeamMemberProgress = ({ teamMembers = [], compact = false }) => {
  const { completed, total, members } = getTeamMemberStatus(teamMembers);
  
  if (!members.length) return null;
  
  if (compact) {
    return (
      <Box sx={{ display: 'flex', alignItems: 'center', ml: 1 }}>
        <GroupsIcon sx={{ fontSize: 12, mr: 0.5, opacity: 0.7 }} />
        <Typography variant="caption" sx={{ fontSize: '10px', opacity: 0.8 }}>
          {completed}/{total}
        </Typography>
      </Box>
    );
  }
  
  return (
    <Box sx={{ mt: 1, mb: 1 }}>
      <Typography variant="caption" color="text.secondary" sx={{ mb: 1, display: 'block' }}>
        Team Progress ({completed}/{total} completed):
      </Typography>
      <Box sx={{ display: 'flex', flexWrap: 'wrap', gap: 0.5 }}>
        {members.map((member, index) => (
          <Chip
            key={member.id || member.username || index}
            size="small"
            icon={member.status === 'completed' ? <CheckCircleIcon /> : <PersonIcon />}
            label={member.displayName || member.username || `Member ${index + 1}`}
            color={member.status === 'completed' ? 'success' : 'default'}
            variant={member.status === 'completed' ? 'filled' : 'outlined'}
            sx={{
              fontSize: '0.65rem',
              height: '20px',
              '& .MuiChip-icon': { 
                fontSize: '12px',
                color: member.status === 'completed' ? 'white' : 'inherit'
              }
            }}
          />
        ))}
      </Box>
    </Box>
  );
};

// Helper function to get action type icon
const getActionTypeIcon = (actionType, isTeamAction = false, hasDeadline = false) => {
  const iconStyle = { fontSize: 12, opacity: 0.9, mr: 0.5 };
  
  if (isTeamAction) {
    return <GroupsIcon sx={iconStyle} />;
  }
  
  switch (actionType) {
    case 'complex':
      return <ComplexIcon sx={iconStyle} />;
    case 'team':
      return <TeamIcon sx={iconStyle} />;
    case 'simple':
    default:
      return <SimpleIcon sx={iconStyle} />;
  }
};

// Helper function to get action content/metadata
const getActionContent = (actionName, action = null) => {
  // Return content structure that the components expect
  // Use action properties if available, otherwise use defaults
  return {
    description: action?.description || `Details for ${actionName}`,
    startDate: action?.startDate || 'Not specified',
    dueDate: action?.dueDate || 'Not specified', 
    project: action?.workflowName || 'Current workflow',
    submissionType: action?.submissionType || 'No submission required',
    submissionStatus: action?.submissionStatus || 'Not applicable',
    modalTitle: `${actionName} Details`,
    fileTypes: action?.fileTypes || ['No file']
  };
};

const ActionBubble = ({ action, onActionClick, onActionMenuClick, isChild = false, depth = 0, hasSequentialLogic = false, workflowStatus = null, allActions = [] }) => {
  // Check if workflow is rejected
  const isRejected = workflowStatus === 'REJECTED';
  
  // Get the effective action status (may be overdue if past deadline)
  const effectiveStatus = getActionStatusWithOverdue(action);
  const isOverdue = effectiveStatus === 'overdue';
  
  // Determine if this action can be started based on sequential logic
  const canStart = !hasSequentialLogic || isChild || action.actionIndex === 0 || 
    (action.filteredActions && action.filteredActions[action.actionIndex - 1]?.status === 'completed');
  
  // For rejected workflows, determine rejection step
  let isRejectionStep = false;
  let isBeforeRejection = false;
  if (isRejected && allActions.length > 0) {
    const actionIndex = allActions.findIndex(a => a.id === action.id);
    const rejectionStepIndex = allActions.findIndex(a => a.status === 'in-progress' || a.status === 'pending');
    const actualRejectionIndex = rejectionStepIndex >= 0 ? rejectionStepIndex : Math.max(0, allActions.filter(a => a.status === 'completed').length);
    
    isRejectionStep = actionIndex === actualRejectionIndex;
    isBeforeRejection = actionIndex < actualRejectionIndex;
  }
  
  // Use gray color if action is pending but can't start due to sequential logic
  // Use red for rejected workflows, but only for rejection step
  // Use red for overdue actions (unless completed)
  let backgroundColor = ACTION_COLORS[effectiveStatus] || ACTION_COLORS.pending;
  if (isRejected) {
    if (isBeforeRejection) {
      backgroundColor = '#4caf50'; // Green for steps before rejection
    } else if (isRejectionStep) {
      backgroundColor = '#d32f2f'; // Red for rejection step
    } else {
      backgroundColor = '#bdbdbd'; // Gray for steps after rejection
    }
  } else if (isOverdue && action.status !== 'completed') {
    backgroundColor = ACTION_COLORS.overdue; // Red for overdue actions
  } else if (hasSequentialLogic && !isChild && action.status === 'pending' && !canStart) {
    backgroundColor = '#bdbdbd'; // Disabled gray
  }
  
  const isComplex = action.actionType === 'complex' && action.childActions?.length > 0;
  const [showChildren, setShowChildren] = useState(false);
  
  return (
    <Box sx={{ mb: 1 }}>
      {/* Main Action */}
      <Box
        sx={{
          minWidth: isChild ? '120px' : '140px',
          height: isChild ? '40px' : '50px',
          borderRadius: isChild ? '20px' : '25px',
          backgroundColor: isChild ? 
            (backgroundColor === ACTION_COLORS.pending ? '#999' : backgroundColor) : 
            backgroundColor,
          color: 'white',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          margin: '8px',
          marginLeft: isChild ? `${(depth * 20) + 20}px` : '8px',
          px: isChild ? 1.5 : 2,
          boxShadow: isChild ? 1 : 2,
          cursor: (hasSequentialLogic && !canStart && action.status === 'pending') || (isRejected && !isBeforeRejection) || (isOverdue && action.status !== 'completed') ? 'not-allowed' : 'pointer',
          transition: 'all 0.2s ease-in-out',
          position: 'relative',
          border: isChild ? '1px solid rgba(255,255,255,0.3)' : 'none',
          opacity: (hasSequentialLogic && !canStart && action.status === 'pending') || (isRejected && !isBeforeRejection) || (isOverdue && action.status !== 'completed') ? 0.7 : 1,
          '&:hover': {
            transform: (hasSequentialLogic && !canStart && action.status === 'pending') || (isRejected && !isBeforeRejection) || (isOverdue && action.status !== 'completed') ? 'none' : 'scale(1.05)',
            boxShadow: (hasSequentialLogic && !canStart && action.status === 'pending') || (isRejected && !isBeforeRejection) || (isOverdue && action.status !== 'completed') ? (isChild ? 1 : 2) : (isChild ? 2 : 4),
          }
        }}
      >
        <Box
          onClick={(event) => {
            // Don't allow clicks on locked actions, rejected actions at/after rejection, or overdue actions
            if ((hasSequentialLogic && !canStart && action.status === 'pending') || (isRejected && !isBeforeRejection) || (isOverdue && action.status !== 'completed')) {
              event.preventDefault();
              event.stopPropagation();
              return;
            }
            onActionClick(action, event);
          }}
          sx={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            flex: 1,
            height: '100%'
          }}
        >
          {/* Action type and complexity indicators */}
          {!isChild && (
            <Box sx={{ display: 'flex', alignItems: 'center', mr: 1 }}>
              {/* Action type icon */}
              {getActionTypeIcon(action.actionType, action.isTeamAction, action.hasDeadline)}
              
              {/* Complex action indicator */}
              {isComplex && (
                <Typography variant="caption" sx={{ fontSize: '10px', opacity: 0.8 }}>
                  [{action.childActions.length}] {showChildren ? '▼' : '▶'}
                </Typography>
              )}
            </Box>
          )}
          
          <Typography 
            variant="body2" 
            fontWeight="500" 
            textAlign="center"
            sx={{ fontSize: isChild ? '0.75rem' : '0.875rem' }}
          >
            {action.name}
          </Typography>
          
          {/* User assignment and team progress indicator */}
          {action.assignedUserId && !action.isTeamAction && (
            <Box sx={{ ml: 1, display: 'flex', alignItems: 'center' }}>
              <Typography variant="caption" sx={{ fontSize: '10px', opacity: 0.8 }}>
                @{action.assignedUserId.slice(0, 3)}...
              </Typography>
            </Box>
          )}
          
          {/* Team progress indicator for team actions */}
          {action.isTeamAction && action.teamMembers && (
            <TeamMemberProgress teamMembers={action.teamMembers} compact={true} />
          )}
          
          {/* Deadline indicator */}
          {action.deadline && (
            <DeadlineIndicator action={action} compact={true} />
          )}
        </Box>
        
        {/* Status Icon and Dropdown for Complex Actions */}
        <Box sx={{ ml: 1, display: 'flex', alignItems: 'center' }}>
          {isRejected && isRejectionStep ? (
            <Typography variant="h6" sx={{ fontSize: isChild ? 14 : 18, color: 'white', fontWeight: 'bold' }}>
              ✕
            </Typography>
          ) : isOverdue && action.status !== 'completed' ? (
            <Typography variant="h6" sx={{ fontSize: isChild ? 14 : 18, color: 'white', fontWeight: 'bold' }}>
              ✕
            </Typography>
          ) : (
            <>
              {action.status === 'completed' && (
                <CheckCircleIcon sx={{ fontSize: isChild ? 14 : 18, opacity: 0.8 }} />
              )}
              {action.status === 'in-progress' && (
                <PlayArrowIcon sx={{ fontSize: isChild ? 14 : 18, opacity: 0.8 }} />
              )}
            </>
          )}
          {isComplex && !isChild && (
            <Box sx={{ 
              width: 8, 
              height: 8, 
              borderRadius: '50%', 
              backgroundColor: 'rgba(255,255,255,0.6)',
              ml: 0.5
            }} />
          )}
          
          {/* Dropdown button for complex actions */}
          {isComplex && !isChild && (
            <IconButton
              size="small"
              onClick={(e) => {
                e.stopPropagation();
                setShowChildren(!showChildren);
              }}
              sx={{ 
                color: 'white', 
                opacity: 0.8,
                ml: 0.5,
                transform: showChildren ? 'rotate(180deg)' : 'rotate(0deg)',
                transition: 'transform 0.2s ease-in-out',
                '&:hover': {
                  opacity: 1,
                  backgroundColor: 'rgba(255,255,255,0.1)'
                }
              }}
            >
              <ExpandMore sx={{ fontSize: 16 }} />
            </IconButton>
          )}
        </Box>
        
        {/* Action Menu Button */}
        <IconButton
          size="small"
          onClick={(event) => {
            // Don't allow menu clicks on locked actions, rejected non-completed actions, or overdue actions
            if ((hasSequentialLogic && !canStart && action.status === 'pending') || (isRejected && action.status !== 'completed') || (isOverdue && action.status !== 'completed')) {
              event.preventDefault();
              event.stopPropagation();
              return;
            }
            onActionMenuClick(event, action);
          }}
          disabled={(hasSequentialLogic && !canStart && action.status === 'pending') || (isRejected && action.status !== 'completed') || (isOverdue && action.status !== 'completed')}
          sx={{ 
            color: 'white', 
            opacity: (hasSequentialLogic && !canStart && action.status === 'pending') || (isRejected && action.status !== 'completed') ? 0.3 : 0.7,
            ml: 0.5,
            '&:hover': {
              opacity: (hasSequentialLogic && !canStart && action.status === 'pending') || (isRejected && action.status !== 'completed') ? 0.3 : 1,
              backgroundColor: (hasSequentialLogic && !canStart && action.status === 'pending') || (isRejected && action.status !== 'completed') ? 'none' : 'rgba(255,255,255,0.1)'
            }
          }}
        >
          <MoreVertIcon sx={{ fontSize: isChild ? 12 : 16 }} />
        </IconButton>
      </Box>
      
      {/* Child Actions for Complex Actions - Only show when expanded */}
      {isComplex && showChildren && action.childActions?.map((childAction) => (
        <ActionBubble
          key={childAction.id}
          action={{
            ...childAction,
            // Child actions inherit the parent's workflow context but can start if parent can start
            workflowId: action.workflowId,
            workflowName: action.workflowName,
            actionIndex: action.actionIndex, // Use parent's index for sequential logic
            filteredActions: action.filteredActions,
          }}
          onActionClick={onActionClick}
          onActionMenuClick={onActionMenuClick}
          workflowStatus={workflowStatus}
          isChild={true}
          depth={depth + 1}
          hasSequentialLogic={hasSequentialLogic}
        />
      ))}
    </Box>
  );
};

// Action Detail Popup Component
const ActionPopup = ({ action, anchorEl, open, onClose, onViewAction, onCompleteAction, onStartAction, completingAction }) => {
  if (!action) return null;
  
  const actionContent = getActionContent(action.name, action);
  const effectiveStatus = getActionStatusWithOverdue(action);
  const isOverdue = effectiveStatus === 'overdue';

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
        label={isOverdue ? 'Overdue' : (effectiveStatus || 'pending')} 
        size="small"
        sx={{
          mb: 2,
          backgroundColor: ACTION_COLORS[effectiveStatus] || ACTION_COLORS.pending,
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
        {action.status === 'pending' && !isOverdue && (
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
        
        {(action.status === 'in-progress' || action.status === 'pending') && !isOverdue && (
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
        
        {isOverdue && action.status !== 'completed' && (
          <Chip 
            label="Overdue - Cannot Complete" 
            size="small"
            icon={<Typography variant="body2">✕</Typography>}
            sx={{
              backgroundColor: '#d32f2f',
              color: 'white'
            }}
          />
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
  
  const actionContent = getActionContent(action.name, action);

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

const WorkflowCard = ({ workflow, onActionClick, onActionMenuClick, expanded, onToggleExpand, handleStartAction, handleCompleteAction }) => {
  const isRejected = workflow.metadata.currentStatus === 'REJECTED';
  
  const getActionStatusColor = (action, index, actions) => {
    // For rejected workflows, determine which step was the rejection point
    if (isRejected) {
      // For rejected workflows, show green for completed steps, red X for rejection step
      // Find the rejection point based on action status or index
      const rejectionStepIndex = actions.findIndex(a => a.status === 'in-progress' || a.status === 'pending');
      const actualRejectionIndex = rejectionStepIndex >= 0 ? rejectionStepIndex : Math.max(0, actions.filter(a => a.status === 'completed').length);
      
      if (index < actualRejectionIndex) {
        return '#4caf50'; // Green for steps before rejection
      } else if (index === actualRejectionIndex) {
        return '#d32f2f'; // Red for rejection step
      } else {
        return '#bdbdbd'; // Gray for steps after rejection
      }
    }
    
    // First action can always be started
    if (index === 0) {
      return action.status === 'completed' ? '#4caf50' : 
             action.status === 'in-progress' ? '#ff9800' : '#2196f3';
    }
    
    // Subsequent actions require previous action to be completed
    const previousAction = actions[index - 1];
    const canStart = previousAction?.status === 'completed';
    
    if (!canStart) {
      return '#bdbdbd'; // Disabled gray
    }
    
    return action.status === 'completed' ? '#4caf50' : 
           action.status === 'in-progress' ? '#ff9800' : '#2196f3';
  };

  const getActionStatusIcon = (action, index, actions) => {
    // For rejected workflows, determine which step was the rejection point
    if (isRejected) {
      const rejectionStepIndex = actions.findIndex(a => a.status === 'in-progress' || a.status === 'pending');
      const actualRejectionIndex = rejectionStepIndex >= 0 ? rejectionStepIndex : Math.max(0, actions.filter(a => a.status === 'completed').length);
      
      if (index < actualRejectionIndex) {
        return <CheckCircleIcon sx={{ fontSize: 16, color: 'white' }} />; // Green checkmark for steps before rejection
      } else if (index === actualRejectionIndex) {
        return <Typography variant="h6" sx={{ fontSize: 16, color: 'white', fontWeight: 'bold' }}>✕</Typography>; // Red X for rejection step
      } else {
        return <span style={{ fontSize: '12px', color: 'white' }}>🔒</span>; // Lock for steps after rejection
      }
    }
    
    if (action.status === 'completed') {
      return <CheckCircleIcon sx={{ fontSize: 16, color: 'white' }} />;
    }
    
    if (index === 0) {
      return <PlayArrowIcon sx={{ fontSize: 16, color: 'white' }} />;
    }
    
    const previousAction = actions[index - 1];
    const canStart = previousAction?.status === 'completed';
    
    if (!canStart) {
      return <span style={{ fontSize: '12px', color: 'white' }}>🔒</span>;
    }
    
    return action.status === 'in-progress' ? 
      <span style={{ fontSize: '12px', color: 'white' }}>▶</span> :
      <PlayArrowIcon sx={{ fontSize: 16, color: 'white' }} />;
  };

  return (
    <Paper
      id={`workflow-${workflow.id}`}
      elevation={2}
      sx={{
        mb: 3,
        borderRadius: 2,
        backgroundColor: '#fafafa',
        overflow: 'hidden'
      }}
    >
      {/* Workflow Header */}
      <Box 
        sx={{ 
          p: 3, 
          cursor: 'pointer',
          '&:hover': { backgroundColor: '#f0f0f0' },
          borderBottom: expanded ? '1px solid #e0e0e0' : 'none'
        }}
        onClick={() => onToggleExpand(workflow.id)}
      >        
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
          <Box>
            <Typography variant="h6" fontWeight="600" color="primary" sx={{ mb: 1 }}>
              {workflow.name}
            </Typography>
            
            {workflow.description && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                {workflow.description}
              </Typography>
            )}
            
            {/* Display Applicant and Professor info for hiring workflows */}
            <Box sx={{ display: 'flex', gap: 2, mt: 1 }}>
              {workflow.metadata.candidateName && (
                <Chip 
                  label={workflow.metadata.candidateName}
                  size="small"
                  variant="outlined"
                  color="primary"
                />
              )}
              {workflow.metadata.employerName && (
                <Chip 
                  label={workflow.metadata.employerName}
                  size="small"
                  variant="outlined"
                  color="secondary"
                />
              )}
            </Box>
          </Box>
          
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            {/* Progress Summary */}
            <Box sx={{ textAlign: 'right' }}>
              <Typography variant="caption" color="text.secondary">
                {workflow.actions?.filter(a => a.actionType !== 'workflow' && a.status === 'completed').length || 0} / {workflow.actions?.filter(a => a.actionType !== 'workflow').length || 0} Complete
              </Typography>
              <Box sx={{ 
                width: 60, 
                height: 4, 
                backgroundColor: '#e0e0e0', 
                borderRadius: 2,
                mt: 0.5
              }}>
                <Box sx={{
                  width: `${((workflow.actions?.filter(a => a.actionType !== 'workflow' && a.status === 'completed').length || 0) / (workflow.actions?.filter(a => a.actionType !== 'workflow').length || 1)) * 100}%`,
                  height: '100%',
                  backgroundColor: '#4caf50',
                  borderRadius: 2,
                  transition: 'width 0.3s ease'
                }} />
              </Box>
            </Box>
            
            {/* Expand/Collapse Icon */}
            <IconButton size="small">
              {expanded ? '▼' : '▶'}
            </IconButton>
          </Box>
        </Box>
      </Box>

      {/* Actions List (when expanded) */}
      {expanded && (
        <Box sx={{ p: 0 }}>
          {workflow.actions?.filter(action => action.actionType !== 'workflow').map((action, index, filteredActions) => (
            <Box
              key={action.id}
              sx={{
                display: 'flex',
                alignItems: 'center',
                p: 2,
                borderBottom: index < filteredActions.length - 1 ? '1px solid #f0f0f0' : 'none',
                '&:hover': { backgroundColor: '#f8f8f8' }
              }}
            >
              {/* Step Number & Connector */}
              <Box sx={{ display: 'flex', flexDirection: 'column', alignItems: 'center', mr: 3, minWidth: 40 }}>
                <Box
                  sx={{
                    width: 32,
                    height: 32,
                    borderRadius: '50%',
                    backgroundColor: getActionStatusColor(action, index, filteredActions),
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: 'white',
                    fontWeight: 'bold',
                    fontSize: '14px'
                  }}
                >
                  {getActionStatusIcon(action, index, filteredActions)}
                </Box>
                {index < filteredActions.length - 1 && (
                  <Box
                    sx={{
                      width: 2,
                      height: 30,
                      backgroundColor: '#e0e0e0',
                      mt: 1
                    }}
                  />
                )}
              </Box>

              {/* Action Content - No longer clickable */}
              <Box 
                sx={{ 
                  flex: 1
                }}
              >
                <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <Box sx={{ flex: 1 }}>
                    <Box sx={{ display: 'flex', alignItems: 'center', mb: 0.5 }}>
                      {/* Action type icon */}
                      {getActionTypeIcon(action.actionType, action.isTeamAction, action.hasDeadline)}
                      
                      <Typography variant="subtitle2" fontWeight="600">
                        {action.name}
                      </Typography>
                      
                      {action.actionType === 'complex' && (
                        <Chip 
                          label="Complex" 
                          size="small" 
                          color="info" 
                          variant="outlined" 
                          sx={{ ml: 1, fontSize: '0.6rem', height: '16px' }} 
                        />
                      )}
                      
                      {action.isTeamAction && (
                        <Chip 
                          label="Team" 
                          size="small" 
                          color="secondary" 
                          variant="outlined" 
                          sx={{ ml: 1, fontSize: '0.6rem', height: '16px' }} 
                        />
                      )}
                    </Box>
                    <Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
                      {action.description}
                    </Typography>
                    
                    {/* Show team member progress for team actions */}
                    {action.isTeamAction && action.teamMembers && (
                      <TeamMemberProgress teamMembers={action.teamMembers} compact={false} />
                    )}
                    
                    {/* Deadline information */}
                    {action.deadline && (
                      <DeadlineIndicator action={action} compact={false} />
                    )}
                    
                    {/* Show child actions for complex actions */}
                    {action.actionType === 'complex' && action.childActions && action.childActions.length > 0 && (
                      <Box sx={{ ml: 2, mt: 1, mb: 1 }}>
                        {action.childActions.map((childAction, childIndex) => {
                          // Child actions can only be started if the parent complex action can be started
                          // (i.e., the previous top-level action is completed)
                          const parentCanStart = index === 0 || filteredActions[index - 1]?.status === 'completed';
                          const canStartChild = childAction.status === 'pending' && parentCanStart;
                          
                          return (
                            <Box 
                              key={childAction.id || childIndex} 
                              sx={{ 
                                mb: 1,
                                p: 1,
                                border: '1px solid #e0e0e0',
                                borderRadius: 1,
                                backgroundColor: '#f9f9f9',
                                opacity: !parentCanStart && childAction.status === 'pending' ? 0.6 : 1
                              }}
                            >
                              <Box sx={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                                <Box sx={{ flex: 1 }}>
                                  <Typography variant="body2" fontWeight="500" sx={{ mb: 0.5 }}>
                                    • {childAction.name}
                                  </Typography>
                                  {childAction.description && (
                                    <Typography variant="caption" color="text.secondary" sx={{ display: 'block', mb: 0.5 }}>
                                      {childAction.description}
                                    </Typography>
                                  )}
                                  
                                  {/* Show team member progress for child team actions */}
                                  {childAction.isTeamAction && childAction.teamMembers && (
                                    <Box sx={{ mb: 0.5 }}>
                                      <TeamMemberProgress teamMembers={childAction.teamMembers} compact={true} />
                                    </Box>
                                  )}
                                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                                    <Chip 
                                      label={
                                        childAction.status === 'completed' ? 'Completed' :
                                        childAction.status === 'in-progress' ? 'In Progress' :
                                        parentCanStart ? 'Ready to Start' : 'Waiting for Previous Action'
                                      }
                                      size="small"
                                      color={
                                        childAction.status === 'completed' ? 'success' :
                                        childAction.status === 'in-progress' ? 'warning' :
                                        parentCanStart ? 'primary' : 'default'
                                      }
                                      variant="outlined"
                                      sx={{ fontSize: '0.6rem', height: '18px' }}
                                    />
                                  </Box>
                                </Box>
                                
                                {/* Child Action Buttons */}
                                <Box sx={{ display: 'flex', alignItems: 'center', gap: 0.5 }}>
                                  {childAction.status === 'pending' && parentCanStart && !(isRejected && childAction.status !== 'completed') && getActionStatusWithOverdue(childAction) !== 'overdue' && (
                                    <Button
                                      size="small"
                                      variant="outlined"
                                      color="primary"
                                      startIcon={<PlayArrowIcon />}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleStartAction(childAction);
                                      }}
                                      sx={{ fontSize: '0.7rem', minWidth: 'auto', px: 1 }}
                                    >
                                      Go
                                    </Button>
                                  )}
                                  
                                  {childAction.status === 'in-progress' && !(isRejected && childAction.status !== 'completed') && getActionStatusWithOverdue(childAction) !== 'overdue' && (
                                    <Button
                                      size="small"
                                      variant="contained"
                                      color="success"
                                      startIcon={<CheckCircleIcon />}
                                      onClick={(e) => {
                                        e.stopPropagation();
                                        handleCompleteAction(childAction);
                                      }}
                                      sx={{ fontSize: '0.7rem', minWidth: 'auto', px: 1 }}
                                    >
                                      Go
                                    </Button>
                                  )}
                                  
                                  {/* Show overdue indicator for child actions */}
                                  {getActionStatusWithOverdue(childAction) === 'overdue' && childAction.status !== 'completed' && (
                                    <Chip 
                                      label="Overdue" 
                                      size="small"
                                      sx={{
                                        backgroundColor: '#d32f2f',
                                        color: 'white',
                                        fontSize: '0.6rem',
                                        height: '18px'
                                      }}
                                    />
                                  )}
                                  
                                  <IconButton 
                                    size="small"
                                    onClick={(e) => {
                                      e.stopPropagation();
                                      onActionMenuClick(e, childAction);
                                    }}
                                    sx={{ color: 'text.secondary', p: 0.5 }}
                                    disabled={(!parentCanStart && childAction.status === 'pending') || (isRejected && childAction.status !== 'completed') || (getActionStatusWithOverdue(childAction) === 'overdue' && childAction.status !== 'completed')}
                                  >
                                    <MoreVertIcon fontSize="small" />
                                  </IconButton>
                                </Box>
                            </Box>
                          </Box>
                          );
                        })}
                      </Box>
                    )}
                    
                    {/* Action Status & Controls */}
                    <Box sx={{ display: 'flex', alignItems: 'center', gap: 1, mt: 1 }}>
                      <Chip
                        label={
                          action.status === 'completed' ? 'Completed' :
                          action.status === 'in-progress' ? 'In Progress' :
                          index === 0 ? 'Ready to Start' :
                          filteredActions[index - 1]?.status === 'completed' ? 'Ready to Start' :
                          'Waiting for Previous'
                        }
                        size="small"
                        color={
                          action.status === 'completed' ? 'success' :
                          action.status === 'in-progress' ? 'warning' :
                          (index === 0 || filteredActions[index - 1]?.status === 'completed') ? 'primary' :
                          'default'
                        }
                        variant="outlined"
                      />
                    </Box>
                  </Box>
                  
                  {/* Action Menu */}
                  <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                    {/* Quick Action Buttons */}
                    {action.status === 'pending' && (index === 0 || filteredActions[index - 1]?.status === 'completed') && !(isRejected && action.status !== 'completed') && getActionStatusWithOverdue(action) !== 'overdue' && (
                      <Button
                        size="small"
                        variant="outlined"
                        color="primary"
                        startIcon={<PlayArrowIcon />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleStartAction(action);
                        }}
                        sx={{ mr: 1 }}
                      >
                        Go to Page
                      </Button>
                    )}
                    
                    {action.status === 'in-progress' && !(isRejected && action.status !== 'completed') && getActionStatusWithOverdue(action) !== 'overdue' && (
                      <Button
                        size="small"
                        variant="contained"
                        color="success"
                        startIcon={<CheckCircleIcon />}
                        onClick={(e) => {
                          e.stopPropagation();
                          handleCompleteAction(action);
                        }}
                        sx={{ mr: 1 }}
                      >
                        Go to Page
                      </Button>
                    )}
                    
                    {/* Show overdue indicator */}
                    {getActionStatusWithOverdue(action) === 'overdue' && action.status !== 'completed' && (
                      <Chip 
                        label="Overdue" 
                        size="small"
                        sx={{
                          backgroundColor: '#d32f2f',
                          color: 'white',
                          mr: 1
                        }}
                      />
                    )}
                    
                    <IconButton 
                      size="small"
                      onClick={(e) => {
                        e.stopPropagation();
                        onActionMenuClick(e, action);
                      }}
                      sx={{ color: 'text.secondary' }}
                      disabled={isRejected && action.status !== 'completed' || getActionStatusWithOverdue(action) === 'overdue' && action.status !== 'completed'}
                    >
                      <MoreVertIcon fontSize="small" />
                    </IconButton>
                  </Box>
                </Box>
              </Box>
            </Box>
          ))}
        </Box>
      )}
    </Paper>
  );
};

// Extracted ActionsGrid component for clarity
function ActionsGrid({ workflows, onActionClick, onActionMenuClick }) {
  // Get all top-level actions from all workflows with their workflow context
  // Filter out workflow base actions (actionType: 'workflow') to avoid duplicates
  const allTopLevelActions = workflows.reduce((acc, workflow) => {
    const filteredActions = workflow.actions?.filter(action => action.actionType !== 'workflow') || [];
    const actionsWithContext = filteredActions.map((action, index) => ({
      ...action,
      workflowId: workflow.id,
      workflowName: workflow.name,
      actionIndex: index,
      filteredActions: filteredActions, // Pass the filtered actions for sequential logic
    }));
    return [...acc, ...actionsWithContext];
  }, []);

  return (
    <Box sx={{ 
      display: 'grid', 
      gridTemplateColumns: 'repeat(auto-fill, minmax(250px, 1fr))',
      gap: 3,
      mt: 2
    }}>
      {allTopLevelActions.map((actionWithContext, globalIndex) => {
        // Find the workflow for this action
        const workflow = workflows.find(w => w.id === actionWithContext.workflowId);
        const workflowStatus = workflow?.metadata?.currentStatus;
        
        return (
          <ActionBubble
            key={`action-${globalIndex}-${actionWithContext.id || actionWithContext.name}`}
            action={actionWithContext}
            onActionClick={onActionClick}
            onActionMenuClick={onActionMenuClick}
            hasSequentialLogic={true}
            workflowStatus={workflowStatus}
            allActions={workflow?.actions || []}
          />
        );
      })}
    </Box>
  );
}

// =============================================================================
// PERMISSION CHECKING FOR HIRING WORKFLOWS
// =============================================================================

/**
 * Check if a user can perform an action on a hiring workflow
 * @param {Object} workflow - The workflow object
 * @param {Object} action - The action object
 * @param {string} username - Username attempting the action
 * @returns {Promise<boolean>} Whether the user can perform the action
 */
async function canUserPerformAction(workflow, action, username) {
  try {
    // Check if this is a hiring workflow by looking for the metadata
    const isHiringWorkflow = workflow.metadata?.workflowType === 'hiring_process' ||
                           workflow.name?.includes('Hiring Process');
    
    if (!isHiringWorkflow) {
      // For non-hiring workflows, allow all actions (existing behavior)
      return true;
    }

    // For hiring workflows, check permissions
    const permissions = await getHiringWorkflowPermissions(workflow.id, username);
    const allowedActionIds = permissions.allowedActionIds || [];
    const hasPermission = allowedActionIds.includes(action.id);
    
    return hasPermission;
  } catch (error) {
    console.warn('Error checking permissions, defaulting to allow:', error);
    return true; // Default to allow if permission check fails
  }
}

/**
 * Get the appropriate navigation URL for an action
 * @param {Object} action - The action object
 * @param {Object} workflow - The workflow containing the action
 * @param {string} username - The current username
 * @returns {string|null} The URL to navigate to, or null if no specific page
 */
function getActionNavigationUrl(action, workflow, username) {
  if (process.env.NODE_ENV === 'development') {
    console.log('Getting navigation URL for action:', {
      actionName: action.name,
      workflowName: workflow.name,
      workflowMetadata: workflow.metadata,
      username
    });
  }
  
  // Check if this is a hiring workflow
  const isHiringWorkflow = workflow.metadata?.workflowType === 'hiring_process' ||
                          workflow.name?.includes('Hiring Process');
  
  if (isHiringWorkflow) {
    // Extract candidate username from workflow metadata or name
    let candidateUsername = null;
    let applicationId = null;
    
    // Try to get candidate and application info from workflow metadata
    if (workflow.metadata?.candidateUsername) {
      candidateUsername = workflow.metadata.candidateUsername;
    }
    if (workflow.metadata?.applicationId) {
      applicationId = workflow.metadata.applicationId;
    }
    
    // Fallback: try to extract from workflow name 
    if (!candidateUsername) {
      const parenthesesMatch = workflow.name.match(/\(([^)]+)\)/);
      if (parenthesesMatch) {
        candidateUsername = parenthesesMatch[1];
      } else {
        // Try to find a username pattern (letters + numbers)
        const usernameMatch = workflow.name.match(/\b([a-z]+\d+)\b/i);
        if (usernameMatch) {
          candidateUsername = usernameMatch[1];
        }
      }
    }
    
    // Route based on action name and user context
    const actionName = action.name.toLowerCase();
    
    switch (actionName) {
      case 'applied':
        // For "Applied" action, candidate should go to their applications page
        if (candidateUsername) {
          return `/Applications/Employee/${candidateUsername}`;
        }
        break;
        
      case 'interview':
        // For "Interview" action, employer should go to their employer applications page
        // Use the current user's username (should be employer) for the route
        return `/Applications/Employer/${username}`;
        break;
        
      case 'offer':
        // For "Offer" action, employer should go to their employer applications page
        // Use the current user's username (should be employer) for the route
        return `/Applications/Employer/${username}`;
        break;
        
      case 'accepted':
        // For "Accepted" action, candidate should go to their applications page to accept offer
        if (candidateUsername) {
          return `/Applications/Employee/${candidateUsername}`;
        }
        break;
        
      case 'hired':
        // For "Hired" action, admin should go to admin applications page with hiring tab
        // Use the current user's username (should be admin) for the route
        return `/Applications/Admin/${username}?tab=hiring`;
        break;
        
      default:
        // For unknown actions, fallback to employee applications page
        if (candidateUsername) {
          return `/Applications/Employee/${candidateUsername}`;
        }
        break;
    }
  }
  
  // For other workflow types, you can add more specific routing logic here
  // For now, return null to indicate no specific navigation
  return null;
}

export default function WorkflowsPage() {
  const params = useParams();
  const searchParams = useSearchParams();
  const router = useRouter();
  const username = params.username;
  const workflowIdToExpand = searchParams.get('workflowId');
  
  const [workflows, setWorkflows] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [userRole, setUserRole] = useState(null);
  
  // Workflow expansion state
  const [expandedWorkflows, setExpandedWorkflows] = useState(new Set());
  
  // Grid view state
  const [showGridView, setShowGridView] = useState(false);
  
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
  
  // Deadline visibility state (admin feature)
  const [showExpiredActions, setShowExpiredActions] = useState(true);
  const [deadlineSettingsOpen, setDeadlineSettingsOpen] = useState(false);
  
  // Filtering state for overdue and rejected workflows
  const [hideOverdueRejected, setHideOverdueRejected] = useState(false);
  
  // Filter & Sort drawer state
  const [filterDrawerOpen, setFilterDrawerOpen] = useState(false);
  const [sortBy, setSortBy] = useState('progress');
  const [sortOrder, setSortOrder] = useState('desc');
  const [progressFilter, setProgressFilter] = useState('all');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortExpanded, setSortExpanded] = useState(true);
  const [progressExpanded, setProgressExpanded] = useState(true);
  const [statusExpanded, setStatusExpanded] = useState(true);

  // Check if an action is past its deadline
  const isActionPastDeadline = (action) => {
    if (!action.deadline) return false;
    
    const deadline = new Date(action.deadline);
    const now = new Date();
    
    return now > deadline;
  };

  // Check if a workflow is completely overdue (all incomplete actions are overdue)
  const isWorkflowCompletelyOverdue = (workflow) => {
    if (!workflow.actions || workflow.actions.length === 0) return false;
    
    // Check if the workflow itself has an overdue deadline in metadata
    const workflowDeadline = workflow.metadata?.deadline;
    if (workflowDeadline) {
      const deadline = new Date(workflowDeadline);
      const now = new Date();
      if (now > deadline) {
        console.log(`Workflow ${workflow.metadata?.candidateName} is overdue (deadline: ${workflowDeadline})`);
        return true;
      }
    }
    
    const incompleteActions = workflow.actions.filter(action => action.status !== 'completed');
    if (incompleteActions.length === 0) return false; // All actions completed
    
    return incompleteActions.every(action => {
      if (!action.deadline) return false;
      const deadline = new Date(action.deadline);
      const now = new Date();
      return now > deadline;
    });
  };

  // Check if a workflow is rejected
  const isWorkflowRejected = (workflow) => {
    return workflow.metadata?.currentStatus === 'REJECTED';
  };

  // Filter workflows based on deadline and rejection settings
  const getFilteredWorkflows = (workflows) => {
    let filtered = workflows;

    // Filter out rejected workflows if hideOverdueRejected is enabled
    if (hideOverdueRejected) {
      filtered = filtered.filter(workflow => !isWorkflowRejected(workflow));
    }

    // Filter out completely overdue workflows if hideOverdueRejected is enabled
    if (hideOverdueRejected) {
      filtered = filtered.filter(workflow => !isWorkflowCompletelyOverdue(workflow));
    }

    // Filter actions within workflows based on showExpiredActions setting
    if (!showExpiredActions) {
      filtered = filtered.map(workflow => ({
        ...workflow,
        actions: workflow.actions?.filter(action => {
          // Don't filter completed actions or actions without deadlines
          if (action.status === 'completed' || !action.deadline) return true;
          
          // Filter out expired actions
          return !isActionPastDeadline(action);
        })
      })).filter(workflow => workflow.actions?.length > 0); // Remove workflows with no visible actions
    }
    
    console.log('Final filtered workflows count:', filtered.length);
    return filtered;
  };

  // Clear all filters function
  const clearAllFilters = () => {
    setSortBy('progress');
    setSortOrder('desc');
    setProgressFilter('all');
    setStatusFilter('all');
    setHideOverdueRejected(false);
    setShowExpiredActions(true);
  };

  // Enhanced filtering function that includes additional filters
  const getEnhancedFilteredWorkflows = (workflows) => {
    let filtered = getFilteredWorkflows(workflows);

    // Apply progress filter
    if (progressFilter !== 'all') {
      filtered = filtered.filter(workflow => {
        const completed = parseInt(workflow.metadata?.completedActions || 0);
        const total = parseInt(workflow.metadata?.totalActions || 5);
        const progress = total > 0 ? (completed / total) * 100 : 0;
        
        if (progressFilter === 'completed') return progress === 100;
        if (progressFilter === 'inprogress') return progress > 0 && progress < 100;
        if (progressFilter === 'notstarted') return progress === 0;
        return true;
      });
    }

    // Apply status filter
    if (statusFilter !== 'all') {
      filtered = filtered.filter(workflow => {
        const status = workflow.metadata?.currentStatus;
        if (statusFilter === 'active') return status && !['REJECTED', 'HIRED'].includes(status);
        if (statusFilter === 'rejected') return status === 'REJECTED';
        if (statusFilter === 'completed') return status === 'HIRED';
        return true;
      });
    }

    // Apply sorting
    filtered.sort((a, b) => {
      if (sortBy === 'progress') {
        const progressA = parseInt(a.metadata?.completedActions || 0) / parseInt(a.metadata?.totalActions || 5);
        const progressB = parseInt(b.metadata?.completedActions || 0) / parseInt(b.metadata?.totalActions || 5);
        return sortOrder === 'desc' ? progressB - progressA : progressA - progressB;
      }
      if (sortBy === 'name') {
        const nameA = a.metadata?.candidateName || '';
        const nameB = b.metadata?.candidateName || '';
        return sortOrder === 'desc' ? nameB.localeCompare(nameA) : nameA.localeCompare(nameB);
      }
      if (sortBy === 'status') {
        const statusA = a.metadata?.currentStatus || '';
        const statusB = b.metadata?.currentStatus || '';
        return sortOrder === 'desc' ? statusB.localeCompare(statusA) : statusA.localeCompare(statusB);
      }
      return 0;
    });

    return filtered;
  };

  // Memoize filtered workflows to update when filters change
  const filteredWorkflows = useMemo(() => 
    getEnhancedFilteredWorkflows(workflows), 
    [workflows, hideOverdueRejected, showExpiredActions, sortBy, sortOrder, progressFilter, statusFilter]
  );

  useEffect(() => {
    if (username) {
      fetchWorkflows();
    }
  }, [username]);

  // Auto-expand workflow if workflowId is in URL
  useEffect(() => {
    if (workflowIdToExpand && workflows.length > 0) {
      const workflowExists = workflows.some(w => w.id === workflowIdToExpand);
      if (workflowExists) {
        setExpandedWorkflows(new Set([workflowIdToExpand]));
        
        // Scroll to the workflow
        setTimeout(() => {
          const element = document.getElementById(`workflow-${workflowIdToExpand}`);
          if (element) {
            element.scrollIntoView({ behavior: 'smooth', block: 'center' });
          }
        }, 100);
      }
    }
  }, [workflowIdToExpand, workflows]);

  const fetchWorkflows = async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getWorkflowsByRole(username);
      setWorkflows(data.workflows || []);
      setUserRole(data.userRole);
    } catch (err) {
      console.error('Failed to fetch workflows:', err);
      setError('Failed to load workflows.');
    } finally {
      setLoading(false);
    }
  };

  // Handle action click - direct interaction or show menu
  const handleActionClick = (action, event) => {
    console.log('Action clicked:', action.name);
    
    // Prevent interaction with overdue actions
    if (getActionStatusWithOverdue(action) === 'overdue') {
      console.warn('Cannot interact with overdue action:', action.name);
      return;
    }
    
    // Find the workflow containing this action (could be top-level or child action)
    let workflow = null;
    let actionIndex = -1;
    let isChildAction = false;
    let parentAction = null;
    let childIndex = -1;
    
    // First, try to find as top-level action
    workflow = workflows.find(w => w.actions?.some(a => a.id === action.id));
    if (workflow) {
      actionIndex = workflow.actions.findIndex(a => a.id === action.id);
    } else {
      // If not found as top-level, search in child actions
      for (const w of workflows) {
        for (const topAction of w.actions || []) {
          if (topAction.childActions) {
            const foundChildIndex = topAction.childActions.findIndex(child => child.id === action.id);
            if (foundChildIndex !== -1) {
              workflow = w;
              parentAction = topAction;
              childIndex = foundChildIndex;
              isChildAction = true;
              break;
            }
          }
        }
        if (isChildAction) break;
      }
    }
    
    if (!workflow) {
      return;
    }
    
    // Determine if action can be started
    let canStart = false;
    
    if (isChildAction) {
      // For child actions, they can be started in any order BUT only if the parent complex action can be started
      // (i.e., the previous top-level action is completed)
      const parentActionIndex = workflow.actions.findIndex(a => a.id === parentAction.id);
      const parentCanStart = parentActionIndex === 0 || 
                            (workflow.actions[parentActionIndex - 1]?.status === 'completed');
      canStart = action.status === 'pending' && parentCanStart;
    } else {
      // For top-level actions, check if previous top-level action is completed (sequential)
      canStart = actionIndex === 0 || 
                 (workflow.actions[actionIndex - 1]?.status === 'completed');
    }
    
    // Handle action based on status and ability to start
    if (action.status === 'pending' && canStart) {
      handleStartAction(action);
      return;
    }
    
    if (action.status === 'in-progress') {
      handleCompleteAction(action);
      return;
    }
    
    // For completed actions or other cases, show details
    handleViewAction(action);
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

  // Handle workflow expand/collapse
  const handleToggleWorkflowExpand = (workflowId) => {
    setExpandedWorkflows(prev => {
      const newSet = new Set(prev);
      if (newSet.has(workflowId)) {
        newSet.delete(workflowId);
      } else {
        newSet.add(workflowId);
      }
      return newSet;
    });
  };

  // Handle action completion (navigate to appropriate page)
  const handleCompleteAction = async (action) => {
    if (action.status === 'completed') {
      showSnackbar('Action is already completed', 'info');
      return;
    }

    // Find the workflow for permission checking
    const workflowForAction = findWorkflowForAction(action.id);
    if (!workflowForAction) {
      showSnackbar('Could not find workflow for this action', 'error');
      return;
    }

    // Check permissions for hiring workflows
    const hasPermission = await canUserPerformAction(workflowForAction, action, username);
    if (!hasPermission) {
      // Provide more specific error message for hiring workflows
      const isHiringWorkflow = workflowForAction.metadata?.workflowType === 'hiring_process' ||
                             workflowForAction.name?.includes('Hiring Process');
      
      if (isHiringWorkflow) {
        showSnackbar(
          `This action can only be completed by the ${action.metadata?.requiredRole || 'authorized'} user for this hiring process.`,
          'warning'
        );
      } else {
        showSnackbar('You do not have permission to complete this action', 'warning');
      }
      return;
    }

    // Check if it's a complex action and if all child actions are completed
    if (action.actionType === 'complex' && action.childActions?.length > 0) {
      const incompleteChildren = action.childActions.filter(child => child.status !== 'completed');
      if (incompleteChildren.length > 0) {
        showSnackbar(
          `Cannot complete complex action. ${incompleteChildren.length} child action(s) still need to be completed.`, 
          'warning'
        );
        return;
      }
    }

    // Get the navigation URL for this action
    const navigationUrl = getActionNavigationUrl(action, workflowForAction, username);
    
    if (navigationUrl) {
      // Navigate to the specific page for this action
      router.push(navigationUrl);
    } else {
      // Fallback: show a message that no specific page is available
      showSnackbar(`No specific page available for this action. Please complete it manually.`, 'info');
    }
    
    handlePopupClose();
  };

  // Handle starting an action (navigate to appropriate page)
  const handleStartAction = async (action) => {
    if (process.env.NODE_ENV === 'development') {
      console.log('handleStartAction called for action:', action);
    }
    
    // Find the workflow for this action
    const workflowForAction = findWorkflowForAction(action.id);
    if (!workflowForAction) {
      showSnackbar('Could not find workflow for this action', 'error');
      return;
    }

    // Check permissions first
    const hasPermission = await canUserPerformAction(workflowForAction, action, username);
    if (!hasPermission) {
      // Provide more specific error message for hiring workflows
      const isHiringWorkflow = workflowForAction.metadata?.workflowType === 'hiring_process' ||
                             workflowForAction.name?.includes('Hiring Process');
      
      if (isHiringWorkflow) {
        showSnackbar(
          `This action can only be performed by the ${action.metadata?.requiredRole || 'authorized'} user for this hiring process.`,
          'warning'
        );
      } else {
        showSnackbar('You do not have permission to start this action', 'warning');
      }
      return;
    }

    // Get the navigation URL for this action
    const navigationUrl = getActionNavigationUrl(action, workflowForAction, username);
    
    if (navigationUrl) {
      // Navigate to the specific page for this action
      router.push(navigationUrl);
    } else {
      // Fallback: show a message that no specific page is available
      showSnackbar(`No specific page available for this action. Please complete it manually.`, 'info');
    }
    
    handlePopupClose();
  };

  // Helper function to find action state for a given action ID
  const findActionStateForAction = (workflowState, actionId) => {
    if (!workflowState || !workflowState.actionStates) {
      return null;
    }

    // Search through the flat action states array
    return workflowState.actionStates.find(actionState => actionState.actionId === actionId);
  };

  // Helper function to find which workflow contains a specific action (including child actions)
  const findWorkflowForAction = (actionId) => {
    const findInActions = (actions) => {
      for (const action of actions) {
        if (action.id === actionId) return true;
        if (action.childActions?.length > 0 && findInActions(action.childActions)) {
          return true;
        }
      }
      return false;
    };

    return workflows.find(workflow => 
      workflow.actions && findInActions(workflow.actions)
    );
  };

  // Helper function to update an action anywhere in the workflow tree
  const updateActionInWorkflows = (workflows, actionId, updates) => {
    const updateInActions = (actions) => {
      return actions.map(action => {
        if (action.id === actionId) {
          return { ...action, ...updates };
        }
        if (action.childActions?.length > 0) {
          return {
            ...action,
            childActions: updateInActions(action.childActions)
          };
        }
        return action;
      });
    };

    return workflows.map(workflow => ({
      ...workflow,
      actions: workflow.actions ? updateInActions(workflow.actions) : []
    }));
  };

  // Helper function to find parent action for a child action
  const findParentActionForChild = (childActionId) => {
    for (const workflow of workflows) {
      for (const action of workflow.actions || []) {
        if (action.childActions?.some(child => child.id === childActionId)) {
          return action;
        }
      }
    }
    return null;
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
      <Box sx={{ mb: 4, display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
        <Button
          component={Link}
          href="/"
          startIcon={<ArrowBackIcon />}
          variant="outlined"
          sx={{ minWidth: 'auto' }}
        >
          Back to Dashboard
        </Button>
        {/* Action Buttons */}
        <Box sx={{ display: 'flex', gap: 2 }}>
          <Button
            variant="outlined"
            size="large"
            startIcon={<FilterListIcon />}
            onClick={() => setFilterDrawerOpen(true)}
            sx={{ minWidth: 200 }}
          >
            Filter & Sort
          </Button>
          
          <Button
            variant="outlined"
            size="large"
            startIcon={<GridViewIcon />}
            onClick={() => setShowGridView(!showGridView)}
            sx={{ minWidth: 200 }}
          >
            {showGridView ? 'Hide Action Grid' : 'Show All Actions'}
          </Button>
          
          {(userRole === 'ADMIN' || userRole === 'EMPLOYER') && (
            <Button
              variant="outlined"
              size="large"
              component={Link}
              href="/Workflows/AllWorkflows"
              sx={{ minWidth: 200 }}
            >
              Spreadsheet View
            </Button>
          )}
        </Box>
      </Box>



      {/* Error Alert */}
      {error && (
        <Alert severity="warning" sx={{ mb: 3 }}>
          {error}
        </Alert>
      )}

        {/* Loading indicator */}
        {loading && (
          <Box sx={{ display: 'flex', justifyContent: 'center', py: 4 }}>
            <CircularProgress />
          </Box>
        )}
  
        {/* Global Workflow Stats */}
        {!loading && !error && (() => {
          // Flatten all actions from all workflows, including child actions
          const flattenActions = (actions) => {
            return actions.reduce((acc, action) => {
              acc.push(action);
              if (action.childActions?.length > 0) {
                acc.push(...flattenActions(action.childActions));
              }
              return acc;
            }, []);
          };
          
          const allActions = filteredWorkflows.reduce((acc, workflow) => {
            return [...acc, ...flattenActions(workflow.actions?.filter(action => action.actionType !== 'workflow') || [])];
          }, []);
          
          const completedCount = allActions.filter(a => a.status === 'completed').length;
          const inProgressCount = allActions.filter(a => a.status === 'in-progress').length;
          const pendingCount = allActions.filter(a => a.status === 'pending').length;
          return (
            <Box sx={{ mb: 3, display: 'flex', gap: 2, flexWrap: 'wrap' }}>
              <Chip 
                label={`${completedCount} Completed`}
                icon={<CheckCircleIcon />}
                sx={{
                  backgroundColor: '#2e7d32',
                  color: 'white',
                  fontWeight: 'bold',
                  '& .MuiChip-icon': { color: 'white' }
                }}
                size="small"
              />
              <Chip 
                label={`${inProgressCount} In Progress`}
                icon={<PlayArrowIcon />}
                sx={{
                  backgroundColor: '#1976d2',
                  color: 'white',
                  fontWeight: 'bold',
                  '& .MuiChip-icon': { color: 'white' }
                }}
                size="small"
              />
              <Chip 
                label={`${pendingCount} Pending`}
                icon={<AssignmentIcon />}
                sx={{
                  backgroundColor: '#616161',
                  color: 'white',
                  fontWeight: 'bold',
                  '& .MuiChip-icon': { color: 'white' }
                }}
                size="small"
              />
            </Box>
          );
        })()}

        {/* Workflow Summary */}
        {!loading && !error && workflows.length > 0 && (
          <Box sx={{ mt: 3, mb: 2, display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <Typography variant="body2" color="text.secondary">
              Showing {filteredWorkflows.length} of {workflows.length} workflows
            </Typography>
            {(progressFilter !== 'all' || statusFilter !== 'all' || hideOverdueRejected || !showExpiredActions) && (
              <Typography variant="body2" color="primary">
                Filters applied
              </Typography>
            )}
          </Box>
        )}

        {/* Main Content - Workflow Cards */}
        {!loading && !error && (
          <Box sx={{ mt: 1 }}>
            {filteredWorkflows.length === 0 && workflows.length > 0 ? (
              <Paper sx={{ p: 4, textAlign: 'center' }}>
                <Typography variant="h6" color="text.secondary">
                  No workflows match your current filters
                </Typography>
                <Typography variant="body2" color="text.secondary" sx={{ mt: 1 }}>
                  Try adjusting your search terms or filter settings
                </Typography>
                <Button
                  variant="outlined"
                  onClick={clearAllFilters}
                  sx={{ mt: 2 }}
                >
                  Clear All Filters
                </Button>
              </Paper>
            ) : (
              filteredWorkflows.map((workflow) => (
                <WorkflowCard
                  key={workflow.id}
                  workflow={workflow}
                  expanded={expandedWorkflows.has(workflow.id)}
                  onToggleExpand={handleToggleWorkflowExpand}
                  onActionClick={handleActionClick}
                  onActionMenuClick={handleActionMenuClick}
                  handleStartAction={handleStartAction}
                  handleCompleteAction={handleCompleteAction}
                />
              ))
            )}

            
            {/* Grid View of All Actions */}
            {showGridView && (
              <Box sx={{ mt: 3 }}>
                <Typography variant="h5" fontWeight="600" sx={{ mb: 3, textAlign: 'center' }}>
                  All Actions Grid View
                </Typography>
                <ActionsGrid 
                  workflows={filteredWorkflows} 
                  onActionClick={handleActionClick}
                  onActionMenuClick={handleActionMenuClick}
                />
              </Box>
            )}
          </Box>
        )}
        

  
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
              Go to Action Page
            </MenuItem>
          )}
          {selectedActionForMenu && (selectedActionForMenu.status === 'in-progress' || selectedActionForMenu.status === 'pending') && (
            <MenuItem onClick={() => {
              handleCompleteAction(selectedActionForMenu);
              handleActionMenuClose();
            }}>
              <CheckCircleIcon sx={{ mr: 1 }} />
              Go to Action Page
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
          message={snackbarMessage}
          anchorOrigin={{ vertical: 'bottom', horizontal: 'center' }}
          ContentProps={{
            sx: {
              backgroundColor:
                snackbarSeverity === 'success'
                  ? '#388e3c'
                  : snackbarSeverity === 'error'
                  ? '#d32f2f'
                  : snackbarSeverity === 'warning'
                  ? '#f57c00'
                  : '#1976d2',
              color: 'white',
              fontWeight: 500,
              fontSize: '1rem',
            },
          }}
        />

      {/* Filter & Sort Drawer */}
      <Drawer
        anchor="right"
        open={filterDrawerOpen}
        onClose={() => setFilterDrawerOpen(false)}
        PaperProps={{
          sx: { width: 350, p: 0 }
        }}
      >
        <Box sx={{ p: 2, display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderBottom: 1, borderColor: 'divider' }}>
          <Typography variant="h6" fontWeight="600">
            Filter & Sort
          </Typography>
          <IconButton onClick={() => setFilterDrawerOpen(false)} size="small">
            <CloseIcon />
          </IconButton>
        </Box>

        <Box sx={{ p: 2 }}>
          {/* Summary */}
          <Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
            Showing {filteredWorkflows.length} of {workflows.length} workflows
          </Typography>
          {/* Sort Section */}
          <Box sx={{ mb: 3 }}>
            <Button
              fullWidth
              variant="text"
              onClick={() => setSortExpanded(!sortExpanded)}
              endIcon={sortExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              sx={{ justifyContent: 'space-between', mb: 1 }}
            >
              <Typography variant="subtitle1" fontWeight="600">Sort</Typography>
            </Button>
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              {sortBy === 'progress' ? 'Progress' : sortBy === 'name' ? 'Name' : sortBy === 'status' ? 'Status' : 'Progress'}
            </Typography>
            <Collapse in={sortExpanded}>
              <RadioGroup
                value={`${sortBy}-${sortOrder}`}
                onChange={(e) => {
                  const [field, order] = e.target.value.split('-');
                  setSortBy(field);
                  setSortOrder(order);
                }}
              >
                <FormControlLabel value="progress-desc" control={<Radio />} label="Progress: High to Low" />
                <FormControlLabel value="progress-asc" control={<Radio />} label="Progress: Low to High" />
                <FormControlLabel value="name-asc" control={<Radio />} label="Name: A to Z" />
                <FormControlLabel value="name-desc" control={<Radio />} label="Name: Z to A" />
                <FormControlLabel value="status-asc" control={<Radio />} label="Status: A to Z" />
              </RadioGroup>
            </Collapse>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Progress Section */}
          <Box sx={{ mb: 3 }}>
            <Button
              fullWidth
              variant="text"
              onClick={() => setProgressExpanded(!progressExpanded)}
              endIcon={progressExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              sx={{ justifyContent: 'space-between', mb: 1 }}
            >
              <Typography variant="subtitle1" fontWeight="600">Progress</Typography>
            </Button>
            <Collapse in={progressExpanded}>
              <RadioGroup
                value={progressFilter}
                onChange={(e) => setProgressFilter(e.target.value)}
              >
                <FormControlLabel value="all" control={<Radio />} label="All Progress Levels" />
                <FormControlLabel value="completed" control={<Radio />} label="Completed (100%)" />
                <FormControlLabel value="inprogress" control={<Radio />} label="In Progress (1-99%)" />
                <FormControlLabel value="notstarted" control={<Radio />} label="Not Started (0%)" />
              </RadioGroup>
            </Collapse>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Status Section */}
          <Box sx={{ mb: 3 }}>
            <Button
              fullWidth
              variant="text"
              onClick={() => setStatusExpanded(!statusExpanded)}
              endIcon={statusExpanded ? <ExpandLessIcon /> : <ExpandMoreIcon />}
              sx={{ justifyContent: 'space-between', mb: 1 }}
            >
              <Typography variant="subtitle1" fontWeight="600">Status</Typography>
            </Button>
            <Collapse in={statusExpanded}>
              <RadioGroup
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <FormControlLabel value="all" control={<Radio />} label="All Statuses" />
                <FormControlLabel value="active" control={<Radio />} label="Active Workflows" />
                <FormControlLabel value="rejected" control={<Radio />} label="Rejected Applications" />
                <FormControlLabel value="completed" control={<Radio />} label="Completed (Hired)" />
              </RadioGroup>
            </Collapse>
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Advanced Options Section */}
          <Box sx={{ mb: 3 }}>
            <Typography variant="subtitle1" fontWeight="600" sx={{ mb: 2 }}>
              Advanced Options
            </Typography>
            
            <FormControlLabel
              control={
                <Switch
                  checked={hideOverdueRejected}
                  onChange={(e) => setHideOverdueRejected(e.target.checked)}
                  color="primary"
                />
              }
              label={
                <Box>
                  <Typography variant="body2">
                    Hide Overdue/Rejected
                  </Typography>
                  <Typography variant="caption" color="text.secondary">
                    Filter out overdue and rejected workflows
                  </Typography>
                </Box>
              }
              sx={{ alignItems: 'flex-start', mb: 2 }}
            />

            {userRole === 'ADMIN' && (
              <FormControlLabel
                control={
                  <Switch
                    checked={showExpiredActions}
                    onChange={(e) => setShowExpiredActions(e.target.checked)}
                    color="primary"
                  />
                }
                label={
                  <Box>
                    <Typography variant="body2">
                      Show Expired Actions
                    </Typography>
                    <Typography variant="caption" color="text.secondary">
                      Include actions past their deadline
                    </Typography>
                  </Box>
                }
                sx={{ alignItems: 'flex-start' }}
              />
            )}
          </Box>

          <Divider sx={{ my: 2 }} />

          {/* Clear Filters Button */}
          <Button
            variant="outlined"
            color="secondary"
            fullWidth
            onClick={clearAllFilters}
            sx={{ mt: 2 }}
          >
            Clear All Filters
          </Button>
        </Box>
      </Drawer>
      </Container>
  );
}
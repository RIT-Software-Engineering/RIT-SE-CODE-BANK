// src/components/positions/PositionsCard.js
'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { useState, useMemo } from 'react';
import ConfirmationModal from '../common/models/ConfirmationModal';
import EditableApplicationForm from '../applications/EditableApplicationForm';
import { getCandidateHiredStatus } from '@/services/db-apis';
import { formatDate, formatTime } from '@/utils/applicationUtils';
import {
  gradeEnumToStringValue,
  letterToGradeValue,
} from '@/constants/gradeConstants';
import PositionTracker from './EmployerAndAdmin/PositionTracker';
import ViewablePositionForm from './EmployerAndAdmin/ViewablePositionForm';
import ViewableNoteForm from '../notes/ViewableNoteForm';
import { positionStatusEnumToString } from '@/constants/positionStatusConstants';

import {
  Box,
  Button,
  CircularProgress,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Tooltip,
  Typography,
  Grid,
  GridItem,
  List,
  ListItem,
  ListItemIcon,
  ListItemText,
} from '@mui/material';
import {
  MoreVert as EllipsisVerticalIcon,
  CheckCircleOutline as CheckIcon,
  CancelOutlined as XIcon,
  CalendarMonth as CalendarIcon,
  AccessTime as ClockIcon,
  LocationOn as LocationIcon,
  Person,
} from '@mui/icons-material';

/**
 * A Requirement component to show a single requirement.
 * @param {{ text: string, met: boolean }} props
 * @prop {string} text The requirement text
 * @prop {boolean} met Whether the requirement is met or not
 * @returns {ReactElement} The requirement component
 */
const Requirement = ({ text, met }) => (
  <ListItem sx={{ py: 0.5, px: 0 }}>
    <ListItemIcon sx={{ minWidth: 'auto', mr: 1, color: met ? 'success.main' : 'error.main' }}>
      {met ? <CheckIcon fontSize="small" /> : <XIcon fontSize="small" />}
    </ListItemIcon>
    <ListItemText primary={text} primaryTypographyProps={{ variant: 'body2', color: met ? 'text.primary' : 'error.main' }} />
  </ListItem>
);

/**
 * A card component to display a job position.
 * @prop {JobPosition} position The job position to display
 * @prop {(position: JobPosition) => void} onEdit A callback to edit the position
 * @prop {(positionId: string) => void} onApprove A callback to approve the position
 * @prop {(positionId: string) => void} onReject A callback to reject the position
 * @prop {boolean} showEditAction Whether to show the edit action
 * @prop {boolean} showApproveRejectActions Whether to show the approve and reject actions
 * @prop {boolean} showTracker Whether to show the position tracker
 * @returns {ReactElement} The card component
 */
export default function PositionsCard({
  position,
  onEdit,
  onApprove,
  onReject,
  onOnHold,
  onInactive,
  onReactivate,
  showEditAction,
  showReactivate,
  showOnHold,
  showInactive,
  showApproveRejectActions,
  showTracker,
}) {
  const { currentUser, refreshUserProfile } = useAuth();
  const { showNotification } = useNotification();

  const [isFormOpen, setIsFormOpen] = useState(false);
  const [isViewingDetails, setIsViewingDetails] = useState(false);
  const [isViewingNotes, setIsViewingNotes] = useState(false);
  const [isConfirmingApplication, setIsConfirmingApplication] = useState(false);
  const [isCheckingHiredStatus, setIsCheckingHiredStatus] = useState(false);

  const hasApplied =
    currentUser?.candidate?.jobPositionApplicationHistory?.some(
      (app) => app.jobPositionId === position.id
    ) || false;

  const eligibilityDetails = useMemo(() => {
    if (!currentUser?.candidate) {
      return { details: [], isOverallEligible: false, reason: 'User is not a candidate.' };
    }

    const requirements = [];
    const candidateStatus = currentUser.candidate.graduateStatus;
    const courseInData = currentUser.candidate.courseHistory.find(
      (historyItem) => historyItem.courseCode === position.courseCode
    );

    if (position.graduateStatusRequirement) {
      const met = candidateStatus === position.graduateStatusRequirement;
      requirements.push({ text: `Must be a ${position.graduateStatusRequirement.toLowerCase()} candidate`, met });
    }
    if (position.courseTakenRequirement) {
      const met = !!courseInData;
      requirements.push({ text: `Must have taken ${position.courseCode}`, met });
    }
    if (position.gradeRequirement) {
      const requiredValue = letterToGradeValue[position.gradeRequirement];
      const userValue = courseInData ? letterToGradeValue[gradeEnumToStringValue[courseInData.grade]] : 0;
      const met = userValue >= requiredValue;
      requirements.push({ text: `Requires a grade of ${position.gradeRequirement} or higher`, met });
    }

    const isOverallEligible = requirements.every((req) => req.met);
    const unmetReasons = requirements.filter((req) => !req.met).map((req) => req.text);
    return { details: requirements, isOverallEligible, reason: unmetReasons.join(' and ') };
  }, [currentUser, position]);

  const handleApplyClick = async () => {
    if (!position?.semesterCode) {
      showNotification('Cannot check your status: Semester code is missing.', 'error');
      setIsFormOpen(true);
      return;
    }

    setIsCheckingHiredStatus(true);
    try {
      const hiredStatus = await getCandidateHiredStatus(currentUser.username, position.semesterCode);
      if (hiredStatus) {
        setIsConfirmingApplication(true);
      } else {
        setIsFormOpen(true);
      }
    } catch (error) {
      console.error('Failed to check hired status:', error);
      showNotification(`Error checking your status: ${error.message}`, 'error');
      setIsFormOpen(true);
    } finally {
      setIsCheckingHiredStatus(false);
    }
  };

  const renderApplyButton = () => {
    if (hasApplied) {
      return (
        <Button variant="contained" color="success" sx={{ cursor: 'default', pointerEvents: 'none' }}>
          Applied
        </Button>
      );
    }

    if (eligibilityDetails.isOverallEligible) {
      return (
        <Button
          onClick={handleApplyClick}
          disabled={isCheckingHiredStatus}
          variant="contained"
          color="primary"
        >
          {isCheckingHiredStatus ? <CircularProgress size={24} color="inherit" /> : 'Apply Now'}
        </Button>
      );
    }

    return (
      <Tooltip title={eligibilityDetails.reason} arrow>
        <span>
          <Button variant="contained" disabled>
            Apply Now
          </Button>
        </span>
      </Tooltip>
    );
  };

  const ActionsMenu = () => {
    const [anchorEl, setAnchorEl] = useState(null);
    const handleMenuClick = (event) => setAnchorEl(event.currentTarget);
    const handleMenuClose = () => setAnchorEl(null);

    const status = position.jobPositionStatus;
    const showEdit = showEditAction;
    const showApprove = showApproveRejectActions && status === 'PENDING_APPROVAL';
    const showReject = showApproveRejectActions && status === 'PENDING_APPROVAL';
    const showActionItems = showEdit || showApprove || showReject;

    return (
      <>
        <IconButton onClick={handleMenuClick}>
          <EllipsisVerticalIcon />
        </IconButton>
        <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
          <MenuItem onClick={() => { setIsViewingDetails(true); handleMenuClose(); }}>View Details</MenuItem>
          <MenuItem onClick={() => { setIsViewingNotes(true); handleMenuClose(); }}>View Notes</MenuItem>
          {showActionItems && <Divider />}
          {(showOnHold && status !== 'ONHOLD') && (<MenuItem onClick={() => { onOnHold(position.id); handleMenuClose(); }}>Put Position on Hold </MenuItem>)}
          {(showInactive && status !== 'INACTIVE') && (<MenuItem onClick={() => { onInactive(position.id); handleMenuClose(); }}> Mark Position Inactive</MenuItem>)}
          {showReactivate && (status === 'ONHOLD' || status === 'INACTIVE') && <MenuItem onClick={() => { onReactivate(position.id); handleMenuClose(); }}>Reactivate Position</MenuItem>}
          {showActionItems && <Divider />}
          {showEdit && <MenuItem onClick={() => { onEdit(position); handleMenuClose(); }}>Edit Position</MenuItem>}
          {showApprove && <MenuItem onClick={() => { onApprove(position.id); handleMenuClose(); }}>Approve Position</MenuItem>}
          {showReject && <MenuItem onClick={() => { onReject(position.id); handleMenuClose(); }} sx={{ color: 'error.main' }}>Reject Position</MenuItem>}
        </Menu>
      </>
    );
  };

  return (
    <>
      <Paper elevation={3} sx={(theme) => ({
        p: { xs: 2, md: 3 }, background: theme.palette.mode === 'dark'
          ? "" : "white"
      })}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }} >
          <Box flexGrow={1} >
            <Typography variant="h2" component="h2" gutterBottom>
              {position.course.name}
            </Typography>
            <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace', bgcolor: 'action.hover', px: 1, py: 0.5, borderRadius: 1, display: 'inline-block' }}>
              {position.id}
            </Typography>
            <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary', mt: 1 }}>
              <CalendarIcon sx={{ mr: 1, fontSize: '1rem' }} />
              <Typography variant="body2">
                {formatDate(position.startDate)} - {formatDate(position.endDate)}
              </Typography>
            </Box>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
            {(currentUser?.role === 'ADMIN' || currentUser?.role === 'EMPLOYER') && <ActionsMenu />}
            {(currentUser?.role === 'CANDIDATE' || currentUser?.role === 'EMPLOYEE') && renderApplyButton()}
          </Box>
        </Box>

        <Divider sx={{ my: 2 }} />

        <Typography color="text.secondary" sx={{ mb: 2 }}>
          {position.course.description}
        </Typography>
        <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 2, sm: 4 } }}>
          <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
            <LocationIcon sx={{ mr: 1 }} />
            <Typography variant="body2">{position.location}</Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
            <Person sx={{ mr: 1 }} />
            <Typography variant="body2">
              {position.employer.user.fname} {position.employer.user.lname} ({position.employer.user.email})
            </Typography>
          </Box>
          <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
            <ClockIcon sx={{ mr: 1 }} />
            <Box>
              {position.jobSchedules.map((slot, i) => (
                <Typography key={i} variant="body2">
                  <Box component="span" fontWeight="bold">{slot.dayOfWeek}:</Box> {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                </Typography>
              ))}
            </Box>
          </Box>
        </Box>
        {/*(currentUser && (role === "ADMIN" || currentUser?.role === "EMPLOYER")) && (
          <Box>
            <Typography variant="body2" color="text.secondary">Actions:</Typography>
            <Grid container spacing={2} sx={{ mt: 1 }}>
              <Grid item xs={12} sm={6}>
                <Button
                  variant="outlined"
                  onClick={() => { setIsViewingDetails(true); handleMenuClose(); }}>View Details
                </Button>
              </Grid>

              <Grid item xs={12} sm={6}>
                <Button
                  variant="outlined"
                  onClick={() => { setIsViewingNotes(true); handleMenuClose(); }}>View Notes
                </Button>
              </Grid>

              {showEdit && (
                <Grid item xs={12} sm={6}>
                  <Button variant="outlined" onClick={() => { onEdit(position); handleMenuClose(); }}>Edit Position
                  </Button>
                </Grid>
              )}
              {showApprove && (
                <Grid item xs={12} sm={6}>
                  <Button variant="outlined" onClick={() => { onApprove(position.id); handleMenuClose(); }}>Approve Position
                  </Button>
                </Grid>
              )}
              {showReject && (
                <Grid item xs={12} sm={6}>
                  <Button variant="contained" color="error" onClick={() => { onReject(position.id); handleMenuClose(); }} sx={{ color: 'error.main' }}>Reject Position
                  </Button>
                </Grid>
              )}


            </Grid>
          </Box>
        )*/}
        {(currentUser?.role === 'CANDIDATE' || currentUser?.role === 'EMPLOYEE') && eligibilityDetails.details.length > 0 && (
          <Paper variant="outlined" sx={{ mt: 2, p: 2, bgcolor: 'action.hover' }}>
            <Typography variant="h3" sx={{ mb: 1 }}>Job Requirements</Typography>
            <List dense>
              {eligibilityDetails.details.map((req, i) => (
                <Requirement key={i} text={req.text} met={req.met} />
              ))}
            </List>
          </Paper>
        )}

        {showTracker && (
          <>
            <Divider sx={{ my: 2 }} />
            <PositionTracker currentStep={position.jobPositionStatus} />
          </>
        )}
      </Paper>

      {isFormOpen && (
        <EditableApplicationForm user={currentUser} position={position} onClose={() => setIsFormOpen(false)} onApplySuccess={refreshUserProfile} />
      )}
      {isViewingDetails && (
        <ViewablePositionForm position={position} onClose={() => setIsViewingDetails(false)} />
      )}
      {isViewingNotes && (
        <ViewableNoteForm
          foreignKey={position.id}
          foreignTableName="JobPosition"
          itemTitle="Position Note History"
          itemSubtitle={position.course.name}
          statusEnumMap={positionStatusEnumToString}
          userRole={currentUser.role}
          onClose={() => setIsViewingNotes(false)}
        />
      )}

      <ConfirmationModal
        isOpen={isConfirmingApplication}
        onClose={() => setIsConfirmingApplication(false)}
        onConfirm={() => { setIsConfirmingApplication(false); setIsFormOpen(true); }}
        title="Confirm New Application"
        isConfirming={isCheckingHiredStatus}
      >
        <Typography sx={{ mt: 2 }}>
          You have already accepted an offer for another position this semester. In most cases, you are expected to accept <strong>only one offer</strong> per semester. You can still apply for other positions, but please be prepared to communicate with the professors involved if you receive multiple offers.
        </Typography>
        <Typography sx={{ mt: 2, fontWeight: 'bold' }}>
          Are you sure you want to proceed with this application?
        </Typography>
      </ConfirmationModal>
    </>
  );
}
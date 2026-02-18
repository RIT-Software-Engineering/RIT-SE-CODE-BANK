// src/components/applications/CandidateAndEmployee/ApplicationCard.js
"use client";

import { useState } from 'react';
import { deleteApplication, updateCandidateApplicationStatus, getCandidateHiredStatus } from '@/services/db-apis';
import ViewableApplicationForm from '../ViewableApplicationForm';
import ConfirmationModal from '../../common/models/ConfirmationModal';
import {
  formatDate,
  formatTime,
  getStatusChipColor,
} from "@/utils/applicationUtils";
import { useNotification } from "@/contexts/NotificationContext";
import ViewableNoteForm from "../../notes/ViewableNoteForm";
import EditableNoteForm from "@/components/notes/EditableNoteForm";
import { applicationStatusEnumToString } from '@/constants/applicationStatusConstants';
import ApplicationProgressTracker from "@/components/applications/ApplicationProgressTracker";


import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Divider,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Typography,
  Grid
} from '@mui/material';
import {
  CalendarMonth as CalendarIcon,
  AccessTime as ClockIcon,
  MoreVert as EllipsisVerticalIcon,
  LocationOn as LocationIcon,
  Person,
} from '@mui/icons-material';

/**
 * Component for displaying and managing a candidate's job application. Provides options to view the job position's details,
 * review application documents, track application status, and update candidate status (i.e. interview, offer, reject, hire).
 *
 * @param {Object} props - Component props
 * @param {Object} props.currentUser - The currently logged-in user object
 * @param {Object} props.application - The job application object (also contains the job position it's associated with)
 * @param {Function} props.refreshUserProfile - Callback to refresh user data in the parent component
 * @param {Function} [props.onStatusChange] - Optional callback triggered after application status changes
 */
export default function CandidateApplicationCard({
  currentUser,
  application,
  refreshUserProfile,
  onStatusChange,
  // Optional deep-link highlighting support
  cardId,
  isHighlighted = false,
}) {
  const { id } = application;
  const { showNotification } = useNotification();
  const [isViewingApplication, setIsViewingApplication] = useState(false);
  const [isConfirmingDeletion, setIsConfirmingDeletion] = useState(false);
  const [isProcessingDeletion, setIsProcessingDeletion] = useState(false);
  const [isViewingNotes, setIsViewingNotes] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);
  const [clearConfirm, setShowClearConfirm] = useState(false);

  const [modalState, setModalState] = useState({
    isOpen: false,
    status: null,
    title: "",
  });
  const [isProcessingUpdate, setIsProcessingUpdate] = useState(false);

  const [isConfirmingAcceptance, setIsConfirmingAcceptance] = useState(false);
  const [isCheckingHiredStatus, setIsCheckingHiredStatus] = useState(false);

  const { jobPosition, jobApplicationStatus } = application;
  const statusColor = getStatusChipColor(jobApplicationStatus);

  const handleMenuClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleMenuClose = () => {
    setAnchorEl(null);
  };

  const handleOpenUpdateModal = (status, title) => {
    setModalState({ isOpen: true, status, title });
    handleMenuClose();
  };

  const handleCloseUpdateModal = () => {
    setModalState({ isOpen: false, status: null, title: "" });
  };

  const handleAcceptOffer = async () => {
    if (!jobPosition?.semesterCode) {
      showNotification(
        "Cannot check your status: Semester code is missing.",
        "error"
      );
      return;
    }

    setIsCheckingHiredStatus(true);
    handleMenuClose();
    try {
      const hiredStatus = await getCandidateHiredStatus(
        currentUser.username,
        jobPosition.semesterCode
      );

      if (hiredStatus) {
        setIsConfirmingAcceptance(true);
      } else {
        handleOpenUpdateModal("ACCEPTED_OFFER", "Accept Position Offer");
      }
    } catch (error) {
      console.error("Failed to check hired status:", error);
      showNotification(`Error checking your status: ${error.message}`, "error");
    } finally {
      setIsCheckingHiredStatus(false);
    }
  };

  const handleDeleteClick = () => {
    setIsConfirmingDeletion(true);
    handleMenuClose();
  };

  const executeDeletion = async () => {
    setIsProcessingDeletion(true);
    try {
      await deleteApplication(currentUser.username, application.jobPositionId);
      await refreshUserProfile();
      showNotification("Application deleted successfully.", "success");
      if (onStatusChange) {
        onStatusChange();
      }
    } catch (error) {
      console.error("Failed to delete application:", error);
      showNotification("Failed to delete application.", "error");
    } finally {
      setIsProcessingDeletion(false);
      setIsConfirmingDeletion(false);
    }
  };

  const handleConfirmUpdate = async (note) => {
    setIsProcessingUpdate(true);
    try {
      let fullName = `${currentUser.fname} ${currentUser.lname}`;
      await updateCandidateApplicationStatus(
        fullName,
        id,
        modalState.status,
        note
      );
      showNotification(
        `Application status successfully updated to "${modalState.status?.replace(
          "_",
          " "
        )}".`,
        "success"
      );
      if (onStatusChange) {
        onStatusChange();
      }
    } catch (error) {
      console.error("Failed to update status:", error);
      showNotification(`Error: ${error.message}`, "error");
    } finally {
      setIsProcessingUpdate(false);
      handleCloseUpdateModal();
    }
  };

  return (
    <>
      <Paper
        id={cardId}
        tabIndex={-1}
        elevation={3}
        sx={{
          overflow: 'hidden',
          outline: isHighlighted ? '3px solid #F76902' : 'none',
          boxShadow: isHighlighted ? '0 0 0 4px rgba(247,105,2,0.18)' : undefined,
          backgroundColor: isHighlighted ? '#FFF8F1' : undefined,
          transition: 'background-color 600ms, box-shadow 600ms, outline 600ms',
          '@keyframes flashPulse': {
            '0%': { backgroundColor: '#FFF8F1' },
            '50%': { backgroundColor: '#FFEAD9' },
            '100%': { backgroundColor: '#FFF8F1' },
          },
          animation: isHighlighted ? 'flashPulse 1.2s ease-in-out 2' : 'none',
        }}
      >
        <Box sx={(theme) => ({
          p: { xs: 2, md: 3 }, background: theme.palette.mode === 'dark'
            ? "" : "white"
        })}>
          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
            <Box >
              <Typography variant="h2" component="h2" gutterBottom>
                {jobPosition.course.name}
              </Typography>
              <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace', bgcolor: 'action.hover', px: 1, py: 0.5, borderRadius: 1, display: 'inline-block' }}>
                {jobPosition.id}
              </Typography>
              <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary', mt: 1 }}>
                <CalendarIcon sx={{ mr: 1, fontSize: '1.25rem' }} />
                <Typography variant="body2">
                  {formatDate(jobPosition.startDate)} - {formatDate(jobPosition.endDate)}
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={handleMenuClick} disabled={isCheckingHiredStatus}>
              {isCheckingHiredStatus ? <CircularProgress size={24} /> : <EllipsisVerticalIcon />}
            </IconButton>
            <Menu
              anchorEl={anchorEl}
              open={Boolean(anchorEl)}
              onClose={handleMenuClose}
            >
              <MenuItem onClick={() => { setIsViewingApplication(true); handleMenuClose(); }}>View Application</MenuItem>
              <MenuItem onClick={() => { setIsViewingNotes(true); handleMenuClose(); }}>View Notes</MenuItem>
              {(jobApplicationStatus.toLowerCase() === "applied" || jobApplicationStatus.toLowerCase() === "interview") && (
                <MenuItem onClick={handleDeleteClick} sx={{ color: 'error.main' }}>Delete Application</MenuItem>
              )}
              {jobApplicationStatus.toLowerCase() === "pending_offer" && (
                <MenuItem onClick={handleAcceptOffer}>Accept Offer</MenuItem>
              )}
              {jobApplicationStatus.toLowerCase() === "pending_offer" && (
                <MenuItem onClick={() => handleOpenUpdateModal("DECLINED_OFFER", "Decline Position Offer")} sx={{ color: 'error.main' }}>Decline Offer</MenuItem>
              )}
            </Menu>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Typography color="text.secondary" sx={{ mb: 2 }}>
            {jobPosition.course.description}
          </Typography>

          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: { xs: 2, sm: 4 } }}>
            <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
              <LocationIcon sx={{ mr: 1, fontSize: '1.25rem' }} />
              <Typography variant="body2">{jobPosition.location}</Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
              <Person sx={{ mr: 1 }} />
              <Typography variant="body2">
                {jobPosition.employer.user.fname} {jobPosition.employer.user.lname} ({jobPosition.employer.user.email})
              </Typography>
            </Box>
            <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary' }}>
              <ClockIcon sx={{ mr: 1, fontSize: '1.25rem' }} />
              <Box>
                {jobPosition.jobSchedules.map((slot, i) => (
                  <Typography key={i} variant="body2">
                    <Typography component="span" fontWeight="bold">{slot.dayOfWeek}:</Typography> {formatTime(slot.startTime)} - {formatTime(slot.endTime)}
                  </Typography>
                ))}
              </Box>
            </Box>
          </Box>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
            <Box sx={{ width: { xs: '100%', md: '65%' } }}>
              <ApplicationProgressTracker currentStep={jobApplicationStatus} />
            </Box>
            <Chip
              label={jobApplicationStatus?.replace("_", " ")}
              color={statusColor}
              sx={{ fontWeight: 'bold', fontSize: '1rem' }}
            />
          </Box>

          <Divider sx={{ my: 3 }} />
          <Typography variant="body2" color="text.secondary">Actions:</Typography>

          <Box sx={{ display: "flex", justifyContent: "space-between" }}>
            <Grid container spacing={2}>
              <Grid item xs={12} sm={6}>
                <Button variant="outlined" onClick={() => { setIsViewingApplication(true); handleMenuClose(); }}>View Application</Button>
              </Grid>
              <Button variant="outlined" onClick={() => { setIsViewingNotes(true); handleMenuClose(); }}>View Notes</Button>


              {jobApplicationStatus.toLowerCase() === "pending_offer" && (
                <Grid item xs={12} sm={6}>
                  <Button variant="outlined" onClick={handleAcceptOffer}>Accept Offer</Button>
                </Grid>)}

            </Grid>

            {(jobApplicationStatus.toLowerCase() === "applied" || jobApplicationStatus.toLowerCase() === "interview") && (
              <Button variant="contained" color="error" onClick={handleDeleteClick} >Delete Application</Button>
            )}
            {jobApplicationStatus.toLowerCase() === "pending_offer" && (
              <Button variant="contained"color="error" onClick={() => handleOpenUpdateModal("DECLINED_OFFER", "Decline Position Offer")}>Decline Offer</Button>
            )}



          </Box>



        </Box>
      </Paper>

      <ConfirmationModal
        isOpen={isConfirmingDeletion}
        onClose={() => setIsConfirmingDeletion(false)}
        onConfirm={executeDeletion}
        title="Confirm Deletion"
        isConfirming={isProcessingDeletion}
      >
        Are you sure you want to delete your application for <strong>{jobPosition.course.name}</strong>? This action cannot be undone.
      </ConfirmationModal>

      <ConfirmationModal
        isOpen={isConfirmingAcceptance}
        onClose={() => setIsConfirmingAcceptance(false)}
        onConfirm={() => {
          setIsConfirmingAcceptance(false);
          handleOpenUpdateModal("ACCEPTED_OFFER", "Accept Position Offer");
        }}
        title="Confirm Offer Acceptance"
        isConfirming={isProcessingUpdate}
      >
        <Typography sx={{ mt: 2 }}>
          You have already accepted an offer for another position this semester. In most cases, you are expected to accept <strong>only one offer</strong> per semester. Accepting this offer will not automatically withdraw you from the other position. Please contact the administrator or the other course&apos;s professor if you wish to change your decision.
        </Typography>
        <Typography sx={{ mt: 2, fontWeight: 'bold' }}>
          Are you sure you want to accept this offer?
        </Typography>
      </ConfirmationModal>

      {isViewingApplication && (
        <ViewableApplicationForm
          position={jobPosition}
          application={application}
          onClose={() => setIsViewingApplication(false)}
        />
      )}
      {/*{{(isViewingApplication &&showClearConfirm) &&(
        <ConfirmationModal isOpen={showClearConfirm} onClose={() => setShowClearConfirm(false)} onConfirm={() => setIsViewingApplication(false)} title="Cancel Position Edits">
          Are you sure you want to cancel your edits? This action cannot be undone.
        </ConfirmationModal>
      )}
      */}
      {isViewingNotes && (
        <ViewableNoteForm
          foreignKey={application.id}
          foreignTableName="JobPositionApplicationHistory"
          itemTitle="Application Note History"
          itemSubtitle={application.jobPosition.course.name}
          statusEnumMap={applicationStatusEnumToString}
          userRole={currentUser.role}
          onClose={() => setIsViewingNotes(false)}
        />
      )}

      <EditableNoteForm
        isOpen={modalState.isOpen}
        onClose={handleCloseUpdateModal}
        onConfirm={handleConfirmUpdate}
        title={modalState.title}
        isProcessing={isProcessingUpdate}
      />
    </>
  );
}
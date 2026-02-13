// components/applications/EmployerAndAdmin/ApplicationCard.js
"use client";

import Link from "next/link";
import { useState } from "react";
import { getStatusChipColor } from "@/utils/applicationUtils";
import ViewableApplicationForm from "../ViewableApplicationForm";
import ViewableNoteForm from "../../notes/ViewableNoteForm";
import EditableNoteForm from "@/components/notes/EditableNoteForm";
import {
  updateCandidateApplicationStatus,
  getCandidateHiredStatus,
  checkJobPositionIsFull
} from "@/services/db-apis";
import ConfirmationModal from "@/components/common/models/ConfirmationModal";
import { useNotification } from "@/contexts/NotificationContext";
import { applicationStatusEnumToString } from "@/constants/applicationStatusConstants";
import ApplicationTracker from "../ApplicationProgressTracker";

import {
  Avatar,
  Box,
  Chip,
  CircularProgress,
  Divider,
  Grid,
  IconButton,
  Menu,
  MenuItem,
  Paper,
  Typography,
  Link as MuiLink,
  Button
} from '@mui/material';
import {
  MoreVert as EllipsisVerticalIcon,
  Article as DocumentIcon
} from '@mui/icons-material';

/**
 * ApplicationCard component for displaying and managing a candidate's job application for the employer/admin.
 * Provides options to view candidate details, review application documents, track application status, and 
 * update candidate status (interview, offer, reject, hire).
 *
 * @param {Object} props - Component props
 * @param {Object} props.currentUser - The currently logged-in user
 * @param {Object} props.jobPosition - The job position associated with the application
 * @param {Object} props.application - The candidate's application data
 * @param {Function} [props.onStatusChange] - Optional callback triggered after status change
 * @param {Function} [props.onHire] - Optional callback when candidate is hired
 * @param {boolean} [props.showHireAction=false] - Whether to show the "Hire Candidate" option
 */
export default function ApplicationCard({
  currentUser,
  jobPosition,
  application,
  onStatusChange,
  onHire,
  showHireAction = true,
  // Optional: deep-link highlighting and scroll targeting
  cardId,
  isHighlighted = false,
}) {
  const { showNotification } = useNotification();
  const [isViewingApplication, setIsViewingApplication] = useState(false);
  const [isViewingNotes, setIsViewingNotes] = useState(false);
  const [anchorEl, setAnchorEl] = useState(null);

  const [modalState, setModalState] = useState({
    isOpen: false,
    status: null,
    title: "",
  });
  const [isProcessingUpdate, setIsProcessingUpdate] = useState(false);

  const [isConfirmingOffer, setIsConfirmingOffer] = useState(false);
  const [isConfirmingPositionFull, setIsConfirmingPositionFull] = useState(false);
  const [pendingOfferStep, setPendingOfferStep] = useState(null);

  const [isCheckingHiredStatus, setIsCheckingHiredStatus] = useState(false);

  const { id, jobApplicationStatus, resume } = application;

  const statusColor = getStatusChipColor(jobApplicationStatus);
  const backendURL = process.env.NEXT_PUBLIC_BACKEND_URL;

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

  const handleOfferPosition = async () => {
    if (!jobPosition?.semesterCode) {
      showNotification(
        "Cannot check candidate status: Semester code is missing.",
        "error"
      );
      return;
    }

    setIsCheckingHiredStatus(true);
    handleMenuClose();
    try {
      const [hiredStatus, positionFullStatus] = await Promise.all([
        getCandidateHiredStatus(application.username, jobPosition.semesterCode),
        checkJobPositionIsFull(jobPosition.id),
      ]);

      const isFull = positionFullStatus?.isFull;

      if (hiredStatus && isFull) {
        setPendingOfferStep("positionFull");
        setIsConfirmingOffer(true);
        return;
      }

      if (hiredStatus) {
        setIsConfirmingOffer(true);
        return;
      }

      if (isFull) {
        setIsConfirmingPositionFull(true);
        return;
      }

      handleOpenUpdateModal("PENDING_OFFER", "Offer Position");

    } catch (error) {
      console.error("Failed to check offer prerequisites:", error);
      showNotification(`Error checking offer prerequisites: ${error.message}`, "error");
    } finally {
      setIsCheckingHiredStatus(false);
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

  const status = jobApplicationStatus?.toLowerCase();
  const showHireOption = showHireAction && currentUser?.role === 'ADMIN' && status === "accepted_offer";
  const showRejectOption = ["applied", "interview", "pending_offer", "accepted_offer", "hired"].includes(status);
  const showInterviewOption = status === "applied";
  const showOfferOption = ["applied", "interview"].includes(status);
  const showActionMenuItems = showHireOption || showRejectOption || showInterviewOption || showOfferOption;

  return (
    <>
      <Paper
        id={cardId}
        tabIndex={-1}
        elevation={3}
        sx={{
          overflow: 'hidden',
          mb: 3,
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
            <Box sx={{ display: 'flex', alignItems: 'center', gap: 2, flex: 1, minWidth: 0 }}>
              <Avatar sx={{ width: 56, height: 56, bgcolor: 'primary.main' }}>
                <Typography variant="h4" color="white">{application.candidateFName.charAt(0)}</Typography>
              </Avatar>
              <Box sx={{ minWidth: 0 }}>
                <Typography variant="h2" component="h2" noWrap>
                  {application.candidateFName} {application.candidateLName}
                  {currentUser.role === 'EMPLOYER' && ` (${application.candidatePronouns})`}
                  {' | '}
                  <MuiLink component={Link} href={`/Messaging/${encodeURIComponent(application.candidateEmail)}`} underline="hover">
                    {application.candidateEmail}
                  </MuiLink>
                </Typography>
                <Typography color="text.secondary" fontWeight="medium">
                  Professor: {jobPosition.employer?.user?.fname} {jobPosition.employer?.user?.lname}
                </Typography>
                <Typography color="text.secondary">
                  UID: {application.candidateUID}
                </Typography>
                <Typography color="text.secondary">
                  Year {application.candidateYear} | {application.candidateMajor}
                </Typography>
              </Box>
            </Box>
            <IconButton onClick={handleMenuClick} disabled={isCheckingHiredStatus}>
              {isCheckingHiredStatus ? <CircularProgress size={24} /> : <EllipsisVerticalIcon />}
            </IconButton>
            <Menu anchorEl={anchorEl} open={Boolean(anchorEl)} onClose={handleMenuClose}>
              <MenuItem onClick={() => { setIsViewingApplication(true); handleMenuClose(); }}>View Application</MenuItem>
              <MenuItem onClick={() => { setIsViewingNotes(true); handleMenuClose(); }}>View Notes</MenuItem>

              {showActionMenuItems && <Divider />}

              {showHireOption && (
                <MenuItem onClick={() => { if (onHire) onHire(); handleMenuClose(); }} sx={{ color: 'success.main' }}>Hire Candidate</MenuItem>
              )}
              {showRejectOption && (
                <MenuItem onClick={() => handleOpenUpdateModal("REJECTED", "Reject Application")} sx={{ color: 'error.main' }}>Reject Application</MenuItem>
              )}
              {showInterviewOption && (
                <MenuItem onClick={() => handleOpenUpdateModal("INTERVIEW", "Select for Interview")}>Select for Interview</MenuItem>
              )}
              {showOfferOption && (
                <MenuItem onClick={handleOfferPosition}>Offer Position</MenuItem>
              )}
            </Menu>
          </Box>

          <Divider sx={{ my: 2 }} />

          <Grid container spacing={2}>
            <Grid item xs={12} sm={6}>
              <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                <Typography variant="body2" color="text.secondary">Resume</Typography>
                <DocumentIcon fontSize="small" />
              </Box>
              <MuiLink href={`${backendURL}${resume.resumeURL}`} target="_blank" rel="noopener noreferrer" underline="hover">
                {resume.name}
              </MuiLink>
            </Grid>
            {application.coverLetterURL && (
              <Grid item xs={12} sm={6}>
                <Box sx={{ display: 'flex', alignItems: 'center', gap: 1 }}>
                  <Typography variant="body2" color="text.secondary">Cover Letter</Typography>
                  <DocumentIcon fontSize="small" />
                </Box>
                <MuiLink href={`${backendURL}${application.coverLetterURL}`} target="_blank" rel="noopener noreferrer" underline="hover">
                  {application.coverLetterName || 'View Cover Letter'}
                </MuiLink>
              </Grid>
            )}
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">Course:</Typography>
              <Typography fontWeight="bold">{jobPosition.courseCode || "N/A"}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">Recent Course Grade</Typography>
              <Typography fontWeight="bold">{application.candidateGrade || "N/A"}</Typography>
            </Grid>
            <Grid item xs={12} sm={6}>
              <Typography variant="body2" color="text.secondary">Previous TA Experience For This Course</Typography>
              <Typography fontWeight="bold">{application.wasPriorEmployeeForThisCourse ? "Yes" : "No"}</Typography>
            </Grid>
            <Grid item xs={12}>
              <Typography variant="body2" color="text.secondary">Previously TA&apos;d Courses</Typography>
              <Typography fontWeight="bold">{application.priorEmploymentHistory || "None"}</Typography>
            </Grid>
          </Grid>

          <Divider sx={{ my: 3 }} />

          <Box sx={{ display: 'flex', flexDirection: { xs: 'column', md: 'row' }, justifyContent: 'space-between', alignItems: 'center', gap: 2 }}>
            <Box sx={{ width: { xs: '100%', md: '65%' } }}>
              <ApplicationTracker currentStep={jobApplicationStatus} />
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
              {showInterviewOption && (
                <Grid item xs={12} sm={6}>
                  <Button variant="outlined" onClick={() => handleOpenUpdateModal("INTERVIEW", "Select for Interview")}>Select for Interview</Button>
                </Grid>)}
              {showHireOption && (
                <Grid item xs={12} sm={6}>
                  <Button variant="outlined" onClick={() => { if (onHire) onHire(); handleMenuClose(); }} sx={{ color: 'success.main' }}>Hire Candidate</Button>
                </Grid>
              )}
              {showOfferOption && (<Grid item xs={12} sm={6}>
                <Button variant="outlined" onClick={handleOfferPosition}>Offer Position</Button>
              </Grid>)}
            </Grid>

            {showRejectOption && (
              <Button variant="contained" color="error" onClick={() => handleOpenUpdateModal("REJECTED", "Reject Application")} >Reject Application</Button>
            )}



          </Box>
        </Box>
      </Paper>

      {isViewingApplication && (
        <ViewableApplicationForm
          position={jobPosition}
          application={application}
          onClose={() => setIsViewingApplication(false)}
        />
      )}

      {isViewingNotes && (
        <ViewableNoteForm
          foreignKey={application.id}
          foreignTableName="JobPositionApplicationHistory"
          itemTitle="Application Note History"
          itemSubtitle={jobPosition.course.name}
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

      <ConfirmationModal
        isOpen={isConfirmingOffer}
        onClose={() => { setIsConfirmingOffer(false); setPendingOfferStep(null); }}
        onConfirm={() => {
          setIsConfirmingOffer(false);
          if (pendingOfferStep === "positionFull") {
            setPendingOfferStep(null);
            setIsConfirmingPositionFull(true);
          } else {
            handleOpenUpdateModal("PENDING_OFFER", "Offer Position");
          }
        }}
        title="Confirm Offer"
        isConfirming={isProcessingUpdate}
      >
        <Typography>
          Candidate <strong>{application.candidateFName} {application.candidateLName}</strong> has already accepted another position for this semester.
        </Typography>
        <Typography sx={{ mt: 2 }}>Are you sure you want to proceed with making them an offer?</Typography>
      </ConfirmationModal>

      <ConfirmationModal
        isOpen={isConfirmingPositionFull}
        onClose={() => setIsConfirmingPositionFull(false)}
        onConfirm={() => {
          setIsConfirmingPositionFull(false);
          handleOpenUpdateModal("PENDING_OFFER", "Offer Position");
        }}
        title="Position Full"
        isConfirming={isProcessingUpdate}
      >
        <Typography>
          This position is already marked as <strong>FILLED</strong>.
        </Typography>
        <Typography sx={{ mt: 2 }}>Do you still want to proceed with offering it to this candidate?</Typography>
      </ConfirmationModal>
    </>
  );
}

// src/components/applications/ApplicationProgressTracker.js
import React from 'react';
import { Box, Typography, Tooltip, Chip, useTheme } from '@mui/material';
import {
  Close as CloseIcon,
  Pause as PauseIcon,
  PriorityHigh as PriorityHighIcon,
} from '@mui/icons-material';

const progressStages = [
  { status: 'APPLIED', label: 'Applied', tooltip: 'The student\'s application has been successfully submitted.' },
  { status: 'INTERVIEW', label: 'Interview', tooltip: 'The student has been selected for an interview.' },
  { status: 'PENDING_OFFER', label: 'Offer', tooltip: 'An offer is being prepared or is pending a review by the student.' },
  { status: 'ACCEPTED_OFFER', label: 'Accepted', tooltip: 'Offer has been accepted by the student and is awaiting final review by the administration.' },
  { status: 'HIRED', label: 'Hired', tooltip: 'Welcome aboard! The student is now hired for this position.' },
];

const otherStates = {
  REJECTED: { label: 'Rejected', color: 'error', icon: <CloseIcon />, tooltip: 'The student has been rejected for this position.' },
  DECLINED_OFFER: { label: 'Declined', color: 'error', icon: <CloseIcon />, tooltip: 'The student has declined the offer for this position.' },
  ONHOLD: { label: 'On Hold', color: 'warning', icon: <PauseIcon />, tooltip: 'The student has been placed on hold for this position.' },
  INACTIVE: { label: 'Inactive', color: 'default', icon: <PriorityHighIcon />, tooltip: 'The application is no longer active.' },
};

/**
 * A visual component that displays application progress using Material-UI components.
 * @param {object} props
 * @param {string} props.currentStep - The current status of the application (e.g., 'INTERVIEW', 'REJECTED').
 */
export default function ApplicationTracker({ currentStep }) {
  const theme = useTheme();
  const currentIndex = progressStages.findIndex(stage => stage.status === currentStep);

  // Handle terminal states like Rejected or On Hold using the Chip component
  if (otherStates[currentStep]) {
    const stateInfo = otherStates[currentStep];
    return (
      <Tooltip title={stateInfo.tooltip} arrow>
        <Chip
          icon={stateInfo.icon}
          label={stateInfo.label}
          color={stateInfo.color}
          sx={{
            width: '100%',
            height: '32px',
            borderRadius: '16px',
            fontWeight: 'bold',
            fontSize: '0.875rem',
          }}
        />
      </Tooltip>
    );
  }

  // Handle in-progress/non-terminal stages with a segmented bar
  return (
    <Box sx={{ display: 'flex', width: '100%', height: '32px', gap: '4px' }}>
      {progressStages.map((stage, index) => {
        const isCompleted = currentIndex > -1 && index <= currentIndex;
        const isCurrent = index === currentIndex;

        // Define colors based on the theme and completion status
        let bgColor = theme.palette.mode === 'light' ? theme.palette.grey[300] : theme.palette.grey[800];
        let textColor = theme.palette.text.secondary;

        if (isCompleted) {
          bgColor = theme.palette.mode === 'light' ? theme.palette.grey[800] : theme.palette.grey[600];
          textColor = theme.palette.getContrastText(bgColor);
        }
        
        if (isCurrent) {
          bgColor = theme.palette.primary.main;
          textColor = theme.palette.primary.contrastText;
        }

        return (
          <Tooltip key={stage.status} title={stage.tooltip} arrow>
            <Box
              sx={{
                flex: 1,
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                transition: 'background-color 0.5s ease',
                backgroundColor: bgColor,
                ...(index === 0 && { borderTopLeftRadius: 16, borderBottomLeftRadius: 16 }),
                ...(index === progressStages.length - 1 && { borderTopRightRadius: 16, borderBottomRightRadius: 16 }),
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: textColor,
                  fontWeight: 'bold',
                  textAlign: 'center',
                  px: 1,
                  fontSize: { xs: '0.65rem', sm: '0.75rem' }
                }}
              >
                {stage.label}
              </Typography>
            </Box>
          </Tooltip>
        );
      })}
    </Box>
  );
}
// src/components/positions/EmployerAndAdmin/PositionTracker.js
"use client";

import React from 'react';
import { Box, Typography, Tooltip, Chip, useTheme } from '@mui/material';
import {
  Close as CloseIcon,
  Pause as PauseIcon,
  PriorityHigh as PriorityHighIcon,
} from '@mui/icons-material';

const progressStages = [
  { status: 'PENDING_APPROVAL', label: 'Pending', tooltip: 'Position is awaiting admin approval.' },
  { status: 'OPEN', label: 'Open', tooltip: 'Position is open and accepting applications.' },
  { status: 'FILLED', label: 'Filled', tooltip: 'All available spots for this position have been filled.' },
  { status: 'ACTIVE', label: 'Active', tooltip: 'The position is currently active for the semester.' },
];

const otherStates = {
  REJECTED: { label: 'Rejected', color: 'error', icon: <CloseIcon />, tooltip: 'This position submission was rejected by an admin.' },
  ONHOLD: { label: 'On Hold', color: 'warning', icon: <PauseIcon />, tooltip: 'This position is temporarily on hold.' },
  INACTIVE: { label: 'Inactive', color: 'default', icon: <PriorityHighIcon />, tooltip: 'This position is no longer active.' },
};

export default function PositionTracker({ currentStep }) {
  const theme = useTheme();
  const currentIndex = progressStages.findIndex(stage => stage.status === currentStep);

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
            height: '28px',
            borderRadius: '14px',
            fontWeight: 'bold',
            fontSize: '0.8rem',
          }}
        />
      </Tooltip>
    );
  }

  return (
    <Box sx={{ display: 'flex', width: '100%', height: '28px', gap: '4px' }}>
      {progressStages.map((stage, index) => {
        const isCompleted = currentIndex > -1 && index <= currentIndex;
        const isCurrent = index === currentIndex;

        let bgColor = theme.palette.mode === 'light' ? theme.palette.grey[300] : theme.palette.grey[800];
        let textColor = theme.palette.text.secondary;

        if (isCompleted) {
          bgColor = theme.palette.mode === 'light' ? theme.palette.grey[700] : theme.palette.grey[600];
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
                ...(index === 0 && { borderTopLeftRadius: 14, borderBottomLeftRadius: 14 }),
                ...(index === progressStages.length - 1 && { borderTopRightRadius: 14, borderBottomRightRadius: 14 }),
              }}
            >
              <Typography
                variant="caption"
                sx={{
                  color: textColor,
                  fontWeight: 'bold',
                  textAlign: 'center',
                  px: 1,
                  fontSize: { xs: '0.6rem', sm: '0.7rem' }
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

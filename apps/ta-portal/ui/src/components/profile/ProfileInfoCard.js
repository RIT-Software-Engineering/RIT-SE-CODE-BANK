// components/Profile/ProfileInfoCard.js
'use client';

import React from 'react';
import EditButton from '../common/buttons/EditButton';
import {
  Box,
  Paper,
  Typography,
  Divider,
} from '@mui/material';

const InfoItem = ({ label, value }) => (
  <Box sx={{ py: 1 }}>
    <Typography variant="body2" color="text.secondary">
      {label}
    </Typography>
    <Typography variant="body1" fontWeight="medium">
      {value || 'N/A'}
    </Typography>
  </Box>
);

export default function ProfileInfoCard({
  profileData,
  isEmployerOrAdmin,
  isCandidateOrEmployee,
  onEdit,
}) {
  if (!profileData) return null;

  const yearLevel = profileData.candidate?.graduateStatus === "GRADUATE" ? "Graduate" : profileData.candidate?.year;

  return (
    <Paper elevation={2} sx={{ p: { xs: 2, md: 3 } }}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2 }}>
        <Typography variant="h2" component="h2">
          {profileData.fname} {profileData.lname}
        </Typography>
        <EditButton handleOpenModal={onEdit} />
      </Box>
      <Divider />
      <Box sx={{ mt: 2, display: 'flex', flexDirection: 'column' }}>
        <InfoItem label="Email" value={profileData.email} />
        <InfoItem label="UID" value={profileData.uid} />
        <InfoItem label="Pronouns" value={profileData.pronouns} />
        {isCandidateOrEmployee && (
          <>
            <InfoItem label="Major" value={profileData.candidate?.major} />
            <InfoItem label="Year" value={yearLevel} />
          </>
        )}
        {isEmployerOrAdmin && (
          <InfoItem label="Department" value={profileData.employer?.department} />
        )}
      </Box>
    </Paper>
  );
}
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

/**
 * A component that displays a label and a value
 * @param {string} label The label that describes the value
 * @param {string} value The value to be displayed
 * @returns {ReactElement}
 */
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


/**
 * A component that displays a user's profile information.
 * @param {object} profileData The user's profile data, as returned by the API.
 * @param {boolean} isEmployerOrAdmin True if the user is an employer or admin, false otherwise.
 * @param {boolean} isCandidateOrEmployee True if the user is a candidate or employee, false otherwise.
 * @param {function} onEdit Function to call when the edit button is clicked. This is used to open the edit profile modal.
 * @returns {ReactElement} A React Element representing the ProfileInfoCard.
 */
export default function ProfileInfoCard({
  profileData,
  isEmployerOrAdmin,
  isCandidateOrEmployee,
  onEdit,
}) {
  if (!profileData) return null;

  const yearLevel = profileData.candidate?.graduateStatus === "GRADUATE" ? "Graduate" : profileData.candidate?.year;
  const getTotalOffers=(data)=>{
    let offers=0;
    const positions=data.employer.jobPostions
    positions.map((position) => {
      if(position.jobPositionStatus!="INACTIVE"&&position.jobPositionStatus!="ONHOLD"){
        offers=offers+position.maxTAs
      };
    });
    return offers;
  };
  const getMadeOffers=(data)=>{
    let offers=0;
    const positions=data.employer.jobPostions
    positions.map((position) => {
      if(position.jobPositionApplicationHistory.length!=0){
        position.jobPositionApplicationHistory.map((application) => {
          if(application.jobApplicationStatus=="HIRED"||application.jobApplicationStatus=="ACCEPTED_OFFER"||application.jobApplicationStatus=="PENDING_OFFER"){
            offers=offers+1;
          }
        });
      }
    });
    return offers;
  }
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
        {profileData.role=="EMPLOYER"&&(
          <Box>
            <InfoItem label="Offers Made" value={getMadeOffers(profileData)} />
            <InfoItem label="Total Offers" value={getTotalOffers(profileData)} />
          </Box>
          
        )}
      </Box>
    </Paper>
  );
}
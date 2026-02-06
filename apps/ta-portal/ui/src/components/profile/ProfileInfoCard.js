// components/Profile/ProfileInfoCard.js
'use client';

import React, {useState} from 'react';
import EditButton from '../common/buttons/EditButton';
import {
  Box,
  Paper,
  Typography,
  Divider,
  Button,
  Modal,
} from '@mui/material';
import ApplicationCard from '../applications/EmployerAndAdmin/ApplicationCard';
import { useAuth } from '@/contexts/AuthContext';

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
  const { currentUser } = useAuth();
  const [isMadeOffersModalOpen, setIsMadeOffersModalOpen] = useState(false);
  const [isToMakeOffersModalOpen, setIsToMakeOffersModalOpen] = useState(false);

  if (!profileData) return null;


  const yearLevel = profileData.candidate?.graduateStatus === "GRADUATE" ? "Graduate" : profileData.candidate?.year;
  const getOffersToMake=(positions)=>{
    let offers=0;
    positions.forEach((position) => {
      if(position.jobPositionStatus === "OPEN"){
        offers=offers+position.maxTAs
        if(position.jobPositionApplicationHistory.length>0){
          position.jobPositionApplicationHistory.map((application) => {
            if(application.jobApplicationStatus ==="HIRED"||application.jobApplicationStatus ==="ACCEPTED_OFFER"||application.jobApplicationStatus ==="PENDING_OFFER"){
              offers=offers-1;
            }
          });
        }
      };
    });
    return offers;
  };
  const getMadeOffers=(positions)=>{
    let offers=0;
    positions.forEach((position) => {
      if(position.jobPositionApplicationHistory.length>0){
        position.jobPositionApplicationHistory.map((application) => {
          if(application.jobApplicationStatus === "HIRED"||application.jobApplicationStatus ==="ACCEPTED_OFFER"||application.jobApplicationStatus ==="PENDING_OFFER"){
            offers=offers+1;
          }
        });
      }
    });
    return offers;
  };

  const renderOffersToMakeModalContent=(positions)=>{
    if(getOffersToMake(positions)==0){
      return(
        <Box>
          Congrats you have made all your offers!
        </Box>
      )
    }
    return positions.map((position) => {
      if(position.jobPositionStatus=="OPEN"){
        let offers=0;
        let offers_made=0;
        offers=offers+position.maxTAs
        if(position.jobPositionApplicationHistory.length>0){
          position.jobPositionApplicationHistory.forEach((application) => {
            if(application.jobApplicationStatus=="HIRED"||application.jobApplicationStatus=="ACCEPTED_OFFER"||application.jobApplicationStatus=="PENDING_OFFER"){
              offers=offers-1;
            }
          });
          offers_made=position.maxTAs-offers;
          return(
            <Paper key={position.id} elevation={3} sx={{ p: { xs: 2, md: 3 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
                <Box flexGrow={1}>
                  <Typography variant="h2" component="h2" gutterBottom>
                    {position.course.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace', bgcolor: 'action.hover', px: 1, py: 0.5, borderRadius: 1, display: 'inline-block' }}>
                    {position.id}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary', mt: 1 }}>
                    <Typography variant="body2">
                      Offers to Make: {offers} 
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary', mt: 1 }}>
                    <Typography variant="body2">
                      Offers Made: {offers_made}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Paper>  
          );
        }
        else{
          offers_made=position.maxTAs-offers;
          return(
            <Paper key={position.id} elevation={3} sx={{ p: { xs: 2, md: 3 } }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: 2 }}>
                <Box flexGrow={1}>
                  <Typography variant="h2" component="h2" gutterBottom>
                    {position.course.name}
                  </Typography>
                  <Typography variant="body2" color="text.secondary" sx={{ fontFamily: 'monospace', bgcolor: 'action.hover', px: 1, py: 0.5, borderRadius: 1, display: 'inline-block' }}>
                    {position.id}
                  </Typography>
                  <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary', mt: 1 }}>
                    <Typography variant="body2">
                      Offers to Make: {offers} 
                    </Typography>
                  </Box>
                  <Box sx={{ display: 'flex', alignItems: 'center', color: 'text.secondary', mt: 1 }}>
                    <Typography variant="body2">
                      Offers Made: {offers_made}
                    </Typography>
                  </Box>
                </Box>
              </Box>
            </Paper>
          );
        }
      };
    });
  };

  const renderMadeOffersModalContent=(positions)=> {
    return positions.flatMap((position) => {
      if (position.jobPositionApplicationHistory.length > 0) {
        return position.jobPositionApplicationHistory
          .filter(
            (application) =>
              application.jobApplicationStatus === "HIRED" ||
              application.jobApplicationStatus === "ACCEPTED_OFFER" ||
              application.jobApplicationStatus === "PENDING_OFFER"
          )
          .map((application) => (
            <ApplicationCard
              currentUser={currentUser}
              key={application.username + application.jobPositionId}
              jobPosition={position}
              application={application}
            />
          ));
      } else {
        return []
      }
    });
  };

  const handleOffersToMakeModalContent=()=>{
    setIsMadeOffersModalOpen(false);   
    if(isToMakeOffersModalOpen){
      setIsToMakeOffersModalOpen(false);
    }
    else{
      setIsToMakeOffersModalOpen(true);
    }
  };
  
  const handleMadeOffersModal=()=>{
    setIsToMakeOffersModalOpen(false);
    if(isMadeOffersModalOpen){
      setIsMadeOffersModalOpen(false);
    }
    else{
      setIsMadeOffersModalOpen(true);
    }
  };
  return (
    <Paper elevation={2}
    sx={(theme)=>({  p: { xs: 2, md: 3 }, background: theme.palette.mode === 'dark'
                    ? ""
                    : "white" })}>
      <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 2}}>
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
        {profileData.role === "EMPLOYER"&&(
          <Box>
            <Typography variant="body2" color="text.secondary">
              Offers Made:
            </Typography> 
            <Button onClick={() => handleMadeOffersModal()}>{getMadeOffers(profileData.employer.jobPositions)} </Button>
            <Modal
              open={isMadeOffersModalOpen}
              onClose={handleMadeOffersModal}
              aria-labelledby="made-offers-modal-title"
              sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
              }}
            >
              <Paper sx={{
                  p: {xs: 2, md: 4},
                  width: '90%',
                  maxWidth: '800px',
                  maxHeight: '90vh',
                  overflowY: 'auto'
              }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {renderMadeOffersModalContent(profileData.employer.jobPositions)}
                </Box>
                <Button onClick={() => handleMadeOffersModal()}>close </Button>
              </Paper>
            </Modal>
            <Typography variant="body2" color="text.secondary">
              Offers To Make:
            </Typography> 
            <Button onClick={()=>handleOffersToMakeModalContent()}>{getOffersToMake(profileData.employer.jobPositions)} </Button>
            <Modal
              open={isToMakeOffersModalOpen}
              onClose={handleOffersToMakeModalContent}
              aria-labelledby="made-offers-modal-title"
              sx={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center'
              }}
            >
              <Paper sx={{
                  p: {xs: 2, md: 4},
                  width: '90%',
                  maxWidth: '800px',
                  maxHeight: '90vh',
                  overflowY: 'auto'
              }}>
                <Box sx={{ display: 'flex', flexDirection: 'column', gap: 3 }}>
                  {renderOffersToMakeModalContent(profileData.employer.jobPositions)}
                </Box>
                <Button onClick={() => handleOffersToMakeModalContent()}>close </Button>
              </Paper>
            </Modal>
          </Box>
        )}
      </Box>  
    </Paper>
  );
};
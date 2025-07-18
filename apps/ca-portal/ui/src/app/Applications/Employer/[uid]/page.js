'use client';

import { useAuth } from '@/contexts/AuthContext';
import ApplicationCard from '@/components/jobs/EmployerAndAdmin/ApplicationCard';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import KeyboardArrowDownOutlinedIcon from '@mui/icons-material/KeyboardArrowDownOutlined';
import Typography from '@mui/material/Typography';
import Box from '@mui/material/Box';
import React, { useCallback, useEffect, useState } from 'react';
import { getCandidateApplicationsForFaculty } from '@/services/db-apis';

export default function Applications() {
  const { currentUser } = useAuth();
  const [groupedApplications, setGroupedApplications] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const fetchApplications = useCallback(async () => {
    if (currentUser?.uid && currentUser.role === 'EMPLOYER') {
      try {
        setLoading(true);
        const positionsArray = await getCandidateApplicationsForFaculty(currentUser.uid);

        const groupedData = positionsArray.reduce((acc, position) => {
          const semesterCode = position.semesterCode || 'Uncategorized';
          if (!acc[semesterCode]) {
            acc[semesterCode] = {};
          }
          acc[semesterCode][position.id] = position;
          return acc;
        }, {});

        setGroupedApplications(groupedData);
        setError(null);
      } catch (err) {
        console.error('Error fetching applications:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    } else {
      setLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]);

  const handleStatusChange = () => {
    fetchApplications();
  };

  const renderContent = () => {
    if (loading) {
      return <div>Loading applications...</div>;
    }
    if (error) {
      return <div className='text-red-500'>Error: {error}</div>;
    }

    const semesterCodes = Object.keys(groupedApplications);

    if (semesterCodes.length === 0) {
      return <div>No active applications found.</div>;
    }

    return (
      <div className='w-full justify-center flex flex-col items-center'>
        <div id='section-container' className='w-4/5 p-2'>
          {semesterCodes.map((semesterCode) => (
            <Accordion key={semesterCode} defaultExpanded>
              <AccordionSummary
                expandIcon={<KeyboardArrowDownOutlinedIcon />}
                aria-controls={`${semesterCode}-content`}
                id={`${semesterCode}-header`}
                sx={{ backgroundColor: 'rgba(0, 0, 0, .03)' }}
              >
                <Typography variant="h5">{`Semester ${semesterCode}`}</Typography>
              </AccordionSummary>
              <AccordionDetails>
                <Box>
                  {Object.values(groupedApplications[semesterCode]).map((position) => (
                    <Accordion key={position.id} defaultExpanded>
                      <AccordionSummary
                        expandIcon={<KeyboardArrowDownOutlinedIcon />}
                        aria-controls={`${position.id}-content`}
                        id={`${position.id}-header`}
                      >
                        <Typography variant='h6'>
                          {position.courseCode} - Section {position.sectionNumber}
                        </Typography>
                      </AccordionSummary>
                      <AccordionDetails>
                        {position.jobPositionApplicationHistory.length > 0 ? (
                          position.jobPositionApplicationHistory.map((app) => (
                            <ApplicationCard
                              key={app.id}
                              jobPosition={position}
                              application={app}
                              onStatusChange={handleStatusChange}
                            />
                          ))
                        ) : (
                          <p>No candidates have applied for this position yet.</p>
                        )}
                      </AccordionDetails>
                    </Accordion>
                  ))}
                </Box>
              </AccordionDetails>
            </Accordion>
          ))}
        </div>
      </div>
    );
  };

  // Main body of application
  return (
    <>
      <div className='flex flex-col items-center p-4'>
        <h1 className='text-4xl'>Applications</h1>
        <p className='text-sm'>See candidate applications</p>
      </div>
      <div className='flex flex-col items-center bg-gray-300 p-4 mb-10 ml-10 mr-10'>
        {currentUser && currentUser.role === 'EMPLOYER' ? (
          <div className='w-full flex flex-col items-center justify-center'>
            {renderContent()}
          </div>
        ) : (
          <div>Please make sure you are logged in as an EMPLOYER.</div>
        )}
      </div>
    </>
  );
}
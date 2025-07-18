'use client';
import { useAuth } from '@/contexts/AuthContext';
import ApplicationCard from '@/components/jobs/EmployerAndAdmin/ApplicationCard';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import KeyboardArrowDownOutlinedIcon from '@mui/icons-material/KeyboardArrowDownOutlined';
import React, { useCallback, useEffect, useState } from 'react';
import { getCandidateApplicationsForFaculty } from '@/services/db-apis';

export default function Applications() {
  const { currentUser } = useAuth();
  const [activeApplications, setActiveApplications] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // Wrap data fetching logic in useCallback so its identity is stable
  const fetchApplications = useCallback(async () => {
    if (currentUser?.uid && currentUser.role === 'EMPLOYER') {
      try {
        setLoading(true);
        const data = await getCandidateApplicationsForFaculty(currentUser.uid);
        setActiveApplications(data);
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
  }, [currentUser]); // Dependency is currentUser

  useEffect(() => {
    fetchApplications();
  }, [fetchApplications]); // useEffect now depends on the stable fetchApplications function

  // Update handler simply calls the fetch function again.
  const handleStatusChange = () => {
    fetchApplications();
  };

  // Content to load once a employer is logged in
  const renderContent = () => {
    // Handle loading and error states for a better user experience
    if (loading) {
      return <div>Loading applications...</div>;
    }
    if (error) {
      return <div className='text-red-500'>Error: {error}</div>;
    }

    // Use Object.keys() to get an array of the position IDs that we can map over
    const positionIds = Object.keys(activeApplications);

    if (positionIds.length === 0) {
      return <div>No active applications found.</div>;
    }

    return (
      <div className='w-full justify-center flex flex-col items-center'>
        <div id='section-container' className='w-4/5 p-2'>
          {/* Map over the array of keys to render each position */}
          {positionIds.map((positionId) => {
            const position = activeApplications[positionId];
            return (
              // Use the unique position ID for the key prop
              // Groups applications visually by position (course codes)
              <Accordion key={position.id} defaultExpanded>
                <AccordionSummary
                  expandIcon={<KeyboardArrowDownOutlinedIcon />}
                  aria-controls={`${position.id}-content`}
                  id={`${position.id}-header`}
                >
                  {/* Use the dynamic data from the position object */}
                  <h2 className='text-3xl'>
                    {position.courseCode} - Section {position.sectionNumber}
                  </h2>
                </AccordionSummary>
                <AccordionDetails>
                  {/* Map over the actual applications for this position */}
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
            );
          })}
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

'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useCallback, useEffect, useState } from 'react';
import ApplicationCard from '@/components/jobs/CandidateAndEmployee/ApplicationCard';
import { getCandidateApplications } from '@/services/db-apis';
import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Typography from '@mui/material/Typography';
import KeyboardArrowDownOutlinedIcon from '@mui/icons-material/KeyboardArrowDownOutlined';

export default function CandidateApplicationsPage() {
  const { currentUser, refreshUserProfile } = useAuth();
  const [groupedApplications, setGroupedApplications] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const pageTitle = "My Applications";
  const pageSubtitle = "Track the status of all positions you've applied for.";

  // Wrap data fetching logic in useCallback so its identity is stable
  const fetchApplications = useCallback(async () => {
    if (currentUser?.uid && currentUser.role === "CANDIDATE") {
      try {
        setLoading(true);
        const data = await getCandidateApplications(currentUser.uid);
        
        const groupedData = data.reduce((acc, application) => {
          const semesterCode = application.jobPositionId.split('-')[0] || 'Uncategorized';
          if (!acc[semesterCode]) {
            acc[semesterCode] = [];
          }
          acc[semesterCode].push(application);
          return acc;
        }, {});

        setGroupedApplications(groupedData);
        setError(null);
      } catch (err) {
        console.error("Error fetching candidate applications:", err);
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
  }, [fetchApplications]); // useEffect now depends on the stable fetchApplications function

  // Update handler simply calls the fetch function again.
  const handleStatusChange = () => {
    fetchApplications();
  };

  // Renders the main content of the page based on the current state
  const renderContent = () => {
    if (loading) {
      return <div className="text-center text-gray-500">Loading applications...</div>;
    }
    if (error) {
      return <div className='text-red-500 text-center'>Error: {error}</div>;
    }
    if (!currentUser) {
        return <div className="text-center text-gray-500">Please log in to view your applications.</div>;
    }
    
    const semesterCodes = Object.keys(groupedApplications).sort((a, b) => b.localeCompare(a));

    if (semesterCodes.length === 0) {
      return <div className="text-center text-gray-500">You have no applications to display.</div>;
    }

    return (
      <div className='w-full max-w-4xl'>
        {semesterCodes.map((semester) => (
          <Accordion key={semester} defaultExpanded>
            <AccordionSummary
              expandIcon={<KeyboardArrowDownOutlinedIcon />}
              aria-controls={`${semester}-content`}
              id={`${semester}-header`}
              sx={{ borderBottom: 1, borderColor: 'divider' }}
            >
              <Typography variant="h5">{`Semester ${semester}`}</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ padding: '16px', backgroundColor: '#f9f9f9' }}>
              <div className="space-y-4">
                {groupedApplications[semester].map((app) => (
                  <ApplicationCard
                    key={app.id}
                    currentUser={currentUser}
                    application={app}
                    onStatusChange={handleStatusChange}
                    refreshUserProfile={refreshUserProfile}
                  />
                ))}
              </div>
            </AccordionDetails>
          </Accordion>
        ))}
      </div>
    );
  };

  return (
    <main>
      <div className='flex flex-col items-center p-6 bg-white shadow-sm'>
        <h1 className='text-4xl font-bold text-gray-800'>{pageTitle}</h1>
        <p className='text-md text-gray-600 mt-2'>{pageSubtitle}</p>
      </div>
      <div className='flex justify-center bg-gray-50 p-4 md:p-8 min-h-screen'>
        {renderContent()}
      </div>
    </main>
  );
}
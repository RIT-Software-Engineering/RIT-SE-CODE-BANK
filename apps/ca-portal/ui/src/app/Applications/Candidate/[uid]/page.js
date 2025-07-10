'use client';

import { useAuth } from '@/contexts/AuthContext';
import { getCandidateApplicationsForCandidate } from '@/services/api';
import { useEffect, useState } from 'react';
import ApplicationCard from '@/components/jobs/ApplicationCard';

// The page component receives params from the dynamic route
export default function CandidateApplicationsPage() {
  const { currentUser } = useAuth();
  const [myApplications, setMyApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // We only want to fetch if the logged-in user matches the page's candidateId
    if (
      currentUser?.uid &&
      currentUser.role === 'CANDIDATE'
    ) {
      async function fetchApplications() {
        try {
          setLoading(true);
          // Use the API function for fetching a candidate's applications
          const data = await getCandidateApplicationsForCandidate(currentUser.uid);
          console.log('Fetched candidate applications:', data);
          setMyApplications(data);
          setError(null);
        } catch (err) {
          console.error('Error fetching applications:', err);
          setError(err.message);
        } finally {
          setLoading(false);
        }
      }
      fetchApplications();
    } else {
      setLoading(false);
    }
  }, [currentUser]); // Re-run if the user or page ID changes

  const renderContent = () => {
    if (loading) {
      return <div>Loading your applications...</div>;
    }

    if (error) {
      return <div className='text-red-500'>Error: {error}</div>;
    }

    if (!currentUser || currentUser.role !== 'CANDIDATE') {
      return <div>Please log in as a Candidate to view your applications.</div>;
    }

    if (myApplications.length === 0) {
      return <div>You have not applied to any positions yet.</div>;
    }

    return (
      <div className='w-full max-w-4xl'>
        {myApplications.map((app) => (
          <ApplicationCard
            key={app.id}
            application={app}
            viewAs='CANDIDATE'
          />
        ))}
      </div>
    );
  };

  return (
    <>
      <div className='flex flex-col items-center p-4'>
        <h1 className='text-4xl'>My Applications</h1>
        <p className='text-sm'>
          Track the status of positions you have applied for.
        </p>
      </div>
      <div className='flex flex-col items-center bg-gray-100 p-4 md:p-8 min-h-screen'>
        {renderContent()}
      </div>
    </>
  );
}

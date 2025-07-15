'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import ApplicationCard from '@/components/jobs/CandidateAndEmployee/ApplicationCard';
import { getCandidateApplications } from '@/services/db-apis';

export default function CandidateApplicationsPage() {
  const { currentUser, refreshUserProfile } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const pageTitle = "My Applications";
  const pageSubtitle = "Track the status of all positions you've applied for.";

  const handleWithdrawSuccess = (withdrawnApplicationId) => {
    // Filter out the withdrawn application from the state
    setApplications(currentApplications =>
      currentApplications.filter(app => app.id !== withdrawnApplicationId)
    );
  };

  useEffect(() => {
    // Fetch data specifically for the logged-in candidate
    if (currentUser?.uid && currentUser.role === "CANDIDATE") {
      async function fetchData() {
        try {
          setLoading(true);
          const data = await getCandidateApplications(currentUser.uid);
          setApplications(data);
          setError(null);
        } catch (err) {
          console.error("Error fetching candidate applications:", err);
          setError(err.message);
        } finally {
          setLoading(false);
        }
      }
      fetchData();
    } else {
      // If there's no user, we're not loading anything.
      setLoading(false);
    }
  }, [currentUser]);

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
    if (applications.length === 0) {
      return <div className="text-center text-gray-500">You have no applications to display.</div>;
    }
    return (
      <div className='w-full max-w-4xl'>
        {applications.map((app) => (
          <ApplicationCard
            key={app.id}
            currentUser={currentUser}
            application={app}
            onWithdrawSuccess={handleWithdrawSuccess}
            refreshUserProfile={refreshUserProfile}
          />
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
      <div className='flex flex-col items-center bg-gray-50 p-4 md:p-8 min-h-screen'>
        {renderContent()}
      </div>
    </main>
  );
}
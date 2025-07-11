'use client';

import { useAuth } from '@/contexts/AuthContext';
import { useEffect, useState } from 'react';
import ApplicationCard from '@/components/jobs/ApplicationCard';

/**
 * A reusable view component to display a list of applications for a user.
 * @param {string} pageTitle - The title to display on the page.
 * @param {string} pageSubtitle - The subtitle to display.
 * @param {string} userRole - The role to check for ('CANDIDATE', 'EMPLOYEE', etc.).
 * @param {function} fetchFunction - The API function to call to get the applications.
 * @param {string} cardViewAs - The 'viewAs' prop to pass to the ApplicationCard.
 */
export default function CandidateAndEmployeeApplicationsView({ pageTitle, pageSubtitle, userRole, fetchFunction, cardViewAs }) {
  const { currentUser } = useAuth();
  const [applications, setApplications] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    // This logic is now generic, based on the props passed in.
    if (currentUser?.uid && currentUser.role === userRole) {
      async function fetchData() {
        try {
          setLoading(true);
          const data = await fetchFunction(currentUser.uid);
          setApplications(data);
          setError(null);
        } catch (err) {
          console.error(`Error fetching data for role ${userRole}:`, err);
          setError(err.message);
        } finally {
          setLoading(false);
        }
      }
      fetchData();
    } else {
      setLoading(false);
    }
  }, [currentUser, userRole, fetchFunction]);

  const renderContent = () => {
    if (loading) {
      return <div>Loading...</div>;
    }
    if (error) {
      return <div className='text-red-500'>Error: {error}</div>;
    }
    if (!currentUser || currentUser.role !== userRole) {
      return <div>Please log in as a {userRole.toLowerCase()} to view this page.</div>;
    }
    if (applications.length === 0) {
      return <div>No items found.</div>;
    }
    return (
      <div className='w-full max-w-4xl'>
        {applications.map((app) => (
          <ApplicationCard
            key={app.id}
            application={app}
            viewAs={cardViewAs}
          />
        ))}
      </div>
    );
  };

  return (
    <>
      <div className='flex flex-col items-center p-4'>
        <h1 className='text-4xl'>{pageTitle}</h1>
        <p className='text-sm'>{pageSubtitle}</p>
      </div>
      <div className='flex flex-col items-center bg-gray-100 p-4 md:p-8 min-h-screen'>
        {renderContent()}
      </div>
    </>
  );
}
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import { getCandidateApplicationsAsCandidate } from '@/services/db-apis';
import { useAuth } from '@/contexts/AuthContext';
import { gradeEnumToStringValue } from '@/constants/gradeConstants';

import ApplicationCard from '@/components/applications/CandidateAndEmployee/ApplicationCard';
import SearchBar from '@/components/common/searchAndFilter/SearchBar';
import Filter from '@/components/common/searchAndFilter/Filter';
import { generateApplicationsFilterConfig } from './filter.config';

import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import KeyboardArrowDownOutlinedIcon from '@mui/icons-material/KeyboardArrowDownOutlined';

export default function CandidateApplicationsPage() {
  const { currentUser, refreshUserProfile } = useAuth();
  const filterRef = useRef();

  const [displayData, setDisplayData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterConfig, setFilterConfig] = useState([]);

  const [searchTerm, setSearchTerm] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({
    status: [],
    level: [],
    semester: '',
  });

  const pageTitle = "My Applications";
  const pageSubtitle = "Track the status of all positions you've applied for.";

 // Fetch semester options on load to build the filter component's configuration
  useEffect(() => {
    if (currentUser?.uid) {
      const fetchSemesterOptions = async () => {
        try {
          // Use the search/filter function with default params to get all applications
          const allApps = await getCandidateApplicationsAsCandidate(
            '', // No search term
            { status: [], level: '', semester: '' }, // Default filters
            currentUser.uid
          );
          
          const semesterCodes = [...new Set(allApps.map(app => app.jobPositionId.split('-')[0]))]
            .sort((a,b) => b.localeCompare(a));
          
          const newConfig = generateApplicationsFilterConfig(semesterCodes);
          setFilterConfig(newConfig);
        } catch (err) {
          console.error('Failed to load filter configuration:', err);
          setFilterConfig(generateApplicationsFilterConfig([]));
        }
      };
      fetchSemesterOptions();
    }
  }, [currentUser]);

  // Central function to fetch and display applications based on search/filters
  const updateApplicationsView = useCallback(async (search, filters) => {
    if (!currentUser?.uid) return;
    setLoading(true);
    setError(null);

    try {
      const data = await getCandidateApplicationsAsCandidate(
        search,
        filters,
        currentUser.uid
      );

      // convert grade enum to string
      const applications = data.map(application => {
        if (application.candidateGrade && gradeEnumToStringValue[application.candidateGrade]) {
          return {
            ...application,
            candidateGrade: gradeEnumToStringValue[application.candidateGrade]
          };
        }
        return application;
      })

      const groupedBySemester = applications.reduce((acc, app) => {
        const semesterCode = app.jobPositionId.split('-')[0] || 'Uncategorized';
        if (!acc[semesterCode]) acc[semesterCode] = [];
        acc[semesterCode].push(app);
        return acc;
      }, {});

      setDisplayData(groupedBySemester);
    } catch (err) {
      console.error('Error updating applications view:', err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }, [currentUser]);

  // Fetch initial data on component mount
  useEffect(() => {
    if (currentUser) {
      updateApplicationsView(searchTerm, appliedFilters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  // --- Event Handlers ---
  const handleStatusChange = () => {
    updateApplicationsView(searchTerm, appliedFilters);
  };

  // Called when "Apply Filters" or "Clear All" is clicked in the Filter component
  const handleFilterChange = (filters) => {
    setAppliedFilters(filters);
    updateApplicationsView(searchTerm, filters);
  };
  
  
  // Updates search term state as the user types.
  const handleSearchTermChange = (newValue) => {
    setSearchTerm(newValue);
    if (newValue === '') {
      updateApplicationsView('', appliedFilters);
    }
  };
  
  // Called when the search form is submitted
  const handleSearch = (e) => {
    e.preventDefault();
    // Get the most up-to-date filters directly from the Filter component
    const latestFilters = filterRef.current.getFilters();
    // Update the parent's state so the UI is consistent
    setAppliedFilters(latestFilters);
    // Fetch data with the latest filters and search term
    updateApplicationsView(searchTerm, latestFilters);
  };

  // --- Render Logic ---
  const renderContent = () => {
    if (loading) return <div className="text-center text-gray-500 py-8">Loading applications...</div>;
    if (error) return <div className='text-red-500 text-center py-8'>Error: {error}</div>;
    
    const semesterCodes = Object.keys(displayData).sort((a, b) => b.localeCompare(a));

    if (semesterCodes.length === 0) {
      return <div className="text-center text-gray-500 py-8">No applications match your criteria.</div>;
    }

    return (
      <div className='w-full max-w-4xl'>
        {semesterCodes.map((semester) => (
          <Accordion key={semester} defaultExpanded>
            <AccordionSummary expandIcon={<KeyboardArrowDownOutlinedIcon />} sx={{ borderBottom: 1, borderColor: 'divider' }}>
              <Typography variant="h5">{`Semester ${semester}`}</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ padding: '16px', backgroundColor: '#f9f9f9' }}>
              <div className="space-y-4">
                {displayData[semester].map((app) => (
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

  const totalApplications = Object.values(displayData).reduce((acc, apps) => acc + apps.length, 0);

  return (
    <main>
      <div className='flex flex-col items-center p-6 bg-white shadow-sm'>
        <h1 className='text-4xl font-bold text-gray-800'>{pageTitle}</h1>
        <p className='text-md text-gray-600 mt-2'>{pageSubtitle}</p>
      </div>

      <Box component="form" onSubmit={handleSearch} className='flex justify-center p-4 bg-gray-100 border-b border-gray-200 sticky top-0 z-10'>
        <Box className='w-full max-w-4xl flex flex-col md:flex-row gap-4 items-center'>
            <SearchBar
                value={searchTerm}
                onChange={handleSearchTermChange}
                placeholder="Search by Course Name or Code..."
            />
            {filterConfig.length > 0 ? (
                <Filter
                  ref={filterRef}
                  onFilterChange={handleFilterChange}
                  filterConfig={filterConfig}
                />
            ) : (
                <Box className='w-24 h-10 animate-pulse bg-gray-300 rounded-md' />
            )}
            <button
              type='submit'
              className='h-10 shrink-0 rounded-md bg-rit-orange px-4 text-sm font-semibold text-white shadow-sm hover:bg-orange-700 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-orange-600'
            >
              Search
            </button>
        </Box>
      </Box>

      <div className='flex justify-center bg-gray-50 p-4 md:p-8 min-h-screen'>
        <div className='w-full max-w-4xl'>
          {!loading && !error && (
            <div className="mb-4 text-sm text-gray-600">
              <strong>
                {totalApplications} {totalApplications === 1 ? 'application' : 'applications'} found
              </strong>
            </div>
          )}
          {renderContent()}
        </div>
      </div>
    </main>
  );
}
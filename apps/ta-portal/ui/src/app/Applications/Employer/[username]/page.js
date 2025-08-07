// src/app/Applications/Employer/[username]/page.js
'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import {
  getSemesterCodesForEmployer,
  getCandidateApplicationsAsEmployer,
} from '@/services/db-apis';
import { useAuth } from '@/contexts/AuthContext';
import { gradeEnumToStringValue } from '@/constants/gradeConstants';

import ApplicationCard from '@/components/applications/EmployerAndAdmin/ApplicationCard';
import SearchBar from '@/components/common/searchAndFilter/SearchBar';
import { Filter }from '@/components/common/searchAndFilter/Filter';
import { generateApplicationsFilterConfig } from './filter.config';

import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import KeyboardArrowDownOutlinedIcon from '@mui/icons-material/KeyboardArrowDownOutlined';


export default function Applications() {
  const { currentUser } = useAuth();
  const filterRef = useRef();

  // displayData is now an object where keys are semester codes and values are arrays of positions
  const [displayData, setDisplayData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState('');
  const [searchBy, setSearchBy] = useState('course');
  const [filterConfig, setFilterConfig] = useState([]);
  const [appliedFilters, setAppliedFilters] = useState({
    status: [],
    level: [],
    semester: '',
    hasApplications: '',
  });

  useEffect(() => {
    if (currentUser?.username) {
      const fetchAndSetConfig = async () => {
        try {
          // Fetch the semester codes using the employer's username
          const semesterCodes = await getSemesterCodesForEmployer(
            currentUser.username
          );
          console.log('Semester codes fetched:', semesterCodes);
          // Generate the config with the fetched data
          const newConfig = generateApplicationsFilterConfig(semesterCodes);
          setFilterConfig(newConfig);
        } catch (err) {
          console.error('Failed to load filter configuration:', err);
          // Fallback to a config with no semester options on error
          setFilterConfig(generateApplicationsFilterConfig([]));
        }
      };
      fetchAndSetConfig();
    }
  }, [currentUser]);

  // This is now the single function for fetching and processing data.
  const updateApplicationsView = useCallback(
    async (search, searchType, filters) => {
      if (!currentUser?.username) return;
      setLoading(true);
      setError(null);

      try {
        // The API now returns an array of JobPosition objects, with applications nested inside.
        const data = await getCandidateApplicationsAsEmployer(
          search,
          searchType,
          filters,
          currentUser.username
        );

        // Convert gradeRequirement from enum to string
        const positions = data.map(position => {
          // Map over the applications within this position
          const applicationsHistory = position.jobPositionApplicationHistory.map(app => {
            // Check if the grade exists and can be converted
            if (app.candidateGrade && gradeEnumToStringValue[app.candidateGrade]) {
              return {
                ...app,
                candidateGrade: gradeEnumToStringValue[app.candidateGrade]
              };
            }
            return app; // Return the app unmodified if no conversion is needed
          });
          // Return a new position object with the transformed applications
          return {
            ...position,
            jobPositionApplicationHistory: applicationsHistory
          };
        });

        // Group the returned positions by their semester code for the accordion UI.
        const groupedBySemester = positions.reduce((acc, position) => {
          const semesterCode = position.semesterCode || 'Uncategorized';
          if (!acc[semesterCode]) {
            acc[semesterCode] = []; // Initialize an array for the semester
          }
          acc[semesterCode].push(position);
          return acc;
        }, {});

        setDisplayData(groupedBySemester);
      } catch (err) {
        console.error('Error updating applications view:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [currentUser]
  );

  // This effect runs on initial load to fetch the default view.
  useEffect(() => {
    if (currentUser) {
      updateApplicationsView(searchTerm, searchBy, appliedFilters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  // --- Event Handlers ---

  const handleStatusChange = () => {
    updateApplicationsView(searchTerm, searchBy, appliedFilters);
  };

  const handleFilterChange = (filters) => {
    setAppliedFilters(filters);
    updateApplicationsView(searchTerm, searchBy, filters);
  };

  const handleSearchTermChange = (newTerm) => {
    setSearchTerm(newTerm);
    if (newTerm === '') {
      updateApplicationsView('', searchBy, appliedFilters);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    // Get the most up-to-date filters directly from the Filter component
    const latestFilters = filterRef.current.getFilters();
    // Update the parent's state so the UI is consistent
    setAppliedFilters(latestFilters);
    // Fetch data with the latest filters and search term
    updateApplicationsView(searchTerm, searchBy, latestFilters);
  };

  // --- Render Logic ---
  const renderGroupedView = () => {
    const semesterCodes = Object.keys(displayData);

    if (semesterCodes.length === 0) {
      return (
        <div className='text-center py-10 px-4 bg-gray-50 border border-gray-200 rounded-lg mt-4'>
          <p className='text-lg font-semibold text-gray-800'>
            No Positions Found
          </p>
          <p className='text-gray-600 mt-2'>
            Your search or filter criteria did not match any job positions.
          </p>
        </div>
      );
    }

    return semesterCodes.map((semesterCode) => (
      <Accordion key={semesterCode} defaultExpanded>
        <AccordionSummary
          expandIcon={<KeyboardArrowDownOutlinedIcon />}
          sx={{ backgroundColor: 'rgba(0, 0, 0, .03)' }}
        >
          <Typography variant='h5'>{`Semester ${semesterCode}`}</Typography>
        </AccordionSummary>
        <AccordionDetails>
          <Box>
            {/* The data is now an array, so we can map it directly. */}
            {displayData[semesterCode].map((position) => (
              <Accordion key={position.id} defaultExpanded>
                <AccordionSummary
                  expandIcon={<KeyboardArrowDownOutlinedIcon />}
                >
                  <Typography variant='h6'>
                    {position.courseCode}-
                    {String(position.sectionNumber).padStart(2, '0')}:{' '}
                    {position.course?.name}
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
                    <p>No matching applications for this position.</p>
                  )}
                </AccordionDetails>
              </Accordion>
            ))}
          </Box>
        </AccordionDetails>
      </Accordion>
    ));
  };

  const renderContent = () => {
    if (loading)
      return <div className='text-center p-8'>Loading applications...</div>;
    if (error)
      return <div className='text-red-500 text-center p-8'>Error: {error}</div>;
    return renderGroupedView();
  };
  
  // Calculate the total number of applications
  const totalApplications = Object.values(displayData).flat().reduce((acc, position) => acc + position.jobPositionApplicationHistory.length, 0);

  // Main body of application
  return (
    <>
      <div className='flex flex-col items-center p-4'>
        <h1 className='text-4xl font-bold'>Applications</h1>
        <p className='text-md text-gray-600 mt-1'>
          Search, filter, and review candidate applications.
        </p>
      </div>

      <div className='flex flex-col items-center bg-gray-100 p-4 mb-10'>
        {currentUser && currentUser.role === 'EMPLOYER' ? (
          <div className='w-full max-w-5xl flex flex-col items-center justify-center'>
            {filterConfig.length > 0 ? (
              <form
                onSubmit={handleSearch}
                className='w-full mb-6 flex items-center gap-x-2 bg-white p-4 rounded-lg shadow'
              >
                <select
                  value={searchBy}
                  onChange={(e) => setSearchBy(e.target.value)}
                  className='h-10 rounded-md border-gray-300 bg-gray-50 hover:bg-gray-100 px-4 text-sm focus:ring-orange-500 focus:border-orange-500'
                >
                  <option value='course'>By Course</option>
                  <option value='student'>By Student</option>
                </select>
                <SearchBar
                  value={searchTerm}
                  onChange={handleSearchTermChange}
                  placeholder={
                    searchBy === 'course'
                      ? 'Search by course code or name...'
                      : 'Search by student name...'
                  }
                />
                <Filter
                  ref={filterRef}
                  onFilterChange={handleFilterChange}
                  filterConfig={filterConfig}
                />
                <button
                  type='submit'
                  className='h-10 rounded-md bg-rit-orange px-4 text-sm font-semibold text-white shadow-sm hover:bg-orange-700 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-orange-600'
                >
                  Search
                </button>
              </form>
            ) : (
              // Render a placeholder while the config is loading to prevent layout shift
              <div className='w-full mb-6 h-[88px] animate-pulse bg-gray-200 rounded-lg p-4'></div>
            )}

            <div id='section-container' className='w-full max-w-5xl p-2'>
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
        ) : (
          <div>Please make sure you are logged in as an EMPLOYER.</div>
        )}
      </div>
    </>
  );
}
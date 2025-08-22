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
import { Filter } from '@/components/common/searchAndFilter/Filter';
import { generateApplicationsFilterConfig } from './filter.config';

import {
  Accordion,
  AccordionDetails,
  AccordionSummary,
  Box,
  Button,
  CircularProgress,
  Container,
  FormControl,
  MenuItem,
  Paper,
  Select,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

/**
 * Renders the main applications management page for Employers.
 * This page allows employers to view and manage applications for the job positions they own.
 * It includes functionality to search, filter, and review candidate applications,
 * and to update application statuses.
 */
export default function EmployerApplicationsPage() {
  // Core hooks for authentication context and component references.
  const { currentUser } = useAuth();
  const filterRef = useRef();

  // State for managing application data, loading, and errors.
  const [displayData, setDisplayData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for search and filter functionality.
  const [searchTerm, setSearchTerm] = useState('');
  const [searchBy, setSearchBy] = useState('course');
  const [filterConfig, setFilterConfig] = useState([]);
  const [appliedFilters, setAppliedFilters] = useState({
    status: [],
    level: [],
    semester: '',
    hasApplications: '',
  });

  // Effect to fetch and configure filters on component mount or when the user changes.
  useEffect(() => {
    if (currentUser?.username) {
      /**
       * Fetches semester codes associated with the employer's positions
       * to dynamically generate and set the filter configuration.
       */
      const fetchAndSetConfig = async () => {
        try {
          const semesterCodes = await getSemesterCodesForEmployer(
            currentUser.username
          );
          const newConfig = generateApplicationsFilterConfig(semesterCodes);
          setFilterConfig(newConfig);
        } catch (err) {
          console.error('Failed to load filter configuration:', err);
          // Set a default empty config on error to prevent crashes.
          setFilterConfig(generateApplicationsFilterConfig([]));
        }
      };
      fetchAndSetConfig();
    }
  }, [currentUser]);

  /**
   * Fetches, processes, and displays applications for the positions owned by the employer.
   * This function handles searching, filtering, and grouping the data by semester.
   * @param {string} search - The current search term.
   * @param {string} searchType - The category to search by ('course' or 'student').
   * @param {object} filters - The active filter object.
   */
  const updateApplicationsView = useCallback(
    async (search, searchType, filters) => {
      if (!currentUser?.username) return;
      setLoading(true);
      setError(null);

      try {
        const data = await getCandidateApplicationsAsEmployer(
          search,
          searchType,
          filters,
          currentUser.username
        );

        // Process positions to convert grade enums to human-readable strings for display.
        const positions = data.map((position) => {
          const applicationsHistory =
            position.jobPositionApplicationHistory.map((app) => {
              if (
                app.candidateGrade &&
                gradeEnumToStringValue[app.candidateGrade]
              ) {
                return {
                  ...app,
                  candidateGrade: gradeEnumToStringValue[app.candidateGrade],
                };
              }
              return app;
            });
          return {
            ...position,
            jobPositionApplicationHistory: applicationsHistory,
          };
        });

        // Group the flattened list of positions by their semester code for display in accordions.
        const groupedBySemester = positions.reduce((acc, position) => {
          const semesterCode = position.semesterCode || 'Uncategorized';
          if (!acc[semesterCode]) {
            acc[semesterCode] = [];
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

  // Effect to perform the initial data load when the component mounts or the user changes.
  useEffect(() => {
    if (currentUser) {
      // Pass empty values to ensure a clean initial load of all applications.
      updateApplicationsView('', 'course', {
        status: [],
        level: [],
        semester: '',
        hasApplications: '',
      });
    }
  }, [currentUser, updateApplicationsView]);

  /**
   * Callback function passed to child ApplicationCard components.
   * Triggers a refresh of the applications view when a status is changed.
   */
  const handleStatusChange = () => {
    updateApplicationsView(searchTerm, searchBy, appliedFilters);
  };

  /**
   * Handles updates from the Filter component, triggering a data refresh.
   * @param {object} filters - The new set of applied filters.
   */
  const handleFilterChange = (filters) => {
    setAppliedFilters(filters);
    updateApplicationsView(searchTerm, searchBy, filters);
  };

  /**
   * Updates the search term state as the user types in the search bar.
   * If the search bar is cleared, it refreshes the view.
   * @param {string} newTerm - The new value from the search input.
   */
  const handleSearchTermChange = (newTerm) => {
    setSearchTerm(newTerm);
    if (newTerm === '') {
      updateApplicationsView('', searchBy, appliedFilters);
    }
  };

  /**
   * Handles changes to the search category dropdown (e.g., 'By Course', 'By Student').
   * Resets the search term if the category is changed while a search term exists.
   * @param {React.ChangeEvent<HTMLInputElement>} event - The change event from the Select component.
   */
  const handleSearchByChange = (event) => {
    const newSearchBy = event.target.value;
    setSearchBy(newSearchBy);
    // If a search term exists, clear it to prevent mismatched searches.
    if (searchTerm !== '') {
      setSearchTerm('');
      updateApplicationsView('', newSearchBy, appliedFilters);
    }
  };

  /**
   * Triggers a search and data refresh when the search form is submitted.
   * @param {React.FormEvent<HTMLFormElement>} e - The form submission event.
   */
  const handleSearch = (e) => {
    e.preventDefault();
    const latestFilters = filterRef.current.getFilters();
    setAppliedFilters(latestFilters);
    updateApplicationsView(searchTerm, searchBy, latestFilters);
  };

  /**
   * Renders the main content of the page, handling loading, error, and no-data states.
   * @returns {React.ReactNode} The JSX for the main content area.
   */
  const renderContent = () => {
    // Show a loading spinner while data is being fetched.
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      );
    }
    // Show an error message if the API call fails.
    if (error) {
      return (
        <Typography color="error" align="center" sx={{ p: 4 }}>
          Error: {error}
        </Typography>
      );
    }

    // Show a message if no positions match the current filters.
    const semesterCodes = Object.keys(displayData);
    if (semesterCodes.length === 0) {
      return (
        <Paper sx={{ textAlign: 'center', p: 4, mt: 2 }}>
          <Typography variant="h6">No Positions Found</Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            Your search or filter criteria did not match any job positions.
          </Typography>
        </Paper>
      );
    }

    // Render the list of positions and their applications, grouped by semester.
    return semesterCodes.map((semesterCode) => (
      <Accordion key={semesterCode} defaultExpanded>
        <AccordionSummary expandIcon={<ExpandMoreIcon />}>
          <Typography variant="h5">{`Semester ${semesterCode}`}</Typography>
        </AccordionSummary>
        <AccordionDetails sx={{ p: { xs: 1, md: 2 }, bgcolor: 'background.default' }}>
          {displayData[semesterCode].map((position) => (
            <Accordion key={position.id} defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                <Typography variant="h6">
                  {position.courseCode}-
                  {String(position.sectionNumber).padStart(2, '0')}:{' '}
                  {position.course?.name}
                </Typography>
              </AccordionSummary>
              <AccordionDetails>
                {position.jobPositionApplicationHistory.length > 0 ? (
                  position.jobPositionApplicationHistory.map((app) => (
                    <ApplicationCard
                      currentUser={currentUser}
                      key={app.id}
                      jobPosition={position}
                      application={app}
                      onStatusChange={handleStatusChange}
                    />
                  ))
                ) : (
                  <Typography sx={{ p: 2 }}>
                    No matching applications for this position.
                  </Typography>
                )}
              </AccordionDetails>
            </Accordion>
          ))}
        </AccordionDetails>
      </Accordion>
    ));
  };

  // Calculate the total number of applications currently displayed.
  const totalApplications = Object.values(displayData)
    .flat()
    .reduce(
      (acc, position) => acc + position.jobPositionApplicationHistory.length,
      0
    );

  // Main component render method.
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h1" component="h1" gutterBottom>
          Applications
        </Typography>
        <Typography variant="h3" color="text.secondary">
          Search, filter, and review candidate applications.
        </Typography>
      </Box>

      {/* Conditionally render content based on user role. */}
      {currentUser && currentUser.role === 'EMPLOYER' ? (
        <Box>
          {/* Search and Filter Bar */}
          <Paper
            component="form"
            onSubmit={handleSearch}
            elevation={2}
            sx={{
              p: 2,
              mb: 4,
              display: 'flex',
              alignItems: 'center',
              gap: 2,
              position: 'sticky',
              top: 0,
              zIndex: 10,
              backgroundColor: 'background.paper',
            }}
          >
            <FormControl sx={{ minWidth: 150 }}>
              <Select
                value={searchBy}
                onChange={handleSearchByChange}
                size="small"
              >
                <MenuItem value="course">By Course</MenuItem>
                <MenuItem value="student">By Student</MenuItem>
              </Select>
            </FormControl>
            <SearchBar
              value={searchTerm}
              onChange={handleSearchTermChange}
              placeholder={
                searchBy === 'course'
                  ? 'Search by course code or name...'
                  : 'Search by student name...'
              }
              sx={{ flexGrow: 1 }}
            />
            <Filter
              ref={filterRef}
              onFilterChange={handleFilterChange}
              filterConfig={filterConfig}
            />
            <Button type="submit" variant="contained" color="primary">
              Search
            </Button>
          </Paper>

          {/* Application Count and Main Content */}
          {!loading && !error && (
            <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
              <strong>
                {totalApplications}{' '}
                {totalApplications === 1 ? 'application' : 'applications'} found
              </strong>
            </Typography>
          )}
          {renderContent()}
        </Box>
      ) : (
        // Render a fallback message if the user is not an employer or not logged in.
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography>
            Please make sure you are logged in as an EMPLOYER.
          </Typography>
        </Paper>
      )}
    </Container>
  );
}
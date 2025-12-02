// src/app/Applications/Candidate/[username]/page.js
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
import FeatureGate from "@/components/common/FeatureGate";
import { FEATURES } from "@/configuration/featureFlags";
import { useSearchParams } from 'next/navigation';
import { getCandidateApplicationsAsCandidate } from '@/services/db-apis';
import { useAuth } from '@/contexts/AuthContext';
import { gradeEnumToStringValue } from '@/constants/gradeConstants';

import ApplicationCard from '@/components/applications/CandidateAndEmployee/ApplicationCard';
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
  Paper,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

/**
 * Renders the "My Applications" page for a logged-in candidate.
 * This page allows candidates to view, search, and filter all the job positions
 * they have applied for, track their application status, and manage their applications.
 */
export default function CandidateApplicationsPage() {
  // Core hooks for authentication context and component references.
  const { currentUser, refreshUserProfile } = useAuth();
  const filterRef = useRef();
  const searchParams = useSearchParams();
  const scrolledRef = useRef(false);

  // State for managing application data, loading, and errors.
  const [displayData, setDisplayData] = useState({});
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filterConfig, setFilterConfig] = useState([]);

  // State for search and filter functionality.
  const [searchTerm, setSearchTerm] = useState('');
  const [appliedFilters, setAppliedFilters] = useState({
    status: [],
    level: [],
    semester: '',
  });

  // Static text for the page header.
  const pageTitle = "My Applications";
  const pageSubtitle = "Track the status of all positions you've applied for.";

  // Effect to fetch and build the filter options on component mount.
  useEffect(() => {
    if (currentUser?.username) {
      /**
       * Fetches all of the candidate's applications to dynamically generate
       * semester options for the filter dropdown. This ensures the filter
       * only shows semesters for which the user has actually applied.
       */
      const fetchSemesterOptions = async () => {
        try {
          // Fetch all applications without any filters to get all possible semesters.
          const allApps = await getCandidateApplicationsAsCandidate(
            '',
            { status: [], level: [], semester: '' },
            currentUser.username
          );
          
          // Use a Set to get unique semester codes, then sort them in descending order.
          const semesterCodes = [...new Set(allApps.map(app => app.jobPositionId.split('-')[0]))]
            .sort((a,b) => b.localeCompare(a));
          
          const newConfig = generateApplicationsFilterConfig(semesterCodes);
          setFilterConfig(newConfig);
        } catch (err)          {
          console.error('Failed to load filter configuration:', err);
          // Set a default empty config on error to prevent crashes.
          setFilterConfig(generateApplicationsFilterConfig([]));
        }
      };
      fetchSemesterOptions();
    }
  }, [currentUser]);

  /**
   * Fetches, processes, and displays the candidate's applications based on
   * the current search and filter criteria.
   * @param {string} search - The current search term.
   * @param {object} filters - The active filter object.
   */
  const updateApplicationsView = useCallback(async (search, filters) => {
    if (!currentUser?.username) return;
    setLoading(true);
    setError(null);

    try {
      const data = await getCandidateApplicationsAsCandidate(
        search,
        filters,
        currentUser.username
      );
      
      // Process applications to convert grade enums to human-readable strings.
      const applications = data.map(application => {
        if (application.candidateGrade && gradeEnumToStringValue[application.candidateGrade]) {
          return {
            ...application,
            candidateGrade: gradeEnumToStringValue[application.candidateGrade]
          };
        }
        return application;
      })

      // Group the applications by semester for display in accordions.
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

  // Effect to perform the initial data load when the component mounts or the user changes.
  useEffect(() => {
    if (currentUser) {
      // We explicitly pass an empty search term and filters to ensure a clean initial load.
      updateApplicationsView('', { status: [], level: [], semester: '' });
    }
  }, [currentUser, updateApplicationsView]);

  // Auto-scroll to focused application when deep-linked
  useEffect(() => {
    if (loading || scrolledRef.current) return;
    const appId = searchParams.get('applicationId');
    if (!appId) return;
    const el = document.getElementById(`app-${appId}`);
    if (el) {
      scrolledRef.current = true;
      try {
        el.closest('[role="region"]')?.previousElementSibling?.click?.();
      } catch (_) {}
      setTimeout(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.focus({ preventScroll: true });
      }, 50);
    }
  }, [loading, displayData, searchParams]);

  /**
   * Callback function passed to child ApplicationCard components.
   * Triggers a refresh of the applications view when a status is changed (e.g., application withdrawn).
   */
  const handleStatusChange = () => {
    updateApplicationsView(searchTerm, appliedFilters);
  };

  /**
   * Handles updates from the Filter component, triggering a data refresh.
   * @param {object} filters - The new set of applied filters from the Filter component.
   */
  const handleFilterChange = (filters) => {
    setAppliedFilters(filters);
    updateApplicationsView(searchTerm, filters);
  };
  
  /**
   * Updates the search term state as the user types.
   * If the search bar is cleared, it refreshes the view to show all items.
   * @param {string} newTerm - The new value from the search input.
   */
  const handleSearchTermChange = (newTerm) => {
    setSearchTerm(newTerm);
    if (newTerm === '') {
      updateApplicationsView('', appliedFilters);
    }
  };
  
  /**
   * Triggers a search when the search form is submitted.
   * @param {React.FormEvent<HTMLFormElement>} e - The form submission event.
   */
  const handleSearch = (e) => {
    e.preventDefault();
    const latestFilters = filterRef.current.getFilters();
    setAppliedFilters(latestFilters);
    updateApplicationsView(searchTerm, latestFilters);
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
    
    // Sort semester codes in descending order (e.g., 2241, 2235, 2231).
    const semesterCodes = Object.keys(displayData).sort((a, b) => b.localeCompare(a));

    // Show a message if no applications match the current filters.
    if (semesterCodes.length === 0) {
      return (
        <Paper sx={{ textAlign: 'center', p: 4, mt: 2 }}>
          <Typography variant="h6">No Applications Found</Typography>
          <Typography color="text.secondary" sx={{ mt: 1 }}>
            No applications match your current search or filter criteria.
          </Typography>
        </Paper>
      );
    }

    // Render the list of applications grouped by semester.
    return (
      <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
        {semesterCodes.map((semester) => (
          <Accordion key={semester} defaultExpanded>
            <AccordionSummary expandIcon={<ExpandMoreIcon />}>
              <Typography variant="h5">{`Semester ${semester}`}</Typography>
            </AccordionSummary>
            <AccordionDetails sx={{ p: { xs: 1, md: 2 }, bgcolor: 'background.default' }}>
              <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
                {displayData[semester].map((app) => (
                  <ApplicationCard
                    key={app.id}
                    currentUser={currentUser}
                    application={app}
                    onStatusChange={handleStatusChange}
                    refreshUserProfile={refreshUserProfile}
                    cardId={`app-${app.id}`}
                    isHighlighted={String(searchParams.get('applicationId')||'')===String(app.id)}
                  />
                ))}
              </Box>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    );
  };

  // Calculate the total number of applications currently displayed.
  const totalApplications = Object.values(displayData).reduce((acc, apps) => acc + apps.length, 0);

  // Main component render method.
  return (
    <FeatureGate feature={FEATURES.APPLICATIONS}>
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h1" component="h1" gutterBottom>
          {pageTitle}
        </Typography>
        <Typography variant="h3" color="text.secondary">
          {pageSubtitle}
        </Typography>
      </Box>

      {/* Conditionally render content based on user role. */}
      {currentUser && currentUser.role === 'CANDIDATE' ? (
        <>
          {/* Search and Filter Bar */}
          <Paper
            component="form"
            onSubmit={handleSearch}
            elevation={2}
            sx={{
              p: 2,
              mb: 4,
              display: 'flex',
              flexDirection: { xs: 'column', md: 'row' },
              alignItems: 'center',
              gap: 2,
              position: 'sticky',
              top: 0,
              zIndex: 10,
              backgroundColor: 'background.paper',
            }}
          >
            <SearchBar
              value={searchTerm}
              onChange={handleSearchTermChange}
              placeholder="Search by Course Name or Code..."
              sx={{ width: '100%' }}
            />
            {/* Show a placeholder skeleton while the filter config is loading. */}
            {filterConfig.length > 0 ? (
              <Filter
                ref={filterRef}
                onFilterChange={handleFilterChange}
                filterConfig={filterConfig}
              />
            ) : (
              <Box sx={{ width: 120, height: 40, bgcolor: 'action.disabledBackground', borderRadius: 1 }} />
            )}
            <Button
              type='submit'
              variant='contained'
              color='primary'
              sx={{ height: 40, width: { xs: '100%', md: 'auto' } }}
            >
              Search
            </Button>
          </Paper>

          {/* Main Content Area */}
          <Box>
            {!loading && !error && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                <strong>
                  {totalApplications} {totalApplications === 1 ? 'application' : 'applications'} found
                </strong>
              </Typography>
            )}
            {renderContent()}
          </Box>
        </>
      ) : (
        // Render a fallback message if the user is not a candidate or not logged in.
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography>Please make sure you are logged in as a CANDIDATE to view this page.</Typography>
        </Paper>
      )}
    </Container>
    </FeatureGate>
  );
}
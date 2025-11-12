// src/app/Applications/Admin/[username]/page.js
'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import {
  getSemesterCodesForEmployer,
  getCandidateApplicationsAsEmployer,
  getCandidateApplicationsAsAdmin,
  hireCandidate,
} from '@/services/db-apis';
import { useAuth } from '@/contexts/AuthContext';
import { useNotification } from '@/contexts/NotificationContext';
import { gradeEnumToStringValue } from '@/constants/gradeConstants';

import ApplicationCard from '@/components/applications/EmployerAndAdmin/ApplicationCard';
import { Filter } from '@/components/common/searchAndFilter/Filter';
import SearchBar from '@/components/common/searchAndFilter/SearchBar';
import { generateApplicationsFilterConfig } from './filter.config';
import HireModal from '@/components/applications/EmployerAndAdmin/HireModel';

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
  Tab,
  Tabs,
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

/**
 * Renders the main applications management page for Administrators.
 * This page features two primary views accessible via tabs:
 * 1. "My Applications": Allows admins to view and manage applications for positions they own,
 * acting in an employer capacity.
 * 2. "Ready to Hire": Shows a system-wide list of candidates who have accepted offers and are
 * awaiting final processing by an admin to be hired.
 */
export default function AdminApplicationsPage() {
  // Core hooks for authentication, notifications, and component references.
  const { currentUser } = useAuth();
  const { showNotification } = useNotification();
  const filterRef = useRef();
  const searchParams = useSearchParams();
  const router = useRouter();

  // Initialize active tab based on URL search parameter for linkability.
  const [activeTab, setActiveTab] = useState(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'hiring') return 1;
    // If we arrive via a deep link that includes application identifiers but
    // no explicit tab, prefer landing on the "Ready to Hire" tab which is the
    // typical admin action surface for notifications.
    const hasDeepLink = !!(
      searchParams.get('jobPositionId') || searchParams.get('applicationId')
    );
    return hasDeepLink ? 1 : 0;
  });

  // State for the "My Applications" tab.
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

  // State for the "Ready to Hire" tab.
  const [hiringApplications, setHiringApplications] = useState([]);
  const [hiringLoading, setHiringLoading] = useState(false);
  const [hiringError, setHiringError] = useState(null);

  // State for the hiring modal functionality.
  const [isHireModalOpen, setIsHireModalOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  // Track whether we've auto-opened a modal from a deep link to avoid repeats.
  const didAutoOpenFromLink = useRef(false);

  // Effect to fetch and configure filters on component mount or when the user changes.
  useEffect(() => {
    if (currentUser?.username) {
      /**
       * Fetches semester codes associated with the admin's own positions
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
          setFilterConfig(generateApplicationsFilterConfig([])); // Set a default config on error
        }
      };
      fetchAndSetConfig();
    }
  }, [currentUser]);

  /**
   * Fetches, processes, and displays applications for the positions owned by the admin.
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

        // Process positions to convert grade enums to human-readable strings.
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

  /**
   * Fetches applications from across the system that have the 'ACCEPTED_OFFER' status,
   * preparing them for the "Ready to Hire" tab.
   */
  const fetchHiringApplications = useCallback(async () => {
    setHiringLoading(true);
    setHiringError(null);

    try {
      const applications = await getCandidateApplicationsAsAdmin();
      // Process applications to format grade data.
      const processedApplications = applications.map((app) => {
        if (app.candidateGrade && gradeEnumToStringValue[app.candidateGrade]) {
          return {
            ...app,
            candidateGrade: gradeEnumToStringValue[app.candidateGrade],
          };
        }
        return app;
      });
      setHiringApplications(processedApplications);
    } catch (err) {
      console.error('Error fetching hiring applications:', err);
      setHiringError(err.message);
    } finally {
      setHiringLoading(false);
    }
  }, []);

  // Main data fetching effect that runs when the active tab or user context changes.
  useEffect(() => {
    if (currentUser) {
      if (activeTab === 0) {
        updateApplicationsView(searchTerm, searchBy, appliedFilters);
      } else if (activeTab === 1) {
        fetchHiringApplications();
      }
    }
    // Disabling exhaustive-deps because we intentionally want this to run only when the tab or user changes,
    // not on every change to search/filter state, which are handled by their own callbacks.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, activeTab]);

  // If a user lands on the Admin route but is not an ADMIN, reroute them to
  // their role-correct Applications path while preserving query params.
  useEffect(() => {
    if (!currentUser) return;
    if (currentUser.role !== 'ADMIN') {
      const params = searchParams.toString();
      const query = params ? `?${params}` : '';
      const roleMap = {
        CANDIDATE: 'Candidate',
        EMPLOYEE: 'Employee',
        EMPLOYER: 'Employer',
        ADMIN: 'Admin',
      };
      const roleSeg = roleMap[currentUser.role] || 'Candidate';
      router.replace(`/Applications/${roleSeg}/${currentUser.username}${query}`);
    }
  }, [currentUser, router, searchParams]);

  // Auto-open the Hire modal if we were deep-linked with application identifiers
  // and we're on the Ready to Hire tab and the application is present.
  useEffect(() => {
    if (didAutoOpenFromLink.current) return;
    if (activeTab !== 1) return; // Only makes sense on Ready to Hire

    const appIdParam = searchParams.get('applicationId');
    if (!appIdParam) return;

    // Wait until hiring data is loaded
    if (hiringLoading) return;

    const target = hiringApplications.find(
      (a) => String(a.id) === String(appIdParam)
    );
    if (target) {
      didAutoOpenFromLink.current = true;
      handleOpenHireModal(target);
    }
  }, [activeTab, searchParams, hiringApplications, hiringLoading]);

  /**
   * Handles the user switching between the "My Applications" and "Ready to Hire" tabs.
   * Resets all search and filter states to provide a clean slate for the new view.
   * @param {React.SyntheticEvent} event - The event source of the callback.
   * @param {number} newValue - The index of the newly selected tab.
   */
  const handleTabChange = (event, newValue) => {
    // Reset search and filter states.
    setSearchTerm('');
    setSearchBy('course');
    const initialFilters = {
      status: [],
      level: [],
      semester: '',
      hasApplications: '',
    };
    setAppliedFilters(initialFilters);

    // Clear all filters in the child Filter component via its ref.
    if (filterRef.current && typeof filterRef.current.clearAll === 'function') {
      filterRef.current.clearAll();
    }
    
    setActiveTab(newValue);
  };

  /**
   * Callback function passed to child ApplicationCard components.
   * Triggers a refresh of the "My Applications" view when a status is changed.
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
   * Clears the view if the search term is empty.
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
   * Opens the hire confirmation modal and sets the selected application.
   * @param {object} application - The application object for the candidate to be hired.
   */
  const handleOpenHireModal = (application) => {
    setSelectedApplication(application);
    setIsHireModalOpen(true);
  };

  /**
   * Closes the hire confirmation modal and clears the selected application state.
   */
  const handleCloseHireModal = () => {
    setIsHireModalOpen(false);
    setSelectedApplication(null);
  };

  /**
   * Handles the final confirmation of hiring a candidate from the modal.
   * Calls the hireCandidate API service and refreshes the hiring list on success.
   * @param {string} employeeId - The new employee ID for the candidate.
   * @param {string} comment - An optional comment for the hiring record.
   */
  const handleConfirmHire = async (employeeId, comment) => {
    if (!selectedApplication || !currentUser) return;

    setIsProcessing(true);
    try {
      const commentData = {
        author: `${currentUser.fname} ${currentUser.lname}`,
        comment: comment,
      };

      await hireCandidate(
        selectedApplication.username,
        selectedApplication.id,
        selectedApplication.jobPositionId,
        employeeId,
        commentData
      );

      showNotification('Candidate hired successfully!', 'success');
      handleCloseHireModal();
      fetchHiringApplications(); // Refresh the list after hiring
    } catch (err) {
      console.error('Error hiring candidate:', err);
      showNotification(err.message || 'Failed to hire candidate.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  /**
   * Renders the UI for the "My Applications" tab, including search, filters,
   * and the accordion-style list of applications grouped by semester and position.
   * @returns {React.ReactNode} The JSX for the applications tab.
   */
  const renderApplicationsTab = () => {
    // Calculate the total number of applications currently displayed.
    const totalApplications = Object.values(displayData)
      .flat()
      .reduce(
        (acc, position) => acc + position.jobPositionApplicationHistory.length,
        0
      );

    return (
      <Box sx={{ width: '100%' }}>
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

        {/* Application Count */}
        {!loading && !error && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            <strong>
              {totalApplications}{' '}
              {totalApplications === 1 ? 'application' : 'applications'} found
            </strong>
          </Typography>
        )}

        {/* Main Content: Loading, Error, No Results, or Data */}
        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error" align="center" sx={{ p: 4 }}>
            Error: {error}
          </Typography>
        ) : Object.keys(displayData).length === 0 ? (
          <Paper sx={{ textAlign: 'center', p: 4, mt: 2 }}>
            <Typography variant="h6">No Positions Found</Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              Your search or filter criteria did not match any job positions.
            </Typography>
          </Paper>
        ) : (
          Object.keys(displayData).map((semesterCode) => (
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
          ))
        )}
      </Box>
    );
  };

  /**
   * Renders the UI for the "Ready to Hire" tab, displaying a list
   * of candidates who have accepted offers and can be hired.
   * @returns {React.ReactNode} The JSX for the hiring tab.
   */
  const renderHiringTab = () => {
    return (
      <Box sx={{ width: '100%' }}>
        <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
          <strong>
            {hiringApplications.length}{' '}
            {hiringApplications.length === 1 ? 'candidate' : 'candidates'}{' '}
            ready for hiring
          </strong>
        </Typography>
        {hiringLoading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : hiringError ? (
          <Typography color="error" align="center" sx={{ p: 4 }}>
            Error: {hiringError}
          </Typography>
        ) : hiringApplications.length === 0 ? (
          <Paper sx={{ textAlign: 'center', p: 4 }}>
            <Typography variant="h6">
              No Applications Ready for Hiring
            </Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              There are currently no candidates who have accepted job offers.
            </Typography>
          </Paper>
        ) : (
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {hiringApplications.map((application) => (
              <ApplicationCard
                key={application.id}
                currentUser={currentUser}
                jobPosition={application.jobPosition}
                application={application}
                onStatusChange={() => fetchHiringApplications()}
                onHire={() => handleOpenHireModal(application)}
                showHireAction={true}
              />
            ))}
          </Box>
        )}
      </Box>
    );
  };

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

      {/* Conditionally render content based on user role */}
      {currentUser && currentUser.role === 'ADMIN' ? (
        <Box sx={{ width: '100%' }}>
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              aria-label="admin applications tabs"
              centered
            >
              <Tab label="My Applications" />
              <Tab label="Ready to Hire" />
            </Tabs>
          </Box>
          {activeTab === 0 && renderApplicationsTab()}
          {activeTab === 1 && renderHiringTab()}
        </Box>
      ) : (
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography>Please make sure you are logged in as an ADMIN.</Typography>
        </Paper>
      )}

      {/* Render the modal conditionally */}
      {isHireModalOpen && selectedApplication && (
        <HireModal
          application={selectedApplication}
          onClose={handleCloseHireModal}
          onConfirm={handleConfirmHire}
          isProcessing={isProcessing}
        />
      )}
    </Container>
  );
}
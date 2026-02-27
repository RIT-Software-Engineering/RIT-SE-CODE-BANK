// src/app/Applications/Admin/[username]/page.js
'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import FeatureGate from "@/components/common/FeatureGate";
import { FEATURES } from "@/configuration/featureFlags";
import { useRouter, useSearchParams } from 'next/navigation';
import {
  getCandidateApplicationsAsAdmin,
  getAllApplicationsForAdmin,
  getSemesterCodesForEmployer,
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
  Typography,
} from '@mui/material';
import ExpandMoreIcon from '@mui/icons-material/ExpandMore';

/**
 * Renders the applications management page for Administrators.
 */
export default function AdminApplicationsPage() {
  // Core hooks
  const { currentUser } = useAuth();
  const { showNotification } = useNotification();
  const filterRef = useRef();
  const searchParams = useSearchParams();
  const router = useRouter();

  // State for Hire Candidates tab
  const [hiringApplications, setHiringApplications] = useState([]);
  const [hiringLoading, setHiringLoading] = useState(false);
  const [hiringError, setHiringError] = useState(null);

  // State for All Applications tab
  const [displayData, setDisplayData] = useState({});
  const [loading, setLoading] = useState(false);
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

  // State for hiring modal
  const [isHireModalOpen, setIsHireModalOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  // Track whether we've auto-opened a modal from a deep link to avoid repeats.
  const didAutoOpenFromLink = useRef(false);
  // Track whether we've auto-scrolled to avoid repeats.
  const scrolledRef = useRef(false);

  /**
   * Fetches applications from across the system that have the 'ACCEPTED_OFFER' status.
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

  // Fetch filter config on mount
  useEffect(() => {
    if (currentUser?.username) {
      const fetchAndSetConfig = async () => {
        try {
          const semesterCodes = await getSemesterCodesForEmployer(currentUser.username);
          const newConfig = generateApplicationsFilterConfig(semesterCodes);
          setFilterConfig(newConfig);
        } catch (err) {
          console.error('Failed to load filter configuration:', err);
          setFilterConfig(generateApplicationsFilterConfig([]));
        }
      };
      fetchAndSetConfig();
    }
  }, [currentUser]);

  useEffect(() => {
    if (currentUser) {
      updateAllApplicationsView(searchTerm, searchBy, appliedFilters);

    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

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
  }, [searchParams, hiringApplications, hiringLoading]);

  // Auto-scroll to the deep-linked application card
  useEffect(() => {
    if (scrolledRef.current) return;

    const appIdParam = searchParams.get('applicationId');
    if (!appIdParam) return;

    // Wait for data to load based on active tab
    if (loading || hiringLoading) return;

    const el = document.getElementById(`application-${appIdParam}`);
    if (el) {
      scrolledRef.current = true;
      // Try to expand any parent accordions
      try {
        el.closest('[role="region"]')?.previousElementSibling?.click?.();
      } catch (_) { }
      // Scroll to the card
      setTimeout(() => {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
        el.focus({ preventScroll: true });
      }, 300);
    }
  }, [searchParams, hiringApplications, hiringLoading, displayData, loading]);

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
   * Fetches and displays all applications across the system with search/filter.
   */
  const updateAllApplicationsView = useCallback(
    async (search, searchType, filters) => {
      if (!currentUser?.username) return;
      setLoading(true);
      setError(null);

      try {
        const data = await getAllApplicationsForAdmin(search, searchType, filters);
        const hireableData = await getCandidateApplicationsAsAdmin();

        const hireableMap = Object.fromEntries(
          hireableData.map(app => [app.id, app])
        );

        // Process positions to convert grade enums
        const positions = data.map((position) => {
          const applicationsHistory = position.jobPositionApplicationHistory.map((app) => {
            // Convert grade enum
            const updatedApp = app.candidateGrade && gradeEnumToStringValue[app.candidateGrade]
              ? { ...app, candidateGrade: gradeEnumToStringValue[app.candidateGrade] }
              : app;

            // Merge hireable data if this application is approved
            const approved = hireableMap[app.id];
            return approved ? { ...updatedApp, ...approved } : updatedApp;
          });
          return {
            ...position,
            jobPositionApplicationHistory: applicationsHistory,
          };

        });

        // Group by semester
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
        console.error('Error updating all applications view:', err);
        setError(err.message);
      } finally {
        setLoading(false);
      }
    },
    [currentUser]
  );

  /**
   * Handles search/filter changes for All Applications tab.
   */
  const handleFilterChange = (filters) => {
    setAppliedFilters(filters);
    updateAllApplicationsView(searchTerm, searchBy, filters);
  };

  const handleSearchTermChange = (newTerm) => {
    setSearchTerm(newTerm);
    if (newTerm === '') {
      updateAllApplicationsView('', searchBy, appliedFilters);
    }
  };

  const handleSearchByChange = (event) => {
    const newSearchBy = event.target.value;
    setSearchBy(newSearchBy);
    if (searchTerm !== '') {
      setSearchTerm('');
      updateAllApplicationsView('', newSearchBy, appliedFilters);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const latestFilters = filterRef.current.getFilters();
    setAppliedFilters(latestFilters);
    updateAllApplicationsView(searchTerm, searchBy, latestFilters);
  };

  const handleStatusChange = () => {
    updateAllApplicationsView(searchTerm, searchBy, appliedFilters);
  };

  /**
   * Renders the All Applications tab with search and filters.
   */
  const renderAllApplicationsTab = () => {
    const totalApplications = Object.values(displayData).reduce((total, positions) => {
      return total + positions.reduce((acc, position) => acc + position.jobPositionApplicationHistory.length, 0);
    }, 0);

    return (
      <Box sx={{ width: '100%' }}>
        {/* Search and Filter */}
        <Paper
          component="form"
          onSubmit={handleSearch}
          sx={{ p: 2, mb: 4, display: 'flex', alignItems: 'center', gap: 2 }}
        >
          <FormControl sx={{ minWidth: 150 }}>
            <Select value={searchBy} onChange={handleSearchByChange} size="small"
              sx={(theme) => ({
                background: theme.palette.mode === 'dark'
                  ? "" : "white"
              })}>
              <MenuItem value="course">By Course</MenuItem>
              <MenuItem value="student">By Student</MenuItem>
            </Select>
          </FormControl>
          <SearchBar
            value={searchTerm}
            onChange={handleSearchTermChange}
            variant="outlined"
            placeholder={searchBy === 'course' ? 'Search by course code or name...' : 'Search by student name...'}
            sx={{ flexGrow: 1 }}
          />
          <Filter ref={filterRef} onFilterChange={handleFilterChange} filterConfig={filterConfig} />
          <Button type="submit" variant="contained" color="primary" >Search</Button>
        </Paper>

        {!loading && !error && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            <strong>{totalApplications} {totalApplications === 1 ? 'application' : 'applications'} found</strong>
          </Typography>
        )}

        {loading ? (
          <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
            <CircularProgress />
          </Box>
        ) : error ? (
          <Typography color="error" align="center" sx={{ p: 4 }}>Error: {error}</Typography>
        ) : Object.keys(displayData).length === 0 ? (
          <Paper sx={{ textAlign: 'center', p: 4 }}>
            <Typography variant="h6">No Applications Found</Typography>
            <Typography color="text.secondary" sx={{ mt: 1 }}>
              Your search or filter criteria did not match any applications.
            </Typography>
          </Paper>
        ) : (
          Object.keys(displayData).map((semesterCode) => (
            <Accordion key={semesterCode} defaultExpanded>
              <AccordionSummary expandIcon={<ExpandMoreIcon />} sx={(theme) => ({
                background: theme.palette.mode === 'dark'
                  ? "" : "--color-rit-gray"
              })}>
                <Typography variant="h5">Semester {semesterCode}</Typography>
              </AccordionSummary>
              <AccordionDetails sx={(theme) => ({
                p: { xs: 1, md: 2 }, background: theme.palette.mode === 'dark'
                  ? "" : "--color-rit-gray"
              })}>
                {displayData[semesterCode].map((position) => (
                  <Accordion key={position.id} defaultExpanded={position.jobPositionApplicationHistory.length > 0} sx={(theme) => ({
                    background: theme.palette.mode === 'dark'
                      ? "" : "#e0e0e0"
                  })}>
                    <AccordionSummary expandIcon={<ExpandMoreIcon />}>
                      <Typography variant="h6">
                        {position.courseCode}-{String(position.sectionNumber).padStart(2, '0')}: {position.course?.name}
                      </Typography>
                    </AccordionSummary>
                    <AccordionDetails>
                      {position.jobPositionApplicationHistory.length > 0 ? (
                        position.jobPositionApplicationHistory.map((app) => (
                          <Box
                            key={app.id}
                            id={`application-${app.id}`}
                            sx={{
                              borderRadius: 2,
                              mb: 2
                            }}
                          >
                            <ApplicationCard
                              currentUser={currentUser}
                              jobPosition={position}
                              application={app}
                              onStatusChange={handleStatusChange}
                              showHireAction={true}
                              onHire={() => handleOpenHireModal(app)}
                              isHighlighted={String(searchParams.get('applicationId') || '') === String(app.id)}
                            />
                          </Box>
                        ))
                      ) : (
                        <Typography sx={{ p: 2 }}>No matching applications for this position.</Typography>
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
   * Renders the UI for candidates who have accepted offers and can be hired.
   * @returns {React.ReactNode} The JSX for the hiring view.
   */
  const renderHiringView = () => {
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
              <Box
                key={application.id}
                id={`application-${application.id}`}
                sx={{
                  borderRadius: 2
                }}
              >
                <ApplicationCard
                  currentUser={currentUser}
                  jobPosition={application.jobPosition}
                  application={application}
                  onStatusChange={() => fetchHiringApplications()}
                  onHire={() => handleOpenHireModal(application)}
                  showHireAction={true}
                  isHighlighted={String(searchParams.get('applicationId') || '') === String(application.id)}
                />
              </Box>
            ))}
          </Box>
        )}
      </Box>
    );
  };

  // Main component render method.
  return (
    <FeatureGate feature={FEATURES.APPLICATIONS}>
      <Container maxWidth="xl" sx={{ py: 4 }}>
        <Box sx={{ textAlign: 'center', mb: 4 }}>
          <Typography variant="h1" component="h1" gutterBottom>
            Manage Applications
          </Typography>
          <Typography variant="h3" color="text.secondary">
            Review all applications and hire candidates who have accepted job offers.
          </Typography>
        </Box>

        {/* Conditionally render content based on user role */}
        {currentUser && currentUser.role === 'ADMIN' ? (
          <>
            {/* Main Content Paper */}

            <Box elevation={2} sx={{px:{lg:16},  m: { xs: 2, md: 4} }}>
              <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4, flexWrap: 'wrap' }}>
                {renderAllApplicationsTab()}
              </Box>
            </Box>
          </>
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
    </FeatureGate>
  );
}
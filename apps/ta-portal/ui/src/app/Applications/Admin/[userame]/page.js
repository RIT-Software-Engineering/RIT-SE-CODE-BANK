// src/app/Applications/Admin/[username]/page.js
'use client';

import React, { useCallback, useEffect, useRef, useState } from 'react';
import { useSearchParams } from 'next/navigation';
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

export default function AdminApplicationsPage() {
  const { currentUser } = useAuth();
  const { showNotification } = useNotification();
  const filterRef = useRef();
  const searchParams = useSearchParams();

  const [activeTab, setActiveTab] = useState(() => {
    const tabParam = searchParams.get('tab');
    return tabParam === 'hiring' ? 1 : 0;
  });

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

  const [hiringApplications, setHiringApplications] = useState([]);
  const [hiringLoading, setHiringLoading] = useState(false);
  const [hiringError, setHiringError] = useState(null);

  const [isHireModalOpen, setIsHireModalOpen] = useState(false);
  const [selectedApplication, setSelectedApplication] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    if (currentUser?.username) {
      const fetchAndSetConfig = async () => {
        try {
          const semesterCodes = await getSemesterCodesForEmployer(
            currentUser.username
          );
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

  const fetchHiringApplications = useCallback(async () => {
    setHiringLoading(true);
    setHiringError(null);

    try {
      const applications = await getCandidateApplicationsAsAdmin();
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

  useEffect(() => {
    if (currentUser) {
      if (activeTab === 0) {
        updateApplicationsView(searchTerm, searchBy, appliedFilters);
      } else if (activeTab === 1) {
        fetchHiringApplications();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, activeTab]);

  const handleTabChange = (event, newValue) => {
    setSearchTerm('');
    setSearchBy('course');
    const initialFilters = {
      status: [],
      level: [],
      semester: '',
      hasApplications: '',
    };
    setAppliedFilters(initialFilters);

    if (filterRef.current && typeof filterRef.current.clearAll === 'function') {
      filterRef.current.clearAll();
    }
    
    setActiveTab(newValue);
  };

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

  const handleSearchByChange = (event) => {
    const newSearchBy = event.target.value;
    setSearchBy(newSearchBy);
    if (searchTerm !== '') {
      setSearchTerm('');
      updateApplicationsView('', newSearchBy, appliedFilters);
    }
  };

  const handleSearch = (e) => {
    e.preventDefault();
    const latestFilters = filterRef.current.getFilters();
    setAppliedFilters(latestFilters);
    updateApplicationsView(searchTerm, searchBy, latestFilters);
  };

  const handleOpenHireModal = (application) => {
    setSelectedApplication(application);
    setIsHireModalOpen(true);
  };

  const handleCloseHireModal = () => {
    setIsHireModalOpen(false);
    setSelectedApplication(null);
  };

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
      fetchHiringApplications();
    } catch (err) {
      console.error('Error hiring candidate:', err);
      showNotification(err.message || 'Failed to hire candidate.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  const renderApplicationsTab = () => {
    const totalApplications = Object.values(displayData)
      .flat()
      .reduce(
        (acc, position) => acc + position.jobPositionApplicationHistory.length,
        0
      );

    return (
      <Box sx={{ width: '100%' }}>
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

        {!loading && !error && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            <strong>
              {totalApplications}{' '}
              {totalApplications === 1 ? 'application' : 'applications'} found
            </strong>
          </Typography>
        )}

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
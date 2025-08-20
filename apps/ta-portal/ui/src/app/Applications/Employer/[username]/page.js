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

export default function EmployerApplicationsPage() {
  const { currentUser } = useAuth();
  const filterRef = useRef();

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

  useEffect(() => {
    if (currentUser) {
      updateApplicationsView('', 'course', {
        status: [],
        level: [],
        semester: '',
        hasApplications: '',
      });
    }
  }, [currentUser, updateApplicationsView]);

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

  const renderContent = () => {
    if (loading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      );
    }
    if (error) {
      return (
        <Typography color="error" align="center" sx={{ p: 4 }}>
          Error: {error}
        </Typography>
      );
    }

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

  const totalApplications = Object.values(displayData)
    .flat()
    .reduce(
      (acc, position) => acc + position.jobPositionApplicationHistory.length,
      0
    );

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

      {currentUser && currentUser.role === 'EMPLOYER' ? (
        <Box>
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
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography>
            Please make sure you are logged in as an EMPLOYER.
          </Typography>
        </Paper>
      )}
    </Container>
  );
}
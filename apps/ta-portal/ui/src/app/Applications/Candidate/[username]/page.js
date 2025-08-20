// src/app/Applications/Candidate/[username]/page.js
'use client';

import { useCallback, useEffect, useRef, useState } from 'react';
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

  useEffect(() => {
    if (currentUser?.username) {
      const fetchSemesterOptions = async () => {
        try {
          const allApps = await getCandidateApplicationsAsCandidate(
            '',
            { status: [], level: '', semester: '' },
            currentUser.username
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

  useEffect(() => {
    if (currentUser) {
      // We explicitly pass an empty string for the search term to ensure a clean initial load.
      updateApplicationsView('', { status: [], level: [], semester: '' });
    }
  }, [currentUser, updateApplicationsView]);

  const handleStatusChange = () => {
    updateApplicationsView(searchTerm, appliedFilters);
  };

  const handleFilterChange = (filters) => {
    setAppliedFilters(filters);
    updateApplicationsView(searchTerm, filters);
  };
  
  const handleSearchTermChange = (newTerm) => {
    setSearchTerm(newTerm);
    if (newTerm === '') {
      updateApplicationsView('', appliedFilters);
    }
  };
  
  const handleSearch = (e) => {
    e.preventDefault();
    const latestFilters = filterRef.current.getFilters();
    setAppliedFilters(latestFilters);
    updateApplicationsView(searchTerm, latestFilters);
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
    
    const semesterCodes = Object.keys(displayData).sort((a, b) => b.localeCompare(a));

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
                  />
                ))}
              </Box>
            </AccordionDetails>
          </Accordion>
        ))}
      </Box>
    );
  };

  const totalApplications = Object.values(displayData).reduce((acc, apps) => acc + apps.length, 0);

  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h1" component="h1" gutterBottom>
          {pageTitle}
        </Typography>
        <Typography variant="h3" color="text.secondary">
          {pageSubtitle}
        </Typography>
      </Box>

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
    </Container>
  );
}
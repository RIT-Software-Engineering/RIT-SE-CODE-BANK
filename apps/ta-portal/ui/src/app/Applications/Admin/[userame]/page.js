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

import Accordion from '@mui/material/Accordion';
import AccordionDetails from '@mui/material/AccordionDetails';
import AccordionSummary from '@mui/material/AccordionSummary';
import Box from '@mui/material/Box';
import Typography from '@mui/material/Typography';
import KeyboardArrowDownOutlinedIcon from '@mui/icons-material/KeyboardArrowDownOutlined';

export default function AdminApplicationsPage() {
  const { currentUser } = useAuth();
  const { showNotification } = useNotification();
  const filterRef = useRef();
  const searchParams = useSearchParams();

  // Tab management
  const [activeTab, setActiveTab] = useState(() => {
    const tabParam = searchParams.get('tab');
    return tabParam === 'hiring' ? 'hiring' : 'applications';
  });

  // Applications tab state
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

  // Hiring tab state
  const [hiringApplications, setHiringApplications] = useState([]);
  const [hiringLoading, setHiringLoading] = useState(false);
  const [hiringError, setHiringError] = useState(null);

  // Modal state
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

  // Applications tab logic
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
              if (app.candidateGrade && gradeEnumToStringValue[app.candidateGrade]) {
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

  // Hiring tab logic
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
      if (activeTab === 'applications') {
        updateApplicationsView(searchTerm, searchBy, appliedFilters);
      } else if (activeTab === 'hiring') {
        fetchHiringApplications();
      }
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, activeTab]);

  // Tab management
  const handleTabChange = (tabId) => {
    setActiveTab(tabId);
    if (tabId === 'applications') {
      setSearchTerm('');
      updateApplicationsView('', searchBy, appliedFilters);
    } else if (tabId === 'hiring') {
      fetchHiringApplications();
    }
  };

  // Applications tab event handlers
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
    const latestFilters = filterRef.current.getFilters();
    setAppliedFilters(latestFilters);
    updateApplicationsView(searchTerm, searchBy, latestFilters);
  };

  // Hiring modal handlers
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
      fetchHiringApplications(); // Refresh the hiring applications list
    } catch (err) {
      console.error('Error hiring candidate:', err);
      showNotification(err.message || 'Failed to hire candidate.', 'error');
    } finally {
      setIsProcessing(false);
    }
  };

  // Render functions
  const renderApplicationsTab = () => {
    const renderGroupedView = () => {
      const semesterCodes = Object.keys(displayData);
      if (semesterCodes.length === 0) {
        return (
          <div className='text-center py-10 px-4 bg-gray-50 border border-gray-200 rounded-lg mt-4'>
            <p className='text-lg font-semibold text-gray-800'>No Positions Found</p>
            <p className='text-gray-600 mt-2'>Your search or filter criteria did not match any job positions.</p>
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
              {displayData[semesterCode].map((position) => (
                <Accordion key={position.id} defaultExpanded>
                  <AccordionSummary expandIcon={<KeyboardArrowDownOutlinedIcon />}>
                    <Typography variant='h6'>
                      {position.courseCode}-{String(position.sectionNumber).padStart(2, '0')}: {position.course?.name}
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
      if (loading) return <div className='text-center p-8'>Loading applications...</div>;
      if (error) return <div className='text-red-500 text-center p-8'>Error: {error}</div>;
      return renderGroupedView();
    };
    
    const totalApplications = Object.values(displayData).flat().reduce((acc, position) => acc + position.jobPositionApplicationHistory.length, 0);

    return (
      <div className='w-full max-w-5xl flex flex-col items-center justify-center'>
        {filterConfig.length > 0 ? (
          <form onSubmit={handleSearch} className='w-full mb-6 flex items-center gap-x-2 bg-white p-4 rounded-lg shadow'>
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
    );
  };

  const renderHiringTab = () => {
    const renderHiringContent = () => {
      if (hiringLoading) return <div className='text-center p-8'>Loading hiring applications...</div>;
      if (hiringError) return <div className='text-red-500 text-center p-8'>Error: {hiringError}</div>;
      if (hiringApplications.length === 0) {
        return (
          <div className='text-center py-10 px-4 bg-gray-50 border border-gray-200 rounded-lg'>
            <p className='text-lg font-semibold text-gray-800'>No Applications Ready for Hiring</p>
            <p className='text-gray-600 mt-2'>There are currently no candidates who have accepted job offers.</p>
          </div>
        );
      }

      return (
        <div className='space-y-4'>
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
        </div>
      );
    };

    return (
      <div className='w-full max-w-5xl'>
        <div className="mb-4 text-sm text-gray-600">
          <strong>
            {hiringApplications.length} {hiringApplications.length === 1 ? 'candidate' : 'candidates'} ready for hiring
          </strong>
        </div>
        {renderHiringContent()}
      </div>
    );
  };

  const tabs = [
    { id: 'applications', label: 'My Applications' },
    { id: 'hiring', label: 'Ready to Hire' },
  ];

  return (
    <>
      <div className='flex flex-col items-center p-4'>
        <h1 className='text-4xl font-bold'>Applications</h1>
        <p className='text-md text-gray-600 mt-1'>
          Search, filter, and review candidate applications.
        </p>
      </div>

      <div className='flex flex-col items-center bg-gray-100 p-4 mb-10'>
        {currentUser && currentUser.role === 'ADMIN' ? (
          <>
            {/* Tab Navigation */}
            <div className="w-full max-w-5xl mb-6">
              <div className="border-b border-gray-200">
                <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                  {tabs.map((tab) => (
                    <button
                      key={tab.id}
                      onClick={() => handleTabChange(tab.id)}
                      className={`whitespace-nowrap pb-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
                        activeTab === tab.id
                          ? "border-orange-500 text-orange-600"
                          : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300"
                      }`}
                    >
                      {tab.label}
                    </button>
                  ))}
                </nav>
              </div>
            </div>

            {/* Tab Content */}
            {activeTab === 'applications' && renderApplicationsTab()}
            {activeTab === 'hiring' && renderHiringTab()}
          </>
        ) : (
          <div>Please make sure you are logged in as an ADMIN.</div>
        )}
      </div>

      {/* Hire Modal */}
      {isHireModalOpen && selectedApplication && (
        <HireModal
          application={selectedApplication}
          onClose={handleCloseHireModal}
          onConfirm={handleConfirmHire}
          isProcessing={isProcessing}
        />
      )}
    </>
  );
}
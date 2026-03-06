// src/app/Positions/Admin/[username]/page.js

"use client";

import React, {
  useEffect,
  useCallback,
  useState,
  useRef,
  useMemo,
} from "react";
import { useSearchParams, useRouter } from "next/navigation";
import {
  getOpenJobPositions,
  getPositionsByOwner,
  getAllPositions,
  updatePositionStatus,
  getSemesterCodesForOpenPositions,
  createPosition,
  updatePosition,
} from "@/services/db-apis";
import { useAuth } from "@/contexts/AuthContext";
import { useNotification } from "@/contexts/NotificationContext";
import { useFeatureFlags, FEATURES } from "@/configuration/featureFlags";
import PositionsCard from "@/components/positions/PositionsCard";
import { Filter } from "@/components/common/searchAndFilter/Filter";
import SearchBar from "@/components/common/searchAndFilter/SearchBar";
import { generatePositionsFilterConfig } from "./filter.config";
import EditPositionModal from "@/components/positions/EmployerAndAdmin/EditPositionModal";
import EditableNoteForm from "@/components/notes/EditableNoteForm";
import ConfirmationModal from "@/components/common/models/ConfirmationModal";

import {
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  Tab,
  Tabs,
  Typography,
} from "@mui/material";

/**
 * Renders the main positions management page for Administrators.
 * This page provides a comprehensive view with three tabs:
 * 1. "All Positions": A view of all job positions.
 * 2. "Pending Positions": A view of all positions in the system needing approval
 */
export default function AdminPositions() {
  // Core hooks for component references, authentication, and notifications.
  const filterRef = useRef();
  const router = useRouter();
  const { isFeatureEnabled, loading: featureFlagsLoading } = useFeatureFlags();
  const { currentUser } = useAuth();
  const { showNotification } = useNotification();
  const searchParams = useSearchParams();

  const [allPositions, setAllPositions] = useState([]);

  // Configuration for the tabs, linking them to their respective data states.
  const tabs = [
    { id: "all-positions", label: "All Positions", data: allPositions },
    { id: "pending-positions", label: "Pending Positions", data: allPositions.filter(position => position.jobPositionStatus.includes('PENDING')) },
  ];

  // General state for loading, errors, and search/filter functionality.
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({});
  const [filterConfig, setFilterConfig] = useState([]);

  // State for managing modals (edit/create position and note confirmation).
  const [showClearConfirm, setShowClearConfirm] = useState(false)
  const [isEdit, setIsEdit] = useState(false);
  const [isCopy, setIsCopy] = useState(false);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [noteModalState, setNoteModalState] = useState({
    isOpen: false,
    title: '',
    context: {},
  });

  // Initialize the active tab based on URL search parameters for linkability.
  const [activeTab, setActiveTab] = useState(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'pending-positions') return 1;
    return 0; // Default to 'all-positions'.
  });

  /**
   * Creates an initial state object for the filters based on the filter configuration.
   * This ensures that the filter state is always in sync with the available filters.
   * @param {object[]} config - The filter configuration array.
   * @returns {object} An object representing the initial state of all filters.
   */
  const createInitialState = (config) => {
    const initialState = {};
    config.forEach((filter) => {
      initialState[filter.id] = filter.type === "checkbox" ? [] : "";
    });
    return initialState;
  };

  // Effect to fetch semester codes and generate the filter configuration on mount.
  useEffect(() => {
    /**
     * Fetches semester codes to dynamically populate the semester filter dropdown,
     * then generates and sets the filter configuration.
     */
    const fetchAndSetConfig = async () => {
      try {
        const semesterCodes = await getSemesterCodesForOpenPositions();
        const newConfig = generatePositionsFilterConfig(semesterCodes);
        setFilterConfig(newConfig);
        setAppliedFilters(createInitialState(newConfig));
      } catch (err) {
        console.error("Failed to load filter configuration:", err);
        // Set a default empty config on error to prevent crashes.
        setFilterConfig(generatePositionsFilterConfig([]));
      }
    };
    fetchAndSetConfig();
  }, []);

  /**
   * A memoized value that determines which filters are visible based on the active tab.
   * The 'status' filter is hidden on the "Pending Positions" tab since all positions there are 'Pending'.
   * @returns {object[]} The array of filter configurations to be displayed.
   */
  const visibleFilters = useMemo(() => {
    if (activeTab === 1) { // pending-positions tab
      return filterConfig.filter((f) => f.id !== "status");
    }
    return filterConfig;
  }, [activeTab, filterConfig]);

  /**
   * A centralized function to fetch data for any of the three tabs based on the current
   * search and filter criteria.
   * @param {number} tabIndex - The index of the active tab.
   * @param {string} currentSearch - The current search term.
   * @param {object} currentFilters - The currently applied filters.
   */
  const fetchData = useCallback(async (tabIndex, currentSearch, currentFilters) => {
    if (!currentUser) return;
    setIsLoading(true);
    setError(null);
    const tabId = tabs[tabIndex].id;

    try {
      let data;
      data = await getAllPositions(currentSearch, currentFilters);
      setAllPositions(data);

    } catch (err) {
      console.error(`Failed to fetch data for tab ${tabId}:`, err);
      setError(`Failed to load positions. Please try again later.`);
    } finally {
      setIsLoading(false);
    }
    // Disabling exhaustive-deps because `tabs` is a stable, locally defined array.
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  // Effect to trigger the initial data fetch when the component mounts or the active tab changes.
  useEffect(() => {
    if (currentUser && filterConfig.length > 0) {
      const initialFilters = createInitialState(filterConfig);
      fetchData(activeTab, "", initialFilters);
    }
  }, [currentUser, filterConfig, activeTab, fetchData]);

  // Redirect if feature is disabled
  useEffect(() => {
    if (!featureFlagsLoading && !isFeatureEnabled(FEATURES.POSITIONS)) {
      router.push("/");
    }
  }, [featureFlagsLoading, isFeatureEnabled, router]);

  if (featureFlagsLoading || !isFeatureEnabled(FEATURES.POSITIONS)) {
    return (
      <Container sx={{ mt: 4, textAlign: "center" }}>
        <CircularProgress />
      </Container>
    );
  }

  /**
   * Handles the form submission for a search, triggering a data fetch.
   * @param {React.FormEvent<HTMLFormElement>} e - The form submission event.
   */
  const handleSearch = (e) => {
    e.preventDefault();
    const latestFilters = filterRef.current.getFilters();
    setAppliedFilters(latestFilters);
    fetchData(activeTab, searchTerm, latestFilters);
  };

  /**
   * Updates the search term state as the user types.
   * If the search bar is cleared, it refreshes the view.
   * @param {string} newTerm - The new value from the search input.
   */
  const handleSearchTermChange = (newTerm) => {
    setSearchTerm(newTerm);
    if (newTerm === "") {
      const latestFilters = filterRef.current ? filterRef.current.getFilters() : appliedFilters;
      fetchData(activeTab, "", latestFilters);
    }
  };

  /**
   * Handles updates from the Filter component, triggering a data refresh.
   * @param {object} newFilters - The new set of applied filters.
   */
  const handleFilterChange = (newFilters) => {
    setAppliedFilters(newFilters);
    fetchData(activeTab, searchTerm, newFilters);
  };

  /**
   * Handles the user switching between tabs.
   * Resets search and filter states and fetches data for the new tab.
   * @param {React.SyntheticEvent} event - The event source of the callback.
   * @param {number} newTabIndex - The index of the newly selected tab.
   */
  const handleTabChange = (event, newTabIndex) => {
    setIsLoading(true);
    setSearchTerm("");
    const initialFilters = createInitialState(filterConfig);
    setAppliedFilters(initialFilters);
    setActiveTab(newTabIndex);
  };

  /**
   * Opens the EditPositionModal for creating a new position or editing an existing one.
   * @param {object | null} job - The job object to edit, or null to create a new one.
   */
  const handleOpenModal = (job = null) => {
    setSelectedJob(job);
    setIsEdit((job != null));
    setIsModalOpen(true);
  };

  /**
   * Popup for clear confirmation of modal close
   */
  const handleCloseModal = () => {
    setShowClearConfirm(true);
  };
  /**
   * closes modal immediately 
   */
  const closeModalImmediately = () => {
    setIsModalOpen(false);
    setSelectedJob(null);
  };
  /**
 * Closes the EditPositionModal and resets the selected job state.
 */
  const handleClearConfirm = () => {
    setIsModalOpen(false);
    setSelectedJob(null);
    setShowClearConfirm(false);
  };

  /**
   * Closes the note confirmation modal.
   */
  const handleCloseNoteModal = () => {
    setNoteModalState({ isOpen: false, title: '', context: {} });
  };

  const handleCopyPosition = (originalJob) => {
    const employerData = {
          username: currentUser.username,
          fname: currentUser.fname,
          lname: currentUser.lname,
        };
    const copiedData = {
      jobSchedules: originalJob.jobSchedules,
      location: originalJob.location,
      locationType: originalJob.locationType,
      maxTAs: originalJob.maxTAs,
      endDate: originalJob.endDate,
      gradeRequirement: originalJob.gradeRequirement,
      startDate: originalJob.startDate,
      graduateStatusRequirement: originalJob.graduateStatusRequirement,
      course: {...originalJob.course},
      courseCode: originalJob.courseCode,
      courseTakenRequirement: originalJob.courseTakenRequirement,
      jobPositionStatus: 'OPEN',
      username: currentUser.username
    };
    console.log('copy');
    setSelectedJob(copiedData);
    setIsCopy(true);
    setIsModalOpen(true);
  };
  /**
   * Handles saving a job position from the EditPositionModal.
   * It determines whether to perform a CREATE or UPDATE action.
   * For updates, it opens a note modal for confirmation.
   * @param {object} positionData - The data of the position to be saved.
   */
  const handleSaveJob = async (positionData) => {
    if (!currentUser) return;

    // If no job is selected, this is a CREATE action.
    if (!selectedJob || isCopy==true) {
      setIsProcessing(true);
      try {
        const employerData = {
          username: currentUser.username,
          fname: currentUser.fname,
          lname: currentUser.lname,
        };
        // New positions are set to 'OPEN' by default.
        const finalPositionData = { ...positionData, jobPositionStatus: 'OPEN' };
        await createPosition(finalPositionData, employerData);
        showNotification('Position created successfully!', 'success');
        closeModalImmediately();

        // Refresh the data grid after creation.
        setSearchTerm("");
        const initialFilters = createInitialState(filterConfig);
        setAppliedFilters(initialFilters);
        fetchData(activeTab, "", initialFilters);

      } catch (err) {
        console.error("Failed to create job position:", err);
        showNotification(err.message || 'Failed to create position.', 'error');
      } finally {
        setIsProcessing(false);
      }
    } else { // Otherwise, it's an UPDATE action, which requires a note.
      closeModalImmediately();
      setNoteModalState({
        isOpen: true,
        title: 'Confirm Position Update',
        context: {
          action: 'update',
          positionData: positionData,
          jobId: selectedJob.id,
        },
      });
    }
  };

  /**
   * Initiates a status update by opening the note modal for confirmation.
   * @param {string} jobId - The ID of the job to update.
   * @param {string} newStatus - The new status to set (e.g., 'OPEN', 'REJECTED').
   */
  const handleStatusUpdate = async (jobId, newStatus) => {

    setNoteModalState({
      isOpen: true,
      title: `Change Position to ${newStatus}`,
      context: {
        action: 'statusUpdate',
        jobId,
        newStatus
      },
    });
  };


  /**
   * Handles the final confirmation from the note modal.
   * It performs the appropriate API call (status update or position update)
   * with the provided note.
   * @param {string} note - The note entered by the user.
   */
  const handleConfirmNote = async (note) => {
    if (!currentUser) return;
    setIsProcessing(true);

    const { action, ...context } = noteModalState.context;

    try {
      if (action === 'statusUpdate') {
        const noteData = { fname: currentUser.fname, lname: currentUser.lname, comment: note };
        await updatePositionStatus(context.jobId, context.newStatus, noteData);
        showNotification('Position status updated successfully!', 'success');

      } else if (action === 'update') {
        const noteData = { fname: currentUser.fname, lname: currentUser.lname, comment: note };
        await updatePosition(context.jobId, context.positionData, noteData);
        showNotification('Position updated successfully!', 'success');
      }

      // Refresh the data grid after the action is complete.
      setSearchTerm("");
      const initialFilters = createInitialState(filterConfig);
      setAppliedFilters(initialFilters);
      fetchData(activeTab, "", initialFilters);

    } catch (err) {
      console.log(err)
      console.error("Failed to perform action:", err);
      showNotification(err.message || 'An unexpected error occurred.', 'error');
    } finally {
      setIsProcessing(false);
      handleCloseNoteModal();
    }
  };



  // Get the data for the currently active tab.
  const activeTabData = tabs[activeTab];

  /**
   * Renders the main content area, handling loading, error, and no-data states.
   * @param {object[]} positions - The array of positions to render.
   * @returns {React.ReactNode} The JSX for the content area.
   */
  const renderContent = (positions) => {
    // Show a loading spinner while data is being fetched.
    if (isLoading) {
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
          {error}
        </Typography>
      );
    }
    // Show a message if no positions match the current filters.
    if (positions.length === 0) {
      return (
        <Paper sx={{ textAlign: 'center', p: 4, mt: 2 }}>
          <Typography variant="h6">No Positions Found</Typography>
        </Paper>
      );
    }

    // Render the list of position cards.
    return positions.map((position) => (
      <PositionsCard
        key={position.id}
        position={position}
        onEdit={handleOpenModal}
        onApprove={(jobId) => handleStatusUpdate(jobId, 'OPEN')}
        onReject={(jobId) => handleStatusUpdate(jobId, 'REJECTED')}
        onOnHold={(jobId) => handleStatusUpdate(jobId, 'ONHOLD')}
        onInactive={(jobId) => handleStatusUpdate(jobId, 'INACTIVE')}
        onReactivate={(jobId) => handleStatusUpdate(jobId, 'PENDING_APPROVAL')}
        showEditAction={true}
        showApproveRejectActions={activeTab === 1} // Only show approve/reject on "Pending" tab.
        showTracker={true}
        onCopy={handleCopyPosition}
      />
    ));
  };

  // Main component render method.
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      {/* Page Title Section */}
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h1" component="h1" gutterBottom>
          Positions
        </Typography>
        <Typography variant="h3" color="text.secondary">
          Browse, manage, and create job positions.
        </Typography>
      </Box>

      {/* Conditionally render content based on user role. */}
      {currentUser && currentUser.role === 'ADMIN' ? (
        <>
          {/* Tab Navigation */}
          <Box sx={{ borderBottom: 1, borderColor: 'divider', mb: 3 }}>
            <Tabs
              value={activeTab}
              onChange={handleTabChange}
              aria-label="position tabs"
              centered
            >
              {tabs.map((tab) => (
                <Tab key={tab.id} label={tab.label} />
              ))}
            </Tabs>
          </Box>

          {/* Main Content Paper */}
          <Paper elevation={2} sx={{ p: { xs: 2, md: 4 } }}>
            <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4, flexWrap: 'wrap' }}>
              <Box>
                <Typography variant="h2" component="h1" gutterBottom>
                  {activeTabData?.label}
                </Typography>
                <Typography color="text.secondary">
                  {activeTab !== 0 && "Accept positions pending approval"}
                  {activeTab === 0 && "Search and filter all positions."}
                </Typography>
              </Box>
              {/* "Create New Position" button is only visible on the "My Positions" tab. */}

              <Button
                variant="contained"
                color="primary"
                onClick={() => handleOpenModal()}
                disabled={isProcessing}
                sx={{ mt: { xs: 2, md: 0 } }}
              >
                {isProcessing ? <CircularProgress size={24} /> : 'Create New Position'}
              </Button>

            </Box>

            {/* Search and Filter Bar */}
            <Box component="form" onSubmit={handleSearch} sx={{ mb: 4, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
              <SearchBar
                value={searchTerm}
                onChange={handleSearchTermChange}
                placeholder="Search via course code or name:"

                sx={{ flexGrow: 1 }}

              />
              <Filter
                key={activeTab} // Use key to force re-render when tab changes, ensuring correct filters are shown.
                ref={filterRef}
                onFilterChange={handleFilterChange}
                filterConfig={visibleFilters}
              />
              <Button
                type="submit"
                variant="contained"
                color="primary"
                sx={{ height: 40 }}
              >
                Search
              </Button>
            </Box>

            {/* Result Count */}
            {!isLoading && !error && (
              <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
                <strong>{activeTabData?.data?.length || 0}</strong>
                {` ${activeTabData?.data?.length === 1 ? 'result' : 'results'} found`}
              </Typography>
            )}

            {/* Content Area */}
            <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
              {renderContent(activeTabData?.data)}
            </Box>
          </Paper>
        </>
      ) : (
        // Render a fallback message if the user is not an admin or not logged in.
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography>Please make sure you are logged in as an ADMIN to view this page.</Typography>
        </Paper>
      )}

      {/* Modals are rendered conditionally outside the main content flow. */}
      {isModalOpen && (
        <EditPositionModal
          job={selectedJob}
          onClose={handleCloseModal}
          onSave={handleSaveJob}
          isCopyMode={isCopy}
        />
      )}
      {
        showClearConfirm && (
          <ConfirmationModal isOpen={showClearConfirm} onClose={() => setShowClearConfirm(false)} onConfirm={handleClearConfirm} title={isEdit ? "Cancel Edits to Position" : "Cancel Position Creation"}>
            {isEdit ? "Leaving now will permanently discard your edits. This action cannot be undone." : "Are you sure you want to cancel this job application? This action cannot be undone."}
          </ConfirmationModal>
        )
      }


      <EditableNoteForm
        isOpen={noteModalState.isOpen}
        onClose={handleCloseNoteModal}
        onConfirm={handleConfirmNote}
        title={noteModalState.title}
        isProcessing={isProcessing}
      />
    </Container>
  );
}
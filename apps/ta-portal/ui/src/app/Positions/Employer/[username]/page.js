// src/app/Positions/Employer/[username]/page.js

"use client";

import React, {
  useEffect,
  useCallback,
  useState,
  useRef,
  useMemo,
} from "react";
import { useSearchParams } from "next/navigation";
import {
  getOpenJobPositions,
  getPositionsByOwner,
  getSemesterCodesForOpenPositions,
  createPosition,
  updatePosition,
} from "@/services/db-apis";
import { useAuth } from "@/contexts/AuthContext";
import { useNotification } from "@/contexts/NotificationContext";
import FeatureGate from "@/components/common/FeatureGate";
import { FEATURES } from "@/configuration/featureFlags";
import PositionsCard from "@/components/positions/PositionsCard";
import { Filter } from "@/components/common/searchAndFilter/Filter";
import SearchBar from "@/components/common/searchAndFilter/SearchBar";
import { generatePositionsFilterConfig } from "./filter.config";
import EditPositionModal from "@/components/positions/EmployerAndAdmin/EditPositionModal";
import EditableCommentForm from "@/components/comments/EditableCommentForm";

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
 * Renders the main positions management page for Employers.
 * This page provides a view with two tabs:
 * 1. "All Open Positions": A public view of all available job positions.
 * 2. "My Created Positions": Positions created by the currently logged-in employer,
 * with options to create and edit.
 */
export default function EmployerPositionsPage() {
  return (
    <FeatureGate feature={FEATURES.POSITIONS}>
      <EmployerPositionsContent />
    </FeatureGate>
  );
}

function EmployerPositionsContent() {
  // Core hooks for component references, authentication, and notifications.
  const filterRef = useRef();
  const { currentUser } = useAuth();
  const { showNotification } = useNotification();
  const searchParams = useSearchParams();

  // State for each of the two data tabs.
  const [openPositions, setOpenPositions] = useState([]);
  const [myPositions, setMyPositions] = useState([]);

  // General state for loading, errors, and search/filter functionality.
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({});
  const [filterConfig, setFilterConfig] = useState([]);

  // State for managing modals (edit/create position and comment confirmation).
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [commentModalState, setCommentModalState] = useState({
    isOpen: false,
    title: '',
    context: {},
  });

  // Initialize the active tab based on URL search parameters for linkability.
  const [activeTab, setActiveTab] = useState(() => {
    const tabParam = searchParams.get('tab');
    return tabParam === 'my-positions' ? 1 : 0; // Default to 'open-positions'
  });

  /**
   * Creates an initial state object for the filters based on the filter configuration.
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
     * Fetches semester codes to dynamically populate the semester filter dropdown.
     */
    const fetchAndSetConfig = async () => {
      try {
        const semesterCodes = await getSemesterCodesForOpenPositions();
        const newConfig = generatePositionsFilterConfig(semesterCodes);
        setFilterConfig(newConfig);
        const initialState = createInitialState(newConfig);
        setAppliedFilters(initialState);
      } catch (err) {
        console.error("Failed to load filter configuration:", err);
        // Set a default empty config on error to prevent crashes.
        const fallbackConfig = generatePositionsFilterConfig([]);
        setFilterConfig(fallbackConfig);
        setAppliedFilters(createInitialState(fallbackConfig));
      }
    };
    fetchAndSetConfig();
  }, []);

  /**
   * A memoized value that determines which filters are visible based on the active tab.
   * The 'status' filter is hidden on the "All Open Positions" tab.
   * @returns {object[]} The array of filter configurations to be displayed.
   */
  const visibleFilters = useMemo(() => {
    if (activeTab === 0) { // open-positions tab
      return filterConfig.filter((f) => f.id !== "status");
    }
    return filterConfig;
  }, [activeTab, filterConfig]);

  /**
   * A centralized function to fetch data for the tabs based on the current
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
      if (tabId === "open-positions") {
        data = await getOpenJobPositions(currentSearch, currentFilters, null);
        setOpenPositions(data);
      } else if (tabId === "my-positions") {
        data = await getPositionsByOwner(currentUser.username, currentSearch, currentFilters);
        setMyPositions(data);
      }
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
   * @param {object | null} job - The job object to edit, or null for creation.
   */
  const handleOpenModal = (job = null) => {
    setSelectedJob(job);
    setIsModalOpen(true);
  };

  /**
   * Closes the EditPositionModal and resets the selected job state.
   */
  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedJob(null);
  };
  
  /**
   * Closes the comment confirmation modal.
   */
  const handleCloseCommentModal = () => {
    setCommentModalState({ isOpen: false, title: '', context: {} });
  };

  /**
   * Handles saving a job position from the EditPositionModal.
   * Differentiates between CREATE and UPDATE actions.
   * @param {object} positionData - The data of the position to be saved.
   */
  const handleSaveJob = async (positionData) => {
    if (!currentUser) return;
  
    // If no job is selected, this is a CREATE action.
    if (!selectedJob) {
      setIsProcessing(true);
      try {
        const employerData = {
          username: currentUser.username,
          fname: currentUser.fname,
          lname: currentUser.lname,
        };
        // New positions are submitted for admin approval.
        const finalPositionData = { ...positionData, jobPositionStatus: 'PENDING_APPROVAL' };
        await createPosition(finalPositionData, employerData);
        showNotification('Position created and submitted for approval!', 'success');
        handleCloseModal();
        
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
    } else { // Otherwise, it's an UPDATE action, which requires a comment.
      handleCloseModal();
      setCommentModalState({
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
   * Handles the final confirmation from the comment modal for position updates.
   * @param {string} comment - The comment entered by the user.
   */
  const handleConfirmComment = async (comment) => {
    if (!currentUser) return;
    setIsProcessing(true);

    const { action, ...context } = commentModalState.context;

    try {
      if (action === 'update') {
        const commentData = { fname: currentUser.fname, lname: currentUser.lname, comment };
        // Any update sends the position back to 'PENDING_APPROVAL' status.
        const updatedPositionData = { 
          ...context.positionData, 
          jobPositionStatus: 'PENDING_APPROVAL' 
        };
        await updatePosition(context.jobId, updatedPositionData, commentData);
        showNotification('Position updated and submitted for re-approval!', 'success');
      }
      
      // Refresh the data grid after the action is complete.
      setSearchTerm("");
      const initialFilters = createInitialState(filterConfig);
      setAppliedFilters(initialFilters);
      fetchData(activeTab, "", initialFilters);

    } catch (err) {
      console.error("Failed to perform action:", err);
      showNotification(err.message || 'An unexpected error occurred.', 'error');
    } finally {
      setIsProcessing(false);
      handleCloseCommentModal();
    }
  };
    
  // Configuration for the tabs, linking them to their respective data states.
  const tabs = [
    { id: "open-positions", label: "All Open Positions", data: openPositions },
    { id: "my-positions", label: "My Created Positions", data: myPositions },
  ];

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
        showEditAction={activeTab === 1} // Only show edit on "My Positions" tab.
        showApproveRejectActions={false} // Employers cannot approve/reject.
        showTracker={activeTab !== 0} // Show tracker on "My Positions" tab.
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
          Browse and manage job positions.
        </Typography>
      </Box>

      {/* Conditionally render content based on user role. */}
      {currentUser && currentUser.role === 'EMPLOYER' ? (
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
                  {activeTab === 1 && "Manage your created positions. Updates require admin re-approval."}
                  {activeTab === 0 && "Browse all publicly available positions."}
                </Typography>
              </Box>
              {/* "Create New Position" button is only visible on the "My Positions" tab. */}
              {activeTab === 1 && (
                <Button
                  variant="contained"
                  color="primary"
                  onClick={() => handleOpenModal()}
                  disabled={isProcessing}
                  sx={{ mt: { xs: 2, md: 0 } }}
                >
                  {isProcessing ? <CircularProgress size={24} /> : 'Create New Position'}
                </Button>
              )}
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
                key={`${activeTab}-${filterConfig.length}`} // Key ensures filter re-renders if config changes.
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
        // Render a fallback message if the user is not an employer or not logged in.
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography>Please make sure you are logged in as an EMPLOYER to view this page.</Typography>
        </Paper>
      )}

      {/* Modals are rendered conditionally outside the main content flow. */}
      {isModalOpen && (
        <EditPositionModal
          job={selectedJob}
          onClose={handleCloseModal}
          onSave={handleSaveJob}
        />
      )}
      
      <EditableCommentForm
        isOpen={commentModalState.isOpen}
        onClose={handleCloseCommentModal}
        onConfirm={handleConfirmComment}
        title={commentModalState.title}
        isProcessing={isProcessing}
      />
    </Container>
  );
}
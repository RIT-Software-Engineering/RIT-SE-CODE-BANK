// src/app/Positions/Admin/[username]/page.js

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
  getAllPositions,
  updatePositionStatus,
  getSemesterCodesForOpenPositions,
  createPosition,
  updatePosition,
} from "@/services/db-apis";
import { useAuth } from "@/contexts/AuthContext";
import { useNotification } from "@/contexts/NotificationContext";
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

export default function AdminPositions() {
  const filterRef = useRef();
  const { currentUser } = useAuth();
  const { showNotification } = useNotification();

  const searchParams = useSearchParams();

  const [openPositions, setOpenPositions] = useState([]);
  const [myPositions, setMyPositions] = useState([]);
  const [allPositions, setAllPositions] = useState([]);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({});
  const [filterConfig, setFilterConfig] = useState([]);

  const [isModalOpen, setIsModalOpen] = useState(false);
  const [selectedJob, setSelectedJob] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [commentModalState, setCommentModalState] = useState({
    isOpen: false,
    title: '',
    context: {},
  });
  
  const [activeTab, setActiveTab] = useState(() => {
    const tabParam = searchParams.get('tab');
    if (tabParam === 'my-positions') return 1;
    if (tabParam === 'all-positions') return 2;
    return 0; // default to 'open-positions'
  });

  const createInitialState = (config) => {
    const initialState = {};
    config.forEach((filter) => {
      initialState[filter.id] = filter.type === "checkbox" ? [] : "";
    });
    return initialState;
  };

  useEffect(() => {
    const fetchAndSetConfig = async () => {
      try {
        const semesterCodes = await getSemesterCodesForOpenPositions();
        const newConfig = generatePositionsFilterConfig(semesterCodes);
        setFilterConfig(newConfig);
        setAppliedFilters(createInitialState(newConfig));
      } catch (err) {
        console.error("Failed to load filter configuration:", err);
        setFilterConfig(generatePositionsFilterConfig([]));
      }
    };
    fetchAndSetConfig();
  }, []);

  const visibleFilters = useMemo(() => {
    if (activeTab === 0) { // open-positions
      return filterConfig.filter((f) => f.id !== "status");
    }
    return filterConfig;
  }, [activeTab, filterConfig]);

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
      } else if (tabId === "all-positions") {
        data = await getAllPositions(currentSearch, currentFilters);
        setAllPositions(data);
      }
    } catch (err) {
      console.error(`Failed to fetch data for tab ${tabId}:`, err);
      setError(`Failed to load positions. Please try again later.`);
    } finally {
      setIsLoading(false);
    }
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  useEffect(() => {
    if (currentUser && filterConfig.length > 0) {
      const initialFilters = createInitialState(filterConfig);
      fetchData(activeTab, "", initialFilters);
    }
  }, [currentUser, filterConfig, activeTab, fetchData]);

  const handleSearch = (e) => {
    e.preventDefault();
    const latestFilters = filterRef.current.getFilters();
    setAppliedFilters(latestFilters);
    fetchData(activeTab, searchTerm, latestFilters);
  };

  const handleSearchTermChange = (newTerm) => {
    setSearchTerm(newTerm);
    if (newTerm === "") {
      const latestFilters = filterRef.current ? filterRef.current.getFilters() : appliedFilters;
      fetchData(activeTab, "", latestFilters);
    }
  };
  
  const handleFilterChange = (newFilters) => {
    setAppliedFilters(newFilters);
    fetchData(activeTab, searchTerm, newFilters);
  };

  const handleTabChange = (event, newTabIndex) => {
    setIsLoading(true);
    setSearchTerm("");
    const initialFilters = createInitialState(filterConfig);
    setAppliedFilters(initialFilters);
    setActiveTab(newTabIndex);
  };
  
  const handleOpenModal = (job = null) => {
    setSelectedJob(job);
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedJob(null);
  };
  
  const handleCloseCommentModal = () => {
    setCommentModalState({ isOpen: false, title: '', context: {} });
  };

  const handleSaveJob = async (positionData) => {
    if (!currentUser) return;
  
    if (!selectedJob) { // CREATE action
      setIsProcessing(true);
      try {
        const employerData = {
          username: currentUser.username,
          fname: currentUser.fname,
          lname: currentUser.lname,
        };
        const finalPositionData = { ...positionData, jobPositionStatus: 'OPEN' };
        console.log("Final Position Data:", finalPositionData);
        await createPosition(finalPositionData, employerData);
        showNotification('Position created successfully!', 'success');
        handleCloseModal();
        
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
    } else { // UPDATE action
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

  const handleStatusUpdate = async (jobId, newStatus) => {
    setCommentModalState({
      isOpen: true,
      title: newStatus === 'OPEN' ? 'Approve Position' : 'Reject Position',
      context: { 
        action: 'statusUpdate',
        jobId, 
        newStatus 
      },
    });
  };

  const handleConfirmComment = async (comment) => {
    if (!currentUser) return;
    setIsProcessing(true);

    const { action, ...context } = commentModalState.context;

    try {
      if (action === 'statusUpdate') {
        const commentData = { fname: currentUser.fname, lname: currentUser.lname, comment };
        await updatePositionStatus(context.jobId, context.newStatus, commentData);
        showNotification('Position status updated successfully!', 'success');

      } else if (action === 'update') {
        const commentData = { fname: currentUser.fname, lname: currentUser.lname, comment };
        await updatePosition(context.jobId, context.positionData, commentData);
        showNotification('Position updated successfully!', 'success');
      }
      
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
    
  const tabs = [
    { id: "open-positions", label: "All Open Positions", data: openPositions },
    { id: "my-positions", label: "My Created Positions", data: myPositions },
    { id: "all-positions", label: "Manage All Positions", data: allPositions },
  ];

  const activeTabData = tabs[activeTab];

  const renderContent = (positions) => {
    if (isLoading) {
      return (
        <Box sx={{ display: 'flex', justifyContent: 'center', p: 4 }}>
          <CircularProgress />
        </Box>
      );
    }
    if (error) {
      return (
        <Typography color="error" align="center" sx={{ p: 4 }}>
          {error}
        </Typography>
      );
    }
    if (positions.length === 0) {
      return (
        <Paper sx={{ textAlign: 'center', p: 4, mt: 2 }}>
          <Typography variant="h6">No Positions Found</Typography>
        </Paper>
      );
    }

    return positions.map((position) => (
      <PositionsCard 
        key={position.id}
        position={position} 
        onEdit={handleOpenModal}
        onApprove={(jobId) => handleStatusUpdate(jobId, 'OPEN')}
        onReject={(jobId) => handleStatusUpdate(jobId, 'REJECTED')}
        showEditAction={activeTab === 1} // my-positions
        showApproveRejectActions={activeTab === 2} // all-positions
        showTracker={activeTab !== 0} // not open-positions
      />
    ));
  };

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

      <Paper elevation={2} sx={{ p: { xs: 2, md: 4 } }}>
        <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', mb: 4, flexWrap: 'wrap' }}>
          <Box>
            <Typography variant="h2" component="h1" gutterBottom>
              {activeTabData?.label}
            </Typography>
            <Typography color="text.secondary">
              {activeTab !== 0 && "Search and filter all positions you have access to."}
              {activeTab === 0 && "Browse all publicly available positions."}
            </Typography>
          </Box>
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
        
        <Box component="form" onSubmit={handleSearch} sx={{ mb: 4, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
          <SearchBar
            value={searchTerm}
            onChange={handleSearchTermChange}
            placeholder="Search via course code or name:"
            sx={{ flexGrow: 1 }}
          />
          <Filter 
            key={activeTab}
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
        
        {!isLoading && !error && (
          <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
            <strong>{activeTabData?.data?.length || 0}</strong>
            {` ${activeTabData?.data?.length === 1 ? 'result' : 'results'} found`}
          </Typography>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {renderContent(activeTabData?.data)}
        </Box>
      </Paper>

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
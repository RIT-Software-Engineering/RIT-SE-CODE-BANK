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
    if (tabParam === 'my-positions') {
      return 'my-positions';
    }
    if (tabParam === 'all-positions') {
      return 'all-positions';
    }
    return 'open-positions'; // default
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
    if (activeTab === "open-positions") {
      return filterConfig.filter((f) => f.id !== "status");
    }
    return filterConfig;
  }, [activeTab, filterConfig]);

  const fetchData = useCallback(async (tabId, currentSearch, currentFilters) => {
    if (!currentUser) return;
    setIsLoading(true);
    setError(null);

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
  }, [currentUser]);

  useEffect(() => {
    if (currentUser && filterConfig.length > 0) {
      const initialFilters = createInitialState(filterConfig);
      fetchData(activeTab, "", initialFilters);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser, filterConfig]);

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

  const handleTabChange = (tabId) => {
    setIsLoading(true);
    setSearchTerm("");
    const initialFilters = createInitialState(filterConfig);
    setAppliedFilters(initialFilters);
    setActiveTab(tabId);
    fetchData(tabId, "", initialFilters);
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

  const renderContent = (positions) => {
    if (isLoading) return <p className="text-center py-10">Loading...</p>;
    if (error) return <p className="text-center py-10 text-red-500">{error}</p>;
    if (positions.length === 0) return <p className="text-center py-10">No positions found.</p>;

    return positions.map((position) => (
      <PositionsCard 
        key={position.id}
        position={position} 
        onEdit={handleOpenModal}
        onApprove={(jobId) => handleStatusUpdate(jobId, 'OPEN')}
        onReject={(jobId) => handleStatusUpdate(jobId, 'REJECTED')}
        showEditAction={activeTab === 'my-positions'}
        showApproveRejectActions={activeTab === 'all-positions'}
        showTracker={activeTab !== 'open-positions'}
      />
    ));
  };
    
  const tabs = [
    { id: "open-positions", label: "All Open Positions", data: openPositions },
    { id: "my-positions", label: "My Created Positions", data: myPositions },
    { id: "all-positions", label: "Manage All Positions", data: allPositions },
  ];

  const activeTabData = tabs.find((tab) => tab.id === activeTab);

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
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

        <div className="mt-4 bg-white rounded-xl shadow-lg w-full p-6 sm:p-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">{activeTabData?.label}</h2>
              <p className="mt-1 text-md text-gray-600">
                {activeTab !== 'open-positions' && "Search and filter all positions you have access to."}
                {activeTab === 'open-positions' && "Browse all publicly available positions."}
              </p>
            </div>
            {activeTab === 'my-positions' && (
              <button
                className="py-2 px-4 text-sm font-semibold rounded-md bg-orange-600 text-white hover:bg-orange-700 transition-colors disabled:bg-gray-400"
                onClick={() => handleOpenModal()}
                disabled={isProcessing}
              >
                {isProcessing ? 'Processing...' : 'Create New Position'}
              </button>
            )}
          </div>
          
          <form onSubmit={handleSearch} className="mb-4 flex flex-col sm:flex-row items-center gap-2">
            <SearchBar
              value={searchTerm}
              onChange={handleSearchTermChange}
              placeholder="Search via course code or name:"
            />
            <Filter 
              key={activeTab}
              ref={filterRef} 
              onFilterChange={handleFilterChange} 
              filterConfig={visibleFilters} 
            />
            <button
              type="submit"
              className="h-10 px-4 text-sm font-semibold rounded-md bg-orange-600 text-white hover:bg-orange-700 transition-colors"
            >
              Search
            </button>
          </form>
          
          <div className="mb-4 text-sm text-gray-600">
            {!isLoading && !error && (
              <p>
                <strong>{activeTabData?.data?.length || 0}</strong>
                {` ${activeTabData?.data?.length === 1 ? 'result' : 'results'} found`}
              </p>
            )}
          </div>

          <div className="space-y-4">
            {renderContent(activeTabData?.data)}
          </div>
        </div>
      </div>

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
    </div>
  );
}
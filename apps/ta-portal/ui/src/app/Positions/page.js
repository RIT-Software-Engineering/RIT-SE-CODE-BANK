// src/app/Positions/page.js
"use client";
// I'm so sorry for how messy the code has become

import React, {
  useEffect,
  useCallback,
  useState,
  useRef,
  useMemo,
} from "react";
import {
  getJobPositionsByStatus,
  getOpenPositions,
} from "../../services/db-apis";
import { useAuth } from "@/contexts/AuthContext";
import { gradeEnumToStringValue } from "@/constants/gradeConstants";

import PositionsCard from "@/components/positions/PositionsCard";
import { Filter } from "@/components/common/searchAndFilter/Filter";
import SearchBar from "@/components/common/searchAndFilter/SearchBar";
import { positionFilterConfig } from "./filter.config";
import JobPositionsCard from "@/components/positions/EmployerAndAdmin/JobPositionsCard";
import PendingPositions from "@/components/positions/EmployerAndAdmin/PendingPositions";
import EditPositionModal from "@/components/positions/EmployerAndAdmin/EditPositionModal";
import PositionSection from "@/components/positions/EmployerAndAdmin/PositionsSections";

export default function Positions() {
  const filterRef = useRef();
  const { currentUser } = useAuth();

  const [openPositions, setOpenPositions] = useState([]);
  //for employers and admins
  const [pendingPositions, setPendingPositions] = useState([]);
  const [rejectedPositions, setRejectedPositions] = useState([]);
  const [selectedJob, setSelectedJob] = useState(null);
  const [isModalOpen, setIsModalOpen] = useState(false);

  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({
    days: [],
    level: [],
    location: "",
    eligibility: "",
    applied: "",
  });
  const [activeTab, setActiveTab] = useState("open-positions");

  const fetchData = useCallback(
    async (currentSearch, currentFilters) => {
      if (!currentUser) return;

      setIsLoading(true);
      setError(null);
      try {
        const promises = [
          getOpenPositions(currentSearch, currentFilters, currentUser.uid),
        ];

        if (currentUser.role == "EMPLOYER") {
          promises.push(
            getJobPositionsByStatus("PENDING_APPROVAL", currentUser.uid),
            getJobPositionsByStatus("REJECTED",currentUser.uid)
          );
        }

        const results = await Promise.all(promises);

        setOpenPositions(results[0] || []);

        if (currentUser.role == "EMPLOYER") {
          setPendingPositions(results[1] || []);
          setRejectedPositions(results[2] || []);

          console.log("Pending positions", pendingPositions);
        }

        const data = await getOpenPositions(
          currentSearch,
          currentFilters,
          currentUser.uid
        );
        const positions = data.map((position) => {
          if (
            position.gradeRequirement &&
            gradeEnumToStringValue[position.gradeRequirement]
          ) {
            return {
              ...position,
              gradeRequirement:
                gradeEnumToStringValue[position.gradeRequirement],
            };
          }
          return position;
        });
        setOpenPositions(positions);

        if (currentUser.role == "EMPLOYER") {
          console.log("Current User is: ",currentUser.uid)
          const pendingPositions = await getJobPositionsByStatus(
            "PENDING_APPROVAL",
            currentUser.uid
          );
          setPendingPositions(pendingPositions);
          console.log("Pending Positions are ", pendingPositions);
        }
      } catch (err) {
        console.error("Failed to fetch open positions:", err);
        setError("Failed to load positions. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    },
    [currentUser]
  );

  useEffect(() => {
    if (currentUser && activeTab === "open-positions") {
      fetchData(searchTerm, appliedFilters);
    }
  }, [appliedFilters, currentUser, activeTab, fetchData]);

  const handleSearch = (e) => {
    e.preventDefault();
    // Get the most up-to-date filters directly from the Filter component
    const latestFilters = filterRef.current.getFilters();
    // Update the parent's state so the UI is consistent
    setAppliedFilters(latestFilters);
    // Fetch data with the latest filters and search term
    fetchData(searchTerm, latestFilters);
  };

  const handleFilterChange = (newFilters) => {
    setAppliedFilters(newFilters);
  };

  const handleSearchTermChange = (newTerm) => {
    setSearchTerm(newTerm);
    // If search is cleared, fetch immediately with current filters.
    if (newTerm === "") {
      fetchData("", appliedFilters);
    }
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setSelectedJob(null);
  };

  // More copied code to be put into a component
  const handleOpenModal = (job) => {
    setSelectedJob(job);
    setIsModalOpen(true);
  };
  const handleSaveJob = (savedJob) => {
    
    fetchData(searchTerm, appliedFilters);
  };

  const renderOpenPositionsContent = () => {
    if (isLoading) {
      return (
        <div className="text-center py-10">
          <div className="w-8 h-8 border-4 border-dashed rounded-full animate-spin border-gray-500 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading Positions...</p>
        </div>
      );
    }

    if (error) {
      return (
        <div className="text-center py-10 px-4 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-lg font-semibold text-red-700">
            An Error Occurred
          </p>
          <p className="text-gray-600 mt-2">{error}</p>
        </div>
      );
    }

    if (openPositions.length === 0) {
      return (
        <div className="text-center py-10 px-4 bg-gray-50 border border-gray-200 rounded-lg">
          <p className="text-lg font-semibold text-gray-800">
            No Open Positions Found
          </p>
          <p className="text-gray-600 mt-2">
            Try adjusting your search or filters.
          </p>
        </div>
      );
    }

    return openPositions.map((position, index) => (
      <PositionsCard
        key={position.id || index}
        position={position}
        index={index}
      />
    ));
  };
  // --- TABS CONFIGURATION ---
  const tabs = [
    {
      id: "open-positions",
      label: "Open Positions",
      description: "Browse and apply for open positions.",
      content: (
        <div id="positions-container" className="w-full mx-auto">
          <form
            onSubmit={handleSearch}
            className="mb-2 flex flex-col sm:flex-row items-center gap-2"
          >
            <SearchBar
              value={searchTerm}
              onChange={handleSearchTermChange}
              placeholder="Search by course name or code..."
            />
            <Filter
              ref={filterRef}
              onFilterChange={handleFilterChange}
              filterConfig={positionFilterConfig}
            />
            <button
              type="submit"
              className="w-full sm:w-auto h-10 rounded-md bg-rit-orange px-4 text-sm font-semibold text-white shadow-sm hover:bg-orange-700 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-orange-600"
            >
              Search
            </button>
          </form>
          {!isLoading && !error && (
            <div className="mb-4 text-sm text-gray-600">
              <strong>
                {openPositions.length}{" "}
                {openPositions.length === 1 ? "result" : "results"}
              </strong>
            </div>
          )}
          {renderOpenPositionsContent()}
        </div>
      ),
    },
    {
      id: "my-positions",
      label: "My Positions",
      description: "View and manage your positions.",
      content: (
        <>
          <PositionSection title="Pending Positions" positions={pendingPositions} onEdit={handleOpenModal} emptyMessage="No positions are currently pending approval."/>
          <PositionSection title="Rejected Positions" positions={rejectedPositions} onEdit={handleOpenModal} emptyMessage="No positions have been rejected"/>
          <JobPositionsCard profileData={currentUser} />
        </>
      ),
      roles: ["EMPLOYER", "ADMIN"],
    },
    {
      id: "pending-approval",
      label: "Pending Admin Approval",
      description: "Approve positions to be publically posted",
      content: <PendingPositions />,
      roles: ["ADMIN"],
    },
  ];

  const visibleTabs = useMemo(() => {
    if (!currentUser) return [];

    return tabs.filter((tab) => {
      return !tab.roles || tab.roles.includes(currentUser.role);
    });
  });

  const activeTabData = visibleTabs.find((tab) => tab.id === activeTab);

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        {(currentUser?.role === "EMPLOYER" ||
          currentUser?.role === "ADMIN") && (
          <div className="border-b border-gray-200 px-6 sm:px-8">
            <nav className="-mb-px flex space-x-6" aria-label="Tabs">
              {visibleTabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => setActiveTab(tab.id)}
                  className={`whitespace-nowrap pb-2 px-1 border-b-2 font-medium text-sm transition-colors duration-200 ${
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
        )}
        <div className="bg-white rounded-xl shadow-lg w-full">
          <div className="p-6 sm:p-8">
            <div className="text-center mb-8">
              <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-2">
                {activeTabData?.label}
              </h1>
              <p className="mt-2 text-lg text-gray-600 mb-5">
                {activeTabData?.description}
              </p>
            </div>
            <div className="max-w-4xl mx-auto text-left">
              {activeTabData?.content}
            </div>
          </div>
        </div>
      </div>
      {isModalOpen && (
        <EditPositionModal
          job={selectedJob}
          onClose={handleCloseModal}
          onSave={handleSaveJob}
          EmployerUID={currentUser?.uid}
        />
      )}
    </div>
  );
}

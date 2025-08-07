// src/app/Positions/page.js
"use client";

import React, { useEffect, useCallback, useState,useRef, useMemo } from "react";
import { getOpenPositions } from "../../services/db-apis";
import { useAuth } from "@/contexts/AuthContext";
import { gradeEnumToStringValue } from "@/constants/gradeConstants";

import PositionsCard from "@/components/positions/PositionsCard";
import { Filter } from "@/components/common/searchAndFilter/Filter";
import SearchBar from "@/components/common/searchAndFilter/SearchBar";
import { positionFilterConfig } from "./filter.config";
import JobPositionsCard from "@/components/positions/EmployerAndAdmin/JobPositionsCard";

export default function Positions() {
  const filterRef = useRef();
  const { currentUser, refreshUserProfile } = useAuth();

  const [openPositions, setOpenPositions] = useState([]);
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

  const visibleFilters = useMemo(() => {
    if (!currentUser || !currentUser.role) return positionFilterConfig;

    const filtersToHide = ["eligibility", "applied"];
    
    if (currentUser.role === "EMPLOYER" || currentUser.role === "ADMIN") {
      return positionFilterConfig.filter((filter) => !filtersToHide.includes(filter.id));
    }
    return positionFilterConfig;
  }, [currentUser]);

  const fetchData = useCallback(
    async (currentSearch, currentFilters) => {
      if (!currentUser) return;

      setIsLoading(true);
      setError(null);
      try {
        const data = await getOpenPositions(
          currentSearch,
          currentFilters,
          currentUser.username
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

  useEffect(() => {
    if (activeTab === 'my-positions') {
      refreshUserProfile();
    }
  }, [activeTab, refreshUserProfile]);

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
              filterConfig={visibleFilters}
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
      content: <JobPositionsCard profileData={currentUser} />,
    },
  ];

  const activeTabData = tabs.find((tab) => tab.id === activeTab);

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
          {(currentUser?.role === "EMPLOYER" ||
            currentUser?.role === "ADMIN") && (
            <div className="border-b border-gray-200 px-6 sm:px-8">
              <nav className="-mb-px flex space-x-6" aria-label="Tabs">
                {tabs.map((tab) => (
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
    </div>
  );
}

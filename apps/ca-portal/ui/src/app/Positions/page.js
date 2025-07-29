// src/app/Positions/page.js
"use client";

import React, { useEffect, useCallback, useState } from "react";
import { getOpenPositions } from "../../services/db-apis";
import { useAuth } from "@/contexts/AuthContext";
import { gradeEnumToStringValue } from "@/constants/gradeConstants";

import PositionsCard from "@/components/positions/PositionsCard";
import { Filter } from "@/components/common/searchAndFilter/Filter";
import SearchBar from "@/components/common/searchAndFilter/SearchBar";
import { positionFilterConfig } from "./filter.config";
import JobPositionsCard from "@/components/positions/EmployerAndAdmin/JobPositionsCard";

const PositionsContainer = ({
  handleSearch,
  searchTerm,
  handleSearchTermChange,
  handleFilterChange,
  positionFilterConfig,
  renderContent,
} = {}) => {
  return (
    <div id="positions-container" className="w-full mx-auto">
      <form onSubmit={handleSearch} className="mb-8 flex items-center gap-x-2">
        <SearchBar
          value={searchTerm}
          onChange={handleSearchTermChange}
          placeholder="Search by course name or code..."
        />
        <Filter
          onFilterChange={handleFilterChange}
          filterConfig={positionFilterConfig}
        />
        <button
          type="submit"
          className="h-10 rounded-md bg-rit-orange px-4 text-sm font-semibold text-white shadow-sm hover:bg-orange-700 focus-visible:outline focus-visible:outline-offset-2 focus-visible:outline-orange-600"
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
      {renderContent()}
    </div>
  );
};

export default function Positions() {
  const { currentUser } = useAuth();
  const filterRef = useRef();

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

  const fetchData = useCallback(
    async (currentSearch, currentFilters) => {
      if (!currentUser) return;

      setIsLoading(true);
      setError(null);
      try {
        const data = await getOpenPositions(
          currentSearch,
          currentFilters,
          currentUser.uid
        );
        // Convert gradeRequirement from enum to string
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
        setError(err.message);
      } finally {
        setIsLoading(false);
      }
    },
    [currentUser]
  );

  useEffect(() => {
    fetchData(searchTerm, appliedFilters);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedFilters, currentUser, fetchData]);

  const handleSearch = (e) => {
    e.preventDefault();
    // Get the most up-to-date filters directly from the Filter component
    const latestFilters = filterRef.current.getFilters();
    // Update the parent's state so the UI is consistent
    setAppliedFilters(latestFilters);
    // Fetch data with the latest filters and search term
    fetchData(searchTerm, latestFilters);
  };

  const handleFilterChange = (filters) => {
    setAppliedFilters(filters);
  };

  const handleSearchTermChange = (newTerm) => {
    setSearchTerm(newTerm);
    if (newTerm === "") {
      fetchData("", appliedFilters);
    }
  };

  // This function conditionally decides what to show on the screen.
  const renderContent = () => {
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

    // If we have open positions, render them
    return openPositions.map((position, index) => (
      <PositionsCard key={index} position={position} index={index} />
    ));
  };

  const tabs = [
    {
      id: "open-positions",
      label: "Open Positions",
      content: (
        <PositionsContainer
          handleSearch={handleSearch}
          searchTerm={searchTerm}
          handleSearchTermChange={handleSearchTermChange}
          handleFilterChange={handleFilterChange}
          positionFilterConfig={positionFilterConfig}
          renderContent={renderContent}
        />
      ),
      description: "Browse and apply for open positions.",
    },
    {
      id: "my-positions",
      label: "My Positions",
      content: <JobPositionsCard profileData={currentUser} />,
      description: "View and manage your positions.",
    },
  ];

  const [activeTab, setActiveTab] = useState(tabs[0].id);
  const [activeTabTitle, setActiveTabTitle] = useState(tabs[0].label);
  const [activeTabDescription, setActiveTabDescription] = useState(
    tabs[0].description
  );
  console.log("Active Tab:", activeTab);

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        {currentUser?.role === "EMPLOYER" ||
          (currentUser?.role === "ADMIN" && (
            <nav className="-mb-px flex space-x-6" aria-label="Tabs">
              {/* 4. Map over the tabs array to render the buttons */}
              {tabs.map((tab) => (
                <button
                  key={tab.id}
                  onClick={() => {
                    setActiveTab(tab.id);
                    setActiveTabTitle(tab.label);
                    setActiveTabDescription(tab.description);
                  }}
                  className={`whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm transition-colors duration-200
                ${
                  activeTab === tab.id
                    ? "border-orange-500 text-orange-600" // Active tab styles
                    : "border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300" // Inactive tab styles
                }
              `}
                >
                  {tab.label}
                </button>
              ))}
            </nav>
          ))}
        <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 w-full">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight mb-2">
              {activeTabTitle}
            </h1>
            <p className="mt-2 text-lg text-gray-600 mb-5">
              {activeTabDescription}
            </p>
            <div className="w-3/4 m-auto text-left">
              {tabs.find((tab) => tab.id === activeTab).content}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

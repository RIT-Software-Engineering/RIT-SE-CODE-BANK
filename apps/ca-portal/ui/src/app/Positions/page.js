"use client";
import SearchBar from "@/components/SearchBar";
import { searchAndFilterOpenPositions } from "../../services/api";
import React, { useEffect, useCallback } from "react";
import PositionsCard from "@/components/PositionsCard";
import Filter from "@/components/Filter";
import { positionFilterConfig } from "./filter.config";
import { useAuth } from "@/contexts/AuthContext";

export default function Positions() {
  const { currentUser } = useAuth();
  const [openPositions, setOpenPositions] = React.useState([]);
  const [isLoading, setIsLoading] = React.useState(true);
  const [error, setError] = React.useState(null);
  const [searchTerm, setSearchTerm] = React.useState("");
  const [appliedFilters, setAppliedFilters] = React.useState({
    days: [],
    level: "",
    location: "",
    eligibility: "",
    applied: "",
  });

  const fetchData = useCallback(async (currentSearch, currentFilters) => {
    if (!currentUser) return;

    setIsLoading(true);
    setError(null);
    try {
      const data = await searchAndFilterOpenPositions(
        currentSearch,
        currentFilters,
        currentUser.uid
      );
      setOpenPositions(data);
    } catch (err) {
      console.error("Failed to fetch open positions:", err);
      setError(err.message);
    } finally {
      setIsLoading(false);
    }
  }, [currentUser]);

  useEffect(() => {
    fetchData(searchTerm, appliedFilters);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [appliedFilters, currentUser, fetchData]);

  const handleSearch = (e) => {
    e.preventDefault();
    fetchData(searchTerm, appliedFilters);
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
          <p className="text-gray-600 mt-2">
            Could not fetch positions. Please ensure the server is running and
            try again later.
          </p>
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

  return (
    // Styled Page Layout
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="bg-white rounded-xl shadow-lg p-6 sm:p-8 w-full">
          <div className="text-center mb-8">
            <h1 className="text-4xl font-extrabold text-gray-900 tracking-tight">
              Open Positions
            </h1>
            <p className="mt-2 text-lg text-gray-600">
              Find your next opportunity as a Course Assistant.
            </p>
          </div>

          <div id="positions-container" className="w-full max-w-4xl mx-auto">
              <form onSubmit={handleSearch} className="mb-8 flex items-center gap-x-2">
                  <SearchBar value={searchTerm} onChange={handleSearchTermChange} />

                  <Filter
                      onFilterChange={handleFilterChange}
                      filterConfig={positionFilterConfig}
                  />

                  <button
                      type="submit"
                      className="h-10 rounded-md bg-rit-orange px-4 text-sm font-semibold text-white shadow-sm hover:bg-orange-700 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-orange-600"
                  >
                      Search
                  </button>
              </form>

              {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
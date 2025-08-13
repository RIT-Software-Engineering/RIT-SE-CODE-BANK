"use client";

import React, {
  useEffect,
  useCallback,
  useState,
  useRef,
  useMemo,
} from "react";
import {
  getOpenJobPositions,
  getSemesterCodesForOpenPositions,
} from "@/services/db-apis";
import { useAuth } from "@/contexts/AuthContext";
import { gradeEnumToStringValue } from "@/constants/gradeConstants";

import PositionsCard from "@/components/positions/PositionsCard";
import { Filter } from "@/components/common/searchAndFilter/Filter";
import SearchBar from "@/components/common/searchAndFilter/SearchBar";
import { generatePositionsFilterConfig } from "./filter.config";

export default function CandidatePositionsPage() {
  const filterRef = useRef();
  const { currentUser } = useAuth();

  const [openPositions, setOpenPositions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [searchTerm, setSearchTerm] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({});
  const [filterConfig, setFilterConfig] = useState([]);

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
        const initialState = createInitialState(newConfig);
        setAppliedFilters(initialState);
      } catch (err) {
        console.error("Failed to load filter configuration:", err);
        const fallbackConfig = generatePositionsFilterConfig([]);
        setFilterConfig(fallbackConfig);
        setAppliedFilters(createInitialState(fallbackConfig));
      }
    };
    fetchAndSetConfig();
  }, []);

  // Filter out status filter since candidates only see open positions
  const visibleFilters = useMemo(() => {
    return filterConfig.filter((f) => f.id !== "status");
  }, [filterConfig]);

  const fetchData = useCallback(
    async (currentSearch, currentFilters) => {
      if (!currentUser || currentUser.role !== "CANDIDATE") return;

      setIsLoading(true);
      setError(null);
      try {
        // Use getOpenJobPositions like the admin page, but pass currentUser.username for candidate-specific filtering
        const data = await getOpenJobPositions(currentSearch, currentFilters, currentUser.username);

        const processedPositions = (data || []).map((position) => {
          if (position.gradeRequirement && gradeEnumToStringValue[position.gradeRequirement]) {
            return {
              ...position,
              gradeRequirement: gradeEnumToStringValue[position.gradeRequirement],
            };
          }
          return position;
        });

        setOpenPositions(processedPositions);
      } catch (err) {
        console.error("Failed to fetch positions:", err);
        setError("Failed to load positions. Please try again later.");
      } finally {
        setIsLoading(false);
      }
    },
    [currentUser]
  );

  useEffect(() => {
    if (currentUser && filterConfig.length > 0) {
      const initialFilters = createInitialState(filterConfig);
      fetchData("", initialFilters);
    }
  }, [currentUser, filterConfig, fetchData]);

  const handleSearch = (e) => {
    e.preventDefault();
    const latestFilters = filterRef.current.getFilters();
    setAppliedFilters(latestFilters);
    fetchData(searchTerm, latestFilters);
  };

  const handleSearchTermChange = (newTerm) => {
    setSearchTerm(newTerm);
    if (newTerm === "") {
      const latestFilters = filterRef.current ? filterRef.current.getFilters() : appliedFilters;
      fetchData("", latestFilters);
    }
  };

  const handleFilterChange = (newFilters) => {
    setAppliedFilters(newFilters);
    fetchData(searchTerm, newFilters);
  };

  const renderContent = () => {
    if (isLoading) {
      return <p className="text-center py-10">Loading...</p>;
    }

    if (error) {
      return <p className="text-center py-10 text-red-500">{error}</p>;
    }

    if (openPositions.length === 0) {
      return <p className="text-center py-10">No positions found.</p>;
    }

    return openPositions.map((position, index) => (
      <PositionsCard 
        key={position.id || index} 
        position={position} 
        index={index}
        showEditAction={false}
        showApproveRejectActions={false}
        showTracker={false}
      />
    ));
  };

  return (
    <div className="bg-gray-50 min-h-screen">
      <div className="container mx-auto p-4 sm:p-6 lg:p-8">
        <div className="mt-4 bg-white rounded-xl shadow-lg w-full p-6 sm:p-8">
          <div className="flex justify-between items-center mb-6">
            <div>
              <h2 className="text-2xl font-bold text-gray-900">All Open Positions</h2>
              <p className="mt-1 text-md text-gray-600">
                Browse all publicly available positions.
              </p>
            </div>
          </div>
          
          <form onSubmit={handleSearch} className="mb-4 flex flex-col sm:flex-row items-center gap-2">
            <SearchBar
              value={searchTerm}
              onChange={handleSearchTermChange}
              placeholder="Search via course code or name:"
            />
            <Filter 
              key={`filter-${filterConfig.length}`} // Force re-render when config changes
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
                <strong>{openPositions.length}</strong>
                {` ${openPositions.length === 1 ? 'result' : 'results'} found`}
              </p>
            )}
          </div>

          <div className="space-y-4">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
}
// src/app/Positions/Candidate/[username]/page.js
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

import {
  Box,
  Button,
  CircularProgress,
  Container,
  Paper,
  Typography,
} from "@mui/material";

/**
 * Renders the "Open Positions" page for Candidates.
 * This page allows candidates to browse, search, and filter all available job positions
 * that they are eligible to apply for.
 */
export default function CandidatePositionsPage() {
  // Core hooks for component references and authentication context.
  const filterRef = useRef();
  const { currentUser } = useAuth();

  // State for managing position data, loading, and errors.
  const [openPositions, setOpenPositions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);

  // State for search and filter functionality.
  const [searchTerm, setSearchTerm] = useState("");
  const [appliedFilters, setAppliedFilters] = useState({});
  const [filterConfig, setFilterConfig] = useState([]);

  /**
   * Creates an initial state object for the filters based on the filter configuration.
   * This ensures the filter state is correctly initialized.
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
     * Fetches semester codes for all open positions to dynamically populate the filter options.
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
        // On failure, set a default empty config to prevent crashes.
        const fallbackConfig = generatePositionsFilterConfig([]);
        setFilterConfig(fallbackConfig);
        setAppliedFilters(createInitialState(fallbackConfig));
      }
    };
    fetchAndSetConfig();
  }, []);

  /**
   * A memoized value that determines which filters are visible.
   * The 'status' filter is hidden as this page only shows 'Open' positions.
   * @returns {object[]} The array of filter configurations to be displayed.
   */
  const visibleFilters = useMemo(() => {
    return filterConfig.filter((f) => f.id !== "status");
  }, [filterConfig]);

  /**
   * A centralized function to fetch and process open job positions based on
   * the current search and filter criteria.
   * @param {string} currentSearch - The current search term.
   * @param {object} currentFilters - The currently applied filters.
   */
  const fetchData = useCallback(
    async (currentSearch, currentFilters) => {
      // Ensure the user is a logged-in candidate before fetching data.
      if (!currentUser || currentUser.role !== "CANDIDATE") return;

      setIsLoading(true);
      setError(null);
      try {
        const data = await getOpenJobPositions(currentSearch, currentFilters, currentUser.username);

        // Process positions to convert grade requirement enums to human-readable strings.
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

  // Effect to trigger the initial data fetch when the component mounts or the user changes.
  useEffect(() => {
    if (currentUser && filterConfig.length > 0) {
      const initialFilters = createInitialState(filterConfig);
      fetchData("", initialFilters);
    }
  }, [currentUser, filterConfig, fetchData]);

  /**
   * Handles the form submission for a search, triggering a data fetch.
   * @param {React.FormEvent<HTMLFormElement>} e - The form submission event.
   */
  const handleSearch = (e) => {
    e.preventDefault();
    const latestFilters = filterRef.current.getFilters();
    setAppliedFilters(latestFilters);
    fetchData(searchTerm, latestFilters);
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
      fetchData("", latestFilters);
    }
  };

  /**
   * Handles updates from the Filter component, triggering a data refresh.
   * @param {object} newFilters - The new set of applied filters.
   */
  const handleFilterChange = (newFilters) => {
    setAppliedFilters(newFilters);
    fetchData(searchTerm, newFilters);
  };

  /**
   * Renders the main content of the page, handling loading, error, and no-data states.
   * @returns {React.ReactNode} The JSX for the content area.
   */
  const renderContent = () => {
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
    if (openPositions.length === 0) {
      return (
        <Paper sx={{ textAlign: 'center', p: 4, mt: 2 }}>
          <Typography variant="h6">No Positions Found</Typography>
        </Paper>
      );
    }

    // Render the list of position cards.
    return openPositions.map((position, index) => (
      <PositionsCard
        key={position.id || index}
        position={position}
        index={index}
        // Actions like edit, approve, and tracker are not applicable in the candidate view.
        showEditAction={false}
        showApproveRejectActions={false}
        showTracker={false}
      />
    ));
  };

  // Main component render method.
  return (
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h1" component="h1" gutterBottom>
          Open Positions
        </Typography>
        <Typography variant="h3" color="text.secondary">
          Browse and apply for all available TA positions.
        </Typography>
      </Box>

      {/* Conditionally render content based on user role. */}
      {currentUser && currentUser.role === 'CANDIDATE' ? (
        <Paper elevation={2} sx={{ p: { xs: 2, md: 4 } }}>
          {/* Search and Filter Bar */}
          <Box component="form" onSubmit={handleSearch} sx={{ mb: 4, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
            <SearchBar
              value={searchTerm}
              onChange={handleSearchTermChange}
              placeholder="Search via course code or name:"
              sx={{ flexGrow: 1 }}
            />
            <Filter
              key={`filter-${filterConfig.length}`} // Key ensures filter re-renders if config changes.
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
              <strong>{openPositions.length}</strong>
              {` ${openPositions.length === 1 ? 'result' : 'results'} found`}
            </Typography>
          )}

          {/* Main Content Area */}
          <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
            {renderContent()}
          </Box>
        </Paper>
      ) : (
        // Render a fallback message if the user is not a candidate or not logged in.
        <Paper sx={{ p: 4, textAlign: 'center' }}>
          <Typography>Please make sure you are logged in as a CANDIDATE to view this page.</Typography>
        </Paper>
      )}
    </Container>
  );
}
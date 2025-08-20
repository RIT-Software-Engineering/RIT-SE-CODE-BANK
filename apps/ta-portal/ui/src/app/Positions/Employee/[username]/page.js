// src/app/Positions/Employee/[username]/page.js
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

export default function EmployeePositionsPage() {
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

  // Filter out status filter since employees only see open positions
  const visibleFilters = useMemo(() => {
    return filterConfig.filter((f) => f.id !== "status");
  }, [filterConfig]);

  const fetchData = useCallback(
    async (currentSearch, currentFilters) => {
      if (!currentUser || currentUser.role !== "EMPLOYEE") return;

      setIsLoading(true);
      setError(null);
      try {
        // Use getOpenJobPositions like the admin page, but pass currentUser.username for employee-specific filtering
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

    if (openPositions.length === 0) {
      return (
        <Paper sx={{ textAlign: 'center', p: 4, mt: 2 }}>
          <Typography variant="h6">No Positions Found</Typography>
        </Paper>
      );
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
    <Container maxWidth="lg" sx={{ py: 4 }}>
      <Box sx={{ textAlign: 'center', mb: 4 }}>
        <Typography variant="h1" component="h1" gutterBottom>
          Open Positions
        </Typography>
        <Typography variant="h3" color="text.secondary">
          Browse all publicly available positions.
        </Typography>
      </Box>

      <Paper elevation={2} sx={{ p: { xs: 2, md: 4 } }}>
        <Box component="form" onSubmit={handleSearch} sx={{ mb: 4, display: 'flex', flexDirection: { xs: 'column', sm: 'row' }, gap: 2 }}>
          <SearchBar
            value={searchTerm}
            onChange={handleSearchTermChange}
            placeholder="Search via course code or name:"
            sx={{ flexGrow: 1 }}
          />
          <Filter 
            key={`filter-${filterConfig.length}`}
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
            <strong>{openPositions.length}</strong>
            {` ${openPositions.length === 1 ? 'result' : 'results'} found`}
          </Typography>
        )}

        <Box sx={{ display: 'flex', flexDirection: 'column', gap: 2 }}>
          {renderContent()}
        </Box>
      </Paper>
    </Container>
  );
}
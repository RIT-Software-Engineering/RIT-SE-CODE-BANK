// src/components/common/searchAndFilter/Filter.js
"use client";
import React, { useState, useEffect, useImperativeHandle, forwardRef } from "react";
import {
  Button,
  Popover,
  Box,
  Typography,
  Checkbox,
  FormControlLabel,
  FormGroup,
  Select,
  MenuItem,
  FormControl,
  InputLabel,
  RadioGroup,
  Radio,
  Divider,
  Link as MuiLink,
} from '@mui/material';
import { FilterList as FilterIcon } from '@mui/icons-material';

// Helper function to create the initial state from the configuration
const createInitialState = (config) => {
  const initialState = {};
  config.forEach((filter) => {
    initialState[filter.id] = filter.type === "checkbox" ? [] : "";
  });
  return initialState;
};


/**
 * Filter component provides a dynamic popover-based UI for selecting filters.
 * Supports checkbox, select, and radio types, and integrates with parent components via callbacks.
 * Can be controlled via a ref to get current filter values or reset filters programmatically.
 *
 * @component
 * @param {Object} props - Component props
 * @param {Function} props.onFilterChange - Callback invoked with current filter values when applied
 * @param {Array<Object>} props.filterConfig - Configuration for filters. Each object should have:
 *   @param {string} filterConfig[].id - Unique ID for the filter
 *   @param {string} filterConfig[].label - Label displayed for the filter
 *   @param {'checkbox'|'select'|'radio'} filterConfig[].type - Type of filter control
 *   @param {Array<string>} filterConfig[].options - Options for the filter
 *   @param {string} [filterConfig[].placeholder] - Optional placeholder for select filters
 *   @param {Function} [filterConfig[].optionLabel] - Optional function to render select option labels
 *
 */ 
export const Filter = forwardRef(function FilterComponent({ onFilterChange, filterConfig }, ref) {
  const [anchorEl, setAnchorEl] = useState(null);
  const [selectedFilters, setSelectedFilters] = useState(
    createInitialState(filterConfig)
  );

  // Reset filters when the configuration changes (e.g., when switching tabs)
  useEffect(() => {
    const newInitialState = createInitialState(filterConfig);
    setSelectedFilters(newInitialState);
  }, [filterConfig]);
  
  useImperativeHandle(ref, () => ({
    getFilters: () => selectedFilters,
    clearAll: () => { // Expose a method to clear filters from the parent
      const clearedState = createInitialState(filterConfig);
      setSelectedFilters(clearedState);
    }
  }));

  const handleClick = (event) => {
    setAnchorEl(event.currentTarget);
  };

  const handleClose = () => {
    setAnchorEl(null);
  };

  const open = Boolean(anchorEl);
  const id = open ? 'filter-popover' : undefined;

  const handleFilterChange = (filterId, value, type) => {
    setSelectedFilters((prev) => {
      if (type === "checkbox") {
        const newValues = prev[filterId].includes(value)
          ? prev[filterId].filter((v) => v !== value)
          : [...prev[filterId], value];
        return { ...prev, [filterId]: newValues };
      }
      return { ...prev, [filterId]: value };
    });
  };

  const handleApplyFilters = () => {
    onFilterChange(selectedFilters);
    handleClose();
  };

  const handleClearFilters = () => {
    const clearedState = createInitialState(filterConfig);
    setSelectedFilters(clearedState);
    onFilterChange(clearedState);
    handleClose();
  };

  return (
    <div>
      <Button
        aria-describedby={id}
        variant="outlined"
        onClick={handleClick}
        startIcon={<FilterIcon />}
        sx={{ height: 40 }}
      >
        Filter
      </Button>

      <Popover
        id={id}
        open={open}
        anchorEl={anchorEl}
        onClose={handleClose}
        anchorOrigin={{
          vertical: 'bottom',
          horizontal: 'right',
        }}
        transformOrigin={{
          vertical: 'top',
          horizontal: 'right',
        }}
      >
        <Box sx={{ p: 2, width: 260, maxHeight: 450, overflowY: 'auto' }}>
          {filterConfig.map((filter) => (
            <Box key={filter.id} sx={{ mb: 2 }}>
              <Typography variant="subtitle2" sx={{ fontWeight: 'bold', mb: 1 }}>
                {filter.label}
              </Typography>

              {filter.type === "checkbox" && (
                <FormGroup>
                  {filter.options.map((option) => (
                    <FormControlLabel
                      key={option}
                      control={
                        <Checkbox
                          size="small"
                          checked={(selectedFilters[filter.id] || []).includes(option)}
                          onChange={() => handleFilterChange(filter.id, option, "checkbox")}
                        />
                      }
                      label={<Typography variant="body2">{option}</Typography>}
                    />
                  ))}
                </FormGroup>
              )}

              {filter.type === "select" && (
                <FormControl fullWidth size="small">
                  <InputLabel>{filter.label}</InputLabel>
                  <Select
                    value={selectedFilters[filter.id] || ''}
                    label={filter.label}
                    onChange={(e) => handleFilterChange(filter.id, e.target.value, "select")}
                  >
                    <MenuItem value="">
                      <em>{filter.placeholder || `Any ${filter.label}`}</em>
                    </MenuItem>
                    {filter.options.map((option) => (
                      <MenuItem key={option} value={option}>
                        {filter.optionLabel ? filter.optionLabel(option) : option}
                      </MenuItem>
                    ))}
                  </Select>
                </FormControl>
              )}

              {filter.type === "radio" && (
                <FormControl>
                  <RadioGroup
                    name={filter.id}
                    value={selectedFilters[filter.id] || ''}
                    onChange={(e) => handleFilterChange(filter.id, e.target.value, "radio")}
                  >
                    {filter.options.map((option) => (
                      <FormControlLabel key={option} value={option} control={<Radio size="small" />} label={<Typography variant="body2">{option}</Typography>} />
                    ))}
                  </RadioGroup>
                </FormControl>
              )}
            </Box>
          ))}

          <Divider sx={{ my: 2 }} />

          <Box sx={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <MuiLink
              component="button"
              variant="body2"
              onClick={handleClearFilters}
            >
              Clear All
            </MuiLink>
            <Button
              onClick={handleApplyFilters}
              variant="contained"
              color="primary"
              size="small"
            >
              Apply Filters
            </Button>
          </Box>
        </Box>
      </Popover>
    </div>
  );
});
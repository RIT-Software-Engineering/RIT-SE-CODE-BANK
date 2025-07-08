"use client";
import React, { useState, useEffect, useRef } from "react";

// A simple filter icon for the button
const FilterIcon = () => (
  <svg
    xmlns="http://www.w3.org/2000/svg"
    className="h-5 w-5 mr-2"
    viewBox="0 0 20 20"
    fill="currentColor"
  >
    <path
      fillRule="evenodd"
      d="M3 3a1 1 0 011-1h12a1 1 0 011 1v3a1 1 0 01-.293.707L12 11.414V15a1 1 0 01-.293.707l-2 2A1 1 0 018 17v-5.586L3.293 6.707A1 1 0 013 6V3z"
      clipRule="evenodd"
    />
  </svg>
);

// Helper function to create the initial state from the configuration
const createInitialState = (config) => {
  const initialState = {};
  config.forEach((filter) => {
    initialState[filter.id] = filter.type === "checkbox" ? [] : "";
  });
  return initialState;
};

export default function Filter({ onFilterChange, filterConfig }) {
  const [isOpen, setIsOpen] = useState(false);
  const [selectedFilters, setSelectedFilters] = useState(
    createInitialState(filterConfig)
  );

  const wrapperRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    function handleClickOutside(event) {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    }
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [wrapperRef]);

  // Generic handler for all filter types
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
    setIsOpen(false);
  };

  const handleClearFilters = () => {
    const clearedState = createInitialState(filterConfig);
    setSelectedFilters(clearedState);
    onFilterChange(clearedState);
    setIsOpen(false);
  };

  return (
    <div className="relative inline-block text-left" ref={wrapperRef}>
      <div>
        <button
          type="button"
          onClick={() => setIsOpen(!isOpen)}
          className="inline-flex justify-center w-full rounded-md border border-gray-300 shadow-sm px-4 py-2 bg-white text-sm font-medium text-gray-700 hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-rit-light-gray"
        >
          <FilterIcon />
          Filter
        </button>
      </div>

      {isOpen && (
        <div className="origin-top-left absolute left-0 mt-2 w-72 rounded-md shadow-lg bg-white ring-1 ring-black ring-opacity-5 z-10">
          <div className="p-4 max-h-96 overflow-y-auto">
            {/* Dynamically render filters based on the config prop */}
            {filterConfig.map((filter) => (
              <div key={filter.id} className="mb-4">
                <h3 className="text-sm font-semibold text-gray-900 mb-2">
                  {filter.label}
                </h3>

                {filter.type === "checkbox" && (
                  <div className="grid grid-cols-2 gap-2">
                    {filter.options.map((option) => (
                      <label
                        key={option}
                        className="flex items-center space-x-2 text-sm"
                      >
                        <input
                          type="checkbox"
                          className="h-4 w-4 text-indigo-600 border-gray-300 rounded focus:ring-indigo-500"
                          checked={selectedFilters[filter.id].includes(option)}
                          onChange={() =>
                            handleFilterChange(filter.id, option, "checkbox")
                          }
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                )}

                {filter.type === "select" && (
                  <select
                    value={selectedFilters[filter.id]}
                    onChange={(e) =>
                      handleFilterChange(filter.id, e.target.value, "select")
                    }
                    className="mt-1 block w-full pl-3 pr-10 py-2 text-base border-gray-300 focus:outline-none focus:ring-indigo-500 focus:border-indigo-500 sm:text-sm rounded-md"
                  >
                    <option value="">
                      {filter.placeholder || `Any ${filter.label}`}
                    </option>
                    {filter.options.map((option) => (
                      <option key={option} value={option}>
                        {filter.optionLabel
                          ? filter.optionLabel(option)
                          : option}
                      </option>
                    ))}
                  </select>
                )}

                {filter.type === "radio" && (
                  <div className="flex flex-col space-y-2">
                    {filter.options.map((option) => (
                      <label
                        key={option}
                        className="flex items-center space-x-2 text-sm"
                      >
                        <input
                          type="radio"
                          name={filter.id}
                          value={option}
                          checked={selectedFilters[filter.id] === option}
                          onChange={(e) =>
                            handleFilterChange(
                              filter.id,
                              e.target.value,
                              "radio"
                            )
                          }
                          className="h-4 w-4 text-indigo-600 border-gray-300 focus:ring-indigo-500"
                        />
                        <span>{option}</span>
                      </label>
                    ))}
                  </div>
                )}
              </div>
            ))}

            {/* Action Buttons */}
            <div className="pt-4 border-t border-gray-200 flex items-center justify-between">
              <button
                onClick={handleClearFilters}
                className="text-sm font-medium text-gray-600 hover:text-gray-900"
              >
                Clear All
              </button>
              <button
                onClick={handleApplyFilters}
                className="inline-flex justify-center rounded-md border border-transparent shadow-sm px-4 py-2 bg-rit-orange text-base font-medium text-white hover:bg-orange-700 hover:cursor-pointer focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-orange-500 sm:text-sm"
              >
                Apply Filters
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
